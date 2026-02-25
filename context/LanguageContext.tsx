"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, Language, TranslationKey } from "@/lib/translations";
import { getProfile, updateProfile } from "@/lib/db";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    getProfile().then((profile) => {
      if (profile?.lang) setLangState(profile.lang as Language);
    });
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    updateProfile({ lang: l });
  };

  const t = (key: TranslationKey): string => {
    return translations[lang][key] ?? translations["en"][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
