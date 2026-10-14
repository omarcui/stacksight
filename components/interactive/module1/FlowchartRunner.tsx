"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FOCUS_RING, StepControls, WidgetPane, useStepper } from "./shared";

// ---------------------------------------------------------------------------
// Program model: a fixed SVG layout plus a trace generator that yields one snapshot per visited node.
// ---------------------------------------------------------------------------

type Shape = "terminal" | "io" | "process" | "decision";
type Vars = Record<string, number>;

interface FlowNode {
  id: string;
  shape: Shape;
  label: string;
  x: number;
  y: number;
  w: number;
}

interface FlowEdge {
  from: string;
  to: string;
  d: string;
  label?: { text: string; x: number; y: number };
}

interface TraceStep {
  node: string;
  vars: Vars;
  changed: string[];
  note: string;
  output?: string;
}

interface InputSpec {
  key: string;
  label: ReactNode;
  min: number;
  max: number;
  integer?: boolean;
}

interface Program {
  id: string;
  title: string;
  formula: ReactNode;
  inputs: InputSpec[];
  defaults: Vars;
  varOrder: { key: string; label: ReactNode }[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  height: number;
  trace: (input: Vars) => TraceStep[];
}

const NODE_H = 40;
const DIAMOND_H = 64;
const VIEW_W = 360;

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(4))));
const down = (x: number, fromY: number, toY: number) => `M${x} ${fromY + NODE_H / 2} V${toY - NODE_H / 2}`;

function tracer() {
  const steps: TraceStep[] = [];
  let vars: Vars = {};
  return {
    steps,
    push(node: string, next: Vars, note: string, output?: string) {
      const changed = Object.keys(next).filter((k) => next[k] !== vars[k]);
      vars = { ...vars, ...next };
      steps.push({ node, vars, changed, note, output });
    },
    get vars() {
      return vars;
    },
  };
}

const POWER: Program = {
  id: "power",
  title: "Exponent",
  formula: (
    <>
      x<sup>y</sup>
    </>
  ),
  inputs: [
    { key: "x", label: "x", min: -10, max: 10 },
    { key: "y", label: "y", min: 0, max: 8, integer: true },
  ],
  defaults: { x: 2, y: 3 },
  varOrder: [
    { key: "x", label: "x" },
    { key: "y", label: "y" },
    { key: "i", label: "i" },
    { key: "result", label: "result" },
  ],
  nodes: [
    { id: "start", shape: "terminal", label: "Start", x: 150, y: 28, w: 110 },
    { id: "input", shape: "io", label: "Input x, y", x: 150, y: 92, w: 150 },
    { id: "init", shape: "process", label: "result ← 1, i ← 0", x: 150, y: 156, w: 170 },
    { id: "cond", shape: "decision", label: "i < y ?", x: 150, y: 236, w: 130 },
    { id: "mul", shape: "process", label: "result ← result × x", x: 150, y: 320, w: 170 },
    { id: "inc", shape: "process", label: "i ← i + 1", x: 150, y: 384, w: 130 },
    { id: "out", shape: "io", label: "Output result", x: 296, y: 320, w: 116 },
    { id: "end", shape: "terminal", label: "End", x: 296, y: 384, w: 90 },
  ],
  edges: [
    { from: "start", to: "input", d: down(150, 28, 92) },
    { from: "input", to: "init", d: down(150, 92, 156) },
    { from: "init", to: "cond", d: `M150 176 V${236 - DIAMOND_H / 2}` },
    { from: "cond", to: "mul", d: `M150 ${236 + DIAMOND_H / 2} V300`, label: { text: "yes", x: 162, y: 286 } },
    { from: "mul", to: "inc", d: down(150, 320, 384) },
    { from: "inc", to: "cond", d: "M85 384 H24 V236 H85" },
    { from: "cond", to: "out", d: "M215 236 H296 V300", label: { text: "no", x: 252, y: 226 } },
    { from: "out", to: "end", d: down(296, 320, 384) },
  ],
  height: 420,
  trace({ x, y }) {
    const t = tracer();
    t.push("start", {}, "The program begins.");
    t.push("input", { x, y }, `Read x = ${fmt(x)} and y = ${fmt(y)}.`);
    t.push("init", { result: 1, i: 0 }, "Initialise the accumulator to 1 (the empty product) and the counter to 0.");
    for (;;) {
      const { i, result } = t.vars;
      const enter = i < y;
      t.push("cond", {}, `${fmt(i)} < ${fmt(y)} is ${enter} → ${enter ? "run the loop body" : "leave the loop"}.`);
      if (!enter) break;
      const product = result * x;
      t.push("mul", { result: product }, `result = ${fmt(result)} × ${fmt(x)} = ${fmt(product)}.`);
      t.push("inc", { i: i + 1 }, `i = ${fmt(i)} + 1 = ${fmt(i + 1)}; jump back to the condition.`);
    }
    const out = `${fmt(x)}^${fmt(y)} = ${fmt(t.vars.result)}`;
    t.push("out", {}, `Print the result: ${out}.`, out);
    t.push("end", {}, `Finished after ${fmt(y)} multiplication${y === 1 ? "" : "s"}.`, out);
    return t.steps;
  },
};

