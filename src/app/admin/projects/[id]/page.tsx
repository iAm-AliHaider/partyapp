"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Check, XCircle, Pin, Calendar, Zap, FileText, Upload, Download, Trash2, Eye, ChevronRight, Clock, Users, FolderOpen, AlertTriangle } from "lucide-react";

const TASK_TYPES = [
  { key: "GENERAL", label: "General" }, { key: "VOTER_CONTACT", label: "Voter Contact" },
  { key: "DOOR_KNOCK", label: "Door Knock" }, { key: "PHONE_BANK", label: "Phone Bank" },
  { key: "EVENT_ORGANIZE", label: "Organize Event" }, { key: "DISTRIBUTE", label: "Distribute" },
  { key: "SOCIAL_POST", label: "Social Post" }, { key: "DATA_COLLECTION", label: "Data Collection" },
  { key: "TRANSPORT", label: "Transport" }, { key: "MONITORING", label: "Monitoring" },
];

const DOC_CATEGORIES = [
  { key: "GENERAL", label: "General" }, { key: "REPORT", label: "Report" },
  { key: "PHOTO", label: "Photo" }, { key: "VIDEO", label: "Video" },
  { key: "RECEIPT", label: "Receipt" }, { key: "LETTER", label: "Letter" },
  { key: "PLAN", label: "Plan" }, { key: "EVIDENCE", label: "Evidence" },
  { key: "LEGAL", label: "Legal" }, { key: "MEDIA", label: "Media" },
];

const statusBadge: Record<string, string> = { TODO: "badge-gray", IN_PROGRESS: "badge-yellow", REVIEW: "badge-blue", DONE: "badge-green", CANCELLED: "badge-red" };
const assignBadge: Record<string, string> = { ASSIGNED: "badge-blue", ACCEPTED: "badge-blue", IN_PROGRESS: "badge-yellow", SUBMITTED: "badge-blue", VERIFIED: "badge-green", REJECTED: "badge-red" };

