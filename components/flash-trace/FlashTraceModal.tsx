"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Flame, Pause, Play, RotateCcw, Square, Star, Trophy, X, Zap } from "lucide-react";
import { create } from "zustand";
import { curriculumData } from "@/data/curriculumData";
import { flashTraceData } from "@/data/flashTraceData";
import { getModuleById, moduleNumber } from "@/lib/curriculum-utils";
import { cn, highlight } from "@/lib/utils";
import { useCourseStore, useCourseStoreHydrated } from "@/store/useCourseStore";
import type { ModuleId } from "@/types/curriculum";
import type { FlashTraceDifficulty, FlashTraceQuestion } from "@/types/flash-trace";

// Flash-Trace: 2-minute rapid-fire output prediction challenge (docs/ui-spec.md §3.7).
// One modal instance is mounted by the app shell; anything can open it via openFlashTrace().

// ---------------------------------------------------------------------------
// Launcher
// ---------------------------------------------------------------------------

const useFlashTraceLauncher = create<{ open: boolean }>()(() => ({ open: false }));

export const openFlashTrace = () => useFlashTraceLauncher.setState({ open: true });
export const closeFlashTrace = () => useFlashTraceLauncher.setState({ open: false });

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export const SESSION_MS = 120_000;
const TICK_MS = 100;
/** Feedback stays up this long before the next question; Enter skips it. */
const FEEDBACK_MS = { correct: 650, wrong: 1700 } as const;
/** Deck passes generated per session; far more rounds than fit in two minutes. */
const DECK_PASSES = 3;

const POINTS: Record<FlashTraceDifficulty, number> = { easy: 100, medium: 150, hard: 200 };

/** Streak (including the current answer) needed for each multiplier, highest first. */
const MULTIPLIERS = [
  { streak: 6, value: 2 },
  { streak: 3, value: 1.5 },
] as const;

function multiplierFor(streak: number) {
  return MULTIPLIERS.find((m) => streak >= m.streak)?.value ?? 1;
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

type Round = {
  question: FlashTraceQuestion;
  /** `order[displayIndex]` is the index into `question.options`. */
  order: number[];
};

type Feedback = { choice: number; correct: boolean; points: number };

type Phase = "intro" | "playing" | "paused" | "summary";

type GameState = {
  phase: Phase;
  /** Increments on every start; used to save each finished session exactly once. */
  session: number;
  deck: Round[];
  index: number;
  /** `performance.now()` time the clock runs out; only meaningful while playing. */
  deadline: number;
  remainingMs: number;
  score: number;
  streak: number;
  bestStreak: number;
  answered: number;
  correct: number;
  /** Misses per module this session. */
  missed: Partial<Record<ModuleId, number>>;
  /** Modules with at least one answered question this session. */
  seen: ModuleId[];
  feedback: Feedback | null;
  /** High score before this session started, for the "new best" badge. */
  previousHighScore: number;
};

type GameAction =
  | { type: "start"; now: number; deck: Round[]; previousHighScore: number }
  | { type: "tick"; now: number }
  | { type: "answer"; displayIndex: number }
  | { type: "next" }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "finish" };

