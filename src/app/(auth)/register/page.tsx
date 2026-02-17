"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCNIC } from "@/lib/cnic-validator";
import { useLanguage, LanguageToggle } from "@/components/LanguageContext";
import { ArrowLeft, Check, Search, X, ChevronRight, Shield, Eye, EyeOff, Users } from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 4);
  }, [password]);

  if (!password) return null;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-400"];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength ? colors[strength - 1] : "bg-surface-tertiary"}`} />
        ))}
      </div>
      <p className={`text-caption mt-1 ${strength <= 1 ? "text-red-500" : strength <= 2 ? "text-amber-600" : "text-emerald-600"}`}>
        {labels[strength - 1] || "Too short"}
      </p>
    </div>
  );
}

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isComplete = step < currentStep;
        const isCurrent = step === currentStep;
        return (
          <div key={step} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isComplete ? "bg-emerald-500 text-white" :
              isCurrent ? "bg-accent text-white shadow-apple" :
              "bg-surface-tertiary text-label-tertiary"
            }`}>
              {isComplete ? <Check size={14} strokeWidth={3} /> : <span className="text-subhead font-semibold">{step}</span>}
            </div>
            {step < totalSteps && (
              <div className={`w-8 h-0.5 rounded-full transition-all ${step < currentStep ? "bg-emerald-400" : "bg-surface-tertiary"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [tehsils, setTehsils] = useState<any[]>([]);
  const [districtSearch, setDistrictSearch] = useState("");

  const [form, setForm] = useState({
    name: "", phone: "", password: "", cnic: "", age: "",
    gender: "MALE", religion: "Islam", email: "",
    residentialStatus: "RESIDENT", country: "Pakistan",
    referralCode: refCode, provinceId: "", districtId: "", tehsilId: "",
  });

  useEffect(() => { fetch("/api/provinces").then((r) => r.json()).then((data) => setProvinces(data.provinces || [])); }, []);
  useEffect(() => {
    if (!form.provinceId) { setDistricts([]); return; }
    fetch(`/api/districts?provinceId=${form.provinceId}`).then((r) => r.json()).then((data) => setDistricts(data.districts || []));
    setForm(prev => ({ ...prev, districtId: "", tehsilId: "" })); setTehsils([]);
  }, [form.provinceId]);
  useEffect(() => {
    if (!form.districtId) { setTehsils([]); return; }
    fetch(`/api/tehsils?districtId=${form.districtId}`).then((r) => r.json()).then((data) => setTehsils(data.tehsils || []));
    setForm(prev => ({ ...prev, tehsilId: "" }));
  }, [form.districtId]);

  const filteredDistricts = districtSearch ? districts.filter(d => d.name.toLowerCase().includes(districtSearch.toLowerCase())) : districts;
  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  const selectedProvince = provinces.find(p => p.id === form.provinceId);
  const selectedDistrict = districts.find(d => d.id === form.districtId);
  const selectedTehsil = tehsils.find(t => t.id === form.tehsilId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const fullPhone = form.phone.startsWith("+92") ? form.phone : `+92${form.phone.replace(/^0/, "")}`;
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, phone: fullPhone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/login?registered=true");
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col safe-area-inset">
      {/* Gradient accent strip */}
      <div className="h-1.5 bg-gradient-to-r from-accent via-accent/80 to-gold" />

      {/* Top nav */}
      <div className="flex justify-between items-center px-5 pt-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 16px) + 8px)" }}>
        <Link href="/" className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale">
          <ArrowLeft size={18} className="text-label-secondary" />
        </Link>
        <LanguageToggle className="!bg-surface-tertiary !text-label-secondary !rounded-full !px-3 !py-1.5 text-subhead" />
      </div>

      <div className="flex-1 px-6 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Image src="/icons/party-logo.png" alt="Logo" width={44} height={44} className="rounded-apple shadow-apple" />
          <p className="text-subhead text-label-tertiary font-medium">Awaam Raaj</p>
        </div>
        <h1 className="text-title tracking-tight mb-4">{t.auth.joinTitle}</h1>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} totalSteps={3} />

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-apple-lg text-callout font-medium mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <div>
                <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.register.fullName} *</label>
                <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder={t.register.enterName} className="input-field" required />
              </div>
              <div>
                <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.register.cnic} *</label>
                <div className="relative">
                  <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
                  <input type="text" value={form.cnic} onChange={(e) => { const raw = e.target.value.replace(/\D/g, "").slice(0, 13); updateField("cnic", raw); }} placeholder="XXXXX-XXXXXXX-X" className="input-field font-mono !pl-10" dir="ltr" maxLength={15} required />
                </div>
                {form.cnic.length === 13 && <p className="text-caption text-label-tertiary mt-1" dir="ltr">{formatCNIC(form.cnic)}</p>}
              </div>
              <div>
                <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.register.phone} *</label>
                <div className="flex gap-2">
                  <div className="input-field w-16 flex items-center justify-center text-callout font-medium text-label-secondary" dir="ltr">+92</div>
                  <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="3XX XXXXXXX" className="input-field flex-1" dir="ltr" required />
                </div>
              </div>
              <div>
                <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.auth.password} *</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder={t.register.createPassword} className="input-field !pr-12" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-label-tertiary">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>
              <button type="button" onClick={() => setStep(2)} className="btn-primary w-full" disabled={!form.name || !form.cnic || !form.phone || !form.password}>
                {t.register.next}
              </button>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <p className="text-headline text-label-primary text-center">{t.register.selectLocation || "Select Your Location"}</p>
              <p className="text-caption text-label-tertiary text-center mb-2">{t.register.locationHelp || "Choose your province, district, and tehsil"}</p>

              {/* Province */}
              <div>
                <label className="text-subhead font-medium text-label-secondary mb-2 block">{t.register.province || "Province"} *</label>
                <div className="grid grid-cols-2 gap-2">
                  {provinces.map((p) => (
                    <button key={p.id} type="button" onClick={() => updateField("provinceId", p.id)}
                      className={`px-3 py-3 rounded-apple-lg text-callout font-medium transition-all text-left tap-scale relative overflow-hidden ${
                        form.provinceId === p.id ? "bg-accent text-white shadow-apple" : "bg-surface-primary text-label-primary shadow-apple"
                      }`}>
                      {p.name}
                      {p.nameUrdu && <span className="block text-caption opacity-70 font-urdu mt-0.5">{p.nameUrdu}</span>}
                      {p._count?.members > 0 && (
                        <span className={`absolute top-2 right-2 text-caption font-semibold flex items-center gap-0.5 ${
                          form.provinceId === p.id ? "text-white/80" : "text-label-quaternary"
                        }`}>
                          <Users size={9} />{p._count.members}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* District */}
              {form.provinceId && (
                <div>
                  <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.register.district || "District"} *</label>
                  <div className="relative mb-2">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
                    <input value={districtSearch} onChange={(e) => setDistrictSearch(e.target.value)} placeholder={t.register.searchDistrict || "Search district..."} className="input-field !pl-10" />
                  </div>

                  {selectedDistrict && (
                    <div className="bg-accent-50 rounded-apple-lg p-3 flex justify-between items-center mb-2">
                      <div>
                        <p className="text-body font-semibold text-accent">{selectedDistrict.name}</p>
                        {selectedDistrict.nameUrdu && <p className="text-caption text-label-tertiary font-urdu">{selectedDistrict.nameUrdu}</p>}
                      </div>
                      <button type="button" onClick={() => updateField("districtId", "")} className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center"><X size={14} className="text-accent" /></button>
                    </div>
                  )}

                  <div className="max-h-40 overflow-y-auto rounded-apple-lg bg-surface-primary shadow-apple">
                    {filteredDistricts.length > 0 ? filteredDistricts.map((d) => (
                      <button key={d.id} type="button" onClick={() => updateField("districtId", d.id)}
                        className={`w-full text-left px-4 py-3 flex justify-between items-center border-b border-separator last:border-0 transition-colors ${
                          form.districtId === d.id ? "bg-accent-50" : ""
                        }`}>
                        <div>
                          <p className={`text-body font-medium ${form.districtId === d.id ? "text-accent" : "text-label-primary"}`}>{d.name}</p>
                          {d._count?.tehsils > 0 && <p className="text-caption text-label-tertiary">{d._count.tehsils} tehsils</p>}
                        </div>
                        {form.districtId === d.id && <Check size={16} className="text-accent" />}
                      </button>
                    )) : <p className="text-center text-label-tertiary text-callout py-6">{t.noResults || "No results"}</p>}
                  </div>
                  <p className="text-caption text-label-quaternary text-center mt-1.5">{filteredDistricts.length} {t.register.districts || "districts"}</p>
                </div>
              )}

              {/* Tehsil */}
              {form.districtId && tehsils.length > 0 && (
                <div>
                  <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.register.tehsil || "Tehsil"}</label>
                  <select value={form.tehsilId} onChange={(e) => updateField("tehsilId", e.target.value)} className="input-field">
                    <option value="">{t.register.selectTehsil || "Select tehsil (optional)"}</option>
                    {tehsils.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">{t.back}</button>
                <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1" disabled={!form.districtId}>{t.register.next}</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              {selectedDistrict && (
                <div className="bg-accent-50 rounded-apple-lg p-3 mb-2">
                  <p className="text-caption text-label-tertiary">{t.register.location || "Location"}</p>
                  <p className="text-body font-semibold text-accent">
                    {selectedDistrict.name}{selectedTehsil ? ` / ${selectedTehsil.name}` : ""}, {selectedProvince?.name}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.register.age}</label>
                  <input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} placeholder={t.register.age} className="input-field" dir="ltr" min={18} max={120} />
                </div>
                <div>
                  <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.register.gender}</label>
                  <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)} className="input-field">
                    <option value="MALE">{t.register.male}</option>
                    <option value="FEMALE">{t.register.female}</option>
                    <option value="OTHER">{t.register.other}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.register.email}</label>
                <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder={t.register.optional} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.register.residentialStatus}</label>
                <select value={form.residentialStatus} onChange={(e) => updateField("residentialStatus", e.target.value)} className="input-field">
                  <option value="RESIDENT">{t.register.resident}</option>
                  <option value="OVERSEAS">{t.register.overseas}</option>
                </select>
              </div>
              <div>
                <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.register.referralCode} <span className="text-label-quaternary">({t.register.optional})</span></label>
                <input type="text" value={form.referralCode} onChange={(e) => updateField("referralCode", e.target.value.toUpperCase())} placeholder="AR-XXXXXX" className="input-field font-mono" dir="ltr" />
              </div>

              {/* Terms & Conditions */}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-apple-lg bg-surface-primary shadow-apple">
                <div
                  onClick={(e) => { e.preventDefault(); setAgreedTerms(!agreedTerms); }}
                  className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    agreedTerms ? "bg-accent" : "bg-surface-tertiary border border-label-quaternary"
                  }`}
                >
                  {agreedTerms && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-subhead text-label-secondary leading-relaxed">
                  {(t.register as any).agreeTerms || "I agree to the Terms of Service and Privacy Policy of Awaam Raaj Tehreek"}
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">{t.back}</button>
                <button type="submit" disabled={loading || !agreedTerms} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {loading ? t.register.joining : t.register.joinParty}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      <div className="safe-area-bottom" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-secondary flex items-center justify-center"><div className="skeleton h-8 w-32 rounded-apple" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
