import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Minimal Markdown for lesson prose: paragraphs, "- " and "1. " lists, | tables |, `code`, **bold** and *italic*.

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

export function InlineMarkdown({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE).map((part, i): ReactNode => {
        if (part.length > 2 && part.startsWith("`") && part.endsWith("`"))
          return (
            <code key={i} className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
              {part.slice(1, -1)}
            </code>
          );
        if (part.length > 4 && part.startsWith("**") && part.endsWith("**"))
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
        return part;
      })}
    </>
  );
}

const ORDERED = /^\d+\.\s/;

/** Splits a `| a | b |` row on unescaped pipes; `\|` stays a literal pipe. */
function cells(row: string): string[] {
  return row
    .trim()
    .replace(/^\||\|$/g, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, "|"));
}

function Table({ lines }: { lines: string[] }) {
  const [head, , ...body] = lines;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-left text-sm leading-relaxed">
        <thead className="bg-surface-muted/60">
          <tr>
            {cells(head).map((c, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-foreground">
                <InlineMarkdown text={c} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {body.map((row, r) => (
            <tr key={r}>
              {cells(row).map((c, i) => (
                <td key={i} className="px-4 py-2.5 align-top">
                  <InlineMarkdown text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("space-y-3 text-sm leading-relaxed", className)}>
      {text
        .trim()
        .split(/\n{2,}/)
        .map((para, i) => {
          const lines = para.split("\n");
          if (lines.length >= 2 && lines.every((l) => l.trim().startsWith("|")) && /^\|?[\s:|-]+\|?$/.test(lines[1].trim()))
            return <Table key={i} lines={lines} />;
          if (lines.every((l) => l.startsWith("- ")))
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-muted">
                {lines.map((l, j) => (
                  <li key={j} className="pl-1">
                    <InlineMarkdown text={l.slice(2)} />
                  </li>
                ))}
              </ul>
            );
          if (lines.every((l) => ORDERED.test(l)))
            return (
              <ol key={i} className="list-decimal space-y-1.5 pl-5 marker:font-mono marker:text-muted">
                {lines.map((l, j) => (
                  <li key={j} className="pl-1">
                    <InlineMarkdown text={l.replace(ORDERED, "")} />
                  </li>
                ))}
              </ol>
            );
          return (
            <p key={i}>
              <InlineMarkdown text={lines.join(" ")} />
            </p>
          );
        })}
    </div>
  );
}
