"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";
import { Bell, Link2, Check, BarChart3, Megaphone, Award } from "lucide-react";

const ICONS: Record<string, any> = {
  REFERRAL_NEW: Link2,
  REFERRAL_VERIFIED: Check,
  RANK_CHANGE: BarChart3,
  SYSTEM: Megaphone,
  CANDIDATE_SELECTED: Award,
};

const ICON_COLORS: Record<string, string> = {
  REFERRAL_NEW: "text-blue-600 bg-blue-50",
  REFERRAL_VERIFIED: "text-emerald-600 bg-emerald-50",
  RANK_CHANGE: "text-purple-600 bg-purple-50",
  SYSTEM: "text-orange-600 bg-orange-50",
  CANDIDATE_SELECTED: "text-amber-600 bg-amber-50",
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
    } finally { setLoading(false); }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  if (loading) return <div className="px-5 py-4"><div className="space-y-3 pt-8">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-apple-lg" />)}</div></div>;

  return (
    <div className="px-5 py-4">
      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <button onClick={markAllRead} className="btn-ghost text-subhead">{t.notifications.markAllRead}</button>
        </div>
      )}

      {notifications.length > 0 ? (
        <div className="card-grouped">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            const colorClass = ICON_COLORS[n.type] || "text-gray-600 bg-gray-100";
            return (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)}
                className={`list-row cursor-pointer ${!n.read ? "bg-accent-50/30" : ""}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass.split(" ")[1]}`}>
                  <Icon size={17} className={colorClass.split(" ")[0]} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-body ${!n.read ? "font-semibold" : ""} text-label-primary`}>{n.title}</p>
                  <p className="text-caption text-label-tertiary mt-0.5">{n.body}</p>
                  <p className="text-caption text-label-quaternary mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Bell size={40} className="text-label-quaternary mx-auto mb-3" />
          <p className="text-body font-medium text-label-secondary">{t.notifications.noNotifications}</p>
          <p className="text-caption text-label-tertiary mt-1">{t.notifications.notifiedAbout}</p>
        </div>
      )}
    </div>
  );
}
