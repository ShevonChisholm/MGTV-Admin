import CommerceOrdersWorkspace from "../components/CommerceOrdersWorkspace";
import CommerceProductGrid from "../components/CommerceProductGrid";
import CommerceProductOverview from "../components/CommerceProductOverview";
import ProductGalleryEditor from "../components/ProductGalleryEditor";
import MediaAttachment from "../components/MediaAttachment";
import LoadingState from "../components/LoadingState";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Card, Modal } from "../ui";
import StaffAuth from "./StaffAuth";
import { useDirtyGuard, useRouter } from "../router";
const blank = () => ({
  name: "",
  description: "",
  kind: "physical",
  category: "Merchandise",
  imageVersionId: "",
  digitalVersionId: "",
  reason: "",
});
const optionBlank = () => ({
  sku: "",
  label: "",
  priceMinor: 10000,
  capacity: 10,
  active: true,
  startsAt: "",
  endsAt: "",
  reason: "",
});
const money = (n: number) =>
  new Intl.NumberFormat("en-JM", {
    style: "currency",
    currency: "JMD",
    currencyDisplay: "code",
  }).format(n / 100);
export default function ConnectedCommerce() {
  const { route, navigate } = useRouter();
  const productId = route.parts[0] === "products" ? route.parts[1] : undefined;
  const [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [tab, setTab] = useState("products"),
    [items, setItems] = useState<any[]>([]),
    [selected, setSelected] = useState<any>(null),
    [editing, setEditing] = useState<any>(null),
    [form, setForm] = useState(blank()),
    [option, setOption] = useState<any>(null),
    [opt, setOpt] = useState(optionBlank()),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState("");
  const dirty = useRef(false);
  useDirtyGuard(() => dirty.current);
  const can = (p: string) => session?.permissions.includes(p);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function refresh(which = tab) {
    const result = await api("/admin/commerce/" + which);
    setItems(which === "products" ? result.items : result);
  }
  async function start() {
    await run(async () => {
      const s = await api("/admin/session");
      setSession(s);
      if (!s.permissions.includes("commerce.read"))
        throw Error("Commerce access requires commerce.read permission.");
      await refresh();
    });
    setLoaded(true);
  }
  useEffect(() => {
    void start();
  }, []);
  useEffect(() => {
    if (!loaded || !session) return;
    let active = true;
    setSelected(null);
    setReason("");
    if (productId) {
      setTab("products");
      setBusy(true);
      setError("");
      api("/admin/commerce/products/" + encodeURIComponent(productId))
        .then((p) => {
          if (active) setSelected(p);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }
    return () => {
      active = false;
    };
  }, [productId, loaded, session]);
  function edit(p?: any) {
    setEditing(p ?? {});
    setForm(
      p
        ? {
            name: p.name,
            description: p.description,
            kind: p.kind,
            category: p.category,
            imageVersionId: p.image_version_id ?? "",
            digitalVersionId: "",
            reason: "",
          }
        : blank(),
    );
    dirty.current = false;
  }
  if (!loaded)
    return <LoadingState label={<>Loading Commerce…</>} variant="table" />;
  if (!session)
    return (
      <div className="page-pad">
        <StaffAuth onAuthenticated={start} />
        {error && <p role="alert">{error}</p>}
      </div>
    );
  if (route.parts[0] === "orders")
    return <CommerceOrdersWorkspace permissions={session.permissions} />;
  return (
    <div className="page-pad">
      {productId ? (
        <button
          className="btn btn-secondary mb-5"
          onClick={() => navigate("/admin/commerce")}
        >
          ← All products
        </button>
      ) : (
        <div className="flex flex-wrap gap-2 mb-5">
          {["products", "orders"].map((t) => (
            <button
              key={t}
              disabled={busy}
              className={"btn " + (tab === t ? "btn-primary" : "btn-secondary")}
              onClick={() =>
                void run(async () => {
                  setItems([]);
                  setTab(t);
                  setSelected(null);
                  await refresh(t);
                })
              }
            >
              {t === "products" ? "Products & Inventory" : "Orders & Bookings"}
            </button>
          ))}
        </div>
      )}
      <p className="text-sm text-muted mb-5">
        Jamaica · JMD · Development store. Test tax 15%; delivery J$750;
        collection free. Stripe sandbox checkout; no real money moves.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-red-400">
          {error}
        </p>
      )}
      {tab === "products" && !productId && (
        <button
          className="btn btn-primary mb-4"
          disabled={busy || !can("commerce.products.manage")}
          onClick={() => edit()}
        >
          Add product
        </button>
      )}
      {!productId && <CommerceProductGrid items={items} />}
      {productId && busy && !selected && (
        <LoadingState label="Loading product…" variant="cards" />
      )}
      {selected && (
        <Card>
          <div className="p-5 space-y-4">
            <>
              <CommerceProductOverview
                key={selected.id + ":" + selected.version}
                product={selected}
              />
              <h3 className="text-lg font-semibold">
                Gallery & product management
              </h3>
              <ProductGalleryEditor
                key={selected.id + ":" + selected.version}
                product={selected}
                permissions={session.permissions}
                onSaved={async () => {
                  setSelected(
                    await api("/admin/commerce/products/" + selected.id),
                  );
                  await refresh();
                }}
              />
              <p>
                Status: {selected.status} · Version {selected.version}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-secondary"
                  disabled={
                    busy ||
                    selected.status === "published" ||
                    !can("commerce.products.manage")
                  }
                  onClick={() => edit(selected)}
                >
                  Edit product
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={
                    busy ||
                    selected.status === "published" ||
                    !can("commerce.inventory.manage")
                  }
                  onClick={() => {
                    setOption({});
                    setOpt(optionBlank());
                  }}
                >
                  Add variant / dated slot
                </button>
              </div>
              <h3 className="text-lg font-semibold">
                Variants, pricing & availability
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(min(100%,230px),1fr))",
                  gap: 16,
                }}
              >
                {selected.options.map((o: any) => (
                  <div
                    style={{
                      minWidth: 0,
                      overflowWrap: "anywhere",
                      padding: 18,
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      background: "var(--sidebar)",
                    }}
                    key={o.id}
                  >
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {o.label}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        marginBottom: 12,
                      }}
                    >
                      {o.sku}
                    </p>
                    <p
                      style={{
                        fontSize: 20,
                        color: "var(--accent)",
                        fontWeight: 600,
                        marginBottom: 12,
                      }}
                    >
                      {money(o.price_minor)}
                    </p>
                    <p>
                      {o.available} available · {o.sold} sold · capacity{" "}
                      {o.capacity}
                    </p>
                    {o.starts_at && (
                      <p>
                        {new Date(o.starts_at).toLocaleString()} –{" "}
                        {new Date(o.ends_at).toLocaleString()} ({o.timezone})
                      </p>
                    )}
                    <button
                      className="btn btn-secondary"
                      disabled={
                        busy ||
                        selected.status === "published" ||
                        !can("commerce.inventory.manage")
                      }
                      onClick={() => {
                        setOption(o);
                        setOpt({
                          sku: o.sku,
                          label: o.label,
                          priceMinor: o.price_minor,
                          capacity: o.capacity,
                          active: o.active,
                          startsAt: o.starts_at ?? "",
                          endsAt: o.ends_at ?? "",
                          reason: "",
                        });
                      }}
                    >
                      Edit option
                    </button>
                  </div>
                ))}
              </div>
              <h3 className="text-lg font-semibold">Publication control</h3>
              <label className="block">
                Publication reason
                <input
                  className="input w-full"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button
                className="btn btn-primary"
                disabled={
                  busy ||
                  !reason.trim() ||
                  !can("commerce.products.manage") ||
                  !can(
                    selected.status === "published"
                      ? "commerce.unpublish"
                      : "commerce.publish",
                  )
                }
                onClick={() =>
                  void run(async () => {
                    setSelected(
                      await api(
                        "/admin/commerce/products/" + selected.id + "/actions",
                        "POST",
                        {
                          action:
                            selected.status === "published"
                              ? "archive"
                              : "publish",
                          reason,
                        },
                        selected.version,
                      ),
                    );
                    await refresh();
                  })
                }
              >
                {selected.status === "published"
                  ? "Archive product"
                  : "Publish product"}
              </button>
              <p className="text-sm text-muted">
                Archive before editing. Pending orders retain their saved price
                and dates.
              </p>
            </>
          </div>
        </Card>
      )}
      {editing && (
        <Modal
          title={editing.id ? "Edit product" : "Add product"}
          onClose={() => {
            if (!dirty.current || confirm("Discard unsaved product changes?")) {
              setEditing(null);
              dirty.current = false;
            }
          }}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const b: any = { ...form };
                if (!b.imageVersionId) delete b.imageVersionId;
                if (!b.digitalVersionId) delete b.digitalVersionId;
                const p = await api(
                  "/admin/commerce/products" +
                    (editing.id ? "/" + editing.id : ""),
                  editing.id ? "PUT" : "POST",
                  b,
                  editing.version,
                  crypto.randomUUID(),
                );
                setSelected(p);
                setEditing(null);
                dirty.current = false;
                await refresh();
              });
            }}
          >
            {(["name", "description", "category", "reason"] as const).map(
              (k) => (
                <label className="block capitalize" key={k}>
                  {k}
                  {k === "description" ? (
                    <textarea
                      required
                      className="input w-full"
                      value={form[k]}
                      onChange={(e) => {
                        setForm({ ...form, [k]: e.target.value });
                        dirty.current = true;
                      }}
                    />
                  ) : (
                    <input
                      required
                      className="input w-full"
                      value={form[k]}
                      onChange={(e) => {
                        setForm({ ...form, [k]: e.target.value });
                        dirty.current = true;
                      }}
                    />
                  )}
                </label>
              ),
            )}
            <label className="block">
              Product type
              <select
                className="input w-full"
                disabled={!!editing.id}
                value={form.kind}
                onChange={(e) => {
                  setForm({ ...form, kind: e.target.value });
                  dirty.current = true;
                }}
              >
                {["physical", "digital", "experience", "travel"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <MediaAttachment
              key={`${editing?.id ?? "new"}:image`}
              label="Product image"
              kind="image"
              value={form.imageVersionId || null}
              disabled={busy || !can("commerce.products.manage")}
              canRead={!!can("media.read")}
              canUpload={!!can("media.upload")}
              onBusyChange={setBusy}
              onChange={(v) => {
                setForm((f) => ({ ...f, imageVersionId: v ?? "" }));
                dirty.current = true;
              }}
            />
            {form.kind === "digital" && (
              <MediaAttachment
                key={`${editing?.id ?? "new"}:digital`}
                label="Digital download"
                kind="any"
                value={form.digitalVersionId || null}
                disabled={busy || !can("commerce.products.manage")}
                canRead={!!can("media.read")}
                canUpload={!!can("media.upload")}
                onBusyChange={setBusy}
                onChange={(v) => {
                  setForm((f) => ({ ...f, digitalVersionId: v ?? "" }));
                  dirty.current = true;
                }}
              />
            )}
            {error && <p role="alert">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Save draft
            </button>
          </form>
        </Modal>
      )}
      {option && (
        <Modal
          title={option.id ? "Edit variant / slot" : "Add variant / slot"}
          onClose={() => setOption(null)}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const b: any = { ...opt };
                if (!b.startsAt) delete b.startsAt;
                if (!b.endsAt) delete b.endsAt;
                const p = await api(
                  "/admin/commerce/products/" +
                    selected.id +
                    "/options" +
                    (option.id ? "/" + option.id : ""),
                  option.id ? "PUT" : "POST",
                  b,
                  selected.version,
                  crypto.randomUUID(),
                );
                setSelected(p);
                setOption(null);
                await refresh();
              });
            }}
          >
            {(
              [
                "sku",
                "label",
                "priceMinor",
                "capacity",
                "startsAt",
                "endsAt",
                "reason",
              ] as const
            )
              .filter(
                (k) =>
                  !["startsAt", "endsAt"].includes(k) ||
                  ["experience", "travel"].includes(selected.kind),
              )
              .map((k) => (
                <label key={k} className="block">
                  {
                    {
                      sku: "SKU",
                      label: "Variant / slot label",
                      priceMinor: "Price in JMD cents (J$100 = 10000)",
                      capacity: "Total stock / capacity",
                      startsAt:
                        "Start (ISO with timezone, e.g. 2027-01-15T10:00:00-05:00)",
                      endsAt: "End (ISO with timezone)",
                      reason: "Reason",
                    }[k]
                  }
                  <input
                    required
                    className="input w-full"
                    type={
                      ["priceMinor", "capacity"].includes(k) ? "number" : "text"
                    }
                    value={opt[k]}
                    onChange={(e) =>
                      setOpt({
                        ...opt,
                        [k]: ["priceMinor", "capacity"].includes(k)
                          ? Number(e.target.value)
                          : e.target.value,
                      })
                    }
                  />
                </label>
              ))}
            <label>
              <input
                type="checkbox"
                checked={opt.active}
                onChange={(e) => setOpt({ ...opt, active: e.target.checked })}
              />{" "}
              Available for sale
            </label>
            {error && <p role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn-primary">
              Save option
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
