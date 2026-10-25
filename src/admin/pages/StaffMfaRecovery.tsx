import { useRef, useState } from "react";
import { api } from "../api/client";

export default function StaffMfaRecovery({
  id,
  disabled,
  onChanged,
}: {
  id: string;
  disabled: boolean;
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [reason, setReason] = useState(""),
    [reference, setReference] = useState(""),
    [verified, setVerified] = useState(false),
    [password, setPassword] = useState(""),
    [code, setCode] = useState("");
  const request = useRef<{ signature: string; key: string } | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const details = {
      reason: reason.trim(),
      reference: reference.trim(),
      identityVerified: verified,
    };
    const signature = JSON.stringify(details);
    if (request.current?.signature !== signature)
      request.current = { signature, key: crypto.randomUUID() };
    try {
      const result = await api(
        `/admin/staff/${id}/auth/mfa-recovery`,
        "POST",
        { ...details, password, code },
        undefined,
        request.current.key,
      );
      setNotice(result.message);
      setOpen(false);
      setPassword("");
      setCode("");
      setReason("");
      setReference("");
      setVerified(false);
      request.current = null;
      await onChanged();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Recovery could not be authorized.",
      );
    } finally {
      setBusy(false);
      setPassword("");
      setCode("");
    }
  }
  return (
    <section
      className="card"
      style={{ padding: 18, marginTop: 24 }}
      aria-label="Staff authenticator recovery"
    >
      <h3>Lost authenticator and recovery codes</h3>
      <p style={{ marginTop: 8, color: "var(--text-secondary)" }}>
        Only use this after verifying this colleague’s identity through your
        approved staff process. Recovery closes every staff session and requires
        a new password and authenticator.
      </p>
      {notice && (
        <p role="status" style={{ marginTop: 12 }}>
          {notice}
        </p>
      )}
      {!open ? (
        <button
          className="btn"
          disabled={disabled || busy}
          style={{ marginTop: 16 }}
          onClick={() => {
            setOpen(true);
            setNotice("");
          }}
        >
          Review staff recovery
        </button>
      ) : (
        <form onSubmit={submit} style={{ marginTop: 16 }}>
          <fieldset
            disabled={disabled || busy}
            style={{
              border: 0,
              padding: 0,
              minWidth: 0,
              display: "grid",
              gap: 16,
              maxWidth: 640,
            }}
          >
            <label>
              Identity-check case or reference
              <input
                className="input"
                required
                minLength={3}
                maxLength={200}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
            <label>
              Reason and verification method
              <textarea
                className="input"
                required
                minLength={10}
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <small>
              Record the verification method and case reference. Do not enter
              identity documents, passwords or recovery codes in the reason.
            </small>
            <label style={{ display: "flex", gap: 10, alignItems: "start" }}>
              <input
                type="checkbox"
                required
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
              />
              I verified this colleague’s identity and authorize revoking their
              sessions and old MFA credentials.
            </label>
            <label>
              Your staff password
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                required
                minLength={15}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              Your current authenticator code
              <input
                className="input"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary" disabled={!verified || busy}>
                {busy
                  ? "Authorizing…"
                  : "Authorize recovery and revoke sessions"}
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPassword("");
                  setCode("");
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
