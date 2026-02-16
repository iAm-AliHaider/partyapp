"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const TYPES = ["All", "NA", "PP", "PS", "PK", "PB"];

export default function AdminConstituenciesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [constituencies, setConstituencies] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) { router.push("/home"); return; }
      fetch("/api/constituencies").then((r) => r.json()).then((data) => {
        setConstituencies(data.constituencies || []);
        setFiltered(data.constituencies || []);
        setLoading(false);
      });
    }
  }, [status, session, router]);

  useEffect(() => {
    let result = constituencies;
    if (typeFilter !== "All") result = result.filter((c) => c.type === typeFilter);
    if (search) result = result.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [typeFilter, search, constituencies]);

  const totalMembers = constituencies.reduce((sum, c) => sum + (c._count?.members || 0), 0);
  const covered = constituencies.filter((c) => (c._count?.members || 0) > 0).length;

  if (loading) return <div className="animate-pulse space-y-3 p-6">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Constituencies</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center"><p className="text-xl font-bold text-party-red">{constituencies.length}</p><p className="text-xs text-gray-500">Total</p></div>
        <div className="card text-center"><p className="text-xl font-bold text-blue-600">{covered}</p><p className="text-xs text-gray-500">Covered</p></div>
        <div className="card text-center"><p className="text-xl font-bold text-purple-600">{totalMembers}</p><p className="text-xs text-gray-500">Members</p></div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${typeFilter === t ? "bg-party-red text-white" : "bg-gray-100 text-gray-600"}`}>
            {t}
          </button>
        ))}
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search constituencies..." className="input-field text-sm mb-4" />

      {/* List */}
      <div className="space-y-2">
        {filtered.map((c) => (
          <div key={c.id} className="card flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{c.code}</p>
              <p className="text-xs text-gray-500">{c.name}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${(c._count?.members || 0) > 0 ? "text-party-red" : "text-gray-300"}`}>
                {c._count?.members || 0}
              </p>
              <p className="text-[10px] text-gray-400">members</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">Showing {filtered.length} of {constituencies.length}</p>
    </div>
  );
}
