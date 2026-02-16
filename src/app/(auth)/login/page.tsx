"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage, LanguageToggle } from "@/components/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fullPhone = phone.startsWith("+92") ? phone : `+92${phone.replace(/^0/, "")}`;

    const result = await signIn("credentials", {
      phone: fullPhone,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t.auth.invalidCredentials);
    } else {
      router.push("/home");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with party branding */}
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
        <h1 className="text-2xl font-bold">{t.auth.signInTitle}</h1>
        <p className="text-sm opacity-70 mt-1">{t.auth.welcome}</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.phoneNumber}</label>
            <div className="flex gap-2">
              <div className="input-field w-16 flex items-center justify-center text-sm font-medium bg-gray-50">+92</div>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="3XX XXXXXXX" className="input-field flex-1" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.auth.enterPassword} className="input-field" required />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-party-red text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50">
            {loading ? t.auth.signingIn : t.auth.signInTitle}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {t.auth.noAccount}{" "}
            <Link href="/register" className="text-party-red font-semibold">{t.auth.register}</Link>
          </p>
        </div>
      </div>

      <div className="safe-area-bottom" />
    </div>
  );
}
