import type { ReactNode } from "react";
import { renderLatex } from "@/components/reader/ContentBlockRenderer";
import { InlineMarkdown } from "@/components/reader/Markdown";
import { cn, highlight } from "@/lib/utils";

// Shared quiz primitives: Markdown prompts with inline $math$, and read-only code.

export const eyebrowClass = "text-[11px] font-semibold uppercase tracking-wider text-muted";
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
export const primaryButton = cn(
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
  focusRing,
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);
export const secondaryButton = cn(
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm font-medium transition-colors hover:bg-surface-muted",
  focusRing,
);
export const ghostButton = cn(
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground",
  focusRing,
);

const MATH = /(\$[^$]+\$)/g;

/** Inline Markdown (`code`, **bold**, *italic*) plus `$…$` LaTeX spans. */
export function QuizText({ text }: { text: string }) {
  return (
    <>
      {text.split(MATH).map((part, i): ReactNode => {
        if (part.length > 2 && part.startsWith("$") && part.endsWith("$")) {
          const latex = part.slice(1, -1);
          return (
            <span key={i} role="math" aria-label={latex} className="whitespace-nowrap font-mono text-[0.95em]">
              {renderLatex(latex)}
            </span>
          );
        }
        return <InlineMarkdown key={i} text={part} />;
      })}
    </>
  );
}

/** Read-only Java listing with line numbers; `errorLine` (1-based) is tinted danger. */
export function QuizCode({
  code,
  language = "java",
  label,
  errorLine,
  className,
}: {
  code: string;
  language?: string;
  label?: string;
  errorLine?: number;
  className?: string;
}) {
  const lines = code.replace(/\n$/, "").split("\n");
  const isJava = language.toLowerCase() === "java";

  return (
    <figure className={cn("overflow-hidden rounded-xl border border-border bg-code", className)}>
      <figcaption className="flex h-8 items-center border-b border-border px-3 font-mono text-[11px] uppercase tracking-wider text-muted">
        {label ?? language}
      </figcaption>
      <div className="overflow-x-auto py-2">
        <pre className="min-w-max font-mono text-[13px] leading-6">
          <code>
            {lines.map((line, i) => {
              const isError = errorLine === i + 1;
              return (
                <div
                  key={i}
                  className={cn("flex border-l-2 border-transparent pr-4", isError && "border-danger bg-danger/10")}
                >
                  <span
                    className={cn(
                      "w-10 shrink-0 select-none pr-3 text-right tabular-nums",
                      isError ? "text-danger" : "text-muted/60",
                    )}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span>{isJava ? highlight(line) : line || " "}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </figure>
  );
}

/** Console output: plain mono text, no highlighting. */
export function ConsoleOutput({ output }: { output: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-code">
      <figcaption className="flex h-8 items-center border-b border-border px-3 font-mono text-[11px] uppercase tracking-wider text-muted">
        Console output
      </figcaption>
      <pre className="overflow-x-auto px-4 py-2.5 font-mono text-[13px] leading-6">{output}</pre>
    </figure>
  );
}
