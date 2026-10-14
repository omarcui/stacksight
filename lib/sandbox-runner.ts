/**
 * Browser-side interpreter for the Java subset used by the sandbox (docs/ui-spec.md §3.6).
 *
 * Covers what console exercises need: primitives and Strings with Java semantics (int overflow,
 * integer division, `==` on String references with an interned literal pool), arrays, control flow,
 * static helper methods, `System.out.print/println/printf`, `String.format` and `Scanner(System.in)`.
 *
 * The evaluator is written as generators so a `Scanner` read can suspend the program until the
 * console delivers a line: every blocking operation yields a Promise, and {@link drive} resumes the
 * program with its result. Long loops yield periodically so the page stays responsive and Stop works.
 */

export type OutputStream = "stdout" | "stderr";

export type SandboxIO = {
  write: (text: string, stream: OutputStream) => void;
  /** Resolves with the next line typed into the console, without its newline. */
  readLine: () => Promise<string>;
  signal?: AbortSignal;
};

export type RunResult = {
  status: "ok" | "error" | "stopped";
  exitCode: number;
  /** Source line of the compile or runtime error, if any. */
  errorLine: number | null;
};

/** Reject a pending `readLine` with this (or abort the signal) to stop the program. */
export class SandboxStopped extends Error {
  constructor() {
    super("Program stopped");
    this.name = "SandboxStopped";
  }
}

const MAX_STEPS = 1_000_000;
const MAX_DEPTH = 400;
const YIELD_EVERY = 4_000;
const MAX_SLEEP_MS = 5_000;
const TRACE_LIMIT = 8;
const MAX_ARRAY_LENGTH = 1_000_000;
const MAX_STRING_LENGTH = 1_000_000;

export async function runJava(source: string, io: SandboxIO): Promise<RunResult> {
  let program: Program;
  try {
    program = new Parser(tokenize(source)).program();
  } catch (error) {
    if (error instanceof CompileError) return compileFailure(error, "Main", io);
    throw error;
  }

  const interpreter = new Interpreter(program, io);
  try {
    await drive(interpreter.run());
    return { status: "ok", exitCode: 0, errorLine: null };
  } catch (error) {
    if (error instanceof ExitSignal) {
      return { status: error.code === 0 ? "ok" : "error", exitCode: error.code, errorLine: null };
    }
    if (error instanceof SandboxStopped) return { status: "stopped", exitCode: 130, errorLine: null };
    if (error instanceof CompileError) return compileFailure(error, program.className, io);
    if (error instanceof LaunchError) {
      io.write(`${error.message}\n`, "stderr");
      return { status: "error", exitCode: 1, errorLine: null };
    }
    if (error instanceof StepLimitError) {
      io.write(
        `\nSandbox stopped the program after ${MAX_STEPS.toLocaleString("en-US")} steps. Is there an infinite loop?\n`,
        "stderr",
      );
      return { status: "error", exitCode: 1, errorLine: interpreter.errorLine };
    }

    const exception =
      error instanceof JavaException
        ? error
        : error instanceof RangeError
          ? new JavaException("java.lang.StackOverflowError")
          : new JavaException("java.lang.InternalError", `sandbox: ${String(error)}`);
    io.write(
      `Exception in thread "main" ${exception.className}${exception.detail === null ? "" : `: ${exception.detail}`}\n${interpreter.trace()}\n`,
      "stderr",
    );
    return { status: "error", exitCode: 1, errorLine: interpreter.errorLine };
  }
}

function compileFailure(error: CompileError, className: string, io: SandboxIO): RunResult {
  io.write(`${className}.java:${error.line}: error: ${error.message}\n1 error\nerror: compilation failed\n`, "stderr");
  return { status: "error", exitCode: 1, errorLine: error.line };
}

// ---------------------------------------------------------------------------
// Errors and control-flow signals
// ---------------------------------------------------------------------------

class CompileError extends Error {
  constructor(
    message: string,
    readonly line: number,
  ) {
    super(message);
  }
}

class JavaException extends Error {
  constructor(
    readonly className: string,
    readonly detail: string | null = null,
  ) {
    super(className);
  }
}

class LaunchError extends Error {}
class StepLimitError extends Error {}
class BreakSignal {}
class ContinueSignal {}

class ReturnSignal {
  constructor(readonly value: Value) {}
}

class ExitSignal {
  constructor(readonly code: number) {}
}

const BREAK = new BreakSignal();
const CONTINUE = new ContinueSignal();

type Gen<T> = Generator<Promise<unknown>, T, unknown>;

