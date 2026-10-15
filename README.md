<div align="center">

# 🔭 StackSight

### See what your Java code is *actually* doing.

**An interactive, beginner-centric Java learning platform built for CSC103 Programming Fundamentals.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5-433E38?style=for-the-badge)](https://zustand.docs.pmnd.rs)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](#-license)
[![Vercel](https://img.shields.io/github/deployments/omarcui/stacksight/production?style=for-the-badge&logo=vercel&label=Vercel)](https://vercel.com)

<br />

[**🚀 Live Demo**](https://stacksight.vercel.app) &nbsp;·&nbsp;
[**⚡ Quick Start**](#-quick-start--local-development) &nbsp;·&nbsp;
[**📚 Curriculum**](#-course-curriculum-architecture) &nbsp;·&nbsp;
[**🧪 Lab Manual**](docs/lab-manual.md) &nbsp;·&nbsp;
[**🤝 Contribute**](#-contributing)

</div>

---

## 📖 Table of Contents

- [Why StackSight?](#-why-stacksight)
- [Key Features](#-key-features)
- [Course Curriculum Architecture](#-course-curriculum-architecture)
- [Quick Start / Local Development](#-quick-start--local-development)
- [Tech Stack & Architecture](#️-tech-stack--architecture)
- [Deployment Guide](#-deployment-guide)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 Why StackSight?

Most first-year students meet Java as a wall of syntax: `public static void main(String[] args)` before they know what a class is, memory they can't see, and compiler errors that read like riddles. **StackSight makes the invisible visible.** Every concept is paired with a live simulator that shows what the JVM, the stack, or the loop counter is doing, one step at a time.

Every lesson follows the same scaffolded path:

```
🌍 Real-World Analogy  ➔  📐 Step-by-Step Theory  ➔  🧾 Annotated Code  ➔  🎮 Interactive Experiment  ➔  ✅ Quiz Verification
```

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🎮 12 Interactive Visualizers
Real-time simulators for the hardest early concepts: JVM architecture, the compile→execute lifecycle, stack memory allocation, type-casting truncation, `printf` formatting, decision trees, and step-through loop execution.

</td>
<td width="50%" valign="top">

### 📖 Scaffolded Pedagogy
A beginner-first learning path. Each lesson opens with an analogy, builds the theory step by step, annotates real code line by line, then hands you an experiment before testing you on it.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### ⚡ In-Browser Java Sandbox
A code editor with an interactive console, powered by a client-side interpreter for the CSC103 Java subset. It handles `System.out.printf`, `Scanner(System.in)`, integer overflow, integer division, and `==` vs `.equals()` on Strings. Nothing to install, and no server round-trips.

</td>
<td width="50%" valign="top">

### 🧠 Smart Quiz Engine
Module-level self-assessments with **4 question types** (Multiple Choice, Syntax Fix, Output Prediction, Code Fill). Any module scored **below 60%** is flagged as a weak topic so you know what to revisit.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📊 Progress Analytics & Persistence
Completion and streak tracking, bookmarks, and quiz history, persisted to `localStorage` with versioned state migration and kept in sync across browser tabs.

</td>
<td width="50%" valign="top">

### 🌙 Modern Dark-First UI
A collapsible responsive sidebar, breadcrumbs, glowing design tokens, comfortable reading typography, light/dark themes, and a `reducedMotion` mode for accessibility.

</td>
</tr>
</table>

---

## 📚 Course Curriculum Architecture

The course follows the CSC103 syllabus in **6 modules across two phases**. Each module lines up with a lab in [`docs/lab-manual.md`](docs/lab-manual.md).

### 🅰️ Phase A: Core Fundamentals

| # | Module | Core Topics | Lab Deliverables | Interactive Widgets |
| :-: | :--- | :--- | :--- | :--- |
| **1** | Computers, Programs & the Java Platform | JDK / JRE / JVM, compile–execute lifecycle, pseudocode, flowcharts, `Math` functions | `Welcome.java`, Euclidean Distance, Exponential (xʸ) | JVM Architecture Visualizer · Execution Lifecycle Simulator · Flowchart Runner · Exponential Evaluator |
| **2** | Java Syntax Fundamentals | Program structure, tokens, syntax vs runtime vs logic errors | Bug-Spotting Challenge | Code Anatomy Inspector · Syntax Fixer Game |
| **3** | Primitive Data Types | Sizes, literals, memory storage, widening & narrowing casts | `TypeCastingDemo.java`, Base Representations | Primitive Memory Visualizer · Primitive Stack Tracker · Type Casting Evaluator |

### 🅱️ Phase B: Intermediate Programming

| # | Module | Core Topics | Lab Deliverables | Interactive Widgets |
| :-: | :--- | :--- | :--- | :--- |
| **4** | Console I/O | `Scanner` input, `printf` formatting, escape sequences | `CircleAreaCalculator.java`, Tabular Output | Printf Formatter Visualizer |
| **5** | Selection Statements | Relational logic, `if-else`, `switch` | `GrossPayCalculator.java`, `ChineseZodiac.java` | Decision Branch Visualizer |
| **6** | Logic and Loops | Logical & ternary operators, `while`, `do-while`, `for`, sentinels | `GuessNumber.java`, `SentinelValue.java` | Loop Execution Debugger |

> [!TIP]
> Every lab exercise above can be typed and run directly in the **Sandbox** (`/sandbox`). Open the snippet drawer for ready-made starters such as *Hello, World*, *Scanner: greeting*, *printf: receipt*, and the classic *nextInt + nextLine* pitfall.

---

## ⚡ Quick Start / Local Development

### Prerequisites

| Tool | Version |
| :--- | :--- |
| [Node.js](https://nodejs.org) | **20.9+** (required by Next.js 16) |
| npm | 10+ (bundled with Node) |
| Git | any recent version |

### 1. Clone the repository

```bash
git clone https://github.com/omarcui/stacksight.git
cd stacksight
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment (optional)

StackSight runs fully client-side and **needs no environment variables** to start. If you add integrations later, keep secrets in a local, git-ignored file:

```bash
touch .env.local
```

> [!NOTE]
> Vercel Analytics turns on automatically when the app is deployed to Vercel. Locally, it does nothing.

### 4. Start the dev server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and start with Module 1. 🎉

### Available scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) · React 19 · TypeScript 5 | Routing, layouts, streaming `loading` states, static rendering of curriculum pages |
| **State Management** | [Zustand 5](https://zustand.docs.pmnd.rs) + `persist` middleware | Progress, quiz attempts, bookmarks, and preferences, with versioned (v2) `localStorage` migration and cross-tab `storage` sync |
| **UI / Styling** | [Tailwind CSS v4](https://tailwindcss.com) (CSS-first tokens) · [Framer Motion](https://motion.dev) · [Lucide](https://lucide.dev) · `next-themes` | Design tokens in `app/globals.css`, animation, iconography, theming |
| **Engine** | Custom TypeScript Java-subset interpreter (`lib/sandbox-runner.ts`) | Generator-based evaluator: `Scanner` reads suspend until the console sends input, and long loops yield so the UI stays responsive and *Stop* works |
| **Deployment** | [Vercel](https://vercel.com) · [`@vercel/analytics`](https://vercel.com/analytics) | Hosting, preview deployments, privacy-friendly analytics |

### 📁 Repository Structure

```text
stacksight/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout, theme provider, analytics
│   ├── page.tsx                # Dashboard / landing
│   ├── globals.css             # Tailwind v4 design tokens
│   ├── modules/[id]/           # Module reader (page + loading skeleton)
│   ├── quizzes/[id]/           # Module quiz sessions
│   ├── sandbox/                # In-browser Java editor + console
│   └── progress/               # Progress analytics page
│
├── components/
│   ├── interactive/            # 🎮 The 12 visualizers, grouped by module
│   │   ├── module1/            #   JVM Architecture, Execution Lifecycle, Flowchart, Exponential
│   │   ├── module2/            #   Code Anatomy Inspector, Syntax Fixer Game
│   │   ├── module3/            #   Primitive Memory, Stack Tracker, Type Casting
│   │   ├── module4/            #   Printf Formatter
│   │   ├── module5/            #   Decision Branch
│   │   └── module6/            #   Loop Execution Debugger
│   ├── reader/                 # Lesson renderer: content blocks, code, callouts, nav
│   ├── quiz/                   # Quiz runner, question types, summary card
│   ├── sandbox/                # Editor, console terminal, snippet drawer
│   ├── layout/                 # App shell, navbar, sidebar, theme toggle
│   ├── dashboard/              # Dashboard widgets
│   └── progress/               # Analytics charts & stats
│
├── data/
│   ├── curriculumData.ts       # Modules → units → lessons → content blocks
│   ├── quizData.ts             # Question banks for all 6 modules
│   └── sandboxTemplates.ts     # Starter snippets for the sandbox
│
├── lib/
│   ├── sandbox-runner.ts       # Java-subset interpreter
│   ├── java-format.ts          # printf / String.format semantics
│   ├── quiz.ts                 # Scoring & weak-topic helpers
│   └── curriculum-utils.ts     # Lesson lookup & navigation helpers
│
├── store/
│   └── useCourseStore.ts       # Zustand store (persisted, v2 migrations)
│
├── types/
│   ├── curriculum.ts           # Module / Unit / Lesson / ContentBlock types
│   └── quiz.ts                 # Discriminated union of question types
│
└── docs/
    ├── lab-manual.md           # CSC103 lab exercises & mapping matrix
    └── ui-spec.md              # Design system: tokens, layouts, component rules
```

> [!IMPORTANT]
> All UI work must follow [`docs/ui-spec.md`](docs/ui-spec.md). Tailwind v4 is CSS-first, so there is **no** `tailwind.config.ts`. Tokens live in `app/globals.css`.

---

## 🚀 Deployment Guide

StackSight is a standard Next.js app and deploys to Vercel with no configuration.

### Option A: One-click via the Vercel dashboard

1. Push your fork to GitHub.
2. Go to **[vercel.com/new](https://vercel.com/new)** and import the repository.
3. Vercel detects **Next.js** automatically. Keep the defaults:
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
4. Click **Deploy**. Every later push to `main` ships to production, and every pull request gets its own preview URL.
5. *(Optional)* Turn on **Analytics** under **Project → Analytics** to start collecting page-view data.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel          # create a preview deployment
vercel --prod   # promote to production
```

> [!TIP]
> Run `npm run build` locally before you push. It catches type errors and build failures before Vercel does.

---

## 🤝 Contributing

Contributions are welcome, whether it's a typo fix, a sharper analogy, a new quiz question, or a whole new visualizer.

1. **Fork** the repo and create a branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Make your changes**, following these guidelines:
   - 🎨 UI follows [`docs/ui-spec.md`](docs/ui-spec.md) and uses existing design tokens.
   - 📖 New lessons keep the *Analogy ➔ Theory ➔ Code ➔ Experiment ➔ Quiz* structure.
   - 🧪 Curriculum content lives in `data/`, and types live in `types/`. Keep them in sync.
   - ♿ Animations respect the `reducedMotion` preference.
3. **Check your work:**
   ```bash
   npm run lint && npm run build
   ```
4. **Commit** using [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, and so on).
5. **Open a pull request** that explains what changed and why. Include screenshots for UI changes.

Found a bug or have an idea? [Open an issue](https://github.com/omarcui/stacksight/issues).

---

## 📄 License

Distributed under the **MIT License**. You are free to use, modify, and distribute this project with attribution. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

**Built with ☕ for CSC103 students learning to think in Java.**

If StackSight helped you, consider giving it a ⭐ on GitHub!

</div>
