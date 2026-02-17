"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage, LanguageToggle } from "@/components/LanguageContext";
import { ArrowLeft, Phone, Lock } from "lucide-react";

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
    const result = await signIn("credentials", { phone: fullPhone, password, redirect: false });
    setLoading(false);
    if (result?.error) setError(t.auth.invalidCredentials);
    else router.push("/home");
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col safe-area-inset">
      {/* Top nav */}
      <div className="flex justify-between items-center px-5 pt-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 16px) + 8px)" }}>
        <Link href="/" className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center tap-scale">
          <ArrowLeft size={18} className="text-label-secondary" />
        </Link>
        <LanguageToggle className="!bg-surface-tertiary !text-label-secondary !rounded-full !px-3 !py-1.5 text-subhead" />
      </div>

      <div className="flex-1 px-6 pt-10">
        {/* Logo + Title */}
        <div className="flex items-center gap-3 mb-2">
          <Image src="/icons/party-logo.png" alt="Logo" width={44} height={44} className="rounded-apple shadow-apple" />
          <p className="text-subhead text-label-tertiary font-medium">Awaam Raaj</p>
        </div>
        <h1 className="text-title tracking-tight mb-1">{t.auth.signInTitle}</h1>
        <p className="text-callout text-label-tertiary mb-8">{t.auth.welcome}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-apple-lg text-callout font-medium">{error}</div>
          )}

          <div>
            <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.auth.phoneNumber}</label>
            <div className="flex gap-2">
              <div className="input-field w-16 flex items-center justify-center text-callout font-medium text-label-secondary">+92</div>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="3XX XXXXXXX" className="input-field flex-1" required />
            </div>
          </div>

          <div>
            <label className="text-subhead font-medium text-label-secondary mb-1.5 block">{t.auth.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.auth.enterPassword} className="input-field" required />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? t.auth.signingIn : t.auth.signInTitle}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-callout text-label-tertiary">
            {t.auth.noAccount}{" "}
            <Link href="/register" className="text-accent font-semibold">{t.auth.register}</Link>
          </p>
        </div>
      </div>

      <div className="safe-area-bottom" />
    </div>
  );
}
