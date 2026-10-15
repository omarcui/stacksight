// Mirrors the lesson reader layout so the page doesn't shift when it loads.
export default function Loading() {
  return (
    <div className="animate-pulse px-3 pb-6 pt-4 sm:px-4 lg:pb-8" aria-busy="true">
      <div className="rounded-2xl border border-border bg-surface">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="h-4 w-56 max-w-full rounded bg-surface-muted" />
          <div className="hidden gap-2 sm:flex">
            <div className="size-9 rounded-lg bg-surface-muted" />
            <div className="h-9 w-32 rounded-lg bg-surface-muted" />
            <div className="h-9 w-20 rounded-lg bg-surface-muted" />
          </div>
        </div>
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-8 lg:px-10">
          <div className="h-3 w-16 rounded bg-surface-muted" />
          <div className="h-7 w-80 max-w-full rounded bg-surface-muted" />
          <div className="h-4 w-full rounded bg-surface-muted" />
          <div className="h-64 rounded-xl bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}
