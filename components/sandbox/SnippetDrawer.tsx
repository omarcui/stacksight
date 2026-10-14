"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookMarked, FolderOpen, Save, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseStore, useCourseStoreHydrated, type CodeSnippet } from "@/store/useCourseStore";

const spring = { type: "spring", stiffness: 380, damping: 36 } as const;
const CONFIRM_MS = 3000;

const iconButton =
  "grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** Slide-out panel listing saved snippets, with a form to save the current editor buffer. */
export function SnippetDrawer({
  open,
  onClose,
  onLoad,
  focusSave,
  defaultTitle,
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (snippet: CodeSnippet) => void;
  /** Focus the title field on open (the Save Snippet button) instead of the close button. */
  focusSave: boolean;
  defaultTitle: string;
}) {
  // Close on Escape and lock page scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="snippets-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-scrim backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.aside
            key="snippets-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={spring}
            role="dialog"
            aria-modal="true"
            aria-labelledby="snippets-title"
            className="fixed inset-y-0 right-0 z-50 flex w-96 max-w-[90vw] flex-col border-l border-border bg-surface shadow-2xl"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border pl-4 pr-2">
              <h2 id="snippets-title" className="flex items-center gap-2 text-base font-semibold">
                <BookMarked className="size-4 text-stack" aria-hidden />
                Saved snippets
              </h2>
              <button type="button" onClick={onClose} aria-label="Close snippets" autoFocus={!focusSave} className={iconButton}>
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <SaveForm defaultTitle={defaultTitle} autoFocus={focusSave} />
            <SnippetList onLoad={onLoad} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SaveForm({ defaultTitle, autoFocus }: { defaultTitle: string; autoFocus: boolean }) {
  const hydrated = useCourseStoreHydrated();
  const saveSnippet = useCourseStore((s) => s.saveSnippet);
  const [title, setTitle] = useState(defaultTitle);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.select();
  }, [autoFocus]);

  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(() => setSaved(false), 1500);
    return () => window.clearTimeout(id);
  }, [saved]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Without a code argument the store saves its live sandboxCode buffer.
    saveSnippet(title);
    setSaved(true);
    setTitle("");
  }

  return (
    <form onSubmit={submit} className="shrink-0 space-y-2 border-b border-border p-4">
      <label htmlFor="snippet-title" className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Save current code
      </label>
      <div className="flex gap-2">
        <input
          id="snippet-title"
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Snippet title"
          maxLength={80}
          autoFocus={autoFocus}
          className="h-9 min-w-0 flex-1 rounded-xl border border-border-strong bg-surface px-3 text-sm outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
        />
        <button
          type="submit"
          disabled={!hydrated}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60",
            saved ? "bg-success/10 text-success" : "bg-accent text-accent-foreground hover:bg-accent/90",
          )}
        >
          <Save className="size-4" aria-hidden />
          <span aria-live="polite">{saved ? "Saved" : "Save"}</span>
        </button>
      </div>
    </form>
  );
}

function SnippetList({ onLoad }: { onLoad: (snippet: CodeSnippet) => void }) {
  const hydrated = useCourseStoreHydrated();
  const snippets = useCourseStore((s) => s.savedSnippets);
  const deleteSnippet = useCourseStore((s) => s.deleteSnippet);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmId) return;
    const id = window.setTimeout(() => setConfirmId(null), CONFIRM_MS);
    return () => window.clearTimeout(id);
  }, [confirmId]);

  if (!hydrated) {
    return (
      <div className="space-y-3 p-4" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (snippets.length === 0) {
    return (
      <div className="grid flex-1 place-items-center p-6 text-center">
        <div>
          <p className="text-sm font-semibold">No snippets yet</p>
          <p className="mt-1 text-sm text-muted">Saved code appears here and stays in this browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <p className="mb-3 text-xs text-muted tabular-nums">
        {snippets.length} saved {snippets.length === 1 ? "snippet" : "snippets"}
      </p>
      <ul className="space-y-3">
        {snippets.map((snippet) => {
          const preview = snippet.code.split("\n").find((l) => l.trim() && !l.trim().startsWith("import")) ?? "";
          const confirming = confirmId === snippet.id;
          return (
            <li key={snippet.id} className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-snug">{snippet.title}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {dateFormat.format(snippet.savedAt)} · {snippet.code.split("\n").length} lines
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => onLoad(snippet)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <FolderOpen className="size-3.5" aria-hidden />
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirming) deleteSnippet(snippet.id);
                      else setConfirmId(snippet.id);
                    }}
                    aria-label={confirming ? `Confirm delete ${snippet.title}` : `Delete ${snippet.title}`}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      confirming
                        ? "bg-danger/10 text-danger"
                        : "text-muted hover:bg-danger/10 hover:text-danger",
                    )}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {confirming && <span>Delete?</span>}
                  </button>
                </div>
              </div>
              <pre className="mt-2 truncate rounded-lg bg-code px-2.5 py-1.5 font-mono text-xs text-muted">{preview.trim() || " "}</pre>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
