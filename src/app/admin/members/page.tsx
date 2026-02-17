"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Search, UserCheck, UserX, Clock, Users,
  Phone, MapPin, Calendar, Award, Shield, ChevronDown, X, Filter,
  ArrowUpDown, Eye, Download, UserPlus, Hash, CheckSquare, Square,
} from "lucide-react";

// ── Types & Config ──

type SortKey = "score" | "name" | "date" | "rank";
type SortDir = "asc" | "desc";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  ACTIVE: { color: "text-emerald-600", bg: "bg-emerald-50", icon: UserCheck, label: "Active" },
  PENDING: { color: "text-amber-600", bg: "bg-amber-50", icon: Clock, label: "Pending" },
  SUSPENDED: { color: "text-red-500", bg: "bg-red-50", icon: UserX, label: "Suspended" },
  INACTIVE: { color: "text-gray-400", bg: "bg-gray-50", icon: UserX, label: "Inactive" },
};

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  MEMBER: { label: "Member", color: "text-label-tertiary" },
  ORGANIZER: { label: "Organizer", color: "text-blue-600" },
  DISTRICT_HEAD: { label: "District Head", color: "text-purple-600" },
  ADMIN: { label: "Admin", color: "text-accent" },
  OWNER: { label: "Owner", color: "text-gold" },
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "score", label: "Score" },
  { key: "name", label: "Name" },
  { key: "date", label: "Joined" },
  { key: "rank", label: "Rank" },
];

// ── Member Detail Sheet ──

