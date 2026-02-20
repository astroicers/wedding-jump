import { FC } from 'react';
import { useTranslation } from '../../i18n';

interface TimerProps {
  seconds: number;
  maxSeconds: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const SIZE_CONFIG = {
  sm: { container: 'w-12 h-12', text: 'text-sm', stroke: 3 },
  md: { container: 'w-16 h-16', text: 'text-lg', stroke: 4 },
  lg: { container: 'w-24 h-24', text: 'text-2xl', stroke: 6 },
  xl: { container: 'w-32 h-32', text: 'text-4xl', stroke: 8 },
};

export const Timer: FC<TimerProps> = ({
  seconds,
  maxSeconds,
  size = 'md',
  showLabel = false,
}) => {
  const { t } = useTranslation();
  const config = SIZE_CONFIG[size];
  const progress = maxSeconds > 0 ? (seconds / maxSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference * (1 - progress / 100);

  // 根據剩餘時間決定顏色
  const getColor = () => {
    if (seconds <= 5) return 'text-game-red';
    if (seconds <= 10) return 'text-game-yellow';
    return 'text-primary';
  };

  return (
    <div className={`relative flex items-center justify-center ${config.container}`}>
      <svg className="w-full h-full -rotate-90">
        {/* 背景圓環 */}
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="transparent"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-white/10"
        />
        {/* 進度圓環 */}
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="transparent"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${getColor()} transition-all duration-300`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${config.text} ${getColor()}`}>{seconds}</span>
        {showLabel && (
          <span className="text-[10px] uppercase tracking-widest opacity-60">
            {t('common.seconds')}
          </span>
        )}
      </div>
    </div>
  );
};
