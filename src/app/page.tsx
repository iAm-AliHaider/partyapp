"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage, LanguageToggle } from "@/components/LanguageContext";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-party-red to-party-red-dark flex flex-col safe-area-inset">
      <div className="safe-area-top bg-transparent" />

      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-10" style={{ top: "env(safe-area-inset-top, 16px)" }}>
        <LanguageToggle className="text-white" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-white">
        {/* Party Logo */}
        <div className="mb-4">
          <Image
            src="/icons/party-logo.png"
            alt="Pakistan Awaam Raaj Tehreek"
            width={120}
            height={120}
            className="rounded-2xl shadow-2xl border-4 border-white/20"
            priority
          />
        </div>

        <h1 className="text-3xl font-bold tracking-tight">عوام راج</h1>
        <h2 className="text-lg font-semibold opacity-95 mt-1">Pakistan Awaam Raaj Tehreek</h2>
        <p className="text-sm font-urdu opacity-80 mt-0.5">پاکستان عوام راج تحریک</p>
        <p className="text-xs opacity-60 max-w-xs mt-2 mb-8">
          {t.landing.tagline}
        </p>

        {/* Stats */}
        <div className="flex gap-6 mb-10">
          <div>
            <p className="text-2xl font-bold text-party-gold">266</p>
            <p className="text-xs opacity-70">{t.landing.naSeats}</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-2xl font-bold text-party-gold">593</p>
            <p className="text-xs opacity-70">{t.landing.paSeats}</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-2xl font-bold text-party-gold">∞</p>
            <p className="text-xs opacity-70">{t.landing.members}</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="w-full max-w-xs space-y-3">
          <Link
            href="/register"
            className="block w-full bg-party-gold text-party-red-dark py-3.5 rounded-xl font-bold text-center active:scale-95 transition-transform shadow-lg"
          >
            {t.landing.joinNow}
          </Link>
          <Link
            href="/login"
            className="block w-full border-2 border-white/30 text-white py-3.5 rounded-xl font-semibold text-center active:scale-95 transition-transform"
          >
            {t.landing.signIn}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center safe-area-bottom">
        <p className="text-white/50 text-xs">Pakistan Awaam Raaj Tehreek</p>
        <p className="text-white/30 text-[10px] mt-0.5">{t.landing.foundedBy}</p>
      </div>
    </div>
  );
}
