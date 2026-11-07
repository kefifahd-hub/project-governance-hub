import { ChevronRight, Plus } from "lucide-react";

const ragColor = (score) => (score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444");

/**
 * Phone-only project list: one compact row per project (name, phase · client,
 * health) so the dashboard stays scannable, with a quick action to start a new one.
 */
export default function ProjectsMobileList({ projects = [], onOpen, onNew }) {
  return (
    <div>
      {projects.length === 0 && (
        <div style={{
          border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 14,
          padding: "22px 16px", textAlign: "center",
          fontSize: 13, color: "#475569", marginBottom: 12,
        }}>
          No projects yet
        </div>
      )}

      {projects.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, overflow: "hidden", marginBottom: 12,
        }}>
          {projects.map((proj, i) => {
            const health = proj.healthScore || 0;
            const color = ragColor(health);
            const initials = proj.projectName?.slice(0, 2).toUpperCase() || "PR";
            const meta = [proj.currentPhase, proj.clientName].filter(Boolean).join(" · ");

            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => onOpen(proj.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  padding: "12px 14px", background: "transparent", border: "none",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.045)" : "none",
                  textAlign: "left", cursor: "pointer", WebkitTapHighlightColor: "transparent",
                  minHeight: 64,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, #0f172a, #1e293b)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: "0.5px",
                }}>
                  {initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.25,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {proj.projectName}
                  </div>
                  <div style={{
                    fontSize: 12, color: "#64748b", marginTop: 2,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {meta || "—"}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: color,
                    boxShadow: `0 0 8px ${color}50`,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{health}</span>
                  <ChevronRight style={{ width: 16, height: 16, color: "#334155" }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onNew}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "13px 18px", borderRadius: 12,
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
          color: "#10b981", fontSize: 14, fontWeight: 600, cursor: "pointer",
          WebkitTapHighlightColor: "transparent", minHeight: 48,
        }}
      >
        <Plus style={{ width: 16, height: 16 }} />
        New Project
      </button>
    </div>
  );
}