# StackSight UI Specification

The single source of truth for StackSight's visual language and layout. Every new screen or component
must follow it. If a design decision is not covered here, extend this file in the same change as the code.

Tokens live in [`app/globals.css`](../app/globals.css). This project uses **Tailwind CSS v4 (CSS-first)**:
there is no `tailwind.config.ts`; theme tokens are declared with `@theme inline` and custom utilities with
`@utility`. Do not add a JS config.

---

## 1. Design principles

1. **Dark-first, developer-grade.** Dark is the default theme. Light theme is a first-class, high-contrast
   alternative, not an afterthought.
2. **Color carries meaning.** Accent hues are semantic roles (see §2.2), never decoration. Do not use a role
   color for something outside its role.
3. **Dense but calm.** Compact line-heights, small type for metadata, generous grouping. Prefer one dense
   card over three sparse ones.
4. **Memory is the hero.** Code and memory views get the most space; chrome stays thin.
5. **Every pointer interaction has a tap and keyboard path.** Drag is an enhancement, never the only way.

---

## 2. Design tokens

### 2.1 Surfaces and text

Use the semantic utilities. Do not hardcode `slate-*` values for surfaces.

| Token (utility)          | Dark            | Light      | Use                                        |
| ------------------------ | --------------- | ---------- | ------------------------------------------ |
| `bg-background`          | `#0d1117`       | `#f5f7fb`  | App canvas                                 |
| `bg-surface`             | `#111826`       | `#ffffff`  | Cards, panes, sidebar, header              |
| `bg-surface-muted`       | `#182133`       | `#f1f5f9`  | Hover rows, skeletons, tracks, inset areas |
| `bg-code`                | `#0a0e15`       | `#f8fafc`  | Code editor and visualizer canvases        |
| `border-border`          | `#1e293b`       | `#e2e8f0`  | Default 1px borders and dividers           |
| `border-border-strong`   | `#334155`       | `#cbd5e1`  | Inputs, focused/selected neutral outlines  |
| `text-foreground`        | `#e2e8f0`       | `#0f172a`  | Primary text                               |
| `text-muted`             | `#94a3b8`       | `#64748b`  | Secondary text, labels, metadata           |
| `text-role-foreground`   | `#020617`       | `#ffffff`  | Text and icons on a solid role fill        |
| `bg-scrim`               | `#020617` @ 60% | `#020617` @ 50% | Backdrop behind drawers and modals    |

### 2.2 Semantic role colors

Each role has a single token that is tuned per theme to stay legible as **text** (AA on `surface`).
Fills use opacity modifiers: `bg-<role>/10` for tints, `border-<role>/40` for outlines.

| Role       | Utility suffix | Dark (neon)  | Light (solid) | Meaning                                                       |
| ---------- | -------------- | ------------ | ------------- | ------------------------------------------------------------- |
| Tracer     | `tracer`       | `#22d3ee`    | `#0e7490`     | Active execution: current line, changed values, live arrows   |
| Stack      | `stack`        | `#818cf8`    | `#4f46e5`     | Stack frames, local variables, primary brand accent           |
| Heap       | `heap`         | `#fbbf24`    | `#b45309`     | Heap objects, in-progress state, weak topics, Resume CTAs     |
| Pool       | `pool`         | `#c084fc`    | `#7e22ce`     | Interned/constant pools (String Pool), static storage         |
| Success    | `success`      | `#34d399`    | `#047857`     | Completed modules, correct answers, verification badges       |
| Danger     | `danger`       | `#fb7185`    | `#be123c`     | Wrong answers, errors, unreachable/leaked objects             |

`accent` is an alias of the stack/indigo hue and is the default interactive color (focus rings, primary
buttons, active nav).

Status recipes (cards, badges):

```txt
completed     border-success/40 bg-success/[0.06]  text-success       + check icon
in progress   border-heap/50    bg-heap/[0.06]      text-heap         + glow-heap (dark only)
not started   border-border     bg-surface          text-muted
weak topic    text-heap + filled Star icon
```

### 2.3 Glow

