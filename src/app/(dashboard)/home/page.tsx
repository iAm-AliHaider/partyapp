"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MembershipCard from "@/components/MembershipCard";
import Link from "next/link";
import { useLanguage, LanguageToggle } from "@/components/LanguageContext";
import { Link2, Trophy, ListTodo, User, TrendingUp, Users, Star, ChevronRight, Bell, Award, Zap, Target, Megaphone } from "lucide-react";

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 5) return { text: "Good Night", emoji: "🌙" };
  if (h < 12) return { text: "Good Morning", emoji: "☀️" };
  if (h < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  if (h < 21) return { text: "Good Evening", emoji: "🌅" };
  return { text: "Good Night", emoji: "🌙" };
}

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const steps = 20;
    const inc = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += inc;
      if (current >= value) { setDisplay(value); clearInterval(interval); }
      else setDisplay(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value, duration]);
  return <>{display}</>;
}

const ACHIEVEMENTS = [
  { id: "first_ref", label: "First Referral", icon: Link2, color: "text-blue-600", bg: "bg-blue-50", threshold: (m: any) => (m?._count?.referrals || 0) >= 1 },
  { id: "ten_refs", label: "10 Members", icon: Users, color: "text-purple-600", bg: "bg-purple-50", threshold: (m: any) => (m?._count?.referrals || 0) >= 10 },
  { id: "top_100", label: "Top 100", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50", threshold: (m: any) => m?.rank && m.rank <= 100 },
  { id: "scorer", label: "50+ Points", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50", threshold: (m: any) => (m?.score || 0) >= 50 },
  { id: "centurion", label: "100+ Points", icon: Award, color: "text-accent", bg: "bg-accent-50", threshold: (m: any) => (m?.score || 0) >= 100 },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [member, setMember] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/members/me").then((r) => r.json()),
        fetch("/api/stats").then((r) => r.json()),
      ]).then(([memberData, statsData]) => {
        setMember(memberData);
        setStats(statsData);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="px-5 pt-3 pb-4">
        <div className="space-y-4">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-44 rounded-apple-xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-20 rounded-apple-lg" />
            <div className="skeleton h-20 rounded-apple-lg" />
          </div>
        </div>
      </div>
    );
  }

  const memberLocation = member?.residentialStatus === "OVERSEAS"
    ? member.country
    : [member?.tehsil?.name, member?.district?.name, member?.province?.name].filter(Boolean).join(", ") || undefined;

  const earnedAchievements = ACHIEVEMENTS.filter(a => a.threshold(member));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !a.threshold(member));

  return (
    <div className="px-5 pt-3 pb-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <p className="text-subhead text-label-tertiary">{greeting.emoji} {greeting.text}</p>
          <h1 className="text-title tracking-tight">{member?.name || t.home.dashboard}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle className="!bg-surface-tertiary !text-label-secondary !rounded-full !px-3 !py-1.5" />
          <Link href="/notifications" className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale relative">
            <Bell size={18} className="text-label-secondary" />
          </Link>
        </div>
      </div>

      {/* Membership Card */}
      {member && (
        <div className="mb-6">
          <MembershipCard
            name={member.name}
            membershipNumber={member.membershipNumber || "—"}
            partyName="Pakistan Awaam Raaj Tehreek"
            constituencyCode={member.constituency?.code}
            constituencyName={member.constituency?.name}
            referralCode={member.referralCode}
            photoUrl={member.photoUrl}
            rank={member.rank}
            score={member.score}
            joinDate={member.createdAt}
            location={memberLocation}
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card flex flex-col items-center py-5">
          <div className="w-9 h-9 rounded-full bg-accent-50 flex items-center justify-center mb-2">
            <Star size={18} className="text-accent" />
          </div>
          <p className="text-title-sm text-label-primary"><AnimatedCounter value={member?.rank || 0} /></p>
          <p className="text-caption text-label-tertiary mt-0.5">{t.home.yourRank}</p>
        </div>
        <div className="card flex flex-col items-center py-5">
          <div className="w-9 h-9 rounded-full bg-accent-50 flex items-center justify-center mb-2">
            <TrendingUp size={18} className="text-accent" />
          </div>
          <p className="text-title-sm text-label-primary"><AnimatedCounter value={member?.score || 0} /></p>
          <p className="text-caption text-label-tertiary mt-0.5">{t.home.yourScore}</p>
        </div>
        <div className="card flex flex-col items-center py-5">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center mb-2">
            <Link2 size={18} className="text-blue-600" />
          </div>
          <p className="text-title-sm text-label-primary"><AnimatedCounter value={member?._count?.referrals || 0} /></p>
          <p className="text-caption text-label-tertiary mt-0.5">{t.home.referrals}</p>
        </div>
        <div className="card flex flex-col items-center py-5">
          <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
            <Users size={18} className="text-emerald-600" />
          </div>
          <p className="text-title-sm text-label-primary"><AnimatedCounter value={stats?.totalMembers || 0} /></p>
          <p className="text-caption text-label-tertiary mt-0.5">{t.home.totalMembers}</p>
        </div>
      </div>

      {/* Achievements */}
      {(earnedAchievements.length > 0 || lockedAchievements.length > 0) && (
        <>
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-3">{(t.home as any).achievements || "Achievements"}</p>
          <div className="flex gap-3 overflow-x-auto pb-3 mb-6 -mx-5 px-5">
            {earnedAchievements.map(a => (
              <div key={a.id} className="flex flex-col items-center gap-1.5 min-w-[64px]">
                <div className={`w-12 h-12 rounded-full ${a.bg} flex items-center justify-center shadow-apple`}>
                  <a.icon size={20} className={a.color} />
                </div>
                <span className="text-caption text-label-primary font-medium text-center leading-tight">{a.label}</span>
              </div>
            ))}
            {lockedAchievements.map(a => (
              <div key={a.id} className="flex flex-col items-center gap-1.5 min-w-[64px] opacity-30">
                <div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center">
                  <a.icon size={20} className="text-label-quaternary" />
                </div>
                <span className="text-caption text-label-quaternary font-medium text-center leading-tight">{a.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick Actions */}
      <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-3">{t.home.quickActions}</p>
      <div className="card-grouped mb-6">
        {[
          { href: "/referrals", icon: Link2, color: "text-blue-600 bg-blue-50", label: t.home.shareCode, sub: t.home.inviteMembers },
          { href: "/rankings", icon: Trophy, color: "text-amber-600 bg-amber-50", label: t.home.leaderboard, sub: t.home.checkRankings },
          { href: "/tasks", icon: ListTodo, color: "text-purple-600 bg-purple-50", label: t.home.tasks, sub: t.home.campaigns },
          { href: "/profile", icon: User, color: "text-gray-600 bg-gray-100", label: t.home.profile, sub: t.home.editDetails },
        ].map((item, i) => (
          <Link key={item.href} href={item.href} className="list-row tap-scale">
            <div className={`w-9 h-9 rounded-apple flex items-center justify-center ${item.color.split(" ")[1]}`}>
              <item.icon size={18} className={item.color.split(" ")[0]} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-label-primary">{item.label}</p>
              <p className="text-caption text-label-tertiary">{item.sub}</p>
            </div>
            <ChevronRight size={16} className="text-label-quaternary" />
          </Link>
        ))}
      </div>

      {/* Party Updates */}
      <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-3">{(t.home as any).partyUpdates || "Party Updates"}</p>
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-accent-50 flex items-center justify-center">
            <Megaphone size={17} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-body font-medium text-label-primary">{(t.home as any).growingStrong || "Growing Strong"}</p>
            <p className="text-caption text-label-tertiary">{(t.home as any).partyGrowthMessage || "Our movement is expanding across Pakistan"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-center">
          <div className="flex-1 py-2 bg-surface-tertiary rounded-apple">
            <p className="text-headline text-accent"><AnimatedCounter value={stats?.totalMembers || 0} /></p>
            <p className="text-caption text-label-tertiary">{(t.home as any).members || "Members"}</p>
          </div>
          <div className="flex-1 py-2 bg-surface-tertiary rounded-apple">
            <p className="text-headline text-blue-600"><AnimatedCounter value={stats?.totalDistricts || 0} /></p>
            <p className="text-caption text-label-tertiary">{(t.home as any).districts || "Districts"}</p>
          </div>
          <div className="flex-1 py-2 bg-surface-tertiary rounded-apple">
            <p className="text-headline text-emerald-600"><AnimatedCounter value={stats?.totalProvinces || 0} /></p>
            <p className="text-caption text-label-tertiary">{(t.home as any).provinces || "Provinces"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
