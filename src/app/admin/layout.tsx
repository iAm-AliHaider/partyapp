"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, FolderKanban, Megaphone, MapPin, ArrowLeft } from "lucide-react";

const adminTabs = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/announcements", label: "Announce", icon: Megaphone },
  { href: "/admin/constituencies", label: "Districts", icon: MapPin },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="glass border-b border-separator/50 px-5 pb-3 notch-header">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-headline text-label-primary">Admin Panel</h2>
            <p className="text-caption text-label-tertiary">Awaam Raaj Tehreek</p>
          </div>
          <Link href="/home" className="flex items-center gap-1.5 text-subhead text-label-secondary bg-surface-tertiary px-3 py-1.5 rounded-full tap-scale">
            <ArrowLeft size={14} />
            <span>App</span>
          </Link>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
          {adminTabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== "/admin" && pathname?.startsWith(tab.href));
            const Icon = tab.icon;
            return (
              <Link key={tab.href} href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-apple text-caption font-semibold whitespace-nowrap transition-all ${
                  isActive ? "bg-accent text-white shadow-apple" : "bg-surface-tertiary text-label-secondary"
                }`}>
                <Icon size={13} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      <main className="p-5 max-w-2xl mx-auto">{children}</main>
    </div>
  );
}
