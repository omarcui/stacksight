export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-6 sm:px-6 sm:py-8 lg:px-8" aria-busy="true">
      <div className="mb-2 h-3 w-20 rounded bg-surface-muted" />
      <div className="mb-3 h-8 w-64 max-w-full rounded bg-surface-muted" />
      <div className="mb-8 h-4 w-96 max-w-full rounded bg-surface-muted" />
      <div className="h-64 rounded-xl bg-surface-muted" />
    </div>
  );
}
