"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LeaderboardTable from "@/components/LeaderboardTable";
import { useLanguage } from "@/components/LanguageContext";

export default function RankingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("national");
  const [entries, setEntries] = useState<any[]>([]);
  const [constituencies, setConstituencies] = useState<any[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    fetch("/api/constituencies").then((r) => r.json()).then((data) => {
      setConstituencies(data.constituencies || []);
    });
    fetchRankings("national");
  }, [status, router]);

  const fetchRankings = async (type: string, constituencyId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type });
      if (constituencyId) params.set("constituencyId", constituencyId);
      const res = await fetch(`/api/rankings?${params}`);
      const data = await res.json();
      setEntries(data.leaderboard || []);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "national") {
      fetchRankings("national");
    } else if (selectedConstituency) {
      fetchRankings("constituency", selectedConstituency);
    }
  };

  const handleConstituencyChange = (id: string) => {
    setSelectedConstituency(id);
    if (id) fetchRankings("constituency", id);
  };

  const TABS = [
    { key: "constituency", label: t.rankings.myConstituency },
    { key: "national", label: t.rankings.national },
  ];

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold mb-4">{t.rankings.title}</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => handleTabChange(tab.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab.key ? "bg-party-red text-white" : "bg-gray-100 text-gray-600"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "constituency" && (
        <div className="mb-4">
          <select value={selectedConstituency} onChange={(e) => handleConstituencyChange(e.target.value)} className="input-field text-sm">
            <option value="">{t.rankings.selectConstituency}</option>
            {constituencies.map((c: any) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name} ({c._count?.members || 0})</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
        </div>
      ) : entries.length > 0 ? (
        <LeaderboardTable entries={entries} isNational={activeTab === "national"} />
      ) : (
        <div className="card text-center text-gray-400 py-12">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium">{t.rankings.noRankings}</p>
          <p className="text-xs mt-1">
            {activeTab === "constituency" && !selectedConstituency
              ? t.rankings.selectToView
              : t.rankings.rankingsComputed}
          </p>
        </div>
      )}
    </div>
  );
}