/** Runs a generator program, awaiting every Promise it yields and resuming it with the result. */
async function drive<T>(gen: Gen<T>): Promise<T> {
  let step = gen.next();
  while (!step.done) {
    let result: unknown;
    let failure: { error: unknown } | null = null;
    try {
      result = await step.value;
    } catch (error) {
      failure = { error };
    }
    step = failure ? gen.throw(failure.error) : gen.next(result);
  }
  return step.value;
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

type TypeRef = { name: string; dims: number };

type NumValue = { t: "int" | "long" | "double" | "char"; v: number };
type StringValue = { t: "String"; v: string };
type ArrayValue = { t: "array"; type: TypeRef; v: Value[]; id: number };

type Value =
  | NumValue
  | StringValue
  | ArrayValue
  | { t: "boolean"; v: boolean }
  | { t: "null" | "void" | "Scanner" | "InputStream" }
  | { t: "PrintStream"; stream: OutputStream }
  | { t: "class"; name: string };

const NULL: Value = { t: "null" };
const VOID: Value = { t: "void" };
const intV = (v: number): Value => ({ t: "int", v: v | 0 });
const longV = (v: number): Value => ({ t: "long", v: Math.trunc(v) });
const doubleV = (v: number): Value => ({ t: "double", v });
const charV = (code: number): Value => ({ t: "char", v: code & 0xffff });
const boolV = (v: boolean): Value => ({ t: "boolean", v });

function strV(v: string): StringValue {
  if (v.length > MAX_STRING_LENGTH) throw new JavaException("java.lang.OutOfMemoryError", "Java heap space");
  return { t: "String", v };
}

let arrayIds = 0x1b6d3586;
function arrayV(type: TypeRef, v: Value[]): ArrayValue {
  arrayIds = (arrayIds * 31 + 0x2f) % 0x7fffffff;
  return { t: "array", type, v, id: arrayIds };
}

const isNum = (v: Value): v is NumValue => v.t === "int" || v.t === "long" || v.t === "double" || v.t === "char";

const PRIMITIVES = new Set(["int", "long", "double", "float", "short", "byte", "char", "boolean"]);

/** Boxed and narrow types collapse onto the primitives the interpreter models. */
const TYPE_ALIASES: Record<string, string> = {
  float: "double",
  short: "int",
  byte: "int",
  Integer: "int",
  Double: "double",
  Float: "double",
  Long: "long",
  Short: "int",
  Byte: "int",
  Character: "char",
  Boolean: "boolean",
};

const describe = (type: TypeRef) => type.name + "[]".repeat(type.dims);

function typeName(v: Value): string {
  switch (v.t) {
    case "array":
      return describe(v.type);
    case "null":
      return "<null>";
    case "class":
      return v.name;
    default:
      return v.t;
  }
}

function typeOf(v: Value, line: number): TypeRef {
  if (v.t === "array") return v.type;
  if (v.t === "void" || v.t === "null" || v.t === "class") {
    throw new CompileError(`cannot infer type for local variable\n  (variable initializer is '${typeName(v)}')`, line);
  }
  return { name: v.t, dims: 0 };
}

function defaultValue(type: TypeRef): Value {
  if (type.dims > 0) return NULL;
  switch (type.name) {
    case "int":
      return intV(0);
    case "long":
      return longV(0);
    case "double":
      return doubleV(0);
    case "char":
      return charV(0);
    case "boolean":
      return boolV(false);
    default:
      return NULL;
  }
}

/** Java's `Double.toString`: always a decimal point, scientific notation outside [1e-3, 1e7). */
function doubleToString(d: number): string {
  if (Number.isNaN(d)) return "NaN";
  if (!Number.isFinite(d)) return d > 0 ? "Infinity" : "-Infinity";
  if (d === 0) return Object.is(d, -0) ? "-0.0" : "0.0";
  const abs = Math.abs(d);
  if (abs >= 1e-3 && abs < 1e7) {
    const s = String(d);
    return s.includes(".") ? s : `${s}.0`;
  }
  const [mantissa, exponent] = d.toExponential().split("e");
  return `${mantissa.includes(".") ? mantissa : `${mantissa}.0`}E${Number(exponent)}`;
}

const ARRAY_CODES: Record<string, string> = { int: "I", long: "J", double: "D", char: "C", boolean: "Z" };

/** `String.valueOf` for any value. */
function toJavaString(v: Value): string {
  switch (v.t) {
    case "int":
    case "long":
      return String(v.v);
    case "double":
      return doubleToString(v.v);
    case "char":
      return String.fromCharCode(v.v);
    case "boolean":
      return String(v.v);
    case "String":
      return v.v;
    case "null":
      return "null";
    case "array": {
      const code = ARRAY_CODES[v.type.name] ?? `Ljava.lang.${v.type.name};`;
      return `${"[".repeat(v.type.dims)}${code}@${v.id.toString(16)}`;
    }
    case "Scanner":
      return "java.util.Scanner@4e25154f";
    case "PrintStream":
      return "java.io.PrintStream@70dea4e";
    case "InputStream":
      return "java.io.BufferedInputStream@5c647e05";
    case "class":
      return `class ${v.name}`;
    case "void":
      return "";
  }
}

const BOXED: Record<string, string> = {
  int: "java.lang.Integer",
  long: "java.lang.Long",
  double: "java.lang.Double",
  char: "java.lang.Character",
  boolean: "java.lang.Boolean",
  String: "java.lang.String",
};

const boxName = (v: Value) => BOXED[v.t] ?? typeName(v);

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

/** Assignment conversion: widening is implicit, narrowing is a compile error. */
function coerce(v: Value, type: TypeRef, line: number): Value {
  if (v.t === "void") throw new CompileError("'void' type not allowed here", line);
  const target = describe(type);
  const fail = (lossy = false) =>
    new CompileError(
      lossy
        ? `incompatible types: possible lossy conversion from ${typeName(v)} to ${target}`
        : `incompatible types: ${typeName(v)} cannot be converted to ${target}`,
      line,
    );

  if (type.dims > 0) {
    if (v.t === "null" || (v.t === "array" && describe(v.type) === target)) return v;
    throw fail();
  }
  switch (type.name) {
    case "int":
      if (v.t === "int") return v;
      if (v.t === "char") return intV(v.v);
      throw fail(v.t === "long" || v.t === "double");
    case "long":
      if (v.t === "long") return v;
      if (v.t === "int" || v.t === "char") return longV(v.v);
      throw fail(v.t === "double");
    case "double":
      if (isNum(v)) return v.t === "double" ? v : doubleV(v.v);
      throw fail();
    case "char":
      if (v.t === "char") return v;
      // Java allows int constants here; the sandbox accepts any int.
      if (v.t === "int") return charV(v.v);
      throw fail(v.t === "long" || v.t === "double");
    case "boolean":
      if (v.t === "boolean") return v;
      throw fail();
    case "String":
    case "Scanner":
      if (v.t === type.name || v.t === "null") return v;
      throw fail();
    case "Object":
      return v;
    default:
      throw new CompileError(`${type.name} is not available in the sandbox`, line);
  }
}

const saturateInt = (x: number) => (Number.isNaN(x) ? 0 : Math.max(-2147483648, Math.min(2147483647, Math.trunc(x))));

/** Cast conversion, e.g. `(int) 3.9` or `(char) 65`. */
function castTo(v: Value, type: TypeRef, line: number): Value {
  if (type.dims > 0 || !["int", "long", "double", "char", "boolean"].includes(type.name)) return coerce(v, type, line);
  if (type.name === "boolean" ? v.t === "boolean" : isNum(v)) {
    if (!isNum(v)) return v;
    const x = v.v;
    switch (type.name) {
      case "int":
        return intV(v.t === "double" ? saturateInt(x) : x);
      case "long":
        return longV(Number.isNaN(x) ? 0 : x);
      case "double":
        return doubleV(x);
      case "char":
        return charV(v.t === "double" ? saturateInt(x) : x);
    }
  }
  throw new CompileError(`incompatible types: ${typeName(v)} cannot be converted to ${type.name}`, line);
}

// ---------------------------------------------------------------------------
// Lexer
// ---------------------------------------------------------------------------

type Token = {
  kind: "num" | "str" | "char" | "id" | "op" | "eof";
  text: string;
  line: number;
  value?: Value;
};

const OPERATORS = [
  ">>>=", "<<=", ">>=", ">>>", "...", "->", "::", "++", "--", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=",
  "==", "!=", "<=", ">=", "&&", "||", "<<", ">>",
  "+", "-", "*", "/", "%", "=", "<", ">", "!", "&", "|", "^", "~", "?", ":", ";", ",", ".", "(", ")", "{", "}",
  "[", "]", "@",
];

const NUMBER = /0[xX][\da-fA-F_]+[lL]?|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?[lLfFdD]?/y;
const IDENT = /[A-Za-z_$][\w$]*/y;

const ESCAPES: Record<string, string> = {
  n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", s: " ", "0": "\0", "'": "'", '"': '"', "\\": "\\",
};

function numberValue(text: string, line: number): Value {
  const raw = text.replace(/_/g, "");
  const hex = /^0[xX]/.test(raw);
  let body = raw;
  let suffix = "";
  if (hex ? /[lL]$/.test(raw) : /[lLfFdD]$/.test(raw)) {
    suffix = raw.slice(-1).toLowerCase();
    body = raw.slice(0, -1);
  }
  if (suffix === "f" || suffix === "d" || (!hex && /[.eE]/.test(body))) return doubleV(Number(body));
  const n = hex ? parseInt(body.slice(2), 16) : Number(body);
  if (suffix === "l") return longV(n);
  if (n > (hex ? 0xffffffff : 2147483648)) throw new CompileError("integer number too large", line);
  // 2147483648 is only legal as the operand of unary minus; wrapping makes -2147483648 come out right.
  return intV(n);
}

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;

  const readChar = (quote: string): string => {
    const c = src[i];
    if (c === "\n" || c === undefined) {
      throw new CompileError(quote === '"' ? "unclosed string literal" : "unclosed character literal", line);
    }
    if (c !== "\\") {
      i++;
      return c;
    }
    const e = src[i + 1];
    if (e in ESCAPES) {
      i += 2;
      return ESCAPES[e];
    }
    const hex = src.slice(i + 2, i + 6);
    if (e === "u" && /^[\da-fA-F]{4}$/.test(hex)) {
      i += 6;
      return String.fromCharCode(parseInt(hex, 16));
    }
    throw new CompileError("illegal escape character", line);
  };

  while (i < src.length) {
    const c = src[i];
    if (c === "\n") {
      line++;
      i++;
    } else if (/\s/.test(c)) {
      i++;
    } else if (src.startsWith("//", i)) {
      while (i < src.length && src[i] !== "\n") i++;
    } else if (src.startsWith("/*", i)) {
      const end = src.indexOf("*/", i + 2);
      if (end < 0) throw new CompileError("unclosed comment", line);
      line += src.slice(i, end).split("\n").length - 1;
      i = end + 2;
    } else if (/\d/.test(c) || (c === "." && /\d/.test(src[i + 1] ?? ""))) {
      NUMBER.lastIndex = i;
      const text = NUMBER.exec(src)![0];
      tokens.push({ kind: "num", text, line, value: numberValue(text, line) });
      i += text.length;
    } else if (c === '"') {
      if (src.startsWith('"""', i)) throw new CompileError("text blocks are not supported in the sandbox", line);
      i++;
      let text = "";
      while (src[i] !== '"') text += readChar('"');
      i++;
      tokens.push({ kind: "str", text, line, value: strV(text) });
    } else if (c === "'") {
      i++;
      if (src[i] === "'") throw new CompileError("empty character literal", line);
      const ch = readChar("'");
      if (src[i] !== "'") throw new CompileError("unclosed character literal", line);
      i++;
      tokens.push({ kind: "char", text: ch, line, value: charV(ch.charCodeAt(0)) });
    } else if (/[A-Za-z_$]/.test(c)) {
      IDENT.lastIndex = i;
      const text = IDENT.exec(src)![0];
      tokens.push({ kind: "id", text, line });
      i += text.length;
    } else {
      const op = OPERATORS.find((o) => src.startsWith(o, i));
      if (!op) throw new CompileError(`illegal character: '${c}'`, line);
      tokens.push({ kind: "op", text: op, line });
      i += op.length;
    }
  }
  tokens.push({ kind: "eof", text: "<EOF>", line });
  return tokens;
}

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

type CallExpr = { k: "call"; target: Expr | null; name: string; args: Expr[]; line: number };
type ArrayLitExpr = { k: "arrayLit"; type: TypeRef | null; items: Expr[]; line: number };

type Expr = { line: number } & (
  | { k: "lit"; value: Value }
  | { k: "name"; name: string }
  | { k: "assign"; op: string; target: Expr; value: Expr }
  | { k: "cond"; test: Expr; a: Expr; b: Expr }
  | { k: "bin"; op: string; l: Expr; r: Expr }
  | { k: "unary"; op: string; e: Expr }
  | { k: "update"; op: "++" | "--"; prefix: boolean; target: Expr }
  | { k: "cast"; type: TypeRef; e: Expr }
  | { k: "member"; obj: Expr; name: string }
  | { k: "index"; obj: Expr; index: Expr }
  | Omit<CallExpr, "line">
  | { k: "new"; cls: string; args: Expr[] }
  | { k: "newArray"; elem: string; dims: Expr[]; extra: number }
  | Omit<ArrayLitExpr, "line">
);

type VarDecl = { name: string; dims: number; init: Expr | null; line: number };
type SwitchCase = { tests: Expr[] | null; body: Stmt[] };

type Stmt = { line: number } & (
  | { k: "block"; body: Stmt[] }
  | { k: "var"; type: TypeRef; decls: VarDecl[] }
  | { k: "expr"; e: Expr }
  | { k: "if"; test: Expr; then: Stmt; else: Stmt | null }
  | { k: "while"; test: Expr; body: Stmt }
  | { k: "do"; body: Stmt; test: Expr }
  | { k: "for"; init: Stmt[]; test: Expr | null; update: Expr[]; body: Stmt }
  | { k: "foreach"; type: TypeRef; name: string; iter: Expr; body: Stmt }
  | { k: "switch"; disc: Expr; cases: SwitchCase[] }
  | { k: "break" | "continue" | "empty" }
  | { k: "return"; e: Expr | null }
);

type Method = {
  name: string;
  isStatic: boolean;
  ret: TypeRef;
  params: { type: TypeRef; name: string }[];
  body: Stmt;
  line: number;
  endLine: number;
};

type Program = { className: string; fields: Stmt[]; methods: Map<string, Method[]>; main: Method | null };

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

const RESERVED = new Set([
  "abstract", "boolean", "break", "byte", "case", "catch", "char", "class", "continue", "default", "do", "double",
  "else", "enum", "extends", "final", "finally", "float", "for", "if", "implements", "import", "instanceof", "int",
  "interface", "long", "new", "package", "private", "protected", "public", "return", "short", "static", "super",
  "switch", "this", "throw", "throws", "try", "void", "while", "true", "false", "null",
]);

const MODIFIERS = ["public", "private", "protected", "final", "abstract", "synchronized"];
const ASSIGN_OPS = new Set(["=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>=", ">>>="]);
const STATEMENT_EXPRS = new Set(["assign", "update", "call", "new"]);

const BINARY_PREC: Record<string, number> = {
  "||": 1, "&&": 2, "|": 3, "^": 4, "&": 5, "==": 6, "!=": 6, "<": 7, ">": 7, "<=": 7, ">=": 7,
  "<<": 8, ">>": 8, ">>>": 8, "+": 9, "-": 9, "*": 10, "/": 10, "%": 10,
};

class Parser {
  private i = 0;
  /** Equal string literals share one value, so `"a" == "a"` is true like Java's string pool. */
  private readonly pool = new Map<string, Value>();

  constructor(private readonly toks: Token[]) {}

