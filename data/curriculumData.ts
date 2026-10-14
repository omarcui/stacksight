import type { CurriculumPhase, Module } from "@/types/curriculum";

export const curriculumData: Module[] = [
  // -------------------------------------------------------------------------
  // Module 1 — Computing & Java system architecture
  // -------------------------------------------------------------------------
  {
    id: "module-1",
    title: "Computers, Programs & the Java Platform",
    subtitle: "JDK, JRE, JVM and the compile–execute lifecycle",
    description:
      "How a Java program travels from source code to running process, the roles of the JDK, JRE and JVM, and how math formulas translate into Java expressions.",
    iconName: "Cpu",
    units: [
      {
        id: "m1-u1",
        title: "The Java Platform",
        slideReference: "Lecture 1, Java platform overview",
        lessons: [
          {
            id: "m1-u1-l1",
            title: "JDK, JRE and JVM",
            description: "Distinguish the development kit, the runtime environment and the virtual machine.",
            estimatedMinutes: 10,
            blocks: [
              {
                id: "intro",
                type: "text",
                text: "Java is **compiled once** to platform-neutral *bytecode*, then **interpreted or JIT-compiled** by a JVM on each machine. This is the basis of *write once, run anywhere*.",
              },
              {
                id: "layers",
                type: "text",
                text: "- **JVM** (Java Virtual Machine): loads, verifies and executes bytecode.\n- **JRE** (Java Runtime Environment): JVM + core class libraries. Enough to *run* programs.\n- **JDK** (Java Development Kit): JRE + tools such as `javac`, `java`, `jar`, `javadoc`. Needed to *write* programs.",
              },
              {
                id: "nesting",
                type: "callout",
                variant: "info",
                text: "Think of them as nested boxes: **JDK ⊃ JRE ⊃ JVM**.",
              },
              {
                id: "jvm-arch",
                type: "interactive",
                interactiveWidgetId: "jvm-arch",
                caption: "Select each layer to see what it contains, what it consumes and what it produces.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "multiple_choice",
                text: "Which component is required to compile `Hello.java` but not to run `Hello.class`?",
              },
            ],
            keyTakeaways: [
              "The JVM executes bytecode; it is platform-specific, bytecode is not.",
              "The JRE is the JVM plus the standard libraries.",
              "The JDK adds development tools like javac on top of the JRE.",
            ],
          },
          {
            id: "m1-u1-l2",
            title: "Compile & Execute Lifecycle",
            description: "Trace a program from .java source to .class bytecode to running output.",
            estimatedMinutes: 12,
            blocks: [
              {
                id: "steps",
                type: "text",
                text: "1. **Edit** — write source in `Welcome.java`.\n2. **Compile** — `javac` checks syntax and emits `Welcome.class` (bytecode).\n3. **Load & verify** — the class loader reads bytecode; the verifier checks it is safe.\n4. **Execute** — the JVM interprets bytecode, JIT-compiling hot paths to native code.",
              },
              {
                id: "source",
                type: "code",
                language: "java",
                caption: "Welcome.java (Lab 1, Exercise 1.2)",
                code: `public class Welcome {
    public static void main(String[] args) {
        System.out.println("Welcome to CSC103 Programming Fundamentals!");
        System.out.println("Java Virtual Machine (JVM) executes bytecode.");
        System.out.println("Compiling with javac...");
    }
}`,
              },
              {
                id: "commands",
                type: "code",
                language: "bash",
                caption: "Compile, then run (note: no .class extension when running)",
                code: `javac Welcome.java   # produces Welcome.class
java Welcome         # runs the bytecode on the JVM`,
              },
              {
                id: "execution-lifecycle",
                type: "interactive",
                interactiveWidgetId: "execution-lifecycle",
                caption: "Step through edit, compile, load, verify and execute, with the terminal output of each stage.",
              },
              {
                id: "filename-pitfall",
                type: "callout",
                variant: "error_pitfall",
                text: "A `public class` must live in a file with **exactly** the same name, case included. `public class Welcome` in `welcome.java` will not compile.",
              },
            ],
            keyTakeaways: [
              "javac translates source to bytecode; java runs bytecode on the JVM.",
              "Bytecode is portable across any OS with a JVM.",
              "The public class name must match the filename.",
            ],
          },
        ],
      },
      {
        id: "m1-u2",
        title: "Formulas in Code",
        slideReference: "Lecture 1, translating formulas",
        lessons: [
          {
            id: "m1-u2-l1",
            title: "Powers, Roots and Distance",
            description: "Translate mathematical notation into Java expressions using the Math class.",
            estimatedMinutes: 10,
            blocks: [
              {
                id: "power",
                type: "formula",
                latex: "x^y",
                caption: "Exponentiation → Math.pow(x, y)",
              },
              {
                id: "distance",
                type: "formula",
                latex: String.raw`d = \sqrt{\Delta x^2 + \Delta y^2}`,
                caption: "Euclidean distance between two points",
              },
              {
                id: "distance-code",
                type: "code",
                language: "java",
                code: `double dx = x2 - x1;
double dy = y2 - y1;
double d = Math.sqrt(dx * dx + dy * dy);
double cube = Math.pow(2, 3); // 8.0`,
              },
              {
                id: "flowchart-runner",
                type: "interactive",
                interactiveWidgetId: "flowchart-runner",
                caption: "Trace the Lab 2 flowcharts step by step: the x^y loop (Exercise 2.2) and Euclidean distance (Exercise 2.1, try (0, 0) to (3, 4) for 5.0).",
              },
              {
                id: "exponential-eval",
                type: "interactive",
                interactiveWidgetId: "exponential-eval",
                caption: "Lab 2, Exercise 2.2: compute x^y with a loop, one multiplication per step, then compare it with Math.pow and the ^ operator. Try 1.1^10 to see rounding drift.",
              },
              {
                id: "caret",
                type: "callout",
                variant: "warning",
                text: "`^` is **not** exponentiation in Java — it is bitwise/logical XOR. `2 ^ 3` evaluates to `1`, not `8`.",
              },
            ],
            keyTakeaways: [
              "Use Math.pow(x, y) for x^y and Math.sqrt for square roots.",
              "Math.pow and Math.sqrt return double.",
              "The ^ operator means XOR, never power.",
            ],
          },
        ],
      },
    ],
    deliverable: {
      title: "Welcome Program",
      description:
        "Lab 1, Exercise 1.2: write a Welcome class that prints three distinct statements, compile it with javac Welcome.java and run it with java Welcome.",
      filename: "Welcome.java",
    },
  },

  // -------------------------------------------------------------------------
  // Module 2 — Elementary programming: syntax & errors
  // -------------------------------------------------------------------------
  {
    id: "module-2",
    title: "Java Syntax Fundamentals",
    subtitle: "Program structure, tokens and error types",
    description:
      "The anatomy of a Java program, the tokens the compiler sees, and how to recognise syntax, runtime and logic errors.",
    iconName: "Braces",
    units: [
      {
        id: "m2-u1",
        title: "Anatomy of a Program",
        slideReference: "Lecture 2, program structure",
        lessons: [
          {
            id: "m2-u1-l1",
            title: "Classes and the main Method",
            description: "Understand the entry point every Java application needs.",
            estimatedMinutes: 10,
            blocks: [
              {
                id: "main",
                type: "code",
                language: "java",
                code: `public class ComputeArea {
    public static void main(String[] args) {
        double radius = 20;
        double area = radius * radius * Math.PI;
        System.out.println("Area: " + area);
    }
}`,
              },
              {
                id: "signature",
                type: "text",
                text: "- `public` — visible to the JVM.\n- `static` — runs without creating an object.\n- `void` — returns nothing.\n- `String[] args` — command-line arguments.\n\nStatements end with `;` and blocks are delimited by `{ }`.",
              },
              {
                id: "code-anatomy",
                type: "interactive",
                interactiveWidgetId: "code-anatomy",
                caption: "Inspect Welcome.java from Lab 1: the class name, main signature, braces and statement terminators.",
              },
              {
                id: "case",
                type: "callout",
                variant: "tip",
                text: "Java is case-sensitive: `Main`, `main` and `MAIN` are three different identifiers.",
              },
            ],
            keyTakeaways: [
              "Execution starts at public static void main(String[] args).",
              "Every statement ends with a semicolon.",
              "Java identifiers are case-sensitive.",
            ],
          },
          {
            id: "m2-u1-l2",
            title: "Tokens",
            description: "Break source code into keywords, identifiers, literals, operators and separators.",
            estimatedMinutes: 8,
            blocks: [
              {
                id: "kinds",
                type: "text",
                text: "| Token | Examples |\n|---|---|\n| Keyword | `class`, `int`, `if`, `return` |\n| Identifier | `radius`, `ComputeArea` |\n| Literal | `20`, `3.14`, `'A'`, `\"hi\"`, `true` |\n| Operator | `+`, `=`, `==`, `&&` |\n| Separator | `;`, `,`, `( )`, `{ }`, `[ ]` |",
              },
              {
                id: "identifiers",
                type: "callout",
                variant: "warning",
                text: "Identifiers may contain letters, digits, `_` and `$`, cannot start with a digit, and cannot be a reserved word. `2ndValue` and `class` are invalid.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "multiple_choice",
                text: "Which of these is a valid identifier: `$total`, `3d`, `int`, `my-var`?",
              },
            ],
            keyTakeaways: [
              "The compiler reads source as a stream of tokens.",
              "Keywords are reserved and cannot be identifiers.",
              "Identifiers cannot begin with a digit.",
            ],
          },
        ],
      },
      {
        id: "m2-u2",
        title: "Programming Errors",
        slideReference: "Lecture 2, programming errors",
        lessons: [
          {
            id: "m2-u2-l1",
            title: "Syntax, Runtime and Logic Errors",
            description: "Classify errors by when and how they surface.",
            estimatedMinutes: 12,
            blocks: [
              {
                id: "types",
                type: "text",
                text: "- **Syntax (compile) errors** — break grammar rules; `javac` refuses to compile.\n- **Runtime errors** — compile fine but crash during execution (exceptions).\n- **Logic errors** — run to completion but produce the wrong result.",
              },
              {
                id: "syntax",
                type: "code",
                language: "java",
                caption: "Syntax error: missing semicolon and closing quote",
                code: `System.out.println("Hello)`,
              },
              {
                id: "runtime",
                type: "code",
                language: "java",
                caption: "Runtime error: ArithmeticException",
                code: `int zero = 0;
int result = 10 / zero;`,
              },
              {
                id: "logic",
                type: "code",
                language: "java",
                caption: "Logic error: integer division gives 1 instead of 1.8",
                code: `double celsiusFactor = 9 / 5;      // 1.0
double correct       = 9.0 / 5;    // 1.8`,
              },
              {
                id: "logic-tip",
                type: "callout",
                variant: "error_pitfall",
                text: "Logic errors are the hardest to find because nothing fails. Test with inputs whose answers you already know.",
              },
              {
                id: "syntax-fixer",
                type: "interactive",
                interactiveWidgetId: "syntax-fixer",
                caption: "Classify and fix the bugs in Welcome.java and the Lab 2 distance program until it prints Distance = 5.0 for (0, 0) and (3, 4).",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "syntax_fix",
                text: "Fix the compile errors in a short program with mismatched braces and a missing semicolon.",
              },
            ],
            keyTakeaways: [
              "Syntax errors are caught by the compiler.",
              "Runtime errors occur during execution, often as exceptions.",
              "Logic errors silently produce wrong output.",
            ],
          },
        ],
      },
    ],
    deliverable: {
      title: "Distance Calculator",
      description:
        "Lab 2: compute the Euclidean distance between (x1, y1) and (x2, y2) with Math.sqrt, printing Distance = 5.0 for (0, 0) and (3, 4), then compute x^y with Math.pow (2.0 raised to 10.0 = 1024.0). Document one syntax, runtime and logic error in comments.",
      filename: "DistanceCalculator.java",
    },
  },

  // -------------------------------------------------------------------------
  // Module 3 — Primitive data types
  // -------------------------------------------------------------------------
  {
    id: "module-3",
    title: "Primitive Data Types",
    subtitle: "Sizes, literals and type casting",
    description:
      "The eight primitive types, their memory footprints and ranges, how to write numeric literals in different bases, and how to convert safely between types.",
    iconName: "Binary",
    units: [
      {
        id: "m3-u1",
        title: "Numeric Types",
        slideReference: "Lecture 3, primitive types",
        lessons: [
          {
            id: "m3-u1-l1",
            title: "From byte to double",
            description: "Compare the size and range of each primitive type.",
            estimatedMinutes: 12,
            blocks: [
              {
                id: "table",
                type: "text",
                text: "| Type | Size | Range / precision |\n|---|---|---|\n| `byte` | 8 bits | −128 to 127 |\n| `short` | 16 bits | −32,768 to 32,767 |\n| `int` | 32 bits | about ±2.1 × 10⁹ |\n| `long` | 64 bits | about ±9.2 × 10¹⁸ |\n| `float` | 32 bits | ~7 decimal digits |\n| `double` | 64 bits | ~15 decimal digits |\n| `char` | 16 bits | Unicode `\\u0000`–`\\uFFFF` |\n| `boolean` | — | `true` / `false` |",
              },
              {
                id: "range",
                type: "formula",
                latex: String.raw`-2^{n-1} \le v \le 2^{n-1} - 1`,
                caption: "Range of an n-bit signed integer type",
              },
              {
                id: "declare",
                type: "code",
                language: "java",
                code: `byte  b = 100;
int   count = 42;
long  population = 8_000_000_000L; // L suffix required
float ratio = 0.75f;               // f suffix required
double pi = 3.14159;`,
              },
              {
                id: "primitive-memory",
                type: "interactive",
                interactiveWidgetId: "primitive-memory",
                caption: "Compare how many bytes each primitive occupies and the range those bits can hold.",
              },
              {
                id: "overflow",
                type: "callout",
                variant: "warning",
                text: "Integer overflow wraps silently: `Integer.MAX_VALUE + 1` equals `Integer.MIN_VALUE`.",
              },
            ],
            keyTakeaways: [
              "Integer types grow from byte (8 bits) to long (64 bits).",
              "Floating-point literals default to double; use f for float.",
              "Long literals beyond int range need an L suffix.",
            ],
          },
          {
            id: "m3-u1-l2",
            title: "Binary, Octal and Hex Literals",
            description: "Write integer literals in bases 2, 8, 10 and 16.",
            estimatedMinutes: 8,
            blocks: [
              {
                id: "literals",
                type: "code",
                language: "java",
                code: `int dec = 255;
int bin = 0b1111_1111; // binary prefix 0b
int oct = 0377;        // octal prefix 0
int hex = 0xFF;        // hex prefix 0x
System.out.println(dec == bin && bin == oct && oct == hex); // true`,
              },
              {
                id: "hex-formula",
                type: "formula",
                latex: String.raw`\mathtt{0xFF} = 15 \cdot 16^1 + 15 \cdot 16^0 = 255`,
              },
              {
                id: "octal-pitfall",
                type: "callout",
                variant: "error_pitfall",
                text: "A leading zero makes a literal octal: `int x = 010;` stores **8**, not 10.",
              },
              {
                id: "stack-tracker",
                type: "interactive",
                interactiveWidgetId: "stack-tracker",
                caption: "Watch hex, binary and Unicode literals land in main()'s stack frame, and see a long take two slots.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "output_prediction",
                text: "What does `System.out.println(0x1A + 0b11);` print?",
              },
            ],
            keyTakeaways: [
              "0b = binary, 0 = octal, 0x = hexadecimal.",
              "Underscores improve readability and are ignored by the compiler.",
              "All bases describe the same int value internally.",
            ],
          },
        ],
      },
      {
        id: "m3-u2",
        title: "Type Conversion",
        slideReference: "Lecture 3, numeric type conversions",
        lessons: [
          {
            id: "m3-u2-l1",
            title: "Widening and Explicit Casting",
            description: "Convert between numeric types implicitly and with casts.",
            estimatedMinutes: 10,
            blocks: [
              {
                id: "widening",
                type: "text",
                text: "**Widening** (small → large) happens automatically:\n\n`byte → short → int → long → float → double`\n\n**Narrowing** (large → small) requires an explicit cast and may lose data.",
              },
              {
                id: "cast",
                type: "code",
                language: "java",
                code: `int i = 7;
double d = i;            // widening: 7.0
double price = 9.99;
int whole = (int) price; // narrowing: 9 (truncated, not rounded)
int big = 300;
byte small = (byte) big; // 44 — high bits discarded
double avg = (double) 7 / 2; // 3.5`,
              },
              {
                id: "truncate",
                type: "callout",
                variant: "tip",
                text: "Casting to `int` truncates toward zero. Use `Math.round()` when you want rounding.",
              },
              {
                id: "type-casting",
                type: "interactive",
                interactiveWidgetId: "type-casting",
                caption: "Evaluate widening and narrowing casts. Try Lab 3's cases: (int) 7.99 gives 7, and (byte) 130 gives -126.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "code_fill",
                text: "Insert the cast that makes `sum / count` produce a fractional average.",
              },
            ],
            keyTakeaways: [
              "Widening conversions are implicit and safe.",
              "Narrowing requires (type) casts and can overflow or truncate.",
              "Cast an operand, not the result, to force floating-point division.",
            ],
          },
        ],
      },
    ],
    deliverable: {
      title: "Type Casting Demo",
      description:
        "Lab 3, Exercise 3.1: demonstrate explicit narrowing casts and print each result: (int) 7.99 truncates to 7 and (byte) 130 overflows to -126.",
      filename: "TypeCastingDemo.java",
    },
  },

  // -------------------------------------------------------------------------
  // Module 4 — Console input & formatted output
  // -------------------------------------------------------------------------
  {
    id: "module-4",
    title: "Console I/O",
    subtitle: "Scanner input, printf formatting and escape sequences",
    description:
      "Read user input with Scanner, format output precisely with printf specifiers, and control text layout with escape sequences.",
    iconName: "Terminal",
    units: [
      {
        id: "m4-u1",
        title: "Reading Input",
        slideReference: "Lecture 4, reading input from the console",
        lessons: [
          {
            id: "m4-u1-l1",
            title: "The Scanner Class",
            description: "Read numbers, words and lines from standard input.",
            estimatedMinutes: 12,
            blocks: [
              {
                id: "scanner",
                type: "code",
                language: "java",
                code: `import java.util.Scanner;

public class ReadInput {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        System.out.print("Enter your age: ");
        int age = input.nextInt();
        System.out.print("Enter your GPA: ");
        double gpa = input.nextDouble();
        input.nextLine(); // consume leftover newline
        System.out.print("Enter your full name: ");
        String name = input.nextLine();
        System.out.println(name + ", " + age + ", " + gpa);
        input.close();
    }
}`,
              },
              {
                id: "methods",
                type: "text",
                text: "- `nextInt()`, `nextDouble()`, `nextBoolean()` — read one typed token.\n- `next()` — reads one word (stops at whitespace).\n- `nextLine()` — reads the rest of the line.",
              },
              {
                id: "newline-pitfall",
                type: "callout",
                variant: "error_pitfall",
                text: "`nextInt()` leaves the newline in the buffer. A following `nextLine()` returns an empty string unless you consume it first.",
              },
            ],
            keyTakeaways: [
              "Import java.util.Scanner and wrap System.in.",
              "Token methods stop at whitespace; nextLine reads the whole line.",
              "Consume the trailing newline after numeric reads.",
            ],
          },
        ],
      },
      {
        id: "m4-u2",
        title: "Formatting Output",
        slideReference: "Lecture 4, formatting console output",
        lessons: [
          {
            id: "m4-u2-l1",
            title: "printf Format Specifiers",
            description: "Control width, precision and alignment with printf.",
            estimatedMinutes: 12,
            blocks: [
              {
                id: "spec-table",
                type: "text",
                text: "| Specifier | Meaning | Example output |\n|---|---|---|\n| `%d` | integer | `42` |\n| `%f` | floating point (6 dp) | `3.141593` |\n| `%.2f` | 2 decimal places | `3.14` |\n| `%10.2f` | width 10, 2 dp, right-aligned | `      3.14` |\n| `%-10s` | width 10, left-aligned string | `Java      ` |\n| `%e` | scientific notation | `3.141593e+00` |\n| `%c` / `%b` | char / boolean | `A` / `true` |\n| `%%` | literal percent | `%` |",
              },
              {
                id: "printf",
                type: "code",
                language: "java",
                code: String.raw`String item = "Coffee";
double price = 4.5;
int qty = 3;
System.out.printf("%-10s%5d%10.2f%n", item, qty, price * qty);
// Coffee        3     13.50`,
              },
              {
                id: "printf-builder",
                type: "interactive",
                interactiveWidgetId: "printf-builder",
                caption: "Build a specifier from flags, width, precision and conversion, and see every padded character. Mismatched types and flags show the exception Java throws.",
              },
              {
                id: "mismatch",
                type: "callout",
                variant: "warning",
                text: "Specifiers must match argument types: `printf(\"%d\", 3.5)` throws `IllegalFormatConversionException`.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "output_prediction",
                text: "Predict the exact output, spaces included, of `System.out.printf(\"[%8.3f]\", 2.5);`",
              },
            ],
            keyTakeaways: [
              "%width.precisionf controls field width and decimal places.",
              "A minus flag left-aligns within the field.",
              "%n prints a platform-independent newline.",
            ],
          },
          {
            id: "m4-u2-l2",
            title: "Escape Sequences",
            description: "Embed special characters inside string and char literals.",
            estimatedMinutes: 6,
            blocks: [
              {
                id: "escapes",
                type: "text",
                text: "| Sequence | Character |\n|---|---|\n| `\\n` | newline |\n| `\\t` | tab |\n| `\\\\` | backslash |\n| `\\\"` | double quote |\n| `\\'` | single quote |\n| `\\uXXXX` | Unicode character |",
              },
              {
                id: "escape-code",
                type: "code",
                language: "java",
                code: String.raw`System.out.println("Name:\tAda\nPath:\tC:\\java\\bin");
System.out.println("She said \"Hello\"");`,
              },
              {
                id: "path-tip",
                type: "callout",
                variant: "tip",
                text: "Windows paths need doubled backslashes in Java strings, or use forward slashes, which Java accepts on every OS.",
              },
            ],
            keyTakeaways: [
              "Escape sequences start with a backslash.",
              "Use \\\" to put a quote inside a string.",
              "\\t aligns columns; \\n starts a new line.",
            ],
          },
        ],
      },
    ],
    deliverable: {
      title: "Circle Area Calculator",
      description:
        "Lab 4, Exercise 4.1: read a radius with Scanner and print the radius and area with printf(\"%10.2f\"). Then extend it into ReceiptPrinter.java (Exercise 4.2), an item receipt aligned with \\t, \\n and %12s.",
      filename: "CircleAreaCalculator.java",
    },
  },

  // -------------------------------------------------------------------------
  // Module 5 — Selections
  // -------------------------------------------------------------------------
  {
    id: "module-5",
    title: "Selection Statements",
    subtitle: "Relational logic, if-else and switch",
    description:
      "Make decisions with relational operators, nested if-else chains and switch statements, while avoiding the dangling-else and fall-through traps.",
    iconName: "GitBranch",
    units: [
      {
        id: "m5-u1",
        title: "Conditions and if-else",
        slideReference: "Lecture 5, boolean expressions and if statements",
        lessons: [
          {
            id: "m5-u1-l1",
            title: "Relational Operators",
            description: "Compare values to produce boolean results.",
            estimatedMinutes: 8,
            blocks: [
              {
                id: "ops",
                type: "text",
                text: "| Operator | Meaning |\n|---|---|\n| `<` `<=` | less than (or equal) |\n| `>` `>=` | greater than (or equal) |\n| `==` | equal to |\n| `!=` | not equal to |",
              },
              {
                id: "assign-vs-eq",
                type: "callout",
                variant: "error_pitfall",
                text: "`=` assigns; `==` compares. `if (x = 5)` does not compile for an `int x`.",
              },
              {
                id: "double-eq",
                type: "callout",
                variant: "warning",
                text: "Avoid `==` on doubles: `0.1 + 0.2 == 0.3` is `false`. Compare with a tolerance: `Math.abs(a - b) < 1e-9`.",
              },
            ],
            keyTakeaways: [
              "Relational operators always yield a boolean.",
              "Never confuse = with ==.",
              "Compare floating-point values with a tolerance.",
            ],
          },
          {
            id: "m5-u1-l2",
            title: "if-else Chains and the Dangling Else",
            description: "Build multi-way decisions and understand how else binds.",
            estimatedMinutes: 12,
            blocks: [
              {
                id: "chain",
                type: "code",
                language: "java",
                code: `char grade;
if (score >= 90)      grade = 'A';
else if (score >= 80) grade = 'B';
else if (score >= 70) grade = 'C';
else                  grade = 'F';`,
              },
              {
                id: "dangling",
                type: "code",
                language: "java",
                caption: "Dangling else: indentation lies — else binds to the nearest if",
                code: `if (i > j)
    if (i > k)
        System.out.println("A");
else
    System.out.println("B"); // runs when i > j && i <= k`,
              },
              {
                id: "dangling-fix",
                type: "code",
                language: "java",
                caption: "Use braces to express the intended pairing",
                code: `if (i > j) {
    if (i > k) System.out.println("A");
} else {
    System.out.println("B");
}`,
              },
              {
                id: "braces-tip",
                type: "callout",
                variant: "tip",
                text: "Always use braces, even for single statements. It prevents dangling-else bugs and makes later edits safe.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "output_prediction",
                text: "Given i = 3, j = 2, k = 5, what does the unbraced dangling-else snippet print?",
              },
            ],
            keyTakeaways: [
              "Order else-if conditions from most to least specific.",
              "An else always pairs with the nearest unmatched if.",
              "Braces make intent explicit and eliminate ambiguity.",
            ],
          },
        ],
      },
      {
        id: "m5-u2",
        title: "switch and Applied Selection",
        slideReference: "Lecture 5, switch statements and case study",
        lessons: [
          {
            id: "m5-u2-l1",
            title: "switch and Fall-Through",
            description: "Select among discrete values and control fall-through with break.",
            estimatedMinutes: 10,
            blocks: [
              {
                id: "switch",
                type: "code",
                language: "java",
                code: `switch (day) {
    case 1: case 7:
        System.out.println("Weekend");
        break;
    case 2: case 3: case 4: case 5: case 6:
        System.out.println("Weekday");
        break;
    default:
        System.out.println("Invalid day");
}`,
              },
              {
                id: "fallthrough",
                type: "code",
                language: "java",
                caption: "Missing break: execution falls into the next case",
                code: `int month = 2;
switch (month) {
    case 1: System.out.print("Jan ");
    case 2: System.out.print("Feb ");
    case 3: System.out.print("Mar ");
}
// prints: Feb Mar`,
              },
              {
                id: "decision-branch",
                type: "interactive",
                interactiveWidgetId: "decision-branch",
                caption: "Remove the breaks to watch fall-through, map any birth year to its sign with year % 12 (Lab 5, Exercise 5.2), and test which if a dangling else really pairs with.",
              },
              {
                id: "fallthrough-warning",
                type: "callout",
                variant: "error_pitfall",
                text: "Forgetting `break` is the most common `switch` bug. Fall-through is only useful when several cases share one body.",
              },
              {
                id: "types",
                type: "callout",
                variant: "info",
                text: "A classic `switch` works on `char`, `byte`, `short`, `int`, their wrappers, `String` and enums — not `double` or `boolean`.",
              },
            ],
            keyTakeaways: [
              "switch compares one expression against constant case labels.",
              "Without break, control falls through to the next case.",
              "default handles values no case matches.",
            ],
          },
          {
            id: "m5-u2-l2",
            title: "Case Study: GrossPayCalculator",
            description: "Apply selection to compute pay with overtime.",
            estimatedMinutes: 15,
            blocks: [
              {
                id: "rule",
                type: "formula",
                latex: String.raw`\text{pay} = \begin{cases} h \cdot r & h \le 40 \\ 40r + 1.5r(h - 40) & h > 40 \end{cases}`,
                caption: "Hours beyond 40 are paid at time-and-a-half",
              },
              {
                id: "program",
                type: "code",
                language: "java",
                code: `import java.util.Scanner;

public class GrossPayCalculator {
    public static void main(String[] args) {
        final int REGULAR_HOURS = 40;
        final double OVERTIME_RATE = 1.5;
        Scanner input = new Scanner(System.in);

        System.out.print("Hours worked: ");
        double hours = input.nextDouble();
        System.out.print("Hourly rate: ");
        double rate = input.nextDouble();

        double pay;
        if (hours < 0 || rate < 0) {
            System.out.println("Invalid input");
            return;
        } else if (hours <= REGULAR_HOURS) {
            pay = hours * rate;
        } else {
            double overtime = hours - REGULAR_HOURS;
            pay = REGULAR_HOURS * rate + overtime * rate * OVERTIME_RATE;
        }
        System.out.printf("Gross pay: $%.2f%n", pay);
    }
}`,
              },
              {
                id: "constants",
                type: "callout",
                variant: "tip",
                text: "Named `final` constants such as `REGULAR_HOURS` replace magic numbers and make policy changes a one-line edit.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "output_prediction",
                text: "What gross pay is printed for 45 hours at $20.00/hour?",
              },
            ],
            keyTakeaways: [
              "Validate input before computing.",
              "Split pay into regular and overtime portions.",
              "Use final constants for business rules.",
            ],
          },
        ],
      },
    ],
    deliverable: [
      {
        title: "Gross Pay Calculator",
        description:
          "Lab 5, Exercise 5.1: read hours and hourly rate, validate them, and print gross pay with overtime at 1.5× beyond 40 hours, formatted to two decimals (45 h at $20.00 → Gross Pay: $950.00).",
        filename: "GrossPayCalculator.java",
      },
      {
        title: "Chinese Zodiac",
        description:
          "Lab 5, Exercise 5.2: read a birth year and print its animal sign with a switch on year % 12 (0 = Monkey … 11 = Sheep), e.g. 1996 → Zodiac Sign: Rat.",
        filename: "ChineseZodiac.java",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Module 6 — Logical operators & loops
  // -------------------------------------------------------------------------
  {
    id: "module-6",
    title: "Logic and Loops",
    subtitle: "Logical operators, while, do-while, for and sentinels",
    description:
      "Combine conditions with logical operators, repeat work with the three loop forms, and control input loops with sentinel values.",
    iconName: "Repeat",
    units: [
      {
        id: "m6-u1",
        title: "Logical Operators",
        slideReference: "Lecture 6, logical operators",
        lessons: [
          {
            id: "m6-u1-l1",
            title: "!, &&, || and ^",
            description: "Combine boolean expressions and exploit short-circuit evaluation.",
            estimatedMinutes: 10,
            blocks: [
              {
                id: "truth",
                type: "text",
                text: "| `p` | `q` | `!p` | `p && q` | `p \\|\\| q` | `p ^ q` |\n|---|---|---|---|---|---|\n| T | T | F | T | T | F |\n| T | F | F | F | T | T |\n| F | T | T | F | T | T |\n| F | F | T | F | F | F |",
              },
              {
                id: "xor",
                type: "formula",
                latex: String.raw`p \oplus q = (p \land \lnot q) \lor (\lnot p \land q)`,
                caption: "Exclusive or: true when exactly one operand is true",
              },
              {
                id: "leap",
                type: "code",
                language: "java",
                code: `boolean isLeap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
boolean inRange = age >= 18 && age <= 65;
boolean exactlyOne = hasCoupon ^ isMember;`,
              },
              {
                id: "short-circuit",
                type: "callout",
                variant: "info",
                text: "`&&` and `||` short-circuit: `count != 0 && total / count > 10` never divides by zero because the right side is skipped when `count == 0`.",
              },
              {
                id: "range-pitfall",
                type: "callout",
                variant: "error_pitfall",
                text: "`18 <= age <= 65` does not compile in Java. Write `age >= 18 && age <= 65`.",
              },
            ],
            keyTakeaways: [
              "! negates, && needs both, || needs either, ^ needs exactly one.",
              "&& and || short-circuit; ^ always evaluates both sides.",
              "Chained comparisons must be split with &&.",
            ],
          },
        ],
      },
      {
        id: "m6-u2",
        title: "Loops",
        slideReference: "Lecture 6, loops",
        lessons: [
          {
            id: "m6-u2-l1",
            title: "while, do-while and for",
            description: "Choose the right loop for pre-test, post-test and counted repetition.",
            estimatedMinutes: 14,
            blocks: [
              {
                id: "while",
                type: "code",
                language: "java",
                caption: "while: pre-test, may run zero times",
                code: `int i = 1;
while (i <= 5) {
    System.out.print(i + " ");
    i++;
}`,
              },
              {
                id: "do-while",
                type: "code",
                language: "java",
                caption: "do-while: post-test, always runs at least once",
                code: `int n;
do {
    System.out.print("Enter a positive number: ");
    n = input.nextInt();
} while (n <= 0);`,
              },
              {
                id: "for",
                type: "code",
                language: "java",
                caption: "for: counter-controlled",
                code: `int sum = 0;
for (int k = 1; k <= 100; k++) {
    sum += k;
}
System.out.println(sum); // 5050`,
              },
              {
                id: "loop-debugger",
                type: "interactive",
                interactiveWidgetId: "loop-debugger",
                caption: "Step through each loop form with live variables and condition checks. The Sentinel tab runs SentinelValue.java from Lab 6, Exercise 6.2, which stops on 0.",
              },
              {
                id: "gauss",
                type: "formula",
                latex: String.raw`\sum_{k=1}^{n} k = \frac{n(n+1)}{2}`,
                caption: "Use the closed form to verify loop results",
              },
              {
                id: "infinite",
                type: "callout",
                variant: "error_pitfall",
                text: "A stray semicolon creates an empty body: `while (i < 10);` loops forever. So does forgetting to update the loop variable.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "output_prediction",
                text: "How many times does `for (int i = 10; i > 0; i -= 3)` execute its body?",
              },
            ],
            keyTakeaways: [
              "Use for when the iteration count is known in advance.",
              "Use do-while when the body must run at least once.",
              "Every loop needs progress toward its exit condition.",
            ],
          },
          {
            id: "m6-u2-l2",
            title: "Sentinel-Controlled Loops",
            description: "Process an unknown amount of input until a special value appears.",
            estimatedMinutes: 10,
            blocks: [
              {
                id: "concept",
                type: "text",
                text: "A **sentinel** is a value outside the valid data range that signals *end of input*. Read once before the loop, then read again at the bottom of each iteration.",
              },
              {
                id: "sentinel",
                type: "code",
                language: "java",
                code: `final int SENTINEL = -1;
int sum = 0, count = 0;

System.out.print("Score (-1 to stop): ");
int score = input.nextInt();
while (score != SENTINEL) {
    sum += score;
    count++;
    System.out.print("Score (-1 to stop): ");
    score = input.nextInt();
}
if (count > 0) {
    System.out.printf("Average: %.2f%n", (double) sum / count);
}`,
              },
              {
                id: "sentinel-pitfall",
                type: "callout",
                variant: "warning",
                text: "Never include the sentinel in your totals, and guard the average against `count == 0`.",
              },
            ],
            keyTakeaways: [
              "Choose a sentinel that can never be valid data.",
              "Use a priming read before the loop.",
              "Check for empty input before dividing.",
            ],
          },
          {
            id: "m6-u2-l3",
            title: "Case Study: GuessNumber",
            description: "Combine a random target, a loop and selection into a game.",
            estimatedMinutes: 15,
            blocks: [
              {
                id: "program",
                type: "code",
                language: "java",
                code: `import java.util.Scanner;

public class GuessNumber {
    public static void main(String[] args) {
        int target = (int) (Math.random() * 101); // 0..100
        Scanner input = new Scanner(System.in);
        int guess, attempts = 0;

        System.out.println("Guess a number between 0 and 100");
        do {
            System.out.print("Your guess: ");
            guess = input.nextInt();
            attempts++;
            if (guess > target)      System.out.println("Too high");
            else if (guess < target) System.out.println("Too low");
        } while (guess != target);

        System.out.println("Correct! Attempts: " + attempts);
    }
}`,
              },
              {
                id: "random",
                type: "formula",
                latex: String.raw`\lfloor \text{random()} \times 101 \rfloor \in \{0, 1, \dots, 100\}`,
                caption: "Math.random() returns a double in [0, 1)",
              },
              {
                id: "binary-search",
                type: "callout",
                variant: "tip",
                text: "Always guessing the midpoint of the remaining range finds any number in 0–100 within 7 tries, because 2⁷ = 128 > 101.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "code_fill",
                text: "Complete the loop condition so the game also ends after 7 failed attempts.",
              },
            ],
            keyTakeaways: [
              "do-while suits games that need at least one turn.",
              "Scale and cast Math.random() to get an integer range.",
              "Nested if-else inside a loop gives per-iteration feedback.",
            ],
          },
        ],
      },
    ],
    deliverable: [
      {
        title: "Guess the Number",
        description:
          "Lab 6, Exercise 6.1: pick a random target in 0–100 with Math.random() and loop until the user guesses it, printing too-high/too-low hints and the attempt count.",
        filename: "GuessNumber.java",
      },
      {
        title: "Sentinel Running Average",
        description:
          "Lab 6, Exercise 6.2: read integers until the sentinel 0, then print the sum and floating-point average; if 0 is entered first, print \"No numbers were entered.\"",
        filename: "SentinelValue.java",
      },
    ],
  },
];

/** Syllabus phases shown on the dashboard roadmap, in order. */
export const curriculumPhases: CurriculumPhase[] = [
  { id: "A", title: "Core Fundamentals", moduleIds: ["module-1", "module-2", "module-3"] },
  { id: "B", title: "Intermediate", moduleIds: ["module-4", "module-5", "module-6"] },
];
