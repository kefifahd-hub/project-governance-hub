const TYPE_COLORS = {
  report: "#0891b2", risk: "#ef4444", site: "#10b981",
  change: "#f59e0b", action: "#22c55e", schedule: "#2563eb",
};

/**
 * Recent activity rendered as notification cards: type icon, message,
 * relative time and an unread indicator.
 */
export default function ActivityNotifications({ items = [] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((act) => {
        const color = TYPE_COLORS[act.type] || "#475569";

        return (
          <div
            key={act.id}
            style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              background: "rgba(255,255,255,0.022)",
              border: "1px solid rgba(255,255,255,0.055)",
              borderRadius: 12, padding: "11px 13px",
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: `${color}1f`, color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, letterSpacing: "0.4px",
            }}>
              {act.code}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.4 }}>
                {act.text}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                {act.time}
              </div>
            </div>

            <div style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
              background: color, marginTop: 6,
            }} />
          </div>
        );
      })}
    </div>
  );
}