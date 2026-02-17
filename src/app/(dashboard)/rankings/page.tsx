"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LeaderboardTable from "@/components/LeaderboardTable";
import { useLanguage } from "@/components/LanguageContext";
import { Trophy } from "lucide-react";

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
      setEntries(data.leaderboard || []);
    } catch { setEntries([]); }
    setLoading(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "national") fetchRankings("national");
    else if (selectedDistrict) fetchRankings("district", selectedDistrict);
  };

  return (
    <div className="page-container">
      <h1 className="text-title tracking-tight mb-6 pt-2">{t.rankings.title}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-surface-tertiary p-1 rounded-apple-lg">
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
        <LeaderboardTable entries={entries} isNational={activeTab === "national"} />
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