  program(): Program {
    while (this.is("import") || this.is("package")) {
      while (!this.is(";") && this.peek().kind !== "eof") this.i++;
      this.expect(";");
    }

    // Snippet mode: bare statements run as the body of main.
    if (!this.toks.some((t) => t.kind === "id" && t.text === "class")) {
      const line = this.peek().line;
      const body: Stmt[] = [];
      while (this.peek().kind !== "eof") body.push(this.statement());
      const main: Method = {
        name: "main",
        isStatic: true,
        ret: { name: "void", dims: 0 },
        params: [{ type: { name: "String", dims: 1 }, name: "args" }],
        body: { k: "block", body, line },
        line,
        endLine: this.peek().line,
      };
      return { className: "Main", fields: [], methods: new Map([["main", [main]]]), main };
    }

    this.modifiers();
    this.expect("class");
    const className = this.ident();
    while (!this.is("{") && this.peek().kind !== "eof") this.i++;
    this.expect("{");

    const fields: Stmt[] = [];
    const methods = new Map<string, Method[]>();
    while (!this.accept("}")) {
      if (this.peek().kind === "eof") throw new CompileError("reached end of file while parsing", this.peek().line);
      this.member(fields, methods);
    }
    if (this.peek().kind !== "eof") {
      throw new CompileError(`the sandbox runs a single class; move this code inside ${className}`, this.peek().line);
    }
    const main = methods.get("main")?.find((m) => m.params.length === 1) ?? null;
    return { className, fields, methods, main };
  }

  // -- token helpers --------------------------------------------------------

  private peek(offset = 0): Token {
    return this.toks[Math.min(this.i + offset, this.toks.length - 1)];
  }

  private is(text: string, offset = 0) {
    const t = this.peek(offset);
    return (t.kind === "op" || t.kind === "id") && t.text === text;
  }

  private accept(text: string) {
    if (!this.is(text)) return false;
    this.i++;
    return true;
  }

  private expect(text: string) {
    if (this.accept(text)) return;
    // javac reports a missing terminator at the end of the previous token.
    const line = [";", ")", "]"].includes(text) && this.i > 0 ? this.toks[this.i - 1].line : this.peek().line;
    throw new CompileError(`'${text}' expected`, line);
  }

  private ident(): string {
    const t = this.peek();
    if (t.kind !== "id" || RESERVED.has(t.text)) throw new CompileError("<identifier> expected", t.line);
    this.i++;
    return t.text;
  }

  // -- declarations ---------------------------------------------------------

  private modifiers() {
    let isStatic = false;
    for (;;) {
      if (this.accept("static")) isStatic = true;
      else if (!MODIFIERS.some((m) => this.accept(m))) return isStatic;
    }
  }

  private member(fields: Stmt[], methods: Map<string, Method[]>) {
    const line = this.peek().line;
    if (this.is("class") || this.is("interface") || this.is("enum")) {
      throw new CompileError("nested types are not supported in the sandbox", line);
    }
    const isStatic = this.modifiers();
    const type = this.type();
    const name = this.ident();

    if (!this.accept("(")) {
      fields.push(this.varDecl(type, line, name));
      this.expect(";");
      return;
    }

    const params: Method["params"] = [];
    if (!this.is(")")) {
      do {
        this.accept("final");
        let paramType = this.type();
        if (this.accept("...")) paramType = { ...paramType, dims: paramType.dims + 1 };
        params.push({ type: paramType, name: this.ident() });
      } while (this.accept(","));
    }
    this.expect(")");
    if (this.accept("throws")) {
      do this.type();
      while (this.accept(","));
    }
    const body = this.block();
    const method: Method = { name, isStatic, ret: type, params, body, line, endLine: this.toks[this.i - 1].line };
    methods.set(name, [...(methods.get(name) ?? []), method]);
  }

  private type(): TypeRef {
    const t = this.peek();
    if (t.kind !== "id" || (RESERVED.has(t.text) && !PRIMITIVES.has(t.text) && t.text !== "void")) {
      throw new CompileError("<identifier> expected", t.line);
    }
    this.i++;
    let name = t.text;
    // Qualified names (java.util.Scanner) keep their simple name.
    while (this.is(".") && this.peek(1).kind === "id") {
      this.i++;
      name = this.peek().text;
      this.i++;
    }
    if (this.is("<")) this.skipTypeArgs();
    let dims = 0;
    while (this.is("[") && this.is("]", 1)) {
      this.i += 2;
      dims++;
    }
    return { name: TYPE_ALIASES[name] ?? name, dims };
  }

  private skipTypeArgs() {
    let depth = 0;
    do {
      const t = this.peek();
      this.i++;
      if (t.kind === "op" && t.text === "<") depth++;
      else if (t.kind === "op" && /^>+$/.test(t.text)) depth -= t.text.length;
      else if (t.kind !== "id" && !(t.kind === "op" && [",", ".", "?", "[", "]"].includes(t.text))) {
        throw new CompileError("illegal start of type", t.line);
      }
    } while (depth > 0);
  }

  private isDeclStart(): boolean {
    const t = this.peek();
    if (t.kind !== "id") return false;
    if (PRIMITIVES.has(t.text)) return true;
    if (t.text === "var") return this.peek(1).kind === "id";
    if (RESERVED.has(t.text)) return false;
    const save = this.i;
    try {
      this.type();
      const next = this.peek();
      return next.kind === "id" && !RESERVED.has(next.text);
    } catch {
      return false;
    } finally {
      this.i = save;
    }
  }

  private varDecl(type: TypeRef, line: number, firstName?: string): Stmt {
    const decls: VarDecl[] = [];
    do {
      const declLine = this.peek().line;
      const name = firstName ?? this.ident();
      firstName = undefined;
      let dims = 0;
      while (this.is("[") && this.is("]", 1)) {
        this.i += 2;
        dims++;
      }
      const init = this.accept("=") ? (this.is("{") ? this.arrayLit(null) : this.expr()) : null;
      decls.push({ name, dims, init, line: declLine });
    } while (this.accept(","));
    return { k: "var", type, decls, line };
  }

  private arrayLit(type: TypeRef | null): Expr {
    const line = this.peek().line;
    this.expect("{");
    const items: Expr[] = [];
    while (!this.is("}")) {
      items.push(this.is("{") ? this.arrayLit(null) : this.expr());
      if (!this.accept(",")) break;
    }
    this.expect("}");
    return { k: "arrayLit", type, items, line };
  }

  // -- statements -----------------------------------------------------------

  private block(): Stmt {
    const line = this.peek().line;
    this.expect("{");
    const body: Stmt[] = [];
    while (!this.accept("}")) body.push(this.statement());
    return { k: "block", body, line };
  }

  private statement(): Stmt {
    const t = this.peek();
    const line = t.line;
    if (t.kind === "eof") throw new CompileError("reached end of file while parsing", line);

    if (t.kind === "id") {
      switch (t.text) {
        case "if": {
          this.i++;
          this.expect("(");
          const test = this.expr();
          this.expect(")");
          const then = this.statement();
          return { k: "if", test, then, else: this.accept("else") ? this.statement() : null, line };
        }
        case "while": {
          this.i++;
          this.expect("(");
          const test = this.expr();
          this.expect(")");
          return { k: "while", test, body: this.statement(), line };
        }
        case "do": {
          this.i++;
          const body = this.statement();
          this.expect("while");
          this.expect("(");
          const test = this.expr();
          this.expect(")");
          this.expect(";");
          return { k: "do", body, test, line };
        }
        case "for":
          return this.forStatement();
        case "switch":
          return this.switchStatement();
        case "break":
        case "continue": {
          this.i++;
          if (this.peek().kind === "id") throw new CompileError("labeled break/continue is not supported in the sandbox", line);
          this.expect(";");
          return { k: t.text === "break" ? "break" : "continue", line };
        }
        case "return": {
          this.i++;
          const e = this.is(";") ? null : this.expr();
          this.expect(";");
          return { k: "return", e, line };
        }
        case "final": {
          this.i++;
          return this.declStatement();
        }
        case "else":
          throw new CompileError("'else' without 'if'", line);
        case "case":
        case "default":
          throw new CompileError(`orphaned ${t.text}`, line);
        case "try":
        case "throw":
        case "class":
        case "interface":
        case "enum":
          throw new CompileError(`'${t.text}' is not supported in the sandbox yet`, line);
      }
    }

    if (this.is("{")) return this.block();
    if (this.accept(";")) return { k: "empty", line };
    if (this.isDeclStart()) return this.declStatement();

    const e = this.expr();
    if (!STATEMENT_EXPRS.has(e.k)) throw new CompileError("not a statement", e.line);
    this.expect(";");
    return { k: "expr", e, line };
  }

  private declStatement(): Stmt {
    const line = this.peek().line;
    const stmt = this.varDecl(this.type(), line);
    this.expect(";");
    return stmt;
  }

  private forStatement(): Stmt {
    const line = this.peek().line;
    this.i++;
    this.expect("(");
    let init: Stmt[] = [];
    if (this.accept("final") || this.isDeclStart()) {
      const type = this.type();
      if (this.peek().kind === "id" && this.is(":", 1)) {
        const name = this.ident();
        this.expect(":");
        const iter = this.expr();
        this.expect(")");
        return { k: "foreach", type, name, iter, body: this.statement(), line };
      }
      init = [this.varDecl(type, line)];
    } else if (!this.is(";")) {
      do {
        const e = this.expr();
        init.push({ k: "expr", e, line: e.line });
      } while (this.accept(","));
    }
    this.expect(";");
    const test = this.is(";") ? null : this.expr();
    this.expect(";");
    const update: Expr[] = [];
    if (!this.is(")")) {
      do update.push(this.expr());
      while (this.accept(","));
    }
    this.expect(")");
    return { k: "for", init, test, update, body: this.statement(), line };
  }

  private switchStatement(): Stmt {
    const line = this.peek().line;
    this.i++;
    this.expect("(");
    const disc = this.expr();
    this.expect(")");
    this.expect("{");
    const cases: SwitchCase[] = [];
    while (!this.accept("}")) {
      const t = this.peek();
      let tests: Expr[] | null;
      if (this.accept("case")) {
        tests = [];
        do tests.push(this.ternary());
        while (this.accept(","));
      } else if (this.accept("default")) {
        tests = null;
      } else {
        throw new CompileError(
          t.kind === "eof" ? "reached end of file while parsing" : "'case', 'default', or '}' expected",
          t.line,
        );
      }
      if (this.is("->")) {
        throw new CompileError("'case ->' is not supported in the sandbox yet; use 'case X:' with break", this.peek().line);
      }
      this.expect(":");
      const body: Stmt[] = [];
      while (!this.is("case") && !this.is("default") && !this.is("}")) body.push(this.statement());
      cases.push({ tests, body });
    }
    return { k: "switch", disc, cases, line };
  }

