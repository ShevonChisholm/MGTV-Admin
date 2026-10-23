import { useStore } from "../store/store"
import { useOps } from "../store/ops/ops"
import { ROLES } from "../store/ops/types"
import type { Role } from "../store/ops/types"

export default function TopBar({ onMenu }: { onMenu: () => void }) {
  const { resetDemo, toast } = useStore()
  const { resetOps, actingRole, setActingRole } = useOps()
  return (
    <header
      style={{
        minHeight: 52, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "6px 20px", background: "var(--sidebar)",
        position: "sticky", top: 0, zIndex: 10, flexShrink: 0, gap: 10,
      }}
    >
      <button className="btn menu-toggle" onClick={onMenu} aria-label="Open navigation menu">
        Menu
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)" }}>
        <span style={{ padding: "3px 9px", borderRadius: 999, border: "1px solid var(--border-light)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
          Local prototype · data saved in this browser only
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }} title="Demonstrates denied-access states with provisional example roles">
          Viewing as
          <select className="input" style={{ minHeight: 30, padding: "3px 8px", width: "auto", fontSize: 12.5 }} value={actingRole} onChange={(e) => { setActingRole(e.target.value as Role); toast("info", `Now viewing as ${e.target.value} (provisional example role).`) }}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <button
          className="btn btn-sm"
          onClick={() => {
            resetDemo()
            resetOps()
            toast("info", "Demo data reset to the original seed content.")
          }}
        >
          Reset demo data
        </button>
        <div
          className="topbar-search"
          title="Global search is unavailable in this prototype"
          style={{ display: "flex", alignItems: "center", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, padding: "0 12px", width: 190, minHeight: 32 }}
        >
          <input
            disabled
            aria-label="Search platform (unavailable in this prototype)"
            placeholder="Search unavailable"
            style={{ background: "none", border: "none", outline: "none", fontSize: 12.5, color: "var(--text-muted)", width: "100%" }}
          />
        </div>
      </div>
    </header>
  )
}
