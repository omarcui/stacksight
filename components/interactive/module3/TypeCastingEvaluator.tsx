"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowRight, CheckCircle2, Scissors } from "lucide-react";
import { FOCUS_RING, WidgetPane } from "@/components/interactive/module1/shared";
import { javaDouble as javaDecimal } from "@/lib/java-format";
import { cn } from "@/lib/utils";

type Mode = "widening" | "narrowing";
type WideTarget = "long" | "float" | "double";
type NarrowTarget = "int" | "long" | "short" | "byte" | "char";

const BITS: Record<string, number> = { byte: 8, short: 16, char: 16, int: 32, long: 64, float: 32, double: 64 };

const CHIP = "h-9 rounded-lg border px-3 font-mono text-xs transition-colors";
const CHIP_ON = "border-tracer/50 bg-tracer/10 text-tracer";
const CHIP_OFF = "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground";

// ---------------------------------------------------------------------------
// Java-style number printing (Float.toString; Double.toString lives in lib/java-format.ts).
// ---------------------------------------------------------------------------

/** Shortest decimal that reads back as the same float, printed the way Java does. */
function javaFloat(x: number) {
  const f = Math.fround(x);
  if (!Number.isFinite(f)) return javaDecimal(f);
  for (let p = 1; p <= 9; p++) {
    const candidate = Number(f.toPrecision(p));
    if (Math.fround(candidate) === f) return javaDecimal(candidate);
  }
  return javaDecimal(f);
}

function trimFraction(x: number) {
  return String(Number(x.toFixed(6)));
}

function charLabel(code: number) {
  const printable = code >= 32 && code <= 126;
  return printable ? `'${String.fromCharCode(code)}'` : `'\\u${code.toString(16).toUpperCase().padStart(4, "0")}'`;
}

