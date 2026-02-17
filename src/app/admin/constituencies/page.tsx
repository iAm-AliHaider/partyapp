"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronRight, MapPin } from "lucide-react";

export default function AdminDistrictsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [tehsils, setTehsils] = useState<Record<string, any[]>>({});
  const [loadingTehsils, setLoadingTehsils] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) { router.push("/home"); return; }
      Promise.all([
        fetch("/api/provinces").then((r) => r.json()),
        fetch("/api/districts").then((r) => r.json()),
      ]).then(([provData, distData]) => {
        setProvinces(provData.provinces || []);
        const dists = distData.districts || [];
        setDistricts(dists); setFiltered(dists); setLoading(false);
      });
    }
  }, [status, session, router]);

  useEffect(() => {
    let result = districts;
    if (selectedProvince !== "All") result = result.filter((d) => d.provinceId === selectedProvince);
    if (search) result = result.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [selectedProvince, search, districts]);

  const toggleDistrict = async (districtId: string) => {
    if (expandedDistrict === districtId) { setExpandedDistrict(null); return; }
    setExpandedDistrict(districtId);
    if (!tehsils[districtId]) {
      setLoadingTehsils(districtId);
      try { const res = await fetch(`/api/tehsils?districtId=${districtId}`); const data = await res.json(); setTehsils(prev => ({ ...prev, [districtId]: data.tehsils || [] })); } catch { setTehsils(prev => ({ ...prev, [districtId]: [] })); }
      setLoadingTehsils(null);
    }
  };

  const totalMembers = districts.reduce((sum, d) => sum + (d._count?.members || 0), 0);
  const covered = districts.filter((d) => (d._count?.members || 0) > 0).length;
  const totalTehsils = districts.reduce((sum, d) => sum + (d._count?.tehsils || 0), 0);

  if (loading) return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-apple-lg" />)}</div>;

  return (
    <div>
      <h1 className="text-title tracking-tight mb-5">Districts</h1>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { value: districts.length, label: "Districts", color: "text-accent" },
          { value: totalTehsils, label: "Tehsils", color: "text-blue-600" },
          { value: covered, label: "Covered", color: "text-emerald-600" },
          { value: totalMembers, label: "Members", color: "text-purple-600" },
        ].map((s, i) => (
          <div key={i} className="card text-center py-3">
            <p className={`text-headline ${s.color}`}>{s.value}</p>
            <p className="text-caption text-label-tertiary">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Province Filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setSelectedProvince("All")}
          className={`pill ${selectedProvince === "All" ? "pill-active" : "pill-inactive"}`}>All</button>
        {provinces.map((p) => (
          <button key={p.id} onClick={() => setSelectedProvince(p.id)}
            className={`pill ${selectedProvince === p.id ? "pill-active" : "pill-inactive"}`}>{p.name}</button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search districts..." className="input-field !pl-10" />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((d) => {
          const isExpanded = expandedDistrict === d.id;
          const districtTehsils = tehsils[d.id] || [];
          const hasTehsils = (d._count?.tehsils || 0) > 0;

          return (
            <div key={d.id} className="card overflow-hidden">
              <button onClick={() => hasTehsils ? toggleDistrict(d.id) : null}
                className={`w-full flex justify-between items-center ${hasTehsils ? "cursor-pointer" : ""}`}>
                <div className="flex items-center gap-3 text-left">
                  {hasTehsils ? (
                    isExpanded ? <ChevronDown size={14} className="text-label-tertiary flex-shrink-0" /> : <ChevronRight size={14} className="text-label-tertiary flex-shrink-0" />
                  ) : <div className="w-3.5" />}
                  <div>
                    <p className="text-body font-medium text-label-primary">{d.name}</p>
                    <p className="text-caption text-label-tertiary">{d.province?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-body font-semibold ${(d._count?.members || 0) > 0 ? "text-accent" : "text-label-quaternary"}`}>{d._count?.members || 0}</p>
                  <p className="text-caption text-label-quaternary">{d._count?.tehsils || 0} tehsils</p>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-separator">
                  {loadingTehsils === d.id ? (
                    <div className="space-y-2 px-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-8 rounded-apple" />)}</div>
                  ) : districtTehsils.length > 0 ? (
                    <div className="space-y-2">
                      {districtTehsils.map((th: any) => {
                        const memberCount = th._count?.members || 0;
                        const totalDist = d._count?.members || 1;
                        const pct = totalDist > 0 ? Math.round((memberCount / totalDist) * 100) : 0;
                        return (
                          <div key={th.id} className="px-2">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2">
                                <MapPin size={11} className="text-label-quaternary" />
                                <p className="text-callout font-medium text-label-primary">{th.name}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-callout font-semibold ${memberCount > 0 ? "text-accent" : "text-label-quaternary"}`}>{memberCount}</span>
                                {memberCount > 0 && <span className="text-caption text-label-quaternary">({pct}%)</span>}
                              </div>
                            </div>
                            <div className="h-1 bg-surface-tertiary rounded-full overflow-hidden ml-5">
                              <div className="h-full rounded-full bg-accent/60 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      {(() => {
                        const tehsilTotal = districtTehsils.reduce((s: number, th: any) => s + (th._count?.members || 0), 0);
                        const unassigned = (d._count?.members || 0) - tehsilTotal;
                        return unassigned > 0 ? (
                          <div className="px-2 pt-1.5 border-t border-dashed border-separator">
                            <div className="flex justify-between items-center">
                              <span className="text-caption text-label-quaternary italic ml-5">Unassigned</span>
                              <span className="text-callout font-semibold text-label-quaternary">{unassigned}</span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : <p className="text-callout text-label-tertiary text-center py-3">No tehsils</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-caption text-label-quaternary text-center mt-4">
        {filtered.length} of {districts.length} districts · Tap to expand
      </p>
    </div>
  );
}
