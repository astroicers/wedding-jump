import { FC } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isSelected?: boolean;
  showName?: boolean;
  className?: string;
  onClick?: () => void;
}

const SIZE_CONFIG = {
  xs: 'w-6 h-6 text-[8px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-lg',
};

// 根據名字生成顏色
function getColorFromName(name: string): string {
  const colors = [
    'bg-game-red',
    'bg-game-blue',
    'bg-game-yellow',
    'bg-game-green',
    'bg-primary',
    'bg-accent-pink',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar: FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isSelected = false,
  showName = false,
  className = '',
  onClick,
}) => {
  const sizeClass = SIZE_CONFIG[size];
  const initial = name.charAt(0).toUpperCase();
  const bgColor = getColorFromName(name);

  return (
    <div
      className={`flex flex-col items-center gap-1 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div
        className={`
          ${sizeClass} rounded-full overflow-hidden flex items-center justify-center
          ${src ? '' : bgColor}
          ${isSelected ? 'ring-4 ring-primary shadow-lg scale-110' : 'ring-2 ring-white/20'}
          transition-all duration-200
        `}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-bold text-white">{initial}</span>
        )}
      </div>
      {showName && (
        <span
          className={`
            text-xs font-medium truncate max-w-[80px]
            ${isSelected ? 'text-primary font-bold' : 'text-text-secondary'}
          `}
        >
          {name}
        </span>
      )}
    </div>
  );
};
