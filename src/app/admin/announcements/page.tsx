"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const TARGET_LABELS: Record<string, string> = {
  ALL: "🌍 All Members",
  PROVINCE: "🏛️ Province",
  DISTRICT: "🏘️ District",
  TEHSIL: "📍 Tehsil",
  CONSTITUENCY: "🗳️ Constituency",
  INDIVIDUAL: "👤 Individual",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENDING: "bg-yellow-100 text-yellow-700",
  SENT: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-600",
  CANCELLED: "bg-gray-100 text-gray-400",
};

export default function AnnouncementsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // Data
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [tehsils, setTehsils] = useState<any[]>([]);
  const [constituencies, setConstituencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for member list
  const [filterProvince, setFilterProvince] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterTehsil, setFilterTehsil] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "", titleUrdu: "", message: "", messageUrdu: "",
    targetType: "ALL", provinceId: "", districtId: "", tehsilId: "",
    constituencyId: "", memberIds: [] as string[],
  });
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  // Tab
  const [tab, setTab] = useState<"create" | "history">("create");

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["ADMIN", "OWNER"].includes(role)) router.push("/home");
      loadData();
    }
  }, [authStatus]);

  const loadData = async () => {
    const [annRes, memRes, provRes, constRes] = await Promise.all([
      fetch("/api/announcements").then(r => r.json()),
      fetch("/api/members").then(r => r.json()),
      fetch("/api/geo?type=provinces").then(r => r.json()),
      fetch("/api/constituencies").then(r => r.json()),
    ]);
    setAnnouncements(annRes.announcements || []);
    setMembers(Array.isArray(memRes) ? memRes : memRes.members || []);
    setProvinces(provRes.provinces || []);
    setConstituencies(constRes.constituencies || []);
    setLoading(false);
  };

  // Load districts when province changes
  useEffect(() => {
    if (filterProvince) {
      fetch(`/api/geo?type=districts&provinceId=${filterProvince}`).then(r => r.json()).then(d => setDistricts(d.districts || []));
    } else {
      setDistricts([]);
    }
    setFilterDistrict("");
    setFilterTehsil("");
    setTehsils([]);
  }, [filterProvince]);

  // Load tehsils when district changes
  useEffect(() => {
    if (filterDistrict) {
      fetch(`/api/geo?type=tehsils&districtId=${filterDistrict}`).then(r => r.json()).then(d => setTehsils(d.tehsils || []));
    } else {
      setTehsils([]);
    }
    setFilterTehsil("");
  }, [filterDistrict]);

  // Filter members
  const filteredMembers = members.filter((m: any) => {
    if (filterProvince && m.provinceId !== filterProvince) return false;
    if (filterDistrict && m.districtId !== filterDistrict) return false;
    if (filterTehsil && m.tehsilId !== filterTehsil) return false;
    if (memberSearch) {
      const q = memberSearch.toLowerCase();
      if (!m.name?.toLowerCase().includes(q) && !m.phone?.includes(q) && !m.membershipNumber?.includes(memberSearch)) return false;
    }
    return true;
  });

  const toggleMember = (id: string) => {
    setForm(p => ({
      ...p,
      memberIds: p.memberIds.includes(id) ? p.memberIds.filter(i => i !== id) : [...p.memberIds, id],
    }));
  };

  const selectAllFiltered = () => {
    setForm(p => ({ ...p, memberIds: filteredMembers.map((m: any) => m.id) }));
  };

  const clearSelection = () => {
    setForm(p => ({ ...p, memberIds: [] }));
  };

  const createAnnouncement = async () => {
    setCreating(true);
    try {
      const payload: any = {
        title: form.title,
        titleUrdu: form.titleUrdu || undefined,
        message: form.message,
        messageUrdu: form.messageUrdu || undefined,
        targetType: form.targetType,
      };

      if (form.targetType === "PROVINCE") payload.provinceId = form.provinceId || filterProvince;
      if (form.targetType === "DISTRICT") payload.districtId = form.districtId || filterDistrict;
      if (form.targetType === "TEHSIL") payload.tehsilId = form.tehsilId || filterTehsil;
      if (form.targetType === "CONSTITUENCY") payload.constituencyId = form.constituencyId;
      if (form.targetType === "INDIVIDUAL") payload.memberIds = form.memberIds;

      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowCreate(false);
        setForm({ title: "", titleUrdu: "", message: "", messageUrdu: "", targetType: "ALL", provinceId: "", districtId: "", tehsilId: "", constituencyId: "", memberIds: [] });
        loadData();
        setTab("history");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create");
      }
    } finally {
      setCreating(false);
    }
  };

  const sendAnnouncement = async (id: string) => {
    if (!confirm("Send this announcement to all targets via WhatsApp?")) return;
    setSending(id);
    try {
      const res = await fetch(`/api/announcements/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`Sent: ${data.sent}, Failed: ${data.failed}`);
      } else {
        alert(data.error || "Failed");
      }
      loadData();
    } finally {
      setSending(null);
    }
  };

  const sendWhatsAppDirect = (phone: string, message: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${clean}?text=${encoded}`, "_blank");
  };

  const sendBulkWhatsApp = (announcement: any) => {
    // Open WhatsApp for each recipient with pre-filled message
    const msg = announcement.messageUrdu
      ? `*${announcement.title}*\n${announcement.titleUrdu}\n\n${announcement.message}\n${announcement.messageUrdu}`
      : `*${announcement.title}*\n\n${announcement.message}`;

    // Get all target members from the announcement logs
    // For now, filter members based on announcement targeting
    let targets = members;
    if (announcement.provinceId) targets = targets.filter((m: any) => m.provinceId === announcement.provinceId);
    if (announcement.districtId) targets = targets.filter((m: any) => m.districtId === announcement.districtId);

    if (targets.length === 0) {
      alert("No targets found");
      return;
    }

    // Open first one, show list for the rest
    const firstPhone = targets[0]?.phone?.replace(/[^0-9]/g, "");
    if (firstPhone) {
      window.open(`https://wa.me/${firstPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    }

    alert(`Opening WhatsApp for ${targets.length} recipients. First one opened — continue manually for each.`);
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    loadData();
  };

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">📢 Announcements</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("create")} className={`flex-1 py-2 rounded-xl text-xs font-semibold ${tab === "create" ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>
          ✍️ Create New
        </button>
        <button onClick={() => setTab("history")} className={`flex-1 py-2 rounded-xl text-xs font-semibold ${tab === "history" ? "bg-party-red text-white" : "bg-gray-100 text-gray-500"}`}>
          📋 History ({announcements.length})
        </button>
      </div>

      {/* ═══════ CREATE TAB ═══════ */}
      {tab === "create" && (
        <div className="space-y-4">
          {/* Message Content */}
          <div className="card space-y-3">
            <h2 className="text-sm font-bold">📝 Message</h2>
            <div>
              <label className="text-xs font-semibold text-gray-600">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field mt-1" placeholder="Announcement title" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">عنوان (Urdu)</label>
              <input value={form.titleUrdu} onChange={e => setForm(p => ({ ...p, titleUrdu: e.target.value }))} className="input-field mt-1 font-urdu" dir="rtl" placeholder="اردو عنوان" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Message *</label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="input-field mt-1" rows={3} placeholder="Your announcement message..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">پیغام (Urdu)</label>
              <textarea value={form.messageUrdu} onChange={e => setForm(p => ({ ...p, messageUrdu: e.target.value }))} className="input-field mt-1 font-urdu" dir="rtl" rows={3} placeholder="اردو پیغام..." />
            </div>
          </div>

          {/* Target Selection */}
          <div className="card space-y-3">
            <h2 className="text-sm font-bold">🎯 Target Audience</h2>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(TARGET_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => setForm(p => ({ ...p, targetType: key, memberIds: [] }))}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${form.targetType === key ? "bg-party-red text-white" : "bg-gray-100 text-gray-600"}`}>
                  {label}
                </button>
              ))}
            </div>

            {form.targetType === "PROVINCE" && (
              <select value={form.provinceId} onChange={e => setForm(p => ({ ...p, provinceId: e.target.value }))} className="input-field text-xs">
                <option value="">Select Province</option>
                {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.nameUrdu})</option>)}
              </select>
            )}

            {form.targetType === "DISTRICT" && (
              <>
                <select value={form.provinceId} onChange={e => { setForm(p => ({ ...p, provinceId: e.target.value, districtId: "" })); setFilterProvince(e.target.value); }} className="input-field text-xs">
                  <option value="">Select Province first</option>
                  {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {districts.length > 0 && (
                  <select value={form.districtId} onChange={e => setForm(p => ({ ...p, districtId: e.target.value }))} className="input-field text-xs">
                    <option value="">Select District</option>
                    {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
              </>
            )}

            {form.targetType === "TEHSIL" && (
              <>
                <select value={form.provinceId} onChange={e => { setForm(p => ({ ...p, provinceId: e.target.value, districtId: "", tehsilId: "" })); setFilterProvince(e.target.value); }} className="input-field text-xs">
                  <option value="">Select Province</option>
                  {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {districts.length > 0 && (
                  <select value={form.districtId} onChange={e => { setForm(p => ({ ...p, districtId: e.target.value, tehsilId: "" })); setFilterDistrict(e.target.value); }} className="input-field text-xs">
                    <option value="">Select District</option>
                    {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
                {tehsils.length > 0 && (
                  <select value={form.tehsilId} onChange={e => setForm(p => ({ ...p, tehsilId: e.target.value }))} className="input-field text-xs">
                    <option value="">Select Tehsil</option>
                    {tehsils.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </>
            )}

            {form.targetType === "CONSTITUENCY" && (
              <select value={form.constituencyId} onChange={e => setForm(p => ({ ...p, constituencyId: e.target.value }))} className="input-field text-xs">
                <option value="">Select Constituency</option>
                {constituencies.map((c: any) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            )}

            {form.targetType === "INDIVIDUAL" && (
              <div className="space-y-2">
                {/* Geographic Filters */}
                <div className="grid grid-cols-3 gap-1.5">
                  <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)} className="input-field text-[10px] !py-1.5">
                    <option value="">Province</option>
                    {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} className="input-field text-[10px] !py-1.5" disabled={!filterProvince}>
                    <option value="">District</option>
                    {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select value={filterTehsil} onChange={e => setFilterTehsil(e.target.value)} className="input-field text-[10px] !py-1.5" disabled={!filterDistrict}>
                    <option value="">Tehsil</option>
                    {tehsils.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="input-field text-xs" placeholder="🔍 Search name, phone, membership..." />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">{filteredMembers.length} members • {form.memberIds.length} selected</span>
                  <div className="flex gap-2">
                    <button onClick={selectAllFiltered} className="text-[10px] text-blue-500 font-semibold">Select All</button>
                    <button onClick={clearSelection} className="text-[10px] text-red-400 font-semibold">Clear</button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border rounded-xl divide-y">
                  {filteredMembers.slice(0, 50).map((m: any) => (
                    <button key={m.id} onClick={() => toggleMember(m.id)}
                      className={`w-full text-left px-3 py-2 flex justify-between items-center ${form.memberIds.includes(m.id) ? "bg-party-red/5" : ""}`}>
                      <div>
                        <p className="text-xs font-medium">{m.name}</p>
                        <p className="text-[9px] text-gray-400" dir="ltr">{m.phone} • {m.membershipNumber || "—"}</p>
                      </div>
                      {form.memberIds.includes(m.id) && <span className="text-party-red font-bold">✓</span>}
                    </button>
                  ))}
                  {filteredMembers.length > 50 && <p className="text-center text-[10px] text-gray-400 py-2">+{filteredMembers.length - 50} more</p>}
                </div>
              </div>
            )}

            {form.targetType !== "INDIVIDUAL" && (
              <p className="text-[10px] text-gray-400">
                Target: {form.targetType === "ALL" ? `All ${members.length} members` : "Select a location above"}
              </p>
            )}
          </div>

          {/* Preview & Send */}
          {form.title && form.message && (
            <div className="card bg-green-50 border-green-200">
              <h3 className="text-xs font-bold text-green-700 mb-2">📱 WhatsApp Preview</h3>
              <div className="bg-white rounded-lg p-3 text-sm border">
                <p className="font-bold">{form.title}</p>
                {form.titleUrdu && <p className="font-urdu text-xs text-gray-500" dir="rtl">{form.titleUrdu}</p>}
                <p className="mt-2 text-xs">{form.message}</p>
                {form.messageUrdu && <p className="mt-1 font-urdu text-xs text-gray-500" dir="rtl">{form.messageUrdu}</p>}
                <p className="mt-2 text-[9px] text-gray-400">— Pakistan Awaam Raaj Tehreek 🇵🇰</p>
              </div>
            </div>
          )}

          <button
            onClick={createAnnouncement}
            disabled={creating || !form.title || !form.message}
            className="w-full bg-party-red text-white py-3 rounded-xl font-semibold active:scale-95 disabled:opacity-50"
          >
            {creating ? "Creating..." : "📢 Create Announcement"}
          </button>
        </div>
      )}

      {/* ═══════ HISTORY TAB ═══════ */}
      {tab === "history" && (
        <div className="space-y-3">
          {announcements.length > 0 ? announcements.map((ann: any) => (
            <div key={ann.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{ann.title}</p>
                  {ann.titleUrdu && <p className="text-[10px] text-gray-400 font-urdu" dir="rtl">{ann.titleUrdu}</p>}
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[ann.status]}`}>
                  {ann.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{ann.message}</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mb-2">
                <span>{TARGET_LABELS[ann.targetType]}</span>
                <span>👥 {ann.totalTarget} targets</span>
                {ann.sentCount > 0 && <span className="text-green-500">✅ {ann.sentCount} sent</span>}
                {ann.failedCount > 0 && <span className="text-red-400">❌ {ann.failedCount} failed</span>}
                <span>{new Date(ann.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex gap-2">
                {ann.status === "DRAFT" && (
                  <>
                    <button onClick={() => sendAnnouncement(ann.id)} disabled={sending === ann.id}
                      className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-semibold active:scale-95 disabled:opacity-50">
                      {sending === ann.id ? "Sending..." : "📤 Mark Sent"}
                    </button>
                    <button onClick={() => sendBulkWhatsApp(ann)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-semibold active:scale-95">
                      📱 Open WhatsApp
                    </button>
                  </>
                )}
                {ann.status === "SENT" && (
                  <button onClick={() => sendBulkWhatsApp(ann)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-semibold active:scale-95">
                    📱 Resend via WhatsApp
                  </button>
                )}
                <button onClick={() => deleteAnnouncement(ann.id)} className="bg-red-50 text-red-400 px-3 py-2 rounded-xl text-xs font-semibold">🗑️</button>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📢</p>
              <p className="text-sm font-medium">No announcements yet</p>
              <p className="text-xs mt-1">Create one to reach your members</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
