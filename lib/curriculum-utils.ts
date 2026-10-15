import {
  CALLOUT_VARIANTS,
  CONTENT_TYPES,
  MODULE_IDS,
  QUIZ_TYPES,
  WIDGET_IDS,
  type ContentBlock,
  type Curriculum,
  type Lesson,
  type Module,
  type ModuleDeliverable,
  type ModuleId,
  type Unit,
} from "@/types/curriculum";

// Pure helpers over curriculum data. Every function takes the curriculum as an
// argument so it works with the real course, fixtures in tests, or drafts.

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

const includes = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

export const isModuleId = (value: unknown): value is ModuleId => includes(MODULE_IDS, value);

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** Accepts any string so route params can be passed straight through. */
export function getModuleById(curriculum: Curriculum, id: string): Module | undefined {
  return isModuleId(id) ? curriculum.find((m) => m.id === id) : undefined;
}

/** A lesson with its position in the course. Indexes are 0-based. */
export interface LessonLocation {
  module: Module;
  unit: Unit;
  lesson: Lesson;
  moduleIndex: number;
  unitIndex: number;
  /** Index within the unit. */
  lessonIndex: number;
  /** Index across the whole course, in reading order. */
  courseIndex: number;
}

/** Every lesson in reading order (module → unit → lesson). */
export function flattenLessons(curriculum: Curriculum): LessonLocation[] {
  const out: LessonLocation[] = [];
  curriculum.forEach((module, moduleIndex) =>
    module.units.forEach((unit, unitIndex) =>
      unit.lessons.forEach((lesson, lessonIndex) =>
        out.push({ module, unit, lesson, moduleIndex, unitIndex, lessonIndex, courseIndex: out.length }),
      ),
    ),
  );
  return out;
}

export function findLesson(curriculum: Curriculum, lessonId: string): LessonLocation | undefined {
  return flattenLessons(curriculum).find((loc) => loc.lesson.id === lessonId);
}

export function getModuleLessons(module: Module): Lesson[] {
  return module.units.flatMap((u) => u.lessons);
}

export function getFirstLesson(curriculum: Curriculum, moduleId?: ModuleId): LessonLocation | undefined {
  const all = flattenLessons(curriculum);
  return moduleId ? all.find((loc) => loc.module.id === moduleId) : all[0];
}

/** Lesson location only if it belongs to the given module. */
export function findModuleLesson(
  curriculum: Curriculum,
  moduleId: string,
  lessonId: string,
): LessonLocation | undefined {
  const loc = findLesson(curriculum, lessonId);
  return loc?.module.id === moduleId ? loc : undefined;
}

// ---------------------------------------------------------------------------
// Display numbering
// ---------------------------------------------------------------------------

/** Zero-padded module number, e.g. `"module-1"` → `"01"` (see docs/ui-spec.md §2.4). */
/** A module's deliverables, in exercise order. */
export function getDeliverables(module: Module): ModuleDeliverable[] {
  return module.deliverable;
}

export function moduleNumber(moduleId: string): string {
  return moduleId.replace(/^module-/, "").padStart(2, "0");
}

