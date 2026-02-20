import { useLanguageStore } from '../stores/languageStore';
import { en } from './en';
import { zh } from './zh';
import type { Translations } from './types';

const translations: Record<string, Translations> = { en, zh };

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const dict = translations[language];

  function t(key: keyof Translations, params?: Record<string, string | number>): string {
    let text: string = dict[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }

  return { t, language };
}
