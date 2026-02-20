import { FC } from 'react';
import { useTranslation } from '../../i18n';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'accent' | 'success';
  className?: string;
}

const SIZE_CONFIG = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const COLOR_CONFIG = {
  primary: 'bg-primary shadow-[0_0_10px_#f48c25]',
  accent: 'bg-accent-pink shadow-[0_0_10px_#ff4d94]',
  success: 'bg-game-green shadow-[0_0_10px_#2ecc71]',
};

export const ProgressBar: FC<ProgressBarProps> = ({
  current,
  total,
  showLabel = false,
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const sizeClass = SIZE_CONFIG[size];
  const colorClass = COLOR_CONFIG[color];
  const { t } = useTranslation();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-white/10 rounded-full overflow-hidden ${sizeClass}`}>
        <div
          className={`${sizeClass} rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest whitespace-nowrap">
          {t('common.percentComplete', { n: Math.round(percentage) })}
        </span>
      )}
    </div>
  );
};
