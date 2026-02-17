"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronRight, MapPin, Users, Layers, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";

type SortKey = "members" | "name" | "coverage";

function CoverageDonut({ covered, total, size = 64 }: { covered: number; total: number; size?: number }) {
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={pct > 50 ? "#16A34A" : pct > 20 ? "#D4A843" : "#DC2626"} strokeWidth={6}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-subhead font-bold text-label-primary">{pct}%</span>
      </div>
    </div>
  );
}

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
  const [sortKey, setSortKey] = useState<SortKey>("members");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "members") cmp = (a._count?.members || 0) - (b._count?.members || 0);
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "coverage") {
        const aCov = (a._count?.tehsils || 0) > 0 ? (a._count?.members || 0) / (a._count?.tehsils || 1) : 0;
        const bCov = (b._count?.tehsils || 0) > 0 ? (b._count?.members || 0) / (b._count?.tehsils || 1) : 0;
        cmp = aCov - bCov;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    setFiltered(result);
  }, [selectedProvince, search, districts, sortKey, sortDir]);

  const toggleDistrict = async (districtId: string) => {
    if (expandedDistrict === districtId) { setExpandedDistrict(null); return; }
    setExpandedDistrict(districtId);
    if (!tehsils[districtId]) {
      setLoadingTehsils(districtId);
      try {
        const res = await fetch(`/api/tehsils?districtId=${districtId}`);
        const data = await res.json();
        setTehsils((prev) => ({ ...prev, [districtId]: data.tehsils || [] }));
      } catch { setTehsils((prev) => ({ ...prev, [districtId]: [] })); }
      setLoadingTehsils(null);
    }
  };

  const totalMembers = districts.reduce((sum, d) => sum + (d._count?.members || 0), 0);
  const covered = districts.filter((d) => (d._count?.members || 0) > 0).length;
  const totalTehsils = districts.reduce((sum, d) => sum + (d._count?.tehsils || 0), 0);

  // Top/Bottom 5
  const sortedByMembers = [...districts].sort((a, b) => (b._count?.members || 0) - (a._count?.members || 0));
  const top5 = sortedByMembers.slice(0, 5);
  const bottom5 = sortedByMembers.filter(d => (d._count?.members || 0) > 0).slice(-5).reverse();

  if (loading) return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-apple-lg" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Summary Stats with Coverage Donut */}
      <div className="flex gap-3">
        <div className="card flex items-center gap-3 flex-1">
          <CoverageDonut covered={covered} total={districts.length} />
          <div>
            <p className="text-body font-semibold text-label-primary">{covered}/{districts.length}</p>
            <p className="text-caption text-label-tertiary">Districts covered</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 flex-1">
          <div className="card text-center py-2.5">
            <p className="text-headline text-purple-600">{totalTehsils}</p>
            <p className="text-caption text-label-tertiary">Tehsils</p>
          </div>
          <div className="card text-center py-2.5">
            <p className="text-headline text-accent">{totalMembers.toLocaleString()}</p>
            <p className="text-caption text-label-tertiary">Members</p>
          </div>
        </div>
      </div>

      {/* Top & Bottom Districts */}
      {top5.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={13} className="text-emerald-600" />
              <p className="text-callout font-semibold text-emerald-600">Top 5</p>
            </div>
            {top5.map((d, i) => (
              <div key={d.id} className="flex justify-between py-1.5 border-b last:border-0 border-separator">
                <span className="text-caption text-label-primary truncate flex-1">{d.name}</span>
                <span className="text-caption font-semibold text-emerald-600 ml-2">{d._count?.members || 0}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={13} className="text-red-500" />
              <p className="text-callout font-semibold text-red-500">Bottom 5</p>
            </div>
            {bottom5.map((d, i) => (
              <div key={d.id} className="flex justify-between py-1.5 border-b last:border-0 border-separator">
                <span className="text-caption text-label-primary truncate flex-1">{d.name}</span>
                <span className="text-caption font-semibold text-label-quaternary ml-2">{d._count?.members || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Province Segmented Control */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        <button onClick={() => setSelectedProvince("All")} className={`pill whitespace-nowrap ${selectedProvince === "All" ? "pill-active" : "pill-inactive"}`}>All</button>
        {provinces.map((p) => (
          <button key={p.id} onClick={() => setSelectedProvince(p.id)} className={`pill whitespace-nowrap ${selectedProvince === p.id ? "pill-active" : "pill-inactive"}`}>{p.name}</button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search districts..." className="input-field !pl-10" />
        </div>
        <div className="flex gap-1">
          {(["members", "name", "coverage"] as SortKey[]).map(k => (
            <button key={k} onClick={() => {
              if (sortKey === k) setSortDir(d => d === "desc" ? "asc" : "desc");
              else { setSortKey(k); setSortDir("desc"); }
            }} className={`pill text-caption flex items-center gap-1 ${sortKey === k ? "pill-active" : "pill-inactive"}`}>
              {k === "members" ? "#" : k === "name" ? "A-Z" : "%"}
              {sortKey === k && <ArrowUpDown size={8} />}
            </button>
          ))}
        </div>
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
                    ) : <div className="w-3.5 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-body font-medium text-label-primary truncate">{d.name}</p>
                      <p className="text-caption text-label-tertiary">{d.province?.name}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-body font-semibold ${memberCount > 0 ? "text-accent" : "text-label-quaternary"}`}>{memberCount}</p>
                    <p className="text-caption text-label-quaternary">{d._count?.tehsils || 0} tehsils</p>
                  </div>
                </button>

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
                    ) : <p className="text-callout text-label-tertiary text-center py-2">No tehsils</p>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-caption text-label-quaternary text-center pt-2">{filtered.length} of {districts.length} districts</p>
    </div>
  );
}
