"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Shield, UserCheck, UserX, Clock } from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  ACTIVE: { color: "text-emerald-600", bg: "bg-emerald-50", icon: UserCheck },
  PENDING: { color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  SUSPENDED: { color: "text-red-500", bg: "bg-red-50", icon: UserX },
  INACTIVE: { color: "text-gray-400", bg: "bg-gray-50", icon: UserX },
};

export default function AdminMembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) { router.push("/home"); return; }
    }
  }, [status, session, router]);

  useEffect(() => { fetchMembers(); }, [page, statusFilter]);

  const fetchMembers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data.members || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const doSearch = () => { setPage(1); fetchMembers(); };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    fetchMembers();
  };

  const updateRole = async (id: string, newRole: string) => {
    await fetch(`/api/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
    fetchMembers();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Search name, phone, ID..."
          className="input-field !pl-10 !pr-16"
        />
        <button onClick={doSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-accent text-subhead font-semibold px-2 py-1">
          Search
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {[
          { key: "", label: "All", count: total },
          { key: "ACTIVE", label: "Active" },
          { key: "PENDING", label: "Pending" },
          { key: "SUSPENDED", label: "Suspended" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setStatusFilter(f.key); setPage(1); }}
            className={`pill whitespace-nowrap ${statusFilter === f.key ? "pill-active" : "pill-inactive"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-caption text-label-tertiary">{total} member{total !== 1 ? "s" : ""}</p>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-24 rounded-apple-lg" />)}</div>
      ) : members.length === 0 ? (
        <div className="card text-center py-16">
          <Search size={32} className="text-label-quaternary mx-auto mb-3" />
          <p className="text-body text-label-secondary">No members found</p>
        </div>
      ) : (
        <div className="card-grouped">
          {members.map((m, idx) => {
            const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.INACTIVE;
            const StatusIcon = sc.icon;
            return (
              <div key={m.id} className={`px-4 py-3.5 ${idx > 0 ? "border-t border-separator" : ""}`}>
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full ${sc.bg} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon size={18} className={sc.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-body font-semibold text-label-primary truncate">{m.name}</p>
                        <p className="text-caption text-label-tertiary">{m.membershipNumber} · {m.district?.name || "—"}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-headline text-label-primary">{m.score || 0}</p>
                        <p className="text-caption text-label-quaternary">pts</p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-2.5">
                      <select
                        value={m.status}
                        onChange={(e) => updateStatus(m.id, e.target.value)}
                        className={`text-caption ${sc.bg} ${sc.color} rounded-apple px-2.5 py-1.5 font-medium outline-none flex-1`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                      <select
                        value={m.role}
                        onChange={(e) => updateRole(m.id, e.target.value)}
                        className="text-caption bg-surface-tertiary text-label-secondary rounded-apple px-2.5 py-1.5 font-medium outline-none flex-1"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ORGANIZER">Organizer</option>
                        <option value="DISTRICT_HEAD">District Head</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale disabled:opacity-30"
          >
            <ChevronLeft size={16} className="text-label-secondary" />
          </button>
          <span className="text-subhead text-label-secondary font-medium">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale disabled:opacity-30"
          >
            <ChevronRight size={16} className="text-label-secondary" />
          </button>
        </div>
      )}
    </div>
  );
}
