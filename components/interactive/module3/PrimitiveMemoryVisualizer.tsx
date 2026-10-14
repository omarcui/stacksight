"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Minus, Plus } from "lucide-react";
import { FOCUS_RING, WidgetPane } from "@/components/interactive/module1/shared";
import { cn } from "@/lib/utils";

type PrimitiveName = "byte" | "short" | "int" | "long" | "float" | "double" | "boolean" | "char";
type Family = "Integer" | "Floating point" | "Logical" | "Character";

interface Primitive {
  name: PrimitiveName;
  family: Family;
  bits: number;
  /** Bytes drawn in the memory strip. */
  bytes: number;
  range: string;
  defaultValue: string;
  note: string;
}

const PRIMITIVES: Primitive[] = [
  { name: "byte", family: "Integer", bits: 8, bytes: 1, range: "[-128, 127]", defaultValue: "0", note: "Smallest signed integer. Handy for raw binary data and large arrays." },
  { name: "short", family: "Integer", bits: 16, bytes: 2, range: "[-32,768, 32,767]", defaultValue: "0", note: "Signed 16-bit integer. Rarely needed outside memory-tight arrays." },
  { name: "int", family: "Integer", bits: 32, bytes: 4, range: "[-2³¹, 2³¹ − 1]", defaultValue: "0", note: "The default type of an integer literal such as `42`." },
  { name: "long", family: "Integer", bits: 64, bytes: 8, range: "[-2⁶³, 2⁶³ − 1]", defaultValue: "0L", note: "Needs the `L` suffix once a literal no longer fits in an int." },
  { name: "float", family: "Floating point", bits: 32, bytes: 4, range: "±3.4 × 10³⁸", defaultValue: "0.0f", note: "About 7 significant digits. Literals need the `f` suffix." },
  { name: "double", family: "Floating point", bits: 64, bytes: 8, range: "±1.8 × 10³⁰⁸", defaultValue: "0.0", note: "About 15–16 significant digits. The default type of `3.14`." },
  { name: "boolean", family: "Logical", bits: 1, bytes: 1, range: "true | false", defaultValue: "false", note: "Holds one bit of information; its storage size is left to the JVM." },
  { name: "char", family: "Character", bits: 16, bytes: 2, range: "[0, 65,535]", defaultValue: "'\\u0000'", note: "An unsigned UTF-16 code unit, so it can never be negative." },
];

const MAX_BYTES = 8;

const WRAPPER: Record<string, string> = {
  byte: "Byte",
  short: "Short",
  int: "Integer",
  long: "Long",
  char: "Character",
};

const VAR_NAME: Record<string, string> = { byte: "b", short: "s", int: "i", long: "n", char: "c" };

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

