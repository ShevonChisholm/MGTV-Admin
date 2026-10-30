import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";
import vm from "node:vm";
const compile = async (path) =>
  ts.transpileModule(await fs.readFile(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
const policy = await import(
  `data:text/javascript;base64,${Buffer.from(await compile("src/admin/api/navigation-access.ts")).toString("base64")}`
);
const {
  destinationFor,
  canOpenWorkspace,
  firstWorkspace,
  navigationPermissions,
} = policy;
const nodes = (root) =>
  !root || typeof root !== "object"
    ? []
    : Array.isArray(root)
      ? root.flatMap(nodes)
      : [root, ...nodes(root.props?.children)];
const tick = () => new Promise((resolve) => setImmediate(resolve));
async function sidebar(initial, api = async () => ({ open: 7 })) {
  let permissions = initial,
    cursor = 0;
  const slots = [],
    effects = [],
    listeners = new Map();
  const element = (type, props, key) => ({ type, props: props ?? {}, key });
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots))
        slots[i] = typeof initial === "function" ? initial() : initial;
      return [
        slots[i],
        (value) =>
          (slots[i] = typeof value === "function" ? value(slots[i]) : value),
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return (slots[i] ??= { current: initial });
    },
    useEffect(fn, deps) {
      const i = cursor++,
        prior = slots[i];
      if (!prior || deps.some((d, j) => d !== prior.deps[j]))
        effects.push(() => {
          prior?.cleanup?.();
          slots[i] = { deps, cleanup: fn() };
        });
    },
  };
  const window = {
    addEventListener(name, fn) {
      listeners.set(name, fn);
    },
    removeEventListener(name, fn) {
      if (listeners.get(name) === fn) listeners.delete(name);
    },
  };
  const context = vm.createContext({
    window,
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
    },
    console,
  });
  const module = new vm.SourceTextModule(
    await compile("src/admin/components/Sidebar.tsx"),
    { context },
  );
  await module.link((specifier) => {
    let values;
    if (specifier === "react") values = hooks;
    else if (specifier === "react/jsx-runtime")
      values = { jsx: element, jsxs: element };
    else if (specifier.includes("navigation-access")) values = policy;
    else if (specifier.includes("staff-session-context"))
      values = { useStaffPermissions: () => permissions };
    else if (specifier.includes("api/client"))
      values = { api, connected: true };
    else if (specifier.includes("router")) values = { Link: "Link" };
    else if (specifier.includes("store/ops"))
      values = { useOps: () => ({ reports: [] }) };
    else if (specifier.endsWith(".css")) values = {};
    else values = { default: "BrandLogo" };
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [k, v] of Object.entries(values)) this.setExport(k, v);
      },
      { context },
    );
  });
  await module.evaluate();
  return {
    render(active = "media") {
      cursor = 0;
      const tree = module.namespace.default({
        active,
        open: false,
        onClose() {},
      });
      while (effects.length) effects.shift()();
      return tree;
    },
    setPermissions(p) {
      permissions = p;
    },
    listeners,
    dispose() {
      for (const x of slots) x?.cleanup?.();
    },
  };
}

test("each registered workspace requires an explicit read permission", () => {
  for (const [id, required] of Object.entries(navigationPermissions)) {
    assert.equal(destinationFor(id, []), null);
    assert.equal(destinationFor(id, ["Admin", "content.publish"]), null);
    for (const permission of required)
      assert.ok(destinationFor(id, [permission]));
  }
  assert.equal(destinationFor("unregistered", ["access.manage"]), null);
  assert.equal(firstWorkspace([]), null);
});
test("grouped destinations open an allowed subsection", () => {
  assert.equal(
    destinationFor("content", ["movies.read"]),
    "/admin/content/movies",
  );
  assert.equal(
    destinationFor("content", ["music.read"]),
    "/admin/content/music-videos",
  );
  assert.equal(
    destinationFor("music-library", ["albums.read"]),
    "/admin/music-library/albums",
  );
  assert.equal(canOpenWorkspace("content", ["shows"], ["movies.read"]), false);
  assert.equal(
    canOpenWorkspace("content", ["shows", "id", "seasons"], ["shows.read"]),
    true,
  );
  assert.equal(
    canOpenWorkspace("music-library", ["artists"], ["albums.read"]),
    false,
  );
  assert.equal(canOpenWorkspace("content", ["unknown"], ["shows.read"]), false);
  assert.equal(canOpenWorkspace("dashboard", [], ["media.read"]), false);
  assert.equal(firstWorkspace(["media.read"]), "/admin/media");
  assert.equal(
    destinationFor("communications", ["newsletter.read"]),
    "/admin/communications",
  );
});
test("restricted navigation hides links and never requests moderation counts", async () => {
  let requests = 0;
  const h = await sidebar(["media.read"], async () => {
    requests++;
    return { open: 9 };
  });
  let tree = h.render();
  h.render("settings");
  await tick();
  assert.deepEqual(
    nodes(tree)
      .filter((n) => n.type === "Link")
      .map((n) => n.props.to),
    ["/admin/media"],
  );
  assert.equal(requests, 0);
  assert.equal(h.listeners.has("mgtv-moderation"), false);
  h.dispose();
});
test("authorized badge reads do not repeat on route navigation and stop after revocation", async () => {
  let requests = 0;
  const h = await sidebar(["moderation.read"], async () => {
    requests++;
    return { open: 9 };
  });
  h.render();
  await tick();
  h.render("settings");
  assert.equal(requests, 1);
  h.listeners.get("mgtv-moderation")();
  await tick();
  assert.equal(requests, 2);
  h.setPermissions(["media.read"]);
  const tree = h.render();
  assert.equal(h.listeners.has("mgtv-moderation"), false);
  assert.equal(h.listeners.has("focus"), false);
  assert.ok(
    !nodes(tree).some(
      (n) => n.type === "Link" && n.props.to === "/admin/moderation",
    ),
  );
  h.dispose();
});
test("navigation search only finds permitted links and collapse clears its filter", async () => {
  const h = await sidebar(["media.read", "settings.read"]);
  let tree = h.render();
  nodes(tree)
    .find((n) => n.type === "input")
    .props.onChange({ target: { value: "settings" } });
  tree = h.render();
  assert.deepEqual(
    nodes(tree)
      .filter((n) => n.type === "Link")
      .map((n) => n.props.to),
    ["/admin/settings"],
  );
  nodes(tree)
    .find(
      (n) =>
        n.type === "button" && n.props["aria-label"] === "Collapse sidebar",
    )
    .props.onClick();
  tree = h.render();
  assert.equal(nodes(tree).find((n) => n.type === "input").props.value, "");
  assert.equal(nodes(tree).filter((n) => n.type === "Link").length, 2);
  h.dispose();
});
