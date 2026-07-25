import { Construction } from 'lucide-react';

export function PlaceholderScreen({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-paper-100 text-ink-500">
        <Construction className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-heading font-medium text-ink-800">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-ink-500">{hint}</p>
    </div>
  );
}
