import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function SectionLabel({ children, right, className = '' }: Props) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-2 ${className}`}>
      <div className="section-label">{children}</div>
      {right ? <div className="text-xs text-ink-400">{right}</div> : null}
    </div>
  );
}

export function BrassSeparator({ className = '' }: { className?: string }) {
  return <div className={`h-[2px] w-12 bg-brass-500 ${className}`} />;
}
