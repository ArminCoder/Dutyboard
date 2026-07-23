import type { ReactNode } from 'react';

export function PageShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink-50 text-ink-800">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-ink-400">Dutyboard</div>
            <h1 className="text-lg font-semibold text-ink-900">{title}</h1>
            {subtitle ? <div className="text-sm text-ink-500">{subtitle}</div> : null}
          </div>
          <div className="flex items-center gap-3">{right}</div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
      <footer className="mx-auto max-w-7xl px-6 py-6 text-center text-xs text-ink-400">
        Svi podaci u demonstraciji su izmišljeni.
      </footer>
    </div>
  );
}
