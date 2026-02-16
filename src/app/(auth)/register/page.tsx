"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCNIC } from "@/lib/cnic-validator";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";

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

  // Load constituencies on mount
  useEffect(() => {
    fetch("/api/constituencies")
      .then((r) => r.json())
      .then((data) => setConstituencies(data.constituencies || []));
  }, []);

  // Filter constituencies by type + search
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
      <div className="bg-party-red text-white px-6 pb-8 notch-header">
        <Link href="/" className="text-sm opacity-70 mb-4 inline-block">← Back</Link>
        <div className="flex items-center gap-3 mb-2">
          <Image src="/icons/party-logo.png" alt="Logo" width={40} height={40} className="rounded-lg border border-white/20" />
          <div>
            <p className="text-xs opacity-80 font-semibold">Pakistan Awaam Raaj Tehreek</p>
            <p className="text-[10px] opacity-60 font-urdu">پاکستان عوام راج تحریک</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold">رکن بنیں — Join</h1>
        <p className="text-sm opacity-70 mt-1">Step {step} of 3</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name / پورا نام *</label>
                <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Enter your full name" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC Number / شناختی کارڈ *</label>
                <input type="text" value={form.cnic} onChange={(e) => { const raw = e.target.value.replace(/\D/g, "").slice(0, 13); updateField("cnic", raw); }} placeholder="XXXXX-XXXXXXX-X" className="input-field font-mono" maxLength={15} required />
                {form.cnic.length === 13 && <p className="text-xs text-gray-500 mt-1">{formatCNIC(form.cnic)}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone / فون نمبر *</label>
                <div className="flex gap-2">
                  <div className="input-field w-16 flex items-center justify-center text-sm font-medium bg-gray-50">+92</div>
                  <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="3XX XXXXXXX" className="input-field flex-1" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password / پاسورڈ *</label>
                <input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Create a password" className="input-field" minLength={6} required />
              </div>
              <button type="button" onClick={() => setStep(2)} className="w-full bg-party-red text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50" disabled={!form.name || !form.cnic || !form.phone || !form.password}>Next →</button>
            </>
          )}

          {/* STEP 2: Constituency Selection */}
          {step === 2 && (
            <>
              <div className="text-center mb-2">
                <p className="text-sm font-semibold text-gray-800">Select Your Constituency / اپنا حلقہ منتخب کریں *</p>
                <p className="text-xs text-gray-500 mt-1">This determines your ranking area</p>
              </div>

              {/* Type filter pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                {TYPES.map((t) => (
                  <button key={t.key} type="button" onClick={() => setConstType(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      constType === t.key ? "bg-party-red text-white" : "bg-gray-100 text-gray-600"
                    }`}>
                    {t.key} <span className="hidden sm:inline">— {t.label}</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <input
                value={constSearch}
                onChange={(e) => setConstSearch(e.target.value)}
                placeholder="🔍 Search by code or name..."
                className="input-field text-sm"
              />

              {/* Selected */}
              {selectedConst && (
                <div className="bg-party-red/5 border-2 border-party-red rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-party-red">{selectedConst.code}</p>
                    <p className="text-xs text-gray-600">{selectedConst.name}</p>
                  </div>
                  <button type="button" onClick={() => updateField("constituencyId", "")} className="text-xs text-gray-400">✕ Clear</button>
                </div>
              )}

              {/* Constituency list */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y">
                {filteredConst.length > 0 ? filteredConst.map((c) => (
                  <button key={c.id} type="button" onClick={() => updateField("constituencyId", c.id)}
                    className={`w-full text-left px-3 py-2.5 flex justify-between items-center transition-colors ${
                      form.constituencyId === c.id ? "bg-party-red/10" : "hover:bg-gray-50"
                    }`}>
                    <div>
                      <p className={`text-sm font-semibold ${form.constituencyId === c.id ? "text-party-red" : ""}`}>{c.code}</p>
                      <p className="text-xs text-gray-500">{c.name}</p>
                    </div>
                    {form.constituencyId === c.id && <span className="text-party-red text-lg">✓</span>}
                  </button>
                )) : (
                  <p className="text-center text-gray-400 text-sm py-6">No constituencies found</p>
                )}
              </div>

              <p className="text-[10px] text-gray-400 text-center">{filteredConst.length} constituencies</p>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                <button type="button" onClick={() => setStep(3)} className="w-full bg-party-red text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50 flex-1" disabled={!form.constituencyId}>Next →</button>
              </div>
            </>
          )}

          {/* STEP 3: Additional Info */}
          {step === 3 && (
            <>
              {/* Show selected constituency */}
              {selectedConst && (
                <div className="bg-party-red/5 border border-party-red/20 rounded-xl p-3 mb-2">
                  <p className="text-xs text-gray-500">Your Constituency / آپ کا حلقہ</p>
                  <p className="font-bold text-sm text-party-red">{selectedConst.code} — {selectedConst.name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age / عمر</label>
                  <input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} placeholder="Age" className="input-field" min={18} max={120} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender / جنس</label>
                  <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)} className="input-field">
                    <option value="MALE">Male / مرد</option>
                    <option value="FEMALE">Female / عورت</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Optional" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Residential Status</label>
                <select value={form.residentialStatus} onChange={(e) => updateField("residentialStatus", e.target.value)} className="input-field">
                  <option value="RESIDENT">Resident Pakistani / مقیم</option>
                  <option value="OVERSEAS">Overseas Pakistani / بیرون ملک</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code <span className="text-gray-400">(optional)</span></label>
                <input type="text" value={form.referralCode} onChange={(e) => updateField("referralCode", e.target.value.toUpperCase())} placeholder="AR-XXXXXX" className="input-field font-mono" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
                <button type="submit" disabled={loading} className="flex-1 bg-party-red text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50">{loading ? "Joining..." : "🌙 رکن بنیں"}</button>
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
