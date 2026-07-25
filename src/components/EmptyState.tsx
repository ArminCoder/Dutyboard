import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  hint?: string;
  right?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, hint, right, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center border border-dashed border-paper-300 bg-paper-0 px-6 py-12 text-center ${className}`}>
      {icon ? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-sm border border-paper-300 bg-paper-50 text-ink-400">
          {icon}
        </div>
      ) : (
        <DefaultEmptyGlyph />
      )}
      <div className="text-sm font-medium text-ink-700">{title}</div>
      {hint ? <div className="mt-1 max-w-md text-xs text-ink-500">{hint}</div> : null}
      {right ? <div className="mt-4">{right}</div> : null}
    </div>
  );
}

function DefaultEmptyGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-3 text-paper-300">
      <rect x="10" y="8" width="28" height="34" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 18h16M16 24h16M16 30h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  );
}
