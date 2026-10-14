"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Braces, CaseSensitive, CornerDownLeft, Play, type LucideIcon } from "lucide-react";
import { cn, highlight } from "@/lib/utils";

type PartId = "className" | "mainHeader" | "terminator" | "braces";
type BlockId = "class" | "main";
type Tagged = { text: string; part: PartId; block?: BlockId };
type Segment = string | Tagged;

interface Part {
  label: string;
  icon: LucideIcon;
  rule: string;
  caseRule?: string;
}

/** An active highlight: which part is lit, plus where its tooltip is anchored. */
interface Active {
  part: PartId;
  block?: BlockId;
  key: string;
  top: number;
  left: number;
}

const TOOLTIP_W = 288;
const GUTTER = 8;

const PARTS: Record<PartId, Part> = {
  className: {
    label: "Class name",
    icon: Box,
    rule: "`public class Welcome` declares the class. A public class must be saved in a file with exactly the same name, `Welcome.java`, and class names use PascalCase.",
    caseRule:
      "Java is case-sensitive: `Area` and `area` are two different identifiers. Rename the class to `welcome` and it no longer matches `Welcome.java`, so javac rejects it.",
  },
  mainHeader: {
    label: "Main method header",
    icon: Play,
    rule: "The JVM starts running the program here. The header must be exactly `public static void main(String[] args)`: `public` so the JVM can call it, `static` so no object is needed, `void` because it returns nothing.",
    caseRule:
      "Keywords and library names keep their exact case: `Main` is not the entry point, `string` is not a type (`String` is), and `Public` does not compile.",
  },
  terminator: {
    label: "Statement terminator",
    icon: CornerDownLeft,
    rule: "Every statement ends with `;`. Forgetting one is a syntax error that javac reports as `';' expected`. Class and method headers end with a block, not a semicolon.",
  },
  braces: {
    label: "Block braces",
    icon: Braces,
    rule: "Braces group code into a block, and every `{` needs a matching `}`. The class block holds the `main` method, and the method block holds the statements that run.",
  },
};

const PART_ORDER: PartId[] = ["className", "mainHeader", "terminator", "braces"];

const BLOCK_NOTES: Record<BlockId, string> = {
  class: "This pair wraps the class body.",
  main: "This pair wraps the body of `main`.",
};

// Welcome.java from Lab 1, Exercise 1.2, split into plain and inspectable segments.
const LINES: Segment[][] = [
  ["public class ", { text: "Welcome", part: "className" }, " ", { text: "{", part: "braces", block: "class" }],
  [
    "    ",
    { text: "public static void main(String[] args)", part: "mainHeader" },
    " ",
    { text: "{", part: "braces", block: "main" },
  ],
  ['        System.out.println("Welcome to CSC103 Programming Fundamentals!")', { text: ";", part: "terminator" }],
  ['        System.out.println("Java Virtual Machine (JVM) executes bytecode.")', { text: ";", part: "terminator" }],
  ['        System.out.println("Compiling with javac...")', { text: ";", part: "terminator" }],
  ["    ", { text: "}", part: "braces", block: "main" }],
  [{ text: "}", part: "braces", block: "class" }],
];

/** First segment of each part; the tooltip anchors there when a legend chip is chosen. */
const FIRST_KEY = Object.fromEntries(
  PART_ORDER.map((part) => {
    for (const [li, line] of LINES.entries()) {
      const si = line.findIndex((s) => typeof s !== "string" && s.part === part);
      if (si !== -1) return [part, `${li}:${si}`];
    }
    return [part, ""];
  }),
) as Record<PartId, string>;

