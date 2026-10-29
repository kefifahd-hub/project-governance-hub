import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import DailyPrincipleBanner from "./DailyPrincipleBanner";
import useWelcomeSummary from "@/hooks/useWelcomeSummary";
import { useIsMobile } from "@/hooks/use-mobile";

const TYPE_COLORS = {
  report: "#0891b2", risk: "#ef4444", site: "#10b981",
  change: "#f59e0b", action: "#22c55e", schedule: "#2563eb",
};

const RAG_COLORS = { green: "#22c55e", amber: "#f59e0b", red: "#ef4444" };

export default function PlatformWelcome({ projects = [] }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { stats, activity } = useWelcomeSummary(projects);
  const [loaded, setLoaded] = useState(false);
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const [hoveredProject, setHoveredProject] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setLoaded(true);
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const greeting = () => {
    const h = time.getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  const getWeekNumber = (d) => {
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  };

  const ragDot = (rag, size = 10) => (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: RAG_COLORS[rag] || "#475569",
      boxShadow: `0 0 ${size}px ${RAG_COLORS[rag] || "#475569"}40`,
      flexShrink: 0,
    }} />
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060a13",
      color: "#e2e8f0",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle grid */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.025,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
        pointerEvents: "none",
      }} />
      {/* Top-right glow */}
      <div style={{
        position: "fixed", top: -300, right: -200, width: 800, height: 800,
        background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 16px" : "0 40px" }}>

        {/* HERO HEADER */}
        <header style={{
          paddingTop: isMobile ? 20 : 60, paddingBottom: isMobile ? 26 : 48,
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(-20px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-end", flexWrap: "wrap", gap: isMobile ? 20 : 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: isMobile ? 14 : 24 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "linear-gradient(135deg, #10b981 0%, #2563eb 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                  boxShadow: "0 8px 32px rgba(16,185,129,0.25)",
                }}>⚡</div>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: "#10b981",
                    textTransform: "uppercase", letterSpacing: "2px",
                  }}>
                    Project Governance Hub
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.5px", marginTop: 2 }}>
                    PMO Platform · Extranet
                  </div>
                </div>
              </div>

              <h1 style={{
                fontSize: isMobile ? 27 : 42, fontWeight: 300, color: "#f1f5f9",
                margin: 0, lineHeight: 1.2, letterSpacing: "-0.5px",
              }}>
                {greeting()}, <span style={{ fontWeight: 600 }}>{user?.full_name?.split(' ')[0] || 'there'}</span>
              </h1>
              <p style={{ fontSize: 17, color: "#64748b", margin: "10px 0 0 0", fontWeight: 400 }}>
                {time.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                <span style={{ color: "#334155" }}> · </span>
                CW{String(getWeekNumber(time)).padStart(2, "0")}
              </p>
            </div>

            {/* Right column: stats + daily principle banner */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "stretch" : "flex-end", gap: 10 }}>
              <div style={{ display: "flex", gap: isMobile ? 12 : 24, flexWrap: "wrap", justifyContent: isMobile ? "space-between" : "flex-end" }}>
                {stats.map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ maxWidth: 520, width: "100%" }}>
                <DailyPrincipleBanner />
              </div>
            </div>
          </div>
        </header>

        {/* DIVIDER */}
        <div style={{
          height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.2) 50%, transparent 100%)",
          marginBottom: isMobile ? 24 : 32,
        }} />

        {/* SECTION: YOUR PROJECTS */}
        <section style={{
          marginBottom: 48,
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{
              fontSize: 13, fontWeight: 600, color: "#475569",
              margin: 0, textTransform: "uppercase", letterSpacing: "1.5px",
            }}>
              Your Projects
            </h2>
            <button
              onClick={() => navigate(createPageUrl("NewProject"))}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)",
                background: "rgba(16,185,129,0.08)", color: "#10b981",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              + New Project
            </button>
          </div>

          {/* Project Cards from DB */}
          {projects.map((proj) => {
            const isHovered = hoveredProject === proj.id;
            const healthScore = proj.healthScore || 0;
            const ragColor = healthScore >= 70 ? "#22c55e" : healthScore >= 40 ? "#f59e0b" : "#ef4444";
            const ragLabel = healthScore >= 70 ? "GREEN" : healthScore >= 40 ? "AMBER" : "RED";

            return (
              <div
                key={proj.id}
                onMouseEnter={() => setHoveredProject(proj.id)}
                onMouseLeave={() => setHoveredProject(null)}
                onClick={() => navigate(createPageUrl(`Home?id=${proj.id}`))}
                style={{
                  background: isHovered ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
                  border: `1px solid ${isHovered ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: 20, padding: isMobile ? 18 : 32, cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform: isHovered ? "translateY(-2px)" : "none",
                  boxShadow: isHovered ? "0 12px 48px rgba(0,0,0,0.3)" : "none",
                  marginBottom: 16, position: "relative", overflow: "hidden",
                }}
              >
                {/* Active indicator bar */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                  background: proj.status === "Active" ? "linear-gradient(180deg, #10b981, #2563eb)" : "#334155",
                  borderRadius: "3px 0 0 3px",
                }} />

                {/* Row 1: Header */}
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: isMobile ? 16 : 24, flexWrap: "wrap", gap: isMobile ? 14 : 16 }}>
                  <div style={{ display: "flex", gap: isMobile ? 12 : 16, alignItems: "flex-start" }}>
                    <div style={{
                      width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius: 14,
                      background: "linear-gradient(135deg, #0f172a, #1e293b)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: isMobile ? 13 : 16, fontWeight: 800, color: "#10b981", letterSpacing: "1px", flexShrink: 0,
                    }}>
                      {proj.projectName?.slice(0, 2).toUpperCase() || "PR"}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 600, color: "#f1f5f9", margin: 0, lineHeight: 1.3 }}>{proj.projectName}</h3>
                        <span style={{
                          padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: "rgba(16,185,129,0.12)", color: "#10b981",
                          textTransform: "uppercase", letterSpacing: "0.5px",
                        }}>{proj.currentPhase}</span>
                        <span style={{
                          padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: "rgba(37,99,235,0.12)", color: "#60a5fa",
                        }}>{proj.clientName}</span>
                      </div>
                      <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0 0" }}>{proj.projectType}</p>
                      <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>
                        {proj.startDate && `Start: ${new Date(proj.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                        {proj.startDate && proj.targetCompletion && " · "}
                        {proj.targetCompletion && `Target: ${new Date(proj.targetCompletion).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                      </div>
                    </div>
                  </div>

                  {/* RAG Cluster */}
                  <div style={{ display: "flex", gap: isMobile ? 0 : 16, alignItems: "center", justifyContent: isMobile ? "space-between" : "flex-start", width: isMobile ? "100%" : "auto", paddingTop: isMobile ? 6 : 0 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: "50%",
                        border: `2.5px solid ${ragColor}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 0 20px ${ragColor}20`,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: ragColor }}>{ragLabel}</span>
                      </div>
                      <div style={{ fontSize: 9, color: "#475569", marginTop: 4, fontWeight: 600, textTransform: "uppercase" }}>Overall</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0" }}>{healthScore}</div>
                      <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>Health</div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Phase: {proj.currentPhase}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{proj.status}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      width: loaded ? `${healthScore}%` : "0%",
                      background: "linear-gradient(90deg, #10b981, #2563eb)",
                      transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s",
                      boxShadow: "0 0 12px rgba(16,185,129,0.3)",
                    }} />
                  </div>
                </div>

                {/* Key metrics */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: isMobile ? 8 : 16,
                  borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: isMobile ? 14 : 20,
                }}>
                  {[
                    { label: "Budget", value: proj.totalBudgetEurM ? `€${proj.totalBudgetEurM}M` : "—", strong: true },
                    { label: "Type", value: proj.projectType || "—" },
                    { label: "Owner", value: proj.projectOwner || "—" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      style={isMobile
                        ? { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }
                        : undefined}
                    >
                      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", flexShrink: 0 }}>{m.label}</div>
                      <div style={{
                        fontSize: m.strong ? 18 : 14, fontWeight: 700, color: "#e2e8f0",
                        marginTop: isMobile ? 0 : 2,
                        textAlign: isMobile ? "right" : "left",
                        wordBreak: "break-word",
                      }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Bottom bar */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  flexWrap: "wrap", gap: isMobile ? 10 : 0,
                  marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.03)",
                }}>
                  <span style={{ fontSize: 12, color: "#475569" }}>
                    Updated: <span style={{ color: "#94a3b8" }}>{new Date(proj.updated_date).toLocaleDateString("en-GB")}</span>
                  </span>
                  <div style={{
                    padding: "8px 20px", borderRadius: 8,
                    background: isHovered ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                    color: isHovered ? "#10b981" : "#64748b",
                    fontSize: 13, fontWeight: 600,
                    transition: "all 0.2s ease",
                    border: `1px solid ${isHovered ? "rgba(16,185,129,0.3)" : "transparent"}`,
                  }}>
                    Open Project →
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state / add another */}
          <div style={{
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 20, padding: isMobile ? "26px 18px" : "40px 32px", textAlign: "center",
            cursor: "pointer",
          }}
            onClick={() => navigate(createPageUrl("NewProject"))}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📁</div>
            <div style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>Add another project</div>
            <div style={{ fontSize: 12, color: "#1e293b", marginTop: 4 }}>
              Start a new project governance setup for your next capital project
            </div>
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section style={{
          marginBottom: 60,
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
        }}>
          <h2 style={{
            fontSize: 13, fontWeight: 600, color: "#475569",
            margin: "0 0 20px 0", textTransform: "uppercase", letterSpacing: "1.5px",
          }}>
            Recent Activity
          </h2>
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 16, padding: isMobile ? 16 : 24,
          }}>
            {activity.length === 0 && (
              <div style={{ padding: "8px 0", fontSize: 13, color: "#475569" }}>
                No activity yet — reports, risks and change requests on your projects will appear here.
              </div>
            )}
            {activity.map((act, i) => (
              <div key={act.id} style={{
                display: "flex", alignItems: "center", gap: isMobile ? 9 : 14,
                padding: "12px 0",
                borderBottom: i < activity.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}>
                <div style={{
                  padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800,
                  background: "rgba(16,185,129,0.1)", color: "#10b981",
                  letterSpacing: "0.5px", minWidth: 24, textAlign: "center",
                }}>
                  {act.code}
                </div>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: TYPE_COLORS[act.type] || "#475569", flexShrink: 0,
                }} />
                <div style={{ fontSize: 13, color: "#94a3b8", flex: 1 }}>{act.text}</div>
                <div style={{ fontSize: 11, color: "#334155", flexShrink: 0 }}>{act.time}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{
          paddingBottom: isMobile ? 8 : 40, textAlign: "center",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.8s ease 0.5s",
        }}>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", marginBottom: 24 }} />
          <div style={{ fontSize: 12, color: "#1e293b" }}>
            Project Governance Hub · PMO Platform · Built for Capital Projects
          </div>
        </footer>
      </div>
    </div>
  );
}