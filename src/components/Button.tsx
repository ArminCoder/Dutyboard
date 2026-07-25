import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brass';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium transition select-none disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-navy-900 text-paper-50 hover:bg-navy-800 border border-navy-900',
  secondary: 'bg-paper-0 text-navy-900 border border-navy-700 hover:bg-paper-100',
  ghost: 'bg-transparent text-ink-700 hover:bg-paper-100 border border-transparent',
  danger: 'bg-paper-0 text-signal-alarm border border-signal-alarm hover:bg-signal-alarm-soft',
  brass: 'bg-brass-500 text-paper-0 border border-brass-600 hover:bg-brass-600',
};

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-3.5 py-2',
  lg: 'text-sm px-5 py-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  children,
  className = '',
  ...rest
}: Props) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...rest}>
      {icon ? <span className="flex-none">{icon}</span> : null}
      {children ? <span>{children}</span> : null}
      {iconRight ? <span className="flex-none">{iconRight}</span> : null}
    </button>
  );
}
