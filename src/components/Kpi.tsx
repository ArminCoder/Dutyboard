import type { ReactNode } from 'react';

type Tone = 'default' | 'warn' | 'alarm' | 'ok' | 'brass';

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  size?: 'md' | 'lg';
  className?: string;
}

const TONE_BORDER: Record<Tone, string> = {
  default: 'border-paper-200',
  warn: 'border-signal-warn/40',
  alarm: 'border-signal-alarm/40',
  ok: 'border-signal-ok/40',
  brass: 'border-brass-300',
};

const TONE_ACCENT: Record<Tone, string> = {
  default: 'bg-brass-500',
  warn: 'bg-signal-warn',
  alarm: 'bg-signal-alarm',
  ok: 'bg-signal-ok',
  brass: 'bg-brass-500',
};

export function Kpi({ label, value, sub, icon, tone = 'default', size = 'md', className = '' }: Props) {
  return (
    <div
      className={`relative overflow-hidden border ${TONE_BORDER[tone]} bg-paper-0 p-4 ${className}`}
    >
      <span className={`absolute left-0 top-0 h-full w-[3px] ${TONE_ACCENT[tone]}`} />
      <div className="flex items-center gap-1.5">
        {icon ? <span className="flex-none text-ink-500">{icon}</span> : null}
        <div className="section-label">{label}</div>
      </div>
      <div
        className={`mt-2 font-mono font-medium tabular-nums text-ink-800 ${
          size === 'lg' ? 'text-3xl' : 'text-2xl'
        }`}
      >
        {value}
      </div>
      {sub ? <div className="mt-1 text-[11px] text-ink-500">{sub}</div> : null}
    </div>
  );
}
