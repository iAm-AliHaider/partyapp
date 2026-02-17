"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "@/components/LanguageContext";
import { Copy, Check, Share2, Users, TrendingUp, Zap, Link2 } from "lucide-react";

export default function ReferralsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [referralCode, setReferralCode] = useState("...");
  const [stats, setStats] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const userId = (session?.user as any)?.id;
      const code = (session?.user as any)?.referralCode;
      if (code) setReferralCode(code);
      if (userId) {
        fetch(`/api/referrals?memberId=${userId}`).then((r) => r.json()).then((data) => {
          setStats(data.stats); setReferrals(data.referrals || []); setLoading(false);
        }).catch(() => setLoading(false));
      }
    }
  }, [status, session, router]);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${referralCode}`;

  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(shareUrl); } catch {
      const input = document.createElement("input"); input.value = shareUrl; document.body.appendChild(input); input.select(); document.execCommand("copy"); document.body.removeChild(input);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `${t.referral.shareMessage}\n${shareUrl}\n\nReferral Code: ${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) return <div className="page-container"><div className="space-y-4 pt-8"><div className="skeleton h-64 rounded-apple-xl" /><div className="skeleton h-20 rounded-apple-lg" /></div></div>;

  return (
    <div className="page-container">
      <h1 className="text-title tracking-tight mb-6 pt-2">{t.referral.title}</h1>

      {/* QR Share Card */}
      <div className="card mb-6">
        <div className="flex flex-col items-center text-center">
          <div className="bg-surface-secondary p-4 rounded-apple-xl mb-4">
            <QRCodeSVG value={shareUrl} size={140} level="M" bgColor="transparent" fgColor="#1C1C1E" />
          </div>
          <p className="text-caption text-label-tertiary mb-1">{t.referral.yourCode}</p>
          <p className="text-title-sm font-mono text-label-primary mb-5" dir="ltr">{referralCode}</p>
          <div className="flex gap-3 w-full">
            <button onClick={copyToClipboard} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? t.referral.copied : t.referral.copyLink}</span>
            </button>
            <button onClick={shareWhatsApp} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Share2 size={16} />
              <span>{t.referral.whatsapp}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Total Score */}
      <div className="card bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] text-center mb-6">
        <p className="text-subhead text-white/50">{t.referral.totalScore}</p>
        <p className="text-title-lg text-white mt-1">{stats?.totalScore || 0}</p>
      </div>

      {/* Score Breakdown */}
      <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-3">{t.referral.breakdown}</p>
      <div className="card-grouped mb-6">
        {[
          { label: t.referral.direct, sub: `10 ${t.referral.pointsEach}`, count: stats?.directCount || 0, pts: stats?.directPoints || 0, icon: Users, color: "text-accent bg-accent-50" },
          { label: t.referral.level2, sub: `5 ${t.referral.pointsEach}`, count: stats?.level2Count || 0, pts: stats?.level2Points || 0, icon: Link2, color: "text-blue-600 bg-blue-50" },
          { label: t.referral.level3, sub: `2 ${t.referral.pointsEach}`, count: stats?.level3Count || 0, pts: stats?.level3Points || 0, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
          { label: t.referral.activeBonus, sub: t.referral.perActive, count: stats?.activeCount || 0, pts: stats?.activePoints || 0, icon: Zap, color: "text-amber-600 bg-amber-50" },
        ].map((row, i) => (
          <div key={i} className="list-row">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${row.color.split(" ")[1]}`}>
              <row.icon size={17} className={row.color.split(" ")[0]} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-label-primary">{row.label}</p>
              <p className="text-caption text-label-tertiary">{row.sub}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-headline text-label-primary">{row.count}</p>
              <p className="text-caption text-label-tertiary">{row.pts} pts</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Referrals */}
      <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-3">{t.referral.recentReferrals}</p>
      {referrals.length > 0 ? (
        <div className="card-grouped">
          {referrals.map((ref: any, i: number) => (
            <div key={i} className="list-row">
              <div className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                <span className="text-subhead font-semibold text-label-secondary">{ref.name?.charAt(0) || "?"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-label-primary">{ref.name}</p>
                <p className="text-caption text-label-tertiary">Level {ref.level} · {new Date(ref.joinedAt).toLocaleDateString()}</p>
              </div>
              <span className={`badge ${ref.status === "ACTIVE" ? "badge-green" : "badge-yellow"}`}>{ref.status}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Link2 size={40} className="text-label-quaternary mx-auto mb-3" />
          <p className="text-body font-medium text-label-secondary">{t.referral.noReferrals}</p>
        </div>
      )}
    </div>
  );
}
