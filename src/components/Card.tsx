import type { ReactNode } from 'react';

type Variant = 'paper' | 'surface' | 'dark' | 'flat';

interface Props {
  variant?: Variant;
  as?: 'div' | 'section' | 'article' | 'aside';
  className?: string;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  paper: 'bg-paper-0 border border-paper-200',
  surface: 'bg-paper-100 border border-paper-200',
  dark: 'bg-dark-surface border border-dark-border',
  flat: 'bg-transparent border border-paper-200',
};

export function Card({ variant = 'paper', as: Tag = 'div', className = '', children }: Props) {
  return <Tag className={`${VARIANTS[variant]} ${className}`}>{children}</Tag>;
}

export function CardHeader({
  eyebrow,
  title,
  right,
  className = '',
}: {
  eyebrow?: string;
  title: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 border-b border-paper-200 px-5 py-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? <div className="section-label mb-1">{eyebrow}</div> : null}
        <h3 className="font-heading text-lg text-ink-800">{title}</h3>
      </div>
      {right ? <div className="flex-none">{right}</div> : null}
    </div>
  );
}

export function CardBody({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
