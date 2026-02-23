"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";
import { Home, Newspaper, ListTodo, Users, User } from "lucide-react";

const iconMap = {
  home: Home,
  feed: Newspaper,
  tasks: ListTodo,
  friends: Users,
  profile: User,
};

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { href: "/home", label: t.nav.home, icon: "home" as const },
    { href: "/feed", label: (t.nav as any).feed || "Feed", icon: "feed" as const },
    { href: "/tasks", label: t.nav.tasks, icon: "tasks" as const },
    { href: "/friends", label: (t.nav as any).friends || "Friends", icon: "friends" as const },
    { href: "/profile", label: t.nav.profile, icon: "profile" as const },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-separator/50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex justify-around items-center h-[52px] max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          const Icon = iconMap[tab.icon];
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full min-w-[56px] transition-colors ${
                isActive ? "text-accent" : "text-label-tertiary"
              }`}>
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium mt-0.5 leading-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
