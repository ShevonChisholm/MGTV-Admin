export const connected = import.meta.env.VITE_API_MODE === "connected";
const base = "/api/v1";
export const STAFF_ONBOARDING_REQUIRED = "mgtv:staff-onboarding-required";
export const STAFF_SESSION_ENDED = "mgtv:staff-session-ended";
let csrf = "";
export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: any,
  ) {
    super(payload.message ?? "The request failed.");
  }
}
export async function api(
  path: string,
  method = "GET",
  body?: unknown,
  version?: number,
  key?: string,
): Promise<any> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    headers["X-CSRF-Token"] = csrf;
    if (method === "POST" || key)
      headers["Idempotency-Key"] = key ?? crypto.randomUUID();
  }
  if (version !== undefined) headers["If-Match"] = `"v${version}"`;
  const r = await fetch(base + path, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new ApiError(0, {
      message: "Unable to reach MGTV. Check your connection and try again.",
    });
  });
  let unreadable = false;
  const data =
    r.status === 204
      ? null
      : await r.json().catch(() => {
          unreadable = true;
          return {
            message: "MGTV returned an unreadable response. Please try again.",
          };
        });
  if (!r.ok) {
    if (r.status === 403 && data?.code === "ONBOARDING_REQUIRED")
      window.dispatchEvent(new Event(STAFF_ONBOARDING_REQUIRED));
    if (
      r.status === 401 &&
      path.startsWith("/admin/") &&
      !path.startsWith("/admin/auth/") &&
      !["/admin/login", "/admin/mfa/verify"].includes(path)
    )
      window.dispatchEvent(new Event(STAFF_SESSION_ENDED));
    throw new ApiError(
      r.status,
      data ?? { message: "The request failed. Please try again." },
    );
  }
  if (unreadable) throw new ApiError(502, data);
  if (path === "/admin/logout" || path === "/admin/logout-all") {
    csrf = "";
    window.dispatchEvent(new Event(STAFF_SESSION_ENDED));
  }
  if (data?.csrfToken) csrf = data.csrfToken;
  return data;
}
export async function upload(file: File, onState: (state: string) => void) {
  try {
    return await (await import("./direct-upload")).directUpload(file, onState);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.payload.code !== "DIRECT_UPLOADS_DISABLED"
    )
      throw error;
  }
  if (file.size > 100 * 1024 * 1024)
    throw Error("Local-only uploads are limited to 100 MB.");
  return legacyUpload(file, onState);
}
async function legacyUpload(file: File, onState: (state: string) => void) {
  onState("Checking file…");
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes),
    checksumSha256 = Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
  const intent = await api("/admin/media/uploads", "POST", {
    filename: file.name,
    kind: file.type.startsWith("image/")
      ? "image"
      : file.type === "audio/mpeg"
        ? "audio"
        : "video",
    byteSize: file.size,
    contentType: file.type,
    checksumSha256,
  });
  onState("Uploading…");
  const r = await fetch(intent.upload.url, {
    method: "PUT",
    headers: intent.upload.headers,
    body: bytes,
  });
  if (!r.ok) throw new ApiError(r.status, await r.json());
  await api("/admin/media/uploads/" + intent.id + "/complete", "POST", {
    checksumSha256,
  });
  onState("Processing…");
  for (let i = 0; i < 300; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const media = await api("/admin/media/" + intent.id),
      v = media.versions[0];
    if (v.state === "ready") {
      onState("Ready · " + file.name);
      return v.id;
    }
    if (v.state === "failed")
      throw new Error("This file could not be processed. Choose another file.");
  }
  throw new Error(
    "Processing is taking longer than expected. Upload remains saved; check again later.",
  );
}
