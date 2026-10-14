"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, OctagonX } from "lucide-react";
import { FOCUS_RING, StepControls, WidgetPane, useStepper } from "@/components/interactive/module1/shared";
import { cn, highlight } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Program and per-step snapshots
// ---------------------------------------------------------------------------

const CODE = [
  "public static void main(String[] args) {",
  "    final int MAX_USERS = 100;",
  "    int mask = 0xFF;",
  "    int flags = 0b1010_0101;",
  "    char letter = '\\u0041';",
  "    final long LIMIT = 0x7FFF_FFFFL;",
  "}",
];

interface Local {
  /** First local-variable slot; long and double take two. */
  slot: number;
  size: 1 | 2;
  type: string;
  name: string;
  value: string;
  sub: string;
  final?: boolean;
  reference?: boolean;
}

interface Literal {
  source: string;
  base: 2 | 10 | 16;
  /** Digits that carry the value, with prefix, suffix and underscores removed. */
  digits: string;
}

interface Step {
  line: number;
  title: string;
  detail: string;
  local: Local;
  literal?: Literal;
}

const MAX_LOCALS = 7;

const STEPS: Step[] = [
  {
    line: 1,
    title: "main() frame pushed",
    detail:
      "The JVM pushes a frame for `main`. javac already counted the local variables, so the frame arrives with all 7 slots reserved. Slot 0 holds `args`, a reference to an array on the heap.",
    local: { slot: 0, size: 1, type: "String[]", name: "args", value: "ref", sub: "→ heap", reference: true },
  },
  {
    line: 2,
    title: "Named constant",
    detail:
      "`final` lets the slot be assigned exactly once. Constants are written in UPPER_SNAKE_CASE, so a reader can tell `MAX_USERS` from an ordinary variable.",
    local: { slot: 1, size: 1, type: "int", name: "MAX_USERS", value: "100", sub: "0x00000064", final: true },
    literal: { source: "100", base: 10, digits: "100" },
  },
  {
    line: 3,
    title: "Hexadecimal literal",
    detail: "The `0x` prefix switches to base 16. Each hex digit stands for exactly 4 bits, so `0xFF` is the low byte with every bit set.",
    local: { slot: 2, size: 1, type: "int", name: "mask", value: "255", sub: "0x000000FF" },
    literal: { source: "0xFF", base: 16, digits: "FF" },
  },
  {
    line: 4,
    title: "Binary literal",
    detail: "The `0b` prefix writes the bits directly. Underscores are only for readability; the compiler ignores them.",
    local: { slot: 3, size: 1, type: "int", name: "flags", value: "165", sub: "0b10100101" },
    literal: { source: "0b1010_0101", base: 2, digits: "10100101" },
  },
  {
    line: 5,
    title: "Unicode escape",
    detail: "A `char` is an unsigned 16-bit number. `'\\u0041'` gives the code point in hex, and code point 65 is the letter A.",
    local: { slot: 4, size: 1, type: "char", name: "letter", value: "'A'", sub: "65 · 0x0041" },
    literal: { source: "'\\u0041'", base: 16, digits: "0041" },
  },
  {
    line: 6,
    title: "long constant in two slots",
    detail:
      "The `L` suffix makes the literal a `long`. A long (like a double) is 64 bits, so it occupies two 32-bit local-variable slots.",
    local: { slot: 5, size: 2, type: "long", name: "LIMIT", value: "2147483647", sub: "0x7FFFFFFF", final: true },
    literal: { source: "0x7FFF_FFFFL", base: 16, digits: "7FFFFFFF" },
  },
];

/** Renders `inline code` spans inside prose. */
function inline(text: string) {
  return text.split(/(`[^`]+`)/).map((chunk, i) =>
    chunk.startsWith("`") ? (
      <code key={i} className="rounded bg-surface-muted px-1 font-mono text-[12px] text-foreground">
        {chunk.slice(1, -1)}
      </code>
    ) : (
      chunk
    ),
  );
}

// ---------------------------------------------------------------------------
// Code view: the shared highlighter plus prefixed literals and `final`.
// ---------------------------------------------------------------------------

const LITERAL = /(0[xX][\dA-Fa-f_]+[lL]?|0[bB][01_]+[lL]?|'\\u[\dA-Fa-f]{4}'|\bfinal\b)/;

function highlightLine(line: string): ReactNode[] {
  return line.split(LITERAL).map((part, i) => {
    if (i % 2 === 0) return <span key={i}>{highlight(part)}</span>;
    return (
      <span key={i} className={part === "final" ? "font-medium text-stack" : "text-heap"}>
        {part}
      </span>
    );
  });
}

