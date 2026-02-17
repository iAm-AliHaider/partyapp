"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Trophy, Users, MapPin, TrendingUp, Award, Clock, Layers } from "lucide-react";

// ── SVG Charts ──

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
              <rect x={i * (barW + gap)} y={height - h} width={barW} height={h} rx={6} fill={color} opacity={0.75} />
              <text x={i * (barW + gap) + barW / 2} y={height - h - 4} textAnchor="middle" className="text-[9px] fill-label-secondary font-semibold">{d.count > 0 ? d.count : ""}</text>
              <text x={i * (barW + gap) + barW / 2} y={height + 14} textAnchor="middle" className="text-[8px] fill-label-tertiary">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ data, colors, size = 130 }: { data: { label: string; count: number }[]; colors: string[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="text-center text-label-tertiary py-8 text-callout">No data</p>;
  const r = size / 2 - 8, cx = size / 2, cy = size / 2;
  let cumAngle = -Math.PI / 2;
  const filtered = data.filter(d => d.count > 0);
  const arcs = filtered.map((d, i) => {
    const angle = (d.count / total) * 2 * Math.PI;
    const startX = cx + r * Math.cos(cumAngle), startY = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const endX = cx + r * Math.cos(cumAngle), endY = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = filtered.length === 1
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`
      : `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${large} 1 ${endX} ${endY} Z`;
    return <path key={i} d={path} fill={colors[i % colors.length]} opacity={0.85} />;
  });
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size}>
        {arcs}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-headline fill-label-primary">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="text-caption fill-label-tertiary">Total</text>
      </svg>
      <div className="space-y-1.5">
        {filtered.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-caption text-label-secondary">{d.label}</span>
            <span className="text-caption font-semibold text-label-primary">{d.count}</span>
            <span className="text-caption text-label-quaternary">({Math.round((d.count / total) * 100)}%)</span>
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
      <polygon points={areaPoints} fill={color} opacity={0.06} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => d.count > 0 ? <circle key={i} cx={i * 12} cy={height - (d.count / max) * (height - 10)} r={2.5} fill={color} /> : null)}
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

  if (loading) return <div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-28 rounded-apple-lg" />)}</div>;

  const o = data?.overview || {};
  const demo = data?.demographics || {};
  const prov = data?.provincial || [];
  const growth = data?.growth || [];
  const topConst = data?.topDistricts || data?.topdistricts || [];
  const topRec = data?.topRecruiters || [];
  const refStats = data?.referralStats || {};
  const roles = data?.roles || [];
  const recent = data?.recentMembers || [];

  const COLORS_PALETTE = ["#DC2626", "#D4A843", "#2563EB", "#16A34A", "#9333EA", "#EA580C", "#0D9488", "#EC4899"];
  const TAB_ICONS = { overview: TrendingUp, demographics: Users, geography: MapPin, referrals: Layers };
  const TABS = [
    { key: "overview" as const, label: "Overview" },
    { key: "demographics" as const, label: "People" },
    { key: "geography" as const, label: "Geography" },
    { key: "referrals" as const, label: "Referrals" },
  ];

  return (
    <div className="space-y-5">
      {/* Refresh */}
      <div className="flex justify-end">
        <button onClick={() => { setLoading(true); fetch("/api/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); }); }}
          className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale">
          <RefreshCw size={16} className="text-label-secondary" />
        </button>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = TAB_ICONS[t.key];
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-subhead font-semibold whitespace-nowrap transition-all ${
                tab === t.key ? "bg-accent text-white shadow-apple" : "bg-surface-primary text-label-secondary shadow-apple"
              }`}>
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <p className="text-caption font-semibold text-label-tertiary uppercase tracking-wider">Total Members</p>
              <p className="text-title text-label-primary mt-1">{o.total?.toLocaleString()}</p>
              <p className="text-caption text-label-quaternary mt-1">+{o.newToday} today, +{o.newWeek} week</p>
            </div>
            <div className="card">
              <p className="text-caption font-semibold text-label-tertiary uppercase tracking-wider">Coverage</p>
              <p className="text-title text-label-primary mt-1">{o.coveragePercent}%</p>
              <p className="text-caption text-label-quaternary mt-1">{o.coveredTehsils}/{o.totalTehsils} tehsils</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Active", value: o.active, color: "text-emerald-600" },
              { label: "Pending", value: o.pending, color: "text-amber-600" },
              { label: "Referrals", value: o.referrals, color: "text-blue-600" },
            ].map((s, i) => (
              <div key={i} className="card text-center py-4">
                <p className={`text-title-sm ${s.color}`}>{s.value}</p>
                <p className="text-caption text-label-tertiary mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Growth */}
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <p className="text-headline text-label-primary">Growth Trend</p>
              <p className="text-caption text-label-tertiary">+{o.newMonth} this month</p>
            </div>
            <SparkLine data={growth} color="#DC2626" height={70} />
            <div className="flex justify-between mt-2">
              <span className="text-caption text-label-quaternary">{growth[0]?.date}</span>
              <span className="text-caption text-label-quaternary">{growth[growth.length - 1]?.date}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Trophy, label: "Rankings", action: computeRankings },
              { icon: Users, label: "Members", href: "/admin/members" },
              { icon: MapPin, label: "Districts", href: "/admin/constituencies" },
            ].map((item, i) => {
              const content = (
                <div className="card text-center py-4 tap-scale">
                  <div className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center mx-auto mb-2">
                    <item.icon size={17} className="text-label-secondary" />
                  </div>
                  <p className="text-caption font-semibold text-label-secondary">{item.label}</p>
                </div>
              );
              return item.href
                ? <Link key={i} href={item.href}>{content}</Link>
                : <button key={i} onClick={item.action}>{content}</button>;
            })}
          </div>

          {/* Top Recruiters */}
          <div className="card">
            <p className="text-headline text-label-primary mb-3">Top Recruiters</p>
            {topRec.length > 0 ? (
              <div className="space-y-3">
                {topRec.slice(0, 10).map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-bold ${
                      i < 3 ? "bg-accent text-white" : "bg-surface-tertiary text-label-tertiary"
                    }`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium truncate">{m.name}</p>
                      <p className="text-caption text-label-tertiary">{m.district?.name || "—"} · {m._count?.referrals || 0} referrals</p>
                    </div>
                    <p className="text-headline text-label-primary">{m.score}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-callout text-label-tertiary text-center py-6">No recruiters yet</p>}
          </div>

          {/* Recent */}
          <div className="card">
            <p className="text-headline text-label-primary mb-3">Recent Registrations</p>
            <div className="space-y-0">
              {recent.slice(0, 10).map((m: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0 border-separator">
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium truncate">{m.name}</p>
                    <p className="text-caption text-label-tertiary">{m.district?.name || "—"} · {m.gender} {m.age ? `· ${m.age}y` : ""}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${m.status === "ACTIVE" ? "badge-green" : "badge-yellow"}`}>{m.status}</span>
                    <p className="text-caption text-label-quaternary mt-0.5">{new Date(m.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* DEMOGRAPHICS */}
      {tab === "demographics" && (
        <>
          <div className="card"><p className="text-headline text-label-primary mb-4">Gender Distribution</p><DonutChart data={demo.gender || []} colors={["#2563EB", "#EC4899", "#9333EA", "#0D9488"]} /></div>
          <div className="card"><p className="text-headline text-label-primary mb-4">Age Distribution</p><MiniBar data={(demo.age || []).map((a: any) => ({ label: a.label, count: a.count }))} color="#DC2626" /></div>
          <div className="card"><p className="text-headline text-label-primary mb-4">Residential Status</p><DonutChart data={(demo.residential || []).map((r: any) => ({ label: r.label === "RESIDENT" ? "Resident" : "Overseas", count: r.count }))} colors={["#16A34A", "#D4A843"]} /></div>
          <div className="card"><p className="text-headline text-label-primary mb-4">Religion</p><DonutChart data={demo.religion || []} colors={COLORS_PALETTE} /></div>
          <div className="card"><p className="text-headline text-label-primary mb-4">Role Distribution</p><DonutChart data={(roles || []).map((r: any) => ({ label: r.role, count: r.count }))} colors={COLORS_PALETTE} /></div>
        </>
      )}

      {/* GEOGRAPHY */}
      {tab === "geography" && (
        <>
          <div className="card">
            <p className="text-headline text-label-primary mb-4">Provincial Breakdown</p>
            <div className="space-y-4">
              {prov.map((p: any) => {
                const pct = p.tehsils > 0 ? Math.round((p.coveredTehsils / p.tehsils) * 100) : 0;
                return (
                  <div key={p.id || p.type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-body font-medium text-label-primary">{p.name || p.label}</span>
                      <span className="text-subhead font-semibold text-accent">{p.members}</span>
                    </div>
                    <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-caption text-label-tertiary mt-0.5">{p.coveredTehsils}/{p.tehsils} tehsils ({pct}%)</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <p className="text-headline text-label-primary mb-3">Top Districts</p>
            {topConst.length > 0 ? (
              <div className="space-y-2">
                {topConst.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0 border-separator">
                    <span className="text-caption font-semibold text-label-tertiary w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium truncate">{c.district || c.name}</p>
                      <p className="text-caption text-label-tertiary">{c.province}</p>
                    </div>
                    <span className="text-headline text-label-primary">{c.members}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-callout text-label-tertiary text-center py-6">No data</p>}
          </div>

          <div className="card">
            <p className="text-headline text-label-primary mb-4">Members by Province</p>
            <MiniBar data={prov.map((p: any) => ({ label: (p.name || p.type || "").slice(0, 6), count: p.members }))} color="#DC2626" />
          </div>
        </>
      )}

      {/* REFERRALS */}
      {tab === "referrals" && (
        <>
          <div className="card">
            <p className="text-headline text-label-primary mb-4">Referral Levels</p>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(level => {
                const d = (refStats.byLevel || []).find((l: any) => l.level === level);
                return (
                  <div key={level} className="text-center p-4 bg-surface-tertiary rounded-apple-lg">
                    <p className="text-caption text-label-tertiary font-semibold">Level {level}</p>
                    <p className="text-title-sm text-label-primary mt-1">{d?.count || 0}</p>
                    <p className="text-caption text-label-quaternary mt-0.5">{d?.points || 0} pts</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card"><p className="text-headline text-label-primary mb-4">Referral Status</p><DonutChart data={(refStats.byStatus || []).map((s: any) => ({ label: s.status, count: s.count }))} colors={["#16A34A", "#D4A843", "#DC2626", "#9333EA"]} /></div>
          <div className="card">
            <p className="text-headline text-label-primary mb-3">Scoring System</p>
            <div className="space-y-2">
              {[
                { label: "Direct Referral (L1)", pts: "+10", bg: "bg-accent-50 text-accent" },
                { label: "Level 2 Referral", pts: "+5", bg: "bg-amber-50 text-amber-700" },
                { label: "Level 3 Referral", pts: "+2", bg: "bg-blue-50 text-blue-700" },
                { label: "Active Bonus", pts: "+3", bg: "bg-emerald-50 text-emerald-700" },
              ].map((s, i) => (
                <div key={i} className={`flex justify-between items-center p-3 rounded-apple-lg ${s.bg.split(" ")[0]}`}>
                  <span className="text-callout font-medium text-label-primary">{s.label}</span>
                  <span className={`text-callout font-bold ${s.bg.split(" ")[1]}`}>{s.pts} pts</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-center text-caption text-label-quaternary pb-4">
        Updated {new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
      </p>
    </div>
  );
}
