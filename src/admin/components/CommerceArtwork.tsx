import { useState } from "react";
export default function CommerceArtwork({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      style={{
        aspectRatio: "1",
        width: "100%",
        minWidth: 0,
        background: "#101114",
        overflow: "hidden",
        borderRadius: "18px 0 18px 0",
        display: "grid",
        placeItems: "center",
      }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: 24,
            color: "var(--text-secondary)",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 36 }}>
            ▧
          </span>
          <p>Product artwork unavailable</p>
        </div>
      )}
    </div>
  );
}