const initialGame: GameState = {
  phase: "intro",
  session: 0,
  deck: [],
  index: 0,
  deadline: 0,
  remainingMs: SESSION_MS,
  score: 0,
  streak: 0,
  bestStreak: 0,
  answered: 0,
  correct: 0,
  missed: {},
  seen: [],
  feedback: null,
  previousHighScore: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "start":
      return {
        ...initialGame,
        phase: "playing",
        session: state.session + 1,
        deck: action.deck,
        deadline: action.now + SESSION_MS,
        previousHighScore: action.previousHighScore,
      };

    case "tick": {
      if (state.phase !== "playing") return state;
      const remainingMs = state.deadline - action.now;
      return remainingMs <= 0
        ? { ...state, remainingMs: 0, phase: "summary", feedback: null }
        : { ...state, remainingMs };
    }

    case "answer": {
      if (state.phase !== "playing" || state.feedback) return state;
      const round = state.deck[state.index % state.deck.length];
      const choice = round.order[action.displayIndex];
      if (choice === undefined) return state;
      const { question } = round;
      const correct = choice === question.correctAnswer;
      const streak = correct ? state.streak + 1 : 0;
      const points = correct ? Math.round(POINTS[question.difficulty] * multiplierFor(streak)) : 0;
      return {
        ...state,
        score: state.score + points,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        answered: state.answered + 1,
        correct: state.correct + (correct ? 1 : 0),
        missed: correct
          ? state.missed
          : { ...state.missed, [question.topicTag]: (state.missed[question.topicTag] ?? 0) + 1 },
        seen: state.seen.includes(question.topicTag) ? state.seen : [...state.seen, question.topicTag],
        feedback: { choice: action.displayIndex, correct, points },
      };
    }

    case "next":
      if (!state.feedback) return state;
      return { ...state, feedback: null, index: state.index + 1 };

    case "pause":
      return state.phase === "playing"
        ? { ...state, phase: "paused", remainingMs: Math.max(0, state.deadline - action.now) }
        : state;

    case "resume":
      return state.phase === "paused"
        ? { ...state, phase: "playing", deadline: action.now + state.remainingMs }
        : state;

    case "finish":
      return state.phase === "playing" || state.phase === "paused"
        ? { ...state, phase: "summary", feedback: null }
        : state;
  }
}

