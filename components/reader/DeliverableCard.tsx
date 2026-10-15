import { BookOpen, FileCode2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleDeliverable } from "@/types/curriculum";

// Module deliverables: module N maps to Lab N in docs/lab-manual.md (docs/ui-spec.md §3.5).
// A lab with several exercises lists one assignment card per submission file.

/** Descriptions repeat the lab reference as a prefix ("Lab 4, Exercise 4.1: …"); the card shows it separately. */
function goalText(d: ModuleDeliverable): string {
  if (!d.labReference || !d.description.startsWith(d.labReference)) return d.description;
  const rest = d.description.slice(d.labReference.length).replace(/^[\s:·—–-]+/, "");
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/** "Lab 4, Exercise 4.1" → "Exercise 4.1"; the section heading already names the lab. */
function exerciseLabel(labReference: string): string {
  return labReference.replace(/^Lab\s+\d+\s*,\s*/i, "");
}

export function DeliverableCard({
  deliverables,
  labNumber,
}: {
  deliverables: ModuleDeliverable[];
  labNumber: number;
}) {
  const multiple = deliverables.length > 1;
  return (
    <section aria-labelledby="deliverable-heading" className="rounded-xl border border-border bg-surface-muted/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="deliverable-heading" className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Lab {labNumber} {multiple ? "deliverables" : "deliverable"}
        </h2>
        <span className="text-xs tabular-nums text-muted">
          {deliverables.length} {multiple ? "files" : "file"} to submit
        </span>
      </div>

      <ol className={cn("mt-4 grid gap-3", multiple && "md:grid-cols-2")}>
        {deliverables.map((d, i) => (
          <li key={d.filename} className="flex flex-col rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <Target className="size-3.5 shrink-0" aria-hidden />
              {d.labReference ? (
                <span>
                  <span className="sr-only">Lab {labNumber}, </span>
                  {exerciseLabel(d.labReference)}
                </span>
              ) : (
                <span>Task {String(i + 1).padStart(2, "0")}</span>
              )}
            </div>

            <h3 className="mt-2 text-sm font-semibold leading-snug md:text-base">{d.title}</h3>

            <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/80">
              <span className="sr-only">Goal: </span>
              {goalText(d)}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-border-strong bg-code px-2.5 font-mono text-xs">
                <FileCode2 className="size-3.5 shrink-0 text-muted" aria-hidden />
                <span className="sr-only">Submit as </span>
                <span className="truncate">{d.filename}</span>
              </span>
              {d.labReference && (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs text-muted">
                  <BookOpen className="size-3.5 shrink-0" aria-hidden />
                  {d.labReference}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
