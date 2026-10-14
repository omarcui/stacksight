import type { ReactNode } from "react";

// Minimal Markdown for lesson prose: paragraphs, "- " bullet lists, `code`, **bold** and *italic*.

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

export function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {text
        .trim()
        .split(/\n{2,}/)
        .map((para, i) => {
          const lines = para.split("\n");
          if (lines.every((l) => l.startsWith("- ")))
            return (
              <ul key={i} className="list-disc space-y-1 pl-5 marker:text-muted">
                {lines.map((l, j) => (
                  <li key={j}>
                    <InlineMarkdown text={l.slice(2)} />
                  </li>
                ))}
              </ul>
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
