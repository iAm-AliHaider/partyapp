"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, Clock, Send, Play, Pin, Search, Filter,
  X, ChevronRight, ChevronLeft, Eye, EyeOff, Phone, MapPin,
  Calendar, Zap, AlertTriangle, FileText, Users, RefreshCw,
  ThumbsUp, ThumbsDown, MessageSquare, ArrowUpDown, Timer, Hash,
  ClipboardCheck, Loader2, RotateCcw,
} from "lucide-react";

// ── Config ──

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; badge: string }> = {
  ASSIGNED:    { label: "Assigned",    color: "text-gray-500",    bg: "bg-gray-50",     icon: Pin,           badge: "badge-gray" },
  ACCEPTED:    { label: "Accepted",    color: "text-blue-600",    bg: "bg-blue-50",     icon: CheckCircle2,  badge: "badge-blue" },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-600",   bg: "bg-amber-50",    icon: Play,          badge: "badge-yellow" },
  SUBMITTED:   { label: "Submitted",   color: "text-purple-600",  bg: "bg-purple-50",   icon: Send,          badge: "badge-blue" },
  VERIFIED:    { label: "Verified",    color: "text-emerald-600", bg: "bg-emerald-50",  icon: CheckCircle2,  badge: "badge-green" },
  REJECTED:    { label: "Rejected",    color: "text-red-500",     bg: "bg-red-50",      icon: XCircle,       badge: "badge-red" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  URGENT: { label: "Urgent", color: "text-red-600", border: "border-l-4 border-l-red-500" },
  HIGH:   { label: "High",   color: "text-orange-500", border: "border-l-4 border-l-orange-400" },
  MEDIUM: { label: "Medium", color: "text-blue-600", border: "border-l-4 border-l-blue-400" },
  LOW:    { label: "Low",    color: "text-gray-400", border: "border-l-4 border-l-gray-300" },
};

// ── Review Detail Sheet ──

function ReviewSheet({ assignment, onClose, onAction }: {
  assignment: any;
  onClose: () => void;
  onAction: (taskId: string, memberId: string, action: "verify" | "reject", note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const a = assignment;
  const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.ASSIGNED;
  const pc = PRIORITY_CONFIG[a.task.priority] || PRIORITY_CONFIG.MEDIUM;
  const StatusIcon = sc.icon;

  const handleAction = async (action: "verify" | "reject") => {
    setActing(true);
    await onAction(a.taskId, a.memberId, action, note || undefined);
    setActing(false);
  };

  const isReviewable = a.status === "SUBMITTED";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-surface-primary rounded-t-apple-xl w-full max-w-lg max-h-[90vh] overflow-y-auto safe-area-bottom"
           onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-label-quaternary rounded-full" />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-5">
            <div className={`w-12 h-12 rounded-full ${sc.bg} flex items-center justify-center flex-shrink-0`}>
              <StatusIcon size={22} className={sc.color} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-title-sm text-label-primary">{a.task.title}</h2>
              {a.task.titleUrdu && <p className="text-callout text-label-tertiary font-urdu" dir="rtl">{a.task.titleUrdu}</p>}
              <div className="flex gap-2 mt-1.5">
                <span className={`badge ${sc.badge}`}>{sc.label}</span>
                <span className={`text-caption font-semibold ${pc.color}`}>{pc.label}</span>
                {a.task.points > 0 && <span className="badge bg-amber-50 text-amber-700 flex items-center gap-0.5"><Zap size={9} /> {a.task.points} pts</span>}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center">
              <X size={16} className="text-label-secondary" />
            </button>
          </div>

          {/* Task Description */}
          {a.task.description && (
            <div className="card bg-surface-secondary mb-4">
              <p className="text-caption font-semibold text-label-tertiary uppercase tracking-wider mb-1">Task Description</p>
              <p className="text-callout text-label-secondary">{a.task.description}</p>
            </div>
          )}

          {/* Task Info */}
          <div className="card-grouped mb-4">
            <div className="card-row">
              <div className="flex items-center gap-2"><FileText size={13} className="text-label-tertiary" /><span className="text-callout text-label-secondary">Project</span></div>
              <span className="text-callout font-medium text-label-primary">{a.task.projectTitle}</span>
            </div>
            <div className="card-row">
              <div className="flex items-center gap-2"><Pin size={13} className="text-label-tertiary" /><span className="text-callout text-label-secondary">Type</span></div>
              <span className="text-callout font-medium text-label-primary">{a.task.type?.replace(/_/g, " ")}</span>
            </div>
            {a.task.dueDate && (
              <div className="card-row">
                <div className="flex items-center gap-2"><Calendar size={13} className="text-label-tertiary" /><span className="text-callout text-label-secondary">Due Date</span></div>
                <span className="text-callout font-medium text-label-primary">{new Date(a.task.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            )}
            <div className="card-row">
              <div className="flex items-center gap-2"><Calendar size={13} className="text-label-tertiary" /><span className="text-callout text-label-secondary">Assigned</span></div>
              <span className="text-callout font-medium text-label-primary">{new Date(a.assignedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>
            </div>
            {a.completedAt && (
              <div className="card-row">
                <div className="flex items-center gap-2"><CheckCircle2 size={13} className="text-label-tertiary" /><span className="text-callout text-label-secondary">Submitted</span></div>
                <span className="text-callout font-medium text-label-primary">{new Date(a.completedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )}
          </div>

          {/* Member Info */}
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-2">Submitted By</p>
          <div className="card flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-surface-tertiary flex items-center justify-center">
              <span className="text-headline font-bold text-label-secondary">{a.member.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-semibold text-label-primary">{a.member.name}</p>
              <p className="text-caption text-label-tertiary">{a.member.membershipNumber} · {a.member.district?.name || a.member.province?.name || "—"}</p>
            </div>
            {a.member.phone && (
              <a href={`https://wa.me/${a.member.phone.replace(/[^0-9]/g, "")}`} target="_blank"
                className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center tap-scale">
                <Phone size={15} className="text-emerald-600" />
              </a>
            )}
          </div>

          {/* Evidence / Submission */}
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-2">Member&apos;s Submission</p>
          {a.evidence ? (
            <div className="card bg-blue-50/50 border border-blue-200 mb-4">
              <div className="flex items-start gap-2">
                <MessageSquare size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-callout text-label-primary whitespace-pre-wrap">{a.evidence}</p>
              </div>
            </div>
          ) : (
            <div className="card bg-surface-tertiary text-center mb-4">
              <p className="text-callout text-label-tertiary">No evidence provided</p>
            </div>
          )}

          {/* Admin Note */}
          {a.note && (
            <>
              <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-2">Admin Note</p>
              <div className="card bg-amber-50/50 border border-amber-200 mb-4">
                <p className="text-callout text-label-primary">{a.note}</p>
              </div>
            </>
          )}

          {/* Actions */}
          {isReviewable && (
            <div className="space-y-3">
              <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">Review Actions</p>

              {/* Quick Approve */}
              <button onClick={() => handleAction("verify")} disabled={acting}
                className="btn-primary w-full !bg-emerald-600 flex items-center justify-center gap-2">
                {acting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                {acting ? "Processing..." : `Approve & Award ${a.task.points} pts`}
              </button>

              {/* Reject with Note */}
              {!showRejectForm ? (
                <button onClick={() => setShowRejectForm(true)}
                  className="btn-secondary w-full flex items-center justify-center gap-2 !text-red-500">
                  <ThumbsDown size={16} /> Reject Submission
                </button>
              ) : (
                <div className="card border border-red-200 bg-red-50/30 space-y-3">
                  <p className="text-callout font-semibold text-red-600">Reject this submission?</p>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="input-field text-callout"
                    rows={2}
                    placeholder="Reason for rejection (will be shown to member)..."
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRejectForm(false)} className="btn-secondary flex-1 !py-2.5 text-subhead">Cancel</button>
                    <button onClick={() => handleAction("reject")} disabled={acting}
                      className="btn-primary flex-1 !py-2.5 text-subhead !bg-red-500 flex items-center justify-center gap-1.5">
                      {acting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      {acting ? "..." : "Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Already reviewed */}
          {a.status === "VERIFIED" && (
            <div className="text-center py-4 bg-emerald-50 rounded-apple-lg">
              <CheckCircle2 size={24} className="text-emerald-600 mx-auto mb-1" />
              <p className="text-body font-semibold text-emerald-700">Verified</p>
              {a.task.points > 0 && <p className="text-caption text-emerald-600">+{a.task.points} points awarded</p>}
            </div>
          )}
          {a.status === "REJECTED" && (
            <div className="text-center py-4 bg-red-50 rounded-apple-lg">
              <XCircle size={24} className="text-red-500 mx-auto mb-1" />
              <p className="text-body font-semibold text-red-600">Rejected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function AdminTasksPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("SUBMITTED"); // Default to review queue
  const [projectFilter, setProjectFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (authStatus === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) { router.push("/home"); return; }
    }
  }, [authStatus, session, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "30" });
    if (statusFilter) params.set("status", statusFilter);
    if (projectFilter) params.set("projectId", projectFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/tasks/admin?${params}`);
    const data = await res.json();
    setAssignments(data.assignments || []);
    setTotal(data.total || 0);
    setStatusCounts(data.statusCounts || {});
    setProjects(data.projects || []);
    setLoading(false);
  }, [page, statusFilter, projectFilter, priorityFilter, search]);

  useEffect(() => { if (authStatus === "authenticated") fetchData(); }, [fetchData, authStatus]);

  const handleAction = async (taskId: string, memberId: string, action: "verify" | "reject", note?: string) => {
    setActionLoading(`${taskId}-${memberId}`);
    try {
      const body: any = { memberId, action };
      if (note) body.note = note;
      await fetch(`/api/tasks/${taskId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSelectedAssignment(null);
      fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const quickAction = async (e: React.MouseEvent, taskId: string, memberId: string, action: "verify" | "reject") => {
    e.stopPropagation();
    if (action === "reject" && !confirm("Reject this submission?")) return;
    await handleAction(taskId, memberId, action);
  };

  const totalAll = Object.values(statusCounts).reduce((s, c) => s + c, 0);
  const submittedCount = statusCounts.SUBMITTED || 0;
  const verifiedCount = statusCounts.VERIFIED || 0;
  const rejectedCount = statusCounts.REJECTED || 0;
  const inProgressCount = (statusCounts.ASSIGNED || 0) + (statusCounts.ACCEPTED || 0) + (statusCounts.IN_PROGRESS || 0);
  const totalPages = Math.ceil(total / 30);
  const activeFilters = [projectFilter, priorityFilter].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="card text-center py-3">
          <p className="text-headline text-purple-600">{submittedCount}</p>
          <p className="text-caption text-label-tertiary">To Review</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-headline text-emerald-600">{verifiedCount}</p>
          <p className="text-caption text-label-tertiary">Verified</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-headline text-red-500">{rejectedCount}</p>
          <p className="text-caption text-label-tertiary">Rejected</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-headline text-blue-600">{inProgressCount}</p>
          <p className="text-caption text-label-tertiary">Active</p>
        </div>
      </div>

      {/* Review Queue Alert */}
      {submittedCount > 0 && statusFilter !== "SUBMITTED" && (
        <button onClick={() => { setStatusFilter("SUBMITTED"); setPage(1); }}
          className="card bg-purple-50 border border-purple-200 w-full text-left tap-scale">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <ClipboardCheck size={20} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-body font-semibold text-purple-700">{submittedCount} submission{submittedCount > 1 ? "s" : ""} awaiting review</p>
              <p className="text-caption text-purple-500">Tap to view review queue</p>
            </div>
            <ChevronRight size={16} className="text-purple-400" />
          </div>
        </button>
      )}

      {/* Status Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        <button onClick={() => { setStatusFilter(""); setPage(1); }} className={`pill whitespace-nowrap ${!statusFilter ? "pill-active" : "pill-inactive"}`}>
          All ({totalAll})
        </button>
        <button onClick={() => { setStatusFilter("SUBMITTED"); setPage(1); }} className={`pill whitespace-nowrap ${statusFilter === "SUBMITTED" ? "pill-active" : "pill-inactive"}`}>
          🔍 Review ({submittedCount})
        </button>
        {Object.entries(STATUS_CONFIG).filter(([k]) => k !== "SUBMITTED").map(([key, cfg]) => (
          <button key={key} onClick={() => { setStatusFilter(statusFilter === key ? "" : key); setPage(1); }}
            className={`pill whitespace-nowrap ${statusFilter === key ? "pill-active" : "pill-inactive"}`}>
            {cfg.label} ({statusCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { setPage(1); fetchData(); } }}
            placeholder="Search member or task..." className="input-field !pl-10 !py-3" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`w-12 rounded-apple-lg flex items-center justify-center relative ${showFilters || activeFilters > 0 ? "bg-accent text-white" : "bg-surface-tertiary text-label-secondary"}`}>
          <Filter size={18} />
          {activeFilters > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-surface-secondary">{activeFilters}</div>}
        </button>
        <button onClick={() => { setLoading(true); fetchData(); }}
          className="w-12 rounded-apple-lg bg-surface-tertiary flex items-center justify-center text-label-secondary">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-callout font-semibold text-label-primary">Filters</p>
            {activeFilters > 0 && <button onClick={() => { setProjectFilter(""); setPriorityFilter(""); setPage(1); }} className="text-caption text-accent font-semibold">Clear</button>}
          </div>
          <div>
            <p className="text-caption text-label-tertiary mb-1.5">Project</p>
            <select value={projectFilter} onChange={e => { setProjectFilter(e.target.value); setPage(1); }} className="input-field !py-2.5">
              <option value="">All Projects</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <p className="text-caption text-label-tertiary mb-1.5">Priority</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => { setPriorityFilter(""); setPage(1); }} className={`pill ${!priorityFilter ? "pill-active" : "pill-inactive"}`}>All</button>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => { setPriorityFilter(priorityFilter === key ? "" : key); setPage(1); }}
                  className={`pill ${priorityFilter === key ? "pill-active" : "pill-inactive"}`}>{cfg.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <p className="text-caption text-label-tertiary">{total} result{total !== 1 ? "s" : ""}</p>

      {/* Assignment List */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-24 rounded-apple-lg" />)}</div>
      ) : assignments.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardCheck size={40} className="text-label-quaternary mx-auto mb-3" />
          <p className="text-body font-medium text-label-secondary">
            {statusFilter === "SUBMITTED" ? "No submissions to review" : "No task assignments found"}
          </p>
          <p className="text-caption text-label-tertiary mt-1">
            {statusFilter === "SUBMITTED" ? "All caught up! 🎉" : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => {
            const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.ASSIGNED;
            const pc = PRIORITY_CONFIG[a.task.priority] || PRIORITY_CONFIG.MEDIUM;
            const StatusIcon = sc.icon;
            const isSubmitted = a.status === "SUBMITTED";
            const isLoading = actionLoading === `${a.taskId}-${a.memberId}`;

            return (
              <button key={a.id} onClick={() => setSelectedAssignment(a)}
                className={`card !p-0 w-full text-left tap-scale overflow-hidden ${pc.border}`}>
                <div className="px-4 py-3">
                  {/* Top row: task + status */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full ${sc.bg} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon size={18} className={sc.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-semibold text-label-primary truncate">{a.task.title}</p>
                      <p className="text-caption text-label-tertiary">{a.task.projectTitle} · {a.task.type?.replace(/_/g, " ")}</p>
                    </div>
                    <span className={`badge ${sc.badge} flex-shrink-0`}>{sc.label}</span>
                  </div>

                  {/* Member row */}
                  <div className="flex items-center gap-2 mb-2 pl-[52px]">
                    <div className="w-6 h-6 rounded-full bg-surface-tertiary flex items-center justify-center">
                      <span className="text-[10px] font-bold text-label-secondary">{a.member.name?.charAt(0)}</span>
                    </div>
                    <span className="text-callout text-label-primary font-medium">{a.member.name}</span>
                    <span className="text-caption text-label-quaternary">·</span>
                    <span className="text-caption text-label-tertiary">{a.member.district?.name || "—"}</span>
                    {a.task.points > 0 && (
                      <span className="text-caption text-gold font-semibold ml-auto flex items-center gap-0.5">
                        <Zap size={9} /> {a.task.points}
                      </span>
                    )}
                  </div>

                  {/* Evidence preview */}
                  {a.evidence && (
                    <div className="ml-[52px] p-2 bg-surface-tertiary rounded-apple mb-2">
                      <p className="text-caption text-label-secondary line-clamp-2">{a.evidence}</p>
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 pl-[52px] text-caption text-label-quaternary">
                    {a.completedAt && <span>{new Date(a.completedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>}
                    {a.task.dueDate && (
                      <span className="flex items-center gap-0.5">
                        <Calendar size={9} /> {new Date(a.task.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    <span className={`font-semibold ${pc.color}`}>{pc.label}</span>
                  </div>

                  {/* Quick Actions for SUBMITTED */}
                  {isSubmitted && (
                    <div className="flex gap-2 mt-3 pl-[52px]">
                      <button onClick={(e) => quickAction(e, a.taskId, a.memberId, "verify")}
                        disabled={isLoading}
                        className="btn-primary flex-1 !py-2 text-subhead !bg-emerald-600 flex items-center justify-center gap-1.5">
                        {isLoading ? <Loader2 size={13} className="animate-spin" /> : <ThumbsUp size={13} />} Approve
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedAssignment(a); }}
                        className="btn-secondary flex-1 !py-2 text-subhead flex items-center justify-center gap-1.5">
                        <Eye size={13} /> Review
                      </button>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="w-10 h-10 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale disabled:opacity-30">
            <ChevronLeft size={18} className="text-label-secondary" />
          </button>
          <span className="text-subhead text-label-secondary">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="w-10 h-10 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale disabled:opacity-30">
            <ChevronRight size={18} className="text-label-secondary" />
          </button>
        </div>
      )}

      {/* Review Sheet */}
      {selectedAssignment && (
        <ReviewSheet
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
