import { CircleAlert, Info, Lightbulb, OctagonX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalloutVariant } from "@/types/curriculum";
import { Markdown } from "./Markdown";

// Callout variants map onto role colors (docs/ui-spec.md §3.5): info → accent, tip → success,
// warning → heap, error_pitfall → danger.

const VARIANTS: Record<CalloutVariant, { label: string; icon: LucideIcon; className: string; tone: string }> = {
  info: { label: "Note", icon: Info, className: "border-accent/40 bg-accent/[0.06]", tone: "text-accent" },
  tip: { label: "Tip", icon: Lightbulb, className: "border-success/40 bg-success/[0.06]", tone: "text-success" },
  warning: { label: "Warning", icon: CircleAlert, className: "border-heap/50 bg-heap/[0.06]", tone: "text-heap" },
  error_pitfall: {
    label: "Common pitfall",
    icon: OctagonX,
    className: "border-danger/40 bg-danger/[0.06]",
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
      className={cn("flex gap-3 rounded-xl border p-4", v.className)}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", v.tone)} aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className={cn("text-[11px] font-semibold uppercase tracking-wider", v.tone)}>{title ?? v.label}</p>
        <Markdown text={children} />
      </div>
    </aside>
  );
}
