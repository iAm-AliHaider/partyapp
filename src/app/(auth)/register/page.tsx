"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCNIC } from "@/lib/cnic-validator";
import { useLanguage, LanguageToggle } from "@/components/LanguageContext";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Constituency data
  const [constituencies, setConstituencies] = useState<any[]>([]);
  const [constType, setConstType] = useState("NA");
  const [constSearch, setConstSearch] = useState("");
  const [filteredConst, setFilteredConst] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "", phone: "", password: "", cnic: "", age: "",
    gender: "MALE", religion: "Islam", email: "",
    residentialStatus: "RESIDENT", country: "Pakistan",
    referralCode: refCode, constituencyId: "",
  });

  useEffect(() => {
    fetch("/api/constituencies")
      .then((r) => r.json())
      .then((data) => setConstituencies(data.constituencies || []));
  }, []);

  useEffect(() => {
    let result = constituencies.filter((c) => c.type === constType);
    if (constSearch) {
      const q = constSearch.toLowerCase();
      result = result.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }
    setFilteredConst(result);
  }, [constType, constSearch, constituencies]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedConst = constituencies.find((c) => c.id === form.constituencyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fullPhone = form.phone.startsWith("+92") ? form.phone : `+92${form.phone.replace(/^0/, "")}`;
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const TYPES = [
    { key: "NA", label: "National Assembly" },
    { key: "PP", label: "Punjab" },
    { key: "PS", label: "Sindh" },
    { key: "PK", label: "KPK" },
    { key: "PB", label: "Balochistan" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-party-red text-white px-6 pb-8 notch-header relative">
        <div className="flex justify-between items-start">
          <Link href="/" className="text-sm opacity-70 mb-4 inline-block">{t.back}</Link>
          <LanguageToggle />
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Image src="/icons/party-logo.png" alt="Logo" width={40} height={40} className="rounded-lg border border-white/20" />
          <div>
            <p className="text-xs opacity-80 font-semibold">Pakistan Awaam Raaj Tehreek</p>
            <p className="text-[10px] opacity-60 font-urdu">پاکستان عوام راج تحریک</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold">{t.auth.joinTitle}</h1>
        <p className="text-sm opacity-70 mt-1">{t.auth.step} {step} {t.auth.of} 3</p>
        <div className="mt-3 h-1 bg-white/20 rounded-full">
          <div className="h-full bg-party-gold rounded-full transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.fullName} *</label>
                <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder={t.register.enterName} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.cnic} *</label>
                <input type="text" value={form.cnic} onChange={(e) => { const raw = e.target.value.replace(/\D/g, "").slice(0, 13); updateField("cnic", raw); }} placeholder="XXXXX-XXXXXXX-X" className="input-field font-mono" dir="ltr" maxLength={15} required />
                {form.cnic.length === 13 && <p className="text-xs text-gray-500 mt-1" dir="ltr">{formatCNIC(form.cnic)}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.phone} *</label>
                <div className="flex gap-2">
                  <div className="input-field w-16 flex items-center justify-center text-sm font-medium bg-gray-50" dir="ltr">+92</div>
                  <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="3XX XXXXXXX" className="input-field flex-1" dir="ltr" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password} *</label>
                <input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder={t.register.createPassword} className="input-field" required />
              </div>
              <button type="button" onClick={() => setStep(2)} className="w-full bg-party-red text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50" disabled={!form.name || !form.cnic || !form.phone || !form.password}>{t.register.next}</button>
            </>
          )}

          {/* STEP 2: Constituency Selection */}
          {step === 2 && (
            <>
              <div className="text-center mb-2">
                <p className="text-sm font-semibold text-gray-800">{t.register.selectConstituency} *</p>
                <p className="text-xs text-gray-500 mt-1">{t.register.constituencyHelp}</p>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                {TYPES.map((tp) => (
                  <button key={tp.key} type="button" onClick={() => setConstType(tp.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      constType === tp.key ? "bg-party-red text-white" : "bg-gray-100 text-gray-600"
                    }`}>
                    {tp.key} <span className="hidden sm:inline">— {tp.label}</span>
                  </button>
                ))}
              </div>

              <input value={constSearch} onChange={(e) => setConstSearch(e.target.value)} placeholder={t.register.searchPlaceholder} className="input-field text-sm" />

              {selectedConst && (
                <div className="bg-party-red/5 border-2 border-party-red rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-party-red" dir="ltr">{selectedConst.code}</p>
                    <p className="text-xs text-gray-600">{selectedConst.name}</p>
                  </div>
                  <button type="button" onClick={() => updateField("constituencyId", "")} className="text-xs text-gray-400">{t.register.clear}</button>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y">
                {filteredConst.length > 0 ? filteredConst.map((c) => (
                  <button key={c.id} type="button" onClick={() => updateField("constituencyId", c.id)}
                    className={`w-full text-left px-3 py-2.5 flex justify-between items-center transition-colors ${
                      form.constituencyId === c.id ? "bg-party-red/10" : "hover:bg-gray-50"
                    }`}>
                    <div>
                      <p className={`text-sm font-semibold ${form.constituencyId === c.id ? "text-party-red" : ""}`} dir="ltr">{c.code}</p>
                      <p className="text-xs text-gray-500">{c.name}</p>
                    </div>
                    {form.constituencyId === c.id && <span className="text-party-red text-lg">✓</span>}
                  </button>
                )) : (
                  <p className="text-center text-gray-400 text-sm py-6">{t.noResults}</p>
                )}
              </div>

              <p className="text-[10px] text-gray-400 text-center">{filteredConst.length} {t.register.constituencies}</p>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">{t.back}</button>
                <button type="button" onClick={() => setStep(3)} className="w-full bg-party-red text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50 flex-1" disabled={!form.constituencyId}>{t.register.next}</button>
              </div>
            </>
          )}

          {/* STEP 3: Additional Info */}
          {step === 3 && (
            <>
              {selectedConst && (
                <div className="bg-party-red/5 border border-party-red/20 rounded-xl p-3 mb-2">
                  <p className="text-xs text-gray-500">{t.profile.constituency}</p>
                  <p className="font-bold text-sm text-party-red" dir="ltr">{selectedConst.code} — {selectedConst.name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.age}</label>
                  <input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} placeholder={t.register.age} className="input-field" dir="ltr" min={18} max={120} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.gender}</label>
                  <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)} className="input-field">
                    <option value="MALE">{t.register.male}</option>
                    <option value="FEMALE">{t.register.female}</option>
                    <option value="OTHER">{t.register.other}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.email}</label>
                <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder={t.register.optional} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.residentialStatus}</label>
                <select value={form.residentialStatus} onChange={(e) => updateField("residentialStatus", e.target.value)} className="input-field">
                  <option value="RESIDENT">{t.register.resident}</option>
                  <option value="OVERSEAS">{t.register.overseas}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.referralCode} <span className="text-gray-400">({t.register.optional})</span></label>
                <input type="text" value={form.referralCode} onChange={(e) => updateField("referralCode", e.target.value.toUpperCase())} placeholder="AR-XXXXXX" className="input-field font-mono" dir="ltr" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">{t.back}</button>
                <button type="submit" disabled={loading} className="flex-1 bg-party-red text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50">{loading ? t.register.joining : t.register.joinParty}</button>
              </div>
            </>
          )}
        </form>
      </div>

      <div className="safe-area-bottom" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