function MemberSheet({ member, onClose, onUpdate }: { member: any; onClose: () => void; onUpdate: () => void }) {
  const [status, setStatus] = useState(member.status);
  const [role, setRole] = useState(member.role);
  const [saving, setSaving] = useState(false);

  const save = async (field: string, value: string) => {
    setSaving(true);
    await fetch(`/api/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    onUpdate();
  };

  const sc = STATUS_CONFIG[member.status] || STATUS_CONFIG.INACTIVE;
  const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.MEMBER;

  const formatCNIC = (cnic: string) => {
    if (!cnic || cnic.length !== 13) return cnic || "—";
    return `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
  };

  const infoRows = [
    { icon: Hash, label: "ID", value: member.membershipNumber },
    { icon: Phone, label: "Phone", value: member.phone, mono: true },
    { icon: Shield, label: "CNIC", value: formatCNIC(member.cnic), mono: true },
    { icon: MapPin, label: "Location", value: [member.tehsil?.name, member.district?.name, member.province?.name].filter(Boolean).join(", ") || "—" },
    { icon: Calendar, label: "Joined", value: new Date(member.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) },
    { icon: Users, label: "Referrals", value: member._count?.referrals || 0 },
    { icon: Award, label: "Score / Rank", value: `${member.score || 0} pts · #${member.rank || "—"}` },
  ];

  if (member.age) infoRows.push({ icon: Users, label: "Age / Gender", value: `${member.age}y · ${member.gender || "—"}` });
  if (member.referredBy) infoRows.push({ icon: UserPlus, label: "Referred by", value: member.referredBy.name });
  if (member.residentialStatus === "OVERSEAS") infoRows.push({ icon: MapPin, label: "Country", value: member.country });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-surface-primary rounded-t-apple-xl w-full max-w-lg max-h-[85vh] overflow-y-auto safe-area-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 bg-label-quaternary rounded-full" /></div>
        <div className="px-5 pb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className={`w-14 h-14 rounded-full ${sc.bg} flex items-center justify-center flex-shrink-0`}>
              <sc.icon size={24} className={sc.color} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-title-sm text-label-primary truncate">{member.name}</h2>
              <p className="text-callout text-label-tertiary">{member.membershipNumber}</p>
              <div className="flex gap-2 mt-1.5">
                <span className={`badge ${sc.bg} ${sc.color}`}>{sc.label}</span>
                <span className={`badge bg-surface-tertiary ${rc.color}`}>{rc.label}</span>
                {member.isVerified && <span className="badge badge-green">Verified</span>}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0">
              <X size={16} className="text-label-secondary" />
            </button>
          </div>
          <div className="card-grouped mb-5">
            {infoRows.map((row, i) => (
              <div key={i} className="card-row">
                <div className="flex items-center gap-2.5">
                  <row.icon size={14} className="text-label-tertiary flex-shrink-0" />
                  <span className="text-callout text-label-secondary">{row.label}</span>
                </div>
                <span className={`text-callout font-medium text-label-primary ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">Manage</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-caption text-label-secondary mb-1 block">Status</label>
                <select value={status} onChange={(e) => { setStatus(e.target.value); save("status", e.target.value); }} disabled={saving} className="input-field !py-2.5">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}
                </select>
              </div>
              <div>
                <label className="text-caption text-label-secondary mb-1 block">Role</label>
                <select value={role} onChange={(e) => { setRole(e.target.value); save("role", e.target.value); }} disabled={saving} className="input-field !py-2.5">
                  {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}
                </select>
              </div>
            </div>
            {member.phone && (
              <div className="grid grid-cols-2 gap-3">
                <a href={`https://wa.me/${member.phone.replace(/[^0-9]/g, "")}`} target="_blank" className="btn-primary !py-2.5 text-center text-subhead !bg-emerald-600">WhatsApp</a>
                <a href={`tel:${member.phone}`} className="btn-secondary !py-2.5 text-center text-subhead">Call</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Action Bar ──

function BulkActionBar({ count, onApprove, onSuspend, onClear }: { count: number; onApprove: () => void; onSuspend: () => void; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <div className="card bg-accent-50 border border-accent/20 flex items-center gap-3">
      <span className="badge bg-accent text-white">{count}</span>
      <span className="text-callout font-medium text-label-primary flex-1">selected</span>
      <button onClick={onApprove} className="btn-primary !py-2 !px-3 text-subhead !bg-emerald-600">Approve</button>
      <button onClick={onSuspend} className="btn-primary !py-2 !px-3 text-subhead !bg-red-500">Suspend</button>
      <button onClick={onClear} className="text-subhead text-label-tertiary font-semibold">Clear</button>
    </div>
  );
}

// ── Main Page ──

export default function AdminMembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) { router.push("/home"); return; }
    }
  }, [status, session, router]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20", admin: "true", sort: sortBy, dir: sortDir });
    if (statusFilter) params.set("status", statusFilter);
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data.members || []);
    setTotal(data.total || 0);
    if (data.statusCounts) setStatusCounts(data.statusCounts);
    setLoading(false);
  }, [page, statusFilter, roleFilter, sortBy, sortDir, search]);

  useEffect(() => { if (status === "authenticated") fetchMembers(); }, [fetchMembers, status]);

  const doSearch = () => { setPage(1); fetchMembers(); };
  const totalPages = Math.ceil(total / 20);
  const totalAll = Object.values(statusCounts).reduce((s: number, c: any) => s + (c as number), 0);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortBy(key); setSortDir("desc"); }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === members.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(members.map(m => m.id)));
  };

  const bulkUpdate = async (field: string, value: string) => {
    setBulkLoading(true);
    const promises = Array.from(selectedIds).map(id =>
      fetch(`/api/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) })
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
    setBulkLoading(false);
    fetchMembers();
  };

  const exportCSV = () => {
    const params = new URLSearchParams({ format: "csv", admin: "true" });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    window.open(`/api/members?${params}`, "_blank");
  };

  const activeFilters = [statusFilter, roleFilter].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: totalAll || total, color: "text-label-primary" },
          { label: "Active", value: statusCounts.ACTIVE || 0, color: "text-emerald-600" },
          { label: "Pending", value: statusCounts.PENDING || 0, color: "text-amber-600" },
          { label: "Other", value: (statusCounts.SUSPENDED || 0) + (statusCounts.INACTIVE || 0), color: "text-red-500" },
        ].map((s, i) => (
          <div key={i} className="card text-center py-2.5">
            <p className={`text-headline ${s.color}`}>{(s.value as number).toLocaleString()}</p>
            <p className="text-caption text-label-tertiary">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      <BulkActionBar
        count={selectedIds.size}
        onApprove={() => bulkUpdate("status", "ACTIVE")}
        onSuspend={() => bulkUpdate("status", "SUSPENDED")}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Search + Filter + Export */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} placeholder="Name, phone, CNIC..." className="input-field !pl-10 !py-3" />
        </div>
        <button onClick={exportCSV} className="w-12 rounded-apple-lg bg-surface-tertiary flex items-center justify-center text-label-secondary" title="Export CSV">
          <Download size={18} />
        </button>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`w-12 rounded-apple-lg flex items-center justify-center relative transition-colors ${
            showFilters || activeFilters > 0 ? "bg-accent text-white" : "bg-surface-tertiary text-label-secondary"
          }`}>
          <Filter size={18} />
          {activeFilters > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-surface-secondary">{activeFilters}</div>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-callout font-semibold text-label-primary">Filters</p>
            {activeFilters > 0 && <button onClick={() => { setStatusFilter(""); setRoleFilter(""); setPage(1); }} className="text-caption text-accent font-semibold">Clear all</button>}
          </div>
          <div>
            <p className="text-caption text-label-tertiary mb-1.5">Status</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => { setStatusFilter(""); setPage(1); }} className={`pill ${!statusFilter ? "pill-active" : "pill-inactive"}`}>All ({totalAll || total})</button>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => { setStatusFilter(statusFilter === key ? "" : key); setPage(1); }} className={`pill ${statusFilter === key ? "pill-active" : "pill-inactive"}`}>{cfg.label} ({statusCounts[key] || 0})</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-caption text-label-tertiary mb-1.5">Role</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => { setRoleFilter(""); setPage(1); }} className={`pill ${!roleFilter ? "pill-active" : "pill-inactive"}`}>All</button>
              {Object.entries(ROLE_CONFIG).filter(([k]) => k !== "OWNER").map(([key, cfg]) => (
                <button key={key} onClick={() => { setRoleFilter(roleFilter === key ? "" : key); setPage(1); }} className={`pill ${roleFilter === key ? "pill-active" : "pill-inactive"}`}>{cfg.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-caption text-label-tertiary mb-1.5">Sort by</p>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => toggleSort(opt.key)} className={`pill flex items-center gap-1 ${sortBy === opt.key ? "pill-active" : "pill-inactive"}`}>
                  {opt.label}{sortBy === opt.key && <ArrowUpDown size={10} className={sortDir === "desc" ? "" : "rotate-180"} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count + Select All */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {members.length > 0 && (
            <button onClick={toggleSelectAll} className="tap-scale">
              {selectedIds.size === members.length
                ? <CheckSquare size={18} className="text-accent" />
                : <Square size={18} className="text-label-quaternary" />}
            </button>
          )}
          <p className="text-caption text-label-tertiary">
            {total.toLocaleString()} result{total !== 1 ? "s" : ""}
            {search && ` for "${search}"`}
          </p>
        </div>
        {search && (
          <button onClick={() => { setSearch(""); setPage(1); }} className="text-caption text-accent font-semibold flex items-center gap-1"><X size={12} /> Clear</button>
        )}
      </div>

      {/* Member List */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-20 rounded-apple-lg" />)}</div>
      ) : members.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={36} className="text-label-quaternary mx-auto mb-3" />
          <p className="text-body font-medium text-label-secondary">No members found</p>
          <p className="text-caption text-label-tertiary mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.INACTIVE;
            const rc = ROLE_CONFIG[m.role] || ROLE_CONFIG.MEMBER;
            const StatusIcon = sc.icon;
            const isSelected = selectedIds.has(m.id);

            return (
              <div key={m.id} className={`card !p-0 w-full text-left overflow-hidden transition-all ${isSelected ? "ring-2 ring-accent/30" : ""}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Checkbox */}
                  <button onClick={(e) => { e.stopPropagation(); toggleSelect(m.id); }} className="tap-scale flex-shrink-0">
                    {isSelected
                      ? <CheckSquare size={18} className="text-accent" />
                      : <Square size={18} className="text-label-quaternary" />}
                  </button>

                  {/* Avatar */}
                  <button onClick={() => setSelectedMember(m)} className="flex items-center gap-3 flex-1 min-w-0 tap-scale">
                    <div className={`w-11 h-11 rounded-full ${sc.bg} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon size={20} className={sc.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-body font-semibold text-label-primary truncate">{m.name}</p>
                        {m.role !== "MEMBER" && <span className={`text-caption font-semibold ${rc.color}`}>{rc.label}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-caption text-label-tertiary">{m.membershipNumber}</span>
                        <span className="text-caption text-label-quaternary">·</span>
                        <span className="text-caption text-label-tertiary truncate">{m.district?.name || m.province?.name || "—"}</span>
                      </div>
                      {m.phone && <p className="text-caption text-label-quaternary font-mono mt-0.5" dir="ltr">{m.phone}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-headline text-label-primary">{m.score || 0}</p>
                        <p className="text-caption text-label-quaternary">#{m.rank || "—"}</p>
                      </div>
                      <ChevronRight size={16} className="text-label-quaternary" />
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-2 pb-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale disabled:opacity-30">
            <ChevronLeft size={18} className="text-label-secondary" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-full text-subhead font-medium transition-colors ${page === p ? "bg-accent text-white" : "text-label-secondary"}`}>{p}</button>
              );
            })}
          </div>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-10 h-10 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale disabled:opacity-30">
            <ChevronRight size={18} className="text-label-secondary" />
          </button>
        </div>
      )}

      {selectedMember && (
        <MemberSheet member={selectedMember} onClose={() => setSelectedMember(null)} onUpdate={() => { fetchMembers(); setSelectedMember(null); }} />
      )}
    </div>
  );
}
