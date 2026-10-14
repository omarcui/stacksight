import { createElement, Fragment, type ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names conditionally, resolving conflicting Tailwind utilities
 * so the last one wins (e.g. `cn("px-2", "px-4")` -> `"px-4"`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Java syntax highlighting (single line, token-coloured spans)
// ---------------------------------------------------------------------------

const KEYWORDS = new Set([
  "int", "boolean", "char", "double", "long", "new", "null", "return", "public", "private",
  "class", "static", "void", "if", "else", "for", "while", "this", "true", "false",
  "do", "break", "continue", "switch", "case", "default", "final", "import", "var", "float", "byte", "short",
]);
const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\b\d+\b)|(\b[A-Za-z_]\w*\b)|(\s+|.)/g;

export function highlight(line: string): ReactNode[] {
  return [...line.matchAll(TOKEN)].map((m, i) => {
    const [text, comment, str, num, word] = m;
    const tone = comment
      ? "text-muted italic"
      : str
        ? "text-success"
        : num
          ? "text-heap"
          : word && KEYWORDS.has(word)
            ? "text-stack font-medium"
            : word && /^[A-Z]/.test(word)
              ? "text-pool"
              : undefined;
    return tone ? createElement("span", { key: i, className: tone }, text) : createElement(Fragment, { key: i }, text);
  });
}
