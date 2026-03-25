"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LeaderboardTable from "@/components/LeaderboardTable";
import { useLanguage } from "@/components/LanguageContext";
import { Trophy, Search, Medal, TrendingUp, Crown, Share2 } from "lucide-react";

function Podium({ entries }: { entries: any[] }) {
  if (entries.length < 3) return null;
  const top3 = entries.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]]; // silver, gold, bronze
  const heights = [80, 100, 64];
  const sizes = [48, 56, 44];
  const colors = [
    { ring: "ring-gray-300", bg: "bg-gray-100", text: "text-gray-600", medal: "🥈" },
    { ring: "ring-amber-400", bg: "bg-amber-50", text: "text-amber-700", medal: "🥇" },
    { ring: "ring-amber-600", bg: "bg-orange-50", text: "text-orange-700", medal: "🥉" },
  ];

  return (
    <div className="card mb-6">
      <div className="flex items-end justify-center gap-3 pt-4">
        {podiumOrder.map((entry, idx) => {
          if (!entry) return null;
          const c = colors[idx];
          const sz = sizes[idx];
          const displayName = entry.name || entry.member?.name || "?";
          return (
            <div key={idx} className="flex flex-col items-center">
              <div className={`rounded-full ${c.bg} ring-2 ${c.ring} flex items-center justify-center mb-1`}
                   style={{ width: sz, height: sz }}>
                <span className="text-headline font-bold">{displayName.charAt(0)}</span>
              </div>
              <span className="text-lg mb-1">{c.medal}</span>
              <p className="text-callout font-semibold text-label-primary text-center truncate max-w-[80px]">{displayName.split(" ")[0]}</p>
              <p className="text-caption text-label-tertiary">{entry.score} pts</p>
              <div className={`w-20 ${c.bg} rounded-t-apple mt-2 flex items-end justify-center`} style={{ height: heights[idx] }}>
                <span className={`text-title-sm font-bold ${c.text} mb-2`}>#{entry.rank || idx + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Normalize leaderboard entries so both national & district have consistent shape */
function normalizeEntries(raw: any[], type: string): any[] {
  return raw.map((e) => {
    if (type === "national") return e;
    // District: { member: { id, name }, score, rank, memberId, district }
    return { ...e, id: e.member?.id || e.memberId, name: e.member?.name || e.name };
  });
}

export default function RankingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("national");
  const [entries, setEntries] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rankHistory, setRankHistory] = useState<any[]>([]);

  const currentUserId = (session?.user as any)?.id;
  const userDistrictId = (session?.user as any)?.districtId;
  const userProvinceId = (session?.user as any)?.provinceId;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    fetch("/api/provinces").then((r) => r.json()).then((data) => setProvinces(data.provinces || []));
    fetchRankings("national");
  }, [status, router]);

  useEffect(() => {
    if (selectedProvince) {
      fetch(`/api/districts?provinceId=${selectedProvince}`).then((r) => r.json()).then((data) => setDistricts(data.districts || []));
    } else { setDistricts([]); }
    setSelectedDistrict("");
  }, [selectedProvince]);

  const fetchRankings = async (type: string, districtId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type });
      if (districtId) params.set("districtId", districtId);
      const res = await fetch(`/api/rankings?${params}`);
      const data = await res.json();
      setEntries(normalizeEntries(data.leaderboard || [], type));
    } catch { setEntries([]); }
    setLoading(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery("");
    if (tab === "national") {
      fetchRankings("national");
    } else {
      // Auto-load user's district if available
      if (userDistrictId) {
        if (userProvinceId) setSelectedProvince(userProvinceId);
        setSelectedDistrict(userDistrictId);
        fetchRankings("district", userDistrictId);
      } else if (selectedDistrict) {
        fetchRankings("district", selectedDistrict);
      } else {
        setEntries([]);
        setLoading(false);
      }
    }
  };

  const filteredEntries = searchQuery
    ? entries.filter(e => {
        const name = e.name || e.member?.name || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : entries;

  // Find current user in entries
  const currentUserEntry = entries.find(e => e.id === currentUserId || e.memberId === currentUserId);

  useEffect(() => {
    if (currentUserEntry && selectedDistrict) {
      fetch(`/api/rankings/history?memberId=${currentUserId}&districtId=${selectedDistrict}`)
        .then(r => r.json())
        .then(data => setRankHistory(data.history || []))
        .catch(() => setRankHistory([]));
    } else {
      setRankHistory([]);
    }
  }, [currentUserId, currentUserEntry, selectedDistrict]);

  return (
    <div className="px-5 py-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-surface-tertiary p-1 rounded-apple-lg">
        {[
          { key: "district", label: t.rankings.myDistrict || "My District" },
          { key: "national", label: t.rankings.national },
        ].map((tab) => (
          <button key={tab.key} onClick={() => handleTabChange(tab.key)}
            className={`flex-1 py-2.5 rounded-apple text-subhead font-semibold transition-all ${
              activeTab === tab.key ? "bg-surface-primary shadow-apple text-label-primary" : "text-label-tertiary"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "district" && (
        <div className="space-y-3 mb-5">
          <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="input-field">
            <option value="">{t.rankings.selectProvince || "Select Province"}</option>
            {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {districts.length > 0 && (
            <select value={selectedDistrict} onChange={(e) => { setSelectedDistrict(e.target.value); if (e.target.value) fetchRankings("district", e.target.value); }} className="input-field">
              <option value="">{t.rankings.selectDistrict || "Select District"}</option>
              {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16 rounded-apple-lg" />)}</div>
      ) : entries.length > 0 ? (
        <>
          {/* Podium for top 3 */}
          <Podium entries={entries} />

          {/* Why Rank Matters */}
          <div className="card mb-6 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Trophy size={18} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-body font-semibold text-purple-900 mb-1">Why Rank Matters</p>
                <p className="text-caption text-purple-700 leading-relaxed">
                  Your ranking determines your eligibility for party candidacy. Top recruiters in each district are recognized as district leaders and may be selected as candidates for upcoming elections.
                </p>
              </div>
            </div>
          </div>

          {/* Current user highlight */}
          {currentUserEntry && (
            <div className="card bg-accent-50 border border-accent/20 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Crown size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body font-semibold text-label-primary">{currentUserEntry.name || currentUserEntry.member?.name}</p>
                    <span className="badge bg-accent text-white">You</span>
                  </div>
                  <p className="text-caption text-label-tertiary">Rank #{currentUserEntry.rank} · {currentUserEntry.score} pts</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-title-sm text-accent font-bold">#{currentUserEntry.rank}</p>
                  <button
                    onClick={() => {
                      const text = `I ranked #${currentUserEntry.rank} in ${activeTab === "national" ? "Pakistan" : "my district"} on عوام راج! ${currentUserEntry.score} points. Join me: partyapp-jet.vercel.app`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                    className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center"
                  >
                    <Share2 size={14} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rank Trend Chart */}
          {currentUserEntry && rankHistory.length > 1 && (
            <div className="card mb-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-purple-600" />
                <p className="text-body font-semibold text-label-primary">Your Rank Trend</p>
              </div>
              <div className="flex items-end gap-2 h-24">
                {rankHistory.map((h, i) => {
                  const maxRank = Math.max(...rankHistory.map(r => r.rank));
                  const minRank = Math.min(...rankHistory.map(r => r.rank));
                  const range = maxRank - minRank || 1;
                  const height = Math.max(8, 100 - ((h.rank - minRank) / range) * 92);
                  const isCurrent = i === rankHistory.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center justify-end" style={{ height: 72 }}>
                        <div
                          className={`w-full rounded-t-sm transition-all ${isCurrent ? "bg-accent" : "bg-purple-200"}`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className={`text-caption ${isCurrent ? "font-semibold text-accent" : "text-label-tertiary"}`}>
                        #{h.rank}
                      </span>
                      <span className="text-caption text-label-quaternary">{h.period?.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={(t.rankings as any).searchMembers || "Search members..."}
              className="input-field !pl-10 !py-3"
            />
          </div>

          <LeaderboardTable entries={filteredEntries} isNational={activeTab === "national"} />

          {searchQuery && filteredEntries.length === 0 && (
            <div className="text-center py-8">
              <p className="text-callout text-label-tertiary">No members matching &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-16">
          <Trophy size={40} className="text-label-quaternary mx-auto mb-3" />
          <p className="text-body font-medium text-label-secondary">{t.rankings.noRankings}</p>
          <p className="text-caption text-label-tertiary mt-1">
            {activeTab === "district" && !selectedDistrict ? (t.rankings.selectToView || "Select a district") : t.rankings.rankingsComputed}
          </p>
        </div>
      )}
    </div>
  );
}
