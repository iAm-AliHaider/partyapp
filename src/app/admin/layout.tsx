"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Users, Flag, Megaphone, MoreHorizontal,
  ClipboardCheck, MapPin, FolderKanban, Zap, ArrowLeft, X, ChevronRight
} from "lucide-react";

const iconMap: Record<string, any> = {
  dashboard: BarChart3, members: Users, campaigns: Flag, announce: Megaphone,
  more: MoreHorizontal, tasks: ClipboardCheck, districts: MapPin,
  attendance: MapPin, projects: FolderKanban, ai: Zap,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const tabs = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/members", label: "Members", icon: "members" },
    { href: "/admin/campaigns", label: "Campaigns", icon: "campaigns" },
    { href: "/admin/announcements", label: "Announce", icon: "announce" },
    { href: "__more__", label: "More", icon: "more" },
  ];

  const morePages = [
    { href: "/admin/tasks", label: "Tasks", icon: "tasks", desc: "Manage & assign tasks" },
    { href: "/admin/constituencies", label: "Districts", icon: "districts", desc: "Districts & tehsils" },
    { href: "/admin/attendance", label: "Attendance", icon: "attendance", desc: "Zones & records" },
    { href: "/admin/projects", label: "Projects", icon: "projects", desc: "Party projects" },
    { href: "/admin/ai", label: "AI Assistant", icon: "ai", desc: "AI-powered tools" },
  ];

  const allPages = [...tabs.filter(t => t.href !== "__more__"), ...morePages];
  const activePage = allPages.find(p => {
    if (p.href === "/admin") return pathname === "/admin";
    return pathname === p.href || pathname?.startsWith(p.href + "/");
  });
  const isMorePage = morePages.some(p => pathname === p.href || pathname?.startsWith(p.href + "/"));

  const pageTitle = activePage?.label || "Admin";

  return (
    <div className="fixed inset-0 flex flex-col bg-surface-secondary">
      <header className="flex-shrink-0 glass border-b border-separator/50 z-30">
        <div className="notch-header px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-title-sm text-label-primary truncate">{pageTitle}</h1>
              <p className="text-caption text-label-tertiary">Awaam Raaj Tehreek</p>
            </div>
            <Link
              href="/home"
              className="flex items-center gap-1.5 text-subhead text-label-secondary bg-surface-tertiary/80 px-3 py-1.5 rounded-full tap-scale flex-shrink-0"
            >
              <ArrowLeft size={14} />
              <span>App</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-5 pb-8 max-w-2xl mx-auto">{children}</div>
      </main>

      {/* Bottom Tab Bar */}
      <nav className="flex-shrink-0 glass border-t border-separator/50 z-30 safe-area-bottom">
        <div className="flex items-stretch justify-around px-2 pt-1.5 pb-1">
          {tabs.map((tab) => {
            const isMore = tab.href === "__more__";
            const isActive = isMore
              ? isMorePage || showMore
              : tab.href === "/admin"
                ? pathname === "/admin"
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
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className={`text-[9px] leading-tight truncate ${isActive ? "font-semibold" : "font-medium"}`}>
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
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className={`text-[9px] leading-tight truncate ${isActive ? "font-semibold" : "font-medium"}`}>
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
            className="relative bg-surface-primary rounded-t-2xl max-w-lg mx-auto w-full pb-20"
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