function shuffle<T>(items: readonly T[]): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Shuffled questions with shuffled options. Impure, so it runs in event handlers only. */
function buildDeck(): Round[] {
  return Array.from({ length: DECK_PASSES }, () => shuffle(flashTraceData)).flatMap((pass) =>
    pass.map((question) => ({ question, order: shuffle(question.options.map((_, i) => i)) })),
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const eyebrowClass = "text-[11px] font-semibold uppercase tracking-wider text-muted";
const buttonBase = `inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 ${focusRing}`;
const primaryButton = `${buttonBase} bg-accent text-accent-foreground hover:bg-accent/90`;
const secondaryButton = `${buttonBase} border border-border bg-surface hover:bg-surface-muted`;
const ghostButton = `${buttonBase} text-muted hover:bg-surface-muted hover:text-foreground`;
const iconButton = `grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground ${focusRing}`;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Mounted once by the app shell; renders nothing until opened. */
export function FlashTraceModal() {
  const open = useFlashTraceLauncher((s) => s.open);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="flash-trace-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeFlashTrace}
            className="fixed inset-0 z-[55] bg-scrim backdrop-blur-[2px]"
            aria-hidden
          />
          <div key="flash-trace-frame" className="pointer-events-none fixed inset-0 z-[56] grid place-items-center p-3 sm:p-6">
            <FlashTraceDialog />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function FlashTraceDialog() {
  const hydrated = useCourseStoreHydrated();
  const saveResult = useCourseStore((s) => s.saveFlashTraceResult);
  const [game, dispatch] = useReducer(gameReducer, initialGame);
  const dialogRef = useRef<HTMLDivElement>(null);
  const savedSession = useRef(0);

  const round = game.deck.length > 0 ? game.deck[game.index % game.deck.length] : undefined;

  const start = useCallback(() => {
    if (!useCourseStore.persist.hasHydrated()) return;
    dispatch({
      type: "start",
      now: performance.now(),
      deck: buildDeck(),
      previousHighScore: useCourseStore.getState().flashTraceHighScore,
    });
  }, []);

  const pause = useCallback(() => dispatch({ type: "pause", now: performance.now() }), []);
  const resume = useCallback(() => dispatch({ type: "resume", now: performance.now() }), []);

  // Countdown: the reducer derives the remaining time from its deadline on each tick.
  useEffect(() => {
    if (game.phase !== "playing") return;
    const id = window.setInterval(() => dispatch({ type: "tick", now: performance.now() }), TICK_MS);
    return () => window.clearInterval(id);
  }, [game.phase]);

  // Auto-advance after feedback.
  useEffect(() => {
    if (!game.feedback || game.phase !== "playing") return;
    const id = window.setTimeout(
      () => dispatch({ type: "next" }),
      game.feedback.correct ? FEEDBACK_MS.correct : FEEDBACK_MS.wrong,
    );
    return () => window.clearTimeout(id);
  }, [game.feedback, game.phase]);

  // Persist each finished session once.
  useEffect(() => {
    if (game.phase !== "summary" || savedSession.current === game.session || game.answered === 0) return;
    savedSession.current = game.session;
    const missed = (Object.keys(game.missed) as ModuleId[]).filter((id) => (game.missed[id] ?? 0) > 0);
    saveResult(
      game.score,
      game.bestStreak,
      missed,
      game.seen.filter((id) => !missed.includes(id)),
    );
  }, [game, saveResult]);

  // Hotkeys and focus trap.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Tab") {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (e.repeat) return;

      if (e.key === "Escape") {
        e.preventDefault();
        if (game.phase === "playing") pause();
        else closeFlashTrace();
        return;
      }

      if (e.key === " " || e.code === "Space") {
        // Space is the start/pause key everywhere in the dialog, even on a focused button.
        e.preventDefault();
        if (game.phase === "playing") pause();
        else if (game.phase === "paused") resume();
        else start();
        return;
      }

      if (game.phase !== "playing") return;

      if (e.key === "Enter" && game.feedback) {
        e.preventDefault();
        dispatch({ type: "next" });
        return;
      }

      const digit = Number(e.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= (round?.order.length ?? 0)) {
        e.preventDefault();
        dispatch({ type: "answer", displayIndex: digit - 1 });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game.phase, game.feedback, round, pause, resume, start]);

  // Return focus to the launcher on close.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => previous?.focus();
  }, []);

  // Each screen marks its main action; focus it whenever the screen changes.
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [game.phase, hydrated]);

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="flash-trace-title"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      className="pointer-events-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border pl-4 pr-2">
        <h2 id="flash-trace-title" className="flex items-center gap-2 text-base font-semibold">
          <Zap className="size-4 text-heap" aria-hidden />
          Flash-Trace
          <span className="hidden text-xs font-normal text-muted sm:inline">2-minute logic &amp; memory challenge</span>
        </h2>
        <button type="button" onClick={closeFlashTrace} aria-label="Close Flash-Trace" className={iconButton}>
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {game.phase === "intro" && <IntroScreen ready={hydrated} onStart={start} />}
        {(game.phase === "playing" || game.phase === "paused") && round && (
          <PlayScreen
            game={game}
            round={round}
            onAnswer={(displayIndex) => dispatch({ type: "answer", displayIndex })}
            onNext={() => dispatch({ type: "next" })}
            onPause={pause}
            onResume={resume}
            onFinish={() => dispatch({ type: "finish" })}
          />
        )}
        {game.phase === "summary" && <SummaryScreen game={game} onRestart={start} />}
      </div>

      <footer className="hidden h-10 shrink-0 items-center gap-4 border-t border-border px-4 text-[11px] text-muted sm:flex">
        <Hotkey keys="1–4">answer</Hotkey>
        <Hotkey keys="Space">{game.phase === "playing" ? "pause" : game.phase === "paused" ? "resume" : "start"}</Hotkey>
        {game.phase === "playing" && <Hotkey keys="Enter">next</Hotkey>}
        <Hotkey keys="Esc">{game.phase === "playing" ? "pause" : "close"}</Hotkey>
      </footer>
    </motion.div>
  );
}

