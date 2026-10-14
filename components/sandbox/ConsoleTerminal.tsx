"use client";

import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, Eraser, SquareTerminal } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConsoleStream = "stdout" | "stderr" | "stdin" | "system";
export type ConsoleSegment = { stream: ConsoleStream; text: string };
export type ConsoleStatus = "idle" | "running" | "waiting" | "done" | "error" | "stopped";

const STREAM_CLASS: Record<ConsoleStream, string> = {
  stdout: "text-success",
  stderr: "text-danger",
  stdin: "text-tracer",
  system: "text-muted",
};

const STATUS: Record<ConsoleStatus, { label: string; className: string }> = {
  idle: { label: "Idle", className: "border-border text-muted" },
  running: { label: "Running", className: "border-tracer/40 bg-tracer/10 text-tracer" },
  waiting: { label: "Waiting for input", className: "border-heap/40 bg-heap/10 text-heap" },
  done: { label: "Finished", className: "border-success/40 bg-success/10 text-success" },
  error: { label: "Error", className: "border-danger/40 bg-danger/10 text-danger" },
  stopped: { label: "Stopped", className: "border-border text-muted" },
};

/**
 * Terminal pane. It is always dark (the `dark` class rescopes the theme tokens), so stdout reads as
 * green, typed input as cyan and stderr as red in both themes.
 */
export function ConsoleTerminal({
  segments,
  status,
  onSubmit,
  onClear,
}: {
  segments: ConsoleSegment[];
  status: ConsoleStatus;
  /** A line typed into the input bar (without the newline). */
  onSubmit: (line: string) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stickToBottom = useRef(true);

  const live = status === "running" || status === "waiting";
  const waiting = status === "waiting";
  const badge = STATUS[status];

  // Follow new output unless the reader has scrolled up.
  useEffect(() => {
    const el = outputRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [segments]);

  useEffect(() => {
    if (waiting) inputRef.current?.focus({ preventScroll: true });
  }, [waiting]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!live) return;
    onSubmit(draft);
    setDraft("");
  }

  return (
    <section
      aria-label="Console"
      className="dark flex min-h-88 flex-col overflow-hidden rounded-2xl border border-border bg-code text-foreground lg:min-h-0"
    >
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          <SquareTerminal className="size-4 text-muted" aria-hidden />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Console</h2>
          <span
            className={cn("inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium", badge.className)}
            aria-live="polite"
          >
            {badge.label}
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={segments.length === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50"
        >
          <Eraser className="size-3.5" aria-hidden />
          Clear
        </button>
      </div>

      <div
        ref={outputRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        role="log"
        aria-label="Program output"
        className="min-h-0 flex-1 overflow-auto px-4 py-3"
      >
        {segments.length === 0 ? (
          <p className="font-mono text-[13px] leading-6 text-muted">
            Press <span className="text-foreground">Run</span> to compile and execute <span className="text-foreground">Main.java</span>.
          </p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-6">
            {segments.map((s, i) => (
              <span key={i} className={STREAM_CLASS[s.stream]}>
                {s.text}
              </span>
            ))}
            {live && <span className="ml-px inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-success/70" aria-hidden />}
          </pre>
        )}
      </div>

      <form
        onSubmit={submit}
        className={cn(
          "flex h-12 shrink-0 items-center gap-2 border-t border-border px-4 transition-colors focus-within:bg-surface-muted/50",
          waiting && "bg-tracer/5 glow-tracer",
        )}
      >
        <span className={cn("font-mono text-sm", live ? "text-tracer" : "text-muted/60")} aria-hidden>
          ›
        </span>
        <label htmlFor="console-input" className="sr-only">
          Program input
        </label>
        <input
          id="console-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!live}
          autoComplete="off"
          spellCheck={false}
          placeholder={
            waiting ? "Program is waiting for input — type and press Enter" : live ? "Type ahead: input is queued for Scanner" : "Input opens while a program runs"
          }
          className="h-full min-w-0 flex-1 bg-transparent font-mono text-[13px] text-tracer outline-none placeholder:text-muted/70 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!live}
          aria-label="Send input"
          className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40"
        >
          <CornerDownLeft className="size-4" aria-hidden />
        </button>
      </form>
    </section>
  );
}
