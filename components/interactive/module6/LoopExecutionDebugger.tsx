"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flag } from "lucide-react";
import {
  CodeTrace,
  ConsoleOutput,
  FOCUS_RING,
  StepControls,
  WidgetPane,
  useStepper,
  useWidgetTabs,
} from "@/components/interactive/module1/shared";
import { formatFixed } from "@/lib/java-format";
import { cn } from "@/lib/utils";

// Lab 6: step through while, do-while and counter-controlled for loops, then SentinelValue.java,
// watching every variable, each condition check and the console.

type LoopKind = "while" | "do-while" | "for" | "sentinel";

const TABS = [
  { id: "while", label: "while" },
  { id: "do-while", label: "do-while" },
  { id: "for", label: "for" },
  { id: "sentinel", label: "Sentinel" },
] as const satisfies readonly { id: LoopKind; label: string }[];

/** null marks a variable whose scope has ended. */
type Vars = Record<string, string | null>;

interface LoopStep {
  line: number;
  vars: Vars;
  changed: string[];
  note: string;
  output: string;
  iteration: number;
  cond?: { expr: string; values: string; value: boolean };
  consumed: number;
}

interface Program {
  lines: string[];
  steps: LoopStep[];
}

/** Records one snapshot per executed line. */
function recorder() {
  const steps: LoopStep[] = [];
  let vars: Vars = {};
  let output = "";
  let iteration = 0;
  let consumed = 0;

  return {
    steps,
    step(
      line: number,
      note: string,
      opts: { set?: Vars; print?: string; cond?: LoopStep["cond"]; iterate?: boolean; read?: boolean } = {},
    ) {
      const changed = Object.keys(opts.set ?? {}).filter((k) => opts.set![k] !== vars[k]);
      vars = { ...vars, ...opts.set };
      if (opts.print) output += opts.print;
      if (opts.iterate) iteration++;
      if (opts.read) consumed++;
      steps.push({ line, vars, changed, note, output, iteration, cond: opts.cond, consumed });
    },
  };
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

function whileProgram(start: number, limit: number): Program {
  const lines = [`int i = ${start};`, `while (i <= ${limit}) {`, '    System.out.print(i + " ");', "    i++;", "}", 'System.out.println("done");'];
  const r = recorder();
  let i = start;
  r.step(1, `Initialise the loop variable: i = ${i}.`, { set: { i: String(i) } });
  for (;;) {
    const ok = i <= limit;
    r.step(2, ok ? "Pre-test passes, so the body runs." : "Pre-test fails, so control skips past the loop body.", {
      cond: { expr: `i <= ${limit}`, values: `${i} <= ${limit}`, value: ok },
    });
    if (!ok) break;
    r.step(3, `Print the current value of i.`, { print: `${i} `, iterate: true });
    i++;
    r.step(4, `Update: i becomes ${i}. Without this the condition could never become false.`, { set: { i: String(i) } });
  }
  const runs = r.steps.at(-1)!.iteration;
  r.step(6, runs === 0 ? "The body ran zero times: a while loop checks before every pass, including the first." : `The loop ran ${runs} time${runs === 1 ? "" : "s"}.`, {
    print: "done\n",
  });
  return { lines, steps: r.steps };
}

function doWhileProgram(start: number, limit: number): Program {
  const lines = [`int i = ${start};`, "do {", '    System.out.print(i + " ");', "    i++;", `} while (i <= ${limit});`, 'System.out.println("done");'];
  const r = recorder();
  let i = start;
  r.step(1, `Initialise the loop variable: i = ${i}.`, { set: { i: String(i) } });
  r.step(2, "Enter the body without checking anything: do-while is a post-test loop.");
  for (;;) {
    r.step(3, "Print the current value of i.", { print: `${i} `, iterate: true });
    i++;
    r.step(4, `Update: i becomes ${i}.`, { set: { i: String(i) } });
    const ok = i <= limit;
    r.step(5, ok ? "Post-test passes, so control jumps back to the top of the body." : "Post-test fails, so the loop ends.", {
      cond: { expr: `i <= ${limit}`, values: `${i} <= ${limit}`, value: ok },
    });
    if (!ok) break;
  }
  const runs = r.steps.at(-1)!.iteration;
  r.step(6, start > limit ? `The body ran once even though ${start} <= ${limit} was false from the start.` : `The loop ran ${runs} time${runs === 1 ? "" : "s"}.`, {
    print: "done\n",
  });
  return { lines, steps: r.steps };
}

function forProgram(n: number): Program {
  const lines = ["int sum = 0;", `for (int k = 1; k <= ${n}; k++) {`, "    sum += k;", "}", "System.out.println(sum);"];
  const r = recorder();
  let sum = 0;
  let k = 1;
  r.step(1, "The accumulator starts at 0.", { set: { sum: "0" } });
  r.step(2, "Initialisation runs exactly once: k = 1.", { set: { k: "1" } });
  for (;;) {
    const ok = k <= n;
    r.step(2, ok ? "Condition passes, so the body runs." : "Condition fails: the loop ends and k goes out of scope.", {
      cond: { expr: `k <= ${n}`, values: `${k} <= ${n}`, value: ok },
      set: ok ? undefined : { k: null },
    });
    if (!ok) break;
    const before = sum;
    sum += k;
    r.step(3, `sum = ${before} + ${k} = ${sum}.`, { set: { sum: String(sum) }, iterate: true });
    k++;
    r.step(2, `Update runs after the body: k++ makes k = ${k}.`, { set: { k: String(k) } });
  }
  const gauss = (n * (n + 1)) / 2;
  r.step(5, `Prints ${sum}. Check with the closed form: ${n}(${n} + 1) / 2 = ${gauss}.`, { print: `${sum}\n` });
  return { lines, steps: r.steps };
}

const SENTINEL = -1;
const PROMPT = `Enter a number (${SENTINEL} to stop): `;

function sentinelProgram(tokens: number[]): Program {
  const lines = [
    "int sum = 0, count = 0;",
    `System.out.print("${PROMPT}");`,
    "int number = input.nextInt();",
    `while (number != ${SENTINEL}) {`,
    "    sum += number;",
    "    count++;",
    `    System.out.print("${PROMPT}");`,
    "    number = input.nextInt();",
    "}",
    "if (count == 0) {",
    '    System.out.println("No numbers were entered.");',
    "} else {",
    '    System.out.println("Sum: " + sum);',
    '    System.out.printf("Average: %.2f%n", (double) sum / count);',
    "}",
  ];
  const r = recorder();
  let sum = 0;
  let count = 0;
  let next = 0;
  const read = () => tokens[next++];

  r.step(1, "Both totals start at 0.", { set: { sum: "0", count: "0" } });
  r.step(2, "Prompt for the first value.", { print: PROMPT });
  let number = read();
  r.step(3, `Priming read: number = ${number}. The loop needs a value before its first check.`, {
    set: { number: String(number) },
    print: `${number}\n`,
    read: true,
  });

  for (;;) {
    const ok = number !== SENTINEL;
    r.step(4, ok ? `${number} is real data, so process it.` : "The sentinel arrived, so the loop stops without adding it.", {
      cond: { expr: `number != ${SENTINEL}`, values: `${number} != ${SENTINEL}`, value: ok },
    });
    if (!ok) break;
    const before = sum;
    sum += number;
    r.step(5, `sum = ${before} + ${number} = ${sum}.`, { set: { sum: String(sum) }, iterate: true });
    count++;
    r.step(6, `count = ${count}.`, { set: { count: String(count) } });
    r.step(7, "Prompt for the next value.", { print: PROMPT });
    number = read();
    r.step(8, `Read again at the bottom of the body: number = ${number}.`, {
      set: { number: String(number) },
      print: `${number}\n`,
      read: true,
    });
  }

  const empty = count === 0;
  r.step(10, empty ? "count is 0: the very first value was the sentinel." : `count is ${count}, so it is safe to divide.`, {
    cond: { expr: "count == 0", values: `${count} == 0`, value: empty },
  });
  if (empty) {
    r.step(11, "Guarding count == 0 avoids dividing by zero.", { print: "No numbers were entered.\n" });
  } else {
    r.step(13, "Print the sum.", { print: `Sum: ${sum}\n` });
    const avg = sum / count;
    r.step(14, `Cast before dividing: (double) ${sum} / ${count} = ${avg}, printed to 2 decimals.`, {
      print: `Average: ${formatFixed(avg, 2)}\n`,
    });
  }
  return { lines, steps: r.steps };
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

const INTRO: Record<LoopKind, string> = {
  while: "Pre-test loop: the condition is checked before every pass, so the body may run zero times.",
  "do-while": "Post-test loop: the body runs first and the condition is checked after, so it always runs at least once.",
  for: "Counter-controlled loop: initialisation, condition and update sit together in the header.",
  sentinel: `SentinelValue.java: read integers until ${SENTINEL}, then print their sum and average. ${SENTINEL} is the sentinel and is never counted.`,
};

const MAX_TOKENS = 10;

function parseTokens(raw: string) {
  const parts = raw.split(/[\s,]+/).filter(Boolean);
  const bad = parts.find((p) => !/^-?\d{1,6}$/.test(p));
  if (bad) return { error: `"${bad}" is not an int nextInt() can read.` };
  const all = parts.map(Number).slice(0, MAX_TOKENS);
  const appended = !all.includes(SENTINEL);
  const tokens = appended ? [...all, SENTINEL] : all;
  return { tokens, appended };
}

export function LoopExecutionDebugger() {
  const tabs = useWidgetTabs(TABS, "while");
  const [range, setRange] = useState({ start: 1, limit: 5 });
  const [n, setN] = useState(5);
  const [raw, setRaw] = useState("5 8 0 -1 7");
  const inputId = useId();

  const kind = tabs.active;
  const parsed = useMemo(() => parseTokens(raw), [raw]);
  const tokens = parsed.tokens;

  const program = useMemo(() => {
    if (kind === "while") return whileProgram(range.start, range.limit);
    if (kind === "do-while") return doWhileProgram(range.start, range.limit);
    if (kind === "for") return forProgram(n);
    return tokens ? sentinelProgram(tokens) : undefined;
  }, [kind, range, n, tokens]);

  const traceKey = `${kind}|${range.start}|${range.limit}|${n}|${tokens?.join(",")}`;

  return (
    <WidgetPane label="Loop debugger" actions={tabs.tablist("Loop kind")}>
      <div {...tabs.panelProps} className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-muted">{INTRO[kind]}</p>

        {(kind === "while" || kind === "do-while") && (
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <IntStepper label="start" value={range.start} min={0} max={10} onChange={(v) => setRange((r) => ({ ...r, start: v }))} />
            <IntStepper label="limit" value={range.limit} min={0} max={8} onChange={(v) => setRange((r) => ({ ...r, limit: v }))} />
            {range.start > range.limit && (
              <p className="self-center text-xs text-heap">
                start &gt; limit: compare the {kind === "while" ? "do-while" : "while"} tab with the same values.
              </p>
            )}
          </div>
        )}

        {kind === "for" && <IntStepper label="n" value={n} min={0} max={10} onChange={setN} />}

        {kind === "sentinel" && (
          <div className="space-y-2">
            <label htmlFor={inputId} className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Keyboard input (space separated, up to {MAX_TOKENS})
            </label>
            <input
              id={inputId}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              spellCheck={false}
              aria-invalid={!!parsed.error}
              className={cn(
                "h-9 w-full rounded-lg border bg-surface px-3 font-mono text-[13px] tabular-nums text-foreground",
                parsed.error ? "border-danger/60" : "border-border-strong",
                FOCUS_RING,
              )}
            />
            {parsed.error && <p className="text-xs text-danger">{parsed.error}</p>}
            {parsed.appended && (
              <p className="text-xs text-muted">
                No {SENTINEL} in the input, so a sentinel {SENTINEL} was appended to end the loop.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {[
                ["5 8 0 -1 7", "Mixed values"],
                ["-1", "Sentinel first"],
                ["10 20 30 -1", "Three scores"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRaw(value)}
                  className={cn("h-8 rounded-lg border border-border bg-surface px-2.5 text-xs text-muted hover:bg-surface-muted hover:text-foreground", FOCUS_RING)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {program && <LoopTrace key={traceKey} program={program} tokens={kind === "sentinel" ? tokens : undefined} />}
      </div>
    </WidgetPane>
  );
}

function LoopTrace({ program, tokens }: { program: Program; tokens?: number[] }) {
  const stepper = useStepper(program.steps.length, 900);
  const current = program.steps[stepper.step];
  const done = stepper.step === stepper.last;

  return (
    <div className="space-y-4">
      {tokens && <InputTape tokens={tokens} consumed={current.consumed} />}

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
        <CodeTrace lines={program.lines} active={[current.line]} label="Program" />
        <WatchPanel step={current} />
      </div>

      <p aria-live="polite" className="min-h-6 text-sm leading-relaxed text-foreground">
        {current.note}
      </p>
      <StepControls stepper={stepper} />
      <ConsoleOutput text={current.output} running={!done} />
    </div>
  );
}

function WatchPanel({ step }: { step: LoopStep }) {
  const names = Object.keys(step.vars);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface">
        <p className="flex items-center justify-between border-b border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Variables
          <span className="font-mono normal-case tracking-normal tabular-nums">pass {step.iteration}</span>
        </p>
        {names.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted">None declared yet.</p>
        ) : (
          <dl className="divide-y divide-border">
            {names.map((name) => {
              const value = step.vars[name];
              const changed = step.changed.includes(name);
              return (
                <div key={name} className={cn("flex items-center justify-between gap-2 px-3 py-1.5 font-mono text-[13px] transition-colors", changed && "bg-tracer/10")}>
                  <dt className={value === null ? "text-muted line-through" : "text-muted"}>{name}</dt>
                  <dd>
                    {value === null ? (
                      <span className="font-sans text-xs text-muted">out of scope</span>
                    ) : (
                      <motion.span
                        key={`${name}-${value}`}
                        initial={changed ? { opacity: 0.3, y: -2 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn("inline-block font-semibold tabular-nums", changed ? "text-tracer" : "text-foreground")}
                      >
                        {value}
                      </motion.span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>

      {step.cond && (
        <div className={cn("rounded-xl border p-3", step.cond.value ? "border-tracer/40 bg-tracer/[0.06]" : "border-heap/50 bg-heap/[0.06]")}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Condition</p>
          <p className="mt-1 font-mono text-[13px] text-foreground">{step.cond.expr}</p>
          <p className="font-mono text-xs text-muted">
            {step.cond.values} →{" "}
            <span className={cn("font-semibold", step.cond.value ? "text-tracer" : "text-heap")}>{String(step.cond.value)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function InputTape({ tokens, consumed }: { tokens: number[]; consumed: number }) {
  const sentinelAt = tokens.indexOf(SENTINEL);
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Input stream</p>
      <ol className="flex flex-wrap gap-1.5" aria-label={`Input stream, ${consumed} of ${tokens.length} values read`}>
        {tokens.map((t, i) => {
          const read = i < consumed;
          const latest = i === consumed - 1;
          const sentinel = i === sentinelAt;
          const unreachable = i > sentinelAt;
          return (
            <li
              key={i}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border px-2 font-mono text-[13px] tabular-nums transition-colors",
                unreachable
                  ? "border-dashed border-border text-muted/50"
                  : sentinel
                    ? read
                      ? "border-danger/50 bg-danger/10 text-danger"
                      : "border-danger/30 text-danger/70"
                    : latest
                      ? "border-tracer/50 bg-tracer/10 text-tracer glow-tracer"
                      : read
                        ? "border-border bg-surface-muted text-muted"
                        : "border-border-strong bg-surface text-foreground",
              )}
              title={unreachable ? "Never read: the sentinel ended the loop first" : sentinel ? "Sentinel" : undefined}
            >
              {sentinel && <Flag className="size-3" aria-hidden />}
              {t}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function IntStepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const button = cn(
    "inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
    FOCUS_RING,
  );
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1.5">
      <span className="w-12 font-mono text-[13px] text-muted">{label}</span>
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={button}>
        −
      </button>
      <span aria-live="polite" className="w-8 text-center font-mono text-[15px] font-semibold tabular-nums text-tracer">
        {value}
      </span>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={button}>
        +
      </button>
    </div>
  );
}