function Hotkey({ keys, children }: { keys: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className="rounded-md border border-border px-1.5 py-px font-mono text-[10px] text-foreground/80">{keys}</kbd>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Intro
// ---------------------------------------------------------------------------

function IntroScreen({ ready, onStart }: { ready: boolean; onStart: () => void }) {
  const highScore = useCourseStore((s) => s.flashTraceHighScore);
  const bestStreak = useCourseStore((s) => s.flashTraceBestStreak);
  const sessions = useCourseStore((s) => s.flashTraceSessionsCount);

  return (
    <div className="space-y-5 p-5">
      <div>
        <p className="text-sm leading-relaxed">
          Predict the output or state of short Java snippets as fast as you can. You have{" "}
          <span className="font-semibold">2 minutes</span>; every miss flags its module as a weak topic.
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <StatTile label="High score" value={ready ? highScore.toLocaleString() : "–"} tone="heap" />
        <StatTile label="Best streak" value={ready ? bestStreak : "–"} tone="success" />
        <StatTile label="Sessions" value={ready ? sessions : "–"} />
      </dl>

      <div className="rounded-xl border border-border bg-surface-muted/50 p-4">
        <p className={eyebrowClass}>Scoring</p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
          <li>
            Easy <Points>{POINTS.easy}</Points> · Medium <Points>{POINTS.medium}</Points> · Hard{" "}
            <Points>{POINTS.hard}</Points>
          </li>
          {MULTIPLIERS.slice()
            .reverse()
            .map((m) => (
              <li key={m.streak} className="flex items-center gap-1.5">
                <Flame className="size-3.5 text-heap" aria-hidden />
                {m.streak} in a row unlocks a <span className="font-semibold text-heap">×{m.value}</span> multiplier
              </li>
            ))}
          <li className="text-muted">A wrong answer resets your streak.</li>
        </ul>
      </div>

      <button type="button" onClick={onStart} disabled={!ready} data-autofocus className={cn(primaryButton, "h-11 w-full")}>
        <Play className="size-4 fill-current" aria-hidden />
        Start challenge
        <kbd className="ml-1 rounded border border-accent-foreground/30 px-1.5 font-mono text-[10px]">Space</kbd>
      </button>
    </div>
  );
}

function Points({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[13px] font-semibold tabular-nums">{children}</span>;
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "heap" | "success" | "stack" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <dt className={eyebrowClass}>{label}</dt>
      <dd
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "heap" && "text-heap",
          tone === "success" && "text-success",
          tone === "stack" && "text-stack",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Play
// ---------------------------------------------------------------------------

const DIFFICULTY_TONE: Record<FlashTraceDifficulty, string> = {
  easy: "border-success/30 bg-success/10 text-success",
  medium: "border-heap/30 bg-heap/10 text-heap",
  hard: "border-danger/30 bg-danger/10 text-danger",
};

function PlayScreen({
  game,
  round,
  onAnswer,
  onNext,
  onPause,
  onResume,
  onFinish,
}: {
  game: GameState;
  round: Round;
  onAnswer: (displayIndex: number) => void;
  onNext: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
}) {
  const { question, order } = round;
  const paused = game.phase === "paused";
  const feedback = game.feedback;
  const multiplier = multiplierFor(game.streak);
  const mod = getModuleById(curriculumData, question.topicTag);
  const correctDisplay = order.indexOf(question.correctAnswer);

  return (
    <div className="space-y-4 p-4 sm:p-5">
      {/* Status row: timer · score · streak */}
      <div className="flex items-center gap-4">
        <TimerRing remainingMs={game.remainingMs} />
        <div className="min-w-0 flex-1">
          <p className={eyebrowClass}>Score</p>
          <div className="relative flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{game.score.toLocaleString()}</span>
            <AnimatePresence>
              {feedback?.correct && (
                <motion.span
                  key={game.answered}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-semibold tabular-nums text-success"
                >
                  +{feedback.points}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-xs tabular-nums text-muted">
            {game.correct}/{game.answered} correct
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium tabular-nums",
              game.streak > 0 ? "border-heap/30 bg-heap/10 text-heap" : "border-border text-muted",
            )}
            aria-label={`Streak ${game.streak}`}
          >
            <Flame className="size-3.5" aria-hidden />
            {game.streak}
          </span>
          <AnimatePresence initial={false}>
            {multiplier > 1 && (
              <motion.span
                key={multiplier}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="rounded-full bg-heap px-2 text-[11px] font-semibold tabular-nums text-role-foreground"
              >
                ×{multiplier}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Question */}
      <section aria-labelledby="flash-trace-question" className="relative overflow-hidden rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
          <span className="font-mono text-[11px] text-muted">#{game.answered + (feedback ? 0 : 1)}</span>
          <h3 id="flash-trace-question" className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            {question.title}
          </h3>
          <span className="truncate text-[11px] text-muted" title={mod?.title}>
            <span className="font-mono">{moduleNumber(question.topicTag)} |</span> {mod?.title}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 text-[10px] font-medium capitalize leading-5",
              DIFFICULTY_TONE[question.difficulty],
            )}
          >
            {question.difficulty}
          </span>
        </div>
        <pre
          className={cn(
            "overflow-x-auto bg-code px-3 py-3 font-mono text-[13px] leading-6 transition-[filter]",
            paused && "select-none blur-sm",
          )}
          aria-hidden={paused}
        >
          {question.codeSnippet.split("\n").map((line, i) => (
            <div key={i} className="flex">
              <span className="w-6 shrink-0 select-none text-right text-muted/60">{i + 1}</span>
              <span className="pl-3">{highlight(line)}</span>
            </div>
          ))}
        </pre>

        {paused && (
          <div className="absolute inset-0 grid place-items-center bg-surface/70 backdrop-blur-[1px]">
            <div className="text-center">
              <p className="text-sm font-semibold">Paused</p>
              <button type="button" onClick={onResume} data-autofocus className={cn(primaryButton, "mt-2")}>
                <Play className="size-4 fill-current" aria-hidden />
                Resume
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Options */}
      <div role="group" aria-label="Answer options" className="grid gap-2 sm:grid-cols-2">
        {order.map((optionIndex, displayIndex) => {
          const picked = feedback?.choice === displayIndex;
          const isCorrect = displayIndex === correctDisplay;
          const reveal = feedback !== null;
          return (
            <motion.button
              key={`${question.id}-${game.index}-${displayIndex}`}
              type="button"
              onClick={() => onAnswer(displayIndex)}
              disabled={paused || reveal}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0, transition: { delay: displayIndex * 0.03, duration: 0.15 } }}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-default",
                focusRing,
                !reveal && "border-border-strong bg-surface hover:border-accent/60 hover:bg-surface-muted",
                reveal && isCorrect && "border-success bg-success/10 glow-success",
                reveal && picked && !isCorrect && "animate-shake border-danger bg-danger/10",
                reveal && !picked && !isCorrect && "border-border opacity-50",
              )}
            >
              <kbd
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md border font-mono text-[11px]",
                  reveal && isCorrect
                    ? "border-success/50 text-success"
                    : reveal && picked
                      ? "border-danger/50 text-danger"
                      : "border-border text-muted",
                )}
              >
                {displayIndex + 1}
              </kbd>
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-[13px]">
                {question.options[optionIndex]}
              </span>
              {reveal && isCorrect && <Check className="size-4 shrink-0 text-success" aria-hidden />}
              {reveal && picked && !isCorrect && <X className="size-4 shrink-0 text-danger" aria-hidden />}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      <div aria-live="polite" className="min-h-[3.25rem]">
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-3 py-2 text-sm",
              feedback.correct ? "border-success/40 bg-success/[0.06]" : "border-danger/40 bg-danger/[0.06]",
            )}
          >
            <p className="min-w-0 flex-1 leading-snug">
              <span className={cn("font-semibold", feedback.correct ? "text-success" : "text-danger")}>
                {feedback.correct ? "Correct." : "Not quite."}
              </span>{" "}
              <span className="text-foreground/85">{question.explanation}</span>
            </p>
            <button type="button" onClick={onNext} className={cn(ghostButton, "h-7 shrink-0 px-2 text-xs")}>
              Next
            </button>
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onFinish} className={cn(ghostButton, "text-xs")}>
          <Square className="size-3.5" aria-hidden />
          End session
        </button>
        {!paused && (
          <button type="button" onClick={onPause} data-autofocus className={cn(secondaryButton, "text-xs")}>
            <Pause className="size-3.5" aria-hidden />
            Pause
          </button>
        )}
      </div>
    </div>
  );
}

