"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Zap, MessageCircle, Users, Plus, X, Send, Trash2, RefreshCw,
  Globe, Phone, ChevronRight, Activity,
  Instagram, Youtube, Twitter, Facebook, Radio, Clock, CheckCircle2, XCircle, Loader2,
  ExternalLink, Wifi, WifiOff, Smartphone, RotateCcw, Eye, EyeOff
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────

const PLATFORMS = [
  { key: "WHATSAPP", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "FACEBOOK", label: "Facebook", icon: Facebook, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50" },
  { key: "TWITTER", label: "X / Twitter", icon: Twitter, color: "text-gray-800", bg: "bg-gray-100" },
  { key: "YOUTUBE", label: "YouTube", icon: Youtube, color: "text-red-600", bg: "bg-red-50" },
  { key: "TIKTOK", label: "TikTok", icon: Radio, color: "text-purple-600", bg: "bg-purple-50" },
];

const ACTION_TYPES = [
  { key: "BULK_MESSAGE", label: "Send Direct Message", desc: "DM one or more contacts on WhatsApp", icon: Send },
  { key: "CREATE_GROUP", label: "Create WhatsApp Group", desc: "Create a group and add members", icon: Users },
  { key: "SEND_ANNOUNCEMENT", label: "Group Announcement", desc: "Send message to a WhatsApp group", icon: MessageCircle },
  { key: "SOCIAL_POST", label: "Social Media Post", desc: "Post content to social platforms", icon: Globe },
];

const STATUS_CONFIG: Record<string, { badge: string; icon: any; iconClass: string; bgClass: string }> = {
  QUEUED: { badge: "badge-gray", icon: Clock, iconClass: "text-gray-400", bgClass: "bg-gray-100" },
  RUNNING: { badge: "badge-yellow", icon: Loader2, iconClass: "text-amber-600 animate-spin", bgClass: "bg-amber-50" },
  COMPLETED: { badge: "badge-green", icon: CheckCircle2, iconClass: "text-emerald-600", bgClass: "bg-emerald-50" },
  FAILED: { badge: "badge-red", icon: XCircle, iconClass: "text-red-500", bgClass: "bg-red-50" },
};

// ─── Types ──────────────────────────────────────────────────────

type Tab = "overview" | "groups" | "actions" | "social";
type ActionType = "BULK_MESSAGE" | "CREATE_GROUP" | "SEND_ANNOUNCEMENT" | "SOCIAL_POST";

interface BridgeStatus {
  online: boolean;
  deviceConnected?: boolean;
  activeGoal?: string | null;
  lastHeartbeat: string | null;
  staleSeconds?: number | null;
}

// ─── Smart Action Forms ─────────────────────────────────────────

function BulkMessageForm({ onSubmit, creating, groups }: { onSubmit: (title: string, payload: any) => void; creating: boolean; groups: any[] }) {
  const [phones, setPhones] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    const contacts = phones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
    if (!contacts.length || !message) return;
    onSubmit(
      `DM to ${contacts.length} contact${contacts.length > 1 ? "s" : ""}`,
      { contacts, message }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-caption font-medium text-label-secondary mb-1 block">Phone Numbers *</label>
        <textarea
          value={phones}
          onChange={e => setPhones(e.target.value)}
          className="input-field font-mono text-caption"
          rows={3}
          placeholder={"+92 300 1234567\n+92 321 9876543\nOne per line or comma-separated"}
        />
        {phones && (
          <p className="text-caption text-label-tertiary mt-1">
            {phones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean).length} contact(s)
          </p>
        )}
      </div>
      <div>
        <label className="text-caption font-medium text-label-secondary mb-1 block">Message *</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="input-field"
          rows={3}
          placeholder="Assalam o Alaikum! Your message here..."
        />
        <p className="text-caption text-label-quaternary mt-1">{message.length} chars</p>
      </div>
      <button
        onClick={handleSubmit}
        disabled={creating || !phones.trim() || !message.trim()}
        className="btn-primary w-full flex items-center justify-center gap-1.5"
      >
        <Send size={16} />{creating ? "Queueing..." : "Send Message"}
      </button>
    </div>
  );
}

