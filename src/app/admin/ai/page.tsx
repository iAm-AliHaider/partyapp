"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Zap, MessageCircle, Users, MapPin, Plus, X, Check, Send, Trash2, RefreshCw,
  Globe, Phone, Link2, ChevronRight, ChevronDown, Radio, Activity, BarChart3,
  Instagram, Youtube, Twitter, Facebook, Smartphone, Clock, CheckCircle2, XCircle, Loader2,
  Share2, Eye, Hash, ExternalLink, Wifi, WifiOff
} from "lucide-react";

const PLATFORMS = [
  { key: "WHATSAPP", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600 bg-emerald-50" },
  { key: "FACEBOOK", label: "Facebook", icon: Facebook, color: "text-blue-600 bg-blue-50" },
  { key: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "text-pink-600 bg-pink-50" },
  { key: "TWITTER", label: "X / Twitter", icon: Twitter, color: "text-gray-800 bg-gray-100" },
  { key: "YOUTUBE", label: "YouTube", icon: Youtube, color: "text-red-600 bg-red-50" },
  { key: "TIKTOK", label: "TikTok", icon: Radio, color: "text-purple-600 bg-purple-50" },
];

const ACTION_TYPES = [
  { key: "CREATE_GROUP", label: "Create WhatsApp Group", platform: "WHATSAPP" },
  { key: "SEND_ANNOUNCEMENT", label: "Send Group Announcement", platform: "WHATSAPP" },
  { key: "BULK_MESSAGE", label: "Bulk Direct Message", platform: "WHATSAPP" },
  { key: "SOCIAL_POST", label: "Post to Social Media", platform: "MULTI" },
  { key: "SOCIAL_ENGAGE", label: "Engage (Like/Comment)", platform: "MULTI" },
  { key: "SOCIAL_MONITOR", label: "Monitor Activity", platform: "MULTI" },
];

const statusBadge: Record<string, string> = {
  QUEUED: "badge-gray", RUNNING: "badge-yellow", COMPLETED: "badge-green", FAILED: "badge-red",
};

const statusIcon: Record<string, any> = {
  QUEUED: Clock, RUNNING: Loader2, COMPLETED: CheckCircle2, FAILED: XCircle,
};

export default function AIDashboard() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "groups" | "actions" | "social">("overview");

  // Modals
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [showQueueAction, setShowQueueAction] = useState(false);

  // Forms
  const [groupForm, setGroupForm] = useState({ name: "", districtId: "", provinceId: "", inviteLink: "", memberCount: "", adminPhone: "", groupType: "DISTRICT" });
  const [socialForm, setSocialForm] = useState({ platform: "FACEBOOK", accountName: "", accountId: "", followers: "", posts: "" });
  const [actionForm, setActionForm] = useState({ type: "CREATE_GROUP", platform: "WHATSAPP", title: "", payload: "" });
  const [creating, setCreating] = useState(false);

  // Geo data
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  // Bridge status
  const [bridgeStatus, setBridgeStatus] = useState<{online: boolean, lastHeartbeat: string|null}>({online: false, lastHeartbeat: null});

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) router.push("/home");
      loadData();
      fetch("/api/provinces").then(r => r.json()).then(d => setProvinces(d.provinces || []));
      fetch("/api/districts").then(r => r.json()).then(d => setDistricts(d.districts || []));
      fetch("/api/droidclaw/bridge-status").then(r => r.json()).then(d => setBridgeStatus(d)).catch(() => {});
      // Re-check bridge status every 30s
      const bridgeInterval = setInterval(() => {
        fetch("/api/droidclaw/bridge-status").then(r => r.json()).then(d => setBridgeStatus(d)).catch(() => {});
      }, 30000);
      return () => clearInterval(bridgeInterval);
    }
  }, [authStatus]);

  const loadData = async () => {
    const r = await fetch("/api/droidclaw");
    if (r.ok) setData(await r.json());
    setLoading(false);
  };

  const addGroup = async () => {
    setCreating(true);
    await fetch("/api/droidclaw", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ADD_GROUP", ...groupForm, memberCount: parseInt(groupForm.memberCount) || 0 }),
    });
    setShowAddGroup(false);
    setGroupForm({ name: "", districtId: "", provinceId: "", inviteLink: "", memberCount: "", adminPhone: "", groupType: "DISTRICT" });
    loadData(); setCreating(false);
  };

  const addSocial = async () => {
    setCreating(true);
    await fetch("/api/droidclaw", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ADD_SOCIAL", ...socialForm, followers: parseInt(socialForm.followers) || 0, posts: parseInt(socialForm.posts) || 0 }),
    });
    setShowAddSocial(false);
    setSocialForm({ platform: "FACEBOOK", accountName: "", accountId: "", followers: "", posts: "" });
    loadData(); setCreating(false);
  };

  const queueAction = async () => {
    setCreating(true);
    let payload;
    try { payload = actionForm.payload ? JSON.parse(actionForm.payload) : null; } catch { payload = actionForm.payload; }
    await fetch("/api/droidclaw", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "QUEUE_ACTION", type: actionForm.type, platform: actionForm.platform, title: actionForm.title, payload }),
    });
    setShowQueueAction(false);
    setActionForm({ type: "CREATE_GROUP", platform: "WHATSAPP", title: "", payload: "" });
    loadData(); setCreating(false);
  };

  const deleteItem = async (entity: string, id: string) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/droidclaw?entity=${entity}&id=${id}`, { method: "DELETE" });
    loadData();
  };

  const updateAction = async (id: string, status: string) => {
    await fetch("/api/droidclaw", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "action", id, status }),
    });
    loadData();
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-24 rounded-apple-lg" />)}</div>;

  const s = data?.stats || {};
  const groups = data?.whatsappGroups || [];
  const actions = data?.recentActions || [];
  const socials = data?.socialAccounts || [];

  const TABS = [
    { key: "overview" as const, label: "Overview", icon: Activity },
    { key: "groups" as const, label: "Groups", icon: MessageCircle },
    { key: "actions" as const, label: "Actions", icon: Zap },
    { key: "social" as const, label: "Social", icon: Globe },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title tracking-tight">Awaam Raaj AI</h1>
          <p className="text-caption text-label-tertiary">Social Media Management · DroidClaw</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 rounded-full">
            {bridgeStatus.online ? <Wifi size={12} className="text-emerald-600" /> : <WifiOff size={12} className="text-red-400" />}
            <span className={`text-caption font-semibold ${bridgeStatus.online ? "text-emerald-700" : "text-red-500"}`}>{bridgeStatus.online ? "Bridge Online" : "Bridge Offline"}</span>
          </div>
          <button onClick={() => { setLoading(true); loadData(); }} className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale">
            <RefreshCw size={16} className="text-label-secondary" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-subhead font-semibold whitespace-nowrap transition-all ${
                tab === t.key ? "bg-accent text-white shadow-apple" : "bg-surface-primary text-label-secondary shadow-apple"
              }`}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab === "overview" && (
        <>
          {/* Hero Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <p className="text-caption font-semibold text-label-tertiary uppercase tracking-wider">WhatsApp Groups</p>
              <p className="text-title text-label-primary mt-1">{s.totalGroups || 0}</p>
              <p className="text-caption text-label-quaternary mt-1">{s.totalMembers || 0} total members</p>
            </div>
            <div className="card">
              <p className="text-caption font-semibold text-label-tertiary uppercase tracking-wider">District Coverage</p>
              <p className="text-title text-label-primary mt-1">{s.coveragePercent || 0}%</p>
              <p className="text-caption text-label-quaternary mt-1">{s.districtsCovered || 0}/{s.totalDistricts || 0} districts</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { value: s.totalActions || 0, label: "Actions", color: "text-purple-600" },
              { value: socials.length, label: "Accounts", color: "text-blue-600" },
              { value: s.activeGroups || 0, label: "Active", color: "text-emerald-600" },
            ].map((stat, i) => (
              <div key={i} className="card text-center py-4">
                <p className={`text-title-sm ${stat.color}`}>{stat.value}</p>
                <p className="text-caption text-label-tertiary mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">Quick Actions</p>
          <div className="card-grouped">
            {[
              { label: "Add WhatsApp Group", sub: "Register a new group", icon: MessageCircle, color: "text-emerald-600 bg-emerald-50", onClick: () => setShowAddGroup(true) },
              { label: "Queue DroidClaw Action", sub: "Automate a task", icon: Zap, color: "text-purple-600 bg-purple-50", onClick: () => setShowQueueAction(true) },
              { label: "Add Social Account", sub: "Track a platform", icon: Globe, color: "text-blue-600 bg-blue-50", onClick: () => setShowAddSocial(true) },
            ].map((item, i) => (
              <button key={i} onClick={item.onClick} className="list-row w-full tap-scale">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${item.color.split(" ")[1]}`}>
                  <item.icon size={17} className={item.color.split(" ")[0]} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-body font-medium text-label-primary">{item.label}</p>
                  <p className="text-caption text-label-tertiary">{item.sub}</p>
                </div>
                <ChevronRight size={16} className="text-label-quaternary" />
              </button>
            ))}
          </div>

          {/* Social Accounts */}
          {socials.length > 0 && (
            <>
              <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">Social Accounts</p>
              <div className="card-grouped">
                {socials.map((acc: any) => {
                  const platform = PLATFORMS.find(p => p.key === acc.platform) || PLATFORMS[0];
                  const Icon = platform.icon;
                  return (
                    <div key={acc.id} className="list-row">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${platform.color.split(" ")[1]}`}>
                        <Icon size={17} className={platform.color.split(" ")[0]} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-medium text-label-primary">{acc.accountName}</p>
                        <p className="text-caption text-label-tertiary">{platform.label} · {acc.followers.toLocaleString()} followers</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${acc.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-300"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Recent Actions */}
          {actions.length > 0 && (
            <>
              <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">Recent Actions</p>
              <div className="card-grouped">
                {actions.slice(0, 5).map((a: any) => {
                  const StatusIcon = statusIcon[a.status] || Clock;
                  return (
                    <div key={a.id} className="list-row">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        a.status === "COMPLETED" ? "bg-emerald-50" : a.status === "FAILED" ? "bg-red-50" : a.status === "RUNNING" ? "bg-amber-50" : "bg-gray-100"
                      }`}>
                        <StatusIcon size={14} className={
                          a.status === "COMPLETED" ? "text-emerald-600" : a.status === "FAILED" ? "text-red-500" : a.status === "RUNNING" ? "text-amber-600 animate-spin" : "text-gray-400"
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-callout font-medium text-label-primary truncate">{a.title}</p>
                        <p className="text-caption text-label-tertiary">{a.type.replace(/_/g, " ")} · {a.platform}</p>
                      </div>
                      <span className={`badge ${statusBadge[a.status] || "badge-gray"}`}>{a.status}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ GROUPS ═══ */}
      {tab === "groups" && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-headline text-label-primary">{groups.length} WhatsApp Groups</p>
            <button onClick={() => setShowAddGroup(true)} className="btn-primary !py-2 !px-4 text-subhead flex items-center gap-1.5">
              <Plus size={15} /> Add
            </button>
          </div>

          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((g: any) => (
                <div key={g.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-semibold text-label-primary">{g.name}</p>
                      <p className="text-caption text-label-tertiary">
                        {g.district?.name || g.province?.name || "National"} · {g.groupType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${g.status === "ACTIVE" ? "badge-green" : "badge-gray"}`}>{g.status}</span>
                      <button onClick={() => deleteItem("group", g.id)} className="tap-scale"><Trash2 size={14} className="text-label-quaternary" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-caption text-label-tertiary">
                    <span className="flex items-center gap-1"><Users size={11} /> {g.memberCount}</span>
                    {g.adminPhone && <span className="flex items-center gap-1"><Phone size={11} /> {g.adminPhone}</span>}
                    {g.inviteLink && (
                      <a href={g.inviteLink} target="_blank" className="flex items-center gap-1 text-accent">
                        <ExternalLink size={11} /> Join Link
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-16">
              <MessageCircle size={40} className="text-label-quaternary mx-auto mb-3" />
              <p className="text-body font-medium text-label-secondary">No groups registered</p>
              <p className="text-caption text-label-tertiary mt-1">Add your WhatsApp groups to track coverage</p>
            </div>
          )}
        </>
      )}

      {/* ═══ ACTIONS ═══ */}
      {tab === "actions" && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-headline text-label-primary">DroidClaw Actions</p>
            <button onClick={() => setShowQueueAction(true)} className="btn-primary !py-2 !px-4 text-subhead flex items-center gap-1.5">
              <Zap size={15} /> Queue
            </button>
          </div>

          {/* Action Types */}
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">Available Workflows</p>
          <div className="card-grouped">
            {ACTION_TYPES.map((at, i) => (
              <button key={i} onClick={() => { setActionForm({ type: at.key, platform: at.platform === "MULTI" ? "WHATSAPP" : at.platform, title: "", payload: "" }); setShowQueueAction(true); }}
                className="list-row w-full tap-scale">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center"><Zap size={14} className="text-purple-600" /></div>
                <div className="flex-1 text-left">
                  <p className="text-callout font-medium text-label-primary">{at.label}</p>
                  <p className="text-caption text-label-tertiary">{at.platform}</p>
                </div>
                <ChevronRight size={14} className="text-label-quaternary" />
              </button>
            ))}
          </div>

          {/* Action History */}
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">History</p>
          {actions.length > 0 ? (
            <div className="space-y-2">
              {actions.map((a: any) => {
                const StatusIcon = statusIcon[a.status] || Clock;
                return (
                  <div key={a.id} className="card">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <StatusIcon size={16} className={
                          a.status === "COMPLETED" ? "text-emerald-600" : a.status === "FAILED" ? "text-red-500" : a.status === "RUNNING" ? "text-amber-600 animate-spin" : "text-gray-400"
                        } />
                        <div className="min-w-0">
                          <p className="text-body font-medium text-label-primary truncate">{a.title}</p>
                          <p className="text-caption text-label-tertiary">{a.type.replace(/_/g, " ")} · {a.platform} · {a.createdBy?.name}</p>
                        </div>
                      </div>
                      <span className={`badge ${statusBadge[a.status] || "badge-gray"}`}>{a.status}</span>
                    </div>
                    {a.error && <p className="text-caption text-red-500 mt-1">{a.error}</p>}
                    <div className="flex gap-2 mt-2">
                      {a.status === "QUEUED" && (
                        <>
                          <button onClick={() => updateAction(a.id, "RUNNING")} className="text-subhead text-accent font-semibold">Start</button>
                          <button onClick={() => updateAction(a.id, "COMPLETED")} className="text-subhead text-emerald-600 font-semibold">Done</button>
                        </>
                      )}
                      {a.status === "RUNNING" && (
                        <>
                          <button onClick={() => updateAction(a.id, "COMPLETED")} className="text-subhead text-emerald-600 font-semibold">Complete</button>
                          <button onClick={() => updateAction(a.id, "FAILED")} className="text-subhead text-red-500 font-semibold">Failed</button>
                        </>
                      )}
                      <button onClick={() => deleteItem("action", a.id)} className="text-subhead text-label-quaternary font-semibold ml-auto">Delete</button>
                    </div>
                    <p className="text-caption text-label-quaternary mt-1">{new Date(a.createdAt).toLocaleString("en-PK")}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Zap size={36} className="text-label-quaternary mx-auto mb-2" />
              <p className="text-body text-label-secondary">No actions yet</p>
              <p className="text-caption text-label-tertiary mt-1">Queue a DroidClaw workflow to get started</p>
            </div>
          )}
        </>
      )}

      {/* ═══ SOCIAL ═══ */}
      {tab === "social" && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-headline text-label-primary">Social Accounts</p>
            <button onClick={() => setShowAddSocial(true)} className="btn-primary !py-2 !px-4 text-subhead flex items-center gap-1.5">
              <Plus size={15} /> Add
            </button>
          </div>

          {socials.length > 0 ? (
            <div className="space-y-3">
              {socials.map((acc: any) => {
                const platform = PLATFORMS.find(p => p.key === acc.platform) || PLATFORMS[0];
                const Icon = platform.icon;
                return (
                  <div key={acc.id} className="card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-apple-lg flex items-center justify-center ${platform.color.split(" ")[1]}`}>
                        <Icon size={24} className={platform.color.split(" ")[0]} />
                      </div>
                      <div className="flex-1">
                        <p className="text-body font-semibold text-label-primary">{acc.accountName}</p>
                        <p className="text-caption text-label-tertiary">{platform.label} {acc.accountId ? `· @${acc.accountId}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${acc.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-300"}`} />
                        <button onClick={() => deleteItem("social", acc.id)} className="tap-scale"><Trash2 size={14} className="text-label-quaternary" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-surface-tertiary rounded-apple py-2">
                        <p className="text-headline text-label-primary">{acc.followers.toLocaleString()}</p>
                        <p className="text-caption text-label-tertiary">Followers</p>
                      </div>
                      <div className="bg-surface-tertiary rounded-apple py-2">
                        <p className="text-headline text-label-primary">{acc.posts}</p>
                        <p className="text-caption text-label-tertiary">Posts</p>
                      </div>
                      <div className="bg-surface-tertiary rounded-apple py-2">
                        <p className="text-headline text-label-primary">{acc.lastSync ? new Date(acc.lastSync).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "—"}</p>
                        <p className="text-caption text-label-tertiary">Last Sync</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center py-16">
              <Globe size={40} className="text-label-quaternary mx-auto mb-3" />
              <p className="text-body font-medium text-label-secondary">No social accounts</p>
              <p className="text-caption text-label-tertiary mt-1">Add your party social media accounts to track</p>
            </div>
          )}

          {/* Platform Overview */}
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">Supported Platforms</p>
          <div className="card-grouped">
            {PLATFORMS.map((p, i) => {
              const Icon = p.icon;
              const count = socials.filter((s: any) => s.platform === p.key).length;
              return (
                <div key={i} className="list-row">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${p.color.split(" ")[1]}`}>
                    <Icon size={17} className={p.color.split(" ")[0]} />
                  </div>
                  <div className="flex-1">
                    <p className="text-body font-medium text-label-primary">{p.label}</p>
                    <p className="text-caption text-label-tertiary">{count} account{count !== 1 ? "s" : ""} connected</p>
                  </div>
                  {count > 0 && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ ADD GROUP SHEET ═══ */}
      {showAddGroup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowAddGroup(false)}>
          <div className="bg-surface-primary rounded-t-apple-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 safe-area-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-title-sm">Add WhatsApp Group</h2>
              <button onClick={() => setShowAddGroup(false)} className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center"><X size={16} className="text-label-secondary" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Group Name *</label><input value={groupForm.name} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="PART - Lahore" /></div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Type</label>
                <div className="flex gap-2">
                  {["DISTRICT", "PROVINCE", "NATIONAL", "COORDINATION"].map(t => (
                    <button key={t} onClick={() => setGroupForm(p => ({ ...p, groupType: t }))} className={`pill ${groupForm.groupType === t ? "pill-active" : "pill-inactive"}`}>{t}</button>
                  ))}
                </div>
              </div>
              {groupForm.groupType === "DISTRICT" && (
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">District</label>
                  <select value={groupForm.districtId} onChange={e => setGroupForm(p => ({ ...p, districtId: e.target.value }))} className="input-field">
                    <option value="">Select...</option>
                    {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name} — {d.province?.name}</option>)}
                  </select>
                </div>
              )}
              {groupForm.groupType === "PROVINCE" && (
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Province</label>
                  <select value={groupForm.provinceId} onChange={e => setGroupForm(p => ({ ...p, provinceId: e.target.value }))} className="input-field">
                    <option value="">Select...</option>
                    {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Invite Link</label><input value={groupForm.inviteLink} onChange={e => setGroupForm(p => ({ ...p, inviteLink: e.target.value }))} className="input-field" placeholder="https://chat.whatsapp.com/..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Members</label><input type="number" value={groupForm.memberCount} onChange={e => setGroupForm(p => ({ ...p, memberCount: e.target.value }))} className="input-field" placeholder="0" /></div>
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Admin Phone</label><input value={groupForm.adminPhone} onChange={e => setGroupForm(p => ({ ...p, adminPhone: e.target.value }))} className="input-field" placeholder="+92..." /></div>
              </div>
              <button onClick={addGroup} disabled={creating || !groupForm.name} className="btn-primary w-full">{creating ? "Adding..." : "Add Group"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD SOCIAL SHEET ═══ */}
      {showAddSocial && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowAddSocial(false)}>
          <div className="bg-surface-primary rounded-t-apple-xl w-full max-w-lg p-5 safe-area-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-title-sm">Add Social Account</h2>
              <button onClick={() => setShowAddSocial(false)} className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center"><X size={16} className="text-label-secondary" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => {
                    const Icon = p.icon;
                    return (
                      <button key={p.key} onClick={() => setSocialForm(prev => ({ ...prev, platform: p.key }))}
                        className={`pill flex items-center gap-1.5 ${socialForm.platform === p.key ? "pill-active" : "pill-inactive"}`}>
                        <Icon size={12} />{p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Account Name *</label><input value={socialForm.accountName} onChange={e => setSocialForm(p => ({ ...p, accountName: e.target.value }))} className="input-field" placeholder="Awaam Raaj Official" /></div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Username / ID</label><input value={socialForm.accountId} onChange={e => setSocialForm(p => ({ ...p, accountId: e.target.value }))} className="input-field" placeholder="@awaamraaj" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Followers</label><input type="number" value={socialForm.followers} onChange={e => setSocialForm(p => ({ ...p, followers: e.target.value }))} className="input-field" placeholder="0" /></div>
                <div><label className="text-caption font-medium text-label-secondary mb-1 block">Posts</label><input type="number" value={socialForm.posts} onChange={e => setSocialForm(p => ({ ...p, posts: e.target.value }))} className="input-field" placeholder="0" /></div>
              </div>
              <button onClick={addSocial} disabled={creating || !socialForm.accountName} className="btn-primary w-full">{creating ? "Adding..." : "Add Account"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ QUEUE ACTION SHEET ═══ */}
      {showQueueAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowQueueAction(false)}>
          <div className="bg-surface-primary rounded-t-apple-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 safe-area-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-title-sm">Queue Action</h2>
              <button onClick={() => setShowQueueAction(false)} className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center"><X size={16} className="text-label-secondary" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Action Type</label>
                <select value={actionForm.type} onChange={e => setActionForm(p => ({ ...p, type: e.target.value }))} className="input-field">
                  {ACTION_TYPES.map(at => <option key={at.key} value={at.key}>{at.label}</option>)}
                </select>
              </div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.slice(0, 5).map(p => {
                    const Icon = p.icon;
                    return (
                      <button key={p.key} onClick={() => setActionForm(prev => ({ ...prev, platform: p.key }))}
                        className={`pill flex items-center gap-1.5 ${actionForm.platform === p.key ? "pill-active" : "pill-inactive"}`}>
                        <Icon size={12} />{p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Title *</label><input value={actionForm.title} onChange={e => setActionForm(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder="e.g. Create PART-Lahore group" /></div>
              <div><label className="text-caption font-medium text-label-secondary mb-1 block">Payload (JSON)</label><textarea value={actionForm.payload} onChange={e => setActionForm(p => ({ ...p, payload: e.target.value }))} className="input-field font-mono text-caption" rows={4} placeholder='{"districtName": "Lahore", "contacts": [...]}' /></div>
              <button onClick={queueAction} disabled={creating || !actionForm.title} className="btn-primary w-full flex items-center justify-center gap-1.5">
                <Zap size={16} />{creating ? "Queueing..." : "Queue Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
