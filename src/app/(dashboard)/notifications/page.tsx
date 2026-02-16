"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

const ICONS: Record<string, string> = {
  REFERRAL_NEW: "🔗",
  REFERRAL_VERIFIED: "✅",
  RANK_CHANGE: "📊",
  SYSTEM: "📢",
  CANDIDATE_SELECTED: "🏆",
};

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") fetchNotifications();
  }, [status, router]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  if (loading) {
    return <div className="page-container"><div className="animate-pulse space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}</div></div>;
  }

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">{t.notifications.title}</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-party-red font-semibold">{t.notifications.markAllRead}</button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.read && markRead(n.id)}
              className={`card flex gap-3 cursor-pointer ${!n.read ? "bg-party-red/5 border-l-4 border-party-red" : ""}`}>
              <span className="text-2xl flex-shrink-0">{ICONS[n.type] || "📌"}</span>
              <div className="flex-1">
                <p className={`text-sm ${!n.read ? "font-semibold" : ""}`}>{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-gray-400 py-12">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-medium">{t.notifications.noNotifications}</p>
          <p className="text-xs mt-1">{t.notifications.notifiedAbout}</p>
        </div>
      )}
    </div>
  );
}
