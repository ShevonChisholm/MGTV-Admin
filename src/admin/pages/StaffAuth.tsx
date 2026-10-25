import LoadingState, { ErrorState } from "../components/LoadingState";
import { useStaffSessionVerified } from "../api/staff-session-context";
import React, { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
type Action =
  "sign-in" | "accept-invite" | "forgot-password" | "reset-password";
export default function StaffAuth({
  onAuthenticated,
  action = "sign-in",
}: {
  onAuthenticated?: () => Promise<void>;
  action?: Action;
}) {
  const verified = useStaffSessionVerified();
  const [email, setEmail] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [confirm, setConfirm] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [challenge, setChallenge] = useState<any>(null),
    [recovery, setRecovery] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "",
  );
  const errorRef = useRef<HTMLDivElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (window.location.hash)
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [challenge, recovery]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (
        (action === "accept-invite" || action === "reset-password") &&
        password !== confirm
      )
        throw Error("The passwords do not match.");
      if (action === "sign-in") {
        const result = await api(
          challenge ? "/admin/mfa/verify" : "/admin/login",
          "POST",
          challenge
            ? { challengeToken: challenge.challengeToken, code }
            : { email, password },
        );
        setPassword("");
        setCode("");
        if (result.mfaRequired) {
          setChallenge(result);
          return;
        }
        setChallenge(null);
        if (result.recoveryCodes) {
          setRecovery(result.recoveryCodes);
          return;
        }
        await onAuthenticated?.();
      } else {
        const result = await api(
          "/admin/auth/" + action,
          "POST",
          action === "forgot-password" ? { email } : { token, password },
        );
        setPassword("");
        setNotice(result.message);
        setConfirm("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
      setTimeout(() => errorRef.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }
  const field = (label: string, node: React.ReactNode) => (
    <label style={{ display: "grid", gap: 6 }}>
      {label}
      {node}
    </label>
  );
  if (verified && action === "sign-in")
    return (
      <section className="staff-auth">
        <LoadingState label="Loading your workspace…" variant="form" />
        {error && <ErrorState message={error} />}{" "}
        {onAuthenticated && (
          <button
            className="btn"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await onAuthenticated();
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "The workspace could not be loaded.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Retry workspace
          </button>
        )}
      </section>
    );
  return (
    <section className="staff-auth">
      <div className="staff-brand">
        MGTV<span>THE PEOPLE BEHIND THE STORIES</span>
      </div>
      {action === "sign-in" && (
        <ol className="staff-steps" aria-label="Staff sign-in progress">
          <li
            aria-current={!challenge && !recovery.length ? "step" : undefined}
          >
            01 · Account
          </li>
          <li aria-current={challenge ? "step" : undefined}>
            02 · Authenticator
          </li>
          <li aria-current={recovery.length ? "step" : undefined}>
            03 · Secure access
          </li>
        </ol>
      )}
      <h1 tabIndex={-1} ref={heading}>
        {recovery.length
          ? "Save your recovery codes"
          : challenge
            ? challenge.enrollmentSecret
              ? "Set up staff two-factor authentication"
              : "Verify your staff sign-in"
            : action === "sign-in"
              ? "Staff sign-in"
              : action === "accept-invite"
                ? "Accept your staff invitation"
                : action === "forgot-password"
                  ? "Recover staff access"
                  : "Reset your staff password"}
      </h1>
      <p style={{ margin: "12px 0", color: "var(--text-secondary)" }}>
        Staff access is separate from customer accounts. An authenticator code
        is required before entering the portal.
      </p>
      {error && (
        <div
          role="alert"
          tabIndex={-1}
          ref={errorRef}
          style={{
            margin: "16px 0",
            padding: 14,
            border: "1px solid var(--red)",
            borderRadius: 10,
            color: "var(--red)",
          }}
        >
          {error}
        </div>
      )}
      {!token &&
        (action === "accept-invite" || action === "reset-password") && (
          <p
            role="alert"
            style={{
              padding: 14,
              border: "1px solid var(--yellow)",
              borderRadius: 10,
            }}
          >
            Open the complete link from your staff email to continue.
          </p>
        )}
      {notice && (
        <p role="status" style={{ margin: "12px 0" }}>
          {notice}
        </p>
      )}
      {recovery.length ? (
        <>
          <p>
            Store these codes somewhere private. Each works once if you lose
            your authenticator. They will not be shown again.
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              padding: 16,
              border: "1px solid var(--border)",
              margin: "16px 0",
            }}
          >
            {recovery.join("\n")}
          </pre>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void onAuthenticated?.()
                .catch((e) => setError(e.message))
                .finally(() => {
                  setRecovery([]);
                  setBusy(false);
                });
            }}
          >
            I have saved my recovery codes
          </button>
        </>
      ) : (
        <form
          onSubmit={(e) => void submit(e)}
          style={{ display: "grid", gap: 16, marginTop: 18 }}
        >
          <fieldset
            disabled={busy}
            style={{
              display: "grid",
              gap: 16,
              border: 0,
              padding: 0,
              minWidth: 0,
            }}
          >
            {!challenge &&
              (action === "sign-in" || action === "forgot-password") &&
              field(
                "Staff email",
                <input
                  className="input"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />,
              )}
            {!challenge &&
              action !== "forgot-password" &&
              field(
                action === "sign-in"
                  ? "Password"
                  : "New password (15–128 characters)",
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    action === "sign-in" ? "current-password" : "new-password"
                  }
                  required
                  minLength={action === "sign-in" ? 12 : 15}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />,
              )}
            {!challenge && action !== "forgot-password" && (
              <button
                type="button"
                className="btn btn-ghost"
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            )}
            {!challenge &&
              (action === "accept-invite" || action === "reset-password") &&
              field(
                "Confirm new password",
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={15}
                  maxLength={128}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />,
              )}
            {challenge?.enrollmentSecret && (
              <div>
                <p>
                  Add this setup key to your authenticator app, then enter its
                  six-digit code.
                </p>
                <code
                  style={{
                    display: "block",
                    padding: 12,
                    marginTop: 8,
                    wordBreak: "break-all",
                    border: "1px solid var(--border)",
                  }}
                >
                  {challenge.enrollmentSecret}
                </code>
              </div>
            )}
            {challenge &&
              field(
                challenge.enrollmentSecret
                  ? "Authenticator code"
                  : "Authenticator or recovery code",
                <input
                  className="input"
                  autoComplete="one-time-code"
                  required
                  maxLength={64}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />,
              )}
            <button
              className="btn btn-primary"
              disabled={
                busy ||
                (action !== "sign-in" && action !== "forgot-password" && !token)
              }
            >
              {busy
                ? "Checking…"
                : challenge
                  ? "Verify code"
                  : action === "sign-in"
                    ? "Continue"
                    : action === "forgot-password"
                      ? "Request recovery instructions"
                      : "Save password"}
            </button>
            {challenge && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setChallenge(null);
                  setCode("");
                  setError("");
                }}
              >
                Start sign-in again
              </button>
            )}
          </fieldset>
        </form>
      )}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}
      >
        <a href="/admin/auth/sign-in">Staff sign-in</a>
        <a href="/admin/auth/forgot-password">Forgot password?</a>
      </div>
      <small style={{ display: "block", marginTop: 16 }}>
        Staff sign-in requires an authenticator or a recovery code. Contact your
        administrator if you lose access to both.
      </small>
    </section>
  );
}
