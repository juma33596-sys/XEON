import React, { createContext, useContext, useState, useEffect } from 'react';
import { en, TranslationKey } from '../i18n/en';
import { sw } from '../i18n/sw';

export type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexora_lang') as Language;
      if (saved === 'en' || saved === 'sw') return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexora_lang', lang);
    }
  };

  const t = (key: TranslationKey): string => {
    const dict = language === 'sw' ? sw : en;
    return dict[key] || en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Resilient fallback preventing app-crashing throws during transitions or isolated renders
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: TranslationKey): string => en[key] || key,
    };
  }
  return context;
};
