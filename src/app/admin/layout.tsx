"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminTabs = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/members", label: "Members", icon: "👥" },
  { href: "/admin/projects", label: "Projects", icon: "📋" },
  { href: "/admin/constituencies", label: "Areas", icon: "🗺️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav with safe area for notch */}
      <div className="bg-party-red text-white px-4 pb-3 notch-header">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>🇵🇰</span>
            <div>
              <h2 className="font-bold text-sm">Awaam Raaj — Admin</h2>
              <p className="text-[10px] opacity-60">پاکستان عوام راج تحریک</p>
            </div>
          </div>
          <Link href="/home" className="text-xs opacity-70 bg-white/10 px-3 py-1 rounded-lg">← App</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {adminTabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== "/admin" && pathname?.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive ? "bg-white text-party-red" : "bg-white/20 text-white"
                }`}>
                {tab.icon} {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      <main className="p-4">{children}</main>
    </div>
  );
}
