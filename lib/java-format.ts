// Java-style number printing for the interactive widgets: Double.toString and a printf subset.

/** Double.toString: plain decimal in [1e-3, 1e7), computerized scientific notation outside it. */
export function javaDouble(x: number) {
  if (Number.isNaN(x)) return "NaN";
  if (!Number.isFinite(x)) return x > 0 ? "Infinity" : "-Infinity";
  const abs = Math.abs(x);
  if (abs === 0 || (abs >= 1e-3 && abs < 1e7)) {
    const s = String(x);
    return s.includes(".") ? s : `${s}.0`;
  }
  const [mantissa, exp] = x.toExponential().split("e");
  return `${mantissa.includes(".") ? mantissa : `${mantissa}.0`}E${exp.replace("+", "")}`;
}

/**
 * |x| as an integer N and scale s with |x| = N × 10^-s, using the shortest round-trip digits
 * (the same digits Double.toString prints). Formatter rounds these HALF_UP, so 2.675 → "2.68".
 */
function decimal(x: number): { n: bigint; scale: number; digits: number } {
  const [mantissa, exp] = Math.abs(x).toExponential().split("e");
  const digits = mantissa.replace(".", "");
  return { n: BigInt(digits), scale: digits.length - 1 - Number(exp), digits: digits.length };
}

function divHalfUp(n: bigint, d: bigint) {
  const q = n / d;
  return (n % d) * BigInt(2) >= d ? q + BigInt(1) : q;
}

function withPoint(digits: string, precision: number) {
  if (precision === 0) return digits;
  const padded = digits.padStart(precision + 1, "0");
  return `${padded.slice(0, -precision)}.${padded.slice(-precision)}`;
}

/** %.<p>f body for |x|, without sign. */
function fixed(x: number, precision: number) {
  const { n, scale } = decimal(x);
  const shift = precision - scale;
  const m = shift >= 0 ? n * BigInt(10) ** BigInt(shift) : divHalfUp(n, BigInt(10) ** BigInt(-shift));
  return withPoint(m.toString(), precision);
}

/** %.<p>e body for |x|, without sign: one digit, point, p digits, e±XX. */
function scientific(x: number, precision: number) {
  if (x === 0) return `${withPoint("0".repeat(precision + 1), precision)}e+00`;
  const { n, scale, digits } = decimal(x);
  let exp = digits - 1 - scale;
  const drop = digits - (precision + 1);
  let m = drop > 0 ? divHalfUp(n, BigInt(10) ** BigInt(drop)) : n * BigInt(10) ** BigInt(-drop);
  if (m.toString().length > precision + 1) {
    m /= BigInt(10);
    exp++;
  }
  const s = m.toString();
  const mantissa = precision === 0 ? s : `${s[0]}.${s.slice(1)}`;
  return `${mantissa}e${exp < 0 ? "-" : "+"}${String(Math.abs(exp)).padStart(2, "0")}`;
}

function group(body: string) {
  const [int, frac] = body.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac === undefined ? grouped : `${grouped}.${frac}`;
}

// ---------------------------------------------------------------------------
// printf: one format specifier applied to one argument.
// ---------------------------------------------------------------------------

export type PrintfConversion = "d" | "f" | "e" | "s";
export type PrintfFlag = "-" | "0" | "+" | ",";
export const PRINTF_FLAGS: PrintfFlag[] = ["-", "0", "+", ","];

export type PrintfArg =
  | { type: "int"; value: number }
  | { type: "double"; value: number }
  | { type: "String"; value: string };

export interface PrintfSpec {
  flags: PrintfFlag[];
  width?: number;
  precision?: number;
  conversion: PrintfConversion;
}

export type PrintfPartKind = "pad" | "zero" | "sign" | "body";
export interface PrintfPart {
  text: string;
  kind: PrintfPartKind;
}

export type PrintfResult =
  | { ok: true; parts: PrintfPart[]; text: string; truncated: string }
  | { ok: false; exception: string; message: string };

const BOXED: Record<PrintfArg["type"], string> = { int: "java.lang.Integer", double: "java.lang.Double", String: "java.lang.String" };

export function specToString({ flags, width, precision, conversion }: PrintfSpec) {
  const ordered = PRINTF_FLAGS.filter((f) => flags.includes(f)).join("");
  return `%${ordered}${width ?? ""}${precision === undefined ? "" : `.${precision}`}${conversion}`;
}

function fail(exception: string, message: string): PrintfResult {
  return { ok: false, exception, message };
}

/** Mirrors java.util.Formatter for %d, %f, %e and %s, including the exceptions it throws. */
export function formatSpec(spec: PrintfSpec, arg: PrintfArg): PrintfResult {
  const { flags, width, precision, conversion } = spec;
  const has = (f: PrintfFlag) => flags.includes(f);

  if (has("-") && has("0")) return fail("IllegalFormatFlagsException", "Flags = '-0'");
  if ((has("-") || has("0")) && width === undefined) return fail("MissingFormatWidthException", specToString(spec));
  if (conversion === "d" && precision !== undefined) return fail("IllegalFormatPrecisionException", String(precision));
  const badFlag =
    conversion === "s" ? flags.find((f) => f !== "-") : conversion === "e" ? flags.find((f) => f === ",") : undefined;
  if (badFlag) return fail("FormatFlagsConversionMismatchException", `Conversion = ${conversion}, Flags = ${badFlag}`);

  let sign = "";
  let body: string;
  let truncated = "";

  if (conversion === "s") {
    const full = arg.type === "String" ? arg.value : arg.type === "int" ? String(arg.value) : javaDouble(arg.value);
    body = precision === undefined ? full : full.slice(0, precision);
    truncated = full.slice(body.length);
  } else {
    const wanted = conversion === "d" ? "int" : "double";
    if (arg.type !== wanted) return fail("IllegalFormatConversionException", `${conversion} != ${BOXED[arg.type]}`);
    const x = arg.value;
    sign = x < 0 || Object.is(x, -0) ? "-" : has("+") ? "+" : "";
    body =
      conversion === "d"
        ? String(Math.abs(x))
        : conversion === "f"
          ? fixed(x, precision ?? 6)
          : scientific(x, precision ?? 6);
    if (has(",")) body = group(body);
  }

  const parts: PrintfPart[] = [];
  const gap = Math.max(0, (width ?? 0) - sign.length - body.length);
  if (gap > 0 && !has("-") && !has("0")) parts.push({ text: " ".repeat(gap), kind: "pad" });
  if (sign) parts.push({ text: sign, kind: "sign" });
  if (gap > 0 && has("0")) parts.push({ text: "0".repeat(gap), kind: "zero" });
  if (body) parts.push({ text: body, kind: "body" });
  if (gap > 0 && has("-")) parts.push({ text: " ".repeat(gap), kind: "pad" });

  return { ok: true, parts, text: parts.map((p) => p.text).join(""), truncated };
}

/** Convenience for "%.2f"-style output inside traces. */
export function formatFixed(x: number, precision: number) {
  return `${x < 0 ? "-" : ""}${fixed(x, precision)}`;
}
