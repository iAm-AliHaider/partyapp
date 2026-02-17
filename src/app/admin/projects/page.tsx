"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, FolderKanban, Check, Flag, Calendar, Target, Wallet } from "lucide-react";

const CATEGORIES = [
  { key: "CAMPAIGN", label: "Campaign" },
  { key: "PHILANTHROPY", label: "Philanthropy" },
  { key: "VOTER_REG", label: "Voter Registration" },
  { key: "RALLY", label: "Rally / Jalsa" },
  { key: "DOOR_TO_DOOR", label: "Door-to-Door" },
  { key: "SOCIAL_MEDIA", label: "Social Media" },
  { key: "COMMUNITY", label: "Community Service" },
  { key: "FUNDRAISING", label: "Fundraising" },
  { key: "EDUCATION", label: "Voter Education" },
  { key: "INFRASTRUCTURE", label: "Infrastructure" },
  { key: "OTHER", label: "Other" },
];

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const statusBadge: Record<string, string> = { DRAFT: "badge-gray", ACTIVE: "badge-green", PAUSED: "badge-yellow", COMPLETED: "badge-blue", CANCELLED: "badge-red" };
const priorityColor: Record<string, string> = { LOW: "text-label-tertiary", MEDIUM: "text-blue-600", HIGH: "text-orange-500", URGENT: "text-accent" };

export default function AdminProjects() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("");
  const [districts, setDistricts] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", titleUrdu: "", description: "", category: "CAMPAIGN", priority: "MEDIUM", startDate: "", endDate: "", budget: "", targetVotes: "", targetMembers: "", districtIds: [] as string[] });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) router.push("/home");
      loadProjects();
      fetch("/api/districts").then(r => r.json()).then(d => setDistricts(d.districts || []));
    }
  }, [authStatus, session, router]);

  const loadProjects = async () => {
    const url = filter ? `/api/projects?status=${filter}` : "/api/projects";
    const r = await fetch(url); const d = await r.json();
    setProjects(d.projects || []); setLoading(false);
  };

  useEffect(() => { if (authStatus === "authenticated") loadProjects(); }, [filter]);

  const createProject = async () => {
    setCreating(true);
    const payload: any = { ...form };
    if (payload.budget) payload.budget = parseFloat(payload.budget);
    if (payload.targetVotes) payload.targetVotes = parseInt(payload.targetVotes);
    if (payload.targetMembers) payload.targetMembers = parseInt(payload.targetMembers);
    ["budget", "targetVotes", "targetMembers", "startDate", "endDate"].forEach(k => { if (!payload[k]) delete payload[k]; });
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setShowCreate(false); setForm({ title: "", titleUrdu: "", description: "", category: "CAMPAIGN", priority: "MEDIUM", startDate: "", endDate: "", budget: "", targetVotes: "", targetMembers: "", districtIds: [] }); loadProjects(); }
    setCreating(false);
  };

  const catLabel = (key: string) => CATEGORIES.find(c => c.key === key)?.label || key;

  const toggleDistrict = (id: string) => setForm(prev => ({ ...prev, districtIds: prev.districtIds.includes(id) ? prev.districtIds.filter(d => d !== id) : [...prev.districtIds, id] }));

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-apple-lg" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-title tracking-tight">Projects</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary !py-2 !px-4 text-subhead flex items-center gap-1.5">
          <Plus size={15} /> New
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setFilter("")} className={`pill ${!filter ? "pill-active" : "pill-inactive"}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`pill ${filter === s ? "pill-active" : "pill-inactive"}`}>{s}</button>
        ))}
      </div>

      {/* List */}
      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className="card block tap-scale">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-label-primary truncate">{p.title}</p>
                  {p.titleUrdu && <p className="text-caption text-label-tertiary font-urdu">{p.titleUrdu}</p>}
                </div>
                <span className={`badge ${statusBadge[p.status] || "badge-gray"} ml-2`}>{p.status}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-gray">{catLabel(p.category)}</span>
                <span className={`text-caption font-semibold ${priorityColor[p.priority] || ""}`}>{p.priority}</span>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="text-caption text-label-tertiary">{p.progress}%</span>
              </div>

              <div className="flex justify-between text-caption text-label-quaternary">
                <span>{p.totalTasks} tasks · {p.districts?.length || 0} districts</span>
                <span>{p.createdBy?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <FolderKanban size={40} className="text-label-quaternary mx-auto mb-3" />
          <p className="text-body font-medium text-label-secondary">No projects yet</p>
          <p className="text-caption text-label-tertiary mt-1">Create your first campaign</p>
        </div>
      )}

      {/* Create Sheet */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-primary rounded-t-apple-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 safe-area-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-title-sm">New Project</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center"><X size={16} className="text-label-secondary" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-caption font-medium text-label-secondary mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder="e.g. Food Drive Lahore" />
              </div>
              <div>
                <label className="text-caption font-medium text-label-secondary mb-1 block">Title (Urdu)</label>
                <input value={form.titleUrdu} onChange={e => setForm(p => ({ ...p, titleUrdu: e.target.value }))} className="input-field font-urdu" dir="rtl" placeholder="اردو عنوان" />
              </div>
              <div>
                <label className="text-caption font-medium text-label-secondary mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field" rows={3} placeholder="Describe the campaign..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption font-medium text-label-secondary mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field">{CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
                </div>
                <div>
                  <label className="text-caption font-medium text-label-secondary mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="input-field">{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="input-field" /></div>
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">End Date</label><input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="input-field" /></div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Budget</label><input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} className="input-field" placeholder="PKR" /></div>
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Votes</label><input type="number" value={form.targetVotes} onChange={e => setForm(p => ({ ...p, targetVotes: e.target.value }))} className="input-field" placeholder="0" /></div>
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Members</label><input type="number" value={form.targetMembers} onChange={e => setForm(p => ({ ...p, targetMembers: e.target.value }))} className="input-field" placeholder="0" /></div>
              </div>

              <div>
                <label className="text-caption font-medium text-label-secondary mb-1 block">Districts ({form.districtIds.length})</label>
                <div className="max-h-32 overflow-y-auto card-grouped">
                  {districts.map((d: any) => (
                    <button key={d.id} type="button" onClick={() => toggleDistrict(d.id)} className={`list-row w-full ${form.districtIds.includes(d.id) ? "bg-accent-50" : ""}`}>
                      <span className="text-callout text-label-primary flex-1 text-left">{d.name} — {d.province?.name}</span>
                      {form.districtIds.includes(d.id) && <Check size={14} className="text-accent" />}
                    </button>
                  ))}
                </div>
                <p className="text-caption text-label-quaternary mt-1">Leave empty for party-wide</p>
              </div>

              <button onClick={createProject} disabled={creating || !form.title} className="btn-primary w-full">
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