/** Position of a lesson inside its module, e.g. "2.1" (unit 2, lesson 1). */
export function lessonNumber(loc: Pick<LessonLocation, "unitIndex" | "lessonIndex">): string {
  return `${loc.unitIndex + 1}.${loc.lessonIndex + 1}`;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface AdjacentLessons {
  previous: LessonLocation | null;
  next: LessonLocation | null;
}

/**
 * Previous/next lessons in reading order, crossing unit and module boundaries.
 * Pass `{ withinModule: true }` to stop at the current module's edges.
 * Returns both null when the lesson is not in the curriculum.
 */
export function getAdjacentLessons(
  curriculum: Curriculum,
  lessonId: string,
  { withinModule = false }: { withinModule?: boolean } = {},
): AdjacentLessons {
  const all = flattenLessons(curriculum);
  const i = all.findIndex((loc) => loc.lesson.id === lessonId);
  if (i === -1) return { previous: null, next: null };

  const current = all[i];
  const pick = (loc: LessonLocation | undefined) =>
    loc && (!withinModule || loc.module.id === current.module.id) ? loc : null;

  return { previous: pick(all[i - 1]), next: pick(all[i + 1]) };
}

// ---------------------------------------------------------------------------
// Counts & totals
// ---------------------------------------------------------------------------

export function countModuleLessons(module: Module): number {
  return module.units.reduce((sum, u) => sum + u.lessons.length, 0);
}

export function countTotalLessons(curriculum: Curriculum): number {
  return curriculum.reduce((sum, m) => sum + countModuleLessons(m), 0);
}

export function countTotalUnits(curriculum: Curriculum): number {
  return curriculum.reduce((sum, m) => sum + m.units.length, 0);
}

export function getModuleMinutes(module: Module): number {
  return getModuleLessons(module).reduce((sum, l) => sum + l.estimatedMinutes, 0);
}

export function getTotalMinutes(curriculum: Curriculum): number {
  return curriculum.reduce((sum, m) => sum + getModuleMinutes(m), 0);
}

export interface CurriculumStats {
  modules: number;
  units: number;
  lessons: number;
  blocks: number;
  minutes: number;
  lessonsByModule: Partial<Record<ModuleId, number>>;
}

export function getCurriculumStats(curriculum: Curriculum): CurriculumStats {
  const lessons = curriculum.flatMap(getModuleLessons);
  return {
    modules: curriculum.length,
    units: countTotalUnits(curriculum),
    lessons: lessons.length,
    blocks: lessons.reduce((sum, l) => sum + l.blocks.length, 0),
    minutes: lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0),
    lessonsByModule: Object.fromEntries(curriculum.map((m) => [m.id, countModuleLessons(m)])),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: IssueSeverity;
  /** Dotted location, e.g. "module-2.units[0].lessons[3].blocks[1]". */
  path: string;
  message: string;
}

export interface ValidationResult {
  /** True when there are no errors; warnings do not fail validation. */
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/**
 * Checks what the type system can't: unique IDs, non-empty content, sane
 * numbers, per-block required fields, and that every interactive block names a
 * widget registered in ContentBlockRenderer (in case data arrives via JSON or casts).
 */
export function validateCurriculum(curriculum: Curriculum): ValidationResult {
  const issues: ValidationIssue[] = [];
  const error = (path: string, message: string) => issues.push({ severity: "error", path, message });
  const warn = (path: string, message: string) => issues.push({ severity: "warning", path, message });

  const blank = (value: unknown) => typeof value !== "string" || value.trim() === "";
  const requireText = (path: string, field: string, value: unknown) => {
    if (blank(value)) error(path, `"${field}" must be a non-empty string`);
  };

  // Unit and lesson IDs are looked up course-wide, so they must be globally unique.
  const seenModules = new Map<string, string>();
  const seenUnits = new Map<string, string>();
  const seenLessons = new Map<string, string>();
  const claim = (seen: Map<string, string>, kind: string, id: string, path: string) => {
    if (blank(id)) return error(path, `${kind} "id" must be a non-empty string`);
    const prior = seen.get(id);
    if (prior) error(path, `Duplicate ${kind} id "${id}" (first used at ${prior})`);
    else seen.set(id, path);
  };

  if (curriculum.length === 0) warn("curriculum", "Curriculum has no modules");

  curriculum.forEach((module, mi) => {
    const mPath = isModuleId(module.id) ? module.id : `modules[${mi}]`;

    if (!isModuleId(module.id)) error(mPath, `Unknown module id "${module.id}"`);
    claim(seenModules, "module", module.id, mPath);
    requireText(mPath, "title", module.title);
    requireText(mPath, "subtitle", module.subtitle);
    requireText(mPath, "description", module.description);
    requireText(mPath, "iconName", module.iconName);

    const deliverables = Array.isArray(module.deliverable) ? module.deliverable : [];
    if (deliverables.length === 0) error(mPath, "Missing deliverable");
    const seenFilenames = new Set<string>();
    deliverables.forEach((d, di) => {
      const dPath = `${mPath}.deliverable[${di}]`;
      requireText(dPath, "title", d.title);
      requireText(dPath, "description", d.description);
      requireText(dPath, "filename", d.filename);
      if (!blank(d.filename) && !/^[\w.-]+\.[A-Za-z0-9]+$/.test(d.filename))
        warn(dPath, `Filename "${d.filename}" should be a bare name with an extension`);
      if (seenFilenames.has(d.filename)) error(dPath, `Duplicate deliverable filename "${d.filename}"`);
      seenFilenames.add(d.filename);
    });

    if (module.units.length === 0) warn(mPath, "Module has no units");

    module.units.forEach((unit, ui) => {
      const uPath = `${mPath}.units[${ui}]`;
      claim(seenUnits, "unit", unit.id, uPath);
      requireText(uPath, "title", unit.title);
      requireText(uPath, "slideReference", unit.slideReference);
      if (unit.lessons.length === 0) warn(uPath, "Unit has no lessons");

      unit.lessons.forEach((lesson, li) => {
        const lPath = `${uPath}.lessons[${li}]`;
        claim(seenLessons, "lesson", lesson.id, lPath);
        requireText(lPath, "title", lesson.title);
        requireText(lPath, "description", lesson.description);

        if (!Number.isFinite(lesson.estimatedMinutes) || lesson.estimatedMinutes <= 0)
          error(lPath, `"estimatedMinutes" must be a positive number (got ${lesson.estimatedMinutes})`);

        if (lesson.blocks.length === 0) error(lPath, "Lesson has no content blocks");
        if (lesson.keyTakeaways.length === 0) warn(lPath, "Lesson has no key takeaways");
        lesson.keyTakeaways.forEach((t, ti) => requireText(`${lPath}.keyTakeaways[${ti}]`, "takeaway", t));

        const seenBlocks = new Set<string>();
        lesson.blocks.forEach((block, bi) => {
          const bPath = `${lPath}.blocks[${bi}]`;
          if (blank(block.id)) error(bPath, `Block "id" must be a non-empty string`);
          else if (seenBlocks.has(block.id)) error(bPath, `Duplicate block id "${block.id}" in lesson`);
          else seenBlocks.add(block.id);
          validateBlock(block, bPath, error);
        });
      });
    });
  });

  // Out-of-order modules break reading-order navigation.
  const order = curriculum.map((m) => MODULE_IDS.indexOf(m.id)).filter((i) => i !== -1);
  if (order.some((v, i) => i > 0 && v < order[i - 1]))
    warn("curriculum", `Modules are not in canonical order (${MODULE_IDS.join(", ")})`);

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return { valid: errors.length === 0, errors, warnings };
}

function validateBlock(block: ContentBlock, path: string, error: (path: string, message: string) => void) {
  const blank = (value: unknown) => typeof value !== "string" || value.trim() === "";
  const need = (field: keyof ContentBlock) => {
    if (blank(block[field])) error(path, `${block.type} block requires a non-empty "${field}"`);
  };

  if (!includes(CONTENT_TYPES, block.type)) {
    error(path, `Unknown block type "${(block as { type: unknown }).type}"`);
    return;
  }
  if (block.variant !== undefined && !includes(CALLOUT_VARIANTS, block.variant))
    error(path, `Unknown callout variant "${block.variant}"`);
  if (block.quizType !== undefined && !includes(QUIZ_TYPES, block.quizType))
    error(path, `Unknown quiz type "${block.quizType}"`);

  switch (block.type) {
    case "text":
      need("text");
      break;
    case "code":
      need("code");
      need("language");
      break;
    case "callout":
      need("text");
      if (block.variant === undefined) error(path, `callout block requires a "variant"`);
      break;
    case "formula":
      need("latex");
      break;
    case "interactive":
      need("interactiveWidgetId");
      if (!blank(block.interactiveWidgetId) && !includes(WIDGET_IDS, block.interactiveWidgetId))
        error(
          path,
          `Unknown interactiveWidgetId "${block.interactiveWidgetId}" (registered: ${WIDGET_IDS.join(", ")})`,
        );
      break;
    case "quiz_preview":
      need("text");
      break;
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}

/** Throws with a readable report if the curriculum has errors. Useful at module load or in tests. */
export function assertValidCurriculum(curriculum: Curriculum): void {
  const { valid, errors } = validateCurriculum(curriculum);
  if (valid) return;
  const report = errors.map((e) => `  • ${e.path}: ${e.message}`).join("\n");
  throw new Error(`Invalid curriculum (${errors.length} error${errors.length === 1 ? "" : "s"}):\n${report}`);
}
