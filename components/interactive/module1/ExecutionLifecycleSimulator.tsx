"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Cpu, FileCode2, FileCog, ShieldCheck, Upload, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING, StepControls, WidgetPane, useStepper } from "./shared";

type LineKind = "cmd" | "out" | "ok" | "info" | "code";

interface Stage {
  id: string;
  label: string;
  artifact: string;
  icon: LucideIcon;
  actor: string;
  description: string;
  terminal: { kind: LineKind; text: string }[];
}

const STAGES: Stage[] = [
  {
    id: "edit",
    label: "Editing",
    artifact: "Hello.java",
    icon: FileCode2,
    actor: "You + editor",
    description:
      "You write source code in a .java file. The public class name must match the file name, and execution starts at main.",
    terminal: [
      { kind: "cmd", text: "cat Hello.java" },
      { kind: "code", text: "public class Hello {" },
      { kind: "code", text: "    public static void main(String[] args) {" },
      { kind: "code", text: '        System.out.println("Hello, StackSight!");' },
      { kind: "code", text: "    }" },
      { kind: "code", text: "}" },
    ],
  },
  {
    id: "compile",
    label: "Compiling",
    artifact: "Hello.class",
    icon: FileCog,
    actor: "javac",
    description:
      "javac checks syntax and types, then emits platform-independent bytecode into Hello.class. No machine code is produced yet.",
    terminal: [
      { kind: "cmd", text: "javac Hello.java" },
      { kind: "cmd", text: "ls" },
      { kind: "out", text: "Hello.class  Hello.java" },
      { kind: "cmd", text: "javap -c Hello" },
      { kind: "out", text: "public static void main(java.lang.String[]);" },
      { kind: "out", text: "  0: getstatic     #7   // Field java/lang/System.out" },
      { kind: "out", text: "  3: ldc           #13  // String Hello, StackSight!" },
      { kind: "out", text: "  5: invokevirtual #15  // Method println" },
      { kind: "out", text: "  8: return" },
    ],
  },
  {
    id: "load",
    label: "Loading",
    artifact: "Class<Hello>",
    icon: Upload,
    actor: "ClassLoader",
    description:
      "Running java Hello starts the JVM. The bootstrap loader brings in core classes from the runtime image, then the application loader reads Hello.class from the classpath.",
    terminal: [
      { kind: "cmd", text: "java -Xlog:class+load Hello" },
      { kind: "out", text: "[class,load] java.lang.Object source: jrt:/java.base" },
      { kind: "out", text: "[class,load] java.lang.String source: jrt:/java.base" },
      { kind: "out", text: "[class,load] java.lang.System source: jrt:/java.base" },
      { kind: "info", text: "…  ~450 core classes" },
      { kind: "ok", text: "[class,load] Hello source: file:/home/dev/" },
    ],
  },
  {
    id: "verify",
    label: "Verifying",
    artifact: "verified bytecode",
    icon: ShieldCheck,
    actor: "Bytecode Verifier",
    description:
      "Before any instruction runs, the verifier proves the bytecode is type-safe and cannot overflow the operand stack or jump outside its method.",
    terminal: [
      { kind: "cmd", text: "java -Xlog:verification Hello" },
      { kind: "out", text: "[verification] Verifying class Hello with new format" },
      { kind: "out", text: "[verification] Verifying method Hello.main([Ljava/lang/String;)V" },
      { kind: "out", text: "[verification] StackMapTable: frame_count = 0" },
      { kind: "ok", text: "[verification] End class verification for: Hello" },
    ],
  },
  {
    id: "execute",
    label: "Executing",
    artifact: "program output",
    icon: Cpu,
    actor: "Interpreter + JIT",
    description:
      "The execution engine interprets main's bytecode. Methods that run often are compiled to native code by the JIT. When main returns, the JVM exits.",
    terminal: [
      { kind: "cmd", text: "java Hello" },
      { kind: "ok", text: "Hello, StackSight!" },
      { kind: "cmd", text: "echo $?" },
      { kind: "out", text: "0" },
    ],
  },
];

const LINE_TONE: Record<LineKind, string> = {
  cmd: "text-foreground",
  out: "text-muted",
  ok: "text-success",
  info: "text-muted/70 italic",
  code: "text-stack",
};

export function ExecutionLifecycleSimulator() {
  const stepper = useStepper(STAGES.length, 2600);
  const { step } = stepper;
  const stage = STAGES[step];

  return (
    <WidgetPane label="Java execution lifecycle">
      <div className="space-y-4 p-4">
        <ol className="flex items-start" aria-label="Lifecycle stages">
          {STAGES.map((s, i) => {
            const done = i < step;
            const active = i === step;
            const Icon = s.icon;
            return (
              <li key={s.id} className="relative flex flex-1 flex-col items-center">
                {i > 0 && (
                  <span
                    aria-hidden
                    className="absolute top-[18px] right-1/2 left-[-50%] h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-surface-muted"
                  >
                    <motion.span
                      className="block h-full bg-tracer"
                      initial={false}
                      animate={{ width: i <= step ? "100%" : "0%" }}
                      transition={{ duration: 0.25 }}
                    />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => stepper.goTo(i)}
                  aria-current={active ? "step" : undefined}
                  aria-label={`Stage ${i + 1}: ${s.label}`}
                  className={cn(
                    "relative z-10 flex size-9 items-center justify-center rounded-full border transition-colors duration-200",
                    active && "border-tracer bg-tracer/15 text-tracer glow-tracer",
                    done && "border-success/40 bg-success/10 text-success",
                    !active && !done && "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
                    FOCUS_RING,
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
                </button>
                <span className={cn("mt-1.5 text-center text-xs font-medium", active ? "text-tracer" : "text-muted")}>
                  {s.label}
                </span>
                <span className="hidden text-center font-mono text-[11px] text-muted sm:block">{s.artifact}</span>
              </li>
            );
          })}
        </ol>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              aria-live="polite"
              className="rounded-xl border border-border p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Stage {String(step + 1).padStart(2, "0")} · {stage.actor}
              </p>
              <h3 className="mt-1 text-sm font-semibold leading-snug">{stage.label}</h3>
              <p className="mt-2 text-sm leading-relaxed">{stage.description}</p>
              <p className="mt-3 inline-flex h-7 items-center rounded-full border border-tracer/30 bg-tracer/10 px-2.5 font-mono text-xs text-tracer">
                → {stage.artifact}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="overflow-hidden rounded-xl border border-border bg-code">
            <div className="flex h-8 items-center gap-1.5 border-b border-border px-3" aria-hidden>
              <span className="size-2.5 rounded-full bg-danger/60" />
              <span className="size-2.5 rounded-full bg-heap/60" />
              <span className="size-2.5 rounded-full bg-success/60" />
              <span className="ml-2 font-mono text-[11px] text-muted">~/hello — bash</span>
            </div>
            <pre className="min-h-56 overflow-x-auto p-3 font-mono text-[13px] leading-6" aria-label="Simulated terminal output">
              <code key={stage.id}>
                {stage.terminal.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.08 }}
                    className={cn("whitespace-pre", LINE_TONE[line.kind])}
                  >
                    {line.kind === "cmd" && <span className="select-none text-tracer">$ </span>}
                    {line.text}
                  </motion.div>
                ))}
                <motion.span
                  aria-hidden
                  className="inline-block h-4 w-2 translate-y-0.5 bg-tracer"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </code>
            </pre>
          </div>
        </div>

        <StepControls stepper={stepper} />
      </div>
    </WidgetPane>
  );
}
