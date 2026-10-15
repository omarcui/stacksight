import type { ComponentType, ReactNode } from "react";
import { MousePointerClick, Puzzle } from "lucide-react";
import { ExponentialEvaluator } from "@/components/interactive/module1/ExponentialEvaluator";
import { ExecutionLifecycleSimulator } from "@/components/interactive/module1/ExecutionLifecycleSimulator";
import { FlowchartRunner } from "@/components/interactive/module1/FlowchartRunner";
import { JVMArchitectureVisualizer } from "@/components/interactive/module1/JVMArchitectureVisualizer";
import { CodeAnatomyInspector } from "@/components/interactive/module2/CodeAnatomyInspector";
import { SyntaxFixerGame } from "@/components/interactive/module2/SyntaxFixerGame";
import { PrimitiveMemoryVisualizer } from "@/components/interactive/module3/PrimitiveMemoryVisualizer";
import { PrimitiveStackTracker } from "@/components/interactive/module3/PrimitiveStackTracker";
import { TypeCastingEvaluator } from "@/components/interactive/module3/TypeCastingEvaluator";
import { PrintfFormatterVisualizer } from "@/components/interactive/module4/PrintfFormatterVisualizer";
import { DecisionBranchVisualizer } from "@/components/interactive/module5/DecisionBranchVisualizer";
import { LoopExecutionDebugger } from "@/components/interactive/module6/LoopExecutionDebugger";
import type { ContentBlock, ModuleId, WidgetId } from "@/types/curriculum";
import { CalloutBox } from "./CalloutBox";
import { CodeBlock } from "./CodeBlock";
import { Markdown } from "./Markdown";
import { QuizPreviewCard } from "./QuizPreviewCard";

/**
 * Interactive widget registry, keyed by `interactiveWidgetId`. Typed against WIDGET_IDS in
 * types/curriculum.ts, so adding or removing a widget here fails to compile until that list matches.
 */
const WIDGETS: Record<WidgetId, ComponentType> = {
  "jvm-arch": JVMArchitectureVisualizer,
  "execution-lifecycle": ExecutionLifecycleSimulator,
  "flowchart-runner": FlowchartRunner,
  "code-anatomy": CodeAnatomyInspector,
  "syntax-fixer": SyntaxFixerGame,
  "primitive-memory": PrimitiveMemoryVisualizer,
  "type-casting": TypeCastingEvaluator,
  "stack-tracker": PrimitiveStackTracker,
  "exponential-eval": ExponentialEvaluator,
  "printf-builder": PrintfFormatterVisualizer,
  "decision-branch": DecisionBranchVisualizer,
  "loop-debugger": LoopExecutionDebugger,
};

export function ContentBlockRenderer({ block, moduleId }: { block: ContentBlock; moduleId: ModuleId }) {
  switch (block.type) {
    case "text":
      return <Markdown text={block.text} className="space-y-4 text-base text-foreground/85 md:text-lg" />;
    case "code":
      return <CodeBlock code={block.code} language={block.language} caption={block.caption} />;
    case "callout":
      return <CalloutBox variant={block.variant}>{block.text}</CalloutBox>;
    case "formula":
      return <Formula latex={block.latex} caption={block.caption} />;
    case "interactive": {
      const Widget = WIDGETS[block.interactiveWidgetId];
      if (Widget) return <WidgetCard caption={block.caption} Widget={Widget} />;
      return <Stub>Interactive exercise coming soon.</Stub>;
    }
    case "quiz_preview":
      return <QuizPreviewCard block={block} moduleId={moduleId} />;
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}

/** Interactive widgets sit in an accent-bordered card with a badge header, so they read as a hands-on stop. */
function WidgetCard({ Widget, caption }: { Widget: ComponentType; caption?: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-accent/20 bg-surface-muted/60">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-accent/15 px-4 py-3">
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 text-xs font-semibold text-accent">
          <MousePointerClick className="size-3.5" aria-hidden />
          Interactive
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Hands-on visualizer</span>
      </div>
      {caption && (
        <figcaption className="px-4 pt-3 text-sm leading-relaxed text-foreground/80 md:text-[15px]">{caption}</figcaption>
      )}
      <div className="p-3 sm:p-4">
        <Widget />
      </div>
    </figure>
  );
}

/** Not part of the reader yet; a neutral stub keeps the lesson reading in order. */
function Stub({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-muted/50 p-4 text-sm text-muted">
      <Puzzle className="size-4 shrink-0" aria-hidden />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formula: a small LaTeX subset (symbols, ^ and _) rendered as HTML, no math library.
// ---------------------------------------------------------------------------

const SYMBOLS: Record<string, string> = {
  in: "∈", notin: "∉", le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠", approx: "≈",
  cdot: "·", times: "×", to: "→", rightarrow: "→", infty: "∞", sum: "∑", prod: "∏",
  log: "log", lg: "lg", ln: "ln", Theta: "Θ", Omega: "Ω", omega: "ω", theta: "θ", alpha: "α",
  beta: "β", lambda: "λ", Delta: "Δ", ldots: "…", dots: "…", lfloor: "⌊", rfloor: "⌋",
  lceil: "⌈", rceil: "⌉",
};

/** Reads one argument after ^ or _: a {group}, a \command, or a single character. */
function readArg(src: string, start: number): [string, number] {
  if (src[start] === "{") {
    let depth = 0;
    for (let j = start; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}" && --depth === 0) return [src.slice(start + 1, j), j + 1];
    }
    return [src.slice(start + 1), src.length];
  }
  const command = /^\\[A-Za-z]+/.exec(src.slice(start));
  if (command) return [command[0], start + command[0].length];
  return [src[start] ?? "", start + 1];
}

export function renderLatex(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push(text);
    text = "";
  };

  for (let i = 0; i < src.length; ) {
    const ch = src[i];
    if (ch === "\\") {
      const command = /^\\([A-Za-z]+)/.exec(src.slice(i));
      if (command) {
        text += SYMBOLS[command[1]] ?? command[1];
        i += command[0].length;
      } else {
        // \, \; \  are spacing; anything else is an escaped literal like \{ or \%.
        const next = src[i + 1] ?? "";
        text += /[,;: ]/.test(next) ? " " : next;
        i += 2;
      }
    } else if (ch === "^" || ch === "_") {
      const [arg, next] = readArg(src, i + 1);
      flush();
      const Tag = ch === "^" ? "sup" : "sub";
      out.push(<Tag key={out.length}>{renderLatex(arg)}</Tag>);
      i = next;
    } else {
      if (ch !== "{" && ch !== "}") text += ch;
      i++;
    }
  }
  flush();
  return out;
}

function Formula({ latex, caption }: { latex: string; caption?: string }) {
  return (
    <figure className="rounded-xl border border-border bg-code px-4 py-4">
      <div role="math" aria-label={latex} className="overflow-x-auto text-center font-mono text-[15px] leading-7">
        {renderLatex(latex)}
      </div>
      {caption && <figcaption className="mt-2 text-center text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}
