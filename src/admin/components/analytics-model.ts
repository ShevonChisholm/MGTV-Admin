export type Daily = {
  day: string;
  active: number;
  views: number;
  seconds: number;
};
export type Metric = "views" | "active" | "minutes";
export type Activity = {
  id: string;
  action: string;
  resourceId: string;
  createdAt: string;
  actor: string;
};
export type AnalyticsReport = {
  source: string;
  timezone: string;
  generatedAt: string;
  developmentAvailable: boolean;
  range: {
    days: number;
    start: string;
    endExclusive: string;
    includesPartialToday: boolean;
  };
  summary: {
    views: number;
    active: number;
    seconds: number;
    sessions: number;
    completed: number;
    availableFrom: string | null;
    averageDailyActive: number;
    averageWatchSeconds: number;
    completionPercent: number | null;
  };
  daily: Daily[];
  top: { kind: string; id: string; title: string; views: number }[];
  devices: { device: string; sessions: number }[];
  retention: {
    month: string;
    previous: number;
    retained: number;
    percent: number | null;
  }[];
  inventory: { kind: string; count: number }[];
  operations: {
    openReports: number;
    campaignsInReview: number;
    scheduledEvents: number;
    activeCustomerAccounts: number;
    paidSandboxOrders: number;
  };
  activity: Activity[];
  definitions: Record<string, string>;
};
export const count = (n: number) =>
  new Intl.NumberFormat("en-JM", { maximumFractionDigits: 0 }).format(n);
export const decimal = (n: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("en-JM", { maximumFractionDigits }).format(n);
export const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (v) => v.toUpperCase());
export const dayLabel = (s: string) =>
  new Date(s + "T12:00:00Z").toLocaleDateString("en-JM", {
    month: "short",
    day: "numeric",
    timeZone: "America/Jamaica",
  });
export const momentLabel = (s: string) =>
  new Date(s).toLocaleString("en-JM", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Jamaica",
  });
export const lastDay = (s: string) =>
  new Date(Date.parse(s + "T12:00:00Z") - 86400000).toISOString().slice(0, 10);
export const metricLabel: Record<Metric, string> = {
  views: "Qualified views",
  active: "Active viewers",
  minutes: "Credited minutes",
};
export const metricValue = (d: Daily, m: Metric) =>
  m === "minutes" ? d.seconds / 60 : d[m];
export const durationLabel = (seconds: number) =>
  seconds >= 3600
    ? decimal(seconds / 3600) + " hrs"
    : decimal(seconds / 60) + " min";
export const destinations: Record<
  string,
  { path: string; permission: string; icon: string; label: string }
> = {
  movie: {
    path: "/admin/content/movies/",
    permission: "movies.read",
    icon: "film",
    label: "Movies",
  },
  show: {
    path: "/admin/content/shows/",
    permission: "shows.read",
    icon: "series",
    label: "Shows",
  },
  episode: {
    path: "/admin/content",
    permission: "shows.read",
    icon: "series",
    label: "Episodes",
  },
  music: {
    path: "/admin/content/music/",
    permission: "music.read",
    icon: "audio",
    label: "Music",
  },
  track: {
    path: "/admin/content/music",
    permission: "music.read",
    icon: "audio",
    label: "Audio tracks",
  },
  music_video: {
    path: "/admin/content/music",
    permission: "music.read",
    icon: "video",
    label: "Music videos",
  },
  event: {
    path: "/admin/events/",
    permission: "events.read",
    icon: "calendar",
    label: "Events",
  },
  sports: {
    path: "/admin/content/sports/",
    permission: "sports.read",
    icon: "sport",
    label: "Sports",
  },
  artist: {
    path: "/admin/music-library/artists/",
    permission: "artists.read",
    icon: "artist",
    label: "Artists",
  },
  album: {
    path: "/admin/music-library/albums/",
    permission: "albums.read",
    icon: "album",
    label: "Albums",
  },
  playlist: {
    path: "/admin/music-library/playlists/",
    permission: "playlists.read",
    icon: "playlist",
    label: "Playlists",
  },
  podcast: {
    path: "/admin/podcasts/",
    permission: "podcasts.read",
    icon: "podcast",
    label: "Podcasts",
  },
  news: {
    path: "/admin/news/",
    permission: "news.read",
    icon: "file",
    label: "News & articles",
  },
  lifestyle: {
    path: "/admin/lifestyle/",
    permission: "lifestyle.read",
    icon: "culture",
    label: "Lifestyle & culture",
  },
};
export function contentLink(kind: string, id?: string) {
  const d = destinations[kind];
  if (!d) return null;
  return {
    ...d,
    href: id && d.path.endsWith("/") ? d.path + id : d.path.replace(/\/$/, ""),
  };
}
export function activityLink(a: Activity) {
  if (!a.resourceId) return null;
  const prefix = a.action.split(".");
  const d = contentLink(prefix[0], a.resourceId);
  if (d && prefix[0] !== "episode") return d;
  if (
    prefix[0] === "partnerships" &&
    ["partners", "services", "offerings", "agreements"].includes(prefix[1])
  )
    return {
      href: "/admin/partnerships/" + prefix[1] + "/" + a.resourceId,
      permission: "partnerships.read",
    };
  if (prefix[0] === "users" && ["staff", "customer"].includes(prefix[1]))
    return {
      href:
        "/admin/" +
        (prefix[1] === "staff" ? "users" : "customers") +
        "/" +
        a.resourceId,
      permission: prefix[1] === "staff" ? "staff.read" : "customers.read",
    };
  return null;
}
export function actionLabel(action: string) {
  const words = action.split(".");
  const known: Record<string, string> = {
    movie: "Movie",
    show: "Show",
    music: "Music",
    event: "Event",
    sports: "Sports",
    auth: "Authentication",
    access: "Access",
    preview: "Preview",
    partnerships: "Partnership",
    users: "Account",
  };
  return [
    known[words[0]] ?? titleCase(words[0]),
    ...words.slice(1).map(titleCase),
  ].join(" / ");
}