export function TypeCastingEvaluator() {
  const [mode, setMode] = useState<Mode>("narrowing");
  const baseId = useId();
  const modes: Mode[] = ["widening", "narrowing"];

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = mode === "widening" ? "narrowing" : "widening";
    setMode(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <WidgetPane
      label="Type casting"
      actions={
        <div role="tablist" aria-label="Conversion kind" className="flex gap-1">
          {modes.map((m) => (
            <button
              key={m}
              id={`${baseId}-tab-${m}`}
              type="button"
              role="tab"
              aria-selected={mode === m}
              aria-controls={`${baseId}-panel`}
              tabIndex={mode === m ? 0 : -1}
              onClick={() => setMode(m)}
              onKeyDown={onTabKey}
              className={cn(
                "h-8 rounded-lg px-2.5 text-xs font-medium capitalize transition-colors",
                mode === m ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-muted hover:text-foreground",
                FOCUS_RING,
              )}
            >
              {m}
            </button>
          ))}
        </div>
      }
    >
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${mode}`} className="space-y-4 p-4">
        {mode === "widening" ? <Widening /> : <Narrowing />}
      </div>
    </WidgetPane>
  );
}

// ---------------------------------------------------------------------------
// Widening: int → long / float / double, no cast needed.
// ---------------------------------------------------------------------------

const INT_PRESETS = [42, -7, 16777217];
const WIDE_TARGETS: WideTarget[] = ["long", "float", "double"];

const WIDEN_CHAIN = ["byte", "short", "int", "long", "float", "double"];

function Widening() {
  const [source, setSource] = useState(42);
  const [target, setTarget] = useState<WideTarget>("double");

  const printed = target === "long" ? String(source) : target === "float" ? javaFloat(source) : javaDecimal(source);
  const lossy = target === "float" && Math.fround(source) !== source;
  const varName = target === "long" ? "n" : target === "float" ? "f" : "d";

  return (
    <>
      <p className="text-sm leading-relaxed text-muted">
        Moving to a wider type happens automatically: every value of the smaller type has a place in the larger one,
        so no cast is written.
      </p>

      <Chain from="int" to={target} />

      <div className="grid gap-3 sm:grid-cols-2">
        <ChipGroup label="int value">
          {INT_PRESETS.map((v) => (
            <button key={v} type="button" aria-pressed={source === v} onClick={() => setSource(v)} className={cn(CHIP, source === v ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
              {v}
            </button>
          ))}
        </ChipGroup>
        <ChipGroup label="Target type">
          {WIDE_TARGETS.map((t) => (
            <button key={t} type="button" aria-pressed={target === t} onClick={() => setTarget(t)} className={cn(CHIP, target === t ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
              {t}
            </button>
          ))}
        </ChipGroup>
      </div>

      <Pipeline
        source={<StageCard eyebrow="Source" code={`int i = ${source};`} value={String(source)} bits={32} />}
        conversion={<ConversionTag tone="success">implicit</ConversionTag>}
        result={
          <StageCard
            eyebrow="Result"
            code={`${target} ${varName} = i;`}
            value={printed}
            bits={BITS[target]}
            tone={lossy ? "heap" : "tracer"}
            flashKey={`${source}-${target}`}
          />
        }
      />

      <Verdict tone={lossy ? "heap" : "success"}>
        {lossy ? (
          <>
            <span className="font-semibold text-heap">Legal, but rounded.</span> A float keeps only 24 bits of precision, so{" "}
            {source.toLocaleString("en-US")} becomes {Math.fround(source).toLocaleString("en-US")}. Widening never needs a
            cast, yet int → float and long → float or double can still drop low digits.
          </>
        ) : (
          <>
            <span className="font-semibold text-success">Lossless.</span> {target} can hold every int exactly, so the value
            is unchanged{target !== "long" && ", only printed as a decimal"}.
          </>
        )}
      </Verdict>
    </>
  );
}

/** The widening order, with the active source → target path lit. */
function Chain({ from, to }: { from: string; to: string }) {
  const a = WIDEN_CHAIN.indexOf(from);
  const b = WIDEN_CHAIN.indexOf(to);
  return (
    <div className="overflow-x-auto scrollbar-none">
      <ol className="flex min-w-max items-center gap-1.5" aria-label={`Widening order, ${from} to ${to}`}>
        {WIDEN_CHAIN.map((t, i) => {
          const onPath = i >= a && i <= b;
          return (
            <li key={t} className="flex items-center gap-1.5">
              {i > 0 && <ArrowRight className={cn("size-3.5", i > a && i <= b ? "text-tracer" : "text-border-strong")} aria-hidden />}
              <span
                className={cn(
                  "inline-flex h-7 items-center rounded-full border px-2.5 font-mono text-xs",
                  i === a || i === b ? "border-tracer/50 bg-tracer/10 text-tracer" : onPath ? "border-tracer/30 text-foreground" : "border-border text-muted",
                )}
              >
                {t}
              </span>
            </li>
          );
        })}
        <li className="ml-2 text-xs text-muted">
          <span className="font-mono">char</span> joins at <span className="font-mono">int</span>
        </li>
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Narrowing: double → integer types, requires an explicit cast.
// ---------------------------------------------------------------------------

const DOUBLE_PRESETS = [7.9, -7.9, 0.5, 300.7, 3e9];
const NARROW_TARGETS: NarrowTarget[] = ["int", "long", "short", "byte", "char"];
const SLIDER = { min: -20, max: 20, step: 0.1 };

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const LONG_MIN = -(BigInt(2) ** BigInt(63));
const LONG_MAX = BigInt(2) ** BigInt(63) - BigInt(1);

interface CastStep {
  label: string;
  from: string;
  to: string;
}

/** JLS 5.1.3: round toward zero (clamping to int or long), then keep the low bits for byte, short and char. */
function narrow(x: number, target: NarrowTarget) {
  const steps: CastStep[] = [];
  const truncated = Math.trunc(x);
  if (truncated !== x) steps.push({ label: "Truncate toward zero", from: javaDecimal(x), to: String(truncated) });

  if (target === "long") {
    let n = BigInt(truncated);
    if (n > LONG_MAX || n < LONG_MIN) {
      const clamped = n > LONG_MAX ? LONG_MAX : LONG_MIN;
      steps.push({ label: "Clamp to long range", from: n.toString(), to: clamped.toString() });
      n = clamped;
    }
    return { steps, value: Number(n), printed: n.toString() };
  }

  let i = truncated;
  if (i > INT_MAX || i < INT_MIN) {
    const clamped = i > INT_MAX ? INT_MAX : INT_MIN;
    steps.push({ label: "Clamp to int range", from: String(i), to: String(clamped) });
    i = clamped;
  }
  if (target === "int") return { steps, value: i, printed: String(i) };

  const bits = BITS[target];
  const mod = 2 ** bits;
  const unsigned = ((i % mod) + mod) % mod;
  const wrapped = target === "char" || unsigned < mod / 2 ? unsigned : unsigned - mod;
  if (wrapped !== i) steps.push({ label: `Keep the low ${bits} bits`, from: String(i), to: String(wrapped) });
  const printed = target === "char" ? `${charLabel(wrapped)} (${wrapped})` : String(wrapped);
  return { steps, value: wrapped, printed };
}

function Narrowing() {
  const [value, setValue] = useState(7.9);
  const [raw, setRaw] = useState("7.9");
  const [target, setTarget] = useState<NarrowTarget>("int");
  const inputId = useId();

  const set = (v: number) => {
    setValue(v);
    setRaw(String(v));
  };

  const result = narrow(value, target);
  const varName = target === "long" ? "n" : target[0];
  const lossless = result.steps.length === 0;

  return (
    <>
      <p className="text-sm leading-relaxed text-muted">
        Going to a narrower type can lose information, so Java makes you write the cast. A floating-point value cast
        to an integer type is <span className="text-foreground">truncated toward zero</span>, never rounded.
      </p>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor={inputId} className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              double d
            </label>
            <input
              id={inputId}
              type="number"
              step={SLIDER.step}
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                const n = Number(e.target.value);
                if (e.target.value.trim() !== "" && Number.isFinite(n)) setValue(n);
              }}
              onBlur={() => setRaw(String(value))}
              className={cn("h-9 w-32 rounded-lg border border-border-strong bg-surface px-3 font-mono text-[13px] tabular-nums text-foreground", FOCUS_RING)}
            />
          </div>
          <ChipGroup label="Presets">
            {DOUBLE_PRESETS.map((v) => (
              <button key={v} type="button" aria-pressed={value === v} onClick={() => set(v)} className={cn(CHIP, value === v ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
                {javaDecimal(v)}
              </button>
            ))}
          </ChipGroup>
        </div>
        <input
          type="range"
          min={SLIDER.min}
          max={SLIDER.max}
          step={SLIDER.step}
          value={Math.min(SLIDER.max, Math.max(SLIDER.min, value))}
          onChange={(e) => set(Number(Number(e.target.value).toFixed(1)))}
          aria-label="Value of d"
          aria-valuetext={javaDecimal(value)}
          className={cn("h-9 w-full cursor-pointer accent-tracer", FOCUS_RING)}
        />
        <ChipGroup label="Cast to">
          {NARROW_TARGETS.map((t) => (
            <button key={t} type="button" aria-pressed={target === t} onClick={() => setTarget(t)} className={cn(CHIP, target === t ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
              ({t})
            </button>
          ))}
        </ChipGroup>
      </div>

      <Pipeline
        source={<StageCard eyebrow="Source" code={`double d = ${javaDecimal(value)};`} value={javaDecimal(value)} bits={64} />}
        conversion={<ConversionTag tone="danger">explicit ({target})</ConversionTag>}
        result={
          <StageCard
            eyebrow="Result"
            code={`${target} ${varName} = (${target}) d;`}
            value={result.printed}
            bits={BITS[target]}
            tone="tracer"
            flashKey={`${value}-${target}`}
          />
        }
      />

      {result.steps.length > 0 && (
        <ol className="space-y-1.5" aria-label="Conversion steps">
          {result.steps.map((s, i) => (
            <li key={s.label} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-surface-muted/50 px-3 py-2 text-xs">
              <span className="font-mono tabular-nums text-muted">{i + 1}.</span>
              <span className="font-medium text-foreground">{s.label}</span>
              <span className="ml-auto font-mono tabular-nums text-muted">
                {s.from} <ArrowRight className="inline size-3" aria-hidden /> <span className="text-tracer">{s.to}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <TruncationBar value={value} />

      <Verdict tone={lossless ? "success" : "danger"}>
        {lossless ? (
          <>
            <span className="font-semibold text-success">Nothing lost.</span> {javaDecimal(value)} is a whole number that fits
            in a {target}, so the cast only changes the type.
          </>
        ) : (
          <>
            <span className="font-semibold text-danger">Information lost.</span> The cast compiles because you asked for it
            explicitly; without <span className="font-mono">({target})</span>, javac reports{" "}
            <span className="font-mono">possible lossy conversion from double to {target}</span>.
          </>
        )}
      </Verdict>
    </>
  );
}

const STRIPES = "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--color-danger) 30%, transparent) 6px 8px)";

/** One unit cell between the kept integer and the next one; the striped part is the discarded fraction. */
function TruncationBar({ value }: { value: number }) {
  const kept = Math.trunc(value);
  const fraction = Math.abs(value - kept);
  const negative = value < 0;
  const left = negative ? kept - 1 : kept;
  const right = negative ? kept : kept + 1;
  const pct = fraction * 100;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Scissors className="size-3.5" aria-hidden />
          Fraction truncated
        </p>
        <span className="font-mono text-xs tabular-nums text-muted">Math.round(d) = {Math.round(value)}</span>
      </div>

      <div className="relative h-9 overflow-hidden rounded-lg border border-border bg-surface" role="img" aria-label={`${javaDecimal(value)}: keeps ${kept}, discards ${trimFraction(fraction)}`}>
        <motion.div
          className="absolute inset-y-0 bg-danger/15"
          style={{ ...(negative ? { right: 0 } : { left: 0 }), backgroundImage: STRIPES }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
        />
        <motion.div
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-tracer glow-tracer"
          animate={{ left: `${negative ? 100 - pct : pct}%` }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
        />
      </div>

      <div className="flex justify-between font-mono text-[11px] tabular-nums">
        <span className={negative ? "text-muted" : "text-success"}>{left}</span>
        <span className={negative ? "text-success" : "text-muted"}>{right}</span>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        {fraction === 0 ? (
          <>No fractional part, so nothing is cut off.</>
        ) : (
          <>
            Kept <span className="font-mono text-success">{kept}</span>, discarded{" "}
            <span className="font-mono text-danger">{negative ? "-" : ""}{trimFraction(fraction)}</span>. The cut always moves
            toward zero{negative && ", so a negative value goes up, not down"}.
          </>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
        {children}
      </div>
    </div>
  );
}

function Pipeline({ source, conversion, result }: { source: ReactNode; conversion: ReactNode; result: ReactNode }) {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">{source}</div>
      <div className="flex shrink-0 flex-col items-center gap-1 text-muted">
        {conversion}
        <ArrowRight className="hidden size-4 sm:block" aria-hidden />
        <ArrowDown className="size-4 sm:hidden" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">{result}</div>
    </div>
  );
}

function ConversionTag({ tone, children }: { tone: "success" | "danger"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 font-mono text-xs font-medium",
        tone === "success" ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger",
      )}
    >
      {children}
    </span>
  );
}

function StageCard({
  eyebrow,
  code,
  value,
  bits,
  tone = "neutral",
  flashKey,
}: {
  eyebrow: string;
  code: string;
  value: string;
  bits: number;
  tone?: "neutral" | "tracer" | "heap";
  flashKey?: string;
}) {
  return (
    <div className={cn("space-y-2 rounded-xl border p-3", tone === "heap" ? "border-heap/50 bg-heap/[0.06]" : "border-border bg-surface")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{eyebrow}</p>
        <span className="text-xs tabular-nums text-muted">{bits} bits</span>
      </div>
      <p className="overflow-x-auto whitespace-nowrap rounded-lg bg-code px-2 py-1 font-mono text-[13px] leading-6 text-foreground">{code}</p>
      <motion.p
        key={flashKey}
        initial={flashKey ? { opacity: 0.3, y: -2 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "break-all font-mono text-[15px] font-semibold tabular-nums",
          tone === "tracer" ? "text-tracer" : tone === "heap" ? "text-heap" : "text-foreground",
        )}
      >
        {value}
      </motion.p>
      <div className="h-1.5 rounded-full bg-surface-muted" aria-hidden>
        <div className="h-full rounded-full bg-stack/60" style={{ width: `${(bits / 64) * 100}%` }} />
      </div>
    </div>
  );
}

function Verdict({ tone, children }: { tone: "success" | "heap" | "danger"; children: ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-xl border p-3 text-sm leading-relaxed text-foreground",
        tone === "success" && "border-success/40 bg-success/[0.06]",
        tone === "heap" && "border-heap/50 bg-heap/[0.06]",
        tone === "danger" && "border-danger/40 bg-danger/[0.06]",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "success" ? "text-success" : tone === "heap" ? "text-heap" : "text-danger")} aria-hidden />
      <p>{children}</p>
    </div>
  );
}
