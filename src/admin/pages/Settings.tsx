import React, { useState } from "react"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "22px", marginBottom: 16 }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 18, letterSpacing: "0.01em" }}>{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", alignItems: "start", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginTop: 3 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 7,
  padding: "8px 12px",
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "var(--font-body)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
}

const monoInputStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  letterSpacing: "0.04em",
  color: "var(--accent)",
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: on ? "var(--accent)" : "var(--border)",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "white", transition: "left 0.2s",
      }} />
    </button>
  )
}

export default function Settings() {
  const [email, setEmail] = useState("j.rivera@mgtv.com")
  const [displayName, setDisplayName] = useState("Jordan Rivera")
  const [region, setRegion] = useState("US-East")
  const [notifFlag, setNotifFlag] = useState(true)
  const [notifPublish, setNotifPublish] = useState(true)
  const [notifUser, setNotifUser] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: "28px", maxWidth: 780 }}>
      <Section title="Account">
        <Field label="Display Name">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Email Address" hint="Used for system notifications">
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Portal Region" hint="Affects content CDN defaults">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option>US-East</option>
            <option>US-West</option>
            <option>EU-Central</option>
            <option>AP-Southeast</option>
          </select>
        </Field>
        <Field label="Time Zone">
          <select style={{ ...inputStyle, cursor: "pointer" }}>
            <option>America/New_York (UTC-5)</option>
            <option>America/Los_Angeles (UTC-8)</option>
            <option>Europe/London (UTC+0)</option>
            <option>Asia/Tokyo (UTC+9)</option>
          </select>
        </Field>
      </Section>

      <Section title="Notifications">
        <Field label="Flagged Content Alerts" hint="Notify on new moderation queue items">
          <Toggle on={notifFlag} onToggle={() => setNotifFlag((v) => !v)} />
        </Field>
        <Field label="Content Published" hint="Notify when scheduled content goes live">
          <Toggle on={notifPublish} onToggle={() => setNotifPublish((v) => !v)} />
        </Field>
        <Field label="New User Registrations" hint="Daily digest of new signups">
          <Toggle on={notifUser} onToggle={() => setNotifUser((v) => !v)} />
        </Field>
      </Section>

      <Section title="API Access">
        <Field label="API Key" hint="Read-only. Rotate via platform console.">
          <input
            value="mgtv_sk_live_8Xf2Tz9qLmNpWrK4vYbCdJhA"
            readOnly
            style={monoInputStyle}
          />
        </Field>
        <Field label="Webhook Endpoint" hint="Receives content and moderation events">
          <input defaultValue="https://hooks.mgtv.com/associate/events" style={inputStyle} />
        </Field>
        <Field label="Rate Limit">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--green)" }}>1,000 req / min</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>Standard tier</span>
          </div>
        </Field>
      </Section>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          style={{
            padding: "9px 20px", background: "transparent", border: "1px solid var(--border)",
            borderRadius: 7, color: "var(--text-secondary)", fontSize: 13, fontFamily: "var(--font-sans)", cursor: "pointer",
          }}
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: "9px 22px", background: saved ? "#22c55e" : "var(--accent)",
            border: "none", borderRadius: 7, color: "white", fontSize: 13, fontWeight: 600,
            fontFamily: "var(--font-sans)", cursor: "pointer", transition: "background 0.2s",
          }}
        >
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