  // -- expressions ----------------------------------------------------------

  private expr(): Expr {
    const target = this.ternary();
    const t = this.peek();
    if (t.kind !== "op" || !ASSIGN_OPS.has(t.text)) return target;
    if (target.k !== "name" && target.k !== "index" && target.k !== "member") {
      throw new CompileError("unexpected type\n  required: variable\n  found:    value", t.line);
    }
    this.i++;
    return { k: "assign", op: t.text, target, value: this.expr(), line: t.line };
  }

  private ternary(): Expr {
    const test = this.binary(1);
    if (!this.is("?")) return test;
    const line = this.peek().line;
    this.i++;
    const a = this.expr();
    this.expect(":");
    return { k: "cond", test, a, b: this.ternary(), line };
  }

  private binary(minPrec: number): Expr {
    let left = this.unary();
    for (;;) {
      const t = this.peek();
      const prec = t.kind === "op" ? BINARY_PREC[t.text] : undefined;
      if (prec === undefined || prec < minPrec) return left;
      this.i++;
      left = { k: "bin", op: t.text, l: left, r: this.binary(prec + 1), line: t.line };
    }
  }

  private unary(): Expr {
    const t = this.peek();
    if (t.kind === "op") {
      if (t.text === "++" || t.text === "--") {
        this.i++;
        return { k: "update", op: t.text, prefix: true, target: this.unary(), line: t.line };
      }
      if (["!", "-", "+", "~"].includes(t.text)) {
        this.i++;
        return { k: "unary", op: t.text, e: this.unary(), line: t.line };
      }
      if (t.text === "(" && this.isCast()) {
        this.i++;
        const type = this.type();
        this.expect(")");
        return { k: "cast", type, e: this.unary(), line: t.line };
      }
    }
    return this.postfix(this.primary());
  }

  private isCast(): boolean {
    const t = this.peek(1);
    if (t.kind !== "id") return false;
    if (PRIMITIVES.has(t.text)) return true;
    // (String) value: a capitalised type name followed by an operand.
    if (!/^[A-Z]/.test(t.text)) return false;
    const save = this.i;
    try {
      this.i++;
      this.type();
      if (!this.is(")")) return false;
      const next = this.peek(1);
      return next.kind === "id" || next.kind === "str" || next.kind === "num" || next.kind === "char" || next.text === "(";
    } catch {
      return false;
    } finally {
      this.i = save;
    }
  }

  private postfix(e: Expr): Expr {
    for (;;) {
      const t = this.peek();
      if (this.accept(".")) {
        const name = this.ident();
        e = this.is("(")
          ? { k: "call", target: e, name, args: this.args(), line: t.line }
          : { k: "member", obj: e, name, line: t.line };
      } else if (this.accept("[")) {
        const index = this.expr();
        this.expect("]");
        e = { k: "index", obj: e, index, line: t.line };
      } else if (t.kind === "op" && (t.text === "++" || t.text === "--")) {
        this.i++;
        return { k: "update", op: t.text, prefix: false, target: e, line: t.line };
      } else {
        return e;
      }
    }
  }

  private primary(): Expr {
    const t = this.peek();
    const line = t.line;
    this.i++;
    switch (t.kind) {
      case "num":
      case "char":
        return { k: "lit", value: t.value!, line };
      case "str": {
        let value = this.pool.get(t.text);
        if (!value) this.pool.set(t.text, (value = t.value!));
        return { k: "lit", value, line };
      }
      case "id":
        if (t.text === "true" || t.text === "false") return { k: "lit", value: boolV(t.text === "true"), line };
        if (t.text === "null") return { k: "lit", value: NULL, line };
        if (t.text === "new") return this.creation(line);
        if (t.text === "this" || t.text === "super") {
          throw new CompileError(`non-static variable ${t.text} cannot be referenced from a static context`, line);
        }
        if (RESERVED.has(t.text)) break;
        return this.is("(")
          ? { k: "call", target: null, name: t.text, args: this.args(), line }
          : { k: "name", name: t.text, line };
      case "op":
        if (t.text === "(") {
          const e = this.expr();
          this.expect(")");
          return e;
        }
        break;
      case "eof":
        throw new CompileError("reached end of file while parsing", line);
    }
    throw new CompileError("illegal start of expression", line);
  }

  private creation(line: number): Expr {
    const t = this.peek();
    if (t.kind !== "id") throw new CompileError("<identifier> expected", t.line);
    this.i++;
    let name = t.text;
    while (this.accept(".")) name = this.ident();
    if (this.is("<")) this.skipTypeArgs();
    name = TYPE_ALIASES[name] ?? name;

    if (!this.is("[")) return { k: "new", cls: name, args: this.args(), line };

    const dims: Expr[] = [];
    let extra = 0;
    while (this.accept("[")) {
      if (this.accept("]")) {
        extra++;
        continue;
      }
      if (extra) throw new CompileError("']' expected", this.peek().line);
      dims.push(this.expr());
      this.expect("]");
    }
    if (dims.length > 0) return { k: "newArray", elem: name, dims, extra, line };
    if (!this.is("{")) throw new CompileError("array dimension missing", line);
    const lit = this.arrayLit({ name, dims: extra });
    return lit;
  }

  private args(): Expr[] {
    this.expect("(");
    const list: Expr[] = [];
    if (!this.is(")")) {
      do list.push(this.expr());
      while (this.accept(","));
    }
    this.expect(")");
    return list;
  }
}

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

function sameValue(a: Value, b: Value, line: number): boolean {
  if (isNum(a) && isNum(b)) return a.v === b.v;
  if (a.t === "boolean" && b.t === "boolean") return a.v === b.v;
  const isRef = (v: Value) => !isNum(v) && v.t !== "boolean" && v.t !== "void";
  if (isRef(a) && isRef(b) && (a.t === b.t || a.t === "null" || b.t === "null")) {
    // Reference comparison: two Strings are == only when they are the same object.
    return a === b || (a.t === "null" && b.t === "null");
  }
  throw new CompileError(
    `bad operand types for binary operator '=='\n  first type:  ${typeName(a)}\n  second type: ${typeName(b)}`,
    line,
  );
}

function binaryOp(op: string, a: Value, b: Value, line: number): Value {
  if (a.t === "void" || b.t === "void") throw new CompileError("'void' type not allowed here", line);
  if (op === "+" && (a.t === "String" || b.t === "String")) return strV(toJavaString(a) + toJavaString(b));
  if (op === "==" || op === "!=") return boolV(sameValue(a, b, line) === (op === "=="));
  if (a.t === "boolean" && b.t === "boolean") {
    if (op === "&") return boolV(a.v && b.v);
    if (op === "|") return boolV(a.v || b.v);
    if (op === "^") return boolV(a.v !== b.v);
  }
  const bad = () =>
    new CompileError(
      `bad operand types for binary operator '${op}'\n  first type:  ${typeName(a)}\n  second type: ${typeName(b)}`,
      line,
    );
  if (!isNum(a) || !isNum(b)) throw bad();

  const x = a.v;
  const y = b.v;
  switch (op) {
    case "<":
      return boolV(x < y);
    case ">":
      return boolV(x > y);
    case "<=":
      return boolV(x <= y);
    case ">=":
      return boolV(x >= y);
  }

  const kind = a.t === "double" || b.t === "double" ? "double" : a.t === "long" || b.t === "long" ? "long" : "int";
  if (kind === "double") {
    switch (op) {
      case "+":
        return doubleV(x + y);
      case "-":
        return doubleV(x - y);
      case "*":
        return doubleV(x * y);
      case "/":
        return doubleV(x / y);
      case "%":
        return doubleV(x % y);
    }
    throw bad();
  }

  if ((op === "/" || op === "%") && y === 0) throw new JavaException("java.lang.ArithmeticException", "/ by zero");
  const make = kind === "int" ? intV : longV;
  switch (op) {
    case "+":
      return make(x + y);
    case "-":
      return make(x - y);
    case "*":
      return kind === "int" ? intV(Math.imul(x, y)) : longV(x * y);
    case "/":
      return make(Math.trunc(x / y));
    case "%":
      return make(x % y);
    case "&":
      return make(x & y);
    case "|":
      return make(x | y);
    case "^":
      return make(x ^ y);
    case "<<":
      return make(x << y);
    case ">>":
      return make(x >> y);
    case ">>>":
      return make(x >>> y);
  }
  throw bad();
}

// ---------------------------------------------------------------------------
// printf / String.format
// ---------------------------------------------------------------------------

