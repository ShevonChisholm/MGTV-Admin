import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

// Exercise component effects and event handlers without a provider, browser login or upload.
const tick = () => new Promise((resolve) => setImmediate(resolve));
const nodes = (root) =>
  !root || typeof root !== "object"
    ? []
    : Array.isArray(root)
      ? root.flatMap(nodes)
      : [root, ...nodes(root.props?.children)];
const text = (root) =>
  root == null || typeof root === "boolean"
    ? ""
    : typeof root !== "object"
      ? String(root)
      : Array.isArray(root)
        ? root.map(text).join("")
        : text(root.props?.children);
const button = (tree, label) =>
  nodes(tree).find((n) => n.type === "button" && text(n).includes(label));
const file = (versionId, extra = {}) => ({
  id: `asset-${versionId}`,
  versionId,
  filename: `${versionId}.png`,
  kind: "image",
  state: "ready",
  byteSize: 1024,
  durationSeconds: null,
  width: 640,
  height: 360,
  ...extra,
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
async function mount(filename, api = async () => ({ items: [] })) {
  const slots = [],
    effects = [];
  let cursor = 0;
  const element = (type, props, ...children) => ({
    type,
    props: { ...props, ...(children.length ? { children } : {}) },
  });
  const hooks = {
    createElement: element,
    useState(initial) {
      const i = cursor++;
      if (!(i in slots))
        slots[i] = typeof initial === "function" ? initial() : initial;
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === "function" ? value(slots[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return (slots[i] ??= { current: initial });
    },
    useEffect(fn, deps) {
      const i = cursor++;
      const prior = slots[i];
      if (!prior || !deps || deps.some((d, j) => d !== prior.deps[j])) {
        effects.push(() => {
          prior?.cleanup?.();
          slots[i] = { deps, cleanup: fn() };
        });
      }
    },
  };
  const context = vm.createContext({
    URLSearchParams,
    window: { addEventListener() {}, removeEventListener() {} },
    console,
  });
  const source = ts.transpileModule(await fs.readFile(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const module = new vm.SourceTextModule(source, { context });
  await module.link((specifier) => {
    let exports;
    if (specifier === "react") exports = { default: hooks, ...hooks };
    else if (specifier === "react/jsx-runtime")
      exports = { jsx: element, jsxs: element, Fragment: "fragment" };
    else if (specifier.includes("api/client"))
      exports = {
        api,
        upload: async () => {
          throw Error("Unexpected upload");
        },
      };
    else if (specifier.includes("router")) exports = { useDirtyGuard() {} };
    else if (specifier.includes("CaptionManager"))
      exports = { ReviewVideo: "ReviewVideo" };
    else if (specifier.includes("MediaLibraryView"))
      exports = { MediaLibraryGrid: "LibraryGrid" };
    else if (specifier.includes("/ui")) exports = { Modal: "Modal" };
    else if (specifier.endsWith(".css")) exports = {};
    else
      exports = {
        default: specifier.includes("MediaAttachmentPreview")
          ? "AttachmentPreview"
          : "Icon",
      };
    return new vm.SyntheticModule(
      Object.keys(exports),
      function () {
        for (const [key, value] of Object.entries(exports))
          this.setExport(key, value);
      },
      { context },
    );
  });
  await module.evaluate();
  return {
    render(props) {
      cursor = 0;
      const tree = module.namespace.default(props);
      while (effects.length) effects.shift()();
      return tree;
    },
    dispose() {
      for (const value of slots) value?.cleanup?.();
    },
  };
}
const component = "src/admin/components/MediaAttachment.tsx",
  preview = "src/admin/components/MediaAttachmentPreview.tsx";
const props = {
  label: "Cover",
  kind: "image",
  value: "A",
  canRead: true,
  onChange() {},
};

test("no media.read means no metadata requests or private preview", async () => {
  let calls = 0;
  const h = await mount(component, async () => {
    calls++;
    return { items: [file("A")] };
  });
  const tree = h.render({ ...props, canRead: false });
  await tick();
  assert.equal(calls, 0);
  assert.equal(
    nodes(tree).filter((n) => n.type === "AttachmentPreview").length,
    0,
  );
  assert.equal(button(tree, "Choose existing file").props.disabled, true);
  h.dispose();
});
test("a stale metadata response cannot replace a newer selected version", async () => {
  const a = deferred(),
    b = deferred();
  const h = await mount(component, (path) =>
    path.includes("versionId=A") ? a.promise : b.promise,
  );
  h.render(props);
  h.render({ ...props, value: "B" });
  b.resolve({ items: [file("B")] });
  await tick();
  let tree = h.render({ ...props, value: "B" });
  assert.equal(
    nodes(tree).find((n) => n.type === "AttachmentPreview").props.item
      .versionId,
    "B",
  );
  a.resolve({ items: [file("A")] });
  await tick();
  tree = h.render({ ...props, value: "B" });
  assert.equal(
    nodes(tree).find((n) => n.type === "AttachmentPreview").props.item
      .versionId,
    "B",
  );
  h.dispose();
});
test("metadata failure is visible, retryable, and does not change the selection", async () => {
  let calls = 0,
    changes = 0;
  const h = await mount(component, async () => {
    if (++calls === 1) throw Error("offline");
    return { items: [file("A")] };
  });
  const p = {
    ...props,
    onChange() {
      changes++;
    },
  };
  h.render(p);
  await tick();
  let tree = h.render(p);
  assert.ok(text(tree).includes("Your selection is unchanged"));
  button(tree, "Retry file details").props.onClick();
  h.render(p);
  await tick();
  tree = h.render(p);
  assert.ok(nodes(tree).some((n) => n.type === "AttachmentPreview"));
  assert.equal(changes, 0);
  assert.equal(calls, 2);
  h.dispose();
});
test("a mismatched version is not silently previewed", async () => {
  const h = await mount(component, async () => ({ items: [file("other")] }));
  h.render(props);
  await tick();
  const tree = h.render(props);
  assert.equal(
    nodes(tree).filter((n) => n.type === "AttachmentPreview").length,
    0,
  );
  assert.ok(text(tree).includes("no longer available"));
  h.dispose();
});
test("selection still rejects unready, wrong-kind and overlong clips", async () => {
  const changes = [];
  const p = {
    ...props,
    value: null,
    kind: "video",
    maxDuration: 12,
    onChange: (id) => changes.push(id),
  };
  const h = await mount(component);
  let tree = h.render(p);
  button(tree, "Choose existing file").props.onClick();
  tree = h.render(p);
  const select = nodes(tree).find(
    (n) => typeof n.type === "function" && n.type.name === "MediaLibraryList",
  ).props.onSelect;
  select(file("bad"));
  select(
    file("pending", { kind: "video", state: "processing", durationSeconds: 5 }),
  );
  select(file("long", { kind: "video", durationSeconds: 13 }));
  assert.equal(changes.length, 0);
  select(file("clip", { kind: "video", durationSeconds: 12 }));
  assert.deepEqual(changes, ["clip"]);
  h.dispose();
});
test("audio preview is on-demand, never autoplay, and recovers after a media error", async () => {
  const h = await mount(preview),
    p = { item: file("audio", { kind: "audio", durationSeconds: 61 }) };
  let tree = h.render(p);
  assert.equal(nodes(tree).filter((n) => n.type === "audio").length, 0);
  button(tree, "Preview selected file").props.onClick();
  tree = h.render(p);
  const audio = nodes(tree).find((n) => n.type === "audio");
  assert.equal(audio.props.preload, "none");
  assert.equal(audio.props.autoPlay, undefined);
  audio.props.onError();
  tree = h.render(p);
  assert.ok(text(tree).includes("Audio preview unavailable"));
  button(tree, "Retry playback").props.onClick();
  tree = h.render(p);
  assert.ok(!text(tree).includes("Audio preview unavailable"));
  h.dispose();
});
test("video authorization is deferred until preview is requested", async () => {
  const h = await mount(preview),
    p = { item: file("video", { kind: "video", durationSeconds: 12 }) };
  let tree = h.render(p);
  assert.equal(nodes(tree).filter((n) => n.type === "ReviewVideo").length, 0);
  button(tree, "Preview selected file").props.onClick();
  tree = h.render(p);
  assert.equal(
    nodes(tree).find((n) => n.type === "ReviewVideo").props.mediaId,
    p.item.id,
  );
  h.dispose();
});

test("revoking media.read closes an open picker and prevents private previews", async () => {
  const h = await mount(component);
  let tree = h.render({ ...props, value: null });
  button(tree, "Choose existing file").props.onClick();
  tree = h.render({ ...props, value: null });
  assert.ok(nodes(tree).some((n) => n.type === "Modal"));
  tree = h.render({ ...props, value: null, canRead: false });
  assert.ok(!nodes(tree).some((n) => n.type === "Modal"));
  h.dispose();
});

test("unavailable artwork has a retry without changing file identity", async () => {
  const h = await mount(preview),
    p = { item: file("image") };
  let tree = h.render(p);
  nodes(tree)
    .find((n) => n.type === "img")
    .props.onError();
  tree = h.render(p);
  assert.ok(text(tree).includes("Artwork unavailable"));
  button(tree, "Retry artwork").props.onClick();
  tree = h.render(p);
  assert.equal(
    nodes(tree).find((n) => n.type === "img").props.src,
    "/api/v1/admin/media/asset-image/thumbnail",
  );
  h.dispose();
});

test("processing images keep their correct type and cannot start a preview", async () => {
  const h = await mount(preview);
  const tree = h.render({ item: file("processing", { state: "processing" }) });
  assert.ok(text(tree).includes("Image file"));
  assert.equal(
    nodes(tree).filter((n) => ["img", "audio", "ReviewVideo"].includes(n.type))
      .length,
    0,
  );
  assert.equal(button(tree, "Preview selected file"), undefined);
  h.dispose();
});
