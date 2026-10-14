import { FileCode2 } from "lucide-react";
import type { ModuleDeliverable } from "@/types/curriculum";

// Module deliverables: module N maps to Lab N in docs/lab-manual.md (docs/ui-spec.md §3.5).
// A lab with several exercises lists one entry per submission file.

export function DeliverableCard({
  deliverables,
  labNumber,
}: {
  deliverables: ModuleDeliverable[];
  labNumber: number;
}) {
  const multiple = deliverables.length > 1;
  return (
    <section aria-labelledby="deliverable-heading" className="rounded-xl border border-border bg-surface-muted/50 p-4">
      <h2 id="deliverable-heading" className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Lab {labNumber} {multiple ? `deliverables · ${deliverables.length} files` : "deliverable"}
      </h2>
      <ul className={multiple ? "mt-2 divide-y divide-border" : undefined}>
        {deliverables.map((d) => (
          <li key={d.filename} className={multiple ? "py-3 first:pt-1 last:pb-0" : "mt-2"}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold leading-snug">{d.title}</h3>
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border-strong bg-code px-2.5 font-mono text-xs">
                <FileCode2 className="size-3.5 text-muted" aria-hidden />
                <span className="sr-only">Submit as </span>
                {d.filename}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{d.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
