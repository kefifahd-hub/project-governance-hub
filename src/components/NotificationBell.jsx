import { Bell } from "lucide-react";
import ActivityNotifications from "./ActivityNotifications";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

/**
 * Notification bell for the top of the welcome screen. The activity feed
 * lives inside this popover instead of taking up a section on the page.
 */
export default function NotificationBell({ items = [] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications (${items.length})`}
          style={{
            position: "relative",
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Bell size={19} color="#94a3b8" strokeWidth={1.9} />
          {items.length > 0 && (
            <span style={{
              position: "absolute", top: 6, right: 6,
              minWidth: 16, height: 16, padding: "0 4px",
              borderRadius: 8, background: "#10b981",
              color: "#04140f", fontSize: 10, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 0 2px #060a13",
            }}>
              {items.length > 9 ? "9+" : items.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-[320px] max-w-[calc(100vw-24px)] p-0"
        style={{ background: "#0f172a", borderColor: "rgba(202,220,252,0.15)" }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", borderBottom: "1px solid rgba(202,220,252,0.1)",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "1px" }}>
            Notifications
          </span>
          <span style={{ fontSize: 11, color: "#64748b" }}>{items.length}</span>
        </div>
        <div style={{ maxHeight: "55vh", overflowY: "auto", padding: items.length ? 10 : 0 }}>
          {items.length === 0 ? (
            <div style={{ padding: "16px 14px", fontSize: 12, color: "#475569" }}>
              No activity yet — reports, risks and change requests on your projects will appear here.
            </div>
          ) : (
            <ActivityNotifications items={items} />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}