const FORMAT_SPEC = /%(\d+\$)?([-#+ 0,(]*)(\d+)?(?:\.(\d+))?([a-zA-Z%])/g;

function formatJava(fmt: string, args: Value[]): string {
  let next = 0;
  const out = fmt.replace(FORMAT_SPEC, (spec, position: string | undefined, flags: string, width, precision, conv: string) => {
    const left = flags.includes("-");
    const pad = (text: string, zeroPad = false) => {
      const w = width ? Number(width) : 0;
      if (text.length >= w) return text;
      if (left) return text.padEnd(w);
      if (zeroPad && flags.includes("0")) {
        const sign = /^[-+ (]/.test(text) ? text[0] : "";
        return sign + text.slice(sign.length).padStart(w - sign.length, "0");
      }
      return text.padStart(w);
    };

    if (conv === "n") return "\n";
    if (conv === "%") return pad("%");

    const arg = position ? args[Number(position.slice(0, -1)) - 1] : args[next++];
    if (arg === undefined) throw new JavaException("java.util.MissingFormatArgumentException", `Format specifier '${spec}'`);
    const mismatch = () => new JavaException("java.util.IllegalFormatConversionException", `${conv} != ${boxName(arg)}`);

    const signed = (negative: boolean, digits: string) => {
      if (flags.includes(",")) {
        const [whole, fraction] = digits.split(".");
        digits = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction !== undefined ? `.${fraction}` : "");
      }
      if (negative) return flags.includes("(") ? `(${digits})` : `-${digits}`;
      return (flags.includes("+") ? "+" : flags.includes(" ") ? " " : "") + digits;
    };

    switch (conv) {
      case "d": {
        if (arg.t !== "int" && arg.t !== "long") throw mismatch();
        return pad(signed(arg.v < 0, String(Math.abs(arg.v))), true);
      }
      case "f":
      case "e":
      case "E": {
        if (arg.t !== "double") throw mismatch();
        if (!Number.isFinite(arg.v)) return pad(Number.isNaN(arg.v) ? "NaN" : arg.v > 0 ? "Infinity" : "-Infinity");
        const p = precision ? Number(precision) : 6;
        let digits = conv === "f" ? Math.abs(arg.v).toFixed(p) : Math.abs(arg.v).toExponential(p);
        if (conv !== "f") {
          digits = digits.replace(/e([+-])(\d)$/, "e$10$2");
          if (conv === "E") digits = digits.toUpperCase();
        }
        return pad(signed(arg.v < 0 || Object.is(arg.v, -0), digits), true);
      }
      case "s":
      case "S": {
        let text = toJavaString(arg);
        if (precision) text = text.slice(0, Number(precision));
        return pad(conv === "S" ? text.toUpperCase() : text);
      }
      case "c":
      case "C": {
        if (arg.t !== "char" && arg.t !== "int") throw mismatch();
        const text = String.fromCharCode(arg.v);
        return pad(conv === "C" ? text.toUpperCase() : text);
      }
      case "b":
      case "B": {
        const text = arg.t === "boolean" ? String(arg.v) : String(arg.t !== "null");
        return pad(conv === "B" ? text.toUpperCase() : text);
      }
      case "x":
      case "X":
      case "o": {
        if (arg.t !== "int" && arg.t !== "long") throw mismatch();
        const radix = conv === "o" ? 8 : 16;
        const bits = arg.t === "int" ? BigInt.asUintN(32, BigInt(arg.v)) : BigInt.asUintN(64, BigInt(arg.v));
        const text = bits.toString(radix);
        return pad(conv === "X" ? text.toUpperCase() : text, true);
      }
    }
    throw new JavaException("java.util.UnknownFormatConversionException", `Conversion = '${conv}'`);
  });

  const stray = /%(?![-#+ 0,(\d.$]*[a-zA-Z%])/.exec(fmt.replace(FORMAT_SPEC, ""));
  if (stray) throw new JavaException("java.util.UnknownFormatConversionException", "Conversion = '%'");
  return out;
}

// ---------------------------------------------------------------------------
// Library: String, Math, wrappers, Arrays
// ---------------------------------------------------------------------------

function cannotFindMethod(name: string, args: Value[], location: string, line: number) {
  return new CompileError(
    `cannot find symbol\n  symbol:   method ${name}(${args.map(typeName).join(",")})\n  location: ${location}`,
    line,
  );
}

function stringArg(args: Value[], i: number, method: string, line: number): string {
  const a = args[i];
  if (a?.t === "String") return a.v;
  if (a?.t === "null") throw new JavaException("java.lang.NullPointerException", `Cannot invoke "${method}" with null`);
  throw new CompileError(`incompatible types: ${a ? typeName(a) : "no argument"} cannot be converted to String`, line);
}

function intArg(args: Value[], i: number, line: number): number {
  const a = args[i];
  if (a && (a.t === "int" || a.t === "char")) return a.v;
  throw new CompileError(
    a ? `incompatible types: ${typeName(a)} cannot be converted to int` : "missing int argument",
    line,
  );
}

function textArg(args: Value[], i: number, method: string, line: number): string {
  const a = args[i];
  return a?.t === "char" ? String.fromCharCode(a.v) : stringArg(args, i, method, line);
}

function compareStrings(a: string, b: string) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a.charCodeAt(i) !== b.charCodeAt(i)) return a.charCodeAt(i) - b.charCodeAt(i);
  }
  return a.length - b.length;
}

function stringMethod(self: StringValue, name: string, args: Value[], line: number): Value {
  const s = self.v;
  const outOfBounds = (detail: string) => new JavaException("java.lang.StringIndexOutOfBoundsException", detail);
  switch (name) {
    case "length":
      return intV(s.length);
    case "charAt": {
      const i = intArg(args, 0, line);
      if (i < 0 || i >= s.length) throw outOfBounds(`Index ${i} out of bounds for length ${s.length}`);
      return charV(s.charCodeAt(i));
    }
    case "isEmpty":
      return boolV(s.length === 0);
    case "isBlank":
      return boolV(s.trim().length === 0);
    case "toUpperCase":
      return strV(s.toUpperCase());
    case "toLowerCase":
      return strV(s.toLowerCase());
    case "trim":
    case "strip":
      return strV(s.trim());
    case "substring": {
      const begin = intArg(args, 0, line);
      const end = args.length > 1 ? intArg(args, 1, line) : s.length;
      if (begin < 0 || end > s.length || begin > end) throw outOfBounds(`begin ${begin}, end ${end}, length ${s.length}`);
      return strV(s.slice(begin, end));
    }
    case "indexOf":
    case "lastIndexOf": {
      const needle = textArg(args, 0, `String.${name}()`, line);
      const from = args.length > 1 ? intArg(args, 1, line) : undefined;
      return intV(name === "indexOf" ? s.indexOf(needle, from) : s.lastIndexOf(needle, from));
    }
    case "contains":
      return boolV(s.includes(stringArg(args, 0, "String.contains()", line)));
    case "startsWith":
      return boolV(s.startsWith(stringArg(args, 0, "String.startsWith()", line)));
    case "endsWith":
      return boolV(s.endsWith(stringArg(args, 0, "String.endsWith()", line)));
    case "equals":
      return boolV(args[0]?.t === "String" && args[0].v === s);
    case "equalsIgnoreCase":
      return boolV(args[0]?.t === "String" && args[0].v.toLowerCase() === s.toLowerCase());
    case "compareTo":
      return intV(compareStrings(s, stringArg(args, 0, "String.compareTo()", line)));
    case "compareToIgnoreCase":
      return intV(compareStrings(s.toLowerCase(), stringArg(args, 0, "String.compareToIgnoreCase()", line).toLowerCase()));
    case "concat":
      return strV(s + stringArg(args, 0, "String.concat()", line));
    case "repeat": {
      const count = intArg(args, 0, line);
      if (count < 0) throw new JavaException("java.lang.IllegalArgumentException", `count is negative: ${count}`);
      if (s.length * count > MAX_STRING_LENGTH) throw new JavaException("java.lang.OutOfMemoryError", "Java heap space");
      return strV(s.repeat(count));
    }
    case "replace":
      return strV(s.split(textArg(args, 0, "String.replace()", line)).join(textArg(args, 1, "String.replace()", line)));
    case "split": {
      let pattern: RegExp;
      try {
        pattern = new RegExp(stringArg(args, 0, "String.split()", line));
      } catch {
        throw new JavaException("java.util.regex.PatternSyntaxException", "invalid regular expression");
      }
      const parts = s.length === 0 ? [""] : s.split(pattern);
      while (parts.length > 1 && parts[parts.length - 1] === "") parts.pop();
      return arrayV({ name: "String", dims: 1 }, parts.map((p) => strV(p)));
    }
    case "toCharArray":
      return arrayV({ name: "char", dims: 1 }, [...s].map((c) => charV(c.charCodeAt(0))));
    case "hashCode": {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
      return intV(h);
    }
    case "toString":
      return self;
  }
  throw cannotFindMethod(name, args, "class String", line);
}

function numArgs(args: Value[], count: number, name: string, line: number): NumValue[] {
  if (args.length !== count || !args.every(isNum)) throw cannotFindMethod(name, args, "class Math", line);
  return args as NumValue[];
}

const promoteKind = (vals: NumValue[]) =>
  vals.some((v) => v.t === "double") ? doubleV : vals.some((v) => v.t === "long") ? longV : intV;

const DOUBLE_MATH: Record<string, (...x: number[]) => number> = {
  sqrt: Math.sqrt, cbrt: Math.cbrt, pow: Math.pow, floor: Math.floor, ceil: Math.ceil, exp: Math.exp,
  log: Math.log, log10: Math.log10, sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos,
  atan: Math.atan, atan2: Math.atan2, hypot: Math.hypot, signum: Math.sign, rint: (x) => Math.round(x),
  toRadians: (x) => (x * Math.PI) / 180, toDegrees: (x) => (x * 180) / Math.PI,
};

function parseIntStrict(s: string, radix = 10, max = 2147483647): number {
  const valid = radix === 10 ? /^[+-]?\d+$/ : /^[+-]?[\da-z]+$/i;
  const n = parseInt(s, radix);
  if (!valid.test(s) || Number.isNaN(n) || n > max || n < -max - 1) {
    throw new JavaException("java.lang.NumberFormatException", `For input string: "${s}"${radix === 10 ? "" : ` under radix ${radix}`}`);
  }
  return n;
}

function parseDoubleStrict(raw: string): number {
  const s = raw.trim();
  if (/^[+-]?(NaN|Infinity)$/.test(s)) return Number(s);
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[fFdD]?$/.test(s)) {
    throw new JavaException("java.lang.NumberFormatException", s ? `For input string: "${raw}"` : "empty String");
  }
  return parseFloat(s);
}

function arrayArg(args: Value[], i: number, method: string, line: number): ArrayValue {
  const a = args[i];
  if (a?.t === "array") return a;
  if (a?.t === "null") throw new JavaException("java.lang.NullPointerException", `Cannot invoke "${method}" with null`);
  throw cannotFindMethod(method, args, "class Arrays", line);
}

