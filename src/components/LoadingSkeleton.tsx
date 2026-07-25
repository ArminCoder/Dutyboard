const base = 'animate-pulse bg-paper-200 rounded-none';

export function SkeletonCard() {
  return (
    <div className="border border-paper-200 bg-paper-0 p-5">
      <div className={`${base} mb-3 h-3 w-24`} />
      <div className={`${base} mb-2 h-6 w-40`} />
      <div className={`${base} h-3 w-32`} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-paper-200 py-3">
      <div className={`${base} h-8 w-8 rounded-full`} />
      <div className="flex-1 space-y-2">
        <div className={`${base} h-3 w-1/3`} />
        <div className={`${base} h-2 w-1/2`} />
      </div>
      <div className={`${base} h-4 w-16`} />
    </div>
  );
}

export function SkeletonScreen() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <div className={`${base} mb-2 h-3 w-24`} />
        <div className={`${base} mb-3 h-8 w-64`} />
        <div className={`${base} h-[2px] w-16 bg-brass-500`} />
      </div>
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="border border-paper-200 bg-paper-0 p-5">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
