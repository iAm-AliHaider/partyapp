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
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    fetch("/api/provinces").then((r) => r.json()).then((data) => {
      setProvinces(data.provinces || []);
    });
    fetchRankings("national");
  }, [status, router]);

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetch(`/api/districts?provinceId=${selectedProvince}`).then((r) => r.json()).then((data) => {
        setDistricts(data.districts || []);
      });
    } else {
      setDistricts([]);
    }
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
    } catch {
      setEntries([]);
    }
    setLoading(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "national") {
      fetchRankings("national");
    } else if (selectedDistrict) {
      fetchRankings("district", selectedDistrict);
    }
  };

  const handleDistrictChange = (id: string) => {
    setSelectedDistrict(id);
    if (id) fetchRankings("district", id);
  };

  const TABS = [
    { key: "district", label: t.rankings.myDistrict || "My District" },
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

      {activeTab === "district" && (
        <div className="space-y-3 mb-4">
          <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="input-field text-sm">
            <option value="">{t.rankings.selectProvince || "Select Province"}</option>
            {provinces.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} {p.nameUrdu ? `(${p.nameUrdu})` : ""}</option>
            ))}
          </select>

          {districts.length > 0 && (
            <select value={selectedDistrict} onChange={(e) => handleDistrictChange(e.target.value)} className="input-field text-sm">
              <option value="">{t.rankings.selectDistrict || "Select District"}</option>
              {districts.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
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
            {activeTab === "district" && !selectedDistrict
              ? (t.rankings.selectToView || "Select a district to view rankings")
              : (t.rankings.rankingsComputed)}
          </p>
        </div>
      )}
    </div>
  );
}