const RING_TONES = {
  success: { stroke: "stroke-success", text: "text-success", glow: "drop-glow-success" },
  heap: { stroke: "stroke-heap", text: "text-heap", glow: "drop-glow-heap" },
  danger: { stroke: "stroke-danger", text: "text-danger", glow: "drop-glow-danger" },
} as const;

const RING_RADIUS = 24;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Radial countdown: success above 50% left, heap above 20%, danger after. */
function TimerRing({ remainingMs }: { remainingMs: number }) {
  const fraction = Math.max(0, Math.min(1, remainingMs / SESSION_MS));
  const seconds = Math.ceil(remainingMs / 1000);
  const tone = fraction > 0.5 ? "success" : fraction > 0.2 ? "heap" : "danger";
  const { stroke, text, glow } = RING_TONES[tone];

  return (
    <div
      role="timer"
      aria-label={`${seconds} seconds left`}
      className={cn("relative grid size-16 shrink-0 place-items-center", tone === "danger" && seconds <= 10 && "animate-pulse")}
    >
      <svg viewBox="0 0 56 56" className={cn("absolute inset-0 -rotate-90", glow)} aria-hidden>
        <circle cx="28" cy="28" r={RING_RADIUS} fill="none" strokeWidth="4" className="stroke-surface-muted" />
        <circle
          cx="28"
          cy="28"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - fraction)}
          className={cn(stroke, "transition-[stroke-dashoffset,stroke] duration-100 ease-linear")}
        />
      </svg>
      <span className={cn("relative font-mono text-sm font-semibold tabular-nums", text)}>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function SummaryScreen({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const accuracy = game.answered > 0 ? Math.round((game.correct / game.answered) * 100) : 0;
  const newBest = game.score > 0 && game.score > game.previousHighScore;
  const weak = curriculumData.filter((m) => (game.missed[m.id] ?? 0) > 0);

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={eyebrowClass}>{game.remainingMs <= 0 ? "Time's up" : "Session ended"}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{game.score.toLocaleString()}</p>
          <p className="text-xs text-muted">total score</p>
        </div>
        {newBest && (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-heap/30 bg-heap/10 px-2.5 text-xs font-medium text-heap glow-heap">
            <Trophy className="size-3.5" aria-hidden />
            New high score
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label="Accuracy"
          value={`${accuracy}%`}
          tone={accuracy >= 80 ? "success" : accuracy >= 60 ? "heap" : "danger"}
        />
        <StatTile label="Correct" value={`${game.correct}/${game.answered}`} />
        <StatTile label="Best streak" value={game.bestStreak} tone="heap" />
      </dl>

      <section aria-labelledby="flash-trace-weak" className="rounded-xl border border-border bg-surface-muted/50 p-4">
        <h3 id="flash-trace-weak" className={cn(eyebrowClass, "flex items-center gap-1.5")}>
          <Star className="size-3.5 fill-heap text-heap" aria-hidden />
          Weak topics flagged
        </h3>
        {game.answered === 0 ? (
          <p className="mt-2 text-sm text-muted">No answers this round, so nothing was recorded.</p>
        ) : weak.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Clean run: no misses, and any topics you covered are cleared.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {weak.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/modules/${m.id}`}
                  onClick={closeFlashTrace}
                  className={cn(
                    "-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface",
                    focusRing,
                  )}
                >
                  <span className="font-mono text-xs text-muted">{moduleNumber(m.id)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.title}</span>
                  <span className="text-xs tabular-nums text-danger">
                    {game.missed[m.id]} missed
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={closeFlashTrace} className={secondaryButton}>
          Close
        </button>
        <button type="button" onClick={onRestart} data-autofocus className={primaryButton}>
          <RotateCcw className="size-4" aria-hidden />
          Play again
        </button>
      </div>
    </div>
  );
}
