"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const STATUS_ICONS: Record<string, string> = {
  ASSIGNED: "📌", ACCEPTED: "👍", IN_PROGRESS: "🔄", SUBMITTED: "📤", VERIFIED: "✅", REJECTED: "❌",
};

export default function MemberTasks() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "completed">("active");

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(d => {
      setProjects(d.projects || []);
      setLoading(false);
    });
  }, []);

  const memberId = (session?.user as any)?.id;

  const updateMyTask = async (taskId: string, assignmentStatus: string, evidence?: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentStatus, evidence }),
    });
    // Reload
    const r = await fetch("/api/projects");
    const d = await r.json();
    setProjects(d.projects || []);
  };

  // Get all my tasks from projects
  const myTasks: any[] = [];
  projects.forEach((p: any) => {
    if (p.myTasks > 0 || p.tasks) {
      // Need full project data - for now use what we have
    }
  });

  if (loading) return (
    <div className="space-y-4 p-2">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  const activeProjects = projects.filter(p => p.status === "ACTIVE" && p.myTasks > 0);
  const completedProjects = projects.filter(p => p.status === "COMPLETED");

  return (
    <div className="page-container">
      {/* Header */}
      <div className="bg-party-red text-white px-6 pb-6 -mx-4 -mt-4 pt-4 notch-header mb-4">
        <h1 className="text-xl font-bold">📋 My Tasks</h1>
        <p className="text-xs opacity-70 mt-1">Campaign activities & assignments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("active")} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === "active" ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>
          Active ({activeProjects.length})
        </button>
        <button onClick={() => setTab("completed")} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === "completed" ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>
          Completed ({completedProjects.length})
        </button>
      </div>

      {/* Projects with my tasks */}
      {(tab === "active" ? activeProjects : completedProjects).length > 0 ? (
        <div className="space-y-4">
          {(tab === "active" ? activeProjects : completedProjects).map((p: any) => (
            <div key={p.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-bold">{p.title}</p>
                  {p.titleUrdu && <p className="text-[10px] text-gray-400 font-urdu">{p.titleUrdu}</p>}
                </div>
                <span className="text-[10px] bg-party-red/10 text-party-red px-2 py-0.5 rounded-full font-semibold">
                  {p.myTasks} tasks
                </span>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-party-red to-party-gold rounded-full" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="text-[10px] text-gray-400">{p.progress}%</span>
              </div>

              {/* Constituency tags */}
              {p.constituencies?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.constituencies.map((pc: any) => (
                    <span key={pc.id} className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {pc.constituency.code}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-gray-400 flex gap-3">
                <span>📁 {p.category?.replace(/_/g, " ")}</span>
                <span>{p.totalTasks} total tasks</span>
                <span>{p.doneTasks} done</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-medium">No {tab} tasks</p>
          <p className="text-xs mt-1">Tasks assigned to you will appear here</p>
        </div>
      )}

      {/* All active projects overview */}
      {tab === "active" && projects.filter(p => p.status === "ACTIVE").length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-gray-600 mb-3">🏛️ All Active Campaigns</h2>
          <div className="space-y-2">
            {projects.filter(p => p.status === "ACTIVE").map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{p.title}</p>
                  <p className="text-[9px] text-gray-400">{p.totalTasks} tasks • {p.constituencies?.length || 0} areas</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-party-red">{p.progress}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