function Code({ active, attempt }: { active: number; attempt: boolean }) {
  const lines = attempt ? [...CODE.slice(0, 2), "    MAX_USERS = 200;", ...CODE.slice(2)] : CODE;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-code py-2">
      <pre className="min-w-max font-mono text-[13px] leading-7">
        <code>
          {lines.map((line, i) => {
            const n = i + 1;
            const isAttempt = attempt && i === 2;
            const on = !attempt && n === active;
            return (
              <div
                key={`${i}-${line}`}
                aria-current={on ? "step" : undefined}
                className={cn("relative flex pr-4 transition-colors duration-200", on && "bg-tracer/10", isAttempt && "bg-danger/10")}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 w-[3px] rounded-r transition-opacity",
                    on ? "bg-tracer opacity-100 glow-tracer" : isAttempt ? "bg-danger opacity-100" : "opacity-0",
                  )}
                  aria-hidden
                />
                <span className={cn("w-10 shrink-0 select-none pr-3 text-right tabular-nums", on ? "text-tracer" : isAttempt ? "text-danger" : "text-muted/60")}>
                  {n}
                </span>
                <span className={cn(isAttempt && "text-danger underline decoration-wavy decoration-danger/70 underline-offset-4")}>
                  {isAttempt ? line : highlightLine(line)}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG stack frame
// ---------------------------------------------------------------------------

const W = 360;
const PAD = 12;
const ROW = 36;
const HEADER = 30;
const FRAME = { x: PAD, y: PAD + 20, w: W - PAD * 2 };
const H = FRAME.y + HEADER + ROW * MAX_LOCALS + PAD;
const COL = { slot: FRAME.x + 16, lock: FRAME.x + 30, type: FRAME.x + 48, name: FRAME.x + 112, box: FRAME.x + 200 };
const BOX_W = FRAME.x + FRAME.w - COL.box - 10;

function StackFrame({ locals, fresh, rejected, shakeKey }: { locals: Local[]; fresh: string; rejected: boolean; shakeKey: number }) {
  const bySlot = new Map<number, Local>();
  for (const l of locals) for (let s = 0; s < l.size; s++) bySlot.set(l.slot + s, l);
  const top = FRAME.y + HEADER;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Stack frame for main with ${locals.length} of ${MAX_LOCALS} slots in use`}>
      <text x={FRAME.x} y={PAD + 8} className="fill-stack text-[11px] font-semibold uppercase tracking-wider">
        Stack
      </text>
      <text x={FRAME.x + FRAME.w} y={PAD + 8} textAnchor="end" className="fill-muted font-mono text-[10px]">
        max_locals = {MAX_LOCALS}
      </text>

      <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={HEADER + ROW * MAX_LOCALS} rx={10} className="fill-stack/[0.06] stroke-stack/60" strokeWidth={1.25} />
      <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={HEADER} rx={10} className="fill-stack/15" />
      <text x={FRAME.x + FRAME.w / 2} y={FRAME.y + 20} textAnchor="middle" className="fill-foreground font-mono text-[13px] font-semibold">
        main()
      </text>

      {/* Free slots: reserved by the frame, not yet assigned. */}
      {Array.from({ length: MAX_LOCALS }, (_, slot) =>
        bySlot.has(slot) ? null : (
          <g key={`free-${slot}`}>
            <rect x={FRAME.x + 6} y={top + slot * ROW + 3} width={FRAME.w - 12} height={ROW - 6} rx={6} className="fill-none stroke-border-strong" strokeDasharray="4 4" />
            <text x={COL.slot} y={top + slot * ROW + ROW / 2 + 4} textAnchor="middle" className="fill-muted font-mono text-[11px]">
              {slot}
            </text>
            <text x={COL.type} y={top + slot * ROW + ROW / 2 + 4} className="fill-muted font-sans text-[11px] italic">
              free
            </text>
          </g>
        ),
      )}

      <AnimatePresence initial={false}>
        {locals.map((l) => {
          const y = top + l.slot * ROW;
          const h = ROW * l.size;
          const isFresh = l.name === fresh;
          const isRejected = rejected && l.name === "MAX_USERS";
          const mid = y + h / 2;
          return (
            <motion.g
              key={l.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <g key={isRejected ? `shake-${shakeKey}` : "still"} className={cn(isRejected && "animate-shake")}>
                <rect
                  x={FRAME.x + 6}
                  y={y + 3}
                  width={FRAME.w - 12}
                  height={h - 6}
                  rx={6}
                  className={cn(
                    "transition-colors",
                    isRejected ? "fill-danger/10 stroke-danger" : isFresh ? "fill-tracer/10 stroke-tracer drop-glow-tracer" : "fill-surface stroke-border",
                  )}
                  strokeWidth={isFresh || isRejected ? 1.5 : 1}
                />
                {l.size === 2 && (
                  <line x1={FRAME.x + 6} x2={COL.lock - 6} y1={mid} y2={mid} className="stroke-border-strong" strokeDasharray="3 3" />
                )}
                {Array.from({ length: l.size }, (_, k) => (
                  <text key={k} x={COL.slot} y={y + k * ROW + ROW / 2 + 4} textAnchor="middle" className="fill-muted font-mono text-[11px]">
                    {l.slot + k}
                  </text>
                ))}
                {l.final && <Lock x={COL.lock - 6} y={mid - 6} width={12} height={12} className={isRejected ? "text-danger" : "text-muted"} aria-hidden />}
                <text x={COL.type} y={mid + 4} className={cn("font-mono text-[12px]", l.reference ? "fill-muted" : "fill-stack")}>
                  {l.type}
                </text>
                <text x={COL.name} y={mid + 4} className="fill-foreground font-mono text-[12px] font-medium">
                  {l.name}
                </text>
                <rect
                  x={COL.box}
                  y={mid - 14}
                  width={BOX_W}
                  height={28}
                  rx={5}
                  className={cn(isFresh ? "fill-tracer/10 stroke-tracer/60" : "fill-code stroke-border")}
                />
                <text x={COL.box + BOX_W / 2} y={mid - 1} textAnchor="middle" className={cn("font-mono text-[12px] font-semibold", isFresh ? "fill-tracer" : "fill-foreground")}>
                  {l.value}
                </text>
                <text x={COL.box + BOX_W / 2} y={mid + 10} textAnchor="middle" className={cn("font-mono text-[9px]", l.reference ? "fill-heap" : "fill-muted")}>
                  {l.sub}
                </text>
                {l.size === 2 && (
                  <text x={COL.name} y={mid + 17} className="fill-muted font-sans text-[10px]">
                    2 slots · 64 bits
                  </text>
                )}
              </g>
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Literal breakdown: digit × base^position, non-zero digits only.
// ---------------------------------------------------------------------------

function LiteralBreakdown({ literal }: { literal: Literal }) {
  const { digits, base } = literal;
  const terms = digits
    .split("")
    .map((d, i) => ({ d, value: parseInt(d, base), power: digits.length - 1 - i }))
    .filter((t) => t.value !== 0);
  const total = parseInt(digits, base);
  const baseName = base === 2 ? "binary" : base === 16 ? "hex" : "decimal";

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Reading <span className="font-mono normal-case text-heap">{literal.source}</span> · {baseName}, base {base}
      </p>
      {base === 10 ? (
        <p className="text-xs leading-relaxed text-muted">Plain decimal: no prefix, read as written.</p>
      ) : (
        <p className="flex flex-wrap items-center gap-1.5 font-mono text-[12px] tabular-nums text-foreground">
          {terms.map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted">+</span>}
              <span className="rounded-md border border-border bg-surface px-1.5 py-0.5">
                {base === 16 && t.value > 9 ? `${t.d}(${t.value})` : t.value}×{base}
                <sup>{t.power}</sup>
              </span>
            </span>
          ))}
          <span className="text-muted">=</span>
          <span className="font-semibold text-tracer">{total.toLocaleString("en-US")}</span>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

export function PrimitiveStackTracker() {
  const stepper = useStepper(STEPS.length);
  const current = STEPS[stepper.step];
  const locals = STEPS.slice(0, stepper.step + 1).map((s) => s.local);
  const [attempt, setAttempt] = useState<{ step: number; n: number } | null>(null);
  const rejected = attempt?.step === stepper.step;
  const canAttempt = stepper.step >= 1;

  return (
    <WidgetPane label="Primitive stack tracker" actions={<span className="font-mono text-xs text-muted">Literals.java</span>}>
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-3">
            <Code active={current.line} attempt={rejected} />
            <button
              type="button"
              disabled={!canAttempt}
              onClick={() => setAttempt({ step: stepper.step, n: (attempt?.n ?? 0) + 1 })}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-muted transition-colors",
                "hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
                FOCUS_RING,
              )}
            >
              <Lock className="size-4" aria-hidden />
              Try <span className="font-mono">MAX_USERS = 200;</span>
            </button>
          </div>
          <div className="rounded-xl border border-border bg-code bg-dots">
            <StackFrame locals={locals} fresh={rejected ? "" : current.local.name} rejected={rejected} shakeKey={attempt?.n ?? 0} />
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {rejected ? (
            <motion.div
              key="rejected"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/[0.06] p-4 text-sm leading-relaxed"
            >
              <OctagonX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <div className="space-y-1">
                <p className="font-mono text-[13px] text-danger">error: cannot assign a value to final variable MAX_USERS</p>
                <p className="text-muted">
                  javac rejects the line, so the program never runs and slot 1 keeps <span className="font-mono text-foreground">100</span>.
                  That guarantee is what makes a <span className="font-mono">final</span> constant safe to share.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={stepper.step}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 rounded-xl border border-border bg-surface-muted/40 p-4"
              aria-live="polite"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold leading-snug text-foreground">{current.title}</p>
                <p className="text-sm leading-relaxed text-muted">{inline(current.detail)}</p>
              </div>
              {current.literal && <LiteralBreakdown literal={current.literal} />}
            </motion.div>
          )}
        </AnimatePresence>

        <StepControls stepper={stepper} />
      </div>
    </WidgetPane>
  );
}
