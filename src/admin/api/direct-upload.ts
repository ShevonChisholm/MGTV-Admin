import { sha256 } from "@noble/hashes/sha2.js";
import { api, ApiError } from "./client";
const CHUNK = 16 * 1024 * 1024;
type Session = {
  id: string;
  versionId: string;
  provider: "mux" | "r2";
  state: string;
  uploadUrl?: string;
  byteSize: number;
  partSize: number;
  parts: { partNumber: number; size: number; etag: string }[];
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Store only session identity; URLs and credentials stay out of persistent browser storage. */
export async function directUpload(
  file: File,
  onState: (state: string) => void,
) {
  const identity = await api("/admin/session");
  const kind = file.type.startsWith("image/")
    ? "image"
    : file.type === "audio/mpeg"
      ? "audio"
      : "video";
  const limit =
    kind === "image"
      ? 50 * 1024 ** 2
      : kind === "audio"
        ? 5 * 1024 ** 3
        : 100 * 1024 ** 3;
  if (file.size < 1 || file.size > limit)
    throw Error(
      "File exceeds its upload limit: images 50 MB, audio 5 GB, video 100 GB.",
    );
  const digest = sha256.create();
  for (let offset = 0; offset < file.size; offset += CHUNK) {
    digest.update(
      new Uint8Array(await file.slice(offset, offset + CHUNK).arrayBuffer()),
    );
    onState(
      `Checking file… ${Math.min(100, Math.round(((offset + CHUNK) / file.size) * 100))}%`,
    );
  }
  const checksumSha256 = Array.from(digest.digest(), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const storageKey =
    "mgtv-direct-upload-v1:" +
    identity.principal.id +
    ":" +
    checksumSha256 +
    ":" +
    file.size;
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "null");
    } catch {
      return null;
    }
  };
  const save = (value: unknown) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* Transfer works in memory even when storage is unavailable. */
    }
  };
  const forget = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Storage may be disabled. */
    }
  };
  let pending = read(),
    session: Session;
  if (pending?.id) {
    try {
      session = await api(
        "/admin/media/direct-uploads/" + pending.id + "/resume",
        "POST",
        { checksumSha256 },
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        ["NOT_FOUND", "UPLOAD_EXPIRED", "UPLOAD_CLOSED"].includes(
          error.payload.code,
        )
      ) {
        forget();
        pending = null;
      } else throw error;
    }
  }
  if (!pending?.id) {
    pending = pending ?? { createKey: crypto.randomUUID() };
    save(pending);
    session = await api(
      "/admin/media/direct-uploads",
      "POST",
      {
        filename: file.name,
        kind,
        contentType: file.type,
        byteSize: file.size,
        checksumSha256,
      },
      undefined,
      pending.createKey,
    );
    pending = { ...pending, id: session.id };
    save(pending);
  }
  session = session!;
  const progress = (bytes: number) =>
    onState(
      `Uploading… ${Math.min(100, Math.round((bytes / file.size) * 100))}%`,
    );
  async function retry<T>(operation: () => Promise<T>) {
    let last: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await operation();
      } catch (error) {
        last = error;
        if (
          error instanceof ApiError &&
          error.status < 500 &&
          error.status !== 429
        )
          throw error;
        onState("Connection interrupted. Retrying the saved upload…");
        await sleep(Math.min(8000, 1000 * 2 ** attempt));
      }
    }
    throw last;
  }
  try {
    if (session.state === "pending_upload") {
      if (session.provider === "r2") {
        let transferred = session.parts.reduce((sum, p) => sum + p.size, 0);
        progress(transferred);
        for (
          let number = 1;
          number <= Math.ceil(file.size / session.partSize);
          number++
        ) {
          const start = (number - 1) * session.partSize,
            end = Math.min(file.size, start + session.partSize);
          if (
            session.parts.some(
              (p) => p.partNumber === number && p.size === end - start,
            )
          )
            continue;
          await retry(async () => {
            const part = await api(
              "/admin/media/direct-uploads/" + session.id + "/parts",
              "POST",
              { partNumber: number },
            );
            const response = await fetch(part.url, {
              method: "PUT",
              body: file.slice(start, end),
              credentials: "omit",
              signal: AbortSignal.timeout(300000),
            });
            if (!response.ok) throw Error("Part transfer failed.");
          });
          transferred += end - start;
          progress(transferred);
        }
      } else {
        const uploadUrl = session.uploadUrl!;
        async function position() {
          const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Range": `bytes */${file.size}` },
            body: new Blob([]),
            credentials: "omit",
            signal: AbortSignal.timeout(30000),
          });
          if (response.ok) return file.size;
          if (response.status !== 308)
            throw Error("Could not check the saved video transfer.");
          const range = response.headers.get("Range");
          if (!range) return 0;
          const match = /^bytes=0-(\d+)$/.exec(range);
          if (!match) throw Error("Invalid provider upload position.");
          const offset = Number(match[1]) + 1;
          if (!Number.isSafeInteger(offset) || offset > file.size)
            throw Error("Invalid provider upload position.");
          return offset;
        }
        let offset = await retry(position);
        progress(offset);
        while (offset < file.size) {
          await retry(async () => {
            // Ask the provider again after a lost acknowledgement; never assume a chunk failed.
            offset = await position();
            if (offset === file.size) return;
            const end = Math.min(file.size, offset + CHUNK);
            const response = await fetch(uploadUrl, {
              method: "PUT",
              headers: {
                "Content-Type": "application/octet-stream",
                "Content-Range": `bytes ${offset}-${end - 1}/${file.size}`,
              },
              body: file.slice(offset, end),
              credentials: "omit",
              signal: AbortSignal.timeout(300000),
            });
            if (!response.ok && response.status !== 308)
              throw Error("Video chunk transfer failed.");
            offset = await position();
            progress(offset);
          });
        }
      }
      await api(
        "/admin/media/direct-uploads/" + session.id + "/complete",
        "POST",
        { checksumSha256 },
      );
    }
    onState("Processing the saved upload…");
    for (let attempt = 0; attempt < 600; attempt++) {
      const media = await api("/admin/media/" + session.id),
        version = media.versions[0];
      if (version.state === "ready") {
        forget();
        onState("Ready · " + file.name);
        return version.id as string;
      }
      if (version.state === "failed") {
        forget();
        throw Error(
          "This file could not be verified or processed. Choose another file.",
        );
      }
      await sleep(1000);
    }
    throw Error(
      "Processing continues. Select the same file again to check this saved upload.",
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw Error(
      (error instanceof Error ? error.message : "Upload interrupted.") +
        " Select the same file again to resume; completed parts are saved.",
    );
  }
}
