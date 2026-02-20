import { FC } from 'react';
import { useTranslation } from '../../i18n';

interface PlayerCounterProps {
  count: number;
  maxCount?: number;
  className?: string;
}

export const PlayerCounter: FC<PlayerCounterProps> = ({
  count,
  maxCount,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="bg-primary/20 p-3 rounded-xl">
        <span className="material-symbols-outlined text-primary text-2xl">groups</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-widest text-text-muted font-bold">
          {t('common.playersOnline')}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-text-primary">{count}</span>
          {maxCount && (
            <span className="text-sm text-text-muted">/ {maxCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};