Glows exist only in dark mode; in light mode the same utility collapses to a crisp 1px ring
(`--glow-mix: 0%`). Use them sparingly: at most one glowing element per region, and only for "live" state.

| Utility            | Use                                                      |
| ------------------ | -------------------------------------------------------- |
| `glow-tracer`      | Current execution line, the active scrubber handle       |
| `glow-heap`        | The in-progress module card / Resume CTA                 |
| `glow-stack`       | Selected stack variable during practice                  |
| `glow-success`     | Verification badge after a correct answer                |
| `drop-glow-<role>` | SVG equivalent (`filter: drop-shadow`) for paths/shapes  |

Any role color works: `glow-{tracer|stack|heap|pool|success|danger}`.

### 2.4 Typography

| Element                 | Classes                                                     |
| ----------------------- | ----------------------------------------------------------- |
| Page title              | `text-2xl sm:text-3xl font-semibold tracking-tight`         |
| Section / phase header  | `text-base font-semibold` (+ `text-muted` meta on the right) |
| Card title              | `text-sm font-semibold leading-snug`                        |
| Eyebrow / pane label    | `text-[11px] font-semibold uppercase tracking-wider text-muted` |
| Body                    | `text-sm leading-relaxed`                                   |
| Metadata                | `text-xs text-muted tabular-nums`                           |
| Code, IDs, step counters| `font-mono text-[13px] leading-6` (JetBrains Mono)          |

Fonts: Geist Sans (`font-sans`), JetBrains Mono (`font-mono`), both via `next/font/google` in
`app/layout.tsx`. Module numbers are always zero-padded mono: `01 |`.

### 2.5 Shape, spacing, elevation

- Radius: panes and large cards `rounded-2xl`; cards and inputs `rounded-xl`; buttons, chips and rows
  `rounded-lg`; pills `rounded-full`.
- Borders: always 1px. Separation comes from borders, not shadows. Shadows only on floating layers
  (drawers, popovers): `shadow-2xl`.
- Spacing: 4px grid. Card padding `p-4` (dense) / `p-5`; grid gaps `gap-3`; section gaps `space-y-6`.
- Hit targets: at least 36px (`h-9`) on desktop, 44px (`h-11`) for mobile bottom tabs and practice chips.

### 2.6 Motion

- Use `framer-motion`; the shell wraps everything in `MotionConfig reducedMotion="user"`.
- Durations: 150–250ms for UI, springs (`stiffness 380, damping 36`) for layout and nav indicators.
- Animate *meaning*: arrows draw in (`pathLength`), changed values flash tracer, wrong answers `animate-shake`.

### 2.7 Scrollbars

Thin, themed scrollbars are global (`scrollbar-width: thin` + WebKit fallback). Use `scrollbar-none`
to hide them on horizontal chip rows.

---

## 3. Layout blueprints

### 3.1 App shell (`components/layout/app-shell.tsx`)

```txt
┌────────────────────────────────────────────────────────────────────────────┐
│ ☰  StackSight │ Breadcrumbs …            [3/6 modules ▬▬▬] [★ Weak 2] [◐] │  header h-14
├──────────────┬─────────────────────────────────────────────────────────────┤
│ OVERVIEW     │                                                             │
│  Dashboard   │                                                             │
│ QUICK ACCESS │                     page content                            │
│  ★ Weak  (2) │                                                             │
│  ▢ Bookmarks │                                                             │
│ MODULES      │                                                             │
│  01 Arrays…  │                                                             │
│ TOOLS        │                                                             │
│ ┌──────────┐ │                                                             │
│ │Flash-Trace│ │                                                             │
│ └──────────┘ │                                                             │
└──────────────┴─────────────────────────────────────────────────────────────┘
```

- **Header bar:** logo, route breadcrumbs (md+), then global stats badges: modules complete (links to
  `/progress`), weak topics count (links to `/#weak-topics`), theme toggle. `bg-surface/80 backdrop-blur`.
- **Left sidebar:** 256px expanded / 72px collapsed rail on `lg+`; off-canvas drawer below `lg`.
  Sections: Overview, Quick access (Weak topics, Bookmarks with count badges), Modules (numbered),
  Tools. The Flash-Trace 2-minute challenge card sits at the bottom when expanded.

