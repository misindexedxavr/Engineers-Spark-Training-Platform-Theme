import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useSSENotifications,
  type CTFdNotification,
} from "../hooks/useSSENotifications";
import { useAuth } from "./AuthContext";

export interface StoredNotification extends CTFdNotification {
  _seenAt: number;
  _read: boolean;
}

interface NotificationContextType {
  notifications: StoredNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
  dismiss: (id: number) => void;
  /** Latest notification for toast display (null after consumed) */
  latestToast: CTFdNotification | null;
  consumeToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const MAX_STORED = 50;

function normalizeApiNotification(raw: unknown): CTFdNotification | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const id = obj.id;
  const numericId =
    typeof id === "number" && Number.isFinite(id)
      ? id
      : typeof id === "string" && /^[0-9]+$/.test(id)
        ? Number(id)
        : null;
  if (numericId === null) return null;
  return {
    id: numericId,
    title:
      typeof obj.title === "string" && obj.title.trim().length > 0
        ? obj.title
        : "Notification",
    content: typeof obj.content === "string" ? obj.content : "",
    html: typeof obj.html === "string" ? obj.html : "",
    type:
      typeof obj.type === "string" && obj.type.length > 0 ? obj.type : "toast",
    sound: Boolean(obj.sound),
    user: typeof obj.user === "string" ? obj.user : null,
    user_id:
      typeof obj.user_id === "number"
        ? obj.user_id
        : obj.user_id == null
          ? null
          : Number(obj.user_id),
    team: typeof obj.team === "string" ? obj.team : null,
    team_id:
      typeof obj.team_id === "number"
        ? obj.team_id
        : obj.team_id == null
          ? null
          : Number(obj.team_id),
    date:
      typeof obj.date === "string" && obj.date.length > 0
        ? obj.date
        : new Date().toISOString(),
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [latestToast, setLatestToast] = useState<CTFdNotification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSeenIdRef = useRef(0);
  const didInitialSyncRef = useRef(false);

  const appendNotification = useCallback(
    (n: CTFdNotification, allowToast: boolean) => {
      setNotifications((prev) => {
        if (prev.some((p) => p.id === n.id)) return prev;
        const next: StoredNotification[] = [
          { ...n, _seenAt: Date.now(), _read: false },
          ...prev,
        ];
        return next.slice(0, MAX_STORED);
      });
      if (n.id > lastSeenIdRef.current) lastSeenIdRef.current = n.id;
      if (allowToast) setLatestToast(n);
    },
    [],
  );

  // Live pushes always toast.
  useSSENotifications(
    useCallback((n: CTFdNotification) => appendNotification(n, true), [appendNotification]),
    isAuthenticated,
  );

  const syncFromApi = useCallback(async () => {
    if (!isAuthenticated) return;
    const sinceId = lastSeenIdRef.current;
    setError(null);
    try {
      const response = await fetch(`/api/v1/notifications?since_id=${sinceId}`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        // 403 for logged-out users is expected; don't surface as an error.
        if (response.status !== 403) setError("Couldn't load notifications.");
        return;
      }
      const payload = (await response.json()) as { data?: unknown[] };
      const items = Array.isArray(payload?.data) ? payload.data : [];
      const normalized = items
        .map(normalizeApiNotification)
        .filter((i): i is CTFdNotification => i !== null)
        .sort((a, b) => a.id - b.id);
      // Only toast API items discovered after the initial sync (avoid
      // replaying history as toasts on page load).
      const allowToast = didInitialSyncRef.current;
      normalized.forEach((item) => appendNotification(item, allowToast));
      didInitialSyncRef.current = true;
    } catch {
      setError("Couldn't load notifications.");
    }
  }, [appendNotification, isAuthenticated]);

  // Initial sync + 10s poll while authenticated. Single interval, no duplicates.
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLatestToast(null);
      setLoading(false);
      setError(null);
      lastSeenIdRef.current = 0;
      didInitialSyncRef.current = false;
      return;
    }
    setLoading(true);
    syncFromApi().finally(() => setLoading(false));
    const timer = setInterval(syncFromApi, 10_000);
    return () => clearInterval(timer);
  }, [isAuthenticated, syncFromApi]);

  const refresh = useCallback(() => {
    setLoading(true);
    syncFromApi().finally(() => setLoading(false));
  }, [syncFromApi]);

  // Read state is client-side: CTFd exposes no "mark as read" endpoint.
  const markRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, _read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, _read: true })));
  }, []);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const consumeToast = useCallback(() => setLatestToast(null), []);
  const unreadCount = notifications.filter((n) => !n._read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refresh,
        markRead,
        markAllRead,
        dismiss,
        latestToast,
        consumeToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
}