function staticMethod(cls: string, name: string, args: Value[], line: number): Value {
  const location = `class ${cls}`;
  switch (cls) {
    case "Math": {
      if (name === "random" && args.length === 0) return doubleV(Math.random());
      if (name === "abs") {
        const [x] = numArgs(args, 1, name, line);
        return x.t === "double" ? doubleV(Math.abs(x.v)) : x.t === "long" ? longV(Math.abs(x.v)) : intV(Math.abs(x.v));
      }
      if (name === "max" || name === "min") {
        const xs = numArgs(args, 2, name, line);
        return promoteKind(xs)(Math[name](xs[0].v, xs[1].v));
      }
      if (name === "round") {
        const [x] = numArgs(args, 1, name, line);
        return x.t === "double" ? longV(Math.floor(x.v + 0.5)) : x;
      }
      if (name === "floorDiv" || name === "floorMod") {
        const [a, b] = numArgs(args, 2, name, line);
        if (b.v === 0) throw new JavaException("java.lang.ArithmeticException", "/ by zero");
        const make = promoteKind([a, b]);
        return make(name === "floorDiv" ? Math.floor(a.v / b.v) : a.v - Math.floor(a.v / b.v) * b.v);
      }
      const fn = DOUBLE_MATH[name];
      if (fn) return doubleV(fn(...numArgs(args, fn.length || 1, name, line).map((x) => x.v)));
      break;
    }
    case "Integer":
    case "Long": {
      const max = cls === "Integer" ? 2147483647 : Number.MAX_SAFE_INTEGER;
      const make = cls === "Integer" ? intV : longV;
      if (name === "parseInt" || name === "parseLong" || (name === "valueOf" && args[0]?.t === "String")) {
        const radix = args.length > 1 ? intArg(args, 1, line) : 10;
        return make(parseIntStrict(stringArg(args, 0, `${cls}.${name}()`, line), radix, max));
      }
      if (name === "valueOf" && args.length === 1 && isNum(args[0])) return castTo(args[0], { name: cls === "Integer" ? "int" : "long", dims: 0 }, line);
      if (name === "toString" && args.length === 1) return strV(toJavaString(args[0]));
      if (name === "toBinaryString" || name === "toHexString" || name === "toOctalString") {
        const radix = name === "toBinaryString" ? 2 : name === "toHexString" ? 16 : 8;
        const v = BigInt(intArg(args, 0, line));
        return strV(BigInt.asUintN(cls === "Integer" ? 32 : 64, v).toString(radix));
      }
      if (["max", "min", "sum", "compare"].includes(name)) {
        const [a, b] = numArgs(args, 2, name, line);
        const result = name === "max" ? Math.max(a.v, b.v) : name === "min" ? Math.min(a.v, b.v) : name === "sum" ? a.v + b.v : Math.sign(a.v - b.v);
        return name === "compare" ? intV(result) : make(result);
      }
      break;
    }
    case "Double": {
      if (name === "parseDouble" || (name === "valueOf" && args[0]?.t === "String")) {
        return doubleV(parseDoubleStrict(stringArg(args, 0, `Double.${name}()`, line)));
      }
      if (name === "valueOf" && args.length === 1 && isNum(args[0])) return doubleV(args[0].v);
      if (name === "toString" && args.length === 1) return strV(toJavaString(castTo(args[0], { name: "double", dims: 0 }, line)));
      if (name === "isNaN") return boolV(Number.isNaN(numArgs(args, 1, name, line)[0].v));
      if (name === "compare") {
        const [a, b] = numArgs(args, 2, name, line);
        return intV(Math.sign(a.v - b.v));
      }
      break;
    }
    case "Boolean":
      if (name === "parseBoolean") return boolV(args[0]?.t === "String" && args[0].v.toLowerCase() === "true");
      break;
    case "Character": {
      const c = args[0];
      if (args.length !== 1 || !c || (c.t !== "char" && c.t !== "int")) break;
      const ch = String.fromCharCode(c.v);
      switch (name) {
        case "isDigit":
          return boolV(/\d/.test(ch));
        case "isLetter":
        case "isAlphabetic":
          return boolV(/\p{L}/u.test(ch));
        case "isLetterOrDigit":
          return boolV(/[\p{L}\d]/u.test(ch));
        case "isUpperCase":
          return boolV(ch !== ch.toLowerCase());
        case "isLowerCase":
          return boolV(ch !== ch.toUpperCase());
        case "isWhitespace":
          return boolV(/\s/.test(ch));
        case "toUpperCase":
          return charV(ch.toUpperCase().charCodeAt(0));
        case "toLowerCase":
          return charV(ch.toLowerCase().charCodeAt(0));
        case "getNumericValue":
          return intV(/[\da-z]/i.test(ch) ? parseInt(ch, 36) : -1);
        case "toString":
          return strV(ch);
      }
      break;
    }
    case "String": {
      if (name === "valueOf" || name === "copyValueOf") {
        const a = args[0];
        if (a?.t === "array" && a.type.name === "char" && a.type.dims === 1) {
          return strV(a.v.map(toJavaString).join(""));
        }
        if (args.length === 1) return strV(toJavaString(a));
      }
      if (name === "format") return strV(formatJava(stringArg(args, 0, "String.format()", line), args.slice(1)));
      if (name === "join") {
        const delimiter = stringArg(args, 0, "String.join()", line);
        const parts = args.length === 2 && args[1].t === "array" ? args[1].v : args.slice(1);
        return strV(parts.map(toJavaString).join(delimiter));
      }
      break;
    }
    case "Arrays": {
      if (name === "toString") {
        if (args[0]?.t === "null") return strV("null");
        return strV(`[${arrayArg(args, 0, "Arrays.toString()", line).v.map(toJavaString).join(", ")}]`);
      }
      if (name === "sort") {
        const arr = arrayArg(args, 0, "Arrays.sort()", line);
        arr.v.sort((a, b) => {
          if (isNum(a) && isNum(b)) return a.v - b.v;
          if (a.t === "String" && b.t === "String") return compareStrings(a.v, b.v);
          if (a.t === "null" || b.t === "null") throw new JavaException("java.lang.NullPointerException");
          return 0;
        });
        return VOID;
      }
      if (name === "fill") {
        const arr = arrayArg(args, 0, "Arrays.fill()", line);
        const value = coerce(args[1] ?? VOID, { name: arr.type.name, dims: arr.type.dims - 1 }, line);
        arr.v.fill(value);
        return VOID;
      }
      if (name === "copyOf") {
        const arr = arrayArg(args, 0, "Arrays.copyOf()", line);
        const length = intArg(args, 1, line);
        if (length < 0) throw new JavaException("java.lang.NegativeArraySizeException", String(length));
        const fill = defaultValue({ name: arr.type.name, dims: arr.type.dims - 1 });
        return arrayV(arr.type, Array.from({ length }, (_, i) => arr.v[i] ?? fill));
      }
      if (name === "equals") {
        const [a, b] = args;
        if (a?.t !== "array" || b?.t !== "array") return boolV(a?.t === "null" && b?.t === "null");
        return boolV(a.v.length === b.v.length && a.v.every((x, i) => toJavaString(x) === toJavaString(b.v[i])));
      }
      break;
    }
    case "System":
      if (name === "currentTimeMillis") return longV(Date.now());
      if (name === "nanoTime") return longV(performance.now() * 1e6);
      if (name === "lineSeparator") return strV("\n");
      break;
  }
  throw cannotFindMethod(name, args, location, line);
}

const STATIC_FIELDS: Record<string, Value> = {
  "System.out": { t: "PrintStream", stream: "stdout" },
  "System.err": { t: "PrintStream", stream: "stderr" },
  "System.in": { t: "InputStream" },
  "Math.PI": doubleV(Math.PI),
  "Math.E": doubleV(Math.E),
  "Integer.MAX_VALUE": intV(2147483647),
  "Integer.MIN_VALUE": intV(-2147483648),
  "Double.MAX_VALUE": doubleV(Number.MAX_VALUE),
  "Double.MIN_VALUE": doubleV(Number.MIN_VALUE),
  "Double.POSITIVE_INFINITY": doubleV(Infinity),
  "Double.NEGATIVE_INFINITY": doubleV(-Infinity),
  "Double.NaN": doubleV(NaN),
  "Character.MAX_VALUE": charV(0xffff),
  "Character.MIN_VALUE": charV(0),
};

const KNOWN_CLASSES = new Set([
  "System", "Math", "Integer", "Long", "Double", "Boolean", "Character", "String", "Arrays", "Thread", "Scanner",
]);

// ---------------------------------------------------------------------------
// Scanner over the console
// ---------------------------------------------------------------------------

class StdinScanner {
  private buffer = "";

  constructor(private readonly io: SandboxIO) {}

  private *fill(): Gen<void> {
    const line = (yield this.io.readLine()) as string;
    this.buffer += `${line}\n`;
  }

  /** Skips delimiters and returns the next token without consuming it, blocking for input if needed. */
  *peek(): Gen<string> {
    for (;;) {
      const match = /^\s*(\S+)/.exec(this.buffer);
      if (match) {
        this.buffer = this.buffer.slice(match[0].length - match[1].length);
        return match[1];
      }
      this.buffer = "";
      yield* this.fill();
    }
  }

  consume(token: string) {
    this.buffer = this.buffer.slice(token.length);
  }

  *next(): Gen<string> {
    const token = yield* this.peek();
    this.consume(token);
    return token;
  }

  /** Rest of the current line. After nextInt() this is the leftover "" — just like real Java. */
  *nextLine(): Gen<string> {
    if (!this.buffer) yield* this.fill();
    const end = this.buffer.indexOf("\n");
    const line = this.buffer.slice(0, end);
    this.buffer = this.buffer.slice(end + 1);
    return line;
  }
}

const INT_TOKEN = /^[+-]?\d+$/;
const DOUBLE_TOKEN = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$|^[+-]?(NaN|Infinity)$/;

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

type Slot = { type: TypeRef; value: Value | undefined };
type Ref = { type: TypeRef; get: () => Value; set: (v: Value) => void };

class Scope {
  private readonly vars = new Map<string, Slot>();

  constructor(
    private readonly parent: Scope | null,
    /** Method bodies start a new boundary: locals may not shadow locals of the same method. */
    private readonly isMethod = false,
  ) {}

  find(name: string): Slot | undefined {
    return this.vars.get(name) ?? this.parent?.find(name);
  }

  declare(name: string, slot: Slot, line: number) {
    if (this.definedInMethod(name)) throw new CompileError(`variable ${name} is already defined in this method`, line);
    this.vars.set(name, slot);
  }

  private definedInMethod(name: string): boolean {
    return this.vars.has(name) || (!this.isMethod && !!this.parent?.definedInMethod(name));
  }
}

class Interpreter {
  private steps = 0;
  private readonly frames: { method: string; line: number }[] = [];
  private readonly globals = new Scope(null, true);
  private readonly stdin: StdinScanner;

  constructor(
    private readonly program: Program,
    private readonly io: SandboxIO,
  ) {
    this.stdin = new StdinScanner(io);
  }

  /** Line being executed when the program failed. Frames are left in place when an exception unwinds. */
  get errorLine(): number | null {
    return this.frames[this.frames.length - 1]?.line ?? null;
  }

  trace(): string {
    const cls = this.program.className;
    const lines = [...this.frames].reverse().map((f) => `\tat ${cls}.${f.method}(${cls}.java:${f.line})`);
    // Deep recursion would flood the console: keep the top of the stack and the outermost caller.
    if (lines.length <= TRACE_LIMIT + 1) return lines.join("\n");
    return [...lines.slice(0, TRACE_LIMIT), `\t... ${lines.length - TRACE_LIMIT - 1} more`, lines[lines.length - 1]].join("\n");
  }

