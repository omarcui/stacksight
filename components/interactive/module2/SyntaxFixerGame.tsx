"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bug, ChevronRight, CircleCheck, CircleDot, CircleX, Lightbulb, RotateCcw, Wrench } from "lucide-react";
import { cn, highlight } from "@/lib/utils";

type ErrorCategory = "syntax" | "runtime" | "logic";

interface BugFix {
  fixed: string;
  category: ErrorCategory;
  explanation: string;
  /** Second-level hint, shown after a repeated wrong classification. */
  hint: string;
}

interface Line {
  code: string;
  bug?: BugFix;
}

interface Problem {
  file: string;
  title: string;
  lines: Line[];
  output: string;
}

interface LineState {
  fixed: boolean;
  classified: boolean;
  misses: number;
}

type Feedback =
  | { kind: "clean"; line: number }
  | { kind: "bug"; line: number }
  | { kind: "wrong"; line: number; picked: ErrorCategory };

const CATEGORIES: Record<ErrorCategory, { label: string; when: string }> = {
  syntax: { label: "Syntax", when: "javac rejects it, so no .class file is produced" },
  runtime: { label: "Runtime", when: "it compiles, then crashes with an exception while running" },
  logic: { label: "Logic", when: "it compiles and runs, but prints the wrong result" },
};

const CATEGORY_ORDER: ErrorCategory[] = ["syntax", "runtime", "logic"];

