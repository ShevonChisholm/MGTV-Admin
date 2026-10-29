import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import MediaIcon from "./MediaIcon";
import "./EpisodeSelector.css";
export default function EpisodeSelector({
  onRows,
  onError,
}: {
  onRows: (rows: any[]) => void;
  onError: (message: string) => void;
}) {
  const [shows, setShows] = useState<any[]>([]),
    [seasons, setSeasons] = useState<any[]>([]),
    [episodes, setEpisodes] = useState<any[]>([]),
    [showId, setShowId] = useState(""),
    [seasonId, setSeasonId] = useState(""),
    [q, setQ] = useState(""),
    [query, setQuery] = useState(""),
    [episodeQuery, setEpisodeQuery] = useState(""),
    [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const callbacks = useRef({ onRows, onError }),
    serial = useRef(0);
  callbacks.current = { onRows, onError };
  useEffect(() => {
    const generation = ++serial.current;
    setBusy(true);
    setError("");
    callbacks.current.onError("");
    setEpisodes([]);
    callbacks.current.onRows([]);
    const path = seasonId
      ? `/admin/seasons/${seasonId}/episodes`
      : showId
        ? `/admin/shows/${showId}/seasons`
        : `/admin/shows?limit=24&q=${encodeURIComponent(query)}`;
    void api(path)
      .then((p) => {
        if (generation !== serial.current) return;
        if (seasonId) setEpisodes(p.items);
        else if (showId) setSeasons(p.items);
        else {
          setShows(p.items);
          setCursor(p.nextCursor);
        }
      })
      .catch((e) => {
        if (generation === serial.current) {
          setError(e.message);
          callbacks.current.onError(e.message);
        }
      })
      .finally(() => {
        if (generation === serial.current) setBusy(false);
      });
    return () => {
      serial.current++;
    };
  }, [showId, seasonId, query]);
  useEffect(() => {
    callbacks.current.onRows(
      episodes.filter((r) =>
        (r.draft?.title ?? "")
          .toLowerCase()
          .includes(episodeQuery.trim().toLowerCase()),
      ),
    );
  }, [episodes, episodeQuery]);
  async function more() {
    const generation = serial.current;
    setBusy(true);
    setError("");
    try {
      const p = await api(
        `/admin/shows?limit=24&q=${encodeURIComponent(query)}&cursor=${encodeURIComponent(cursor ?? "")}`,
      );
      if (generation !== serial.current) return;
      setShows((old) => [
        ...old,
        ...p.items.filter((r: any) => !old.some((x) => x.id === r.id)),
      ]);
      setCursor(p.nextCursor);
    } catch (e) {
      if (generation === serial.current) {
        setError((e as Error).message);
        callbacks.current.onError((e as Error).message);
      }
    } finally {
      if (generation === serial.current) setBusy(false);
    }
  }
  return (
    <section
      className="episode-selector"
      aria-label="Find an episode"
      aria-busy={busy}
    >
      <p>
        <MediaIcon name="series" size={18} />
        Choose the show, then its season. Episodes keep their own publication
        and access rules.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShowId("");
          setSeasonId("");
          setSeasons([]);
          setQuery(q.trim());
        }}
      >
        <input
          className="input"
          aria-label="Search episode shows"
          value={q}
          maxLength={200}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" disabled={busy}>
          Find show
        </button>
      </form>
      <div className="episode-selector-fields">
        <label>
          Episode show
          <select
            className="input"
            value={showId}
            disabled={busy}
            onChange={(e) => {
              setShowId(e.target.value);
              setSeasonId("");
              setSeasons([]);
              setEpisodeQuery("");
            }}
          >
            <option value="">Choose a show</option>
            {shows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.draft?.title ?? r.title}
              </option>
            ))}
          </select>
        </label>
        {showId && (
          <label>
            Episode season
            <select
              className="input"
              value={seasonId}
              disabled={busy}
              onChange={(e) => {
                setSeasonId(e.target.value);
                setEpisodeQuery("");
              }}
            >
              <option value="">Choose a season</option>
              {seasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number ? `Season ${r.number} · ` : ""}
                  {r.draft?.title ?? r.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!showId && cursor && (
        <button className="btn" disabled={busy} onClick={() => void more()}>
          More shows
        </button>
      )}
      {seasonId && (
        <label>
          Filter episodes in this season
          <input
            className="input"
            value={episodeQuery}
            onChange={(e) => setEpisodeQuery(e.target.value)}
          />
        </label>
      )}
      {busy && (
        <p role="status">
          Loading {seasonId ? "episodes" : showId ? "seasons" : "shows"}…
        </p>
      )}
      {!busy &&
        !error &&
        (showId && !seasonId && !seasons.length ? (
          <p>No seasons are available for this show.</p>
        ) : seasonId && !episodes.length ? (
          <p>No episodes are available in this season.</p>
        ) : !showId && !shows.length ? (
          <p>No shows match this search.</p>
        ) : null)}
    </section>
  );
}
