"use client";

import { useCallback, useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared chrome for the interactive widgets: pane shell (docs/ui-spec.md §4), a step/auto-play engine,
// tabs, chips and a traced code view.

export function WidgetPane({
  label,
  actions,
  children,
  className,
}: {
  label: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={label} className={cn("overflow-hidden rounded-2xl border border-border bg-surface", className)}>
      <header className="flex h-11 items-center justify-between gap-3 border-b border-border px-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        {actions}
      </header>
      {children}
    </section>
  );
}

export const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function useStepper(total: number, intervalMs = 1600) {
  const last = Math.max(0, total - 1);
  const [rawStep, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = Math.min(rawStep, last);

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => {
      const next = Math.min(step + 1, last);
      setStep(next);
      if (next >= last) setPlaying(false);
    }, intervalMs);
    return () => window.clearTimeout(id);
  }, [playing, step, last, intervalMs]);

  const goTo = useCallback(
    (n: number) => {
      setPlaying(false);
      setStep(Math.max(0, Math.min(n, last)));
    },
    [last],
  );

  const togglePlay = useCallback(() => {
    if (playing) return setPlaying(false);
    if (step >= last) setStep(0);
    setPlaying(true);
  }, [playing, step, last]);

  return {
    step,
    last,
    playing,
    goTo,
    next: () => goTo(step + 1),
    prev: () => goTo(step - 1),
    reset: () => goTo(0),
    togglePlay,
  };
}

type Stepper = ReturnType<typeof useStepper>;

const ICON_BUTTON = cn(
  "inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors",
  "hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
  FOCUS_RING,
);

export function StepControls({ stepper, unit = "step" }: { stepper: Stepper; unit?: string }) {
  const { step, last, playing } = stepper;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" onClick={stepper.reset} disabled={step === 0} aria-label="Reset" className={ICON_BUTTON}>
        <RotateCcw className="size-4" aria-hidden />
      </button>
      <button type="button" onClick={stepper.prev} disabled={step === 0} className={cn(ICON_BUTTON, "w-auto gap-1.5 px-3 text-xs font-medium")}>
        <StepBack className="size-4" aria-hidden />
        Previous
      </button>
      <button
        type="button"
        onClick={stepper.togglePlay}
        aria-pressed={playing}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
          playing ? "bg-tracer/15 text-tracer glow-tracer" : "bg-accent text-accent-foreground hover:opacity-90",
          FOCUS_RING,
        )}
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        {playing ? "Pause" : "Auto-play"}
      </button>
      <button type="button" onClick={stepper.next} disabled={step === last} className={cn(ICON_BUTTON, "w-auto gap-1.5 px-3 text-xs font-medium")}>
        Next {unit}
        <StepForward className="size-4" aria-hidden />
      </button>
      <span className="ml-auto font-mono text-[13px] tabular-nums text-muted">
        {unit} {step + 1}/{last + 1}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs, chips and a traced code view
// ---------------------------------------------------------------------------

export const CHIP = "h-9 rounded-lg border px-3 font-mono text-xs transition-colors";
export const CHIP_ON = "border-tracer/50 bg-tracer/10 text-tracer";
export const CHIP_OFF = "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground";

export function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
        {children}
      </div>
    </div>
  );
}

/** Pane-header tablist with roving focus; render the active panel with `panelProps`. */
export function useWidgetTabs<T extends string>(tabs: readonly { id: T; label: string }[], initial: T) {
  const [active, setActive] = useState<T>(initial);
  const baseId = useId();

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length].id;
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  const tablist = (label: string) => (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto scrollbar-none">
      {tabs.map((t) => (
        <button
          key={t.id}
          id={`${baseId}-tab-${t.id}`}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          aria-controls={`${baseId}-panel`}
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => setActive(t.id)}
          onKeyDown={onKeyDown}
          className={cn(
            "h-8 shrink-0 whitespace-nowrap rounded-lg px-2.5 text-xs font-medium transition-colors",
            active === t.id ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-muted hover:text-foreground",
            FOCUS_RING,
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const panelProps = { id: `${baseId}-panel`, role: "tabpanel", "aria-labelledby": `${baseId}-tab-${active}` } as const;
  return { active, setActive, tablist, panelProps };
}

/**
 * Read-only code with line numbers. `active` lines get the tracer bar (current execution);
 * `dim` lines fade out (skipped branches). Line numbers are 1-based.
 */
export function CodeTrace({
  lines,
  active = [],
  dim = [],
  label,
  className,
}: {
  lines: string[];
  active?: number[];
  dim?: number[];
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border bg-code py-2", className)} aria-label={label}>
      <pre className="min-w-max font-mono text-[13px] leading-7">
        <code>
          {lines.map((line, i) => {
            const n = i + 1;
            const on = active.includes(n);
            return (
              <div
                key={n}
                aria-current={on ? "step" : undefined}
                className={cn("relative flex pr-4 transition-[background-color,opacity] duration-200", on && "bg-tracer/10", dim.includes(n) && "opacity-40")}
              >
                <span
                  className={cn("absolute inset-y-0 left-0 w-[3px] rounded-r transition-opacity", on ? "bg-tracer opacity-100 glow-tracer" : "opacity-0")}
                  aria-hidden
                />
                <span className={cn("w-10 shrink-0 select-none pr-3 text-right tabular-nums", on ? "text-tracer" : "text-muted/60")}>{n}</span>
                <span className={on ? "text-foreground" : undefined}>{line || " "}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

/** Console pane: monospace output with a blinking caret while the program still runs. */
export function ConsoleOutput({ text, running = false, label = "Console" }: { text: string; running?: boolean; label?: string }) {
  return (
    <div className="rounded-xl border border-border bg-code">
      <p className="border-b border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <pre aria-live="polite" className="min-h-14 overflow-x-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-[13px] leading-6 text-foreground">
        {text}
        {running && <span className="ml-px inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-tracer/70" aria-hidden />}
      </pre>
    </div>
  );
}
