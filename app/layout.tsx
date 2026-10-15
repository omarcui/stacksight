import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { curriculumData } from "@/data/curriculumData";
import { assertValidCurriculum } from "@/lib/curriculum-utils";
import { themeInitScript } from "@/lib/theme";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Fail fast: the root layout wraps every route, so bad curriculum data breaks
// `next build` at prerender and `next dev` on first load (server-side only).
assertValidCurriculum(curriculumData);

export const metadata: Metadata = {
  title: {
    default: "StackSight",
    template: "%s · StackSight",
  },
  description: "CSC103 Programming Fundamentals interactive platform: Java modules, visualizers, quizzes, and a code sandbox.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Dark is the default; the theme script removes `dark` before first paint if the user chose light.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${jetbrainsMono.variable} dark h-full overflow-hidden antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* The viewport never scrolls: the app shell's <main> is the page scroll container. */}
      <body className="h-full overflow-hidden overscroll-none bg-background text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
