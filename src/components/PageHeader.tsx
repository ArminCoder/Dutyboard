import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, subtitle, right, className = '' }: Props) {
  return (
    <header className={`mb-8 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? <div className="section-label mb-1.5">{eyebrow}</div> : null}
          <h1 className="font-heading text-3xl leading-tight text-ink-800 md:text-4xl">{title}</h1>
          {subtitle ? <div className="mt-2 max-w-2xl text-sm text-ink-500">{subtitle}</div> : null}
        </div>
        {right ? <div className="flex flex-none flex-wrap items-center gap-2">{right}</div> : null}
      </div>
      <div className="mt-5 h-[2px] w-16 bg-brass-500" />
    </header>
  );
}
