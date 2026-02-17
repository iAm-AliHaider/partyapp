"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// ── Tiny SVG chart components (no dependencies) ──

function MiniBar({ data, color = "#DC2626", height = 120 }: { data: { label: string; count: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const barW = Math.max(16, Math.min(40, 280 / data.length));
  const gap = 4;
  const w = data.length * (barW + gap);
  return (
    <div className="overflow-x-auto">
      <svg width={w} height={height + 24} className="block">
        {data.map((d, i) => {
          const h = (d.count / max) * height;
          return (
            <g key={i}>
              <rect x={i * (barW + gap)} y={height - h} width={barW} height={h} rx={4} fill={color} opacity={0.85} />
              <text x={i * (barW + gap) + barW / 2} y={height - h - 4} textAnchor="middle" className="text-[9px] fill-gray-600 font-semibold">{d.count > 0 ? d.count : ""}</text>
              <text x={i * (barW + gap) + barW / 2} y={height + 14} textAnchor="middle" className="text-[8px] fill-gray-400">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ data, colors, size = 130 }: { data: { label: string; count: number }[]; colors: string[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="text-center text-gray-400 py-8 text-sm">No data</p>;
  const r = size / 2 - 8;
  const cx = size / 2, cy = size / 2;
  let cumAngle = -Math.PI / 2;

  const arcs = data.filter(d => d.count > 0).map((d, i) => {
    const angle = (d.count / total) * 2 * Math.PI;
    const startX = cx + r * Math.cos(cumAngle);
    const startY = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const endX = cx + r * Math.cos(cumAngle);
    const endY = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = data.filter(d => d.count > 0).length === 1
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`
      : `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${large} 1 ${endX} ${endY} Z`;
    return <path key={i} d={path} fill={colors[i % colors.length]} opacity={0.9} />;
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size}>
        {arcs}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-lg font-bold fill-gray-800">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="text-[9px] fill-gray-400">Total</text>
      </svg>
      <div className="space-y-1.5">
        {data.filter(d => d.count > 0).map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-xs text-gray-600">{d.label}</span>
            <span className="text-xs font-bold text-gray-800">{d.count}</span>
            <span className="text-[10px] text-gray-400">({Math.round((d.count / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SparkLine({ data, color = "#DC2626", height = 60 }: { data: { date: string; count: number }[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = data.length * 12;
  const points = data.map((d, i) => `${i * 12},${height - (d.count / max) * (height - 10)}`).join(" ");
  const areaPoints = `0,${height} ${points} ${(data.length - 1) * 12},${height}`;
  return (
    <svg width={w} height={height + 16} className="block w-full" viewBox={`0 0 ${w} ${height + 16}`} preserveAspectRatio="none">
      <polygon points={areaPoints} fill={color} opacity={0.08} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => d.count > 0 ? (
        <circle key={i} cx={i * 12} cy={height - (d.count / max) * (height - 10)} r={2.5} fill={color} />
      ) : null)}
    </svg>
  );
}

// ── Dashboard ──

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "demographics" | "geography" | "referrals">("overview");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) { router.push("/home"); return; }
      fetch("/api/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); });
    }
  }, [status, session, router]);

  const computeRankings = async () => {
    const res = await fetch("/api/rankings/compute", { method: "POST" });
    const d = await res.json();
    alert(`Rankings computed for ${d.computed} districts`);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-2">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  const o = data?.overview || {};
  const demo = data?.demographics || {};
  const prov = data?.provincial || [];
  const growth = data?.growth || [];
  const topConst = data?.topdistricts || [];
  const topRec = data?.topRecruiters || [];
  const refStats = data?.referralStats || {};
  const roles = data?.roles || [];
  const recent = data?.recentMembers || [];

  const COLORS = {
    red: "#DC2626", gold: "#EAB308", green: "#16A34A", blue: "#2563EB",
    purple: "#9333EA", orange: "#EA580C", teal: "#0D9488", pink: "#EC4899",
  };
  const PIE_COLORS = [COLORS.red, COLORS.gold, COLORS.blue, COLORS.green, COLORS.purple, COLORS.orange, COLORS.teal, COLORS.pink];

  const TABS = [
    { key: "overview", label: "📊 Overview", labelShort: "📊" },
    { key: "demographics", label: "👥 Demographics", labelShort: "👥" },
    { key: "geography", label: "🗺️ Geography", labelShort: "🗺️" },
    { key: "referrals", label: "🔗 Referrals", labelShort: "🔗" },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/icons/party-logo.png" alt="Logo" width={36} height={36} className="rounded-lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Party Analytics</h1>
            <p className="text-[10px] text-gray-400">Pakistan Awaam Raaj Tehreek — پاکستان عوام راج تحریک</p>
          </div>
        </div>
        <button onClick={() => { setLoading(true); fetch("/api/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); }); }} className="p-2 rounded-lg bg-gray-100 active:bg-gray-200 text-sm">🔄</button>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${tab === t.key ? "bg-party-red text-white shadow-sm" : "bg-gray-100 text-gray-600"}`}>
            <span className="sm:hidden">{t.labelShort}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
      {tab === "overview" && (
        <>
          {/* Hero KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card bg-gradient-to-br from-red-50 to-red-100/50 border-red-100">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">Total Members</p>
              <p className="text-3xl font-extrabold text-party-red mt-1">{o.total?.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-1">+{o.newToday} today • +{o.newWeek} this week</p>
            </div>
            <div className="card bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-100">
              <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide">Coverage</p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{o.coveragePercent}%</p>
              <p className="text-[10px] text-gray-400 mt-1">{o.coveredTehsils}/{o.totalTehsils} tehsils</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="card text-center py-3">
              <p className="text-xl font-extrabold text-green-600">{o.active}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Active</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xl font-extrabold text-yellow-600">{o.pending}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Pending</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xl font-extrabold text-purple-600">{o.referrals}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Referrals</p>
            </div>
          </div>

          {/* Growth Trend */}
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-gray-800">📈 Growth Trend (30 days)</h2>
              <p className="text-[10px] text-gray-400">+{o.newMonth} this month</p>
            </div>
            <SparkLine data={growth} color={COLORS.red} height={70} />
            <div className="flex justify-between mt-2">
              <span className="text-[9px] text-gray-400">{growth[0]?.date}</span>
              <span className="text-[9px] text-gray-400">{growth[growth.length - 1]?.date}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={computeRankings} className="card text-center py-3 active:bg-red-50 transition-colors">
              <p className="text-lg">🏆</p>
              <p className="text-[10px] font-semibold text-gray-600 mt-1">Compute Rankings</p>
            </button>
            <Link href="/admin/members" className="card text-center py-3 active:bg-red-50 transition-colors">
              <p className="text-lg">👥</p>
              <p className="text-[10px] font-semibold text-gray-600 mt-1">Members</p>
            </Link>
            <Link href="/admin/constituencies" className="card text-center py-3 active:bg-red-50 transition-colors">
              <p className="text-lg">🗺️</p>
              <p className="text-[10px] font-semibold text-gray-600 mt-1">districts</p>
            </Link>
          </div>

          {/* Top Recruiters */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-3">🏅 Top Recruiters</h2>
            {topRec.length > 0 ? (
              <div className="space-y-2.5">
                {topRec.slice(0, 10).map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-400">{m.constituency?.code || "—"} • {m._count?.referrals || 0} referrals</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-party-red">{m.score}</p>
                      <p className="text-[9px] text-gray-400">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-gray-400 text-sm py-4">No recruiters yet</p>}
          </div>

          {/* Recent Members */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-3">🕐 Recent Registrations</h2>
            <div className="space-y-2">
              {recent.slice(0, 10).map((m: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0 border-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {m.constituency?.code || "—"} • {m.gender === "MALE" ? "♂" : m.gender === "FEMALE" ? "♀" : "—"}
                      {m.age ? ` • ${m.age}y` : ""} {m.referredBy ? `• via ${m.referredBy.name}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${m.status === "ACTIVE" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>{m.status}</span>
                    <p className="text-[9px] text-gray-300 mt-0.5">{new Date(m.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════ DEMOGRAPHICS TAB ═══════════════ */}
      {tab === "demographics" && (
        <>
          {/* Gender */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-4">⚧ Gender Distribution</h2>
            <DonutChart data={demo.gender || []} colors={[COLORS.blue, COLORS.pink, COLORS.purple, COLORS.teal]} />
          </div>

          {/* Age */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-4">🎂 Age Distribution</h2>
            <MiniBar data={(demo.age || []).map((a: any) => ({ label: a.label, count: a.count }))} color={COLORS.red} />
          </div>

          {/* Residential Status */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-4">🏠 Residential Status</h2>
            <DonutChart data={(demo.residential || []).map((r: any) => ({ label: r.label === "RESIDENT" ? "Resident 🇵🇰" : "Overseas 🌍", count: r.count }))} colors={[COLORS.green, COLORS.gold]} />
          </div>

          {/* Religion */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-4">🕌 Religion</h2>
            <DonutChart data={demo.religion || []} colors={PIE_COLORS} />
          </div>

          {/* Roles */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-4">🎖️ Role Distribution</h2>
            <DonutChart data={(roles || []).map((r: any) => ({ label: r.role, count: r.count }))} colors={PIE_COLORS} />
          </div>
        </>
      )}

      {/* ═══════════════ GEOGRAPHY TAB ═══════════════ */}
      {tab === "geography" && (
        <>
          {/* Provincial Overview */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-4">🏛️ Provincial Breakdown</h2>
            <div className="space-y-3">
              {prov.map((p: any) => {
                const pct = p.tehsils > 0 ? Math.round((p.coveredTehsils / p.tehsils) * 100) : 0;
                return (
                  <div key={p.type}>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="text-xs font-bold text-gray-700">{p.label}</span>
                        <span className="text-[10px] text-gray-400 ml-2">{p.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-party-red">{p.members}</span>
                        <span className="text-[10px] text-gray-400 ml-1">members</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-party-red to-party-gold transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[9px] text-gray-400 mt-0.5">{p.coveredTehsils}/{p.tehsils} tehsils covered ({pct}%)</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top districts */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-3">🔥 Top districts</h2>
            {topConst.length > 0 ? (
              <div className="space-y-2">
                {topConst.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 py-1.5 border-b last:border-0 border-gray-50">
                    <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
                      c.type === "NA" ? "bg-red-50 text-red-600" :
                      c.type === "PP" ? "bg-yellow-50 text-yellow-600" :
                      c.type === "PS" ? "bg-green-50 text-green-600" :
                      c.type === "PK" ? "bg-blue-50 text-blue-600" :
                      "bg-purple-50 text-purple-600"
                    }`}>{c.code}</span>
                    <span className="text-xs text-gray-600 flex-1 truncate">{c.name}</span>
                    <span className="text-xs font-bold text-party-red">{c.members}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-gray-400 text-sm py-4">No members in any constituency yet</p>}
          </div>

          {/* Coverage by Type Bar Chart */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-4">📊 Members by Assembly Type</h2>
            <MiniBar data={prov.map((p: any) => ({ label: p.type, count: p.members }))} color={COLORS.red} />
          </div>
        </>
      )}

      {/* ═══════════════ REFERRALS TAB ═══════════════ */}
      {tab === "referrals" && (
        <>
          {/* Referral by Level */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-4">🔗 Referral Levels</h2>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(level => {
                const d = (refStats.byLevel || []).find((l: any) => l.level === level);
                return (
                  <div key={level} className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-semibold">Level {level}</p>
                    <p className="text-2xl font-extrabold text-party-red mt-1">{d?.count || 0}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{d?.points || 0} pts</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Referral Status */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-4">📋 Referral Status</h2>
            <DonutChart data={(refStats.byStatus || []).map((s: any) => ({ label: s.status, count: s.count }))} colors={[COLORS.green, COLORS.gold, COLORS.red, COLORS.purple]} />
          </div>

          {/* Scoring Breakdown */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-3">⚡ Scoring System</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-red-50 rounded-lg">
                <span className="font-semibold text-gray-700">Direct Referral (L1)</span>
                <span className="font-bold text-party-red">+10 pts</span>
              </div>
              <div className="flex justify-between p-2 bg-amber-50 rounded-lg">
                <span className="font-semibold text-gray-700">Level 2 Referral</span>
                <span className="font-bold text-amber-600">+5 pts</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-50 rounded-lg">
                <span className="font-semibold text-gray-700">Level 3 Referral</span>
                <span className="font-bold text-blue-600">+2 pts</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded-lg">
                <span className="font-semibold text-gray-700">Active Referral Bonus</span>
                <span className="font-bold text-green-600">+3 pts</span>
              </div>
            </div>
          </div>

          {/* Top Recruiters (repeat in referrals context) */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-800 mb-3">🏅 Top Referral Chains</h2>
            {topRec.length > 0 ? (
              <div className="space-y-2">
                {topRec.slice(0, 10).map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${i < 3 ? "bg-party-gold text-white" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{m.name}</p>
                      <p className="text-[9px] text-gray-400">{m.constituency?.code} • {m.referralCode}</p>
                    </div>
                    <span className="text-xs font-bold text-party-red">{m.score} pts</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-gray-400 text-sm py-4">No referrals yet</p>}
          </div>
        </>
      )}

      {/* Footer */}
      <p className="text-center text-[9px] text-gray-300 pb-4">Last updated: {new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</p>
    </div>
  );
}
