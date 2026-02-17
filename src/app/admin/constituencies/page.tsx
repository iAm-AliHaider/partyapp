"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronRight, MapPin, Users, Layers } from "lucide-react";

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
      try {
        const res = await fetch(`/api/tehsils?districtId=${districtId}`);
        const data = await res.json();
        setTehsils((prev) => ({ ...prev, [districtId]: data.tehsils || [] }));
      } catch {
        setTehsils((prev) => ({ ...prev, [districtId]: [] }));
      }
      setLoadingTehsils(null);
    }
  };

  const totalMembers = districts.reduce((sum, d) => sum + (d._count?.members || 0), 0);
  const covered = districts.filter((d) => (d._count?.members || 0) > 0).length;
  const totalTehsils = districts.reduce((sum, d) => sum + (d._count?.tehsils || 0), 0);

  if (loading) return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-apple-lg" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: districts.length, label: "Districts", icon: MapPin, color: "text-accent" },
          { value: totalTehsils, label: "Tehsils", icon: Layers, color: "text-blue-600" },
          { value: covered, label: "Covered", icon: MapPin, color: "text-emerald-600" },
          { value: totalMembers, label: "Members", icon: Users, color: "text-purple-600" },
        ].map((s, i) => (
          <div key={i} className="card text-center py-3">
            <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
            <p className={`text-headline ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="text-caption text-label-tertiary">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Province Segmented Control */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        <button onClick={() => setSelectedProvince("All")} className={`pill whitespace-nowrap ${selectedProvince === "All" ? "pill-active" : "pill-inactive"}`}>
          All
        </button>
        {provinces.map((p) => (
          <button key={p.id} onClick={() => setSelectedProvince(p.id)} className={`pill whitespace-nowrap ${selectedProvince === p.id ? "pill-active" : "pill-inactive"}`}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search districts..." className="input-field !pl-10" />
      </div>

      {/* District List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <MapPin size={32} className="text-label-quaternary mx-auto mb-2" />
            <p className="text-body text-label-secondary">No districts found</p>
          </div>
        ) : (
          filtered.map((d) => {
            const isExpanded = expandedDistrict === d.id;
            const districtTehsils = tehsils[d.id] || [];
            const hasTehsils = (d._count?.tehsils || 0) > 0;
            const memberCount = d._count?.members || 0;

            return (
              <div key={d.id} className="card !p-0 overflow-hidden">
                <button
                  onClick={() => hasTehsils ? toggleDistrict(d.id) : null}
                  className={`w-full flex justify-between items-center px-4 py-3.5 ${hasTehsils ? "active:bg-surface-tertiary/50" : ""}`}
                >
                  <div className="flex items-center gap-3 text-left min-w-0">
                    {hasTehsils ? (
                      isExpanded ? <ChevronDown size={14} className="text-label-tertiary flex-shrink-0" /> : <ChevronRight size={14} className="text-label-tertiary flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-body font-medium text-label-primary truncate">{d.name}</p>
                      <p className="text-caption text-label-tertiary">{d.province?.name}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-body font-semibold ${memberCount > 0 ? "text-accent" : "text-label-quaternary"}`}>
                      {memberCount}
                    </p>
                    <p className="text-caption text-label-quaternary">{d._count?.tehsils || 0} tehsils</p>
                  </div>
                </button>

                {/* Expanded Tehsils */}
                {isExpanded && (
                  <div className="border-t border-separator bg-surface-secondary/50 px-4 py-3 space-y-2.5">
                    {loadingTehsils === d.id ? (
                      <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-7 rounded-apple" />)}</div>
                    ) : districtTehsils.length > 0 ? (
                      <>
                        {districtTehsils.map((th: any) => {
                          const thMembers = th._count?.members || 0;
                          const pct = memberCount > 0 ? Math.round((thMembers / memberCount) * 100) : 0;
                          return (
                            <div key={th.id}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-callout text-label-primary">{th.name}</span>
                                <span className={`text-callout font-semibold ${thMembers > 0 ? "text-accent" : "text-label-quaternary"}`}>
                                  {thMembers} <span className="text-caption text-label-quaternary font-normal">{pct > 0 ? `(${pct}%)` : ""}</span>
                                </span>
                              </div>
                              <div className="h-1 bg-surface-tertiary rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-accent/60 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {(() => {
                          const tehsilTotal = districtTehsils.reduce((s: number, th: any) => s + (th._count?.members || 0), 0);
                          const unassigned = memberCount - tehsilTotal;
                          return unassigned > 0 ? (
                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-separator">
                              <span className="text-caption text-label-quaternary italic">Unassigned</span>
                              <span className="text-callout font-semibold text-label-quaternary">{unassigned}</span>
                            </div>
                          ) : null;
                        })()}
                      </>
                    ) : (
                      <p className="text-callout text-label-tertiary text-center py-2">No tehsils</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-caption text-label-quaternary text-center pt-2">
        {filtered.length} of {districts.length} districts
      </p>
    </div>
  );
}
