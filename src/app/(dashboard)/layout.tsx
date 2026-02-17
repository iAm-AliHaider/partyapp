"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";
import { Home, ListTodo, Link2, Trophy, User, Bell } from "lucide-react";

const iconMap = { home: Home, tasks: ListTodo, refer: Link2, rank: Trophy, profile: User };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { href: "/home", label: t.nav.home, icon: "home" as const },
    { href: "/tasks", label: t.nav.tasks, icon: "tasks" as const },
    { href: "/referrals", label: t.nav.refer, icon: "refer" as const },
    { href: "/rankings", label: t.nav.rank, icon: "rank" as const },
    { href: "/profile", label: t.nav.profile, icon: "profile" as const },
  ];

  const activeTab = tabs.find(
    (tab) => pathname === tab.href || pathname?.startsWith(tab.href + "/")
  );
  const isNotifications = pathname === "/notifications";
  const pageTitle = isNotifications ? (t.notifications?.title || "Notifications") : activeTab?.label || "";

  // Home manages its own header (welcome + name + language toggle)
  const selfHeaderPages = ["/home"];
  const showHeader = !selfHeaderPages.includes(pathname || "");

  return (
    <div className="fixed inset-0 flex flex-col bg-surface-secondary">
      {/* ─── Fixed Header ─── */}
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
        /* Safe area spacer for pages without header (notch protection) */
        <div className="flex-shrink-0 safe-area-top" />
      )}

      {/* ─── Scrollable Content ─── */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto pb-4">{children}</div>
      </main>

      {/* ─── Fixed Bottom Tab Bar ─── */}
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
