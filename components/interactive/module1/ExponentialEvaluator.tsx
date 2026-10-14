"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { javaDouble } from "@/lib/java-format";
import { cn } from "@/lib/utils";
import { CHIP, CHIP_OFF, CHIP_ON, ChipGroup, CodeTrace, ConsoleOutput, FOCUS_RING, StepControls, WidgetPane, useStepper } from "./shared";

// Lab 2, Exercise 2.2: x^y by repeated multiplication, traced line by line, checked against Math.pow.

const Y_RANGE = { min: -12, max: 12 };
const X_LIMIT = 100;

const PRESETS = [
  { x: 2, y: 10 },
  { x: 3, y: 4 },
  { x: 1.1, y: 10 },
  { x: 2, y: -3 },
  { x: -2, y: 5 },
  { x: 5, y: 0 },
];

interface Row {
  i: number;
  before: number;
  after: number;
}

interface PowStep {
  line: number;
  i?: number;
  result?: number;
  rows: Row[];
  note: string;
  output: string;
}

function code(x: number, y: number) {
  return [
    `double x = ${javaDouble(x)}, y = ${javaDouble(y)};`,
    "double result = 1.0;",
    "for (int i = 1; i <= Math.abs(y); i++) {",
    "    result = result * x;",
    "}",
    "if (y < 0) result = 1.0 / result;",
    'System.out.println(x + " raised to " + y + " = " + result);',
  ];
}

function trace(x: number, y: number): PowStep[] {
  const n = Math.abs(y);
  const steps: PowStep[] = [];
  const rows: Row[] = [];
  const X = javaDouble(x);

  steps.push({ line: 1, rows: [], output: "", note: `Declare the base x = ${X} and the exponent y = ${javaDouble(y)}.` });
  let result = 1;
  steps.push({ line: 2, result, rows: [], output: "", note: "Start from 1.0, the multiplicative identity, so the first multiplication gives x itself." });

  for (let i = 1; i <= n; i++) {
    const before = result;
    result = before * x;
    rows.push({ i, before, after: result });
    steps.push({
      line: 4,
      i,
      result,
      rows: [...rows],
      output: "",
      note: `i = ${i} ≤ ${n}, so the body runs: result = ${javaDouble(before)} × ${X} = ${javaDouble(result)}.`,
    });
  }

  steps.push({
    line: 3,
    i: n + 1,
    result,
    rows: [...rows],
    output: "",
    note:
      n === 0
        ? `i = 1 > 0, so the body never runs: any x to the power 0 is 1.0.`
        : `i = ${n + 1} > ${n}, so the loop exits after ${n} multiplication${n === 1 ? "" : "s"}.`,
  });

  if (y < 0) {
    const before = result;
    result = 1 / before;
    steps.push({
      line: 6,
      result,
      rows: [...rows],
      output: "",
      note: `y < 0 is true: a negative exponent means a reciprocal, result = 1.0 / ${javaDouble(before)} = ${javaDouble(result)}.`,
    });
  } else {
    steps.push({ line: 6, result, rows: [...rows], output: "", note: "y < 0 is false, so no reciprocal is taken." });
  }

  steps.push({
    line: 7,
    result,
    rows: [...rows],
    output: `${X} raised to ${javaDouble(y)} = ${javaDouble(result)}`,
    note: "String concatenation prints each double with Double.toString.",
  });
  return steps;
}

export function ExponentialEvaluator() {
  const [x, setX] = useState(2);
  const [rawX, setRawX] = useState("2");
  const [y, setY] = useState(10);
  const xId = useId();

  const choose = (p: { x: number; y: number }) => {
    setX(p.x);
    setRawX(String(p.x));
    setY(p.y);
  };

  return (
    <WidgetPane label="Exponent evaluator · x^y">
      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-muted">
          Java has no power operator. Compute <span className="font-mono text-foreground">x^y</span> by multiplying x into an
          accumulator |y| times, or call <span className="font-mono text-foreground">Math.pow(x, y)</span>.
        </p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label htmlFor={xId} className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Base x
            </label>
            <input
              id={xId}
              type="number"
              step={0.5}
              min={-X_LIMIT}
              max={X_LIMIT}
              value={rawX}
              onChange={(e) => {
                setRawX(e.target.value);
                const v = Number(e.target.value);
                if (e.target.value.trim() !== "" && Number.isFinite(v) && Math.abs(v) <= X_LIMIT) setX(v);
              }}
              onBlur={() => setRawX(String(x))}
              className={cn("h-9 w-28 rounded-lg border border-border-strong bg-surface px-3 font-mono text-[13px] tabular-nums text-foreground", FOCUS_RING)}
            />
          </div>
          <div className="min-w-48 flex-1 space-y-1">
            <p className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-muted">
              Exponent y <span className="font-mono normal-case tracking-normal text-tracer">{y}</span>
            </p>
            <input
              type="range"
              min={Y_RANGE.min}
              max={Y_RANGE.max}
              step={1}
              value={y}
              onChange={(e) => setY(Number(e.target.value))}
              aria-label="Exponent y"
              className={cn("h-9 w-full cursor-pointer accent-tracer", FOCUS_RING)}
            />
          </div>
        </div>

        <ChipGroup label="Presets">
          {PRESETS.map((p) => {
            const on = p.x === x && p.y === y;
            return (
              <button key={`${p.x}^${p.y}`} type="button" aria-pressed={on} onClick={() => choose(p)} className={cn(CHIP, on ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
                {p.x}^{p.y}
              </button>
            );
          })}
        </ChipGroup>

        <PowTrace key={`${x}|${y}`} x={x} y={y} />
      </div>
    </WidgetPane>
  );
}

function PowTrace({ x, y }: { x: number; y: number }) {
  const steps = useMemo(() => trace(x, y), [x, y]);
  const stepper = useStepper(steps.length, 1100);
  const current = steps[stepper.step];
  const done = stepper.step === stepper.last;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem]">
        <CodeTrace lines={code(x, y)} active={[current.line]} label="Loop-based power" />
        <div className="space-y-3">
          <Watch label="i" value={current.i === undefined ? "–" : String(current.i)} flash={`i${current.i}`} />
          <Watch label="result" value={current.result === undefined ? "–" : javaDouble(current.result)} flash={`r${stepper.step}`} />
        </div>
      </div>

      <p aria-live="polite" className="min-h-6 text-sm leading-relaxed text-foreground">
        {current.note}
      </p>
      <StepControls stepper={stepper} />

      <ArithmeticTable rows={current.rows} x={x} activeI={current.line === 4 ? current.i : undefined} />

      <ConsoleOutput text={current.output} running={!done} />

      <Comparison x={x} y={y} loop={done ? current.result : undefined} />
    </div>
  );
}

