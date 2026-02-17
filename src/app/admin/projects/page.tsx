"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { key: "CAMPAIGN", label: "🗳️ Campaign", color: "red" },
  { key: "PHILANTHROPY", label: "💚 Philanthropy", color: "green" },
  { key: "VOTER_REG", label: "📝 Voter Registration", color: "blue" },
  { key: "RALLY", label: "📢 Rally / Jalsa", color: "orange" },
  { key: "DOOR_TO_DOOR", label: "🚪 Door-to-Door", color: "purple" },
  { key: "SOCIAL_MEDIA", label: "📱 Social Media", color: "pink" },
  { key: "COMMUNITY", label: "🤝 Community Service", color: "teal" },
  { key: "FUNDRAISING", label: "💰 Fundraising", color: "yellow" },
  { key: "EDUCATION", label: "📚 Voter Education", color: "indigo" },
  { key: "INFRASTRUCTURE", label: "🏗️ Infrastructure", color: "gray" },
  { key: "OTHER", label: "📦 Other", color: "gray" },
];

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function AdminProjects() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("");
  const [districts, setDistricts] = useState<any[]>([]);

  // Create form
  const [form, setForm] = useState({
    title: "", titleUrdu: "", description: "", category: "CAMPAIGN",
    priority: "MEDIUM", startDate: "", endDate: "", budget: "",
    targetVotes: "", targetMembers: "", districtIds: [] as string[],
  });
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
    const r = await fetch(url);
    const d = await r.json();
    setProjects(d.projects || []);
    setLoading(false);
  };

  useEffect(() => { if (authStatus === "authenticated") loadProjects(); }, [filter]);

  const createProject = async () => {
    setCreating(true);
    const payload: any = { ...form };
    if (payload.budget) payload.budget = parseFloat(payload.budget);
    if (payload.targetVotes) payload.targetVotes = parseInt(payload.targetVotes);
    if (payload.targetMembers) payload.targetMembers = parseInt(payload.targetMembers);
    if (!payload.budget) delete payload.budget;
    if (!payload.targetVotes) delete payload.targetVotes;
    if (!payload.targetMembers) delete payload.targetMembers;
    if (!payload.startDate) delete payload.startDate;
    if (!payload.endDate) delete payload.endDate;

    const res = await fetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ title: "", titleUrdu: "", description: "", category: "CAMPAIGN", priority: "MEDIUM", startDate: "", endDate: "", budget: "", targetVotes: "", targetMembers: "", districtIds: [] });
      loadProjects();
    }
    setCreating(false);
  };

  const catInfo = (key: string) => CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1];

  const statusColor = (s: string) => {
    const m: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-600", ACTIVE: "bg-green-100 text-green-700", PAUSED: "bg-yellow-100 text-yellow-700", COMPLETED: "bg-blue-100 text-blue-700", CANCELLED: "bg-red-100 text-red-600" };
    return m[s] || "bg-gray-100 text-gray-600";
  };

  const priorityColor = (p: string) => {
    const m: Record<string, string> = { LOW: "text-gray-400", MEDIUM: "text-blue-500", HIGH: "text-orange-500", URGENT: "text-red-600" };
    return m[p] || "";
  };

  const toggleDistrict = (id: string) => {
    setForm(prev => ({
      ...prev,
      districtIds: prev.districtIds.includes(id)
        ? prev.districtIds.filter(d => d !== id)
        : [...prev.districtIds, id],
    }));
  };

  if (loading) return <div className="space-y-3 p-2">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">📋 Projects & Campaigns</h1>
        <button onClick={() => setShowCreate(true)} className="bg-party-red text-white px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95">+ New</button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setFilter("")} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap ${!filter ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap ${filter === s ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>{s}</button>
        ))}
      </div>

      {/* Projects List */}
      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className="card block active:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{p.title}</p>
                  {p.titleUrdu && <p className="text-[10px] text-gray-400 font-urdu">{p.titleUrdu}</p>}
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ml-2 ${statusColor(p.status)}`}>{p.status}</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-gray-50 px-1.5 py-0.5 rounded">{catInfo(p.category).label}</span>
                <span className={`text-[10px] font-bold ${priorityColor(p.priority)}`}>● {p.priority}</span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-party-red to-party-gold" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="text-[10px] text-gray-400">{p.progress}%</span>
              </div>

              <div className="flex justify-between text-[10px] text-gray-400">
                <span>{p.totalTasks} tasks • {p.districts?.length || 0} districts</span>
                <span>{p.createdBy?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No projects yet</p>
          <p className="text-xs mt-1">Create your first campaign or activity</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 safe-area-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Create Project</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 text-xl">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field mt-1" placeholder="e.g. Food Drive Lahore" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">عنوان (Urdu)</label>
                <input value={form.titleUrdu} onChange={e => setForm(p => ({ ...p, titleUrdu: e.target.value }))} className="input-field mt-1 font-urdu text-right" placeholder="اردو عنوان" dir="rtl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field mt-1" rows={3} placeholder="Describe the campaign..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Category *</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field mt-1 text-xs">
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="input-field mt-1 text-xs">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="input-field mt-1 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="input-field mt-1 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Budget (₨)</label>
                  <input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} className="input-field mt-1 text-xs" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Target Votes</label>
                  <input type="number" value={form.targetVotes} onChange={e => setForm(p => ({ ...p, targetVotes: e.target.value }))} className="input-field mt-1 text-xs" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Target Members</label>
                  <input type="number" value={form.targetMembers} onChange={e => setForm(p => ({ ...p, targetMembers: e.target.value }))} className="input-field mt-1 text-xs" placeholder="0" />
                </div>
              </div>

              {/* District selector */}
              <div>
                <label className="text-xs font-semibold text-gray-600">Target Districts ({form.districtIds.length} selected)</label>
                <div className="max-h-32 overflow-y-auto mt-1 border rounded-xl divide-y">
                  {districts.map((d: any) => (
                    <button key={d.id} type="button" onClick={() => toggleDistrict(d.id)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex justify-between ${form.districtIds.includes(d.id) ? "bg-party-red/5" : ""}`}>
                      <span>{d.name} — {d.province?.name} ({d._count?.members || 0})</span>
                      {form.districtIds.includes(d.id) && <span className="text-party-red">✓</span>}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Leave empty for party-wide project</p>
              </div>

              <button onClick={createProject} disabled={creating || !form.title} className="w-full bg-party-red text-white py-3 rounded-xl font-semibold active:scale-95 disabled:opacity-50">
                {creating ? "Creating..." : "🚀 Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