// Bugged versions of the Lab 1 and Lab 2 programs, using the error kinds from Exercise 1.3.
const PROBLEMS: Problem[] = [
  {
    file: "Welcome.java",
    title: "First Java program",
    output:
      "Welcome to CSC103 Programming Fundamentals!\nJava Virtual Machine (JVM) executes bytecode.\nCompiling with javac...",
    lines: [
      {
        code: "public class welcome {",
        bug: {
          fixed: "public class Welcome {",
          category: "syntax",
          explanation:
            "A public class must match its file name exactly, and Java is case-sensitive: `welcome` is not `Welcome`, so javac refuses to compile.",
          hint: "Compare the class name with the file name in the tab, letter by letter.",
        },
      },
      { code: "    public static void main(String[] args) {" },
      {
        code: '        System.out.println("Welcome to CSC103 Programming Fundamentals!")',
        bug: {
          fixed: '        System.out.println("Welcome to CSC103 Programming Fundamentals!");',
          category: "syntax",
          explanation: "Every statement ends with a semicolon. javac stops with `';' expected`.",
          hint: "Look at how this statement ends compared with the next one.",
        },
      },
      { code: '        System.out.println("Java Virtual Machine (JVM) executes bytecode.");' },
      {
        code: '        System.out.println("Compiling with javac...);',
        bug: {
          fixed: '        System.out.println("Compiling with javac...");',
          category: "syntax",
          explanation: "The string literal is never closed, so javac reports an `unclosed string literal`.",
          hint: "Count the double quotes on this line.",
        },
      },
      { code: "    }" },
      { code: "}" },
    ],
  },
  {
    file: "Distance.java",
    title: "Euclidean distance",
    output: "Distance = 5.0",
    lines: [
      { code: "public class Distance {" },
      { code: "    public static void main(String[] args) {" },
      { code: "        double x1 = 1, y1 = 1;" },
      { code: "        double x2 = 4, y2 = 5;" },
      {
        code: "        double dx = x2 + x1;",
        bug: {
          fixed: "        double dx = x2 - x1;",
          category: "logic",
          explanation:
            "The formula needs the difference x2 − x1. With `+` the program still runs, but prints `Distance = 6.40...` (√41) instead of `5.0`.",
          hint: "Check this line against the pseudocode: COMPUTE dx = x2 - x1.",
        },
      },
      {
        code: "        dy = y2 - y1;",
        bug: {
          fixed: "        double dy = y2 - y1;",
          category: "syntax",
          explanation: "`dy` is used without being declared, so javac reports `cannot find symbol`. Declare it with a type.",
          hint: "Where is the type of `dy` given?",
        },
      },
      { code: "        double distance = Math.sqrt(dx * dx + dy * dy);" },
      { code: '        System.out.println("Distance = " + distance);' },
      { code: "    }" },
      { code: "}" },
    ],
  },
  {
    file: "Power.java",
    title: "Exponential value",
    output: "2.0 raised to 10.0 = 1024.0\nPer group: 256",
    lines: [
      { code: "public class Power {" },
      { code: "    public static void main(String[] args) {" },
      { code: "        double x = 2, y = 10;" },
      {
        code: "        double result = Math.pow(y, x);",
        bug: {
          fixed: "        double result = Math.pow(x, y);",
          category: "logic",
          explanation: "`Math.pow(base, exponent)` takes the base first. Swapped, it computes 10² = 100.0 instead of 2¹⁰ = 1024.0.",
          hint: "Which argument of Math.pow is the base?",
        },
      },
      {
        code: '        system.out.println(x + " raised to " + y + " = " + result);',
        bug: {
          fixed: '        System.out.println(x + " raised to " + y + " = " + result);',
          category: "syntax",
          explanation: "Java is case-sensitive: `system` is not the `System` class, so javac cannot find it.",
          hint: "Class names start with a capital letter.",
        },
      },
      { code: "        int groups = 4;" },
      {
        code: "        int perGroup = 1024 / (groups - 4);",
        bug: {
          fixed: "        int perGroup = 1024 / groups;",
          category: "runtime",
          explanation:
            "`groups - 4` is 0. Integer division by zero compiles fine but throws `ArithmeticException: / by zero` when it runs.",
          hint: "Work out the value of the divisor when this line runs.",
        },
      },
      { code: '        System.out.println("Per group: " + perGroup);' },
      { code: "    }" },
      { code: "}" },
    ],
  },
  {
    file: "Circle.java",
    title: "Area of a circle",
    output: "Area of circle r=2 is 12.566370614359172\nRounded: 13",
    lines: [
      { code: "public class Circle {" },
      { code: "    public static void main(String[] args) {" },
      { code: "        double r = 2;" },
      {
        code: "        double area = Math.PI * r * r",
        bug: {
          fixed: "        double area = Math.PI * r * r;",
          category: "syntax",
          explanation: "The declaration is a statement, so it needs a terminating semicolon.",
          hint: "How does every statement end?",
        },
      },
      {
        code: '        System.out.println("Area of circle r=2 is 12.56");',
        bug: {
          fixed: '        System.out.println("Area of circle r=2 is " + area);',
          category: "logic",
          explanation:
            "The result is typed into the string by hand, and π × 2² is 12.566…, not 12.56. The program runs but prints a wrong value; print `area` instead.",
          hint: "Does this line ever use the value computed in `area`?",
        },
      },
      {
        code: '        System.out.println("Rounded: " + Math.round(Area));',
        bug: {
          fixed: '        System.out.println("Rounded: " + Math.round(area));',
          category: "syntax",
          explanation: "`Area` and `area` are different identifiers. Only `area` is declared, so `Area` is an undeclared variable.",
          hint: "Compare the spelling and case with the variable declared above.",
        },
      },
      { code: "    }" },
      { code: "}" },
    ],
  },
];

function bugLinesOf(problem: Problem) {
  return problem.lines.flatMap((l, i) => (l.bug ? [i] : []));
}

function isResolved(state: LineState) {
  return state.fixed && state.classified;
}

function freshState(problem: Problem): LineState[] {
  return problem.lines.map(() => ({ fixed: false, classified: false, misses: 0 }));
}

/** Renders `inline code` spans inside feedback prose. */
function inline(text: string) {
  return text.split(/(`[^`]+`)/).map((chunk, i) =>
    chunk.startsWith("`") ? (
      <code key={i} className="rounded bg-surface-muted px-1 font-mono text-[12px]">
        {chunk.slice(1, -1)}
      </code>
    ) : (
      chunk
    ),
  );
}

