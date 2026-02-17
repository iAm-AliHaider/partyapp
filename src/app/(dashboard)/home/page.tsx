"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MembershipCard from "@/components/MembershipCard";
import Link from "next/link";
import { useLanguage, LanguageToggle } from "@/components/LanguageContext";
import { Link2, Trophy, ListTodo, User, TrendingUp, Users, Star, ChevronRight } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [member, setMember] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="px-5 pt-3 pb-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <p className="text-subhead text-label-tertiary">{t.home.welcome}</p>
          <h1 className="text-title tracking-tight">{member?.name || t.home.dashboard}</h1>
        </div>
        <LanguageToggle className="!bg-surface-tertiary !text-label-secondary !rounded-full !px-3 !py-1.5" />
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
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="card flex flex-col items-center py-5">
          <div className="w-9 h-9 rounded-full bg-accent-50 flex items-center justify-center mb-2">
            <Star size={18} className="text-accent" />
          </div>
          <p className="text-title-sm text-label-primary">{member?.rank || "—"}</p>
          <p className="text-caption text-label-tertiary mt-0.5">{t.home.yourRank}</p>
        </div>
        <div className="card flex flex-col items-center py-5">
          <div className="w-9 h-9 rounded-full bg-accent-50 flex items-center justify-center mb-2">
            <TrendingUp size={18} className="text-accent" />
          </div>
          <p className="text-title-sm text-label-primary">{member?.score || 0}</p>
          <p className="text-caption text-label-tertiary mt-0.5">{t.home.yourScore}</p>
        </div>
        <div className="card flex flex-col items-center py-5">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center mb-2">
            <Link2 size={18} className="text-blue-600" />
          </div>
          <p className="text-title-sm text-label-primary">{member?._count?.referrals || 0}</p>
          <p className="text-caption text-label-tertiary mt-0.5">{t.home.referrals}</p>
        </div>
        <div className="card flex flex-col items-center py-5">
          <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
            <Users size={18} className="text-emerald-600" />
          </div>
          <p className="text-title-sm text-label-primary">{stats?.totalMembers || 0}</p>
          <p className="text-caption text-label-tertiary mt-0.5">{t.home.totalMembers}</p>
        </div>
      </div>

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
    </div>
  );
}
