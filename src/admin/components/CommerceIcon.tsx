const paths: Record<string, string> = {
  box: "M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M12 11v10",
  calendar: "M5 5h14v16H5zM8 2v6M16 2v6M5 10h14",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l3 2",
  alert: "M12 3L2 21h20L12 3zm0 6v5m0 3v1",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm5 12l6 6",
  refresh: "M20 8a8 8 0 1 0 0 8M20 3v5h-5",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  receipt: "M5 3h14v18l-3-2-4 2-4-2-3 2V3zm3 5h8m-8 4h8m-8 4h5",
  truck:
    "M2 5h12v12H2zM14 10h4l4 4v3h-8M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm13 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
  check: "M5 12l4 4L19 6",
  filter: "M3 5h18M6 12h12M9 19h6",
};
export default function CommerceIcon({
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
      <path d={paths[name] ?? paths.receipt} />
    </svg>
  );
}
