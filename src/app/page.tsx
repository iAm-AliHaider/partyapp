"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage, LanguageToggle } from "@/components/LanguageContext";
import { ArrowRight, Users, MapPin, Target } from "lucide-react";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col safe-area-inset">
      <div className="safe-area-top" />

      {/* Top bar */}
      <div className="flex justify-between items-center px-6 pt-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 16px) + 8px)" }}>
        <p className="text-subhead font-semibold text-label-secondary tracking-wide">PART</p>
        <LanguageToggle className="!bg-surface-tertiary !text-label-secondary !rounded-full !px-3 !py-1.5 text-subhead" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/icons/party-logo.png"
            alt="Pakistan Awaam Raaj Tehreek"
            width={96}
            height={96}
            className="rounded-[28px] shadow-apple-lg"
            priority
          />
        </div>

        <h1 className="text-title-lg text-label-primary tracking-tight">Awaam Raaj</h1>
        <p className="text-callout text-label-tertiary mt-2 max-w-[280px] leading-relaxed">
          {t.landing.tagline}
        </p>

        {/* Stats */}
        <div className="flex gap-8 mt-10 mb-12">
          {[
            { icon: Target, value: "266", label: t.landing.naSeats },
            { icon: MapPin, value: "593", label: t.landing.paSeats },
            { icon: Users, value: "2K+", label: t.landing.members },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center mb-2">
                <stat.icon size={18} className="text-accent" />
              </div>
              <p className="text-headline text-label-primary">{stat.value}</p>
              <p className="text-caption text-label-tertiary mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="w-full max-w-[320px] space-y-3">
          <Link href="/register"
            className="flex items-center justify-center gap-2 w-full bg-accent text-white py-4 rounded-apple-xl font-semibold text-body active:opacity-70 transition-opacity shadow-apple-md">
            {t.landing.joinNow}
            <ArrowRight size={18} />
          </Link>
          <Link href="/login"
            className="block w-full bg-surface-tertiary text-label-primary py-4 rounded-apple-xl font-semibold text-body text-center active:opacity-70 transition-opacity">
            {t.landing.signIn}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center safe-area-bottom">
        <p className="text-caption text-label-quaternary">Pakistan Awaam Raaj Tehreek</p>
        <p className="text-caption text-label-quaternary mt-0.5">{t.landing.foundedBy}</p>
      </div>
    </div>
  );
}
