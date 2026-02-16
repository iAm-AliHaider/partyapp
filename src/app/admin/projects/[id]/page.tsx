"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TASK_TYPES = [
  { key: "GENERAL", label: "General" }, { key: "VOTER_CONTACT", label: "Voter Contact" },
  { key: "DOOR_KNOCK", label: "Door Knock" }, { key: "PHONE_BANK", label: "Phone Bank" },
  { key: "EVENT_ORGANIZE", label: "Organize Event" }, { key: "DISTRIBUTE", label: "Distribute" },
  { key: "SOCIAL_POST", label: "Social Post" }, { key: "DATA_COLLECTION", label: "Data Collection" },
  { key: "TRANSPORT", label: "Transport" }, { key: "MONITORING", label: "Monitoring" },
];

const DOC_CATEGORIES = [
  { key: "GENERAL", label: "📄 General" }, { key: "REPORT", label: "📊 Report" },
  { key: "PHOTO", label: "📸 Photo" }, { key: "VIDEO", label: "🎥 Video" },
  { key: "RECEIPT", label: "🧾 Receipt" }, { key: "LETTER", label: "✉️ Letter" },
  { key: "PLAN", label: "📋 Plan" }, { key: "EVIDENCE", label: "🔍 Evidence" },
  { key: "LEGAL", label: "⚖️ Legal" }, { key: "MEDIA", label: "🎬 Media" },
];

