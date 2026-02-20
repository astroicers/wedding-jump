import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Language } from '../i18n/types';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'zh',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => set({ language: get().language === 'zh' ? 'en' : 'zh' }),
    }),
    {
      name: 'wedding-jump-language',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
