import BrandLogo from "../components/BrandLogo";
import LoadingState from "../components/LoadingState";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useRouter } from "../router";
const destinations = [
  ["movies.read", "Movies", "/admin/content/movies"],
  ["shows.read", "Shows", "/admin/content/shows"],
  ["music.read", "Music", "/admin/content/music"],
  ["media.read", "Media library", "/admin/media"],
  ["news.read", "News & Articles", "/admin/news"],
  ["lifestyle.read", "Lifestyle & Culture", "/admin/lifestyle"],
  ["commerce.read", "Shop & Commerce", "/admin/commerce"],
  ["events.read", "Events", "/admin/events"],
  ["staff.read", "Staff users", "/admin/users"],
  ["onboarding.read", "Staff onboarding", "/admin/onboarding"],
  ["analytics.read", "Analytics", "/admin/analytics"],
  ["settings.read", "Settings", "/admin/settings"],
  ["notifications.read", "Notifications", "/admin/notifications"],
  ["moderation.read", "Moderation", "/admin/moderation"],
  ["access.read", "Roles & Permissions", "/admin/access"],
  ["awards.read", "Awards", "/admin/awards"],
  ["sponsors.read", "Sponsors", "/admin/sponsors"],
  ["advertising.read", "Advertising", "/admin/advertising"],
  ["artists.read", "Artists", "/admin/music-library/artists"],
  ["albums.read", "Albums", "/admin/music-library/albums"],
  ["playlists.read", "Playlists", "/admin/music-library/playlists"],
  ["discovery.read", "Discovery", "/admin/discovery"],
  ["homepage.read", "Homepage", "/admin/homepage"],
  ["contact.read", "Contact & Newsletter", "/admin/communications"],
];
export default function StaffWelcome({
  onCompleted,
}: {
  onCompleted: () => Promise<void>;
}) {
  const { navigate } = useRouter();
  const [data, setData] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const operation = useRef<{ signature: string; key: string } | null>(null);
  async function load() {
    setData(await api("/admin/onboarding/me"));
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your progress could not be loaded.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void run(load);
  }, []);
  async function command(action: string, extra: any = {}) {
    await run(async () => {
      const body = { accessFingerprint: data.accessFingerprint, ...extra },
        signature = JSON.stringify({ action, version: data.version, body });
      if (operation.current?.signature !== signature)
        operation.current = { signature, key: crypto.randomUUID() };
      const result = await api(
        "/admin/onboarding/me/" + action,
        "POST",
        body,
        data.version,
        operation.current.key,
      );
      setData(result);
      operation.current = null;
      if (action === "complete") {
        navigate("/admin/welcome", { replace: true });
        await onCompleted();
      }
    });
  }
  const done = data && (!data.required || data.status === "completed"),
    ready =
      data?.passwordReady &&
      data?.mfaReady &&
      data?.staff.status === "active" &&
      data?.securityAcknowledged &&
      data?.orientationAcknowledged &&
      data?.accessAcknowledged &&
      data?.managerReviewed;
  return (
    <main className="staff-welcome-layout">
      <section className="staff-welcome">
        <div className="staff-brand">
          <BrandLogo width={128} /><span>THE PEOPLE BEHIND THE STORIES</span>
        </div>
        <p className="people-eyebrow">Your MGTV workspace</p>
        <h1>
          {done
            ? "You’re ready to make your mark."
            : "Good stories start with a strong team."}
        </h1>
        <p className="welcome-intro">
          {data ? `Welcome, ${data.staff.displayName}. ` : ""}
          {done
            ? "Your workspace follows the access explicitly assigned to you."
            : "Finish your secure setup, get to know the workspace and confirm your access with your manager."}
        </p>
        {error && (
          <div role="alert" className="access-error">
            {error}{" "}
            <button
              className="btn"
              disabled={busy}
              onClick={() => void run(load)}
            >
              Reload progress
            </button>
          </div>
        )}
        {!data && !error && (
          <LoadingState label="Loading your onboarding…" variant="cards" />
        )}
        {data && !done && (
          <>
            <div className="welcome-checks">
              <span>{data.passwordReady ? "✓" : "○"} Password set</span>
              <span>{data.mfaReady ? "✓" : "○"} Authenticator verified</span>
              <span>
                {data.managerReviewed
                  ? "✓ Access reviewed"
                  : "○ Manager access review pending"}
              </span>
            </div>
            <div className="welcome-steps">
              {data.orientation.map((step: any, index: number) => {
                const completed =
                  step.key === "security"
                    ? data.securityAcknowledged
                    : step.key === "orientation"
                      ? data.orientationAcknowledged
                      : data.accessAcknowledged;
                return (
                  <section className="card welcome-step" key={step.key}>
                    <span className="welcome-number">0{index + 1}</span>
                    <div>
                      <h2>{step.title}</h2>
                      <p>{step.body}</p>
                      {step.key === "access" && (
                        <>
                          <div className="access-chips">
                            {data.permissions.length ? (
                              data.permissions.map((p: string) => (
                                <code key={p}>{p}</code>
                              ))
                            ) : (
                              <span>
                                No resource access assigned yet. Ask your
                                manager to assign the access you need.
                              </span>
                            )}
                          </div>
                          <p>
                            Assigned roles:{" "}
                            {data.roles.length
                              ? data.roles
                                  .map(
                                    (r: any) =>
                                      r.name + (r.active ? "" : " (inactive)"),
                                  )
                                  .join(", ")
                              : "None"}
                          </p>
                        </>
                      )}
                      <button
                        className={completed ? "btn" : "btn btn-primary"}
                        disabled={busy || completed}
                        onClick={() =>
                          void command("acknowledge", {
                            step: step.key,
                            orientationVersion: data.orientationVersion,
                            acknowledged: true,
                          })
                        }
                      >
                        {completed
                          ? "Acknowledged"
                          : "I’ve read and understood this"}
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
            <section className="card welcome-finish">
              <h2>One last check, then you’re in.</h2>
              <p>
                {data.managerReviewed
                  ? "Your manager has reviewed this access. Complete the three steps above to open your workspace."
                  : "Your manager must review your current access before you can enter the workspace. You can save your acknowledgements while you wait."}
              </p>
              <div className="access-actions">
                <button
                  className="btn btn-primary"
                  disabled={busy || !ready}
                  onClick={() => void command("complete")}
                >
                  {busy ? "Saving…" : "Finish onboarding"}
                </button>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => void run(load)}
                >
                  Check for updates
                </button>
              </div>
            </section>
          </>
        )}
        {done && (
          <section className="card welcome-finish">
            <h2>Choose where to begin</h2>
            {data.status === "exempt" && (
              <p>
                Your account predates this onboarding workflow; no completion is
                claimed or required.
              </p>
            )}
            <div className="access-actions">
              {destinations
                .filter(([p]) => data.permissions.includes(p))
                .map(([p, label, path]) => (
                  <button
                    key={p}
                    className="btn btn-primary"
                    onClick={() => navigate(path)}
                  >
                    {label}
                  </button>
                ))}
              {!destinations.some(([p]) => data.permissions.includes(p)) && (
                <p>
                  No workspace is assigned yet. Ask your manager to review your
                  access.
                </p>
              )}
            </div>
          </section>
        )}
        <footer className="welcome-footer">
          <span>
            Your staff account stays separate from your customer account.
          </span>
          <button
            className="btn"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await api("/admin/logout", "POST");
              })
            }
          >
            Sign out
          </button>
        </footer>
      </section>
    </main>
  );
}
