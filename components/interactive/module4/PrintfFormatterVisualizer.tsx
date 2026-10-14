"use client";

import { useId, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";
import { CHIP, CHIP_OFF, CHIP_ON, ChipGroup, FOCUS_RING, WidgetPane } from "@/components/interactive/module1/shared";
import {
  PRINTF_FLAGS,
  formatSpec,
  javaDouble,
  specToString,
  type PrintfArg,
  type PrintfConversion,
  type PrintfFlag,
  type PrintfPart,
  type PrintfSpec,
} from "@/lib/java-format";
import { cn } from "@/lib/utils";

// Lab 4: build one printf format specifier from parts and preview exactly what Java prints, padding included.

type ArgType = PrintfArg["type"];

const CONVERSIONS: { id: PrintfConversion; label: string; arg: ArgType }[] = [
  { id: "d", label: "integer", arg: "int" },
  { id: "f", label: "fixed-point", arg: "double" },
  { id: "e", label: "scientific", arg: "double" },
  { id: "s", label: "string", arg: "String" },
];

const FLAG_HELP: Record<PrintfFlag, string> = {
  "-": "left-justify",
  "0": "pad with zeros",
  "+": "always show sign",
  ",": "group thousands",
};

const MAX_WIDTH = 20;
const PRECISIONS = [0, 1, 2, 3, 4, 6];
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

interface Preset {
  spec: PrintfSpec;
  arg: PrintfArg;
}

const PRESETS: Preset[] = [
  { spec: { flags: [], width: 10, precision: 2, conversion: "f" }, arg: { type: "double", value: 3.14159 } },
  { spec: { flags: ["-"], width: 8, conversion: "s" }, arg: { type: "String", value: "Java" } },
  { spec: { flags: [], conversion: "d" }, arg: { type: "int", value: 42 } },
  { spec: { flags: ["0"], width: 8, precision: 3, conversion: "f" }, arg: { type: "double", value: -2.5 } },
  { spec: { flags: [","], width: 12, conversion: "d" }, arg: { type: "int", value: 1234567 } },
  { spec: { flags: ["+"], precision: 2, conversion: "e" }, arg: { type: "double", value: 12345.678 } },
  { spec: { flags: [], precision: 3, conversion: "s" }, arg: { type: "String", value: "StackSight" } },
  { spec: { flags: [], conversion: "d" }, arg: { type: "double", value: 3.5 } },
];

const DEFAULT_RAW: Record<ArgType, string> = { int: "42", double: "3.14159", String: "Java" };

function parseArg(type: ArgType, raw: string): PrintfArg | string {
  if (type === "String") return { type, value: raw };
  if (type === "int") {
    if (!/^-?\d+$/.test(raw.trim())) return "Not an int literal: use whole numbers only.";
    const value = Number(raw);
    if (value < INT_MIN || value > INT_MAX) return "Out of int range (-2147483648 to 2147483647).";
    return { type, value };
  }
  const value = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(value)) return "Not a double literal.";
  return { type, value };
}

function literal(arg: PrintfArg) {
  if (arg.type === "String") return JSON.stringify(arg.value);
  return arg.type === "int" ? String(arg.value) : javaDouble(arg.value);
}

