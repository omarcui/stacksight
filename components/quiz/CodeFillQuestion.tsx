"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { isBlankCorrect, parseTemplate } from "@/lib/quiz";
import { cn, highlight } from "@/lib/utils";
import type { CodeFillQuestion as CodeFillQuestionData } from "@/types/quiz";
import { eyebrowClass, focusRing } from "./QuizText";

// Fill-in-the-blank code: inline inputs inside a read-only listing, plus an
// optional word bank. Tapping a chip fills the last focused (or first empty) blank.

export function CodeFillQuestion({
  question,
  values,
  onChange,
  checked,
  onSubmit,
}: {
  question: CodeFillQuestionData;
  values: Record<string, string>;
  onChange: (blankId: string, value: string) => void;
  /** Locks the inputs and reveals per-blank correctness. */
  checked: boolean;
  /** Enter inside a blank. */
  onSubmit?: () => void;
}) {
  const lines = useMemo(() => parseTemplate(question.code), [question.code]);
  const blanks = useMemo(() => new Map(question.blanks.map((b, i) => [b.id, { blank: b, n: i + 1 }])), [question.blanks]);
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null);

  function fillFromBank(word: string) {
    const target =
      (activeBlankId && blanks.has(activeBlankId) ? activeBlankId : null) ??
      question.blanks.find((b) => !values[b.id]?.trim())?.id ??
      question.blanks[0]?.id;
    if (!target) return;
    onChange(target, word);
    // Advance to the next empty blank so a run of taps fills the template in order.
    const next = question.blanks.find((b) => b.id !== target && !values[b.id]?.trim());
    setActiveBlankId(next?.id ?? target);
    inputs.current.get(next?.id ?? target)?.focus();
  }

  return (
    <div className="space-y-3">
      <figure className="overflow-hidden rounded-xl border border-border bg-code">
        <figcaption className="flex h-8 items-center justify-between border-b border-border px-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{question.language ?? "java"}</span>
          <span className="text-xs tabular-nums text-muted">
            {question.blanks.length} blank{question.blanks.length === 1 ? "" : "s"}
          </span>
        </figcaption>
        <div className="overflow-x-auto py-2">
          <pre className="min-w-max font-mono text-[13px] leading-8">
            <code>
              {lines.map((segments, i) => (
                <div key={i} className="flex pr-4">
                  <span className="w-10 shrink-0 select-none pr-3 text-right tabular-nums text-muted/60" aria-hidden>
                    {i + 1}
                  </span>
                  <span>
                    {segments.length === 0
                      ? " "
                      : segments.map((seg, j) => {
                          if (seg.kind === "code") return <Fragment key={j}>{highlight(seg.text)}</Fragment>;
                          const entry = blanks.get(seg.blankId);
                          if (!entry) return <Fragment key={j}>{`{{${seg.blankId}}}`}</Fragment>;
                          const value = values[seg.blankId] ?? "";
                          const correct = checked && isBlankCorrect(entry.blank, value);
                          const width = Math.max(
                            value.length,
                            entry.blank.hint?.length ?? 0,
                            ...entry.blank.acceptedAnswers.map((a) => a.length),
                            3,
                          );
                          return (
                            <span key={j} className="inline-flex items-baseline gap-1 align-baseline">
                              <input
                                ref={(el) => {
                                  if (el) inputs.current.set(seg.blankId, el);
                                  else inputs.current.delete(seg.blankId);
                                }}
                                value={value}
                                onChange={(e) => onChange(seg.blankId, e.target.value)}
                                onFocus={() => setActiveBlankId(seg.blankId)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    onSubmit?.();
                                  }
                                }}
                                readOnly={checked}
                                placeholder={entry.blank.hint}
                                aria-label={`Blank ${entry.n} of ${question.blanks.length}${entry.blank.hint ? `: ${entry.blank.hint}` : ""}`}
                                aria-invalid={checked ? !correct : undefined}
                                autoComplete="off"
                                autoCapitalize="off"
                                autoCorrect="off"
                                spellCheck={false}
                                style={{ width: `${width + 2}ch` }}
                                className={cn(
                                  "h-7 rounded-md border bg-surface px-[1ch] font-mono text-[13px] text-foreground transition-colors placeholder:text-muted/60",
                                  focusRing,
                                  !checked && "border-border-strong border-dashed hover:border-accent/60",
                                  checked && correct && "border-success/50 bg-success/10 text-success",
                                  checked && !correct && "animate-shake border-danger/50 bg-danger/10 text-danger line-through",
                                )}
                              />
                              {checked && !correct && (
                                <span className="rounded-md bg-success/10 px-1 text-success" aria-label={`Correct: ${entry.blank.acceptedAnswers[0]}`}>
                                  {entry.blank.acceptedAnswers[0]}
                                </span>
                              )}
                            </span>
                          );
                        })}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </figure>

      {question.wordBank && question.wordBank.length > 0 && (
        <div>
          <p className={cn(eyebrowClass, "mb-2")}>Word bank</p>
          <ul className="flex flex-wrap gap-2">
            {question.wordBank.map((word) => {
              const used = Object.values(values).some((v) => v.trim() === word);
              return (
                <li key={word}>
                  <button
                    type="button"
                    onClick={() => fillFromBank(word)}
                    disabled={checked}
                    // Keep focus in the blank on pointer taps so the chip fills it.
                    onMouseDown={(e) => e.preventDefault()}
                    className={cn(
                      "h-11 rounded-lg border px-3 font-mono text-[13px] transition-colors sm:h-9",
                      focusRing,
                      used
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border bg-surface hover:bg-surface-muted",
                      "disabled:cursor-default disabled:opacity-50",
                    )}
                  >
                    {word}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
