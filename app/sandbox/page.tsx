"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookMarked, Play, RotateCcw, Save, Square, Undo2 } from "lucide-react";
import { ConsoleTerminal, type ConsoleSegment, type ConsoleStatus, type ConsoleStream } from "@/components/sandbox/ConsoleTerminal";
import { SandboxEditor } from "@/components/sandbox/SandboxEditor";
import { SnippetDrawer } from "@/components/sandbox/SnippetDrawer";
import { sandboxTemplates } from "@/data/sandboxTemplates";
import { runJava, SandboxStopped } from "@/lib/sandbox-runner";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SANDBOX_CODE,
  useCourseStore,
  useCourseStoreHydrated,
  type CodeSnippet,
} from "@/store/useCourseStore";

// Java sandbox: editor pane beside a console pane (docs/ui-spec.md §3.6).

const MAX_CONSOLE_CHARS = 200_000;
const UNDO_MS = 6000;

const eyebrowClass = "text-[11px] font-semibold uppercase tracking-wider text-muted";
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const buttonBase = `inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 ${focusRing}`;
const secondaryButton = `${buttonBase} border border-border bg-surface hover:bg-surface-muted`;

type RunSession = {
  controller: AbortController;
  /** Lines typed before the program asked for them. */
  queue: string[];
  pending: { resolve: (line: string) => void; reject: (reason: unknown) => void } | null;
};

/** Appends output, merging runs of the same stream and trimming the oldest text past the cap. */
function appendSegments(prev: ConsoleSegment[], incoming: ConsoleSegment[]): ConsoleSegment[] {
  const next = prev.slice();
  for (const seg of incoming) {
    const last = next[next.length - 1];
    if (last?.stream === seg.stream) next[next.length - 1] = { stream: seg.stream, text: last.text + seg.text };
    else next.push(seg);
  }
  let total = next.reduce((n, s) => n + s.text.length, 0);
  while (total > MAX_CONSOLE_CHARS && next.length > 1) total -= next.shift()!.text.length;
  if (total > MAX_CONSOLE_CHARS) next[0] = { ...next[0], text: next[0].text.slice(-MAX_CONSOLE_CHARS) };
  return next;
}

