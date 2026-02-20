import { FC } from 'react';
import { useLanguageStore } from '../../stores/languageStore';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguageStore();

  return (
    <button
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors ${className}`}
      aria-label="Toggle language"
    >
      <span className={language === 'zh' ? 'text-primary' : 'opacity-50'}>ZH</span>
      <span className="opacity-30">|</span>
      <span className={language === 'en' ? 'text-primary' : 'opacity-50'}>EN</span>
    </button>
  );
};
