import { useEffect, useRef } from "react";

// Shape CTFd sends over /events and /api/v1/notifications
export interface CTFdNotification {
  id: number;
  title: string;
  content: string;
  html: string;
  type: string; // "toast" | "challenge" | "team" | etc.
  sound: boolean;
  user: string | null;
  user_id: number | null;
  team: string | null;
  team_id: number | null;
  date: string; // ISO 8601
}

let syntheticIdCounter = 1;

function normalizeNotification(raw: unknown): CTFdNotification | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const wrapped =
    (obj.notification as Record<string, unknown> | undefined) ??
    (obj.data as Record<string, unknown> | undefined) ??
    obj;

  const numericId =
    typeof wrapped.id === "number" && Number.isFinite(wrapped.id)
      ? wrapped.id
      : typeof wrapped.id === "string" && /^[0-9]+$/.test(wrapped.id)
        ? Number(wrapped.id)
        : Date.now() + syntheticIdCounter++;

  return {
    id: numericId,
    title:
      typeof wrapped.title === "string" && wrapped.title.trim().length > 0
        ? wrapped.title
        : "Notification",
    content: typeof wrapped.content === "string" ? wrapped.content : "",
    html: typeof wrapped.html === "string" ? wrapped.html : "",
    type:
      typeof wrapped.type === "string" && wrapped.type.length > 0
        ? wrapped.type
        : "toast",
    sound: Boolean(wrapped.sound),
    user: typeof wrapped.user === "string" ? wrapped.user : null,
    user_id:
      typeof wrapped.user_id === "number"
        ? wrapped.user_id
        : wrapped.user_id == null
          ? null
          : Number(wrapped.user_id),
    team: typeof wrapped.team === "string" ? wrapped.team : null,
    team_id:
      typeof wrapped.team_id === "number"
        ? wrapped.team_id
        : wrapped.team_id == null
          ? null
          : Number(wrapped.team_id),
    date:
      typeof wrapped.date === "string" && wrapped.date.length > 0
        ? wrapped.date
        : new Date().toISOString(),
  };
}

function parseEventNotification(event: MessageEvent): CTFdNotification | null {
  const raw = event.data;
  if (typeof raw === "string") {
    if (raw.trim().length === 0) return null;
    try {
      return normalizeNotification(JSON.parse(raw) as unknown);
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && raw !== null) {
    return normalizeNotification(raw);
  }
  return null;
}

/**
 * Live CTFd notification stream over SSE (/events).
 * Same-origin, so session cookies are sent automatically.
 * Only connects while `enabled` (authenticated); backs off on errors.
 */
export function useSSENotifications(
  onNotification: (n: CTFdNotification) => void,
  enabled: boolean,
) {
  const cbRef = useRef(onNotification);
  cbRef.current = onNotification;
  const errorCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let closed = false;
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (closed) return;
      es?.close();
      // Same-origin: browser sends session cookie automatically.
      es = new EventSource("/events");
      const stream = es;

      const onAnyNotification = (e: MessageEvent) => {
        const data = parseEventNotification(e);
        if (!data) return;
        errorCountRef.current = 0;
        cbRef.current(data);
      };

      // CTFd variants seen in the wild: "notification" or "notifications".
      stream.addEventListener("notification", onAnyNotification as EventListener);
      stream.addEventListener("notifications", onAnyNotification as EventListener);
      stream.onmessage = onAnyNotification;
      stream.addEventListener("ping", () => {
        errorCountRef.current = 0;
      });

      stream.onerror = () => {
        stream.close();
        if (es === stream) es = null;
        errorCountRef.current += 1;
        // Exponential back-off: 5s, 10s, 20s ... capped at 60s.
        const delay = Math.min(5000 * 2 ** (errorCountRef.current - 1), 60_000);
        retryTimer = setTimeout(() => {
          if (!closed && document.visibilityState !== "hidden") connect();
        }, delay);
      };
    };

    connect();

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        es?.close();
        es = null;
      } else if (!es) {
        errorCountRef.current = 0;
        connect();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      es?.close();
      es = null;
    };
  }, [enabled]);
}
