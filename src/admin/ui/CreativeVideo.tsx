import { useEffect, useRef, useState } from "react";
export default function CreativeVideo({ src }: { src: string }) {
  const video = useRef<HTMLVideoElement>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true,
      hls: any;
    const node = video.current;
    setError("");
    void (async () => {
      const response = await fetch(src, {
        credentials: "include",
        headers: { "X-MGTV-Playback": "descriptor" },
      });
      if (!response.ok)
        throw Error(
          "Creative preview unavailable. Check your session and reload.",
        );
      const delivery = await response.json();
      if (!active || !node) return;
      if (delivery.type === "hls") {
        const { default: Hls } = await import("hls.js");
        if (!active) return;
        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(delivery.url);
          hls.attachMedia(node);
          hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
            if (data.fatal)
              setError(
                "Video preview could not load. Reload the preview to check access again.",
              );
          });
        } else node.src = delivery.url;
      } else node.src = delivery.url;
    })().catch((e) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
      hls?.destroy();
      node?.pause();
      node?.removeAttribute("src");
    };
  }, [src, retry]);
  return (
    <div>
      <video
        ref={video}
        controls
        playsInline
        preload="metadata"
        aria-label="Campaign video creative preview"
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 8,
          background: "var(--bg)",
        }}
      />
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-sm" onClick={() => setRetry((x) => x + 1)}>
        Reload video preview
      </button>
    </div>
  );
}
