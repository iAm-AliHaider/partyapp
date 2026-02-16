"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale, translations, TranslationKeys } from "@/lib/i18n";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
  dir: "ltr" | "rtl";
};

const LanguageContext = createContext<LanguageContextType>({
  locale: "ur",
  setLocale: () => {},
  t: translations.ur,
  dir: "rtl",
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ur");

  useEffect(() => {
    const saved = localStorage.getItem("partyapp-lang") as Locale;
    if (saved && (saved === "en" || saved === "ur")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("partyapp-lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ur" ? "rtl" : "ltr";
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ur" ? "rtl" : "ltr";
  }, [locale]);

  return (
    <LanguageContext.Provider value={{
      locale,
      setLocale,
      t: translations[locale],
      dir: locale === "ur" ? "rtl" : "ltr",
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "ur" : "en")}
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors bg-white/20 hover:bg-white/30 backdrop-blur ${className}`}
      aria-label="Toggle language"
    >
      {locale === "en" ? "اردو" : "EN"}
    </button>
  );
}
