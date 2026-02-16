"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    fetchMembers();
  }, [page]);

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
    await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchMembers();
  };

  const updateRole = async (id: string, newRole: string) => {
    if (!confirm(`Set role to ${newRole}?`)) return;
    await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchMembers();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Members ({total})</h1>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.membershipNumber} • {m.constituency?.code || "—"}</p>
                    <p className="text-xs text-gray-400">Joined {new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-party-red">{m.score}</p>
                    <p className="text-[10px] text-gray-400">#{m.rank || "—"}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && updateStatus(m.id, e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1 flex-1"
                  >
                    <option value="">Status...</option>
                    <option value="ACTIVE">✅ Active</option>
                    <option value="PENDING">⏳ Pending</option>
                    <option value="SUSPENDED">🚫 Suspend</option>
                    <option value="INACTIVE">💤 Inactive</option>
                  </select>
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && updateRole(m.id, e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1 flex-1"
                  >
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

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm px-4">← Prev</button>
              <span className="py-2 text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="btn-secondary text-sm px-4">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
