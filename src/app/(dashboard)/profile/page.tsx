"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import MembershipCard from "@/components/MembershipCard";
import { useLanguage } from "@/components/LanguageContext";
import { LogOut, Shield, ChevronRight, Pencil, Award, Link2, Trophy, Zap, Users, Info } from "lucide-react";

function ProfileCompletion({ member }: { member: any }) {
  const fields = [
    { key: "name", filled: !!member.name },
    { key: "phone", filled: !!member.phone },
    { key: "cnic", filled: !!member.cnic },
    { key: "email", filled: !!member.email },
    { key: "gender", filled: !!member.gender },
    { key: "age", filled: !!member.age },
    { key: "districtId", filled: !!member.districtId },
    { key: "tehsilId", filled: !!member.tehsilId },
    { key: "photoUrl", filled: !!member.photoUrl },
  ];
  const filled = fields.filter(f => f.filled).length;
  const pct = Math.round((filled / fields.length) * 100);

  const r = 22;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="card flex items-center gap-4 mb-6">
      <div className="relative" style={{ width: 56, height: 56 }}>
        <svg width={56} height={56} className="-rotate-90">
          <circle cx={28} cy={28} r={r} fill="none" stroke="#F3F4F6" strokeWidth={5} />
          <circle cx={28} cy={28} r={r} fill="none" stroke={pct === 100 ? "#16A34A" : "#DC2626"} strokeWidth={5}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-subhead font-bold text-label-primary">{pct}%</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-body font-semibold text-label-primary">Profile Completion</p>
        <p className="text-caption text-label-tertiary">{filled}/{fields.length} fields completed</p>
        {pct < 100 && <p className="text-caption text-accent mt-0.5">Complete your profile for better visibility</p>}
      </div>
    </div>
  );
}

const ACHIEVEMENTS = [
  { id: "first_ref", label: "First Referral", icon: Link2, color: "text-blue-600", bg: "bg-blue-50", check: (m: any) => (m?._count?.referrals || 0) >= 1 },
  { id: "ten_refs", label: "10 Members", icon: Users, color: "text-purple-600", bg: "bg-purple-50", check: (m: any) => (m?._count?.referrals || 0) >= 10 },
  { id: "top_100", label: "Top 100", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50", check: (m: any) => m?.rank && m.rank <= 100 },
  { id: "scorer", label: "50+ Points", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50", check: (m: any) => (m?.score || 0) >= 50 },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [member, setMember] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", age: "", gender: "", religion: "" });

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetch("/api/members/me").then((r) => r.json()).then((data) => {
        setMember(data);
        setForm({ name: data.name || "", email: data.email || "", age: data.age?.toString() || "", gender: data.gender || "", religion: data.religion || "" });
      });
    }
  }, [status, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/members/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        const updated = await fetch("/api/members/me").then((r) => r.json());
        setMember(updated);
        setEditing(false);
      }
    } finally { setSaving(false); }
  };

  const formatCNIC = (cnic: string) => {
    if (!cnic || cnic.length !== 13) return cnic;
    return `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
  };

  if (!member) return <div className="px-5 py-4"><div className="space-y-4 pt-8"><div className="skeleton h-44 rounded-apple-xl" /><div className="skeleton h-48 rounded-apple-lg" /></div></div>;

  const memberLocation = [member.tehsil?.name, member.district?.name, member.province?.name].filter(Boolean).join(", ") || undefined;
  const earned = ACHIEVEMENTS.filter(a => a.check(member));

  const infoRows = [
    { label: t.profile.name, value: member.name },
    { label: t.profile.cnic, value: formatCNIC(member.cnic), mono: true },
    { label: t.profile.phone, value: member.phone, mono: true },
    { label: t.profile.email, value: member.email || "—" },
    { label: t.profile.gender, value: member.gender || "—" },
    { label: t.profile.district, value: member.district?.name || "—" },
    { label: t.profile.status, value: member.status, badge: member.status === "ACTIVE" ? "badge-green" : "badge-yellow" },
    { label: t.profile.joined, value: new Date(member.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="px-5 py-4">
      <div className="mb-6">
        <MembershipCard name={member.name} membershipNumber={member.membershipNumber || "—"} partyName={member.party?.name || "Awaam Raaj"} location={memberLocation} referralCode={member.referralCode} score={member.score} joinDate={member.createdAt} />
      </div>

      {/* Profile Completion */}
      <ProfileCompletion member={member} />

      {/* Achievements */}
      {earned.length > 0 && (
        <>
          <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-3">{(t.profile as any).achievements || "Achievements"}</p>
          <div className="flex gap-3 overflow-x-auto pb-3 mb-6 -mx-5 px-5">
            {earned.map(a => (
              <div key={a.id} className="flex flex-col items-center gap-1.5 min-w-[64px]">
                <div className={`w-12 h-12 rounded-full ${a.bg} flex items-center justify-center shadow-apple`}>
                  <a.icon size={20} className={a.color} />
                </div>
                <span className="text-caption text-label-primary font-medium text-center leading-tight">{a.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Personal Info */}
      <p className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-3">{t.profile.personalInfo}</p>

      {editing ? (
        <div className="card space-y-4 mb-6">
          <div>
            <label className="text-caption text-label-secondary mb-1 block">{t.profile.name}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-caption text-label-secondary mb-1 block">{t.profile.email}</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-caption text-label-secondary mb-1 block">{t.register.age}</label>
              <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-caption text-label-secondary mb-1 block">{t.profile.gender}</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field">
                <option value="">—</option>
                <option value="MALE">{t.register.male}</option>
                <option value="FEMALE">{t.register.female}</option>
                <option value="OTHER">{t.register.other}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="btn-secondary flex-1">{t.cancel}</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? t.profile.saving : t.save}</button>
          </div>
        </div>
      ) : (
        <div className="card-grouped mb-6">
          {infoRows.map((row, i) => (
            <div key={i} className="card-row">
              <span className="text-body text-label-secondary">{row.label}</span>
              {row.badge ? (
                <span className={`badge ${row.badge}`}>{row.value}</span>
              ) : (
                <span className={`text-body font-medium text-label-primary ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="card-grouped mb-6">
        {!editing && (
          <button onClick={() => setEditing(true)} className="list-row w-full tap-scale">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Pencil size={15} className="text-blue-600" />
            </div>
            <span className="flex-1 text-body font-medium text-label-primary text-left">{t.profile.editProfile}</span>
            <ChevronRight size={16} className="text-label-quaternary" />
          </button>
        )}
        {(member.role === "ADMIN" || member.role === "OWNER") && (
          <button onClick={() => router.push("/admin")} className="list-row w-full tap-scale">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Shield size={15} className="text-purple-600" />
            </div>
            <span className="flex-1 text-body font-medium text-label-primary text-left">{t.profile.adminPanel}</span>
            <ChevronRight size={16} className="text-label-quaternary" />
          </button>
        )}
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="list-row w-full tap-scale">
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
            <LogOut size={15} className="text-red-500" />
          </div>
          <span className="flex-1 text-body font-medium text-red-500 text-left">{t.profile.signOut}</span>
        </button>
      </div>

      {/* App version */}
      <div className="text-center py-4">
        <p className="text-caption text-label-quaternary">PartyApp v1.0.0</p>
        <p className="text-caption text-label-quaternary">Awaam Raaj Tehreek</p>
      </div>
    </div>
  );
}