const STATUS_ICONS: Record<string, string> = { TODO: "⬜", IN_PROGRESS: "🔄", REVIEW: "👀", DONE: "✅", CANCELLED: "❌" };
const ASSIGN_STATUS_ICONS: Record<string, string> = { ASSIGNED: "📌", ACCEPTED: "👍", IN_PROGRESS: "🔄", SUBMITTED: "📤", VERIFIED: "✅", REJECTED: "❌" };

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const { id } = (params as any);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tasks" | "docs">("tasks");

  // Task state
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [assignConstId, setAssignConstId] = useState("");
  const [constituencies, setConstituencies] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "", titleUrdu: "", description: "", type: "GENERAL",
    priority: "MEDIUM", dueDate: "", points: "0",
    constituencyId: "", memberIds: [] as string[],
  });
  const [creating, setCreating] = useState(false);

  // Document state
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
      loadProject();
      loadDocuments();
      fetch("/api/constituencies").then(r => r.json()).then(d => setConstituencies(d.constituencies || []));
      fetch("/api/members").then(r => r.json()).then(d => setMembers(Array.isArray(d) ? d : d.members || []));
    }
  }, [authStatus, session, router, id]);

  const loadProject = async () => {
    const r = await fetch(`/api/projects/${id}`);
    if (!r.ok) { router.push("/admin/projects"); return; }
    setProject(await r.json());
    setLoading(false);
  };

  const loadDocuments = async () => {
    const r = await fetch(`/api/projects/${id}/documents`);
    if (r.ok) {
      const d = await r.json();
      setDocuments(d.documents || []);
    }
  };

  const updateProjectStatus = async (status: string) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    loadProject();
  };

  const createTask = async () => {
    setCreating(true);
    const payload: any = {
      title: taskForm.title,
      titleUrdu: taskForm.titleUrdu || undefined,
      description: taskForm.description || undefined,
      type: taskForm.type,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate || undefined,
      points: parseInt(taskForm.points) || 0,
    };
    if (taskForm.memberIds.length) payload.memberIds = taskForm.memberIds;
    else if (taskForm.constituencyId) payload.constituencyId = taskForm.constituencyId;

    const r = await fetch(`/api/projects/${id}/tasks`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (r.ok) {
      setShowAddTask(false);
      setTaskForm({ title: "", titleUrdu: "", description: "", type: "GENERAL", priority: "MEDIUM", dueDate: "", points: "0", constituencyId: "", memberIds: [] });
      loadProject();
    } else {
      const err = await r.json();
      alert(err.error || "Failed to create task");
    }
    setCreating(false);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    loadProject();
  };

  const verifySubmission = async (taskId: string, memberId: string, action: "verify" | "reject") => {
    await fetch(`/api/tasks/${taskId}/verify`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId, action }),
    });
    loadProject();
  };

  const assignTask = async (taskId: string) => {
    if (!assignConstId) { alert("Select a constituency"); return; }
    const r = await fetch(`/api/tasks/${taskId}/assign`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ constituencyId: assignConstId }),
    });
    if (r.ok) {
      const d = await r.json();
      alert(`Assigned to ${d.assigned} members (${d.skipped} already assigned)`);
    }
    setShowAssign(null);
    setAssignConstId("");
    loadProject();
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    loadProject();
  };

  const uploadDocument = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) { alert("Select a file"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", uploadCategory);
    if (uploadDesc) fd.append("description", uploadDesc);

    const r = await fetch(`/api/projects/${id}/documents`, { method: "POST", body: fd });
    if (r.ok) {
      setShowUpload(false);
      setUploadCategory("GENERAL");
      setUploadDesc("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadDocuments();
    } else {
      const err = await r.json();
      alert(err.error || "Upload failed");
    }
    setUploading(false);
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    loadDocuments();
  };

  const toggleMember = (mId: string) => {
    setTaskForm(p => ({
      ...p,
      memberIds: p.memberIds.includes(mId) ? p.memberIds.filter(i => i !== mId) : [...p.memberIds, mId],
    }));
  };

  const filteredMembers = members.filter((m: any) =>
    !memberSearch || m.name?.toLowerCase().includes(memberSearch.toLowerCase()) || m.membershipNumber?.includes(memberSearch)
  );

  if (loading) return <div className="space-y-3 p-2">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;

  const p = project;
  const totalTasks = p?.tasks?.length || 0;
  const doneTasks = p?.tasks?.filter((t: any) => t.status === "DONE").length || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4">
      <Link href="/admin/projects" className="text-xs text-gray-400">← Back to Projects</Link>

      {/* Header Card */}
      <div className="card bg-gradient-to-br from-red-50 to-white">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h1 className="text-lg font-bold">{p.title}</h1>
            {p.titleUrdu && <p className="text-xs text-gray-400 font-urdu">{p.titleUrdu}</p>}
          </div>
          <select value={p.status} onChange={e => updateProjectStatus(e.target.value)}
            className="text-[10px] font-semibold border rounded-lg px-2 py-1 bg-white">
            {["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {p.description && <p className="text-xs text-gray-500 mb-3">{p.description}</p>}

        <div className="grid grid-cols-4 gap-2 text-center mb-3">
          <div><p className="text-lg font-extrabold text-party-red">{totalTasks}</p><p className="text-[9px] text-gray-400">Tasks</p></div>
          <div><p className="text-lg font-extrabold text-green-600">{doneTasks}</p><p className="text-[9px] text-gray-400">Done</p></div>
          <div><p className="text-lg font-extrabold text-blue-600">{documents.length}</p><p className="text-[9px] text-gray-400">Docs</p></div>
          <div><p className="text-lg font-extrabold text-party-gold">{progress}%</p><p className="text-[9px] text-gray-400">Progress</p></div>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-party-red to-party-gold transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-gray-400">
          <span>📁 {p.category?.replace(/_/g, " ")}</span>
          {p.startDate && <span>📅 {new Date(p.startDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>}
          {p.endDate && <span>→ {new Date(p.endDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>}
          {p.budget && <span>💰 ₨{p.budget.toLocaleString()}</span>}
          <span>👤 {p.createdBy?.name}</span>
        </div>

        {p.constituencies?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {p.constituencies.map((pc: any) => (
              <span key={pc.id} className="text-[9px] bg-party-red/10 text-party-red px-1.5 py-0.5 rounded font-semibold">{pc.constituency.code}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tab Switch: Tasks | Documents */}
      <div className="flex gap-2">
        <button onClick={() => setTab("tasks")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "tasks" ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>
          📋 Tasks ({totalTasks})
        </button>
        <button onClick={() => setTab("docs")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "docs" ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>
          📁 Documents ({documents.length})
        </button>
      </div>

      {/* ═══════ TASKS TAB ═══════ */}
      {tab === "tasks" && (
        <>
          <button onClick={() => setShowAddTask(true)} className="w-full bg-party-red text-white py-2.5 rounded-xl text-sm font-semibold active:scale-95">+ Add Task</button>

          <div className="space-y-3">
            {p.tasks?.length > 0 ? p.tasks.map((t: any) => (
              <div key={t.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span>{STATUS_ICONS[t.status]}</span>
                      <p className="text-sm font-semibold truncate">{t.title}</p>
                    </div>
                    {t.titleUrdu && <p className="text-[10px] text-gray-400 font-urdu ml-5">{t.titleUrdu}</p>}
                  </div>
                  <select value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value)}
                    className="text-[9px] font-semibold border rounded px-1.5 py-0.5 bg-white ml-2">
                    {["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {t.description && <p className="text-[10px] text-gray-500 mb-2 ml-5">{t.description}</p>}

                <div className="flex gap-2 text-[9px] text-gray-400 mb-2 ml-5">
                  <span>📌 {t.type?.replace(/_/g, " ")}</span>
                  {t.dueDate && <span>📅 {new Date(t.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>}
                  {t.points > 0 && <span className="text-party-gold font-semibold">⚡ {t.points} pts</span>}
                </div>

                {/* Assignments */}
                {t.assignments?.length > 0 && (
                  <div className="ml-5 space-y-1 mb-2">
                    <p className="text-[9px] font-semibold text-gray-500">Assigned ({t.assignments.length}):</p>
                    {t.assignments.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]">{ASSIGN_STATUS_ICONS[a.status]}</span>
                          <span className="text-[10px] font-medium">{a.member.name}</span>
                          <span className="text-[9px] text-gray-400">{a.member.constituency?.code}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-gray-400">{a.status}</span>
                          {a.status === "SUBMITTED" && (
                            <div className="flex gap-0.5 ml-1">
                              <button onClick={() => verifySubmission(t.id, a.member.id, "verify")} className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-semibold">✓</button>
                              <button onClick={() => verifySubmission(t.id, a.member.id, "reject")} className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">✗</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 ml-5">
                  <button onClick={() => { setShowAssign(showAssign === t.id ? null : t.id); setAssignConstId(""); }} className="text-[10px] text-blue-500 font-semibold">+ Assign</button>
                  <button onClick={() => deleteTask(t.id)} className="text-[10px] text-red-400 font-semibold">Delete</button>
                </div>

                {/* Inline assign */}
                {showAssign === t.id && (
                  <div className="ml-5 mt-2 p-2 bg-blue-50 rounded-lg space-y-2">
                    <select value={assignConstId} onChange={e => setAssignConstId(e.target.value)} className="input-field text-xs">
                      <option value="">Select constituency (all members)...</option>
                      {constituencies.map((c: any) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                    </select>
                    <button onClick={() => assignTask(t.id)} className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold w-full">Assign Constituency</button>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-2xl mb-1">📝</p>
                <p className="text-sm">No tasks yet</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════ DOCUMENTS TAB ═══════ */}
      {tab === "docs" && (
        <>
          <button onClick={() => setShowUpload(true)} className="w-full bg-party-red text-white py-2.5 rounded-xl text-sm font-semibold active:scale-95">📎 Upload Document</button>

          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc: any) => {
                const isImage = doc.mimeType?.startsWith("image/");
                const catLabel = DOC_CATEGORIES.find(c => c.key === doc.category)?.label || "📄";
                return (
                  <div key={doc.id} className="card flex gap-3">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {isImage ? (
                        <img src={doc.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{catLabel.split(" ")[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{doc.originalName}</p>
                      <p className="text-[10px] text-gray-400">{catLabel} • {formatSize(doc.size)} • {doc.uploadedBy?.name}</p>
                      {doc.description && <p className="text-[10px] text-gray-500 mt-0.5">{doc.description}</p>}
                      <p className="text-[9px] text-gray-300">{new Date(doc.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <a href={doc.url} target="_blank" className="text-[9px] bg-blue-50 text-blue-500 px-2 py-1 rounded font-semibold text-center">View</a>
                      <button onClick={() => downloadDataUrl(doc.url, doc.originalName)} className="text-[9px] bg-green-50 text-green-500 px-2 py-1 rounded font-semibold">DL</button>
                      <button onClick={() => deleteDocument(doc.id)} className="text-[9px] bg-red-50 text-red-400 px-2 py-1 rounded font-semibold">Del</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-2xl mb-1">📁</p>
              <p className="text-sm">No documents yet</p>
              <p className="text-xs mt-1">Upload reports, photos, receipts, plans</p>
            </div>
          )}
        </>
      )}

      {/* ═══════ UPLOAD MODAL ═══════ */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-5 safe-area-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">📎 Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">File *</label>
                <input ref={fileInputRef} type="file" className="input-field mt-1 text-xs" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" />
                <p className="text-[9px] text-gray-400 mt-1">Max 10MB — images, PDFs, documents</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Category</label>
                <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="input-field mt-1 text-xs">
                  {DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Description (optional)</label>
                <input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className="input-field mt-1" placeholder="Brief description..." />
              </div>
              <button onClick={uploadDocument} disabled={uploading} className="w-full bg-party-red text-white py-3 rounded-xl font-semibold active:scale-95 disabled:opacity-50">
                {uploading ? "Uploading..." : "📤 Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ADD TASK MODAL ═══════ */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowAddTask(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 safe-area-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Add Task</h2>
              <button onClick={() => setShowAddTask(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Task Title *</label>
                <input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} className="input-field mt-1" placeholder="e.g. Contact 50 voters" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">عنوان (Urdu)</label>
                <input value={taskForm.titleUrdu} onChange={e => setTaskForm(p => ({ ...p, titleUrdu: e.target.value }))} className="input-field mt-1 font-urdu text-right" dir="rtl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} className="input-field mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Type</label>
                  <select value={taskForm.type} onChange={e => setTaskForm(p => ({ ...p, type: e.target.value }))} className="input-field mt-1 text-[10px]">
                    {TASK_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))} className="input-field mt-1 text-[10px]">
                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map(pr => <option key={pr}>{pr}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Points</label>
                  <input type="number" value={taskForm.points} onChange={e => setTaskForm(p => ({ ...p, points: e.target.value }))} className="input-field mt-1 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Due Date</label>
                <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} className="input-field mt-1 text-xs" />
              </div>

              {/* Assign to constituency */}
              <div>
                <label className="text-xs font-semibold text-gray-600">Assign to Constituency</label>
                <select value={taskForm.constituencyId} onChange={e => setTaskForm(p => ({ ...p, constituencyId: e.target.value, memberIds: [] }))} className="input-field mt-1 text-xs">
                  <option value="">— None (assign individually) —</option>
                  {constituencies.map((c: any) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>

              {/* Or assign to specific members */}
              {!taskForm.constituencyId && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">Or Assign Members ({taskForm.memberIds.length})</label>
                  <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="input-field mt-1 text-xs" placeholder="🔍 Search..." />
                  <div className="max-h-28 overflow-y-auto mt-1 border rounded-xl divide-y">
                    {filteredMembers.slice(0, 20).map((m: any) => (
                      <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                        className={`w-full text-left px-2 py-1.5 text-[10px] flex justify-between ${taskForm.memberIds.includes(m.id) ? "bg-party-red/5" : ""}`}>
                        <span>{m.name} ({m.membershipNumber})</span>
                        {taskForm.memberIds.includes(m.id) && <span className="text-party-red">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={createTask} disabled={creating || !taskForm.title} className="w-full bg-party-red text-white py-3 rounded-xl font-semibold active:scale-95 disabled:opacity-50">
                {creating ? "Creating..." : "📋 Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

