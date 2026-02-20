import { FC, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, LanguageToggle } from '../components/common';
import { useTranslation } from '../i18n';
import { clearGameSession } from '../utils/session';

export const Home: FC = () => {
  const { t } = useTranslation();

  // Clear any stale session data when returning to home
  useEffect(() => {
    clearGameSession();
  }, []);

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      <LanguageToggle className="absolute top-4 right-4 z-10" />

      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-accent-pink/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* 主要內容 */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        {/* Logo 和標題 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl shadow-lg shadow-primary/30 mb-6">
            <span className="material-symbols-outlined text-white text-4xl filled">
              favorite
            </span>
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Wedding Jump
          </h1>
          <p className="text-text-secondary">
            {t('home.subtitle')}
          </p>
        </div>

        {/* 行動按鈕 */}
        <div className="w-full space-y-4">
          <Link to="/join" className="block">
            <Button
              variant="accent"
              size="xl"
              fullWidth
              icon={<span className="material-symbols-outlined">celebration</span>}
            >
              {t('home.joinGame')}
            </Button>
          </Link>

          <Link to="/host" className="block">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<span className="material-symbols-outlined">smart_display</span>}
            >
              {t('home.hostGame')}
            </Button>
          </Link>
        </div>

        {/* 說明文字 */}
        <div className="mt-12 text-center">
          <p className="text-sm text-text-muted">
            {t('home.helpText')}
          </p>
        </div>
      </div>

      {/* 頁尾裝飾 */}
      <div className="relative pb-8 flex justify-center gap-8 opacity-20">
        <span className="material-symbols-outlined text-6xl text-primary">favorite</span>
        <span className="material-symbols-outlined text-6xl text-primary">celebration</span>
        <span className="material-symbols-outlined text-6xl text-primary">diamond</span>
      </div>
    </div>
  );
};
