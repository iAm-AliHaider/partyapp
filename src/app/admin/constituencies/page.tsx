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

  const totalMembers = districts.reduce((sum, d) => sum + (d._count?.members || 0), 0);
  const covered = districts.filter((d) => (d._count?.members || 0) > 0).length;

  if (loading) return <div className="animate-pulse space-y-3 p-6">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Districts & Tehsils</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center"><p className="text-xl font-bold text-party-red">{districts.length}</p><p className="text-xs text-gray-500">Districts</p></div>
        <div className="card text-center"><p className="text-xl font-bold text-blue-600">{covered}</p><p className="text-xs text-gray-500">Covered</p></div>
        <div className="card text-center"><p className="text-xl font-bold text-purple-600">{totalMembers}</p><p className="text-xs text-gray-500">Members</p></div>
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
        {filtered.map((d) => (
          <div key={d.id} className="card">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{d.name}</p>
                <p className="text-xs text-gray-500">{d.province?.name || "—"}</p>
                {d._count?.tehsils > 0 && (
                  <p className="text-[10px] text-gray-400">{d._count.tehsils} tehsils</p>
                )}
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${(d._count?.members || 0) > 0 ? "text-party-red" : "text-gray-300"}`}>
                  {d._count?.members || 0}
                </p>
                <p className="text-[10px] text-gray-400">members</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">Showing {filtered.length} of {districts.length}</p>
    </div>
  );
}
