"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import MembershipCard from "@/components/MembershipCard";
import { useLanguage } from "@/components/LanguageContext";

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
        setForm({
          name: data.name || "",
          email: data.email || "",
          age: data.age?.toString() || "",
          gender: data.gender || "",
          religion: data.religion || "",
        });
      });
    }
  }, [status, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/members/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await fetch("/api/members/me").then((r) => r.json());
        setMember(updated);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const formatCNIC = (cnic: string) => {
    if (!cnic || cnic.length !== 13) return cnic;
    return `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
  };

  if (!member) {
    return <div className="page-container"><div className="animate-pulse space-y-4"><div className="h-48 bg-gray-200 rounded-2xl" /><div className="h-32 bg-gray-200 rounded-xl" /></div></div>;
  }

  const memberLocation = [member.tehsil?.name, member.district?.name, member.province?.name].filter(Boolean).join(", ") || undefined;

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold mb-6">{t.profile.title}</h1>

      <div className="mb-6">
        <MembershipCard
          name={member.name}
          membershipNumber={member.membershipNumber || "—"}
          partyName={member.party?.name || "Awaam Raaj"}
          location={memberLocation}
          referralCode={member.referralCode}
          score={member.score}
          joinDate={new Date(member.createdAt).getFullYear().toString()}
        />
      </div>

      <h2 className="section-title">{t.profile.personalInfo}</h2>
      <div className="card space-y-4 mb-6">
        {editing ? (
          <>
            <div>
              <label className="text-xs text-gray-500">{t.profile.name}</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t.profile.email}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">{t.register.age}</label>
                <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="input-field mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500">{t.profile.gender}</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field mt-1">
                  <option value="">—</option>
                  <option value="MALE">{t.register.male}</option>
                  <option value="FEMALE">{t.register.female}</option>
                  <option value="OTHER">{t.register.other}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1 text-sm">{t.cancel}</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">{saving ? t.profile.saving : t.save}</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between"><span className="text-sm text-gray-500">{t.profile.name}</span><span className="text-sm font-medium">{member.name}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">{t.profile.cnic}</span><span className="text-sm font-mono">{formatCNIC(member.cnic)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">{t.profile.phone}</span><span className="text-sm font-mono">{member.phone}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">{t.profile.email}</span><span className="text-sm">{member.email || "—"}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">{t.profile.gender}</span><span className="text-sm">{member.gender || "—"}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">{t.profile.district}</span><span className="text-sm font-medium">{member.district?.name || "—"}</span></div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t.profile.status}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${member.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{member.status}</span>
            </div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">{t.profile.joined}</span><span className="text-sm">{new Date(member.createdAt).toLocaleDateString()}</span></div>
          </>
        )}
      </div>

      <div className="space-y-3">
        {!editing && <button onClick={() => setEditing(true)} className="btn-secondary w-full text-sm">{t.profile.editProfile}</button>}
        {(member.role === "ADMIN" || member.role === "OWNER") && (
          <button onClick={() => router.push("/admin")} className="btn-secondary w-full text-sm">{t.profile.adminPanel}</button>
        )}
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full py-3 text-sm text-red-600 font-medium">{t.profile.signOut}</button>
      </div>
    </div>
  );
}
