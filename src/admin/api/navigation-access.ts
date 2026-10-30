// Visibility follows explicit API read permissions; role names never grant access.
export const navigationPermissions: Record<string, readonly string[]> = {
  dashboard: ["analytics.read"],
  content: ["shows.read", "movies.read", "music.read", "sports.read"],
  lifestyle: ["lifestyle.read"],
  news: ["news.read"],
  podcasts: ["podcasts.read"],
  "music-library": ["artists.read", "albums.read", "playlists.read"],
  media: ["media.read"],
  homepage: ["homepage.read"],
  discovery: ["discovery.read"],
  communications: ["contact.read", "newsletter.read"],
  customers: ["customers.read"],
  notifications: ["notifications.read"],
  moderation: ["moderation.read"],
  partnerships: ["partnerships.read"],
  subscriptions: ["subscriptions.read"],
  events: ["events.read"],
  awards: ["awards.read"],
  sponsors: ["sponsors.read"],
  advertising: ["advertising.read"],
  commerce: ["commerce.read"],
  analytics: ["analytics.read"],
  careers: ["careers.read"],
  onboarding: ["onboarding.read"],
  access: ["access.read"],
  users: ["staff.read"],
  settings: ["settings.read"],
};
export function contentReadPermission(tab: string): string | null {
  return (
    (
      {
        shows: "shows.read",
        movies: "movies.read",
        music: "music.read",
        "music-videos": "music.read",
        audio: "music.read",
        sports: "sports.read",
      } as Record<string, string>
    )[tab] ?? null
  );
}
export function destinationFor(
  id: string,
  permissions: readonly string[],
): string | null {
  if (!navigationPermissions[id]?.some((p) => permissions.includes(p)))
    return null;
  if (id === "content")
    return (
      "/admin/content/" +
      ["shows", "movies", "music-videos", "sports"].find((t) =>
        permissions.includes(contentReadPermission(t)!),
      )!
    );
  if (id === "music-library")
    return (
      "/admin/music-library/" +
      ["artists", "albums", "playlists"].find((t) =>
        permissions.includes(t + ".read"),
      )!
    );
  return "/admin/" + id;
}
export function canOpenWorkspace(
  section: string,
  parts: readonly string[],
  permissions: readonly string[],
): boolean {
  if (section === "content") {
    const permission = contentReadPermission(parts[0] ?? "shows");
    return !!permission && permissions.includes(permission);
  }
  if (section === "music-library" && parts[0])
    return (
      ["artists", "albums", "playlists"].includes(parts[0]) &&
      permissions.includes(parts[0] + ".read")
    );
  return !!destinationFor(section, permissions);
}
export function firstWorkspace(permissions: readonly string[]): string | null {
  for (const id of Object.keys(navigationPermissions)) {
    const path = destinationFor(id, permissions);
    if (path) return path;
  }
  return null;
}
