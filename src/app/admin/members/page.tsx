"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminMembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) { router.push("/home"); return; }
    }
  }, [status, session, router]);

  useEffect(() => { fetchMembers(); }, [page]);

  const fetchMembers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (filter) params.set("constituencyId", filter);
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data.members || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Set status to ${newStatus}?`)) return;
    await fetch(`/api/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    fetchMembers();
  };

  const updateRole = async (id: string, newRole: string) => {
    if (!confirm(`Set role to ${newRole}?`)) return;
    await fetch(`/api/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
    fetchMembers();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-title tracking-tight">Members</h1>
        <span className="badge badge-gray text-subhead">{total}</span>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-24 rounded-apple-lg" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-body font-semibold text-label-primary">{m.name}</p>
                    <p className="text-caption text-label-tertiary font-mono">{m.membershipNumber} · {m.district?.name || "—"}</p>
                    <p className="text-caption text-label-quaternary">Joined {new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-headline text-label-primary">{m.score}</p>
                    <p className="text-caption text-label-quaternary">#{m.rank || "—"}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <select defaultValue="" onChange={(e) => e.target.value && updateStatus(m.id, e.target.value)}
                    className="text-caption bg-surface-tertiary rounded-apple px-3 py-2 flex-1 outline-none">
                    <option value="">Status...</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <select defaultValue="" onChange={(e) => e.target.value && updateRole(m.id, e.target.value)}
                    className="text-caption bg-surface-tertiary rounded-apple px-3 py-2 flex-1 outline-none">
                    <option value="">Role...</option>
                    <option value="MEMBER">Member</option>
                    <option value="ORGANIZER">Organizer</option>
                    <option value="DISTRICT_HEAD">District Head</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {total > 20 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale disabled:opacity-30">
                <ChevronLeft size={16} className="text-label-secondary" />
              </button>
              <span className="text-subhead text-label-secondary">Page {page} of {Math.ceil(total / 20)}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}
                className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale disabled:opacity-30">
                <ChevronRight size={16} className="text-label-secondary" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
