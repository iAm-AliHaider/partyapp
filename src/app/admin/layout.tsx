"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Users, FolderKanban, Megaphone, MapPin, Zap, ArrowLeft,
} from "lucide-react";

const tabs = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/announcements", label: "Announce", icon: Megaphone },
  { href: "/admin/constituencies", label: "Districts", icon: MapPin },
  { href: "/admin/ai", label: "AI", icon: Zap },
];

function getActiveTab(pathname: string | null) {
  if (!pathname) return tabs[0];
  // Exact match first, then prefix match (skip /admin itself for prefix)
  const exact = tabs.find((t) => t.href === pathname);
  if (exact) return exact;
  return tabs.find((t) => t.href !== "/admin" && pathname.startsWith(t.href)) || tabs[0];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = getActiveTab(pathname);

  return (
    <div className="fixed inset-0 flex flex-col bg-surface-secondary">
      {/* ─── Fixed Header ─── */}
      <header className="flex-shrink-0 glass border-b border-separator/50 z-30">
        <div className="notch-header px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-title-sm text-label-primary truncate">{active.label}</h1>
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

      {/* ─── Scrollable Content ─── */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-5 pb-8 max-w-2xl mx-auto">{children}</div>
      </main>

      {/* ─── Fixed Bottom Tab Bar ─── */}
      <nav className="flex-shrink-0 glass border-t border-separator/50 z-30 safe-area-bottom">
        <div className="flex items-stretch justify-around px-2 pt-1.5 pb-1">
          {tabs.map((tab) => {
            const isActive =
              tab.href === pathname ||
              (tab.href !== "/admin" && pathname?.startsWith(tab.href));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-1 min-w-0 flex-1 transition-colors ${
                  isActive ? "text-accent" : "text-label-tertiary"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                <span
                  className={`text-[10px] leading-tight truncate ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
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