export function SyntaxFixerGame() {
  const [index, setIndex] = useState(0);
  const [states, setStates] = useState<LineState[][]>(() => PROBLEMS.map(freshState));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [shaking, setShaking] = useState<number | null>(null);

  const problem = PROBLEMS[index];
  const lineStates = states[index];
  const bugLines = bugLinesOf(problem);
  const done = bugLines.filter((i) => isResolved(lineStates[i])).length;
  const complete = done === bugLines.length;
  const found = CATEGORY_ORDER.map((c) => ({
    category: c,
    count: bugLines.filter((i) => lineStates[i].classified && problem.lines[i].bug!.category === c).length,
  }));

  function patch(line: number, next: Partial<LineState>) {
    setStates((all) => {
      const copy = all.map((s) => [...s]);
      copy[index][line] = { ...copy[index][line], ...next };
      return copy;
    });
  }

  function shake(line: number) {
    setShaking(null);
    requestAnimationFrame(() => setShaking(line));
  }

  function toggleLine(line: number) {
    if (!problem.lines[line].bug) {
      setFeedback({ kind: "clean", line });
      shake(line);
      return;
    }
    const fixed = !lineStates[line].fixed;
    patch(line, { fixed });
    setFeedback({ kind: "bug", line });
  }

  function classify(line: number, picked: ErrorCategory) {
    if (problem.lines[line].bug!.category === picked) {
      patch(line, { classified: true });
      setFeedback({ kind: "bug", line });
    } else {
      patch(line, { misses: lineStates[line].misses + 1 });
      setFeedback({ kind: "wrong", line, picked });
      shake(line);
    }
  }

  function selectProblem(next: number) {
    setIndex(next);
    setFeedback(null);
    setShaking(null);
  }

  function reset() {
    setStates((all) => all.map((s, i) => (i === index ? freshState(problem) : s)));
    setFeedback(null);
  }

  const selected = feedback ? problem.lines[feedback.line] : null;
  const selectedState = feedback ? lineStates[feedback.line] : null;

  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="flex h-11 items-center justify-between gap-3 border-b border-border px-4">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Bug className="size-3.5" aria-hidden />
          Spot the bug
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted">
            {done}/{bugLines.length} fixed
          </span>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset this program"
            title="Reset this program"
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <RotateCcw className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1" role="tablist" aria-label="Programs">
          {PROBLEMS.map((p, i) => (
            <button
              key={p.file}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => selectProblem(i)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                i === index
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {bugLinesOf(p).every((l) => isResolved(states[i][l])) && (
                <>
                  <CircleCheck className="size-3.5 text-success" aria-hidden />
                  <span className="sr-only">Solved:</span>
                </>
              )}
              {p.file}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm leading-relaxed text-muted">
            {problem.title}: tap a line you think is broken to toggle its fix, then classify the error.
          </p>
          {found.map(({ category, count }) => (
            <span
              key={category}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium tabular-nums",
                count > 0 ? "border-success/30 bg-success/10 text-success" : "border-border text-muted",
              )}
            >
              {CATEGORIES[category].label} · {count}
            </span>
          ))}
        </div>

        <ol className="overflow-x-auto rounded-xl border border-border bg-code py-2 font-mono text-[13px] leading-6">
          {problem.lines.map((line, i) => {
            const st = lineStates[i];
            const fixed = !!line.bug && st.fixed;
            const status = fixed ? (st.classified ? "done" : "pending") : "open";
            const current = feedback?.line === i;
            return (
              <li key={i} className="min-w-max">
                <button
                  type="button"
                  aria-pressed={fixed}
                  aria-label={`Line ${i + 1}: ${fixed ? "fixed, toggle to see the original" : "toggle fix"}`}
                  onClick={() => toggleLine(i)}
                  onAnimationEnd={() => setShaking(null)}
                  className={cn(
                    "relative flex min-h-9 w-full items-center pr-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
                    current ? "bg-surface-muted" : "hover:bg-surface-muted/60",
                    fixed && "bg-success/[0.06]",
                    shaking === i && "animate-shake bg-danger/10",
                  )}
                >
                  {current && <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" aria-hidden />}
                  <span className="grid w-9 shrink-0 place-items-center" aria-hidden>
                    {status === "done" ? (
                      <CircleCheck className="size-4 text-success" />
                    ) : status === "pending" ? (
                      <CircleDot className="size-4 text-heap" />
                    ) : (
                      <Wrench className="size-3.5 text-muted/50" />
                    )}
                  </span>
                  <span className="w-7 shrink-0 select-none pr-3 text-right tabular-nums text-muted/60" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="whitespace-pre">{highlight(fixed ? line.bug!.fixed : line.code)}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div aria-live="polite" className="min-h-11">
          <AnimatePresence mode="wait">
            {complete ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 rounded-xl border border-success/40 bg-success/[0.06] p-4 glow-success"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-success">
                  <CircleCheck className="size-4 shrink-0" aria-hidden />
                  All {bugLines.length} bugs fixed. {problem.file} compiles, runs and prints:
                </p>
                <pre className="overflow-x-auto rounded-lg border border-border bg-code px-3 py-2 font-mono text-[13px] leading-6">
                  {problem.output}
                </pre>
                {index < PROBLEMS.length - 1 && (
                  <button
                    type="button"
                    onClick={() => selectProblem(index + 1)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Next program
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                )}
              </motion.div>
            ) : feedback?.kind === "clean" ? (
              <motion.p
                key={`clean-${feedback.line}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
              >
                <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden />
                Line {feedback.line + 1} has no bug: it compiles, runs and does what it says. Keep looking.
              </motion.p>
            ) : feedback && selected?.bug && selectedState ? (
              <motion.div
                key={`bug-${feedback.line}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-3 rounded-xl border border-border bg-surface-muted/40 p-4"
              >
                <div className="overflow-x-auto rounded-lg border border-border bg-code py-1 font-mono text-[13px] leading-6">
                  <div className="flex min-w-max pr-3 text-danger">
                    <span className="w-7 shrink-0 select-none text-center" aria-label="Original">
                      −
                    </span>
                    <span className="whitespace-pre line-through decoration-danger/50">{selected.code.trimStart()}</span>
                  </div>
                  <div className="flex min-w-max pr-3 text-success">
                    <span className="w-7 shrink-0 select-none text-center" aria-label="Fixed">
                      +
                    </span>
                    <span className="whitespace-pre">{selected.bug.fixed.trimStart()}</span>
                  </div>
                </div>

                {!selectedState.fixed && (
                  <p className="text-xs text-muted">Showing the original line. Tap it again to re-apply the fix.</p>
                )}

                {selectedState.classified ? (
                  <div className="space-y-2">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 text-xs font-medium text-success glow-success">
                      <CircleCheck className="size-3.5" aria-hidden />
                      {CATEGORIES[selected.bug.category].label} error
                    </span>
                    <p className="text-sm leading-relaxed">{inline(selected.bug.explanation)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">What kind of error was it?</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Error category">
                      {CATEGORY_ORDER.map((c) => {
                        const wrong = feedback.kind === "wrong" && feedback.picked === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => classify(feedback.line, c)}
                            title={CATEGORIES[c].when}
                            className={cn(
                              "inline-flex h-11 items-center rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-9",
                              wrong
                                ? "border-danger/50 bg-danger/10 text-danger"
                                : "border-border bg-surface hover:bg-surface-muted",
                            )}
                          >
                            {CATEGORIES[c].label}
                          </button>
                        );
                      })}
                    </div>
                    {feedback.kind === "wrong" && (
                      <p className="flex items-start gap-2 text-sm text-heap">
                        <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {selectedState.misses > 1
                          ? selected.bug.hint
                          : `Not ${CATEGORIES[feedback.picked].label.toLowerCase()}: that means ${CATEGORIES[feedback.picked].when}.`}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <p key="idle" className="text-xs leading-relaxed text-muted">
                {CATEGORY_ORDER.map((c, i) => (
                  <span key={c}>
                    {i > 0 && " · "}
                    <span className="font-medium text-foreground">{CATEGORIES[c].label}</span>: {CATEGORIES[c].when}
                  </span>
                ))}
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
