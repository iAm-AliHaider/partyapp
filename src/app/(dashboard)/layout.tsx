"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import {
  Home, Newspaper, Megaphone, Users, MoreHorizontal, Bell,
  User, ListTodo, Share2, Trophy, UserPlus, MapPin, X, ChevronRight
} from "lucide-react";

const iconMap: Record<string, any> = {
  home: Home, feed: Newspaper, campaigns: Megaphone, friends: Users,
  more: MoreHorizontal, profile: User, tasks: ListTodo, social: Share2,
  rankings: Trophy, referrals: UserPlus, attendance: MapPin, notifications: Bell,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [showMore, setShowMore] = useState(false);

  const tabs = [
    { href: "/home", label: t.nav.home, icon: "home" },
    { href: "/feed", label: (t.nav as any).feed || "Feed", icon: "feed" },
    { href: "/campaigns", label: "Campaign", icon: "campaigns" },
    { href: "/friends", label: (t.nav as any).friends || "Friends", icon: "friends" },
    { href: "__more__", label: "More", icon: "more" },
  ];

  const morePages = [
    { href: "/profile", label: t.nav.profile, icon: "profile", desc: "View & edit your profile" },
    { href: "/tasks", label: t.nav.tasks, icon: "tasks", desc: "Your assigned tasks" },
    { href: "/social-hub", label: "Social Hub", icon: "social", desc: "Link accounts & hashtags" },
    { href: "/rankings", label: (t.nav as any).rankings || "Rankings", icon: "rankings", desc: "District leaderboards" },
    { href: "/referrals", label: (t.nav as any).referrals || "Referrals", icon: "referrals", desc: "Invite & earn points" },
    { href: "/attendance", label: "Attendance", icon: "attendance", desc: "Check-in at zones" },
    { href: "/notifications", label: t.notifications?.title || "Notifications", icon: "notifications", desc: "Your notifications" },
  ];

  const allPages = [...tabs.filter(t => t.href !== "__more__"), ...morePages];
  const activePage = allPages.find(p => pathname === p.href || pathname?.startsWith(p.href + "/"));
  const isMorePage = morePages.some(p => pathname === p.href || pathname?.startsWith(p.href + "/"));

  const pageTitle = activePage?.label || "";
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

      {/* Bottom Tab Bar */}
      <nav className="flex-shrink-0 glass border-t border-separator/50 z-30 safe-area-bottom">
        <div className="flex items-stretch justify-around px-2 pt-1.5 pb-1 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isMore = tab.href === "__more__";
            const isActive = isMore
              ? isMorePage || showMore
              : pathname === tab.href || pathname?.startsWith(tab.href + "/");
            const Icon = iconMap[tab.icon];
            return isMore ? (
              <button
                key="more"
                onClick={() => setShowMore(!showMore)}
                className={`flex flex-col items-center gap-0.5 py-1 px-1 min-w-0 flex-1 transition-colors ${
                  isActive ? "text-accent" : "text-label-tertiary"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className={`text-[10px] leading-tight truncate ${isActive ? "font-semibold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </button>
            ) : (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setShowMore(false)}
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

      {/* More Menu Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-surface-primary rounded-t-2xl max-w-lg mx-auto w-full pb-20 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-semibold text-label-primary">More</h3>
              <button onClick={() => setShowMore(false)} className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center">
                <X size={16} className="text-label-secondary" />
              </button>
            </div>
            <div className="px-4 pb-4 space-y-1">
              {morePages.map((page) => {
                const Icon = iconMap[page.icon];
                const isActive = pathname === page.href || pathname?.startsWith(page.href + "/");
                return (
                  <Link
                    key={page.href}
                    href={page.href}
                    onClick={() => setShowMore(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      isActive ? "bg-accent/10" : "hover:bg-surface-secondary active:bg-surface-secondary"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive ? "bg-accent/20 text-accent" : "bg-surface-secondary text-label-secondary"
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isActive ? "text-accent" : "text-label-primary"}`}>{page.label}</div>
                      <div className="text-xs text-label-tertiary">{page.desc}</div>
                    </div>
                    <ChevronRight size={16} className="text-label-tertiary" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