export function PrimitiveMemoryVisualizer() {
  const [selected, setSelected] = useState<PrimitiveName>("byte");
  const type = PRIMITIVES.find((p) => p.name === selected)!;

  return (
    <WidgetPane label="Primitive memory" actions={<span className="font-mono text-xs text-muted">8 primitive types</span>}>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Primitive types">
          {PRIMITIVES.map((p) => {
            const on = p.name === selected;
            return (
              <button
                key={p.name}
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(p.name)}
                className={cn(
                  "space-y-2 rounded-xl border p-3 text-left transition-colors",
                  on ? "border-tracer/50 bg-tracer/[0.06]" : "border-border bg-surface hover:bg-surface-muted",
                  FOCUS_RING,
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className={cn("font-mono text-[13px] font-semibold", on ? "text-tracer" : "text-foreground")}>{p.name}</span>
                  <span className="text-xs tabular-nums text-muted">{p.name === "boolean" ? "1 bit*" : `${p.bits} bits`}</span>
                </div>
                <ByteStrip bytes={p.bytes} active={on} dashed={p.name === "boolean"} />
                <p className="text-[11px] text-muted">{p.family}</p>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface-muted/40 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-semibold text-foreground">{type.name}</span>
            <Pill>{type.name === "boolean" ? "JVM-defined size" : `${type.bytes} byte${type.bytes > 1 ? "s" : ""} · ${type.bits} bits`}</Pill>
            <Pill>range {type.range}</Pill>
            <Pill>default {type.defaultValue}</Pill>
          </div>
          <p className="text-sm leading-relaxed text-muted">{inline(type.note)}</p>

          {type.family === "Integer" || type.family === "Character" ? (
            <RangeExplorer key={type.name} type={type} />
          ) : type.family === "Floating point" ? (
            <FloatLayout key={type.name} type={type} />
          ) : (
            <BooleanCell />
          )}
        </div>
      </div>
    </WidgetPane>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-border bg-surface px-2.5 font-mono text-xs text-muted">
      {children}
    </span>
  );
}

/** Eight byte slots; the type fills as many as it occupies. */
function ByteStrip({ bytes, active, dashed }: { bytes: number; active: boolean; dashed?: boolean }) {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: MAX_BYTES }, (_, i) => {
        const used = i < bytes;
        return (
          <span
            key={i}
            className={cn(
              "h-3 flex-1 rounded-[3px] border transition-colors",
              !used && "border-dashed border-border bg-transparent",
              used && dashed && "border-dashed border-stack/50 bg-stack/10",
              used && !dashed && (active ? "border-stack/60 bg-stack/40" : "border-stack/40 bg-stack/20"),
            )}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Integer and char types: a value slider that runs past the range to show wrap-around.
// ---------------------------------------------------------------------------

const big = (n: number | string) => BigInt(n);

function bounds(type: Primitive) {
  const bits = big(type.bits);
  if (type.name === "char") return { min: big(0), max: (big(1) << bits) - big(1) };
  return { min: -(big(1) << (bits - big(1))), max: (big(1) << (bits - big(1))) - big(1) };
}

/** Keeps only the low `bits` bits, the way Java stores an out-of-range integer. */
function wrap(value: bigint, min: bigint, bits: number) {
  const mod = big(1) << big(bits);
  return ((((value - min) % mod) + mod) % mod) + min;
}

function bitPattern(value: bigint, bits: number) {
  const mod = big(1) << big(bits);
  return (((value % mod) + mod) % mod).toString(2).padStart(bits, "0");
}

function fmt(n: bigint) {
  return n.toLocaleString("en-US");
}

function charLabel(code: bigint) {
  const n = Number(code);
  const printable = (n >= 32 && n <= 126) || (n >= 161 && n <= 0xd7ff);
  return printable ? `'${String.fromCharCode(n)}'` : `'\\u${n.toString(16).toUpperCase().padStart(4, "0")}'`;
}

type Edge = "max" | "min";

/** Window either side of a range edge; byte is small enough to show whole. */
const WINDOW = 16;
const BYTE_OVERHANG = 64;

function RangeExplorer({ type }: { type: Primitive }) {
  const { min, max } = bounds(type);
  const fullRange = type.bits <= 8;
  const [edge, setEdge] = useState<Edge>("max");

  const lo = fullRange ? min - big(BYTE_OVERHANG) : edge === "max" ? max - big(WINDOW - 1) : min - big(WINDOW);
  const hi = fullRange ? max + big(BYTE_OVERHANG) : edge === "max" ? max + big(WINDOW) : min + big(WINDOW - 1);
  const span = Number(hi - lo);
  const start = fullRange ? Number(max - lo) : edge === "max" ? Number(max - lo) : Number(min - lo);

  const [pos, setPos] = useState(start);
  const value = lo + big(pos);
  const stored = wrap(value, min, type.bits);
  const overflow = value !== stored;

  const changeEdge = (next: Edge) => {
    setEdge(next);
    const nlo = next === "max" ? max - big(WINDOW - 1) : min - big(WINDOW);
    setPos(Number((next === "max" ? max : min) - nlo));
  };

  const pct = (v: bigint) => (Number(v - lo) / span) * 100;
  const validLeft = Math.max(0, pct(min));
  const validRight = Math.min(100, pct(max));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Range boundary</p>
        {!fullRange && (
          <div className="flex gap-1.5" role="group" aria-label="Range edge">
            {(["min", "max"] as const).map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={edge === e}
                onClick={() => changeEdge(e)}
                className={cn(
                  "h-9 rounded-lg border px-3 font-mono text-xs transition-colors",
                  edge === e ? "border-tracer/50 bg-tracer/10 text-tracer" : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground",
                  FOCUS_RING,
                )}
              >
                {WRAPPER[type.name]}.{e.toUpperCase()}_VALUE
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Track: danger tint outside the range, success tint inside, tracer marker for the current value. */}
      <div className="relative h-8 overflow-hidden rounded-lg border border-border bg-danger/10" aria-hidden>
        <div className="absolute inset-y-0 border-x border-success/50 bg-success/10" style={{ left: `${validLeft}%`, right: `${100 - validRight}%` }} />
        <motion.div
          className={cn("absolute inset-y-0 w-0.5 -translate-x-1/2", overflow ? "bg-danger" : "bg-tracer glow-tracer")}
          animate={{ left: `${(pos / span) * 100}%` }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
        />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted">{fmt(lo)}</span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted">{fmt(hi)}</span>
      </div>

      <div className="flex items-center gap-2">
        <StepButton label="Subtract 1" disabled={pos <= 0} onClick={() => setPos(pos - 1)}>
          <Minus className="size-4" aria-hidden />
        </StepButton>
        <input
          type="range"
          min={0}
          max={span}
          step={1}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Value assigned to the ${type.name}`}
          aria-valuetext={`${fmt(value)}, stored as ${fmt(stored)}`}
          className={cn("h-9 flex-1 cursor-pointer accent-tracer", FOCUS_RING)}
        />
        <StepButton label="Add 1" disabled={pos >= span} onClick={() => setPos(pos + 1)}>
          <Plus className="size-4" aria-hidden />
        </StepButton>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-code px-4 py-3">
        <pre className="font-mono text-[13px] leading-6">
          <code>
            <span className="text-stack">{type.name}</span> {VAR_NAME[type.name]} = {expression(type, value, min, max, fullRange, edge)};
            <span className="text-muted">
              {"  // "}
              {VAR_NAME[type.name]} == {type.name === "char" ? `${charLabel(stored)} (${fmt(stored)})` : fmt(stored)}
            </span>
          </code>
        </pre>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Readout label="Intended value" value={fmt(value)} tone={overflow ? "danger" : "neutral"} />
        <Readout label={`Stored in ${type.bits} bits`} value={fmt(stored)} tone="tracer" flashKey={stored.toString()} />
      </div>

      <BitRow bits={bitPattern(stored, type.bits)} signed={type.name !== "char"} />

      <motion.div
        key={overflow ? "overflow" : "fits"}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-start gap-2 rounded-xl border p-3 text-sm leading-relaxed",
          overflow ? "border-danger/40 bg-danger/[0.06] text-foreground" : "border-success/40 bg-success/[0.06] text-foreground",
        )}
        role="status"
      >
        {overflow ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
        ) : (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        )}
        <p>
          {overflow ? (
            <>
              <span className="font-semibold text-danger">Overflow.</span> {fmt(value)} needs more than {type.bits} bits, so
              only the low {type.bits} bits are kept: {fmt(value)} {value > max ? "−" : "+"} 2<sup>{type.bits}</sup> ={" "}
              {fmt(stored)}. Java raises no error; the value silently wraps around.
            </>
          ) : (
            <>
              <span className="font-semibold text-success">Fits.</span> {fmt(value)} lies inside {type.range}, so it is stored
              exactly.
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

function expression(type: Primitive, value: bigint, min: bigint, max: bigint, fullRange: boolean, edge: Edge) {
  if (fullRange) return value >= min && value <= max ? value.toString() : `(${type.name}) ${value}`;
  const base = edge === "max" ? max : min;
  const d = value - base;
  const ref = `${WRAPPER[type.name]}.${edge.toUpperCase()}_VALUE`;
  const expr = d === big(0) ? ref : `${ref} ${d > big(0) ? "+" : "-"} ${d > big(0) ? d : -d}`;
  // short and char arithmetic is promoted to int, so assigning the result back needs a cast.
  const promoted = type.name === "short" || type.name === "char";
  return promoted && d !== big(0) ? `(${type.name}) (${expr})` : expr;
}

function StepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors",
        "hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        FOCUS_RING,
      )}
    >
      {children}
    </button>
  );
}

function Readout({ label, value, tone, flashKey }: { label: string; value: string; tone: "neutral" | "danger" | "tracer"; flashKey?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <motion.p
        key={flashKey}
        initial={flashKey ? { opacity: 0.4 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "mt-1 break-all font-mono text-[15px] font-semibold tabular-nums",
          tone === "danger" ? "text-danger" : tone === "tracer" ? "text-tracer" : "text-foreground",
        )}
      >
        {value}
      </motion.p>
    </div>
  );
}

/** Two's complement bit pattern, grouped by byte, most significant byte first. */
function BitRow({ bits, signed }: { bits: string; signed: boolean }) {
  const groups = bits.match(/.{1,8}/g) ?? [];
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted">
        Bit pattern{signed && <> · the leftmost bit is the sign bit (1 = negative)</>}
      </p>
      <div className="flex flex-wrap gap-2" aria-label={`Bits ${bits}`} role="img">
        {groups.map((group, gi) => (
          <div key={gi} className="flex gap-px">
            {group.split("").map((bit, bi) => {
              const isSign = signed && gi === 0 && bi === 0;
              return (
                <span
                  key={bi}
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-[4px] border font-mono text-[11px] tabular-nums",
                    bit === "1" ? "border-stack/40 bg-stack/15 text-stack" : "border-border bg-surface text-muted",
                    isSign && "ring-1 ring-foreground/40",
                  )}
                >
                  {bit}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// float and double: IEEE 754 layout, with preset values to show precision and overflow to Infinity.
// ---------------------------------------------------------------------------

interface FloatPreset {
  label: string;
  value: number;
  /** No exact binary form: the nearest representable value is stored. */
  approx?: boolean;
}

const FLOAT_PRESETS: Record<"float" | "double", FloatPreset[]> = {
  float: [
    { label: "1.5f", value: 1.5 },
    { label: "0.1f", value: 0.1, approx: true },
    { label: "-2.75f", value: -2.75 },
    { label: "Float.MAX_VALUE", value: 3.4028234663852886e38 },
    { label: "Float.MAX_VALUE * 2", value: Infinity },
  ],
  double: [
    { label: "1.5", value: 1.5 },
    { label: "0.1", value: 0.1, approx: true },
    { label: "-2.75", value: -2.75 },
    { label: "Double.MAX_VALUE", value: Number.MAX_VALUE },
    { label: "Double.MAX_VALUE * 2", value: Infinity },
  ],
};

const LAYOUT = {
  float: { exponent: 8, mantissa: 23 },
  double: { exponent: 11, mantissa: 52 },
};

function floatBits(value: number, isFloat: boolean) {
  const view = new DataView(new ArrayBuffer(8));
  if (isFloat) {
    view.setFloat32(0, value);
    return view.getUint32(0).toString(2).padStart(32, "0");
  }
  view.setFloat64(0, value);
  return view.getUint32(0).toString(2).padStart(32, "0") + view.getUint32(4).toString(2).padStart(32, "0");
}

function FloatLayout({ type }: { type: Primitive }) {
  const kind = type.name as "float" | "double";
  const isFloat = kind === "float";
  const { exponent, mantissa } = LAYOUT[kind];
  const [index, setIndex] = useState(0);
  const preset = FLOAT_PRESETS[kind][index];
  const stored = isFloat ? Math.fround(preset.value) : preset.value;
  const bits = floatBits(stored, isFloat);
  const segments = [
    { name: "sign", width: 1, bits: bits.slice(0, 1), fill: "border-heap/40 bg-heap/15", text: "text-heap" },
    { name: "exponent", width: exponent, bits: bits.slice(1, 1 + exponent), fill: "border-stack/40 bg-stack/15", text: "text-stack" },
    { name: "mantissa", width: mantissa, bits: bits.slice(1 + exponent), fill: "border-tracer/40 bg-tracer/10", text: "text-tracer" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">IEEE 754 layout</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Sample values">
        {FLOAT_PRESETS[kind].map((p, i) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
            className={cn(
              "h-9 rounded-lg border px-3 font-mono text-xs transition-colors",
              i === index ? "border-tracer/50 bg-tracer/10 text-tracer" : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground",
              FOCUS_RING,
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex overflow-hidden rounded-lg border border-border text-[11px]" aria-hidden>
        {segments.map((s) => (
          <div key={s.name} className={cn("min-w-12 border-r px-2 py-1.5 last:border-r-0", s.fill, s.text)} style={{ flexGrow: s.width, flexBasis: 0 }}>
            <p className="font-semibold">{s.name}</p>
            <p className="tabular-nums opacity-80">{s.width} bit{s.width > 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-code px-3 py-2.5">
        <p className="min-w-max font-mono text-[12px] leading-6" role="img" aria-label={`Bits ${bits}`}>
          {segments.map((s) => (
            <span key={s.name} className={cn("mr-1.5", s.text)}>
              {s.bits}
            </span>
          ))}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Readout label="Written as" value={preset.label} tone="neutral" />
        <Readout
          label={`Stored ${kind} value`}
          value={Number.isFinite(stored) ? String(stored) : stored > 0 ? "Infinity" : "-Infinity"}
          tone={Number.isFinite(stored) ? "tracer" : "danger"}
          flashKey={`${kind}-${index}`}
        />
      </div>

      {!Number.isFinite(stored) ? (
        <p className="text-sm leading-relaxed text-muted">
          Floating-point types do not wrap around like integers. A result past the largest finite value becomes{" "}
          <span className="font-mono text-danger">Infinity</span>: the exponent bits are all 1 and the mantissa is all 0.
        </p>
      ) : preset.approx ? (
        <p className="text-sm leading-relaxed text-muted">
          0.1 has no exact binary form, so the nearest value with a {mantissa + 1}-bit significand is stored. Java prints it
          back as <span className="font-mono text-foreground">0.1</span>, but the stored value is slightly off.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-muted">
          value = (−1)<sup>sign</sup> × 1.mantissa × 2<sup>exponent − {isFloat ? 127 : 1023}</sup>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// boolean
// ---------------------------------------------------------------------------

function BooleanCell() {
  const [value, setValue] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">One bit of information</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => setValue(!value)}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg border px-3 font-mono text-xs transition-colors",
            value ? "border-tracer/50 bg-tracer/10 text-tracer" : "border-border bg-surface text-muted hover:bg-surface-muted",
            FOCUS_RING,
          )}
        >
          flag = {String(value)}
        </button>
        <motion.span
          key={String(value)}
          initial={{ scale: 0.8, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-lg border font-mono text-sm",
            value ? "border-stack/50 bg-stack/20 text-stack" : "border-border bg-surface text-muted",
          )}
          aria-hidden
        >
          {value ? 1 : 0}
        </motion.span>
      </div>
      <p className="text-sm leading-relaxed text-muted">
        A boolean is not a number in Java: <span className="font-mono text-danger">(int) flag</span> and{" "}
        <span className="font-mono text-danger">if (1)</span> do not compile. The JLS fixes only its two values, not
        its size; HotSpot uses 1 byte per element in a <span className="font-mono text-foreground">boolean[]</span>.
      </p>
    </div>
  );
}
