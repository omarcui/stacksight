"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING, WidgetPane } from "./shared";

type Role = "stack" | "pool" | "tracer" | "heap" | "success";

type NodeId =
  | "jdk"
  | "jre"
  | "jvm"
  | "compiler"
  | "tools"
  | "rtjar"
  | "classloader"
  | "verifier"
  | "interpreter"
  | "jit"
  | "gc";

interface ArchNode {
  label: string;
  mono?: string;
  role: Role;
  summary: string;
  input?: string;
  output?: string;
  fact: string;
}

const NODES: Record<NodeId, ArchNode> = {
  jdk: {
    label: "JDK",
    mono: "Java Development Kit",
    role: "stack",
    summary: "Everything needed to write, compile, debug and package Java programs. It bundles the development tools and a full JRE.",
    fact: "Install the JDK on developer machines; it is a strict superset of the JRE.",
  },
  jre: {
    label: "JRE",
    mono: "Java Runtime Environment",
    role: "pool",
    summary: "What a machine needs to run already-compiled Java programs: the JVM plus the standard class libraries.",
    fact: "Since Java 11, vendors ship custom runtimes built with jlink instead of a standalone JRE download.",
  },
  jvm: {
    label: "JVM",
    mono: "Java Virtual Machine",
    role: "tracer",
    summary: "An abstract machine that loads, checks and executes bytecode. Each OS has its own JVM, which is what makes .class files portable.",
    input: ".class bytecode",
    output: "native machine instructions",
    fact: "Write once, run anywhere: the bytecode is the same, only the JVM differs per platform.",
  },
  compiler: {
    label: "Compiler",
    mono: "javac",
    role: "stack",
    summary: "Translates human-readable .java source into platform-independent bytecode. Syntax and type errors are reported here, before anything runs.",
    input: "Hello.java",
    output: "Hello.class",
    fact: "javac does very little optimisation; the heavy optimisation happens later in the JIT.",
  },
  tools: {
    label: "Dev tools",
    mono: "jar · javadoc · jdb · jshell",
    role: "stack",
    summary: "Packaging (jar), documentation (javadoc), debugging (jdb) and an interactive REPL (jshell).",
    fact: "jshell (Java 9+) lets you evaluate snippets without writing a class or main method.",
  },
  rtjar: {
    label: "Runtime libraries",
    mono: "rt.jar",
    role: "pool",
    summary: "The Java SE class library: java.lang, java.util, java.io and more. String, ArrayList and System.out all live here.",
    fact: "Up to Java 8 this was rt.jar; Java 9+ stores the same classes as modules in lib/modules.",
  },
  classloader: {
    label: "ClassLoader",
    mono: "Bootstrap → Platform → App",
    role: "heap",
    summary: "Finds .class files on demand, reads their bytes and defines the class in the JVM. Loaders delegate to their parent first.",
    input: "class name",
    output: "loaded Class object",
    fact: "Classes are loaded lazily: Hello loads at startup, but a helper class loads only when first used.",
  },
  verifier: {
    label: "Bytecode Verifier",
    mono: "verify",
    role: "success",
    summary: "Checks loaded bytecode is well-formed and type-safe: no stack overflow/underflow, no illegal casts, no jumps outside the method.",
    input: "loaded class",
    output: "trusted class (or VerifyError)",
    fact: "Verification is why a hand-crafted malicious .class file cannot corrupt JVM memory.",
  },
  interpreter: {
    label: "Interpreter",
    mono: "execution engine",
    role: "tracer",
    summary: "Executes bytecode one instruction at a time. Startup is fast, but each instruction is decoded every time it runs.",
    input: "bytecode",
    output: "program behaviour",
    fact: "The interpreter counts method calls and loop iterations to find hot code for the JIT.",
  },
  jit: {
    label: "JIT Compiler",
    mono: "C1 / C2",
    role: "tracer",
    summary: "Compiles frequently executed (hot) methods to native machine code at run time and caches it, so later calls skip interpretation.",
    input: "hot bytecode",
    output: "optimised native code",
    fact: "This is why Java programs often get faster after a short warm-up.",
  },
  gc: {
    label: "Garbage Collector",
    mono: "GC",
    role: "heap",
    summary: "Reclaims heap memory used by objects that are no longer reachable from any live reference.",
    fact: "You never call free() in Java; unreachable objects are collected automatically.",
  },
};

