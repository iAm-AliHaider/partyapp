"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

const STATUS_ICONS: Record<string, string> = {
  ASSIGNED: "📌", ACCEPTED: "👍", IN_PROGRESS: "🔄", SUBMITTED: "📤", VERIFIED: "✅", REJECTED: "❌",
};

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  SUBMITTED: "bg-purple-100 text-purple-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
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
    try {
      const res = await fetch("/api/tasks/my");
      if (res.ok) {
        const data = await res.json();
        setMyTasks(data.tasks || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId: string, newStatus: string, evidence?: string) => {
    setUpdating(taskId);
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentStatus: newStatus, evidence }),
      });
      await fetchMyTasks();
      setShowEvidence(null);
      setEvidenceText("");
    } finally {
      setUpdating(null);
    }
  };

  const activeTasks = myTasks.filter(t => !["VERIFIED", "REJECTED"].includes(t.assignmentStatus));
  const completedTasks = myTasks.filter(t => ["VERIFIED", "REJECTED"].includes(t.assignmentStatus));
  const currentTasks = tab === "active" ? activeTasks : completedTasks;

  if (loading) return (
    <div className="page-container">
      <div className="space-y-4 pt-16">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="bg-party-red text-white px-6 pb-6 -mx-4 -mt-4 pt-4 notch-header mb-4 rounded-b-2xl">
        <h1 className="text-xl font-bold">{t.tasks.title}</h1>
        <p className="text-xs opacity-70 mt-1">{t.tasks.subtitle}</p>
        <div className="flex gap-3 mt-3">
          <div className="bg-white/20 rounded-lg px-3 py-1.5 text-center flex-1">
            <p className="text-lg font-bold">{activeTasks.length}</p>
            <p className="text-[9px] opacity-80">{t.tasks.active}</p>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-1.5 text-center flex-1">
            <p className="text-lg font-bold">{completedTasks.length}</p>
            <p className="text-[9px] opacity-80">{t.tasks.completed}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("active")} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === "active" ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>
          {t.tasks.active} ({activeTasks.length})
        </button>
        <button onClick={() => setTab("completed")} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === "completed" ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>
          {t.tasks.completed} ({completedTasks.length})
        </button>
      </div>

      {/* Task List */}
      {currentTasks.length > 0 ? (
        <div className="space-y-3">
          {currentTasks.map((task: any) => (
            <div key={task.id} className="card">
              {/* Task Header */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{task.title}</p>
                  {task.titleUrdu && <p className="text-[10px] text-gray-400 font-urdu">{task.titleUrdu}</p>}
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[task.assignmentStatus] || "bg-gray-100 text-gray-600"}`}>
                  {STATUS_ICONS[task.assignmentStatus]} {task.assignmentStatus}
                </span>
              </div>

              {/* Description */}
              {task.description && <p className="text-xs text-gray-500 mb-2">{task.description}</p>}

              {/* Meta */}
              <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mb-3">
                <span>📁 {task.projectTitle}</span>
                <span>📌 {task.type?.replace(/_/g, " ")}</span>
                {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>}
                {task.points > 0 && <span className="text-party-gold font-semibold">⚡ {task.points} pts</span>}
                {task.priority && <span className={`font-semibold ${task.priority === "URGENT" ? "text-red-500" : task.priority === "HIGH" ? "text-orange-500" : ""}`}>
                  {task.priority}
                </span>}
              </div>

              {/* Action Buttons based on current status */}
              <div className="flex gap-2">
                {task.assignmentStatus === "ASSIGNED" && (
                  <button
                    onClick={() => updateStatus(task.taskId, "ACCEPTED")}
                    disabled={updating === task.taskId}
                    className="flex-1 bg-indigo-500 text-white py-2 rounded-xl text-xs font-semibold active:scale-95 disabled:opacity-50"
                  >
                    {updating === task.taskId ? "..." : "👍 Accept Task"}
                  </button>
                )}

                {task.assignmentStatus === "ACCEPTED" && (
                  <button
                    onClick={() => updateStatus(task.taskId, "IN_PROGRESS")}
                    disabled={updating === task.taskId}
                    className="flex-1 bg-yellow-500 text-white py-2 rounded-xl text-xs font-semibold active:scale-95 disabled:opacity-50"
                  >
                    {updating === task.taskId ? "..." : "🔄 Start Working"}
                  </button>
                )}

                {task.assignmentStatus === "IN_PROGRESS" && (
                  <>
                    {showEvidence === task.taskId ? (
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={evidenceText}
                          onChange={(e) => setEvidenceText(e.target.value)}
                          placeholder="Describe what you did, add links or notes..."
                          className="input-field text-xs"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowEvidence(null); setEvidenceText(""); }}
                            className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => updateStatus(task.taskId, "SUBMITTED", evidenceText)}
                            disabled={updating === task.taskId}
                            className="flex-1 bg-purple-500 text-white py-2 rounded-xl text-xs font-semibold active:scale-95 disabled:opacity-50"
                          >
                            {updating === task.taskId ? "..." : "📤 Submit"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowEvidence(task.taskId)}
                        className="flex-1 bg-purple-500 text-white py-2 rounded-xl text-xs font-semibold active:scale-95"
                      >
                        📤 Mark Complete
                      </button>
                    )}
                  </>
                )}

                {task.assignmentStatus === "SUBMITTED" && (
                  <div className="flex-1 text-center py-2 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-600 font-semibold">⏳ Waiting for admin review</p>
                  </div>
                )}

                {task.assignmentStatus === "VERIFIED" && (
                  <div className="flex-1 text-center py-2 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-semibold">✅ Verified & Complete</p>
                    {task.points > 0 && <p className="text-[10px] text-green-500">+{task.points} points earned!</p>}
                  </div>
                )}

                {task.assignmentStatus === "REJECTED" && (
                  <div className="w-full space-y-2">
                    <div className="text-center py-2 bg-red-50 rounded-xl">
                      <p className="text-xs text-red-600 font-semibold">❌ Rejected — please redo</p>
                    </div>
                    <button
                      onClick={() => updateStatus(task.taskId, "IN_PROGRESS")}
                      disabled={updating === task.taskId}
                      className="w-full bg-yellow-500 text-white py-2 rounded-xl text-xs font-semibold active:scale-95 disabled:opacity-50"
                    >
                      🔄 Restart Task
                    </button>
                  </div>
                )}
              </div>

              {/* Evidence if submitted */}
              {task.evidence && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-500 font-semibold">Your submission:</p>
                  <p className="text-xs text-gray-600">{task.evidence}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-medium">{t.tasks.noTasks}</p>
          <p className="text-xs mt-1">{t.tasks.tasksAppearHere}</p>
        </div>
      )}
    </div>
  );
}
