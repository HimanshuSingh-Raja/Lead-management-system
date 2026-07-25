"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { collection, onSnapshot, orderBy, query, limit, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { AppNotification } from "@/lib/types";

export function NotificationsPopover() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;

    const notifQuery = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(15)
    );

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const fetched: AppNotification[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || "Notification",
          message: data.message || "",
          type: data.type || "STATUS",
          read: data.read || false,
          targetUserEmail: data.targetUserEmail || "",
          createdAt: data.createdAt || null,
        };
      });
      setNotifications(fetched);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      }
    } catch (e) {
      console.error("Error marking notifications read:", e);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) markAllAsRead();
        }}
        className="relative p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-glow">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0d1124] p-4 shadow-2xl z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Notifications ({notifications.length})
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-brand-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" /> Mark read
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center gap-1">
                <Inbox className="h-5 w-5 text-slate-600" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-2.5 rounded-xl border transition ${
                    n.read ? "bg-white/[0.02] border-white/5 opacity-70" : "bg-brand-500/10 border-brand-500/30"
                  }`}
                >
                  <p className="text-xs font-semibold text-white">{n.title}</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
