import { Binary, Boxes, Braces, Cpu, GitBranch, Repeat, Terminal, type LucideIcon } from "lucide-react";

// Explicit map (not `import * as icons`) keeps unused lucide icons out of the bundle.
// Add an entry here when a module in data/curriculumData.ts uses a new `iconName`.
const MODULE_ICONS: Record<string, LucideIcon> = { Binary, Boxes, Braces, Cpu, GitBranch, Repeat, Terminal };

/** Resolves a module's `iconName` to its lucide component, falling back to `Boxes`. */
export function getModuleIcon(iconName: string): LucideIcon {
  return MODULE_ICONS[iconName] ?? Boxes;
}
