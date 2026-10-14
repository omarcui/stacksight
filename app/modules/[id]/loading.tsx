// Mirrors the lesson reader layout so the page doesn't shift when it loads.
export default function Loading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-3 px-3 pt-4 sm:px-4 lg:h-[calc(100dvh-3.5rem)] lg:pb-4"
      aria-busy="true"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-6 w-80 max-w-full rounded bg-surface-muted" />
        <div className="hidden gap-2 sm:flex">
          <div className="h-9 w-32 rounded-lg bg-surface-muted" />
          <div className="h-9 w-20 rounded-lg bg-surface-muted" />
        </div>
      </div>
      <div className="grid min-h-96 flex-1 gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="h-11 rounded-2xl border border-border bg-surface lg:h-auto" />
        <div className="rounded-2xl border border-border bg-surface" />
      </div>
    </div>
  );
}