const ROLE_STYLES: Record<Role, { text: string; frame: string; active: string; glow: string }> = {
  stack: { text: "text-stack", frame: "border-stack/40 bg-stack/[0.04]", active: "border-stack bg-stack/10", glow: "glow-stack" },
  pool: { text: "text-pool", frame: "border-pool/40 bg-pool/[0.04]", active: "border-pool bg-pool/10", glow: "glow-pool" },
  tracer: { text: "text-tracer", frame: "border-tracer/40 bg-tracer/[0.04]", active: "border-tracer bg-tracer/10", glow: "glow-tracer" },
  heap: { text: "text-heap", frame: "border-heap/40 bg-heap/[0.04]", active: "border-heap bg-heap/10", glow: "glow-heap" },
  success: { text: "text-success", frame: "border-success/40 bg-success/[0.04]", active: "border-success bg-success/10", glow: "glow-success" },
};

const PIPELINE: NodeId[] = ["compiler", "classloader", "verifier", "interpreter", "jit"];

export function JVMArchitectureVisualizer() {
  const [selected, setSelected] = useState<NodeId>("jvm");
  const node = NODES[selected];
  const style = ROLE_STYLES[node.role];

  const leaf = (id: NodeId) => <Leaf id={id} selected={selected === id} onSelect={setSelected} />;

  return (
    <WidgetPane
      label="JDK · JRE · JVM architecture"
      actions={
        <span className="hidden items-center gap-1.5 text-xs text-muted sm:inline-flex">
          <MousePointerClick className="size-3.5" aria-hidden />
          Click a component
        </span>
      }
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="rounded-xl bg-code bg-dots p-3">
          <Container id="jdk" selected={selected} onSelect={setSelected}>
            <div className="grid gap-2 sm:grid-cols-2">
              {leaf("compiler")}
              {leaf("tools")}
            </div>
            <Container id="jre" selected={selected} onSelect={setSelected}>
              {leaf("rtjar")}
              <Container id="jvm" selected={selected} onSelect={setSelected}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {leaf("classloader")}
                  {leaf("verifier")}
                  {leaf("interpreter")}
                  {leaf("jit")}
                </div>
                {leaf("gc")}
              </Container>
            </Container>
          </Container>
        </div>

        <div className="flex flex-col gap-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={selected}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              aria-live="polite"
              className={cn("rounded-xl border p-4", style.frame)}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-wider", style.text)}>Role</p>
              <h3 className="mt-1 text-sm font-semibold leading-snug">{node.label}</h3>
              {node.mono && <p className="font-mono text-xs text-muted">{node.mono}</p>}
              <p className="mt-2 text-sm leading-relaxed">{node.summary}</p>
              {node.input && node.output && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  <span className="rounded-lg border border-border bg-surface px-2 py-1">{node.input}</span>
                  <ArrowRight className={cn("size-3.5", style.text)} aria-hidden />
                  <span className={cn("rounded-lg border px-2 py-1", style.active, style.text)}>{node.output}</span>
                </div>
              )}
              <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted">{node.fact}</p>
            </motion.article>
          </AnimatePresence>

          <div className="rounded-xl border border-border p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Path of your code</p>
            <ol className="mt-2 space-y-1">
              {PIPELINE.map((id, i) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setSelected(id)}
                    aria-pressed={selected === id}
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-xs transition-colors",
                      selected === id ? "bg-accent/10 text-foreground" : "text-muted hover:bg-surface-muted hover:text-foreground",
                      FOCUS_RING,
                    )}
                  >
                    <span className="font-mono tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span className={cn("font-medium", selected === id && ROLE_STYLES[NODES[id].role].text)}>
                      {NODES[id].label}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </WidgetPane>
  );
}

function Container({
  id,
  selected,
  onSelect,
  children,
}: {
  id: NodeId;
  selected: NodeId;
  onSelect: (id: NodeId) => void;
  children: ReactNode;
}) {
  const node = NODES[id];
  const style = ROLE_STYLES[node.role];
  const active = selected === id;
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border p-2.5 transition-colors duration-200",
        active ? cn(style.active, style.glow) : style.frame,
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(id)}
        aria-pressed={active}
        className={cn("flex h-7 items-baseline gap-2 rounded-lg px-1.5 text-left", FOCUS_RING)}
      >
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider", style.text)}>{node.label}</span>
        <span className="truncate text-xs text-muted">{node.mono}</span>
      </button>
      {children}
    </div>
  );
}

function Leaf({ id, selected, onSelect }: { id: NodeId; selected: boolean; onSelect: (id: NodeId) => void }) {
  const node = NODES[id];
  const style = ROLE_STYLES[node.role];
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      className={cn(
        "flex min-h-11 w-full flex-col items-start justify-center rounded-lg border px-3 py-2 text-left transition-colors duration-200",
        selected ? cn(style.active, style.glow) : "border-border bg-surface hover:border-border-strong hover:bg-surface-muted",
        FOCUS_RING,
      )}
    >
      <span className={cn("text-sm font-semibold leading-snug", selected && style.text)}>{node.label}</span>
      {node.mono && <span className="font-mono text-[11px] text-muted">{node.mono}</span>}
    </button>
  );
}