### 3.2 Dashboard / syllabus roadmap (`app/page.tsx`)

1. Page header (eyebrow + title + one-line description).
2. Stats strip: 4 compact tiles.
3. **Phase-grouped grid**: one section per phase (`Phase A · Core Fundamentals`, `Phase B · Intermediate`),
   with an `n/m complete` meta on the right. Each phase has a 1/2/3-column grid of module cards.
4. Secondary row: Weak topics (`#weak-topics`), Bookmarked lessons (`#bookmarks`), Recent quiz scores.

Module card anatomy:

```txt
┌──────────────────────────────┐
│ 01 |                 ★  ✓    │  mono number · weak star · status icon
│ Arrays & Complexity          │  card title
│ Completed / In progress / 0/3│  status line in role color
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░░  67%     │  progress bar (role color)
│ [ Resume module → ]          │  amber CTA, in-progress card only
└──────────────────────────────┘
```

### 3.3 Dual-pane lesson & trace player (`components/lesson/lesson-workspace.tsx`)

> The `/modules/[id]` route now renders the lesson reader (§3.5). The trace player below is kept for
> traced lessons and is not currently mounted.

```txt
┌ Module 01: Arrays & Complexity → 1.1 Arrays in Java      [★] [Export] [✓ Complete] [Quiz] ┐
│ (1.1 Arrays in Java) (1.2 Big-O) (1.3 ArrayList)   ← lesson chips                          │
├──────────────────────────────────────────┬─────────────────────────────────────────────────┤
│ DESCRIPTION & CODE                       │ MEMORY MODEL              [Memory | Practice]   │
│ prose…                                   │ ┌ Stack (indigo) ┐      ┌ Heap (amber) ────┐    │
│ ┌ code editor ───────────────────────┐   │ │ main           │      │ int[] @1         │    │
│ │ 1  int[] a = {1, 2, 3};            │   │ │  a  ●──────────┼─────▶│ [0] 9 [1] 2 …    │    │
│ │ 2▌ int[] b = a;        ← tracer    │   │ │  b  ●──────────┼─────▶│                  │    │
│ └────────────────────────────────────┘   │ └────────────────┘      └──────────────────┘    │
│ WHAT-IF  [b = a] [b = a.clone()]         │                                                 │
│ TIMELINE ⏮ ◀ ▶/⏸ ▶  ●──●──○──○  2/4      │                                                 │
│ Step narration (aria-live)               │                                                 │
└──────────────────────────────────────────┴─────────────────────────────────────────────────┘
```

- **Header:** breadcrumb (`Module NN: Title → N.N Lesson`), star bookmark toggle, *Export cheat-sheet*
  (downloads Markdown), *Mark complete*, *Take quiz*.
- **Left pane (code & execution):** description, read-only code view with line numbers and the active
  line in tracer (`bg-tracer/10`, left bar, `glow-tracer`), What-if scenario toggles, timeline scrubber
  (reset, step back, play/pause, step forward, range slider with a tick per step, `step n/m` counter),
  and the step narration in an `aria-live="polite"` region.
- **Right pane (SVG visualizer):** pure SVG computed from the trace snapshot. No DOM measurement.
  - Stack frames (indigo outline) on the left with variable rows; reference values render as a dot.
  - Pool (violet) and heap (amber) objects stacked on the right.
  - Pointer arrows are cubic Béziers with arrowheads; field-to-object arrows loop around the right edge.
  - Values or objects changed in the current step are drawn in tracer.
  - Objects unreachable from any frame are dimmed, dashed, and labelled `unreachable`.
- **Desktop (`lg+`):** both panes side by side, filling the viewport height with internal scrolling.
  The right pane switches between Memory and Practice.
- **Mobile (`< lg`):** one pane at a time, selected by a **sticky bottom tab bar**:
  `[Code & Trace] [Memory] [Practice]` (`h-14`, safe-area padded, active tab in accent).

### 3.4 Practice mechanics

