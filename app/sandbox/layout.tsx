import type { Metadata } from "next";

// The sandbox page is a Client Component, so its metadata lives here.
export const metadata: Metadata = { title: "Java Sandbox" };

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
