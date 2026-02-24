"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";
import { Home, Newspaper, ListTodo, Users, User, Bell, Megaphone, Share2 } from "lucide-react";

const iconMap = { home: Home, feed: Newspaper, tasks: ListTodo, friends: Users, profile: User, campaigns: Megaphone, social: Share2 };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { href: "/home", label: t.nav.home, icon: "home" as const },
    { href: "/feed", label: (t.nav as any).feed || "Feed", icon: "feed" as const },
    { href: "/campaigns", label: "Campaign", icon: "campaigns" as const },
    { href: "/social-hub", label: "Social", icon: "social" as const },
    { href: "/profile", label: t.nav.profile, icon: "profile" as const },
  ];

  const activeTab = tabs.find(
    (tab) => pathname === tab.href || pathname?.startsWith(tab.href + "/")
  );
  const isNotifications = pathname === "/notifications";
  // Also handle pages not in main tabs (tasks, friends, rankings, referrals)
  const subPages: Record<string, string> = {
    "/tasks": t.nav.tasks,
    "/friends": (t.nav as any).friends || "Friends",
    "/rankings": (t.nav as any).rankings || "Rankings",
    "/referrals": (t.nav as any).referrals || "Referrals",
    "/notifications": t.notifications?.title || "Notifications",
  };
  const pageTitle = isNotifications ? (t.notifications?.title || "Notifications") : subPages[pathname || ""] || activeTab?.label || "";

  const selfHeaderPages = ["/home"];
  const showHeader = !selfHeaderPages.includes(pathname || "");

  return (
    <div className="fixed inset-0 flex flex-col bg-surface-secondary">
      {showHeader ? (
        <header className="flex-shrink-0 glass border-b border-separator/50 z-30">
          <div className="notch-header px-5 pb-3">
            <div className="flex items-center justify-between">
              <h1 className="text-title-sm text-label-primary">{pageTitle}</h1>
              <Link
                href="/notifications"
                className="w-9 h-9 rounded-full bg-surface-tertiary/80 flex items-center justify-center tap-scale"
              >
                <Bell size={18} className="text-label-secondary" />
              </Link>
            </div>
          </div>
        </header>
      ) : (
        <div className="flex-shrink-0 safe-area-top" />
      )}

      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto pb-4">{children}</div>
      </main>

      <nav className="flex-shrink-0 glass border-t border-separator/50 z-30 safe-area-bottom">
        <div className="flex items-stretch justify-around px-2 pt-1.5 pb-1 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/");
            const Icon = iconMap[tab.icon];
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-1 min-w-0 flex-1 transition-colors ${
                  isActive ? "text-accent" : "text-label-tertiary"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className={`text-[10px] leading-tight truncate ${isActive ? "font-semibold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