const DIST_X = 180;
const DIST_Y = [26, 84, 142, 200, 258, 316, 374, 432];
const DIST_IDS = ["start", "input", "dx", "dy", "s", "d", "out", "end"];

const DISTANCE: Program = {
  id: "distance",
  title: "Euclidean distance",
  formula: (
    <>
      √(Δx<sup>2</sup> + Δy<sup>2</sup>)
    </>
  ),
  inputs: [
    { key: "x1", label: <>x<sub>1</sub></>, min: -100, max: 100 },
    { key: "y1", label: <>y<sub>1</sub></>, min: -100, max: 100 },
    { key: "x2", label: <>x<sub>2</sub></>, min: -100, max: 100 },
    { key: "y2", label: <>y<sub>2</sub></>, min: -100, max: 100 },
  ],
  defaults: { x1: 1, y1: 2, x2: 4, y2: 6 },
  varOrder: [
    { key: "x1", label: <>x<sub>1</sub></> },
    { key: "y1", label: <>y<sub>1</sub></> },
    { key: "x2", label: <>x<sub>2</sub></> },
    { key: "y2", label: <>y<sub>2</sub></> },
    { key: "dx", label: "Δx" },
    { key: "dy", label: "Δy" },
    { key: "s", label: "s" },
    { key: "d", label: "d" },
  ],
  nodes: [
    { id: "start", shape: "terminal", label: "Start", w: 110 },
    { id: "input", shape: "io", label: "Input x₁, y₁, x₂, y₂", w: 210 },
    { id: "dx", shape: "process", label: "Δx ← x₂ − x₁", w: 160 },
    { id: "dy", shape: "process", label: "Δy ← y₂ − y₁", w: 160 },
    { id: "s", shape: "process", label: "s ← Δx² + Δy²", w: 170 },
    { id: "d", shape: "process", label: "d ← √s", w: 130 },
    { id: "out", shape: "io", label: "Output d", w: 130 },
    { id: "end", shape: "terminal", label: "End", w: 90 },
  ].map((n, i) => ({ ...n, shape: n.shape as Shape, x: DIST_X, y: DIST_Y[i] })),
  edges: DIST_IDS.slice(1).map((to, i) => ({ from: DIST_IDS[i], to, d: down(DIST_X, DIST_Y[i], DIST_Y[i + 1]) })),
  height: 460,
  trace({ x1, y1, x2, y2 }) {
    const t = tracer();
    t.push("start", {}, "The program begins.");
    t.push("input", { x1, y1, x2, y2 }, `Read P₁ = (${fmt(x1)}, ${fmt(y1)}) and P₂ = (${fmt(x2)}, ${fmt(y2)}).`);
    const dx = x2 - x1;
    t.push("dx", { dx }, `Δx = ${fmt(x2)} − ${fmt(x1)} = ${fmt(dx)}.`);
    const dy = y2 - y1;
    t.push("dy", { dy }, `Δy = ${fmt(y2)} − ${fmt(y1)} = ${fmt(dy)}.`);
    const s = dx * dx + dy * dy;
    t.push("s", { s }, `s = ${fmt(dx)}² + ${fmt(dy)}² = ${fmt(dx * dx)} + ${fmt(dy * dy)} = ${fmt(s)}.`);
    const d = Math.sqrt(s);
    t.push("d", { d }, `d = √${fmt(s)} = ${fmt(d)}.`);
    const out = `d = ${fmt(d)}`;
    t.push("out", {}, `Print the distance: ${out}.`, out);
    t.push("end", {}, "Finished: a straight-line sequence, no branches.", out);
    return t.steps;
  },
};

