"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn, highlight } from "@/lib/utils";

const COPIED_MS = 1500;

export function CodeBlock({ code, language, caption }: { code: string; language: string; caption?: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");
  const isJava = language.toLowerCase() === "java";

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the code stays selectable.
    }
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-code">
      <div className="flex h-9 items-center justify-between gap-2 border-b border-border pl-3 pr-1">
        <figcaption className="flex min-w-0 items-center gap-2 text-xs">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{language}</span>
          {caption && <span className="truncate text-muted">· {caption}</span>}
        </figcaption>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          title={copied ? "Copied" : "Copy code"}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            copied ? "text-success" : "text-muted hover:bg-surface-muted hover:text-foreground",
          )}
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <div className="overflow-x-auto py-2">
        <pre className="min-w-max font-mono text-[13px] leading-6">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex pr-4">
                <span className="w-10 shrink-0 select-none pr-3 text-right tabular-nums text-muted/60" aria-hidden>
                  {i + 1}
                </span>
                <span>{isJava ? highlight(line) : line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </figure>
  );
}
