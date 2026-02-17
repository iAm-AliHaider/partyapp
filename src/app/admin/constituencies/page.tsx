"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminDistrictsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Expandable tehsil state
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
        setDistricts(dists);
        setFiltered(dists);
        setLoading(false);
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
    if (expandedDistrict === districtId) {
      setExpandedDistrict(null);
      return;
    }
    setExpandedDistrict(districtId);

    // Load tehsils if not cached
    if (!tehsils[districtId]) {
      setLoadingTehsils(districtId);
      try {
        const res = await fetch(`/api/tehsils?districtId=${districtId}`);
        const data = await res.json();
        setTehsils(prev => ({ ...prev, [districtId]: data.tehsils || [] }));
      } catch {
        setTehsils(prev => ({ ...prev, [districtId]: [] }));
      }
      setLoadingTehsils(null);
    }
  };

  const totalMembers = districts.reduce((sum, d) => sum + (d._count?.members || 0), 0);
  const covered = districts.filter((d) => (d._count?.members || 0) > 0).length;
  const totalTehsils = districts.reduce((sum, d) => sum + (d._count?.tehsils || 0), 0);

  if (loading) return <div className="animate-pulse space-y-3 p-6">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Districts & Tehsils</h1>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="card text-center py-2">
          <p className="text-lg font-bold text-party-red">{districts.length}</p>
          <p className="text-[9px] text-gray-500">Districts</p>
        </div>
        <div className="card text-center py-2">
          <p className="text-lg font-bold text-blue-600">{totalTehsils}</p>
          <p className="text-[9px] text-gray-500">Tehsils</p>
        </div>
        <div className="card text-center py-2">
          <p className="text-lg font-bold text-green-600">{covered}</p>
          <p className="text-[9px] text-gray-500">Covered</p>
        </div>
        <div className="card text-center py-2">
          <p className="text-lg font-bold text-purple-600">{totalMembers}</p>
          <p className="text-[9px] text-gray-500">Members</p>
        </div>
      </div>

      {/* Province Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button onClick={() => setSelectedProvince("All")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${selectedProvince === "All" ? "bg-party-red text-white" : "bg-gray-100 text-gray-600"}`}>
          All
        </button>
        {provinces.map((p) => (
          <button key={p.id} onClick={() => setSelectedProvince(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${selectedProvince === p.id ? "bg-party-red text-white" : "bg-gray-100 text-gray-600"}`}>
            {p.name}
          </button>
        ))}
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search districts..." className="input-field text-sm mb-4" />

      {/* List */}
      <div className="space-y-2">
        {filtered.map((d) => {
          const isExpanded = expandedDistrict === d.id;
          const districtTehsils = tehsils[d.id] || [];
          const hasTehsils = (d._count?.tehsils || 0) > 0;

          return (
            <div key={d.id} className="card overflow-hidden">
              {/* District Row */}
              <button
                onClick={() => hasTehsils ? toggleDistrict(d.id) : null}
                className={`w-full flex justify-between items-center ${hasTehsils ? "cursor-pointer active:bg-gray-50" : ""}`}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    {hasTehsils && (
                      <span className={`text-[10px] transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.province?.name}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${(d._count?.members || 0) > 0 ? "text-party-red" : "text-gray-300"}`}>
                    {d._count?.members || 0}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {d._count?.tehsils || 0} tehsils
                  </p>
                </div>
              </button>

              {/* Expanded Tehsil Breakdown */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {loadingTehsils === d.id ? (
                    <div className="animate-pulse space-y-2 px-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg" />)}
                    </div>
                  ) : districtTehsils.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-2 mb-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Tehsil</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Members</p>
                      </div>
                      {districtTehsils.map((th: any) => {
                        const memberCount = th._count?.members || 0;
                        const totalDistrictMembers = d._count?.members || 1;
                        const pct = totalDistrictMembers > 0 ? Math.round((memberCount / totalDistrictMembers) * 100) : 0;
                        return (
                          <div key={th.id} className="px-2">
                            <div className="flex justify-between items-center mb-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400">📍</span>
                                <div>
                                  <p className="text-xs font-medium">{th.name}</p>
                                  {th.nameUrdu && <p className="text-[9px] text-gray-400 font-urdu">{th.nameUrdu}</p>}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-bold ${memberCount > 0 ? "text-party-red" : "text-gray-300"}`}>
                                  {memberCount}
                                </span>
                                {memberCount > 0 && (
                                  <span className="text-[9px] text-gray-400 ml-1">({pct}%)</span>
                                )}
                              </div>
                            </div>
                            {/* Mini progress bar */}
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-5">
                              <div className="h-full rounded-full bg-party-red/60 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}

                      {/* Unassigned count */}
                      {(() => {
                        const tehsilTotal = districtTehsils.reduce((s: number, th: any) => s + (th._count?.members || 0), 0);
                        const unassigned = (d._count?.members || 0) - tehsilTotal;
                        if (unassigned > 0) {
                          return (
                            <div className="px-2 pt-1 border-t border-dashed border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-400 italic ml-5">No tehsil assigned</span>
                                <span className="text-xs font-bold text-gray-400">{unassigned}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 text-xs py-3">No tehsils in this district</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">Showing {filtered.length} of {districts.length} districts • Tap to expand tehsils</p>
    </div>
  );
}