function Watch({ label, value, flash }: { label: string; value: string; flash: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <motion.p
        key={flash}
        initial={{ opacity: 0.3, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="break-all font-mono text-[15px] font-semibold tabular-nums text-tracer"
      >
        {value}
      </motion.p>
    </div>
  );
}

function ArithmeticTable({ rows, x, activeI }: { rows: Row[]; x: number; activeI?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <p className="border-b border-border bg-surface-muted/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Arithmetic trace
      </p>
      {rows.length === 0 ? (
        <p className="px-3 py-3 text-xs text-muted">No multiplications yet.</p>
      ) : (
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full font-mono text-[13px] tabular-nums">
            <thead className="sticky top-0 bg-surface text-left text-[11px] text-muted">
              <tr>
                <th scope="col" className="w-12 px-3 py-1.5 font-semibold">i</th>
                <th scope="col" className="px-3 py-1.5 font-semibold">result × x</th>
                <th scope="col" className="px-3 py-1.5 font-semibold">= result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.i} className={cn("border-t border-border", r.i === activeI && "bg-tracer/10")}>
                  <td className={cn("px-3 py-1", r.i === activeI ? "text-tracer" : "text-muted")}>{r.i}</td>
                  <td className="px-3 py-1 text-muted">
                    {javaDouble(r.before)} × {javaDouble(x)}
                  </td>
                  <td className={cn("px-3 py-1", r.i === activeI ? "text-tracer" : "text-foreground")}>{javaDouble(r.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Comparison({ x, y, loop }: { x: number; y: number; loop?: number }) {
  const pow = Math.pow(x, y);
  const integerBase = Number.isInteger(x);
  const xor = integerBase ? (x | 0) ^ y : undefined;
  const match = loop !== undefined && loop === pow;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Three ways to write it</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <ResultCard code="loop" value={loop === undefined ? "run the loop…" : javaDouble(loop)} tone={loop === undefined ? "neutral" : "tracer"} />
        <ResultCard code={`Math.pow(${javaDouble(x)}, ${javaDouble(y)})`} value={javaDouble(pow)} tone="success" />
        <ResultCard
          code={integerBase ? `${x} ^ ${y}` : `${javaDouble(x)} ^ ${y}`}
          value={xor === undefined ? "does not compile" : String(xor)}
          tone="danger"
        />
      </div>
      {loop !== undefined && (
        <p role="status" className={cn("flex items-start gap-2 text-xs leading-relaxed", match ? "text-success" : "text-heap")}>
          {match ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
          <span>
            {match
              ? "The loop and Math.pow agree exactly."
              : "The loop rounds after every multiplication, Math.pow rounds once, so the last digits can differ. Prefer Math.pow."}
          </span>
        </p>
      )}
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <X className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden />
        <span>
          <span className="font-mono text-foreground">^</span> is bitwise XOR on integers and is not defined for doubles at all.
        </span>
      </p>
    </div>
  );
}

const TONES = {
  neutral: "border-border bg-surface text-muted",
  tracer: "border-tracer/40 bg-tracer/[0.06] text-tracer",
  success: "border-success/40 bg-success/[0.06] text-success",
  danger: "border-danger/40 bg-danger/[0.06] text-danger",
};

function ResultCard({ code, value, tone }: { code: string; value: string; tone: keyof typeof TONES }) {
  return (
    <div className={cn("min-w-0 space-y-1 rounded-xl border p-3", TONES[tone])}>
      <p className="truncate font-mono text-xs text-muted" title={code}>
        {code}
      </p>
      <p className="break-all font-mono text-[15px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}
