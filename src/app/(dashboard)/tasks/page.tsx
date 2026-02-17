"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";
import { ListTodo, CheckCircle2, Clock, Play, Send, RotateCcw, XCircle, Pin, FileText, Calendar, Zap, AlertTriangle } from "lucide-react";

const STATUS_ICONS: Record<string, any> = {
  ASSIGNED: Pin, ACCEPTED: CheckCircle2, IN_PROGRESS: Play, SUBMITTED: Send, VERIFIED: CheckCircle2, REJECTED: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "badge-blue", ACCEPTED: "badge-blue", IN_PROGRESS: "badge-yellow", SUBMITTED: "badge-blue", VERIFIED: "badge-green", REJECTED: "badge-red",
};

export default function MemberTasks() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [updating, setUpdating] = useState<string | null>(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [showEvidence, setShowEvidence] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (authStatus === "authenticated") fetchMyTasks();
  }, [authStatus, router]);

  const fetchMyTasks = async () => {
    try { const res = await fetch("/api/tasks/my"); if (res.ok) { const data = await res.json(); setMyTasks(data.tasks || []); } } finally { setLoading(false); }
  };

  const updateStatus = async (taskId: string, newStatus: string, evidence?: string) => {
    setUpdating(taskId);
    try { await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentStatus: newStatus, evidence }) }); await fetchMyTasks(); setShowEvidence(null); setEvidenceText(""); } finally { setUpdating(null); }
  };

  const activeTasks = myTasks.filter(t => !["VERIFIED", "REJECTED"].includes(t.assignmentStatus));
  const completedTasks = myTasks.filter(t => ["VERIFIED", "REJECTED"].includes(t.assignmentStatus));
  const currentTasks = tab === "active" ? activeTasks : completedTasks;

  if (loading) return <div className="page-container"><div className="space-y-3 pt-8">{[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-apple-lg" />)}</div></div>;

  return (
    <div className="page-container">
      <h1 className="text-title tracking-tight mb-2 pt-2">{t.tasks.title}</h1>
      <p className="text-callout text-label-tertiary mb-6">{t.tasks.subtitle}</p>

      {/* Summary */}
      <div className="flex gap-3 mb-6">
        <div className="card flex-1 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center"><Clock size={17} className="text-blue-600" /></div>
          <div><p className="text-title-sm">{activeTasks.length}</p><p className="text-caption text-label-tertiary">{t.tasks.active}</p></div>
        </div>
        <div className="card flex-1 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 size={17} className="text-emerald-600" /></div>
          <div><p className="text-title-sm">{completedTasks.length}</p><p className="text-caption text-label-tertiary">{t.tasks.completed}</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-surface-tertiary p-1 rounded-apple-lg">
        {(["active", "completed"] as const).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-apple text-subhead font-semibold transition-all ${tab === key ? "bg-surface-primary shadow-apple text-label-primary" : "text-label-tertiary"}`}>
            {key === "active" ? t.tasks.active : t.tasks.completed} ({key === "active" ? activeTasks.length : completedTasks.length})
          </button>
        ))}
      </div>

      {currentTasks.length > 0 ? (
        <div className="space-y-3">
          {currentTasks.map((task: any) => {
            const StatusIcon = STATUS_ICONS[task.assignmentStatus] || Clock;
            return (
              <div key={task.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-label-primary">{task.title}</p>
                    {task.titleUrdu && <p className="text-caption text-label-tertiary font-urdu mt-0.5">{task.titleUrdu}</p>}
                  </div>
                  <span className={`badge ${STATUS_COLORS[task.assignmentStatus] || "badge-gray"} flex items-center gap-1`}>
                    <StatusIcon size={10} />
                    <span>{task.assignmentStatus}</span>
                  </span>
                </div>

                {task.description && <p className="text-callout text-label-secondary mb-3">{task.description}</p>}

                <div className="flex flex-wrap gap-3 text-caption text-label-tertiary mb-3">
                  <span className="flex items-center gap-1"><FileText size={11} /> {task.projectTitle}</span>
                  <span className="flex items-center gap-1"><Pin size={11} /> {task.type?.replace(/_/g, " ")}</span>
                  {task.dueDate && <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>}
                  {task.points > 0 && <span className="flex items-center gap-1 text-gold font-semibold"><Zap size={11} /> {task.points} pts</span>}
                  {task.priority && task.priority !== "NORMAL" && <span className="flex items-center gap-1 text-accent font-semibold"><AlertTriangle size={11} /> {task.priority}</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {task.assignmentStatus === "ASSIGNED" && (
                    <button onClick={() => updateStatus(task.taskId, "ACCEPTED")} disabled={updating === task.taskId} className="btn-primary flex-1 !py-2.5 text-subhead flex items-center justify-center gap-1.5"><CheckCircle2 size={14} /> Accept Task</button>
                  )}
                  {task.assignmentStatus === "ACCEPTED" && (
                    <button onClick={() => updateStatus(task.taskId, "IN_PROGRESS")} disabled={updating === task.taskId} className="btn-primary flex-1 !py-2.5 text-subhead !bg-amber-500 flex items-center justify-center gap-1.5"><Play size={14} /> Start Working</button>
                  )}
                  {task.assignmentStatus === "IN_PROGRESS" && (
                    showEvidence === task.taskId ? (
                      <div className="flex-1 space-y-2">
                        <textarea value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} placeholder="Describe what you did..." className="input-field text-callout" rows={2} />
                        <div className="flex gap-2">
                          <button onClick={() => { setShowEvidence(null); setEvidenceText(""); }} className="btn-secondary flex-1 !py-2.5 text-subhead">Cancel</button>
                          <button onClick={() => updateStatus(task.taskId, "SUBMITTED", evidenceText)} disabled={updating === task.taskId} className="btn-primary flex-1 !py-2.5 text-subhead !bg-purple-600 flex items-center justify-center gap-1.5"><Send size={14} /> Submit</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowEvidence(task.taskId)} className="btn-primary flex-1 !py-2.5 text-subhead !bg-purple-600 flex items-center justify-center gap-1.5"><Send size={14} /> Mark Complete</button>
                    )
                  )}
                  {task.assignmentStatus === "SUBMITTED" && (
                    <div className="flex-1 text-center py-2.5 bg-surface-tertiary rounded-apple-lg"><p className="text-subhead text-label-secondary font-medium flex items-center justify-center gap-1.5"><Clock size={14} /> Waiting for review</p></div>
                  )}
                  {task.assignmentStatus === "VERIFIED" && (
                    <div className="flex-1 text-center py-2.5 bg-emerald-50 rounded-apple-lg"><p className="text-subhead text-emerald-700 font-medium flex items-center justify-center gap-1.5"><CheckCircle2 size={14} /> Verified</p>{task.points > 0 && <p className="text-caption text-emerald-600 mt-0.5">+{task.points} points</p>}</div>
                  )}
                  {task.assignmentStatus === "REJECTED" && (
                    <div className="w-full space-y-2">
                      <div className="text-center py-2.5 bg-red-50 rounded-apple-lg"><p className="text-subhead text-red-600 font-medium flex items-center justify-center gap-1.5"><XCircle size={14} /> Rejected</p></div>
                      <button onClick={() => updateStatus(task.taskId, "IN_PROGRESS")} disabled={updating === task.taskId} className="w-full btn-primary !py-2.5 text-subhead !bg-amber-500 flex items-center justify-center gap-1.5"><RotateCcw size={14} /> Restart</button>
                    </div>
                  )}
                </div>

                {task.evidence && (
                  <div className="mt-3 p-3 bg-surface-tertiary rounded-apple"><p className="text-caption text-label-tertiary font-medium mb-0.5">Your submission</p><p className="text-callout text-label-secondary">{task.evidence}</p></div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <ListTodo size={40} className="text-label-quaternary mx-auto mb-3" />
          <p className="text-body font-medium text-label-secondary">{t.tasks.noTasks}</p>
          <p className="text-caption text-label-tertiary mt-1">{t.tasks.tasksAppearHere}</p>
        </div>
      )}
    </div>
  );
}