export function PrintfFormatterVisualizer() {
  const [conversion, setConversion] = useState<PrintfConversion>("f");
  const [flags, setFlags] = useState<PrintfFlag[]>([]);
  const [width, setWidth] = useState(10);
  const [precision, setPrecision] = useState<number | undefined>(2);
  const [argType, setArgType] = useState<ArgType>("double");
  const [raw, setRaw] = useState<Record<ArgType, string>>(DEFAULT_RAW);
  const argId = useId();

  const spec: PrintfSpec = { flags, width: width || undefined, precision, conversion };
  const parsed = parseArg(argType, raw[argType]);
  const result = typeof parsed === "string" ? undefined : formatSpec(spec, parsed);
  const specText = specToString(spec);

  const toggleFlag = (f: PrintfFlag) => setFlags((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]));

  const pickConversion = (c: (typeof CONVERSIONS)[number]) => {
    setConversion(c.id);
    setArgType(c.arg);
  };

  const applyPreset = ({ spec: s, arg }: Preset) => {
    setConversion(s.conversion);
    setFlags(s.flags);
    setWidth(s.width ?? 0);
    setPrecision(s.precision);
    setArgType(arg.type);
    setRaw((r) => ({ ...r, [arg.type]: arg.type === "String" ? arg.value : String(arg.value) }));
  };

  const presetOn = (p: Preset) =>
    specToString(p.spec) === specText && p.arg.type === argType && literal(p.arg) === (typeof parsed === "string" ? "" : literal(parsed));

  return (
    <WidgetPane label="printf builder">
      <div className="space-y-4 p-4">
        <ChipGroup label="Presets">
          {PRESETS.map((p) => {
            const on = presetOn(p);
            return (
              <button
                key={`${specToString(p.spec)}-${literal(p.arg)}`}
                type="button"
                aria-pressed={on}
                onClick={() => applyPreset(p)}
                className={cn(CHIP, on ? CHIP_ON : CHIP_OFF, FOCUS_RING)}
              >
                {specToString(p.spec)} · {literal(p.arg)}
              </button>
            );
          })}
        </ChipGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChipGroup label="Conversion">
            {CONVERSIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={conversion === c.id}
                onClick={() => pickConversion(c)}
                title={c.label}
                className={cn(CHIP, conversion === c.id ? CHIP_ON : CHIP_OFF, FOCUS_RING)}
              >
                %{c.id}
              </button>
            ))}
          </ChipGroup>
          <ChipGroup label="Flags">
            {PRINTF_FLAGS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={flags.includes(f)}
                aria-label={`${f} flag: ${FLAG_HELP[f]}`}
                title={FLAG_HELP[f]}
                onClick={() => toggleFlag(f)}
                className={cn(CHIP, "w-9 px-0", flags.includes(f) ? CHIP_ON : CHIP_OFF, FOCUS_RING)}
              >
                {f}
              </button>
            ))}
          </ChipGroup>

          <div className="space-y-1">
            <p className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-muted">
              Width <span className="font-mono normal-case tracking-normal text-tracer">{width || "none"}</span>
            </p>
            <input
              type="range"
              min={0}
              max={MAX_WIDTH}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              aria-label="Field width"
              aria-valuetext={width ? `${width} characters` : "none"}
              className={cn("h-9 w-full cursor-pointer accent-tracer", FOCUS_RING)}
            />
          </div>
          <ChipGroup label="Precision">
            <button type="button" aria-pressed={precision === undefined} onClick={() => setPrecision(undefined)} className={cn(CHIP, precision === undefined ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
              none
            </button>
            {PRECISIONS.map((p) => (
              <button key={p} type="button" aria-pressed={precision === p} onClick={() => setPrecision(p)} className={cn(CHIP, "w-9 px-0", precision === p ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
                .{p}
              </button>
            ))}
          </ChipGroup>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <ChipGroup label="Argument type">
            {(["int", "double", "String"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={argType === t} onClick={() => setArgType(t)} className={cn(CHIP, argType === t ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
                {t}
              </button>
            ))}
          </ChipGroup>
          <div className="min-w-40 flex-1 space-y-1">
            <label htmlFor={argId} className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Value
            </label>
            <input
              id={argId}
              value={raw[argType]}
              onChange={(e) => setRaw((r) => ({ ...r, [argType]: e.target.value }))}
              inputMode={argType === "String" ? "text" : "decimal"}
              spellCheck={false}
              aria-invalid={typeof parsed === "string"}
              className={cn(
                "h-9 w-full rounded-lg border bg-surface px-3 font-mono text-[13px] tabular-nums text-foreground",
                typeof parsed === "string" ? "border-danger/60" : "border-border-strong",
                FOCUS_RING,
              )}
            />
          </div>
        </div>
        {typeof parsed === "string" && <p className="text-xs text-danger">{parsed}</p>}

        <SpecAnatomy spec={spec} />

        <p className="overflow-x-auto whitespace-nowrap rounded-lg bg-code px-3 py-2 font-mono text-[13px] leading-6 text-foreground">
          System.out.printf(&quot;[<span className="text-tracer">{specText}</span>]%n&quot;, {typeof parsed === "string" ? "…" : literal(parsed)});
        </p>

        {result?.ok === false && (
          <div role="status" className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/[0.06] p-3 text-sm leading-relaxed">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-danger">Throws at runtime</p>
              <p className="break-words font-mono text-xs text-foreground">
                java.util.{result.exception}: {result.message}
              </p>
              <p className="text-xs text-muted">{explainError(result.exception, conversion)}</p>
            </div>
          </div>
        )}

        {result?.ok && <OutputPreview parts={result.parts} truncated={result.truncated} width={width} flashKey={`${specText}|${result.text}`} />}
        {result?.ok && <Explanation spec={spec} parts={result.parts} truncated={result.truncated} />}
      </div>
    </WidgetPane>
  );
}

// ---------------------------------------------------------------------------
// Anatomy of the specifier
// ---------------------------------------------------------------------------

function SpecAnatomy({ spec }: { spec: PrintfSpec }) {
  const flagText = PRINTF_FLAGS.filter((f) => spec.flags.includes(f)).join("");
  const segments: { text: string; label: string; empty: boolean }[] = [
    { text: "%", label: "start", empty: false },
    { text: flagText || "·", label: "flags", empty: !flagText },
    { text: spec.width ? String(spec.width) : "·", label: "width", empty: !spec.width },
    { text: spec.precision === undefined ? "·" : `.${spec.precision}`, label: "precision", empty: spec.precision === undefined },
    { text: spec.conversion, label: "conversion", empty: false },
  ];
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label={`Specifier ${specToString(spec)}`}>
      {segments.map((s) => (
        <li key={s.label} className="flex flex-col items-center gap-1">
          <span
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 font-mono text-[15px]",
              s.empty ? "border-dashed border-border text-muted/50" : s.label === "conversion" ? "border-accent/50 bg-accent/10 text-accent" : "border-border-strong bg-surface text-foreground",
            )}
          >
            {s.text}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted">{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Character-cell output preview
// ---------------------------------------------------------------------------

const CELL = "inline-flex h-8 w-[1.375rem] shrink-0 items-center justify-center font-mono text-[13px]";

function OutputPreview({ parts, truncated, width, flashKey }: { parts: PrintfPart[]; truncated: string; width: number; flashKey: string }) {
  const cells = parts.flatMap((p) => [...p.text].map((ch) => ({ ch, kind: p.kind })));
  const text = cells.map((c) => c.ch).join("");

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Output</p>
        <span className="font-mono text-xs tabular-nums text-muted">
          {cells.length} char{cells.length === 1 ? "" : "s"}
          {width > 0 && ` · width ${width}`}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <motion.div
          key={flashKey}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex min-w-max items-end"
          role="img"
          aria-label={`Prints [${text}]`}
        >
          <span className={cn(CELL, "text-muted")}>[</span>
          {cells.map((c, i) => (
            <span key={i} className="flex flex-col items-center">
              <span
                className={cn(
                  CELL,
                  "border-y border-l border-border",
                  i === cells.length - 1 && "border-r",
                  c.kind === "pad" && "bg-surface text-muted/50",
                  c.kind === "zero" && "bg-surface-muted text-muted",
                  (c.kind === "body" || c.kind === "sign") && "bg-tracer/10 text-tracer",
                )}
              >
                {c.kind === "pad" ? "·" : c.ch}
              </span>
              <span className="mt-0.5 font-mono text-[10px] tabular-nums text-muted/70">{i + 1}</span>
            </span>
          ))}
          <span className={cn(CELL, "self-start text-muted")}>]</span>
          {truncated && (
            <span className="ml-2 self-start pt-1.5 font-mono text-[13px] text-danger line-through decoration-danger/70">{truncated}</span>
          )}
        </motion.div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <Legend swatch="bg-tracer/10 border-tracer/40">value</Legend>
        <Legend swatch="bg-surface border-border">space padding (·)</Legend>
        <Legend swatch="bg-surface-muted border-border">zero padding</Legend>
        {truncated && <Legend swatch="bg-danger/10 border-danger/40">cut by precision</Legend>}
      </ul>
    </div>
  );
}

function Legend({ swatch, children }: { swatch: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded-sm border", swatch)} aria-hidden />
      {children}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Plain-language explanation
// ---------------------------------------------------------------------------

function Explanation({ spec, parts, truncated }: { spec: PrintfSpec; parts: PrintfPart[]; truncated: string }) {
  const content = parts.filter((p) => p.kind === "body" || p.kind === "sign").reduce((n, p) => n + p.text.length, 0);
  const pad = parts.filter((p) => p.kind === "pad" || p.kind === "zero").reduce((n, p) => n + p.text.length, 0);
  const left = spec.flags.includes("-");
  const zeros = spec.flags.includes("0");
  const facts: string[] = [];

  if (spec.conversion === "f") facts.push(`%f rounds half-up to ${spec.precision ?? 6} decimal place${spec.precision === 1 ? "" : "s"}${spec.precision === undefined ? " (the default)" : ""}.`);
  if (spec.conversion === "e") facts.push(`%e prints one digit before the point, ${spec.precision ?? 6} after, then a signed two-digit exponent.`);
  if (spec.conversion === "s" && spec.precision !== undefined)
    facts.push(truncated ? `Precision .${spec.precision} keeps only the first ${spec.precision} characters of the string.` : `Precision .${spec.precision} is a maximum length; the string already fits.`);
  if (spec.flags.includes("+")) facts.push("The + flag prints a sign even for non-negative numbers.");
  if (spec.flags.includes(",")) facts.push("The , flag inserts a separator every three integer digits.");

  if (!spec.width) facts.push("No width, so the field is exactly as long as the value.");
  else if (pad === 0) facts.push(`Width ${spec.width} is a minimum: the value already uses ${content} characters, so nothing is padded and nothing is cut.`);
  else
    facts.push(
      `Width ${spec.width}: the value uses ${content} character${content === 1 ? "" : "s"}, so ${pad} ${zeros ? "zero" : "space"}${pad === 1 ? "" : "s"} fill the ${left ? "right (left-justified by -)" : zeros ? "gap after the sign" : "left (right-justified by default)"}.`,
    );

  return (
    <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/[0.05] p-3 text-sm leading-relaxed">
      <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <ul className="space-y-1" aria-live="polite">
        {facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}

function explainError(exception: string, conversion: PrintfConversion) {
  switch (exception) {
    case "IllegalFormatConversionException":
      return conversion === "d"
        ? "%d only accepts integer types. Cast the double, or use %f."
        : "%f and %e only accept floating-point types. Use %d for an int, or pass a double.";
    case "MissingFormatWidthException":
      return "The - and 0 flags pad a field, so they need a width to pad to.";
    case "IllegalFormatFlagsException":
      return "A field cannot be both left-justified and zero-padded.";
    case "IllegalFormatPrecisionException":
      return "Integers have no decimal places, so %d takes no precision.";
    default:
      return `This flag has no meaning for %${conversion}.`;
  }
}
