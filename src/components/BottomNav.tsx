"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/home", label: "Home", icon: "🏠" },
  { href: "/tasks", label: "Tasks", icon: "📋" },
  { href: "/referrals", label: "Refer", icon: "🔗" },
  { href: "/rankings", label: "Rank", icon: "🏆" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full min-w-[56px] transition-colors ${
                isActive ? "text-party-red" : "text-gray-400 hover:text-gray-600"
              }`}>
              <span className="text-lg mb-0.5">{tab.icon}</span>
              <span className="text-[9px] font-medium leading-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
