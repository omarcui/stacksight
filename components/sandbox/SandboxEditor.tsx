"use client";

import { useRef } from "react";
import { cn, highlight } from "@/lib/utils";

// Code editor: a transparent <textarea> layered over a syntax-highlighted <pre>. The textarea owns
// scrolling and the caret; the highlight layer and line gutter follow its scroll offset.

const INDENT = "    ";
const OPENERS: Record<string, string> = { "{": "}", "(": ")", "[": "]" };

const layerClass =
  "m-0 whitespace-pre px-4 py-3 font-mono text-[13px] leading-6 [font-variant-ligatures:none] [tab-size:4]";

export function SandboxEditor({
  value,
  onChange,
  onRun,
  errorLine,
  ready,
}: {
  value: string;
  onChange: (code: string) => void;
  /** Ctrl/Cmd+Enter. */
  onRun: () => void;
  errorLine: number | null;
  /** False until persisted editor state has loaded. */
  ready: boolean;
}) {
  const highlightRef = useRef<HTMLElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  // After Escape, the next Tab moves focus out of the editor instead of indenting.
  const releaseTab = useRef(false);

  const lines = value.split("\n");

  function syncScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (highlightRef.current) highlightRef.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
    if (gutterRef.current) gutterRef.current.style.transform = `translateY(${-scrollTop}px)`;
  }

  /** Replaces [start, end) with text, keeping the browser's undo history where supported. */
  function replace(ta: HTMLTextAreaElement, start: number, end: number, text: string, caret = start + text.length) {
    ta.focus();
    ta.setSelectionRange(start, end);
    if (!document.execCommand("insertText", false, text)) {
      onChange(ta.value.slice(0, start) + text + ta.value.slice(end));
      requestAnimationFrame(() => ta.setSelectionRange(caret, caret));
      return;
    }
    ta.setSelectionRange(caret, caret);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    const { selectionStart: start, selectionEnd: end, value: text } = ta;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const beforeCaret = text.slice(lineStart, start);
    const indent = /^[ \t]*/.exec(beforeCaret)![0];

    if (e.key === "Escape") {
      releaseTab.current = true;
      return;
    }
    const released = releaseTab.current;
    releaseTab.current = false;

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onRun();
      return;
    }

    if (e.key === "Enter" && !e.altKey) {
      e.preventDefault();
      const opener = beforeCaret.trimEnd().slice(-1);
      if (opener in OPENERS) {
        const inner = indent + INDENT;
        // Caret between a pair, e.g. {|}: put the closer on its own line.
        if (text[end] === OPENERS[opener]) {
          replace(ta, start, end, `\n${inner}\n${indent}`, start + 1 + inner.length);
        } else {
          replace(ta, start, end, `\n${inner}`);
        }
      } else {
        replace(ta, start, end, `\n${indent}`);
      }
      return;
    }

    if (e.key === "Tab" && !released && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const multiline = text.slice(start, end).includes("\n");
      if (!multiline && !e.shiftKey) {
        replace(ta, start, end, INDENT.slice(beforeCaret.length % INDENT.length));
        return;
      }
      // Indent or outdent every selected line.
      const blockEnd = end > start && text[end - 1] === "\n" ? end - 1 : end;
      const block = text.slice(lineStart, blockEnd);
      const next = block
        .split("\n")
        .map((line) => (e.shiftKey ? line.replace(/^( {1,4}|\t)/, "") : INDENT + line))
        .join("\n");
      replace(ta, lineStart, blockEnd, next);
      ta.setSelectionRange(lineStart, lineStart + next.length);
      return;
    }

    // Typing a closer on a blank line removes one indent level.
    if ((e.key === "}" || e.key === ")" || e.key === "]") && start === end && beforeCaret.length >= INDENT.length && beforeCaret.trim() === "") {
      e.preventDefault();
      replace(ta, start - INDENT.length, start, e.key);
      return;
    }

    // Backspace inside leading indentation deletes a whole indent level.
    if (e.key === "Backspace" && start === end && beforeCaret.length > 0 && beforeCaret.trim() === "" && beforeCaret.length % INDENT.length === 0) {
      e.preventDefault();
      replace(ta, start - INDENT.length, start, "");
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-code">
      <div className="w-12 shrink-0 overflow-hidden border-r border-border" aria-hidden>
        <div ref={gutterRef} className="py-3 font-mono text-[13px] leading-6 tabular-nums will-change-transform">
          {lines.map((_, i) => (
            <div
              key={i}
              className={cn(
                "select-none pr-3 text-right",
                errorLine === i + 1 ? "font-semibold text-danger" : "text-muted/60",
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden">
        {ready ? (
          <>
            <pre className={cn(layerClass, "pointer-events-none absolute inset-0 overflow-visible")} aria-hidden>
              <code ref={highlightRef} className="block min-w-max will-change-transform">
                {lines.map((line, i) => (
                  <div key={i} className={cn("-mx-4 px-4", errorLine === i + 1 && "bg-danger/10")}>
                    {line ? highlight(line) : " "}
                  </div>
                ))}
              </code>
            </pre>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onScroll={syncScroll}
              wrap="off"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-label="Java source code. Tab indents; press Escape then Tab to leave the editor. Ctrl+Enter runs."
              className={cn(
                layerClass,
                "absolute inset-0 size-full resize-none overflow-auto bg-transparent text-transparent caret-foreground outline-none selection:bg-accent/25",
              )}
            />
          </>
        ) : (
          <div className="space-y-2.5 px-4 py-4" aria-hidden>
            {[40, 64, 52, 72, 30, 18].map((w, i) => (
              <div key={i} className="h-3.5 animate-pulse rounded bg-surface-muted" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