function downloadDataUrl(dataUrl: string, filename: string) { const link = document.createElement("a"); link.href = dataUrl; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
function formatSize(bytes: number) { if (bytes < 1024) return bytes + " B"; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"; return (bytes / 1048576).toFixed(1) + " MB"; }

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const { id } = (params as any);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tasks" | "docs">("tasks");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [assignDistrictId, setAssignDistrictId] = useState("");
  const [districts, setDistricts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [taskForm, setTaskForm] = useState({ title: "", titleUrdu: "", description: "", type: "GENERAL", priority: "MEDIUM", dueDate: "", points: "0", districtId: "", memberIds: [] as string[] });
  const [creating, setCreating] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("GENERAL");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) router.push("/home");
      loadProject(); loadDocuments();
      fetch("/api/districts").then(r => r.json()).then(d => setDistricts(d.districts || []));
      fetch("/api/members").then(r => r.json()).then(d => setMembers(Array.isArray(d) ? d : d.members || []));
    }
  }, [authStatus, session, router, id]);

  const loadProject = async () => { const r = await fetch(`/api/projects/${id}`); if (!r.ok) { router.push("/admin/projects"); return; } setProject(await r.json()); setLoading(false); };
  const loadDocuments = async () => { const r = await fetch(`/api/projects/${id}/documents`); if (r.ok) { const d = await r.json(); setDocuments(d.documents || []); } };
  const updateProjectStatus = async (status: string) => { await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); loadProject(); };

  const createTask = async () => {
    setCreating(true);
    const payload: any = { title: taskForm.title, titleUrdu: taskForm.titleUrdu || undefined, description: taskForm.description || undefined, type: taskForm.type, priority: taskForm.priority, dueDate: taskForm.dueDate || undefined, points: parseInt(taskForm.points) || 0 };
    if (taskForm.memberIds.length) payload.memberIds = taskForm.memberIds;
    else if (taskForm.districtId) payload.districtId = taskForm.districtId;
    const r = await fetch(`/api/projects/${id}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (r.ok) { setShowAddTask(false); setTaskForm({ title: "", titleUrdu: "", description: "", type: "GENERAL", priority: "MEDIUM", dueDate: "", points: "0", districtId: "", memberIds: [] }); loadProject(); }
    else { const err = await r.json(); alert(err.error || "Failed"); }
    setCreating(false);
  };

  const updateTaskStatus = async (taskId: string, status: string) => { await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); loadProject(); };
  const verifySubmission = async (taskId: string, memberId: string, action: "verify" | "reject") => { await fetch(`/api/tasks/${taskId}/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId, action }) }); loadProject(); };
  const assignTask = async (taskId: string) => { if (!assignDistrictId) return; const r = await fetch(`/api/tasks/${taskId}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ districtId: assignDistrictId }) }); if (r.ok) { const d = await r.json(); alert(`Assigned to ${d.assigned} members`); } setShowAssign(null); setAssignDistrictId(""); loadProject(); };
  const deleteTask = async (taskId: string) => { if (!confirm("Delete this task?")) return; await fetch(`/api/tasks/${taskId}`, { method: "DELETE" }); loadProject(); };

  const uploadDocument = async () => {
    const file = fileInputRef.current?.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file); fd.append("category", uploadCategory); if (uploadDesc) fd.append("description", uploadDesc);
    const r = await fetch(`/api/projects/${id}/documents`, { method: "POST", body: fd });
    if (r.ok) { setShowUpload(false); setUploadCategory("GENERAL"); setUploadDesc(""); if (fileInputRef.current) fileInputRef.current.value = ""; loadDocuments(); }
    else { const err = await r.json(); alert(err.error || "Upload failed"); }
    setUploading(false);
  };

  const deleteDocument = async (docId: string) => { if (!confirm("Delete?")) return; await fetch(`/api/documents/${docId}`, { method: "DELETE" }); loadDocuments(); };
  const toggleMember = (mId: string) => setTaskForm(p => ({ ...p, memberIds: p.memberIds.includes(mId) ? p.memberIds.filter(i => i !== mId) : [...p.memberIds, mId] }));
  const filteredMembers = members.filter((m: any) => !memberSearch || m.name?.toLowerCase().includes(memberSearch.toLowerCase()) || m.membershipNumber?.includes(memberSearch));

  if (loading) return <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-apple-lg" />)}</div>;

  const p = project;
  const totalTasks = p?.tasks?.length || 0;
  const doneTasks = p?.tasks?.filter((t: any) => t.status === "DONE").length || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-5">
      <Link href="/admin/projects" className="flex items-center gap-1.5 text-subhead text-label-secondary tap-scale w-fit">
        <ArrowLeft size={14} /> Projects
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-title-sm text-label-primary">{p.title}</h1>
            {p.titleUrdu && <p className="text-caption text-label-tertiary font-urdu">{p.titleUrdu}</p>}
          </div>
          <select value={p.status} onChange={e => updateProjectStatus(e.target.value)} className="text-caption font-semibold bg-surface-tertiary rounded-apple px-2.5 py-1.5 outline-none">
            {["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {p.description && <p className="text-callout text-label-secondary mb-4">{p.description}</p>}

        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          {[
            { value: totalTasks, label: "Tasks", color: "text-accent" },
            { value: doneTasks, label: "Done", color: "text-emerald-600" },
            { value: documents.length, label: "Docs", color: "text-blue-600" },
            { value: `${progress}%`, label: "Progress", color: "text-gold" },
          ].map((s, i) => (
            <div key={i}>
              <p className={`text-headline ${s.color}`}>{s.value}</p>
              <p className="text-caption text-label-quaternary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex flex-wrap gap-3 text-caption text-label-tertiary">
          <span className="flex items-center gap-1"><FolderOpen size={11} /> {p.category?.replace(/_/g, " ")}</span>
          {p.startDate && <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(p.startDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>}
          {p.budget && <span className="flex items-center gap-1">PKR {p.budget.toLocaleString()}</span>}
          <span className="flex items-center gap-1"><Users size={11} /> {p.createdBy?.name}</span>
        </div>

        {p.districts?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {p.districts.map((pd: any) => (
              <span key={pd.id} className="badge badge-red">{pd.district.name}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface-tertiary p-1 rounded-apple-lg">
        {(["tasks", "docs"] as const).map(key => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-apple text-subhead font-semibold transition-all ${tab === key ? "bg-surface-primary shadow-apple text-label-primary" : "text-label-tertiary"}`}>
            {key === "tasks" ? `Tasks (${totalTasks})` : `Documents (${documents.length})`}
          </button>
        ))}
      </div>

      {/* TASKS */}
      {tab === "tasks" && (
        <>
          <button onClick={() => setShowAddTask(true)} className="btn-primary w-full flex items-center justify-center gap-1.5">
            <Plus size={16} /> Add Task
          </button>

          <div className="space-y-3">
            {p.tasks?.length > 0 ? p.tasks.map((t: any) => (
              <div key={t.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-label-primary">{t.title}</p>
                    {t.titleUrdu && <p className="text-caption text-label-tertiary font-urdu">{t.titleUrdu}</p>}
                  </div>
                  <select value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value)}
                    className="text-caption font-semibold bg-surface-tertiary rounded-apple px-2 py-1 outline-none ml-2">
                    {["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {t.description && <p className="text-callout text-label-secondary mb-2">{t.description}</p>}

                <div className="flex flex-wrap gap-3 text-caption text-label-tertiary mb-3">
                  <span className="flex items-center gap-1"><Pin size={10} /> {t.type?.replace(/_/g, " ")}</span>
                  {t.dueDate && <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(t.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>}
                  {t.points > 0 && <span className="flex items-center gap-1 text-gold font-semibold"><Zap size={10} /> {t.points} pts</span>}
                  {t.priority !== "MEDIUM" && <span className="flex items-center gap-1 text-accent font-semibold"><AlertTriangle size={10} /> {t.priority}</span>}
                </div>

                {t.assignments?.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <p className="text-caption font-semibold text-label-tertiary">Assigned ({t.assignments.length})</p>
                    {t.assignments.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between bg-surface-tertiary rounded-apple px-3 py-2">
                        <div>
                          <p className="text-callout font-medium text-label-primary">{a.member.name}</p>
                          <p className="text-caption text-label-tertiary">{a.member.district?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${assignBadge[a.status] || "badge-gray"}`}>{a.status}</span>
                          {a.status === "SUBMITTED" && (
                            <div className="flex gap-1">
                              <button onClick={() => verifySubmission(t.id, a.member.id, "verify")} className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center"><Check size={12} className="text-emerald-600" /></button>
                              <button onClick={() => verifySubmission(t.id, a.member.id, "reject")} className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center"><XCircle size={12} className="text-red-500" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => { setShowAssign(showAssign === t.id ? null : t.id); setAssignDistrictId(""); }} className="btn-ghost text-subhead">Assign</button>
                  <button onClick={() => deleteTask(t.id)} className="text-subhead text-red-400 font-semibold">Delete</button>
                </div>

                {showAssign === t.id && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-apple-lg space-y-2">
                    <select value={assignDistrictId} onChange={e => setAssignDistrictId(e.target.value)} className="input-field">
                      <option value="">Select district...</option>
                      {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name} — {d.province?.name} ({d._count?.members || 0})</option>)}
                    </select>
                    <button onClick={() => assignTask(t.id)} className="btn-primary w-full !py-2.5 text-subhead">Assign District</button>
                  </div>
                )}
              </div>
            )) : (
              <div className="card text-center py-12">
                <FileText size={36} className="text-label-quaternary mx-auto mb-2" />
                <p className="text-body text-label-secondary">No tasks yet</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* DOCUMENTS */}
      {tab === "docs" && (
        <>
          <button onClick={() => setShowUpload(true)} className="btn-primary w-full flex items-center justify-center gap-1.5">
            <Upload size={16} /> Upload Document
          </button>

          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc: any) => {
                const isImage = doc.mimeType?.startsWith("image/");
                return (
                  <div key={doc.id} className="card flex gap-3">
                    <div className="w-12 h-12 rounded-apple bg-surface-tertiary flex items-center justify-center shrink-0 overflow-hidden">
                      {isImage ? <img src={doc.url} alt="" className="w-full h-full object-cover" /> : <FileText size={20} className="text-label-tertiary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-callout font-medium truncate">{doc.originalName}</p>
                      <p className="text-caption text-label-tertiary">{doc.category} · {formatSize(doc.size)} · {doc.uploadedBy?.name}</p>
                      {doc.description && <p className="text-caption text-label-secondary mt-0.5">{doc.description}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <a href={doc.url} target="_blank" className="w-8 h-8 rounded-apple bg-blue-50 flex items-center justify-center"><Eye size={13} className="text-blue-600" /></a>
                      <button onClick={() => downloadDataUrl(doc.url, doc.originalName)} className="w-8 h-8 rounded-apple bg-emerald-50 flex items-center justify-center"><Download size={13} className="text-emerald-600" /></button>
                      <button onClick={() => deleteDocument(doc.id)} className="w-8 h-8 rounded-apple bg-red-50 flex items-center justify-center"><Trash2 size={13} className="text-red-400" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center py-12">
              <FolderOpen size={36} className="text-label-quaternary mx-auto mb-2" />
              <p className="text-body text-label-secondary">No documents yet</p>
              <p className="text-caption text-label-tertiary mt-1">Upload reports, photos, receipts</p>
            </div>
          )}
        </>
      )}

      {/* Upload Sheet */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowUpload(false)}>
          <div className="bg-surface-primary rounded-t-apple-xl w-full max-w-lg p-5 safe-area-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-title-sm">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center"><X size={16} className="text-label-secondary" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">File *</label><input ref={fileInputRef} type="file" className="input-field" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" /><p className="text-caption text-label-quaternary mt-1">Max 10MB</p></div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Category</label><select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="input-field">{DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Description</label><input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className="input-field" placeholder="Optional..." /></div>
              <button onClick={uploadDocument} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-1.5"><Upload size={16} />{uploading ? "Uploading..." : "Upload"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Sheet */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowAddTask(false)}>
          <div className="bg-surface-primary rounded-t-apple-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 safe-area-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-title-sm">Add Task</h2>
              <button onClick={() => setShowAddTask(false)} className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center"><X size={16} className="text-label-secondary" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Title *</label><input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder="e.g. Contact 50 voters" /></div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Title (Urdu)</label><input value={taskForm.titleUrdu} onChange={e => setTaskForm(p => ({ ...p, titleUrdu: e.target.value }))} className="input-field font-urdu" dir="rtl" /></div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Description</label><textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} className="input-field" rows={2} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Type</label><select value={taskForm.type} onChange={e => setTaskForm(p => ({ ...p, type: e.target.value }))} className="input-field">{TASK_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Priority</label><select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))} className="input-field">{["LOW", "MEDIUM", "HIGH", "URGENT"].map(pr => <option key={pr}>{pr}</option>)}</select></div>
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Points</label><input type="number" value={taskForm.points} onChange={e => setTaskForm(p => ({ ...p, points: e.target.value }))} className="input-field" /></div>
              </div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Due Date</label><input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} className="input-field" /></div>
              <div>
                <label className="text-caption font-medium text-label-secondary mb-1 block">Assign to District</label>
                <select value={taskForm.districtId} onChange={e => setTaskForm(p => ({ ...p, districtId: e.target.value, memberIds: [] }))} className="input-field">
                  <option value="">None (individual)</option>
                  {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name} — {d.province?.name} ({d._count?.members || 0})</option>)}
                </select>
              </div>
              {!taskForm.districtId && (
                <div>
                  <label className="text-caption font-medium text-label-secondary mb-1 block">Or Members ({taskForm.memberIds.length})</label>
                  <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="input-field mb-1" placeholder="Search..." />
                  <div className="max-h-28 overflow-y-auto card-grouped">
                    {filteredMembers.slice(0, 20).map((m: any) => (
                      <button key={m.id} type="button" onClick={() => toggleMember(m.id)} className={`list-row w-full ${taskForm.memberIds.includes(m.id) ? "bg-accent-50" : ""}`}>
                        <span className="text-callout flex-1 text-left">{m.name} ({m.membershipNumber})</span>
                        {taskForm.memberIds.includes(m.id) && <Check size={14} className="text-accent" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={createTask} disabled={creating || !taskForm.title} className="btn-primary w-full">{creating ? "Creating..." : "Create Task"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
