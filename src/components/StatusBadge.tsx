import type { ReactNode } from 'react';

type Tone = 'neutral' | 'ok' | 'warn' | 'alarm' | 'brass' | 'ink' | 'dark';

interface Props {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  bold?: boolean;
}

const TONES: Record<Tone, string> = {
  neutral: 'bg-paper-100 text-ink-600 border-paper-300',
  ok: 'bg-signal-ok-soft text-signal-ok border-signal-ok/30',
  warn: 'bg-signal-warn-soft text-signal-warn border-signal-warn/30',
  alarm: 'bg-signal-alarm-soft text-signal-alarm border-signal-alarm/30',
  brass: 'bg-brass-100 text-brass-700 border-brass-300',
  ink: 'bg-navy-900 text-paper-50 border-navy-900',
  dark: 'bg-dark-elevated text-brass-300 border-dark-border',
};

const SIZES = {
  sm: 'text-[10px] leading-none px-1.5 py-0.5',
  md: 'text-[11px] leading-none px-2 py-1',
};

export function StatusBadge({ tone = 'neutral', icon, children, size = 'md', className = '', bold }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 border font-sans font-medium uppercase tracking-[0.1em] ${
        bold ? 'font-semibold' : ''
      } ${TONES[tone]} ${SIZES[size]} ${className}`}
    >
      {icon ? <span className="flex-none">{icon}</span> : null}
      {children}
    </span>
  );
}
