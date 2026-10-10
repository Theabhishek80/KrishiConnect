import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api";

const POLL_MS = 45000;

/**
 * Powers the navbar bell.
 *  - unread    : number for the red badge (cheap call, polled while the tab is visible)
 *  - items     : full list, loaded when the drawer is opened
 */
export default function useNotifications(enabled, routeKey) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refreshCount = useCallback(async () => {
    if (!enabled) return;

    try {
      const { data } = await api.get("/notifications/unread-count");

      if (mounted.current) setUnread(Number(data?.count) || 0);
    } catch {
      /* the badge is optional - ignore network hiccups */
    }
  }, [enabled]);

  const loadAll = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/notifications");

      if (!mounted.current) return;

      const list = Array.isArray(data) ? data : [];

      setItems(list);
      setUnread(list.filter(n => !n.read).length);
    } catch {
      if (mounted.current) setError("Could not load notifications.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [enabled]);

  const markRead = useCallback(async id => {
    setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnread(prev => Math.max(0, prev - 1));

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      /* next poll will correct the count */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);

    try {
      await api.patch("/notifications/read-all");
    } catch {
      /* next poll will correct the count */
    }
  }, []);

  // Reset when the user logs out.
  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setUnread(0);
    }
  }, [enabled]);

  // Check on login, on every page change, when the tab regains focus, and every 45s.
  useEffect(() => {
    if (!enabled) return undefined;

    refreshCount();

    const timer = setInterval(() => {
      if (!document.hidden) refreshCount();
    }, POLL_MS);

    const onVisible = () => {
      if (!document.hidden) refreshCount();
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, routeKey, refreshCount]);

  return { items, unread, loading, error, loadAll, markRead, markAllRead };
}