- **Pointer matching:** sources (variables and reference fields) on one side, memory objects (plus
  `null`) on the other. Users either drag a source chip onto a target, or tap a source and then tap a target.
  Keyboard users Tab to a chip, press Enter, then press Enter on a target. Each match is verified immediately:
  - correct: the source locks in a success badge (`glow-success`), with a short confirmation;
  - wrong: `animate-shake` with a danger border and an escalating hint (the first hint is generic; the second
    names the code line that set the pointer).
- **Parsons / spot-the-bug (planned):** reorderable code cards (drag handle + up/down buttons), same
  verification badge pattern. Must reuse the chip, badge and hint components above.

---

### 3.5 Lesson reader (`app/modules/[id]/page.tsx`, `components/reader/`)

```txt
┌ Module 01: Arrays & Complexity → 1.2 Indexing & bounds            [✓ Mark complete] [Quiz] ┐
├──────────────────────┬─────────────────────────────────────────────────────────────────────┤
│ UNITS        2/8 done│ UNIT 1 · ARRAYS IN JAVA                                    ◷ 8 min  │
│ 01 Arrays in Java 1/3│   Lesson 1.2                                                        │
│    1.1 Declaring  ✓  │   Indexing & bounds                    ← text-2xl title             │
│ ▌  1.2 Indexing      │   description (muted)                                               │
│    1.3 Multidim…     │   blocks: text · code · callout · formula                           │
│ 02 Big-O         0/3 │   KEY TAKEAWAYS card                                                │
│ 03 ArrayList     0/2 │   [← Previous lesson]                    [Next lesson →]            │
└──────────────────────┴─────────────────────────────────────────────────────────────────────┘
```

- **Data:** `getModuleById(curriculumData, …)` from `data/curriculumData.ts` (Module → Unit → Lesson → ContentBlock).
  The active lesson lives in the course store (`activeLessonId`); completion is stored per lesson.
- **Sidebar:** 18rem pane on `lg+`; one disclosure per unit (`aria-expanded`, mono `01` number,
  `done/total` meta), the active lesson's unit is always opened. Active lesson: `bg-accent/10` + 3px
  accent bar. Below `lg` the outline collapses to its header and toggles open.
- **Lesson pane:** max-w-3xl reading column, internal scroll on `lg+`, scrolled to top on lesson change.
- **Blocks:** `text` (minimal Markdown), `code` (`bg-code` card, language eyebrow, caption, line numbers,
  copy button), `formula` (LaTeX subset rendered as HTML, `role="math"`), `callout` (below).
- **Callout variants:** `rounded-xl border p-4` with icon and eyebrow label, tinted with a role:
  info → `accent`, tip → `success`, warning → `heap`, error_pitfall → `danger` ("Common pitfall").
- **Block headings:** every block sits under a slim heading row: mono index (`01`), a kind eyebrow
  (Reading, Example, Note, Formula, Try it, Quiz) and a round check button on the right. The check
  calls `markSubtopicComplete`; done blocks show a filled `success` check. Checking the last block completes
  the lesson.
- **`quiz_preview` block:** `rounded-xl border-accent/40 bg-accent/[0.06]` card with the teaser question,
  the module quiz status (`Not attempted` / best score in success or danger against the passing score, plus
  attempt count) and a primary *Start module quiz* link to `/quizzes/[moduleId]`.
- **Deliverable card:** below the key takeaways of every lesson in the module, above Prev/Next:
  neutral `rounded-xl border border-border bg-surface-muted/50` (no role tint: it is not a state),
  eyebrow `Lab N deliverable`, title, description and the submission filename as a mono chip. Content comes from `module.deliverable`; module N maps to Lab N of
  `docs/lab-manual.md`, and filenames must match the files named there.
- **Prev/Next:** two cards (`rounded-xl`), crossing unit and module boundaries in reading order; a
  cross-module target shows its module number and navigates to that module's route.

### 3.6 Java sandbox (`app/sandbox/page.tsx`, `components/sandbox/`)