export default function SandboxPage() {
  const hydrated = useCourseStoreHydrated();
  const code = useCourseStore((s) => s.sandboxCode);
  const updateSandboxCode = useCourseStore((s) => s.updateSandboxCode);
  const snippetCount = useCourseStore((s) => s.savedSnippets.length);

  const [templateId, setTemplateId] = useState("");
  const [segments, setSegments] = useState<ConsoleSegment[]>([]);
  const [status, setStatus] = useState<ConsoleStatus>("idle");
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [drawer, setDrawer] = useState<"browse" | "save" | null>(null);
  const [undo, setUndo] = useState<{ code: string; label: string } | null>(null);

  const session = useRef<RunSession | null>(null);
  const pendingOutput = useRef<ConsoleSegment[]>([]);
  const flushFrame = useRef<number | null>(null);
  const lastChar = useRef("\n");

  const running = status === "running" || status === "waiting";
  const template = sandboxTemplates.find((t) => t.id === templateId);

  // Output arrives in bursts (a println per loop iteration); batch it into one render per frame.
  const append = useCallback((stream: ConsoleStream, text: string) => {
    if (!text) return;
    lastChar.current = text[text.length - 1];
    pendingOutput.current.push({ stream, text });
    if (flushFrame.current !== null) return;
    flushFrame.current = requestAnimationFrame(() => {
      flushFrame.current = null;
      const batch = pendingOutput.current;
      pendingOutput.current = [];
      setSegments((prev) => appendSegments(prev, batch));
    });
  }, []);

  const stop = useCallback(() => {
    const current = session.current;
    if (!current) return;
    current.controller.abort();
    current.pending?.reject(new SandboxStopped());
    current.pending = null;
  }, []);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (!undo) return;
    const id = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(id);
  }, [undo]);

  async function run() {
    if (session.current || !hydrated) return;
    const current: RunSession = { controller: new AbortController(), queue: [], pending: null };
    session.current = current;

    pendingOutput.current = [];
    setSegments([]);
    setErrorLine(null);
    setStatus("running");
    append("system", "$ javac Main.java && java Main\n");

    const started = performance.now();
    let result;
    try {
      result = await runJava(useCourseStore.getState().sandboxCode, {
        write: (text, stream) => append(stream, text),
        readLine: () => {
          const queued = current.queue.shift();
          if (queued !== undefined) return Promise.resolve(queued);
          setStatus("waiting");
          return new Promise<string>((resolve, reject) => {
            current.pending = { resolve, reject };
          });
        },
        signal: current.controller.signal,
      });
    } catch (error) {
      append("stderr", `Sandbox error: ${error instanceof Error ? error.message : String(error)}\n`);
      result = { status: "error" as const, exitCode: 1, errorLine: null };
    }

    const seconds = ((performance.now() - started) / 1000).toFixed(2);
    const gap = lastChar.current === "\n" ? "" : "\n";
    append(
      "system",
      result.status === "stopped"
        ? `${gap}\nProcess stopped by user\n`
        : `${gap}\nProcess finished with exit code ${result.exitCode} (${seconds}s)\n`,
    );
    setStatus(result.status === "ok" ? "done" : result.status);
    setErrorLine(result.errorLine);
    session.current = null;
  }

  function submitInput(line: string) {
    const current = session.current;
    if (!current) return;
    append("stdin", `${line}\n`);
    const pending = current.pending;
    if (!pending) {
      current.queue.push(line);
      return;
    }
    current.pending = null;
    setStatus("running");
    pending.resolve(line);
  }

  /** Replaces the editor buffer, keeping the previous code for one-click undo. */
  function replaceCode(next: string, label: string) {
    if (next !== code) setUndo({ code, label });
    updateSandboxCode(next);
    setErrorLine(null);
  }

  function edit(next: string) {
    updateSandboxCode(next);
    setErrorLine(null);
    setUndo(null);
  }

  function loadSnippet(snippet: CodeSnippet) {
    replaceCode(snippet.code, `Opened “${snippet.title}”`);
    setDrawer(null);
  }

  const closeDrawer = useCallback(() => setDrawer(null), []);

  return (
    <div className="flex flex-col gap-3 px-3 pb-6 pt-4 sm:px-4 lg:h-[calc(100dvh-3.5rem)] lg:pb-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">Tools</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Java Sandbox</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Write a console program, run it in your browser, and answer <code className="font-mono text-[13px]">Scanner</code>{" "}
            prompts in the terminal.
          </p>
        </div>
        <button type="button" onClick={() => setDrawer("browse")} className={secondaryButton}>
          <BookMarked className="size-4 text-stack" aria-hidden />
          Snippets
          {hydrated && snippetCount > 0 && (
            <span className="rounded-full bg-surface-muted px-1.5 text-xs tabular-nums text-muted">{snippetCount}</span>
          )}
        </button>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <section
          aria-label="Code editor"
          className="flex h-128 flex-col overflow-hidden rounded-2xl border border-border bg-surface lg:h-auto lg:min-h-0"
        >
          <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className={eyebrowClass}>Editor</h2>
              <span className="truncate font-mono text-xs text-muted">Main.java</span>
            </div>
            <label className="flex min-w-0 items-center gap-2">
              <span className="sr-only">Load a template</span>
              <select
                value={templateId}
                onChange={(e) => {
                  const next = sandboxTemplates.find((t) => t.id === e.target.value);
                  if (!next) return;
                  setTemplateId(next.id);
                  replaceCode(next.code, `Loaded “${next.label}”`);
                }}
                disabled={!hydrated}
                className={cn(
                  "h-8 min-w-0 max-w-52 rounded-lg border border-border-strong bg-surface px-2 text-xs font-medium text-foreground disabled:opacity-60",
                  focusRing,
                )}
              >
                <option value="" disabled>
                  Load template…
                </option>
                {sandboxTemplates.map((t) => (
                  <option key={t.id} value={t.id} title={t.description}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-2">
            {running ? (
              <button
                type="button"
                onClick={stop}
                className={`${buttonBase} bg-danger text-role-foreground hover:bg-danger/90`}
              >
                <Square className="size-3.5 fill-current" aria-hidden />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={run}
                disabled={!hydrated}
                className={`${buttonBase} bg-accent text-accent-foreground hover:bg-accent/90`}
              >
                <Play className="size-4 fill-current" aria-hidden />
                Run
              </button>
            )}
            <button
              type="button"
              onClick={() => replaceCode(template?.code ?? DEFAULT_SANDBOX_CODE, "Editor reset")}
              disabled={!hydrated}
              title={template ? `Restore “${template.label}”` : "Restore the starter program"}
              className={`${buttonBase} text-muted hover:bg-surface-muted hover:text-foreground`}
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset
            </button>
            <button type="button" onClick={() => setDrawer("save")} disabled={!hydrated} className={secondaryButton}>
              <Save className="size-4" aria-hidden />
              Save Snippet
            </button>

            <div className="ml-auto flex items-center gap-2" aria-live="polite">
              {undo ? (
                <span className="inline-flex h-7 items-center gap-1 rounded-full border border-accent/30 bg-accent/10 pl-2.5 pr-1 text-xs font-medium text-accent">
                  <span className="max-w-40 truncate">{undo.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      updateSandboxCode(undo.code);
                      setUndo(null);
                    }}
                    className={cn("inline-flex h-5 items-center gap-1 rounded-full px-1.5 hover:bg-accent/15", focusRing)}
                  >
                    <Undo2 className="size-3" aria-hidden />
                    Undo
                  </button>
                </span>
              ) : (
                <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted sm:inline">
                  Ctrl + Enter
                </kbd>
              )}
            </div>
          </div>

          <SandboxEditor value={code} onChange={edit} onRun={run} errorLine={errorLine} ready={hydrated} />

          <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-t border-border px-4 text-xs text-muted tabular-nums">
            <span>{hydrated ? `${code.split("\n").length} lines` : " "}</span>
            <span className="truncate">
              {errorLine ? <span className="text-danger">Error on line {errorLine}</span> : "Java subset · runs in your browser"}
            </span>
          </div>
        </section>

        <ConsoleTerminal
          segments={segments}
          status={status}
          onSubmit={submitInput}
          onClear={() => {
            pendingOutput.current = [];
            setSegments([]);
            if (!running) setStatus("idle");
          }}
        />
      </div>

      <SnippetDrawer
        open={drawer !== null}
        onClose={closeDrawer}
        onLoad={loadSnippet}
        focusSave={drawer === "save"}
        defaultTitle={template?.label ?? "Untitled snippet"}
      />
    </div>
  );
}
