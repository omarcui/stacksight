"use client";

import { useEffect, useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { cn, highlight } from "@/lib/utils";

const COPIED_MS = 1500;

/**
 * Editor tab label: a filename the caption leads with ("RelationalDemo.java: …"), else the public
 * class a Java snippet declares. Fragments without either have no file.
 */
function fileName(code: string, language: string, caption?: string): string | undefined {
  const fromCaption = caption && /^([\w-]+\.(?:java|txt|sh|json|md))\b/.exec(caption);
  if (fromCaption) return fromCaption[1];
  if (language.toLowerCase() !== "java") return undefined;
  const cls = /\bpublic\s+(?:final\s+|abstract\s+)*class\s+(\w+)/.exec(code);
  return cls ? `${cls[1]}.java` : undefined;
}

export function CodeBlock({ code, language, caption }: { code: string; language: string; caption?: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");
  const isJava = language.toLowerCase() === "java";
  const file = fileName(code, language, caption);
  // Drop a caption that only repeats the filename shown in the header.
  const note = caption && file && caption.startsWith(file) ? caption.slice(file.length).replace(/^[\s:·—–-]+/, "") : caption;

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
      <div className="flex h-10 items-center justify-between gap-2 border-b border-border bg-surface-muted/40 pl-3 pr-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileCode2 className="size-4 shrink-0 text-muted" aria-hidden />
          <span className={cn("truncate font-mono text-[13px]", file ? "text-foreground" : "text-muted")}>
            {file ?? "snippet"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="inline-flex h-6 items-center rounded-full border border-border-strong px-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
            {language}
          </span>
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
      </div>
      <div className="overflow-x-auto py-3">
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
      {note && (
        <figcaption className="border-t border-border px-4 py-2.5 text-xs leading-relaxed text-muted">{note}</figcaption>
      )}
    </figure>
  );
}