```txt
Tools
Java Sandbox                                                                  [▢ Snippets 3]
┌ EDITOR  Main.java                 [Load template… ▾] ┐ ┌ ▣ CONSOLE (Waiting for input)  [Clear] ┐
│ [▶ Run] [↺ Reset] [Save Snippet]        Ctrl + Enter │ │ $ javac Main.java && java Main         │
├──────────────────────────────────────────────────────┤ │ What is your name? Ada       ← cyan    │
│  1  public class Main {                              │ │ Exception in thread "main" … ← red     │
│  2      public static void main(String[] args) {     │ │ Process finished with exit code 1      │
│  …                                                   │ ├────────────────────────────────────────┤
│ 12 lines                Java subset · runs in browser│ │ › type input…                     [↵]  │
└──────────────────────────────────────────────────────┘ └────────────────────────────────────────┘
```

- **Editor pane:** standard pane header (eyebrow + `Main.java`, template `<select>`), a toolbar row with
  Run (primary; becomes a danger-filled Stop while running), Reset (ghost) and Save Snippet (secondary).
  Replacing the buffer (template, reset, opened snippet) shows an accent pill with *Undo* for 6s.
- **Editor:** `SandboxEditor` layers a transparent `<textarea>` over a highlighted `<pre>` on `bg-code`
  with a line-number gutter. Enter keeps indentation (and splits `{}`), Tab/Shift+Tab indent, Escape then
  Tab leaves the editor, Ctrl/Cmd+Enter runs. The failing line is tinted `bg-danger/10`.
- **Console pane:** always dark (the pane carries the `dark` class so tokens resolve to the dark theme):
  stdout `text-success`, echoed input `text-tracer`, stderr `text-danger`, launcher lines `text-muted`.
  The status pill uses role tints (running → tracer, waiting → heap, finished → success, error → danger).
  The input bar is enabled while a program runs (lines typed early are queued for `Scanner`) and gets
  `glow-tracer` while the program is blocked on input.
- **Snippets:** `SnippetDrawer` slides in from the right (`w-96`, scrim backdrop, Escape closes) with a
  save form on top and the saved list below; delete is a two-step confirm. Snippets and the live editor
  buffer persist through `useCourseStore` (`sandboxCode`, `saveSnippet`, `deleteSnippet`).
- **Layout:** panes side by side on `lg+` filling the viewport height; stacked below `lg` (editor
  `h-128`, console `min-h-88`).
- **Execution:** `lib/sandbox-runner.ts` interprets a Java subset in the browser (no server). Errors are
  printed in `javac`/JVM format so they match what students see locally.

## 4. Component rules

- Class merging: always use `cn()` from `lib/utils.ts` when classes are conditional.
- Buttons:
  - primary: `bg-accent text-accent-foreground`;
  - CTA: `bg-heap text-role-foreground` (Resume). Role fills are deep in light mode and neon in dark mode, so
    text on any solid role fill (`bg-heap`, `bg-success`, `bg-danger`, `bg-tracer`) uses `text-role-foreground`,
    which flips with the theme. Never hardcode `text-white` / `slate-*` for this;
  - secondary: `border border-border bg-surface hover:bg-surface-muted`;
  - ghost: `text-muted hover:bg-surface-muted hover:text-foreground`.
- Focus: every interactive element has `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`.
- Badges/pills: `rounded-full border px-2.5 h-7 text-xs font-medium`, tinted with the role
  (`border-heap/30 bg-heap/10 text-heap`).
- Pane: `rounded-2xl border border-border bg-surface` with a header row
  (`border-b border-border px-4 h-11`) holding an eyebrow label and pane actions.
- Persisted state (`store/useCourseStore.ts`) only renders after hydration. Before hydration, render
  skeletons (`animate-pulse bg-surface-muted`) or neutral values, so server and client markup match.
- Icons: `lucide-react`, `size-4` inline / `size-[18px]` in nav, always `aria-hidden` with a text label nearby.

## 5. Content model for traces

Traces are authored in `lib/traces.ts` as **snapshots per step** (`frames` + `heap`) built with a small
mutation DSL. A lesson can have several scenarios (the What-if toggles). The visualizer, change
highlighting, reachability, practice exercise and cheat-sheet export are all derived from the snapshots.
Adding a lesson trace requires no UI code.
