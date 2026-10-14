"use client";

import { useId, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, CornerDownRight } from "lucide-react";
import {
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  ChipGroup,
  CodeTrace,
  ConsoleOutput,
  FOCUS_RING,
  WidgetPane,
  useWidgetTabs,
} from "@/components/interactive/module1/shared";
import { cn } from "@/lib/utils";

// Lab 5: how a switch picks its entry point (and falls through), ChineseZodiac's year % 12 mapping,
// and which if a dangling else really belongs to.

const TABS = [
  { id: "switch", label: "switch" },
  { id: "zodiac", label: "ChineseZodiac" },
  { id: "dangling", label: "Dangling else" },
] as const;

export function DecisionBranchVisualizer() {
  const tabs = useWidgetTabs(TABS, "switch");
  return (
    <WidgetPane label="Decision branches" actions={tabs.tablist("Example")}>
      <div {...tabs.panelProps} className="space-y-4 p-4">
        {tabs.active === "switch" && <SwitchPanel />}
        {tabs.active === "zodiac" && <ZodiacPanel />}
        {tabs.active === "dangling" && <DanglingPanel />}
      </div>
    </WidgetPane>
  );
}

// ---------------------------------------------------------------------------
// switch: entry point, break and fall-through
// ---------------------------------------------------------------------------

interface SwitchCase {
  labels: number[] | "default";
  output: string;
}

const DAY_CASES: SwitchCase[] = [
  { labels: [1, 7], output: "Weekend" },
  { labels: [2, 3, 4, 5, 6], output: "Weekday" },
  { labels: "default", output: "Invalid day" },
];

const DAYS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/** Lays out the switch source and remembers which line belongs to which case. */
function switchSource(day: number, breaks: boolean) {
  const lines = [`int day = ${day};`, "switch (day) {"];
  const at = DAY_CASES.map((c, i) => {
    const label = c.labels === "default" ? "default:" : c.labels.map((n) => `case ${n}:`).join(" ");
    lines.push(`    ${label}`);
    const labelLine = lines.length;
    lines.push(`        System.out.println("${c.output}");`);
    const bodyLine = lines.length;
    let breakLine: number | undefined;
    if (breaks && i < DAY_CASES.length - 1) {
      lines.push("        break;");
      breakLine = lines.length;
    }
    return { labelLine, bodyLine, breakLine };
  });
  lines.push("}");
  return { lines, at };
}

function SwitchPanel() {
  const [day, setDay] = useState(1);
  const [breaks, setBreaks] = useState(true);

  const { lines, at } = switchSource(day, breaks);
  const matched = DAY_CASES.findIndex((c) => c.labels !== "default" && c.labels.includes(day));
  const entry = matched >= 0 ? matched : DAY_CASES.findIndex((c) => c.labels === "default");

  const executed: number[] = [];
  const active = [2, at[entry].labelLine];
  let output = "";
  for (let k = entry; k < DAY_CASES.length; k++) {
    executed.push(k);
    active.push(at[k].bodyLine);
    output += `${DAY_CASES[k].output}\n`;
    const breakLine = at[k].breakLine;
    if (breakLine) {
      active.push(breakLine);
      break;
    }
  }
  const dim = lines.map((_, i) => i + 1).filter((n) => n > 2 && n < lines.length && !active.includes(n));
  const fellThrough = executed.length > 1;

  return (
    <>
      <p className="text-sm leading-relaxed text-muted">
        A <span className="font-mono text-foreground">switch</span> jumps straight to the matching label, then runs
        downward until it reaches a <span className="font-mono text-foreground">break</span> or the closing brace.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <ChipGroup label="day">
          {DAYS.map((d) => (
            <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)} className={cn(CHIP, "w-9 px-0", day === d ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
              {d}
            </button>
          ))}
        </ChipGroup>
        <button
          type="button"
          role="switch"
          aria-checked={breaks}
          onClick={() => setBreaks((b) => !b)}
          className={cn(CHIP, "inline-flex items-center gap-2 font-sans", breaks ? CHIP_OFF : "border-heap/50 bg-heap/10 text-heap", FOCUS_RING)}
        >
          <span className={cn("relative h-4 w-7 rounded-full transition-colors", breaks ? "bg-success/70" : "bg-surface-muted")} aria-hidden>
            <span className={cn("absolute top-0.5 size-3 rounded-full bg-background transition-[left]", breaks ? "left-3.5" : "left-0.5")} />
          </span>
          break statements {breaks ? "on" : "removed"}
        </button>
      </div>

      <JumpTable day={day} entry={entry} executed={executed} />

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
        <CodeTrace lines={lines} active={active} dim={dim} label="switch statement" />
        <ConsoleOutput text={output} />
      </div>

      <Verdict tone={fellThrough ? "heap" : "success"}>
        {fellThrough ? (
          <>
            <span className="font-semibold text-heap">Fell through {executed.length - 1} case{executed.length > 2 ? "s" : ""}.</span> With no{" "}
            <span className="font-mono">break</span>, control ignores the remaining labels and keeps executing every body below the entry point.
          </>
        ) : (
          <>
            <span className="font-semibold text-success">One body ran.</span>{" "}
            {DAY_CASES[entry].labels === "default"
              ? `No case matches ${day}, so control jumps to default.`
              : `day == ${day} matches a label, its body runs${at[entry].breakLine ? ", and break exits the switch" : " and the closing brace ends the switch"}.`}
          </>
        )}
      </Verdict>
    </>
  );
}