function CreateGroupForm({ onSubmit, creating }: { onSubmit: (title: string, payload: any) => void; creating: boolean }) {
  const [groupName, setGroupName] = useState("");
  const [phones, setPhones] = useState("");

  const handleSubmit = () => {
    if (!groupName) return;
    const contacts = phones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
    onSubmit(`Create Group: ${groupName}`, { groupName, contacts });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-caption font-medium text-label-secondary mb-1 block">Group Name *</label>
        <input
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          className="input-field"
          placeholder="PART - Lahore District"
        />
      </div>
      <div>
        <label className="text-caption font-medium text-label-secondary mb-1 block">Members (Phone Numbers)</label>
        <textarea
          value={phones}
          onChange={e => setPhones(e.target.value)}
          className="input-field font-mono text-caption"
          rows={3}
          placeholder={"+92 300 1234567\n+92 321 9876543\nOne per line"}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={creating || !groupName.trim()}
        className="btn-primary w-full flex items-center justify-center gap-1.5"
      >
        <Users size={16} />{creating ? "Queueing..." : "Create Group"}
      </button>
    </div>
  );
}

function AnnouncementForm({ onSubmit, creating, groups }: { onSubmit: (title: string, payload: any) => void; creating: boolean; groups: any[] }) {
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-caption font-medium text-label-secondary mb-1 block">Group *</label>
        {groups.length > 0 ? (
          <select
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            className="input-field"
          >
            <option value="">Select a group...</option>
            {groups.map((g: any) => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>
        ) : (
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            className="input-field"
            placeholder="Group name as it appears in WhatsApp"
          />
        )}
      </div>
      <div>
        <label className="text-caption font-medium text-label-secondary mb-1 block">Message *</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="input-field"
          rows={4}
          placeholder="Your announcement message..."
        />
      </div>
      <button
        onClick={() => onSubmit(`Announce: ${groupName}`, { groupName, message })}
        disabled={creating || !groupName || !message.trim()}
        className="btn-primary w-full flex items-center justify-center gap-1.5"
      >
        <MessageCircle size={16} />{creating ? "Queueing..." : "Send Announcement"}
      </button>
    </div>
  );
}

function SocialPostForm({ onSubmit, creating }: { onSubmit: (title: string, payload: any) => void; creating: boolean }) {
  const [platform, setPlatform] = useState("FACEBOOK");
  const [content, setContent] = useState("");

  const plat = PLATFORMS.find(p => p.key === platform)!;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-caption font-medium text-label-secondary mb-1 block">Platform</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.filter(p => ["FACEBOOK", "INSTAGRAM", "TWITTER"].includes(p.key)).map(p => {
            const Icon = p.icon;
            return (
              <button key={p.key} onClick={() => setPlatform(p.key)}
                className={`pill flex items-center gap-1.5 ${platform === p.key ? "pill-active" : "pill-inactive"}`}>
                <Icon size={12} />{p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="text-caption font-medium text-label-secondary mb-1 block">Content *</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="input-field"
          rows={4}
          placeholder="Your post content..."
        />
        <p className="text-caption text-label-quaternary mt-1">{content.length} chars</p>
      </div>
      <button
        onClick={() => onSubmit(`Post to ${plat.label}`, { platform, content })}
        disabled={creating || !content.trim()}
        className="btn-primary w-full flex items-center justify-center gap-1.5"
      >
        <Globe size={16} />{creating ? "Queueing..." : `Post to ${plat.label}`}
      </button>
    </div>
  );
}

// ─── Payload Display ────────────────────────────────────────────

function PayloadDisplay({ payload }: { payload: string | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!payload) return null;

  let parsed: any;
  try { parsed = JSON.parse(payload); } catch { return <p className="text-caption text-label-tertiary font-mono">{payload}</p>; }

  return (
    <div className="mt-2">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-caption text-accent font-medium">
        {expanded ? <EyeOff size={11} /> : <Eye size={11} />}
        {expanded ? "Hide" : "Show"} details
      </button>
      {expanded && (
        <div className="mt-2 p-2.5 bg-surface-tertiary rounded-apple text-caption space-y-1">
          {parsed.contacts && (
            <div className="flex items-start gap-2">
              <Phone size={11} className="text-label-tertiary mt-0.5 shrink-0" />
              <span className="text-label-secondary">{parsed.contacts.join(", ")}</span>
            </div>
          )}
          {parsed.message && (
            <div className="flex items-start gap-2">
              <MessageCircle size={11} className="text-label-tertiary mt-0.5 shrink-0" />
              <span className="text-label-secondary">{parsed.message}</span>
            </div>
          )}
          {parsed.groupName && (
            <div className="flex items-start gap-2">
              <Users size={11} className="text-label-tertiary mt-0.5 shrink-0" />
              <span className="text-label-secondary">{parsed.groupName}</span>
            </div>
          )}
          {parsed.platform && (
            <div className="flex items-start gap-2">
              <Globe size={11} className="text-label-tertiary mt-0.5 shrink-0" />
              <span className="text-label-secondary">{parsed.platform}</span>
            </div>
          )}
          {parsed.content && (
            <div className="flex items-start gap-2">
              <Globe size={11} className="text-label-tertiary mt-0.5 shrink-0" />
              <span className="text-label-secondary">{parsed.content}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Quick Send Widget ──────────────────────────────────────────

function QuickSend({ onSend, creating }: { onSend: (phone: string, message: string) => void; creating: boolean }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="card border-2 border-dashed border-emerald-200 bg-emerald-50/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <Send size={14} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-callout font-semibold text-label-primary">Quick Send</p>
          <p className="text-caption text-label-tertiary">Send a WhatsApp message via DroidClaw</p>
        </div>
      </div>
      <div className="flex gap-2 mb-2">
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="input-field flex-1 !py-2"
          placeholder="+92 300 1234567"
        />
      </div>
      <div className="flex gap-2">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="input-field flex-1 !py-2"
          placeholder="Type your message..."
          onKeyDown={e => { if (e.key === "Enter" && phone && message) { onSend(phone, message); setPhone(""); setMessage(""); } }}
        />
        <button
          onClick={() => { onSend(phone, message); setPhone(""); setMessage(""); }}
          disabled={creating || !phone.trim() || !message.trim()}
          className="btn-primary !py-2 !px-4 flex items-center gap-1.5"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export default function AIDashboard() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  // Modals
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [showQueueAction, setShowQueueAction] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<ActionType>("BULK_MESSAGE");

  // Forms
  const [groupForm, setGroupForm] = useState({ name: "", districtId: "", provinceId: "", inviteLink: "", memberCount: "", adminPhone: "", groupType: "DISTRICT" });
  const [socialForm, setSocialForm] = useState({ platform: "FACEBOOK", accountName: "", accountId: "", followers: "", posts: "" });
  const [creating, setCreating] = useState(false);

  // Geo data
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  // Bridge status
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({ online: false, lastHeartbeat: null });

  const loadData = useCallback(async () => {
    try {
      const r = await fetch("/api/droidclaw");
      if (r.ok) setData(await r.json());
    } catch {}
    setLoading(false);
  }, []);

  const loadBridgeStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/droidclaw/bridge-status");
      if (r.ok) setBridgeStatus(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) router.push("/home");
      loadData();
      loadBridgeStatus();
      fetch("/api/provinces").then(r => r.json()).then(d => setProvinces(d.provinces || [])).catch(() => {});
      fetch("/api/districts").then(r => r.json()).then(d => setDistricts(d.districts || [])).catch(() => {});
      const interval = setInterval(loadBridgeStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [authStatus]);

  // ─── Actions ──────────────────────────────────────────────────

  const queueAction = async (type: string, title: string, payload: any) => {
    setCreating(true);
    try {
      await fetch("/api/droidclaw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "QUEUE_ACTION", type, platform: type === "SOCIAL_POST" ? payload.platform : "WHATSAPP", title, payload }),
      });
      setShowQueueAction(false);
      loadData();
    } catch {}
    setCreating(false);
  };

  const quickSend = async (phone: string, message: string) => {
    await queueAction("BULK_MESSAGE", `Quick DM: ${phone}`, { contacts: [phone], message });
  };

  const retryAction = async (id: string) => {
    await fetch("/api/droidclaw", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "action", id, status: "QUEUED" }),
    });
    loadData();
  };

  const deleteItem = async (entity: string, id: string) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/droidclaw?entity=${entity}&id=${id}`, { method: "DELETE" });
    loadData();
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

  // ─── Render ───────────────────────────────────────────────────

  if (loading) return <div className="space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-24 rounded-apple-lg" />)}</div>;

  const s = data?.stats || {};
  const groups = data?.whatsappGroups || [];
  const actions = data?.recentActions || [];
  const socials = data?.socialAccounts || [];

  const TABS = [
    { key: "overview" as Tab, label: "Overview", icon: Activity },
    { key: "groups" as Tab, label: "Groups", icon: MessageCircle },
    { key: "actions" as Tab, label: "Actions", icon: Zap },
    { key: "social" as Tab, label: "Social", icon: Globe },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title tracking-tight">Awaam Raaj AI</h1>
          <p className="text-caption text-label-tertiary">DroidClaw · Phone Automation</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${bridgeStatus.online ? "bg-emerald-50" : "bg-red-50"}`}>
            {bridgeStatus.online ? <Wifi size={12} className="text-emerald-600" /> : <WifiOff size={12} className="text-red-400" />}
            <span className={`text-caption font-semibold ${bridgeStatus.online ? "text-emerald-700" : "text-red-500"}`}>
              {bridgeStatus.online ? "Bridge Online" : "Bridge Offline"}
            </span>
            {bridgeStatus.online && bridgeStatus.deviceConnected && (
              <Smartphone size={11} className="text-emerald-500" />
            )}
          </div>
          <button onClick={() => { setLoading(true); loadData(); loadBridgeStatus(); }} className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale">
            <RefreshCw size={16} className="text-label-secondary" />
          </button>
        </div>
      </div>

      {/* Bridge active goal */}
      {bridgeStatus.online && bridgeStatus.activeGoal && (
        <div className="card bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="text-amber-600 animate-spin" />
            <span className="text-caption font-medium text-amber-800">Working: {bridgeStatus.activeGoal}</span>
          </div>
        </div>
      )}

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
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <p className="text-caption font-semibold text-label-tertiary uppercase tracking-wider">WhatsApp Groups</p>
              <p className="text-title text-label-primary mt-1">{s.totalGroups || 0}</p>
              <p className="text-caption text-label-quaternary mt-1">{s.totalMembers || 0} members</p>
            </div>
            <div className="card">
              <p className="text-caption font-semibold text-label-tertiary uppercase tracking-wider">District Coverage</p>
              <p className="text-title text-label-primary mt-1">{s.coveragePercent || 0}%</p>
              <p className="text-caption text-label-quaternary mt-1">{s.districtsCovered || 0}/{s.totalDistricts || 0}</p>
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

          {/* Quick Send */}
          <QuickSend onSend={quickSend} creating={creating} />

          {/* Quick Actions */}
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">Workflows</p>
          <div className="card-grouped">
            {ACTION_TYPES.map((at, i) => {
              const Icon = at.icon;
              return (
                <button key={i} onClick={() => { setSelectedActionType(at.key as ActionType); setShowQueueAction(true); }}
                  className="list-row w-full tap-scale">
                  <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center">
                    <Icon size={17} className="text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-body font-medium text-label-primary">{at.label}</p>
                    <p className="text-caption text-label-tertiary">{at.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-label-quaternary" />
                </button>
              );
            })}
          </div>

          {/* Recent Actions */}
          {actions.length > 0 && (
            <>
              <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">Recent Activity</p>
              <div className="card-grouped">
                {actions.slice(0, 5).map((a: any) => {
                  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.QUEUED;
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={a.id} className="list-row">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bgClass}`}>
                        <StatusIcon size={14} className={cfg.iconClass} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-callout font-medium text-label-primary truncate">{a.title}</p>
                        <p className="text-caption text-label-tertiary">{a.type.replace(/_/g, " ")} · {new Date(a.createdAt).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <span className={`badge ${cfg.badge}`}>{a.status}</span>
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
                    {g.inviteLink && <a href={g.inviteLink} target="_blank" className="flex items-center gap-1 text-accent"><ExternalLink size={11} /> Join</a>}
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
          {/* Quick Send at top */}
          <QuickSend onSend={quickSend} creating={creating} />

          <div className="flex justify-between items-center">
            <p className="text-headline text-label-primary">Action Queue</p>
            <button onClick={() => { setSelectedActionType("BULK_MESSAGE"); setShowQueueAction(true); }}
              className="btn-primary !py-2 !px-4 text-subhead flex items-center gap-1.5">
              <Zap size={15} /> New
            </button>
          </div>

          {/* Workflow Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {ACTION_TYPES.map(at => {
              const Icon = at.icon;
              return (
                <button key={at.key} onClick={() => { setSelectedActionType(at.key as ActionType); setShowQueueAction(true); }}
                  className="card tap-scale text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className="text-purple-600" />
                    <p className="text-callout font-semibold text-label-primary">{at.label}</p>
                  </div>
                  <p className="text-caption text-label-tertiary">{at.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Action History */}
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">History</p>
          {actions.length > 0 ? (
            <div className="space-y-2">
              {actions.map((a: any) => {
                const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.QUEUED;
                const StatusIcon = cfg.icon;
                return (
                  <div key={a.id} className="card">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <StatusIcon size={16} className={cfg.iconClass} />
                        <div className="min-w-0 flex-1">
                          <p className="text-body font-medium text-label-primary truncate">{a.title}</p>
                          <p className="text-caption text-label-tertiary">
                            {a.type.replace(/_/g, " ")} · {a.createdBy?.name} · {new Date(a.createdAt).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <span className={`badge ${cfg.badge}`}>{a.status}</span>
                    </div>

                    {a.error && <p className="text-caption text-red-500 mt-2 bg-red-50 rounded-apple p-2">{a.error}</p>}

                    <PayloadDisplay payload={a.payload} />

                    <div className="flex gap-3 mt-2 pt-2 border-t border-separator">
                      {a.status === "FAILED" && (
                        <button onClick={() => retryAction(a.id)} className="text-subhead text-accent font-semibold flex items-center gap-1">
                          <RotateCcw size={12} /> Retry
                        </button>
                      )}
                      {a.status === "QUEUED" && (
                        <button onClick={() => retryAction(a.id)} className="text-subhead text-amber-600 font-semibold flex items-center gap-1">
                          <Clock size={12} /> Waiting...
                        </button>
                      )}
                      {a.status === "RUNNING" && (
                        <span className="text-subhead text-amber-600 font-semibold flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Running
                        </span>
                      )}
                      {a.status === "COMPLETED" && a.completedAt && (
                        <span className="text-caption text-label-quaternary">
                          Completed {new Date(a.completedAt).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      <button onClick={() => deleteItem("action", a.id)} className="text-subhead text-label-quaternary font-semibold ml-auto flex items-center gap-1">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Zap size={36} className="text-label-quaternary mx-auto mb-2" />
              <p className="text-body text-label-secondary">No actions yet</p>
              <p className="text-caption text-label-tertiary mt-1">Use Quick Send above or queue a workflow</p>
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
                      <div className={`w-12 h-12 rounded-apple-lg flex items-center justify-center ${platform.bg}`}>
                        <Icon size={24} className={platform.color} />
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
                        <p className="text-caption text-label-tertiary">Sync</p>
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
              <p className="text-caption text-label-tertiary mt-1">Add your party social media accounts</p>
            </div>
          )}

          {/* Platform Overview */}
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider">Platforms</p>
          <div className="card-grouped">
            {PLATFORMS.map((p, i) => {
              const Icon = p.icon;
              const count = socials.filter((s: any) => s.platform === p.key).length;
              return (
                <div key={i} className="list-row">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${p.bg}`}>
                    <Icon size={17} className={p.color} />
                  </div>
                  <div className="flex-1">
                    <p className="text-body font-medium text-label-primary">{p.label}</p>
                    <p className="text-caption text-label-tertiary">{count} account{count !== 1 ? "s" : ""}</p>
                  </div>
                  {count > 0 && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ QUEUE ACTION SHEET ═══ */}
      {showQueueAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowQueueAction(false)}>
          <div className="bg-surface-primary rounded-t-apple-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 safe-area-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-title-sm">{ACTION_TYPES.find(a => a.key === selectedActionType)?.label}</h2>
              <button onClick={() => setShowQueueAction(false)} className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center">
                <X size={16} className="text-label-secondary" />
              </button>
            </div>

            {/* Action type selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3">
              {ACTION_TYPES.map(at => (
                <button key={at.key} onClick={() => setSelectedActionType(at.key as ActionType)}
                  className={`pill whitespace-nowrap ${selectedActionType === at.key ? "pill-active" : "pill-inactive"}`}>
                  {at.label}
                </button>
              ))}
            </div>

            {/* Smart forms per type */}
            {selectedActionType === "BULK_MESSAGE" && (
              <BulkMessageForm
                onSubmit={(title, payload) => queueAction("BULK_MESSAGE", title, payload)}
                creating={creating}
                groups={groups}
              />
            )}
            {selectedActionType === "CREATE_GROUP" && (
              <CreateGroupForm
                onSubmit={(title, payload) => queueAction("CREATE_GROUP", title, payload)}
                creating={creating}
              />
            )}
            {selectedActionType === "SEND_ANNOUNCEMENT" && (
              <AnnouncementForm
                onSubmit={(title, payload) => queueAction("SEND_ANNOUNCEMENT", title, payload)}
                creating={creating}
                groups={groups}
              />
            )}
            {selectedActionType === "SOCIAL_POST" && (
              <SocialPostForm
                onSubmit={(title, payload) => queueAction("SOCIAL_POST", title, payload)}
                creating={creating}
              />
            )}

            {!bridgeStatus.online && (
              <div className="mt-3 p-2.5 bg-amber-50 rounded-apple flex items-center gap-2">
                <WifiOff size={14} className="text-amber-600" />
                <p className="text-caption text-amber-700">Bridge is offline. Action will be queued and executed when bridge reconnects.</p>
              </div>
            )}
          </div>
        </div>
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
                <div className="flex gap-2 flex-wrap">
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
    </div>
  );
}
