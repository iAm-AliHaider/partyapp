"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Megaphone, Send, Trash2, Globe, MapPin, Users as UsersIcon, User, Search, Check } from "lucide-react";

const TARGET_LABELS: Record<string, string> = {
  ALL: "All Members", PROVINCE: "Province", DISTRICT: "District",
  TEHSIL: "Tehsil", CONSTITUENCY: "Constituency", INDIVIDUAL: "Individual",
};

const TARGET_ICONS: Record<string, any> = {
  ALL: Globe, PROVINCE: MapPin, DISTRICT: MapPin, TEHSIL: MapPin,
  CONSTITUENCY: MapPin, INDIVIDUAL: User,
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-gray", SENDING: "badge-yellow", SENT: "badge-green", FAILED: "badge-red", CANCELLED: "badge-gray",
};

export default function AnnouncementsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [tehsils, setTehsils] = useState<any[]>([]);
  const [constituencies, setConstituencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProvince, setFilterProvince] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterTehsil, setFilterTehsil] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [form, setForm] = useState({ title: "", titleUrdu: "", message: "", messageUrdu: "", targetType: "ALL", provinceId: "", districtId: "", tehsilId: "", constituencyId: "", memberIds: [] as string[] });
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
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

  useEffect(() => {
    if (filterProvince) fetch(`/api/geo?type=districts&provinceId=${filterProvince}`).then(r => r.json()).then(d => setDistricts(d.districts || []));
    else setDistricts([]);
    setFilterDistrict(""); setFilterTehsil(""); setTehsils([]);
  }, [filterProvince]);

  useEffect(() => {
    if (filterDistrict) fetch(`/api/geo?type=tehsils&districtId=${filterDistrict}`).then(r => r.json()).then(d => setTehsils(d.tehsils || []));
    else setTehsils([]);
    setFilterTehsil("");
  }, [filterDistrict]);

  const filteredMembers = members.filter((m: any) => {
    if (filterProvince && m.provinceId !== filterProvince) return false;
    if (filterDistrict && m.districtId !== filterDistrict) return false;
    if (filterTehsil && m.tehsilId !== filterTehsil) return false;
    if (memberSearch) { const q = memberSearch.toLowerCase(); if (!m.name?.toLowerCase().includes(q) && !m.phone?.includes(q) && !m.membershipNumber?.includes(memberSearch)) return false; }
    return true;
  });

  const toggleMember = (id: string) => setForm(p => ({ ...p, memberIds: p.memberIds.includes(id) ? p.memberIds.filter(i => i !== id) : [...p.memberIds, id] }));

  const createAnnouncement = async () => {
    setCreating(true);
    try {
      const payload: any = { title: form.title, titleUrdu: form.titleUrdu || undefined, message: form.message, messageUrdu: form.messageUrdu || undefined, targetType: form.targetType };
      if (form.targetType === "PROVINCE") payload.provinceId = form.provinceId || filterProvince;
      if (form.targetType === "DISTRICT") payload.districtId = form.districtId || filterDistrict;
      if (form.targetType === "TEHSIL") payload.tehsilId = form.tehsilId || filterTehsil;
      if (form.targetType === "CONSTITUENCY") payload.constituencyId = form.constituencyId;
      if (form.targetType === "INDIVIDUAL") payload.memberIds = form.memberIds;
      const res = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setForm({ title: "", titleUrdu: "", message: "", messageUrdu: "", targetType: "ALL", provinceId: "", districtId: "", tehsilId: "", constituencyId: "", memberIds: [] }); loadData(); setTab("history"); }
      else { const err = await res.json(); alert(err.error || "Failed"); }
    } finally { setCreating(false); }
  };

  const sendAnnouncement = async (id: string) => {
    if (!confirm("Send this announcement?")) return;
    setSending(id);
    try { const res = await fetch(`/api/announcements/${id}/send`, { method: "POST" }); const data = await res.json(); if (res.ok) alert(`Sent: ${data.sent}, Failed: ${data.failed}`); else alert(data.error || "Failed"); loadData(); } finally { setSending(null); }
  };

  const sendBulkWhatsApp = (ann: any) => {
    const msg = ann.messageUrdu ? `*${ann.title}*\n${ann.titleUrdu}\n\n${ann.message}\n${ann.messageUrdu}` : `*${ann.title}*\n\n${ann.message}`;
    let targets = members;
    if (ann.provinceId) targets = targets.filter((m: any) => m.provinceId === ann.provinceId);
    if (ann.districtId) targets = targets.filter((m: any) => m.districtId === ann.districtId);
    if (targets.length === 0) { alert("No targets"); return; }
    const firstPhone = targets[0]?.phone?.replace(/[^0-9]/g, "");
    if (firstPhone) window.open(`https://wa.me/${firstPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    alert(`Opening WhatsApp for ${targets.length} recipients.`);
  };

  const deleteAnnouncement = async (id: string) => { if (!confirm("Delete?")) return; await fetch(`/api/announcements/${id}`, { method: "DELETE" }); loadData(); };

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-apple-lg" />)}</div>;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 bg-surface-tertiary p-1 rounded-apple-lg">
        {(["create", "history"] as const).map(key => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-apple text-subhead font-semibold transition-all ${tab === key ? "bg-surface-primary shadow-apple text-label-primary" : "text-label-tertiary"}`}>
            {key === "create" ? "Create" : `History (${announcements.length})`}
          </button>
        ))}
      </div>

      {/* CREATE */}
      {tab === "create" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <p className="text-headline text-label-primary">Message</p>
            <div>
              <label className="text-caption font-medium text-label-secondary mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder="Announcement title" />
            </div>
            <div>
              <label className="text-caption font-medium text-label-secondary mb-1 block">Title (Urdu)</label>
              <input value={form.titleUrdu} onChange={e => setForm(p => ({ ...p, titleUrdu: e.target.value }))} className="input-field font-urdu" dir="rtl" placeholder="اردو عنوان" />
            </div>
            <div>
              <label className="text-caption font-medium text-label-secondary mb-1 block">Message *</label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="input-field" rows={3} placeholder="Your message..." />
            </div>
            <div>
              <label className="text-caption font-medium text-label-secondary mb-1 block">Message (Urdu)</label>
              <textarea value={form.messageUrdu} onChange={e => setForm(p => ({ ...p, messageUrdu: e.target.value }))} className="input-field font-urdu" dir="rtl" rows={3} placeholder="اردو پیغام..." />
            </div>
          </div>

          <div className="card space-y-4">
            <p className="text-headline text-label-primary">Target Audience</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(TARGET_LABELS).map(([key, label]) => {
                const Icon = TARGET_ICONS[key] || Globe;
                return (
                  <button key={key} onClick={() => setForm(p => ({ ...p, targetType: key, memberIds: [] }))}
                    className={`pill flex items-center gap-1.5 ${form.targetType === key ? "pill-active" : "pill-inactive"}`}>
                    <Icon size={12} />{label}
                  </button>
                );
              })}
            </div>

            {form.targetType === "PROVINCE" && (
              <select value={form.provinceId} onChange={e => setForm(p => ({ ...p, provinceId: e.target.value }))} className="input-field">
                <option value="">Select Province</option>
                {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}

            {form.targetType === "DISTRICT" && (
              <>
                <select value={form.provinceId} onChange={e => { setForm(p => ({ ...p, provinceId: e.target.value, districtId: "" })); setFilterProvince(e.target.value); }} className="input-field">
                  <option value="">Select Province</option>
                  {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {districts.length > 0 && (
                  <select value={form.districtId} onChange={e => setForm(p => ({ ...p, districtId: e.target.value }))} className="input-field">
                    <option value="">Select District</option>
                    {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
              </>
            )}

            {form.targetType === "TEHSIL" && (
              <>
                <select value={form.provinceId} onChange={e => { setForm(p => ({ ...p, provinceId: e.target.value, districtId: "", tehsilId: "" })); setFilterProvince(e.target.value); }} className="input-field">
                  <option value="">Select Province</option>
                  {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {districts.length > 0 && (
                  <select value={form.districtId} onChange={e => { setForm(p => ({ ...p, districtId: e.target.value, tehsilId: "" })); setFilterDistrict(e.target.value); }} className="input-field">
                    <option value="">Select District</option>
                    {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
                {tehsils.length > 0 && (
                  <select value={form.tehsilId} onChange={e => setForm(p => ({ ...p, tehsilId: e.target.value }))} className="input-field">
                    <option value="">Select Tehsil</option>
                    {tehsils.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </>
            )}

            {form.targetType === "INDIVIDUAL" && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1.5">
                  <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)} className="input-field !py-2 text-caption"><option value="">Province</option>{provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} className="input-field !py-2 text-caption" disabled={!filterProvince}><option value="">District</option>{districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                  <select value={filterTehsil} onChange={e => setFilterTehsil(e.target.value)} className="input-field !py-2 text-caption" disabled={!filterDistrict}><option value="">Tehsil</option>{tehsils.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary" />
                  <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="input-field !pl-9 text-callout" placeholder="Search members..." />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-caption text-label-tertiary">{filteredMembers.length} members · {form.memberIds.length} selected</span>
                  <div className="flex gap-3">
                    <button onClick={() => setForm(p => ({ ...p, memberIds: filteredMembers.map((m: any) => m.id) }))} className="text-caption text-accent font-semibold">Select All</button>
                    <button onClick={() => setForm(p => ({ ...p, memberIds: [] }))} className="text-caption text-label-tertiary font-semibold">Clear</button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto card-grouped">
                  {filteredMembers.slice(0, 50).map((m: any) => (
                    <button key={m.id} onClick={() => toggleMember(m.id)} className={`list-row w-full ${form.memberIds.includes(m.id) ? "bg-accent-50" : ""}`}>
                      <div className="flex-1 text-left"><p className="text-callout font-medium">{m.name}</p><p className="text-caption text-label-tertiary" dir="ltr">{m.phone}</p></div>
                      {form.memberIds.includes(m.id) && <Check size={16} className="text-accent" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {form.title && form.message && (
            <div className="card bg-emerald-50">
              <p className="text-subhead font-semibold text-emerald-700 mb-2">Preview</p>
              <div className="bg-surface-primary rounded-apple-lg p-3">
                <p className="text-body font-semibold">{form.title}</p>
                {form.titleUrdu && <p className="text-caption text-label-tertiary font-urdu" dir="rtl">{form.titleUrdu}</p>}
                <p className="mt-2 text-callout text-label-secondary">{form.message}</p>
                {form.messageUrdu && <p className="mt-1 text-caption text-label-tertiary font-urdu" dir="rtl">{form.messageUrdu}</p>}
              </div>
            </div>
          )}

          <button onClick={createAnnouncement} disabled={creating || !form.title || !form.message}
            className="btn-primary w-full flex items-center justify-center gap-2">
            <Megaphone size={16} />
            {creating ? "Creating..." : "Create Announcement"}
          </button>
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div className="space-y-3">
          {announcements.length > 0 ? announcements.map((ann: any) => (
            <div key={ann.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-label-primary">{ann.title}</p>
                  {ann.titleUrdu && <p className="text-caption text-label-tertiary font-urdu" dir="rtl">{ann.titleUrdu}</p>}
                </div>
                <span className={`badge ${STATUS_BADGE[ann.status] || "badge-gray"}`}>{ann.status}</span>
              </div>
              <p className="text-callout text-label-secondary mb-3 line-clamp-2">{ann.message}</p>
              <div className="flex flex-wrap gap-3 text-caption text-label-tertiary mb-3">
                <span>{TARGET_LABELS[ann.targetType]}</span>
                <span>{ann.totalTarget} targets</span>
                {ann.sentCount > 0 && <span className="text-emerald-600">{ann.sentCount} sent</span>}
                {ann.failedCount > 0 && <span className="text-red-500">{ann.failedCount} failed</span>}
                <span>{new Date(ann.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex gap-2">
                {ann.status === "DRAFT" && (
                  <>
                    <button onClick={() => sendAnnouncement(ann.id)} disabled={sending === ann.id}
                      className="btn-primary flex-1 !py-2.5 text-subhead flex items-center justify-center gap-1.5 !bg-emerald-600">
                      <Send size={14} />{sending === ann.id ? "Sending..." : "Mark Sent"}
                    </button>
                    <button onClick={() => sendBulkWhatsApp(ann)}
                      className="btn-secondary flex-1 !py-2.5 text-subhead flex items-center justify-center gap-1.5">
                      <Send size={14} />WhatsApp
                    </button>
                  </>
                )}
                {ann.status === "SENT" && (
                  <button onClick={() => sendBulkWhatsApp(ann)} className="btn-secondary flex-1 !py-2.5 text-subhead">Resend</button>
                )}
                <button onClick={() => deleteAnnouncement(ann.id)}
                  className="w-10 h-10 rounded-apple-lg bg-red-50 flex items-center justify-center tap-scale">
                  <Trash2 size={15} className="text-red-400" />
                </button>
              </div>
            </div>
          )) : (
            <div className="card text-center py-16">
              <Megaphone size={40} className="text-label-quaternary mx-auto mb-3" />
              <p className="text-body font-medium text-label-secondary">No announcements yet</p>
              <p className="text-caption text-label-tertiary mt-1">Create one to reach your members</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