function JumpTable({ day, entry, executed }: { day: number; entry: number; executed: number[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="Case labels">
      <li className="mr-1 inline-flex h-7 items-center rounded-full border border-tracer/40 bg-tracer/10 px-2.5 font-mono text-xs text-tracer">day = {day}</li>
      {DAY_CASES.map((c, i) => {
        const isEntry = i === entry;
        const ran = executed.includes(i);
        return (
          <li key={i} className="flex items-center gap-1.5">
            <CornerDownRight className={cn("size-3.5", ran ? "text-tracer" : "text-border-strong")} aria-hidden />
            <span
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-xs",
                isEntry ? "border-tracer/50 bg-tracer/10 text-tracer glow-tracer" : ran ? "border-heap/50 bg-heap/10 text-heap" : "border-border text-muted",
              )}
            >
              {c.labels === "default" ? "default" : c.labels.join(", ")}
              {isEntry && <span className="font-sans text-[10px] uppercase tracking-wider">entry</span>}
              {ran && !isEntry && <span className="font-sans text-[10px] uppercase tracking-wider">fall-through</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// ChineseZodiac.java: year % 12 → sign
// ---------------------------------------------------------------------------

const ZODIAC = ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Sheep"];
const YEAR_PRESETS = [1996, 2000, 2008, 2024];
const YEAR_RANGE = { min: 1900, max: 2100 };

function zodiacSource(year: number) {
  const width = Math.max(...ZODIAC.map((z) => z.length)) + 3;
  return [
    `int year = ${year};`,
    'String sign = "";',
    "switch (year % 12) {",
    ...ZODIAC.map((z, i) => `    case ${String(i).padEnd(2)}: sign = ${`"${z}";`.padEnd(width)} break;`),
    "}",
    'System.out.println("Zodiac Sign: " + sign);',
  ];
}

function ZodiacPanel() {
  const [year, setYear] = useState(1996);
  const [raw, setRaw] = useState("1996");
  const yearId = useId();

  const r = year % 12;
  const q = Math.floor(year / 12);
  const lines = zodiacSource(year);
  const caseLine = 4 + r;
  const caseLines = ZODIAC.map((_, i) => 4 + i);

  const set = (y: number) => {
    setYear(y);
    setRaw(String(y));
  };

  return (
    <>
      <p className="text-sm leading-relaxed text-muted">
        The zodiac repeats every 12 years, so the remainder <span className="font-mono text-foreground">year % 12</span> is
        always one of twelve values. A <span className="font-mono text-foreground">switch</span> maps each remainder to a sign.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label htmlFor={yearId} className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Birth year
          </label>
          <input
            id={yearId}
            type="number"
            min={1}
            max={9999}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              const v = Number(e.target.value);
              if (Number.isInteger(v) && v >= 1 && v <= 9999) setYear(v);
            }}
            onBlur={() => setRaw(String(year))}
            className={cn("h-9 w-28 rounded-lg border border-border-strong bg-surface px-3 font-mono text-[13px] tabular-nums text-foreground", FOCUS_RING)}
          />
        </div>
        <ChipGroup label="Presets">
          {YEAR_PRESETS.map((y) => (
            <button key={y} type="button" aria-pressed={year === y} onClick={() => set(y)} className={cn(CHIP, year === y ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
              {y}
            </button>
          ))}
        </ChipGroup>
      </div>
      <input
        type="range"
        min={YEAR_RANGE.min}
        max={YEAR_RANGE.max}
        value={Math.min(YEAR_RANGE.max, Math.max(YEAR_RANGE.min, year))}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="Birth year"
        className={cn("h-9 w-full cursor-pointer accent-tracer", FOCUS_RING)}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-muted/40 px-3 py-2.5 font-mono text-[13px] tabular-nums">
        <span className="text-muted">{year} % 12</span>
        <span className="text-muted">→</span>
        <span className="text-foreground">
          {year} = 12 × {q} + <span className="text-tracer">{r}</span>
        </span>
        <span className="text-muted">→</span>
        <span className="text-foreground">case {r}</span>
        <span className="text-muted">→</span>
        <motion.span key={r} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-semibold text-tracer">
          &quot;{ZODIAC[r]}&quot;
        </motion.span>
      </div>

      <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-6" aria-label="Remainder to sign">
        {ZODIAC.map((z, i) => (
          <li key={z}>
            <button
              type="button"
              onClick={() => set(year - r + i)}
              aria-current={i === r ? "true" : undefined}
              aria-label={`${i}: ${z}, set year to ${year - r + i}`}
              className={cn(
                "flex h-14 w-full flex-col items-center justify-center rounded-lg border text-xs transition-colors",
                i === r ? "border-tracer/50 bg-tracer/10 text-tracer glow-tracer" : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground",
                FOCUS_RING,
              )}
            >
              <span className="font-mono text-[11px] tabular-nums">{i}</span>
              <span className="font-medium">{z}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
        <CodeTrace lines={lines} active={[3, caseLine, lines.length]} dim={caseLines.filter((n) => n !== caseLine)} label="ChineseZodiac.java" />
        <div className="space-y-3">
          <ConsoleOutput text={`Zodiac Sign: ${ZODIAC[r]}`} />
          <p className="text-xs leading-relaxed text-muted">
            Same sign: <span className="font-mono tabular-nums text-foreground">{[year - 24, year - 12, year + 12, year + 24].filter((y) => y > 0).join(", ")}</span>.
            Adding 12 never changes the remainder.
          </p>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Dangling else: the else pairs with the nearest unmatched if
// ---------------------------------------------------------------------------

const UNBRACED = ["if (i > j)", "    if (i > k)", '        System.out.println("A");', "else", '    System.out.println("B");'];
const AS_PARSED = ["if (i > j) {", "    if (i > k)", '        System.out.println("A");', "    else", '        System.out.println("B");', "}"];
const AS_INDENTED = ["if (i > j) {", '    if (i > k) System.out.println("A");', "} else {", '    System.out.println("B");', "}"];

const IJK_PRESETS = [
  { label: "i > j, i > k", i: 5, j: 2, k: 1 },
  { label: "i > j, i ≤ k", i: 4, j: 2, k: 6 },
  { label: "i ≤ j", i: 1, j: 2, k: 0 },
];

function DanglingPanel() {
  const [v, setV] = useState({ i: 4, j: 2, k: 6 });
  const c1 = v.i > v.j;
  const c2 = v.i > v.k;

  const parsed = {
    active: [1, ...(c1 ? [2, ...(c2 ? [3] : [4, 5])] : [])],
    output: c1 ? (c2 ? "A" : "B") : "",
  };
  const indented = {
    active: [1, ...(c1 ? [2] : [3, 4])],
    output: c1 ? (c2 ? "A" : "") : "B",
  };
  const same = parsed.output === indented.output;

  return (
    <>
      <p className="text-sm leading-relaxed text-muted">
        Indentation means nothing to the compiler. Without braces, an <span className="font-mono text-foreground">else</span>{" "}
        always pairs with the <span className="text-foreground">nearest</span> unmatched <span className="font-mono text-foreground">if</span>.
      </p>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <CodeTrace lines={UNBRACED} label="Unbraced source" />
        <div className="flex flex-col justify-center gap-3">
          {(["i", "j", "k"] as const).map((name) => (
            <IntStepper key={name} name={name} value={v[name]} onChange={(n) => setV((s) => ({ ...s, [name]: n }))} />
          ))}
        </div>
      </div>

      <ChipGroup label="Presets">
        {IJK_PRESETS.map((p) => {
          const on = p.i === v.i && p.j === v.j && p.k === v.k;
          return (
            <button key={p.label} type="button" aria-pressed={on} onClick={() => setV({ i: p.i, j: p.j, k: p.k })} className={cn(CHIP, on ? CHIP_ON : CHIP_OFF, FOCUS_RING)}>
              {p.label}
            </button>
          );
        })}
      </ChipGroup>

      <div className="flex flex-wrap gap-2">
        <Condition expr="i > j" values={`${v.i} > ${v.j}`} value={c1} />
        <Condition expr="i > k" values={`${v.i} > ${v.k}`} value={c2} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Reading title="How Java parses it" tone="tracer" lines={AS_PARSED} active={parsed.active} output={parsed.output} />
        <Reading title="What the indentation suggests" tone="neutral" lines={AS_INDENTED} active={indented.active} output={indented.output} />
      </div>

      <Verdict tone={same ? "success" : "danger"}>
        {same ? (
          <>
            <span className="font-semibold text-success">Same output here.</span> These values happen to agree; try{" "}
            <span className="font-mono">i ≤ j</span> or <span className="font-mono">i &gt; j, i ≤ k</span> to see them split.
          </>
        ) : (
          <>
            <span className="font-semibold text-danger">Different output.</span> The else belongs to{" "}
            <span className="font-mono">if (i &gt; k)</span>, so {c1 ? "it runs when i > j but i ≤ k" : "nothing prints when i ≤ j"}. Braces make the intended pairing explicit.
          </>
        )}
      </Verdict>
    </>
  );
}

function IntStepper({ name, value, onChange }: { name: string; value: number; onChange: (n: number) => void }) {
  const clamp = (n: number) => Math.max(-9, Math.min(9, n));
  const button = cn("inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground", FOCUS_RING);
  return (
    <div role="group" aria-label={`int ${name}`} className="flex items-center gap-1.5">
      <span className="w-14 font-mono text-[13px] text-muted">int {name}</span>
      <button type="button" aria-label={`Decrease ${name}`} onClick={() => onChange(clamp(value - 1))} className={button}>
        −
      </button>
      <span aria-live="polite" className="w-8 text-center font-mono text-[15px] font-semibold tabular-nums text-tracer">
        {value}
      </span>
      <button type="button" aria-label={`Increase ${name}`} onClick={() => onChange(clamp(value + 1))} className={button}>
        +
      </button>
    </div>
  );
}

function Condition({ expr, values, value }: { expr: string; values: string; value: boolean }) {
  return (
    <span className={cn("inline-flex h-7 items-center gap-2 rounded-full border px-2.5 font-mono text-xs", value ? "border-tracer/40 bg-tracer/10 text-tracer" : "border-border bg-surface text-muted")}>
      {expr}
      <span className="text-muted">({values})</span>
      <span className="font-semibold">{String(value)}</span>
    </span>
  );
}

function Reading({ title, tone, lines, active, output }: { title: string; tone: "tracer" | "neutral"; lines: string[]; active: number[]; output: string }) {
  const dim = lines.map((_, i) => i + 1).filter((n) => !active.includes(n) && lines[n - 1].trim() !== "}");
  return (
    <div className={cn("space-y-2 rounded-xl border p-3", tone === "tracer" ? "border-tracer/30" : "border-border")}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</p>
      <CodeTrace lines={lines} active={active} dim={dim} label={title} />
      <p className="font-mono text-[13px]">
        <span className="text-muted">prints </span>
        {output ? <span className="font-semibold text-tracer">{output}</span> : <span className="text-muted">(nothing)</span>}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

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
