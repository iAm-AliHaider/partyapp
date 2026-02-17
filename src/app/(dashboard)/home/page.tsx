"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MembershipCard from "@/components/MembershipCard";
import Link from "next/link";
import { useLanguage, LanguageToggle } from "@/components/LanguageContext";

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
      <div className="page-container">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-20 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const locationText = [member?.district?.name, member?.province?.name].filter(Boolean).join(", ");
  const memberLocation = member?.residentialStatus === "OVERSEAS"
    ? member.country
    : [member?.tehsil?.name, member?.district?.name, member?.province?.name].filter(Boolean).join(", ") || undefined;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-gray-500">{t.home.welcome}</p>
          <h1 className="text-xl font-bold">{member?.name || t.home.dashboard}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle className="!bg-gray-100 !text-gray-600" />
          <Image src="/icons/party-logo.png" alt="Awaam Raaj" width={42} height={42} className="rounded-xl shadow-md border border-gray-200" />
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
        <div className="stat-card">
          <p className="text-2xl font-bold text-party-red">{member?.rank || "—"}</p>
          <p className="text-xs text-gray-500 mt-1">{t.home.yourRank}</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-party-red">{member?.score || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{t.home.yourScore}</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-party-gold-dark">{member?._count?.referrals || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{t.home.referrals}</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-green-600">{stats?.totalMembers || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{t.home.totalMembers}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="section-title">{t.home.quickActions}</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/referrals" className="card flex items-center gap-3 active:scale-95 transition-transform">
          <span className="text-2xl">🔗</span>
          <div><p className="font-semibold text-sm">{t.home.shareCode}</p><p className="text-xs text-gray-500">{t.home.inviteMembers}</p></div>
        </Link>
        <Link href="/rankings" className="card flex items-center gap-3 active:scale-95 transition-transform">
          <span className="text-2xl">🏆</span>
          <div><p className="font-semibold text-sm">{t.home.leaderboard}</p><p className="text-xs text-gray-500">{t.home.checkRankings}</p></div>
        </Link>
        <Link href="/tasks" className="card flex items-center gap-3 active:scale-95 transition-transform">
          <span className="text-2xl">📋</span>
          <div><p className="font-semibold text-sm">{t.home.tasks}</p><p className="text-xs text-gray-500">{t.home.campaigns}</p></div>
        </Link>
        <Link href="/profile" className="card flex items-center gap-3 active:scale-95 transition-transform">
          <span className="text-2xl">👤</span>
          <div><p className="font-semibold text-sm">{t.home.profile}</p><p className="text-xs text-gray-500">{t.home.editDetails}</p></div>
        </Link>
      </div>

      {/* Party Info */}
      <div className="card bg-party-red/5 border border-party-red/20">
        <div className="flex items-center gap-2">
          <Image src="/icons/party-logo.png" alt="" width={24} height={24} className="rounded" />
          <p className="text-sm font-semibold text-party-red">Pakistan Awaam Raaj Tehreek</p>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {locationText || t.home.locationNotSet}
        </p>
      </div>
    </div>
  );
}
