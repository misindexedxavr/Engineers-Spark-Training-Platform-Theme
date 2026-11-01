import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Check,
  CheckCheck,
  Flag,
  Megaphone,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type ElementType } from "react";
import { useNotifications } from "../context/NotificationContext";

function typeMeta(type: string): { icon: ElementType; color: string; bg: string } {
  switch (type) {
    case "challenge":
      return { icon: Trophy, color: "#34d399", bg: "rgba(52,211,153,0.12)" };
    case "team":
      return { icon: Users, color: "#c084fc", bg: "rgba(192,132,252,0.12)" };
    case "ctf":
      return { icon: Flag, color: "#fbbf24", bg: "rgba(251,191,36,0.12)" };
    case "announce":
      return { icon: Megaphone, color: "#fb923c", bg: "rgba(251,146,60,0.12)" };
    default:
      return { icon: Zap, color: "#67e8f9", bg: "rgba(103,232,249,0.12)" };
  }
}

function stripHtml(html: string): string {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || d.innerText || "";
}

function formatTime(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString();
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={open}
        className="relative flex items-center justify-center w-8 h-8 rounded-full border transition-colors"
        style={{
          borderColor: open ? "rgba(103,232,249,0.45)" : "rgba(255,255,255,0.1)",
          background: open ? "rgba(103,232,249,0.1)" : "transparent",
          color: open ? "#67e8f9" : "rgba(255,255,255,0.6)",
        }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[9px] font-bold"
            style={{
              background: "#67e8f9",
              color: "#07080a",
              minWidth: "16px",
              height: "16px",
              padding: "0 4px",
            }}
          >
            {badge}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute z-[60] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            style={{
              top: "calc(100% + 12px)",
              right: "0px",
              width: "min(380px, calc(100vw - 64px))",
              maxHeight: "min(70vh, 520px)",
            }}
            role="dialog"
            aria-label="Notifications"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-cyan-300" />
                <span className="text-[10px] font-mono tracking-[0.18em] text-white/70 uppercase">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    className="flex items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: "#67e8f9",
                      color: "#07080a",
                      minWidth: "18px",
                      height: "18px",
                      padding: "0 5px",
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-cyan-300 hover:bg-cyan-300/10 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="flex items-center justify-center w-6 h-6 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: "contain" }}>
              {loading && notifications.length === 0 ? (
                <div className="px-4 py-3 space-y-3" aria-label="Loading notifications">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 rounded bg-white/5 w-3/4" />
                        <div className="h-2.5 rounded bg-white/5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-10 gap-3 text-center">
                  <p className="text-xs text-rose-300">{error}</p>
                  <button
                    type="button"
                    onClick={refresh}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-white/70 hover:border-cyan-300/40 hover:text-cyan-200 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/30">
                  <Bell size={30} style={{ opacity: 0.4 }} />
                  <span className="text-xs font-mono tracking-wider">All caught up</span>
                </div>
              ) : (
                notifications.map((notif) => {
                  const meta = typeMeta(notif.type);
                  const Icon = meta.icon;
                  const body =
                    notif.content || (notif.html ? stripHtml(notif.html) : "");
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markRead(notif.id)}
                      className="flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-white/[0.04] hover:bg-white/[0.02] group"
                      style={{
                        background: notif._read ? "transparent" : "rgba(103,232,249,0.04)",
                      }}
                    >
                      <div
                        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg mt-0.5"
                        style={{ background: meta.bg }}
                      >
                        <Icon size={14} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className="text-[13px] leading-snug"
                            style={{
                              fontWeight: notif._read ? 600 : 700,
                              color: notif._read
                                ? "rgba(255,255,255,0.7)"
                                : "rgba(255,255,255,0.95)",
                            }}
                          >
                            {notif.title || "Notification"}
                          </span>
                          {!notif._read && (
                            <span
                              className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                              style={{ background: "#67e8f9" }}
                            />
                          )}
                        </div>
                        {body && (
                          <p className="text-xs text-white/45 leading-relaxed mt-0.5 line-clamp-3">
                            {body}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[11px] font-mono text-white/25">
                            {formatTime(notif.date)}
                          </span>
                          {!notif._read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead(notif.id);
                              }}
                              title="Mark read"
                              aria-label="Mark notification as read"
                              className="flex items-center justify-center w-5 h-5 rounded text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(103,232,249,0.1)" }}
                            >
                              <Check size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
