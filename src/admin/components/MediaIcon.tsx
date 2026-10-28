const paths: Record<string, string> = {
  artist: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  album:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  playlist:
    "M3 4h13M3 9h13M3 14h7m6-2v8m0-8 5-1v7m-5 2a2 2 0 1 1-2-2 2 2 0 0 1 2 2Zm5-2a2 2 0 1 1-2-2 2 2 0 0 1 2 2Z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  plus: "M12 4v16M4 12h16",
  film: "M3 3h18v18H3zM3 8h18M3 16h18M8 3v5M16 3v5M8 16v5M16 16v5",
  series: "M3 7h18v14H3zM6 3h12M5 5h14m-5 5 4 4-4 4",
  sport:
    "M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H3v4a4 4 0 0 0 5 4m8-8h5v4a4 4 0 0 1-5 4m-4 1v6m-5 1h10",
  edit: "m15 3 6 6-12 12H3v-6L15 3Zm-3 3 6 6",
  review: "M7 4h14v17H7V4ZM3 8h4M3 13h4M3 18h4m8-10-3 3-2-2",
  lock: "M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4",
  globe:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18",
  archive: "M3 4h18v5H3zM5 9v12h14V9M9 13h6",
  minus: "M5 12h14",

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