const PROGRAMS = [POWER, DISTANCE];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FlowchartRunner() {
  const [programId, setProgramId] = useState(POWER.id);
  const program = PROGRAMS.find((p) => p.id === programId) ?? POWER;
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(PROGRAMS.map((p) => [p.id, Object.fromEntries(Object.entries(p.defaults).map(([k, v]) => [k, String(v)]))])),
  );

  const inputs = useMemo(() => {
    const out: Vars = {};
    for (const spec of program.inputs) {
      const raw = Number.parseFloat(drafts[program.id][spec.key]);
      const value = Number.isFinite(raw) ? raw : program.defaults[spec.key];
      const clamped = Math.min(spec.max, Math.max(spec.min, spec.integer ? Math.trunc(value) : value));
      out[spec.key] = clamped;
    }
    return out;
  }, [program, drafts]);

  const steps = useMemo(() => program.trace(inputs), [program, inputs]);
  const stepper = useStepper(steps.length, 1100);
  const current = steps[stepper.step];
  const prevNode = stepper.step > 0 ? steps[stepper.step - 1].node : null;

  const traversed = useMemo(() => {
    const set = new Set<string>();
    for (let i = 1; i <= stepper.step; i++) set.add(`${steps[i - 1].node}->${steps[i].node}`);
    return set;
  }, [steps, stepper.step]);
  const visited = useMemo(() => new Set(steps.slice(0, stepper.step + 1).map((s) => s.node)), [steps, stepper.step]);

  const selectProgram = (id: string) => {
    setProgramId(id);
    stepper.reset();
  };

  const updateInput = (key: string, value: string) => {
    setDrafts((d) => ({ ...d, [program.id]: { ...d[program.id], [key]: value } }));
    stepper.reset();
  };

  return (
    <WidgetPane
      label="Flowchart runner"
      actions={
        <div role="radiogroup" aria-label="Algorithm" className="flex gap-1">
          {PROGRAMS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.id === program.id}
              onClick={() => selectProgram(p.id)}
              className={cn(
                "h-7 rounded-lg border px-2.5 font-mono text-xs transition-colors",
                p.id === program.id
                  ? "border-stack/50 bg-stack/15 text-stack"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
                FOCUS_RING,
              )}
            >
              {p.formula}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="rounded-xl border border-border bg-code bg-dots p-2">
          <FlowchartSvg program={program} active={current.node} prevNode={prevNode} visited={visited} traversed={traversed} />
        </div>

        <div className="flex flex-col gap-3">
          <fieldset className="rounded-xl border border-border p-3">
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Input · {program.title}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {program.inputs.map((spec) => (
                <label key={spec.key} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-right font-mono text-[13px] text-muted">{spec.label}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={spec.min}
                    max={spec.max}
                    step={spec.integer ? 1 : "any"}
                    value={drafts[program.id][spec.key]}
                    onChange={(e) => updateInput(spec.key, e.target.value)}
                    className={cn(
                      "h-9 w-full min-w-0 rounded-lg border border-border-strong bg-surface px-2 font-mono text-[13px] tabular-nums",
                      FOCUS_RING,
                    )}
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted tabular-nums">
              {program.inputs.map((s) => `${s.key} ∈ [${s.min}, ${s.max}]${s.integer ? " int" : ""}`).join(" · ")}
            </p>
          </fieldset>

          <div className="rounded-xl border border-border p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Variables</p>
            <dl className="mt-2 grid grid-cols-2 gap-1.5">
              {program.varOrder.map(({ key, label }) => {
                const value = current.vars[key];
                const changed = current.changed.includes(key);
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex h-9 items-center justify-between rounded-lg border px-2.5 font-mono text-[13px] transition-colors duration-200",
                      changed ? "border-tracer/50 bg-tracer/10" : "border-border bg-surface",
                    )}
                  >
                    <dt className="text-muted">{label}</dt>
                    <motion.dd
                      key={changed ? `${stepper.step}-${key}` : key}
                      initial={changed ? { opacity: 0.2, y: -3 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn("tabular-nums", changed ? "text-tracer" : value === undefined ? "text-muted/60" : "text-foreground")}
                    >
                      {value === undefined ? "—" : fmt(value)}
                    </motion.dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-code p-3 font-mono text-[13px] leading-6">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-muted">Output</p>
            <p className={current.output ? "text-success" : "text-muted/60"}>{current.output ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border p-4">
        <p aria-live="polite" className="min-h-6 text-sm leading-relaxed">
          <span className="mr-2 font-mono text-[13px] text-tracer">{nodeLabel(program, current.node)}</span>
          {current.note}
        </p>
        <StepControls stepper={stepper} />
      </div>
    </WidgetPane>
  );
}

function nodeLabel(program: Program, id: string) {
  const kind = program.nodes.find((n) => n.id === id)?.shape;
  return kind === "io" ? (id === "input" ? "INPUT" : "OUTPUT") : kind === "decision" ? "DECISION" : kind === "terminal" ? id.toUpperCase() : "PROCESS";
}

// ---------------------------------------------------------------------------
// SVG flowchart: fixed coordinates, no DOM measurement (docs/ui-spec.md §3.3).
// ---------------------------------------------------------------------------

function FlowchartSvg({
  program,
  active,
  prevNode,
  visited,
  traversed,
}: {
  program: Program;
  active: string;
  prevNode: string | null;
  visited: Set<string>;
  traversed: Set<string>;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${program.height}`}
      role="img"
      aria-label={`Flowchart for ${program.title}`}
      className="mx-auto block h-auto w-full max-w-md"
    >
      <defs>
        {(["idle", "live"] as const).map((kind) => (
          <marker
            key={kind}
            id={`${uid}-${kind}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" className={kind === "live" ? "fill-tracer" : "fill-border-strong"} />
          </marker>
        ))}
      </defs>

      {program.edges.map((e) => {
        const key = `${e.from}->${e.to}`;
        const live = prevNode === e.from && active === e.to;
        return (
          <g key={key}>
            <path
              d={e.d}
              fill="none"
              strokeWidth={live ? 2 : 1.5}
              markerEnd={`url(#${uid}-${live ? "live" : "idle"})`}
              className={cn(
                "transition-colors duration-200",
                live ? "stroke-tracer drop-glow-tracer" : traversed.has(key) ? "stroke-border-strong" : "stroke-border",
              )}
            />
            {live && (
              <motion.path
                key={`${key}-draw`}
                d={e.d}
                fill="none"
                strokeWidth={2}
                className="stroke-tracer"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25 }}
              />
            )}
            {e.label && (
              <text x={e.label.x} y={e.label.y} className="fill-muted font-mono text-[11px]">
                {e.label.text}
              </text>
            )}
          </g>
        );
      })}

      {program.nodes.map((n) => {
        const isActive = n.id === active;
        const tone = isActive
          ? "fill-tracer/10 stroke-tracer drop-glow-tracer"
          : visited.has(n.id)
            ? "fill-surface stroke-border-strong"
            : "fill-surface stroke-border";
        return (
          <g key={n.id} aria-current={isActive ? "step" : undefined}>
            <NodeShape node={n} className={cn("transition-colors duration-200", tone)} strokeWidth={isActive ? 2 : 1.5} />
            <text
              x={n.x}
              y={n.y}
              textAnchor="middle"
              dominantBaseline="central"
              className={cn("font-mono text-[12px]", isActive ? "fill-tracer font-semibold" : visited.has(n.id) ? "fill-foreground" : "fill-muted")}
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function NodeShape({ node, className, strokeWidth }: { node: FlowNode; className: string; strokeWidth: number }) {
  const { x, y, w, shape } = node;
  const hw = w / 2;
  const hh = (shape === "decision" ? DIAMOND_H : NODE_H) / 2;
  switch (shape) {
    case "terminal":
      return <rect x={x - hw} y={y - hh} width={w} height={hh * 2} rx={hh} className={className} strokeWidth={strokeWidth} />;
    case "process":
      return <rect x={x - hw} y={y - hh} width={w} height={hh * 2} rx={6} className={className} strokeWidth={strokeWidth} />;
    case "io": {
      const skew = 10;
      const points = `${x - hw + skew},${y - hh} ${x + hw},${y - hh} ${x + hw - skew},${y + hh} ${x - hw},${y + hh}`;
      return <polygon points={points} className={className} strokeWidth={strokeWidth} strokeLinejoin="round" />;
    }
    case "decision": {
      const points = `${x},${y - hh} ${x + hw},${y} ${x},${y + hh} ${x - hw},${y}`;
      return <polygon points={points} className={className} strokeWidth={strokeWidth} strokeLinejoin="round" />;
    }
  }
}