/** Renders `inline code` spans inside tooltip prose. */
function inline(text: string): ReactNode[] {
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

export function CodeAnatomyInspector() {
  const tooltipId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const segRefs = useRef(new Map<string, HTMLButtonElement>());
  const [hover, setHover] = useState<Active | null>(null);
  const [pinned, setPinned] = useState<Active | null>(null);
  const active = hover ?? pinned;

  function locate(key: string, part: PartId, block?: BlockId): Active | null {
    const el = segRefs.current.get(key);
    const wrap = wrapRef.current;
    if (!el || !wrap) return null;
    const a = el.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const left = Math.max(GUTTER, Math.min(a.left - w.left, w.width - TOOLTIP_W - GUTTER));
    return { part, block, key, top: a.bottom - w.top + 6, left };
  }

  function clear() {
    setHover(null);
    setPinned(null);
  }

  function togglePin(next: Active | null) {
    setPinned((cur) => (cur && next && cur.key === next.key && cur.block === next.block ? null : next));
  }

  function lit(seg: Tagged) {
    return !!active && seg.part === active.part && (!active.block || seg.block === active.block);
  }

  const part = active ? PARTS[active.part] : null;

  return (
    <section
      className="rounded-2xl border border-border bg-surface"
      onKeyDown={(e) => e.key === "Escape" && clear()}
    >
      <div className="flex h-11 items-center justify-between gap-3 border-b border-border px-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Code anatomy</span>
        <span className="font-mono text-xs text-muted">Welcome.java</span>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-sm leading-relaxed text-muted">
          Hover, focus or tap an underlined segment to light up its part of the program. Choose a part below to
          see every place it appears.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Program parts">
          {PART_ORDER.map((id) => {
            const { label, icon: Icon } = PARTS[id];
            const on = pinned?.part === id && !pinned.block;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => togglePin(on ? null : locate(FIRST_KEY[id], id))}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  on
                    ? "border-tracer/50 bg-tracer/10 text-tracer"
                    : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        <div ref={wrapRef} className="relative">
          <div
            className="overflow-x-auto rounded-xl border border-border bg-code py-2"
            onScroll={() => active && clear()}
          >
            <pre className="min-w-max font-mono text-[13px] leading-7">
              <code>
                {LINES.map((line, li) => (
                  <div key={li} className="flex pr-4">
                    <span className="w-10 shrink-0 select-none pr-3 text-right tabular-nums text-muted/60" aria-hidden>
                      {li + 1}
                    </span>
                    <span className="whitespace-pre">
                      {line.map((seg, si) => {
                        if (typeof seg === "string") return <span key={si}>{highlight(seg)}</span>;
                        const key = `${li}:${si}`;
                        const on = lit(seg);
                        const activate = () => locate(key, seg.part, seg.block);
                        return (
                          <button
                            key={si}
                            ref={(el) => {
                              if (el) segRefs.current.set(key, el);
                              else segRefs.current.delete(key);
                            }}
                            type="button"
                            aria-label={`${seg.text}: ${PARTS[seg.part].label}`}
                            aria-describedby={on && active?.key === key ? tooltipId : undefined}
                            onMouseEnter={() => setHover(activate())}
                            onMouseLeave={() => setHover(null)}
                            onFocus={() => setHover(activate())}
                            onBlur={() => setHover(null)}
                            onClick={() => togglePin(activate())}
                            className={cn(
                              "rounded-sm underline decoration-dotted underline-offset-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                              on
                                ? "bg-tracer/15 text-tracer decoration-tracer/60 ring-1 ring-tracer/50"
                                : "decoration-border-strong hover:bg-surface-muted",
                            )}
                          >
                            {on ? seg.text : highlight(seg.text)}
                          </button>
                        );
                      })}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>

          <AnimatePresence>
            {active && part && (
              <motion.div
                key={`${active.part}-${active.block ?? ""}`}
                id={tooltipId}
                role="tooltip"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                style={{ top: active.top, left: active.left, width: TOOLTIP_W }}
                className="pointer-events-none absolute z-20 max-w-[calc(100%-1rem)] space-y-2 rounded-xl border border-border-strong bg-surface p-3 shadow-2xl"
              >
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-tracer">
                  <part.icon className="size-3.5" aria-hidden />
                  {part.label}
                </p>
                <p className="text-xs leading-relaxed text-foreground">{inline(part.rule)}</p>
                {active.block && <p className="text-xs leading-relaxed text-muted">{inline(BLOCK_NOTES[active.block])}</p>}
                {part.caseRule && (
                  <div className="rounded-lg border border-border bg-surface-muted/60 p-2">
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <CaseSensitive className="size-3.5" aria-hidden />
                      Case sensitivity
                    </p>
                    <p className="text-xs leading-relaxed text-foreground">{inline(part.caseRule)}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
