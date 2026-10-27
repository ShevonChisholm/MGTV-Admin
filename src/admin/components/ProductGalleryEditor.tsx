import { useState, useRef } from "react";
import { api } from "../api/client";
import { Modal } from "../ui";
import { useDirtyGuard } from "../router";
import MediaAttachment from "./MediaAttachment";
function GalleryPreview({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      style={{
        aspectRatio: "1",
        background: "#10100f",
        borderRadius: "16px 0 16px 0",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        border: "1px solid var(--border)",
      }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <div
          style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}
        >
          <span aria-hidden="true" style={{ fontSize: 32 }}>
            ▧
          </span>
          <p>{src ? "Image unavailable" : "Choose an image"}</p>
        </div>
      )}
    </div>
  );
}
export default function ProductGalleryEditor({
  product,
  permissions,
  onSaved,
}: {
  product: any;
  permissions: string[];
  onSaved: () => Promise<void>;
}) {
  const initial = () =>
    product.gallery?.map((i: any) => ({
      mediaVersionId: i.mediaVersionId,
      label: i.label,
      alt: i.alt,
      caption: i.caption,
    })) ?? [];
  const [open, setOpen] = useState(false),
    [images, setImages] = useState<any[]>(initial),
    [reason, setReason] = useState(""),
    [rights, setRights] = useState(false),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const dirty = JSON.stringify(images) !== JSON.stringify(initial());
  useDirtyGuard(() => dirty);
  const can =
    permissions.includes("commerce.products.manage") &&
    product.status !== "archived" &&
    (product.status !== "published" ||
      permissions.includes("commerce.publish"));
  function change(next: any[]) {
    setImages(next);
    setRights(false);
    setError("");
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const body = { images, reason, rightsConfirmed: rights },
        signature = JSON.stringify([body, product.version]);
      if (attempt.current?.signature !== signature)
        attempt.current = { signature, key: crypto.randomUUID() };
      await api(
        "/admin/commerce/products/" + product.id + "/gallery",
        "POST",
        body,
        product.version,
        attempt.current.key,
      );
      await onSaved();
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={!can}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">▧</span> Manage gallery
        {dirty ? " · Unsaved" : ""}
      </button>
      {open && (
        <Modal
          title={"Product gallery · " + product.name}
          width={960}
          onClose={() => {
            if (!busy && !uploading) setOpen(false);
          }}
        >
          <p className="text-sm text-muted mb-4">
            The product cover stays first. Add up to seven extra views. Saving
            changes the public gallery immediately for a published product.
          </p>
          {error && (
            <p role="alert" className="mb-4 text-red-300">
              {error}
            </p>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%,250px),1fr))",
              gap: 18,
              alignItems: "start",
            }}
          >
            <section
              style={{
                padding: 14,
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "var(--card)",
                minWidth:0, overflowWrap:"anywhere",
              }}
            >
              <GalleryPreview
                key={product.image_version_id}
                src={
                  product.image_version_id
                    ? `/api/v1/admin/commerce/products/${product.id}/cover`
                    : undefined
                }
                alt={product.name + " cover"}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  gap: 8,
                }}
              >
                <strong>01 · Front / cover</strong>
                <span style={{ color: "var(--gold)", fontSize: 12 }}>
                  ◆ Fixed first
                </span>
              </div>
              <p className="text-sm text-muted" style={{ marginTop: 8 }}>
                Your storefront's first impression. Change this in the product
                editor.
              </p>
            </section>
            {images.map((image, i) => (
              <fieldset
                key={i}
                disabled={busy || uploading}
                className="min-w-0 rounded-lg border border-white/10 p-3"
                style={{ background: "var(--card)", padding: 14, minWidth:0, minInlineSize:0, overflowWrap:"anywhere" }}
              >
                <legend
                  style={{
                    padding: "0 6px",
                    maxWidth:"100%", overflowWrap:"anywhere",
                    color: "var(--gold)",
                    fontWeight: 600,
                  }}
                >
                  0{i + 2} · {image.label || "New view"}
                </legend>
                <GalleryPreview
                  key={image.mediaVersionId}
                  src={
                    product.gallery?.find(
                      (v: any) => v.mediaVersionId === image.mediaVersionId,
                    )?.url
                  }
                  alt={image.alt || "Gallery image preview"}
                />
                <div style={{ marginTop: 14 }} />
                <MediaAttachment
                  label={"Gallery image " + (i + 1)}
                  kind="image"
                  value={image.mediaVersionId}
                  canRead={permissions.includes("media.read")}
                  canUpload={permissions.includes("media.upload")}
                  disabled={busy || uploading}
                  onBusyChange={setUploading}
                  onChange={(v) =>
                    change(
                      images.map((x, j) =>
                        j === i ? { ...x, mediaVersionId: v ?? "" } : x,
                      ),
                    )
                  }
                />
                {["label", "alt", "caption"].map((k) => (
                  <label key={k} className="block mt-3 text-sm">
                    {k === "label"
                      ? "View label"
                      : k === "alt"
                        ? "Image description"
                        : "Caption"}
                    <input
                      className="input w-full mt-1"
                      style={{minWidth:0,maxWidth:"100%",boxSizing:"border-box"}}
                      maxLength={k === "label" ? 60 : k === "alt" ? 400 : 600}
                      value={image[k]}
                      onChange={(e) =>
                        change(
                          images.map((x, j) =>
                            j === i ? { ...x, [k]: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={!i}
                    onClick={() => {
                      const n = [...images];
                      [n[i - 1], n[i]] = [n[i], n[i - 1]];
                      change(n);
                    }}
                  >
                    <span aria-hidden="true">↑</span> Move up
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={i === images.length - 1}
                    onClick={() => {
                      const n = [...images];
                      [n[i + 1], n[i]] = [n[i], n[i + 1]];
                      change(n);
                    }}
                  >
                    <span aria-hidden="true">↓</span> Move down
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => change(images.filter((_, j) => j !== i))}
                  >
                    <span aria-hidden="true">×</span> Remove view
                  </button>
                </div>
              </fieldset>
            ))}
          </div>
          <button
            type="button"
            disabled={busy || uploading || images.length >= 7}
            className="btn btn-secondary mt-4"
            onClick={() =>
              change([
                ...images,
                { mediaVersionId: "", label: "", alt: "", caption: "" },
              ])
            }
          >
            <span aria-hidden="true">＋</span> Add view
          </button>
          <label className="block mt-5 text-sm">
            Review reason
            <textarea
              className="input w-full mt-2"
              value={reason}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <label className="flex gap-2 mt-4">
            <input
              type="checkbox"
              checked={rights}
              onChange={(e) => setRights(e.target.checked)}
            />
            I have reviewed these views and confirmed image rights.
          </label>
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              className="btn btn-primary"
              disabled={
                busy ||
                uploading ||
                !rights ||
                reason.trim().length < 5 ||
                images.some(
                  (i) => !i.mediaVersionId || !i.label.trim() || !i.alt.trim(),
                )
              }
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save gallery"}
            </button>
            <button
              className="btn btn-secondary"
              disabled={busy || uploading}
              onClick={() => {
                setImages(initial());
                setRights(false);
                setReason("");
                setOpen(false);
              }}
            >
              Discard changes
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
