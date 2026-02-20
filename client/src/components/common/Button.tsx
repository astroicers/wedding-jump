import { FC, ButtonHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from '../../i18n';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

const VARIANT_STYLES = {
  primary: 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25',
  secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
  accent: 'bg-accent-pink hover:bg-accent-pink/90 text-white shadow-lg shadow-accent-pink/40',
  ghost: 'bg-transparent hover:bg-white/10 text-white',
  danger: 'bg-game-red hover:bg-game-red/90 text-white shadow-lg shadow-game-red/25',
};

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-base rounded-xl gap-2',
  lg: 'px-6 py-3 text-lg rounded-xl gap-2',
  xl: 'px-8 py-4 text-xl rounded-full gap-3',
};

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'right',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const { t } = useTranslation();

  return (
    <button
      className={`
        font-bold inline-flex items-center justify-center
        transition-all duration-200 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantStyle}
        ${sizeStyle}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="material-symbols-outlined animate-spin text-current">
            refresh
          </span>
          <span>{t('common.loading')}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
};
