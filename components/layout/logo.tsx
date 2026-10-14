import Link from "next/link";
import { Layers } from "lucide-react";

export function Logo({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-lg font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-stack to-tracer text-white">
        <Layers className="size-[18px]" aria-hidden />
      </span>
      <span className="bg-linear-to-r from-stack to-tracer bg-clip-text text-[17px] font-bold text-transparent">
        StackSight
      </span>
    </Link>
  );
}
