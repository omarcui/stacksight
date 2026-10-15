import { Lightbulb, SearchCode, Target, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalloutVariant } from "@/types/curriculum";
import { Markdown } from "./Markdown";

// Callouts are scaffolding cards (docs/ui-spec.md §3.5). Variants map onto role colors:
// info → accent, tip → success, warning → heap, error_pitfall → danger.

const VARIANTS: Record<
  CalloutVariant,
  { label: string; icon: LucideIcon; card: string; tile: string; tone: string }
> = {
  info: {
    label: "Concept Analogy / Mental Model",
    icon: Lightbulb,
    card: "border-accent/30 bg-accent/[0.05]",
    tile: "border-accent/30 bg-accent/10",
    tone: "text-accent",
  },
  warning: {
    label: "Common Pitfall",
    icon: TriangleAlert,
    card: "border-heap/40 bg-heap/[0.05]",
    tile: "border-heap/40 bg-heap/10",
    tone: "text-heap",
  },
  tip: {
    label: "Beginner Shortcut",
    icon: Target,
    card: "border-success/30 bg-success/[0.05]",
    tile: "border-success/30 bg-success/10",
    tone: "text-success",
  },
  error_pitfall: {
    label: "Execution Secret",
    icon: SearchCode,
    card: "border-danger/30 bg-danger/[0.05]",
    tile: "border-danger/30 bg-danger/10",
    tone: "text-danger",
  },
};

export function CalloutBox({
  variant,
  title,
  children,
}: {
  variant: CalloutVariant;
  /** Overrides the variant's default label. */
  title?: string;
  children: string;
}) {
  const v = VARIANTS[variant];
  const Icon = v.icon;
  return (
    <aside
      role={variant === "error_pitfall" || variant === "warning" ? "alert" : "note"}
      className={cn("rounded-xl border p-4 sm:p-5", v.card)}
    >
      <div className="flex items-center gap-3">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", v.tile)}>
          <Icon className={cn("size-4", v.tone)} aria-hidden />
        </span>
        <p className={cn("text-[11px] font-semibold uppercase tracking-wider", v.tone)}>{title ?? v.label}</p>
      </div>
      <Markdown text={children} className="mt-3 text-foreground/90 md:text-base sm:pl-11" />
    </aside>
  );
}
