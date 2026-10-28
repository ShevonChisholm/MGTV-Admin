const paths: Record<string, string> = {
  image: "M3 3h18v18H3zM3 16l6-6 6 6 3-3 3 3M16 7h.01",
  video: "M3 5h13v14H3zM16 10l5-3v10l-5-3",
  audio:
    "M9 18V5l11-2v13M9 8l11-2M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6",
  filter: "M3 5h18M6 12h12M9 19h6",
  refresh: "M20 8a8 8 0 1 0 0 8M20 3v5h-5",
  link: "m10 13 4-4m-6 7-2 2a4 4 0 0 1-6-6l5-5m8 1 2-2a4 4 0 0 1 6 6l-5 5",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4v5l3 2",
  check: "M5 12l4 4L19 6",
  alert: "M12 3 2 21h20L12 3m0 6v5m0 3v1",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  back: "M19 12H5m6-6-6 6 6 6",
  captions: "M3 5h18v14H3zM10 10H7v4h3m7-4h-3v4h3",
  file: "M5 3h9l5 5v13H5zM14 3v6h5",
  grid: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
};
export default function MediaIcon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={paths[name] ?? paths.file} />
    </svg>
  );
}
