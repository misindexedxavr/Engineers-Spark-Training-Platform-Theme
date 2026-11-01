import { AnimatePresence, motion } from "motion/react";
import { Bell, Flag, Megaphone, Trophy, Users, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import type { CTFdNotification } from "../hooks/useSSENotifications";

const TOAST_DURATION = 6000;
const MAX_TOASTS = 5;

interface ToastItem extends CTFdNotification {
  _id: number;
}

let counter = 0;

function typeStyle(type: string): { border: string; icon: string; bar: string } {
  switch (type) {
    case "challenge":
      return { border: "rgba(52,211,153,0.4)", icon: "#34d399", bar: "#34d399" };
    case "team":
      return { border: "rgba(192,132,252,0.4)", icon: "#c084fc", bar: "#c084fc" };
    case "ctf":
      return { border: "rgba(251,191,36,0.4)", icon: "#fbbf24", bar: "#fbbf24" };
    case "announce":
      return { border: "rgba(251,146,60,0.4)", icon: "#fb923c", bar: "#fb923c" };
    default:
      return { border: "rgba(103,232,249,0.4)", icon: "#67e8f9", bar: "#67e8f9" };
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "challenge":
      return <Trophy size={15} />;
    case "team":
      return <Users size={15} />;
    case "ctf":
      return <Flag size={15} />;
    case "announce":
      return <Megaphone size={15} />;
    default:
      return <Bell size={15} />;
  }
}

function stripHtml(html: string): string {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || d.innerText || "";
}

export function NotificationToasts() {
  const { latestToast, consumeToast } = useNotifications();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t._id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  useEffect(() => {
    if (!latestToast) return;
    consumeToast();
    const id = ++counter;
    setToasts((prev) => [...prev, { ...latestToast, _id: id }].slice(-MAX_TOASTS));
    const timer = setTimeout(() => dismiss(id), TOAST_DURATION);
    timers.current.set(id, timer);
    return () => {
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      timers.current.delete(id);
    };
  }, [latestToast, consumeToast, dismiss]);

  return (
    <div className="fixed bottom-5 right-4 z-[70] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const c = typeStyle(t.type);
          const content = t.content || (t.html ? stripHtml(t.html) : "");
          return (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.25 }}
              className="relative w-[320px] max-w-[calc(100vw-32px)] rounded-xl border overflow-hidden pointer-events-auto bg-[#0b1220]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
              style={{ borderColor: c.border }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: c.bar }} />
              <div className="flex gap-2.5 items-start pl-4 pr-3 py-3">
                <div className="shrink-0 mt-0.5" style={{ color: c.icon }}>
                  {typeIcon(t.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white/95 leading-snug">
                    {t.title || "Notification"}
                  </p>
                  {content && (
                    <p className="text-xs text-white/50 leading-relaxed mt-0.5 line-clamp-2">
                      {content}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t._id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 flex items-center justify-center w-5 h-5 rounded text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
