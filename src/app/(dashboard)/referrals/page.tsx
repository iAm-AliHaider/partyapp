"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function ReferralsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
        fetch(`/api/referrals?memberId=${userId}`)
          .then((r) => r.json())
          .then((data) => {
            setStats(data.stats);
            setReferrals(data.referrals || []);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    }
  }, [status, session, router]);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    const text = `🇵🇰 Join Pakistan Awaam Raaj Tehreek!\n\nBe part of the democratic revolution. Join using my referral:\n${shareUrl}\n\nReferral Code: ${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return <div className="page-container"><div className="animate-pulse space-y-4"><div className="h-64 bg-gray-200 rounded-2xl" /><div className="h-20 bg-gray-200 rounded-xl" /></div></div>;
  }

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold mb-6">Your Referrals</h1>

      {/* QR + Share */}
      <div className="card mb-6">
        <div className="flex flex-col items-center text-center">
          <div className="bg-white p-3 rounded-xl border-2 border-party-red/20 mb-4">
            <QRCodeSVG value={shareUrl} size={160} level="M" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Your Referral Code</p>
          <p className="text-2xl font-mono font-bold text-party-red mb-4">{referralCode}</p>
          <div className="flex gap-3 w-full">
            <button onClick={copyToClipboard} className="btn-secondary flex-1 text-sm">
              {copied ? "✅ Copied!" : "📋 Copy Link"}
            </button>
            <button onClick={shareWhatsApp} className="btn-primary flex-1 text-sm">
              📱 WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <h2 className="section-title">Referral Breakdown</h2>
      <div className="space-y-3 mb-6">
        <div className="card flex justify-between items-center">
          <div><p className="font-semibold">Direct Referrals</p><p className="text-xs text-gray-500">10 points each</p></div>
          <div className="text-right">
            <p className="text-xl font-bold text-party-red">{stats?.directCount || 0}</p>
            <p className="text-xs text-gray-400">{stats?.directPoints || 0} pts</p>
          </div>
        </div>
        <div className="card flex justify-between items-center">
          <div><p className="font-semibold">2nd Level</p><p className="text-xs text-gray-500">5 points each</p></div>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">{stats?.level2Count || 0}</p>
            <p className="text-xs text-gray-400">{stats?.level2Points || 0} pts</p>
          </div>
        </div>
        <div className="card flex justify-between items-center">
          <div><p className="font-semibold">3rd Level</p><p className="text-xs text-gray-500">2 points each</p></div>
          <div className="text-right">
            <p className="text-xl font-bold text-purple-600">{stats?.level3Count || 0}</p>
            <p className="text-xs text-gray-400">{stats?.level3Points || 0} pts</p>
          </div>
        </div>
        <div className="card flex justify-between items-center bg-party-gold/5">
          <div><p className="font-semibold">Active Bonus</p><p className="text-xs text-gray-500">+3 per active member</p></div>
          <div className="text-right">
            <p className="text-xl font-bold text-party-gold-dark">{stats?.activeCount || 0}</p>
            <p className="text-xs text-gray-400">{stats?.activePoints || 0} pts</p>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="card bg-party-red text-white text-center mb-6">
        <p className="text-sm opacity-80">Total Score</p>
        <p className="text-4xl font-bold">{stats?.totalScore || 0}</p>
      </div>

      {/* Recent Referrals */}
      <h2 className="section-title">Recent Referrals</h2>
      {referrals.length > 0 ? (
        <div className="space-y-2">
          {referrals.map((ref: any, i: number) => (
            <div key={i} className="card flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{ref.name}</p>
                <p className="text-xs text-gray-500">Level {ref.level} • {new Date(ref.joinedAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ref.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {ref.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-gray-400 py-8">
          <p className="text-3xl mb-2">🔗</p>
          <p className="text-sm">No referrals yet. Share your code to get started!</p>
        </div>
      )}
    </div>
  );
}
