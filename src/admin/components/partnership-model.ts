export const partnerRoles = [
  "producer",
  "artist",
  "label",
  "advertiser",
  "sponsor",
  "event_organizer",
  "distributor",
  "supplier",
  "other",
];
export const partnershipBase = "/admin/partnerships";
export const partnershipSections = [
  "agreements",
  "partners",
  "services",
  "offerings",
];
export const label = (s: string) =>
  (
    ({
      partner_pays: "Partner pays MGTV",
      licensing: "MGTV licenses content",
      revenue_share: "Revenue sharing",
      hybrid: "Hybrid arrangement",
    }) as Record<string, string>
  )[s] ?? s.replace(/_/g, " ").replace(/^./, (v) => v.toUpperCase());
export const money = (n: number | null | undefined) =>
  n == null
    ? "Not agreed"
    : new Intl.NumberFormat("en-JM", {
        style: "currency",
        currency: "JMD",
        currencyDisplay: "code",
      }).format(n / 100);
export const subjectPaths: Record<
  string,
  { name: string; permission: string; path: string }
> = {
  movie: {
    name: "Movie",
    permission: "movies.read",
    path: "/admin/content/movies/",
  },
  show: {
    name: "Show",
    permission: "shows.read",
    path: "/admin/content/shows/",
  },
  episode: {
    name: "Episode",
    permission: "shows.read",
    path: "/admin/content/episodes/",
  },
  music: {
    name: "Music",
    permission: "music.read",
    path: "/admin/content/music/",
  },
  event: { name: "Event", permission: "events.read", path: "/admin/events/" },
  artist: {
    name: "Artist",
    permission: "artists.read",
    path: "/admin/music-library/artists/",
  },
  album: {
    name: "Album",
    permission: "albums.read",
    path: "/admin/music-library/albums/",
  },
  podcast: {
    name: "Podcast",
    permission: "podcasts.read",
    path: "/admin/podcasts/",
  },
  product: {
    name: "Shop product",
    permission: "commerce.read",
    path: "/admin/commerce/products/",
  },
  sponsor: {
    name: "Sponsor",
    permission: "sponsors.read",
    path: "/admin/sponsors/",
  },
  advertiser: {
    name: "Advertiser",
    permission: "advertising.read",
    path: "/admin/advertising/advertisers/",
  },
};
export function emptyPartnership(kind: string): any {
  if (kind === "partners")
    return {
      name: "",
      entityType: "organization",
      roles: ["producer"],
      description: "",
      contactEmail: "",
      status: "active",
    };
  if (kind === "services")
    return {
      key: "",
      name: "",
      description: "",
      eligibleRoles: ["producer"],
      unit: "title",
      pricing: "negotiated",
      unitAmountMinor: null,
      cadence: "once",
      availability: "planned",
      fulfillment: "manual",
      evidenceRequirement: "",
      verificationReference: "",
      dependencies: [],
      exclusions: "",
    };
  if (kind === "offerings")
    return {
      name: "",
      description: "",
      eligibleRoles: ["producer"],
      lines: [],
    };
  return {
    name: "",
    partnerId: "",
    offeringId: null,
    mode: "partner_pays",
    startsAt: null,
    endsAt: null,
    territories: [],
    rightsTerms: "",
    partnerResponsibilities: "",
    mgtvResponsibilities: "",
    taxTreatment: "pending",
    taxMinor: null,
    licenseFeeMinor: null,
    partnerShareBps: null,
    revenueBasis: "",
    deductions: "",
    settlementSchedule: "",
    lines: [],
    subjects: [],
  };
}
export function cleanPartnership(kind: string, body: any) {
  const blank = emptyPartnership(kind);
  return Object.fromEntries(
    Object.keys(blank).map((key) => [key, body[key] ?? blank[key]]),
  );
}
export const emptyLine = () => ({
  serviceId: "",
  quantity: 1,
  periods: 1,
  unitAmountMinor: null,
  overrideReason: "",
  scope: "",
  dueAt: null,
});