  *run(): Gen<void> {
    const { main, className } = this.program;
    const signature = "   public static void main(String[] args)";
    if (!main) {
      throw new LaunchError(`Error: Main method not found in class ${className}, please define the main method as:\n${signature}`);
    }
    if (!main.isStatic) {
      throw new LaunchError(`Error: Main method is not static in class ${className}, please define the main method as:\n${signature}`);
    }

    this.frames.push({ method: "<clinit>", line: 1 });
    for (const field of this.program.fields) yield* this.exec(field, this.globals);
    this.frames.pop();

    const scope = new Scope(this.globals, true);
    scope.declare(main.params[0].name, { type: { name: "String", dims: 1 }, value: arrayV({ name: "String", dims: 1 }, []) }, main.line);
    this.frames.push({ method: "main", line: main.line });
    try {
      yield* this.exec(main.body, scope);
    } catch (signal) {
      if (!(signal instanceof ReturnSignal)) throw signal;
    }
    this.frames.pop();
  }

  private *tick(line: number): Gen<void> {
    const frame = this.frames[this.frames.length - 1];
    if (frame) frame.line = line;
    if (this.io.signal?.aborted) throw new SandboxStopped();
    if (++this.steps > MAX_STEPS) throw new StepLimitError();
    if (this.steps % YIELD_EVERY === 0) yield new Promise((resolve) => setTimeout(resolve, 0));
  }

  // -- statements -----------------------------------------------------------

  private *exec(s: Stmt, scope: Scope): Gen<void> {
    yield* this.tick(s.line);
    switch (s.k) {
      case "block": {
        const inner = new Scope(scope);
        for (const stmt of s.body) yield* this.exec(stmt, inner);
        return;
      }
      case "var":
        for (const d of s.decls) yield* this.declare(s.type, d, scope);
        return;
      case "expr":
        yield* this.eval(s.e, scope);
        return;
      case "if":
        if (yield* this.test(s.test, scope)) yield* this.exec(s.then, scope);
        else if (s.else) yield* this.exec(s.else, scope);
        return;
      case "while":
        while (yield* this.test(s.test, scope)) {
          if (yield* this.loopBody(s.body, scope)) break;
        }
        return;
      case "do":
        do {
          if (yield* this.loopBody(s.body, scope)) break;
        } while (yield* this.test(s.test, scope));
        return;
      case "for": {
        const loopScope = new Scope(scope);
        for (const init of s.init) yield* this.exec(init, loopScope);
        while (!s.test || (yield* this.test(s.test, loopScope))) {
          if (yield* this.loopBody(s.body, loopScope)) break;
          for (const update of s.update) yield* this.eval(update, loopScope);
        }
        return;
      }
      case "foreach": {
        const iterable = yield* this.eval(s.iter, scope);
        if (iterable.t === "null") throw new JavaException("java.lang.NullPointerException", "Cannot read the array length because value is null");
        if (iterable.t !== "array") {
          throw new CompileError(`for-each not applicable to expression type\n  required: array or java.lang.Iterable\n  found:    ${typeName(iterable)}`, s.iter.line);
        }
        for (const item of iterable.v) {
          const itemScope = new Scope(scope);
          const type = s.type.name === "var" ? typeOf(item, s.line) : s.type;
          itemScope.declare(s.name, { type, value: coerce(item, type, s.line) }, s.line);
          if (yield* this.loopBody(s.body, itemScope)) break;
        }
        return;
      }
      case "switch": {
        const value = yield* this.eval(s.disc, scope);
        let start = -1;
        for (let i = 0; i < s.cases.length && start < 0; i++) {
          for (const test of s.cases[i].tests ?? []) {
            const label = yield* this.eval(test, scope);
            const match = value.t === "String" && label.t === "String" ? value.v === label.v : sameValue(value, label, test.line);
            if (match) {
              start = i;
              break;
            }
          }
        }
        if (start < 0) start = s.cases.findIndex((c) => c.tests === null);
        if (start < 0) return;
        const body = new Scope(scope);
        try {
          for (const c of s.cases.slice(start)) for (const stmt of c.body) yield* this.exec(stmt, body);
        } catch (signal) {
          if (signal !== BREAK) throw signal;
        }
        return;
      }
      case "break":
        throw BREAK;
      case "continue":
        throw CONTINUE;
      case "return":
        throw new ReturnSignal(s.e ? yield* this.eval(s.e, scope) : VOID);
      case "empty":
        return;
    }
  }

  /** Runs one loop iteration; returns true when the loop should stop (break). */
  private *loopBody(body: Stmt, scope: Scope): Gen<boolean> {
    try {
      yield* this.exec(body, scope);
    } catch (signal) {
      if (signal === BREAK) return true;
      if (signal !== CONTINUE) throw signal;
    }
    return false;
  }

  private *test(e: Expr, scope: Scope): Gen<boolean> {
    const v = yield* this.eval(e, scope);
    if (v.t !== "boolean") throw new CompileError(`incompatible types: ${typeName(v)} cannot be converted to boolean`, e.line);
    return v.v;
  }

  private *declare(declared: TypeRef, d: VarDecl, scope: Scope): Gen<void> {
    let type: TypeRef = { name: declared.name, dims: declared.dims + d.dims };
    let value: Value | undefined;
    if (d.init) {
      if (d.init.k === "arrayLit") {
        if (type.name === "var") {
          throw new CompileError(`cannot infer type for local variable ${d.name}\n  (array initializer needs an explicit target-type)`, d.line);
        }
        value = yield* this.arrayLit(d.init, type, scope);
      } else {
        value = yield* this.eval(d.init, scope);
        if (type.name === "var") type = typeOf(value, d.line);
        else value = coerce(value, type, d.line);
      }
    } else if (type.name === "var") {
      throw new CompileError(`cannot infer type for local variable ${d.name}\n  (cannot use 'var' on variable without initializer)`, d.line);
    } else if (scope === this.globals) {
      value = defaultValue(type);
    }
    scope.declare(d.name, { type, value }, d.line);
  }

  // -- expressions ----------------------------------------------------------

  private *eval(e: Expr, scope: Scope): Gen<Value> {
    switch (e.k) {
      case "lit":
        return e.value;
      case "name": {
        const slot = scope.find(e.name);
        if (slot) return this.read(slot, e.name, e.line);
        if (KNOWN_CLASSES.has(e.name) || e.name === this.program.className) return { t: "class", name: e.name };
        throw new CompileError(`cannot find symbol\n  symbol:   variable ${e.name}`, e.line);
      }
      case "assign": {
        const ref = yield* this.ref(e.target, scope);
        if (e.op === "=") {
          const value = e.value.k === "arrayLit" && !e.value.type
            ? yield* this.arrayLit(e.value, ref.type, scope)
            : coerce(yield* this.eval(e.value, scope), ref.type, e.line);
          ref.set(value);
          return value;
        }
        const current = ref.get();
        const rhs = yield* this.eval(e.value, scope);
        // Compound assignment casts back to the variable's type: int x; x += 1.5 is legal.
        const value = castTo(binaryOp(e.op.slice(0, -1), current, rhs, e.line), ref.type, e.line);
        ref.set(value);
        return value;
      }
      case "cond":
        return (yield* this.test(e.test, scope)) ? yield* this.eval(e.a, scope) : yield* this.eval(e.b, scope);
      case "bin": {
        if (e.op === "&&" || e.op === "||") {
          const left = yield* this.test(e.l, scope);
          if (left === (e.op === "||")) return boolV(left);
          return boolV(yield* this.test(e.r, scope));
        }
        const l = yield* this.eval(e.l, scope);
        const r = yield* this.eval(e.r, scope);
        return binaryOp(e.op, l, r, e.line);
      }
      case "unary": {
        const v = yield* this.eval(e.e, scope);
        if (e.op === "!") {
          if (v.t !== "boolean") throw new CompileError(`bad operand type ${typeName(v)} for unary operator '!'`, e.line);
          return boolV(!v.v);
        }
        if (!isNum(v) || (e.op === "~" && v.t === "double")) {
          throw new CompileError(`bad operand type ${typeName(v)} for unary operator '${e.op}'`, e.line);
        }
        const make = v.t === "double" ? doubleV : v.t === "long" ? longV : intV;
        return make(e.op === "-" ? -v.v : e.op === "~" ? ~v.v : v.v);
      }
      case "update": {
        const ref = yield* this.ref(e.target, scope);
        const current = ref.get();
        if (!isNum(current)) throw new CompileError(`bad operand type ${typeName(current)} for unary operator '${e.op}'`, e.line);
        const delta = e.op === "++" ? 1 : -1;
        const make = { int: intV, long: longV, double: doubleV, char: charV }[current.t];
        const next = make(current.v + delta);
        ref.set(next);
        return e.prefix ? next : current;
      }
      case "cast":
        return castTo(yield* this.eval(e.e, scope), e.type, e.line);
      case "member":
        return this.field(yield* this.eval(e.obj, scope), e.name, e.line);
      case "index": {
        const arr = yield* this.eval(e.obj, scope);
        const index = yield* this.eval(e.index, scope);
        return arr.t === "array" ? arr.v[this.checkIndex(arr, index, e.line)] : this.notAnArray(arr, e.line);
      }
      case "call": {
        if (e.target === null) {
          const args = yield* this.evalArgs(e.args, scope);
          return yield* this.callUser(e.name, args, e.line);
        }
        const target = yield* this.eval(e.target, scope);
        const args = yield* this.evalArgs(e.args, scope);
        return yield* this.invoke(target, e.name, args, e.line);
      }
      case "new": {
        const args = yield* this.evalArgs(e.args, scope);
        if (e.cls === "Scanner") {
          if (args.length !== 1 || args[0].t !== "InputStream") {
            throw new CompileError("the sandbox Scanner reads the console: use new Scanner(System.in)", e.line);
          }
          return { t: "Scanner" };
        }
        if (e.cls === "String") return strV(args.length ? toJavaString(args[0]) : "");
        if (e.cls === "Object") return { t: "class", name: "Object" };
        throw new CompileError(`${e.cls} is not available in the sandbox`, e.line);
      }
      case "newArray": {
        const sizes: number[] = [];
        for (const dim of e.dims) {
          const size = coerce(yield* this.eval(dim, scope), { name: "int", dims: 0 }, dim.line) as NumValue;
          sizes.push(size.v);
        }
        return this.makeArray(e.elem, sizes, e.dims.length + e.extra);
      }
      case "arrayLit":
        if (!e.type) throw new CompileError("illegal start of expression", e.line);
        return yield* this.arrayLit(e, e.type, scope);
    }
  }

  private read(slot: Slot, name: string, line: number): Value {
    if (slot.value === undefined) throw new CompileError(`variable ${name} might not have been initialized`, line);
    return slot.value;
  }

  private *evalArgs(args: Expr[], scope: Scope): Gen<Value[]> {
    const values: Value[] = [];
    for (const a of args) values.push(yield* this.eval(a, scope));
    return values;
  }

  private *ref(target: Expr, scope: Scope): Gen<Ref> {
    if (target.k === "name") {
      const slot = scope.find(target.name);
      if (!slot) throw new CompileError(`cannot find symbol\n  symbol:   variable ${target.name}`, target.line);
      return {
        type: slot.type,
        get: () => this.read(slot, target.name, target.line),
        set: (v) => {
          slot.value = v;
        },
      };
    }
    if (target.k === "index") {
      const arr = yield* this.eval(target.obj, scope);
      const index = yield* this.eval(target.index, scope);
      if (arr.t !== "array") return this.notAnArray(arr, target.line);
      const i = this.checkIndex(arr, index, target.line);
      return {
        type: { name: arr.type.name, dims: arr.type.dims - 1 },
        get: () => arr.v[i],
        set: (v) => {
          arr.v[i] = v;
        },
      };
    }
    if (target.k === "member") {
      const obj = yield* this.eval(target.obj, scope);
      if (obj.t === "array" && target.name === "length") {
        throw new CompileError("cannot assign a value to final variable length", target.line);
      }
      const slot = obj.t === "class" && obj.name === this.program.className ? this.globals.find(target.name) : undefined;
      if (slot) {
        return {
          type: slot.type,
          get: () => this.read(slot, target.name, target.line),
          set: (v) => {
            slot.value = v;
          },
        };
      }
    }
    throw new CompileError("unexpected type\n  required: variable\n  found:    value", target.line);
  }

  private notAnArray(v: Value, line: number): never {
    if (v.t === "null") throw new JavaException("java.lang.NullPointerException", "Cannot load from array because value is null");
    throw new CompileError(`array required, but ${typeName(v)} found`, line);
  }

  private checkIndex(arr: ArrayValue, index: Value, line: number): number {
    const i = coerce(index, { name: "int", dims: 0 }, line);
    const n = (i as NumValue).v;
    if (n < 0 || n >= arr.v.length) {
      throw new JavaException("java.lang.ArrayIndexOutOfBoundsException", `Index ${n} out of bounds for length ${arr.v.length}`);
    }
    return n;
  }

  private makeArray(elem: string, sizes: number[], dims: number): ArrayValue {
    const [size, ...rest] = sizes;
    if (size < 0) throw new JavaException("java.lang.NegativeArraySizeException", String(size));
    if (size > MAX_ARRAY_LENGTH) throw new JavaException("java.lang.OutOfMemoryError", "Java heap space");
    const type = { name: elem, dims };
    const leaf = defaultValue({ name: elem, dims: dims - 1 });
    return arrayV(
      type,
      Array.from({ length: size }, () => (rest.length ? this.makeArray(elem, rest, dims - 1) : leaf)),
    );
  }

  private *arrayLit(e: Expr, type: TypeRef, scope: Scope): Gen<Value> {
    if (e.k !== "arrayLit") return coerce(yield* this.eval(e, scope), type, e.line);
    if (type.dims < 1) throw new CompileError(`illegal initializer for ${describe(type)}`, e.line);
    const elemType = { name: type.name, dims: type.dims - 1 };
    const items: Value[] = [];
    for (const item of e.items) items.push(yield* this.arrayLit(item, elemType, scope));
    return arrayV(type, items);
  }

  private field(obj: Value, name: string, line: number): Value {
    if (obj.t === "array" && name === "length") return intV(obj.v.length);
    if (obj.t === "class") {
      const constant = STATIC_FIELDS[`${obj.name}.${name}`];
      if (constant) return constant;
      const slot = obj.name === this.program.className ? this.globals.find(name) : undefined;
      if (slot) return this.read(slot, name, line);
    }
    if (obj.t === "null") throw new JavaException("java.lang.NullPointerException", `Cannot read field "${name}" because value is null`);
    if (isNum(obj) || obj.t === "boolean") throw new CompileError(`${obj.t} cannot be dereferenced`, line);
    throw new CompileError(`cannot find symbol\n  symbol:   variable ${name}\n  location: ${typeName(obj)}`, line);
  }

  // -- calls ----------------------------------------------------------------

  private *invoke(target: Value, name: string, args: Value[], line: number): Gen<Value> {
    switch (target.t) {
      case "PrintStream":
        return this.print(target, name, args, line);
      case "Scanner":
        return yield* this.scan(name, args, line);
      case "String":
        return stringMethod(target, name, args, line);
      case "class":
        if (target.name === this.program.className) return yield* this.callUser(name, args, line);
        if (target.name === "Thread" && name === "sleep") {
          const ms = Math.min(MAX_SLEEP_MS, Math.max(0, isNum(args[0] ?? VOID) ? (args[0] as NumValue).v : 0));
          yield new Promise((resolve) => setTimeout(resolve, ms));
          return VOID;
        }
        if (target.name === "System" && name === "exit") throw new ExitSignal(intArg(args, 0, line));
        return staticMethod(target.name, name, args, line);
      case "array":
        if (name === "clone" && args.length === 0) return arrayV(target.type, [...target.v]);
        break;
      case "null":
        throw new JavaException("java.lang.NullPointerException", `Cannot invoke "${name}()" because value is null`);
      case "int":
      case "long":
      case "double":
      case "char":
      case "boolean":
        throw new CompileError(`${target.t} cannot be dereferenced`, line);
    }
    throw cannotFindMethod(name, args, typeName(target), line);
  }

  private print(target: { stream: OutputStream }, name: string, args: Value[], line: number): Value {
    if (args.some((a) => a.t === "void")) throw new CompileError("'void' type not allowed here", line);
    const text = (v: Value) =>
      v.t === "array" && v.type.name === "char" && v.type.dims === 1 ? v.v.map(toJavaString).join("") : toJavaString(v);
    switch (name) {
      case "println":
        if (args.length > 1) break;
        this.io.write(`${args.length ? text(args[0]) : ""}\n`, target.stream);
        return VOID;
      case "print":
        if (args.length !== 1) break;
        this.io.write(text(args[0]), target.stream);
        return VOID;
      case "printf":
      case "format": {
        const [fmt, ...rest] = args;
        if (fmt?.t !== "String") break;
        this.io.write(formatJava(fmt.v, rest), target.stream);
        return { t: "PrintStream", stream: target.stream };
      }
      case "flush":
        return VOID;
    }
    throw new CompileError(`no suitable method found for ${name}(${args.map(typeName).join(",")})`, line);
  }

  private *scan(name: string, args: Value[], line: number): Gen<Value> {
    if (args.length > 0) throw cannotFindMethod(name, args, "class Scanner", line);
    const s = this.stdin;
    const mismatch = (detail: string | null = null) => new JavaException("java.util.InputMismatchException", detail);
    switch (name) {
      case "nextLine":
        return strV(yield* s.nextLine());
      case "next":
        return strV(yield* s.next());
      case "nextInt":
      case "nextLong": {
        const token = yield* s.peek();
        if (!INT_TOKEN.test(token)) throw mismatch();
        const n = Number(token);
        if (name === "nextInt" ? Math.abs(n) > 2147483647 && n !== -2147483648 : !Number.isSafeInteger(n)) {
          throw mismatch(`For input string: "${token}"`);
        }
        s.consume(token);
        return name === "nextInt" ? intV(n) : longV(n);
      }
      case "nextDouble": {
        const token = yield* s.peek();
        if (!DOUBLE_TOKEN.test(token)) throw mismatch();
        s.consume(token);
        return doubleV(Number(token));
      }
      case "nextBoolean": {
        const token = yield* s.peek();
        if (!/^(true|false)$/i.test(token)) throw mismatch();
        s.consume(token);
        return boolV(token.toLowerCase() === "true");
      }
      case "hasNext":
      case "hasNextLine":
        // The console never reaches end-of-input, so these block for input and then succeed.
        yield* s.peek();
        return boolV(true);
      case "hasNextInt":
        return boolV(INT_TOKEN.test(yield* s.peek()));
      case "hasNextDouble":
        return boolV(DOUBLE_TOKEN.test(yield* s.peek()));
      case "close":
        return VOID;
    }
    throw cannotFindMethod(name, args, "class Scanner", line);
  }

  private *callUser(name: string, args: Value[], line: number): Gen<Value> {
    const location = `class ${this.program.className}`;
    const candidates = this.program.methods.get(name);
    if (!candidates) throw cannotFindMethod(name, args, location, line);
    const method = candidates.find((m) => m.params.length === args.length);
    if (!method) {
      throw new CompileError(
        `method ${name} in ${location} cannot be applied to given types;\n  required: ${candidates[0].params.map((p) => describe(p.type)).join(",") || "no arguments"}\n  found:    ${args.map(typeName).join(",") || "no arguments"}`,
        line,
      );
    }
    if (!method.isStatic) {
      throw new CompileError(
        `non-static method ${name}(${method.params.map((p) => describe(p.type)).join(",")}) cannot be referenced from a static context`,
        line,
      );
    }
    if (this.frames.length > MAX_DEPTH) throw new JavaException("java.lang.StackOverflowError");

    const scope = new Scope(this.globals, true);
    method.params.forEach((p, i) => scope.declare(p.name, { type: p.type, value: coerce(args[i], p.type, line) }, method.line));

    this.frames.push({ method: name, line: method.line });
    let result: Value = VOID;
    try {
      yield* this.exec(method.body, scope);
    } catch (signal) {
      if (!(signal instanceof ReturnSignal)) throw signal;
      result = signal.value;
    }
    this.frames.pop();

    if (method.ret.name === "void") return VOID;
    if (result.t === "void") throw new CompileError("missing return statement", method.endLine);
    return coerce(result, method.ret, line);
  }
}
