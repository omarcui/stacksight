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
                id: "kitchen-analogy",
                type: "text",
                text: "**Start with a kitchen.** Before the technical names, picture how a restaurant turns a recipe into a meal:\n\n- **JDK = the tools and the recipe book.** Knives, measuring cups and the book you write new recipes in. You need it to *create* dishes.\n- **JRE = the kitchen.** The stove, the fridge and the pantry of ingredients. Any kitchen can *cook* a recipe it is handed, even without the recipe-writing tools.\n- **JVM = the chef.** The person standing in the kitchen who reads each instruction and carries it out, one step at a time.\n\nYour Java program is the recipe. The rest of this lesson swaps the analogy for the real terms.",
              },
              {
                id: "kitchen-callout",
                type: "callout",
                variant: "tip",
                text: "A chef can follow a recipe someone else wrote without owning the recipe book. In the same way, you can **run** a Java program with only a JRE, but you need the JDK to **write and compile** one.",
              },
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
                id: "jvm-arch-guide",
                type: "callout",
                variant: "info",
                text: "**🎮 Hands-On Experiment:** You are testing the nested-boxes model of the kitchen. Open each layer and check what it adds on top of the one inside it: the JVM (chef), the JRE (kitchen) and the JDK (tools and recipe book).",
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
                id: "execution-lifecycle-guide",
                type: "callout",
                variant: "info",
                text: "**🎮 Hands-On Experiment:** You are testing the pipeline model: source becomes bytecode, and bytecode becomes running output. Before each step, predict which file exists and what the terminal will show, then advance and check.",
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
                id: "flowchart-runner-guide",
                type: "callout",
                variant: "info",
                text: "**🎮 Hands-On Experiment:** You are testing whether you can \"be the computer\". Follow the arrows one box at a time and keep each variable's value in your head before the widget reveals it.",
              },
              {
                id: "flowchart-runner",
                type: "interactive",
                interactiveWidgetId: "flowchart-runner",
                caption: "Trace the Lab 2 flowcharts step by step: the x^y loop (Exercise 2.2) and Euclidean distance (Exercise 2.1, try (0, 0) to (3, 4) for 5.0).",
              },
              {
                id: "exponential-eval-guide",
                type: "callout",
                variant: "info",
                text: "**🎮 Hands-On Experiment:** You are testing the idea that x^y is just y repeated multiplications. Watch the running product grow, then compare it with `Math.pow` and see why `^` gives a completely different answer.",
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
    deliverable: [
      {
        title: "Welcome Program",
        description:
          "Lab 1, Exercise 1.2: write a Welcome class that prints three distinct statements, compile it with javac Welcome.java and run it with java Welcome.",
        filename: "Welcome.java",
        labReference: "Lab 1, Exercise 1.2",
      },
    ],
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
                id: "grammar-analogy",
                type: "text",
                text: "**Code has grammar, just like English.** A sentence follows rules about word types and punctuation, and so does every Java statement:\n\n- **Keywords are verbs.** Reserved words such as `public`, `class` and `void` tell the compiler what kind of action or structure comes next, and their meaning never changes.\n- **Identifiers are nouns.** Names you choose, such as `Welcome` or `args`, label the things your program talks about.\n- **Semicolons are periods.** A `;` ends one complete statement, the way `.` ends a sentence.\n- **Braces are paragraphs.** `{ }` group related statements into one block.\n\nThe compiler is a strict grammar teacher: one missing \"period\" and it refuses to read any further.",
              },
              {
                id: "main",
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
                id: "signature",
                type: "text",
                text: "- `public` — visible to the JVM.\n- `static` — runs without creating an object.\n- `void` — returns nothing.\n- `String[] args` — command-line arguments.\n\nStatements end with `;` and blocks are delimited by `{ }`.",
              },
              {
                id: "code-anatomy-guide",
                type: "callout",
                variant: "info",
                text: "**🎮 Hands-On Experiment:** You are testing the grammar analogy. Click each part of `Welcome.java` and name its role before reading the rule: the noun (class name), the sentence structure (main header), the paragraphs (braces) and the periods (semicolons).",
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
                text: "| Token | Examples |\n|---|---|\n| Keyword | `class`, `int`, `if`, `return` |\n| Identifier | `radius`, `Welcome` |\n| Literal | `20`, `3.14`, `'A'`, `\"hi\"`, `true` |\n| Operator | `+`, `=`, `==`, `&&` |\n| Separator | `;`, `,`, `( )`, `{ }`, `[ ]` |",
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
                id: "syntax-fixer-guide",
                type: "callout",
                variant: "info",
                text: "**🎮 Hands-On Experiment:** You are testing the three-error model. For each bug, first decide *when* it would surface (compile time, run time, or never, giving a wrong answer), then fix it.",
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
    deliverable: [
      {
        title: "Distance Calculator",
        description:
          "Lab 2: compute the Euclidean distance between (x1, y1) and (x2, y2) with Math.sqrt, printing Distance = 5.0 for (0, 0) and (3, 4), then compute x^y with Math.pow (2.0 raised to 10.0 = 1024.0). Document one syntax, runtime and logic error in comments.",
        filename: "DistanceCalculator.java",
        labReference: "Lab 2, Exercises 2.1–2.2",
      },
    ],
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
                id: "boxes-analogy",
                type: "text",
                text: "**Think of a variable as a labeled storage box.** The label is the variable's name, and the box's type decides how big it is and what fits inside:\n\n- `byte` is a **small pillbox**: 8 bits, holding only whole numbers from −128 to 127.\n- `int` is a **shoebox**: the everyday size for counting, roughly ±2.1 billion.\n- `long` is a **moving crate**: twice the space of an `int` for very large whole numbers.\n- `double` is a **high-precision container**: it holds decimals like `3.14159` to about 15 significant digits.\n- `boolean` is a **light switch**: only `true` or `false`.\n\nPick a box too small and the value will not fit (overflow). Pick one far too big and you waste memory. The table below gives the exact sizes.",
              },
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
                id: "primitive-memory-guide",
                type: "callout",
                variant: "info",
                text: "**🎮 Hands-On Experiment:** You are testing the storage-box model. Compare the pillbox (`byte`) with the high-precision container (`double`) and see how each extra bit roughly doubles what a box can hold.",
              },
              {
                id: "primitive-memory",
                type: "interactive",
                interactiveWidgetId: "primitive-memory",
                caption: "Compare how many bytes each primitive occupies and the range those bits can hold.",
              },
              {
                id: "stack-tracker-guide",
                type: "callout",
                variant: "info",
                text: "**🎮 Hands-On Experiment:** You are testing where the boxes live. Each local variable gets a numbered shelf in `main()`'s stack frame. Predict how many shelves each declaration takes before you step forward.",
              },
              {
                id: "stack-tracker",
                type: "interactive",
                interactiveWidgetId: "stack-tracker",
                caption: "Step through main() as each primitive takes its slot in the stack frame: an int or char fills one slot, a long takes two. The hex and binary literals are explained in the next lesson.",
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
                id: "type-casting-guide",
                type: "callout",
                variant: "info",
                text: "**🎮 Hands-On Experiment:** You are testing what happens when you pour one box into another. Pouring a small box into a big one (widening) is always safe, but forcing a big value into a small box (narrowing) spills data. Predict each result before you evaluate it.",
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
    deliverable: [
      {
        title: "Type Casting Demo",
        description:
          "Lab 3, Exercise 3.1: demonstrate explicit narrowing casts and print each result: (int) 7.99 truncates to 7 and (byte) 130 overflows to -126.",
        filename: "TypeCastingDemo.java",
        labReference: "Lab 3, Exercise 3.1",
      },
    ],
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
              {
                id: "buffer-model",
                type: "text",
                text: "**Mental model: the Scanner input buffer.** When you press Enter, the keyboard doesn't hand Java a number. It drops every character you typed, *including the Enter key itself* (`\\n`), into a queue called the **input buffer**. Each Scanner method takes characters from the front of that queue:\n\n- **Token methods** (`nextInt()`, `nextDouble()`, `next()`) skip leading whitespace, take one token, and **stop just before** the whitespace that follows it. They never take that trailing `\\n`.\n- **`nextLine()`** takes everything up to and including the next `\\n`, then returns it *without* the `\\n`.\n\nSo if `\\n` is the first thing left in the queue, `nextLine()` finds the end of a line straight away and returns `\"\"`.",
              },
              {
                id: "buffer-diagram",
                type: "code",
                language: "text",
                caption: "Tracing the buffer when the user types 21⏎ and then Ada Lovelace⏎",
                code: String.raw`User types: 21⏎

  buffer:  [ 2 | 1 | \n ]
             └─────┘
  int age = input.nextInt();      // takes "21", stops before \n
  buffer:  [ \n ]                 // the newline is still waiting

-- Without a fix ---------------------------------------------
  String name = input.nextLine(); // takes "" up to the \n
  buffer:  [ ]                    // name == "" and the prompt is skipped

-- With the fix ----------------------------------------------
  input.nextLine();               // throw away the leftover \n
  buffer:  [ ]
User types: Ada Lovelace⏎
  buffer:  [ A | d | a |   | L | ... | e | \n ]
  String name = input.nextLine(); // takes "Ada Lovelace" and the \n
  buffer:  [ ]                    // clean`,
              },
              {
                id: "buffer-tip",
                type: "callout",
                variant: "tip",
                text: "Rule of thumb: after any `nextInt()`, `nextDouble()` or `next()`, if the **next** read is `nextLine()`, add one bare `input.nextLine();` first to clear the leftover `\\n`.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "output_prediction",
                text: "The user types `7⏎` then `Sam⏎`. The program calls `int n = input.nextInt();` and then `String s = input.nextLine();` with no fix in between. What is the value of `s`, and is the user ever asked to type `Sam`?",
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
                id: "printf-builder-guide",
                type: "callout",
                variant: "tip",
                text: "🎮 **Hands-On Experiment:** In the builder below, choose conversion `f`, argument type `double` and the value `3.14159`. Drag the width slider to *none* and set precision to *none*, which gives plain `%f`. Then change it one step at a time:\n\n1. Set precision to `.2` → `%.2f`. How many digits stay after the point? Was the value rounded or cut off?\n2. Drag width to `10` → `%10.2f`. Count the spaces padded on the left.\n3. Turn on the `-` flag → `%-10.2f`. Which side do the spaces move to?\n4. Switch the conversion to `d` but keep the `double` argument. Read the exception Java throws.\n\nBefore each change, predict the output, then check it.",
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
    deliverable: [
      {
        title: "Circle Area Calculator",
        description:
          "Lab 4, Exercise 4.1: read a radius with Scanner and print the radius and area with printf(\"%10.2f\").",
        filename: "CircleAreaCalculator.java",
        labReference: "Lab 4, Exercise 4.1",
      },
      {
        title: "Receipt Printer",
        description:
          "Lab 4, Exercise 4.2: print an item receipt whose columns line up using \\t, \\n and %12s.",
        filename: "ReceiptPrinter.java",
        labReference: "Lab 4, Exercise 4.2",
      },
    ],
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
              {
                id: "relational-demo-intro",
                type: "text",
                text: "Every relational operator asks a yes/no question and answers with a `boolean`. You can store that answer in a variable, print it, or use it directly as an `if` condition. The program below tries all six operators on integers. It then shows why doubles need a **tolerance check** instead of `==`.",
              },
              {
                id: "relational-demo",
                type: "code",
                language: "java",
                caption: "RelationalDemo.java: integer comparisons and a floating-point tolerance check",
                code: `public class RelationalDemo {
    public static void main(String[] args) {
        int a = 7, b = 10;

        // Each comparison evaluates to true or false
        System.out.println("a <  b : " + (a < b));   // true
        System.out.println("a <= b : " + (a <= b));  // true
        System.out.println("a >  b : " + (a > b));   // false
        System.out.println("a >= b : " + (a >= b));  // false
        System.out.println("a == b : " + (a == b));  // false
        System.out.println("a != b : " + (a != b));  // true

        // A comparison result can be stored like any other value
        boolean isPassing = b >= 10;
        System.out.println("isPassing: " + isPassing); // true

        // Floating-point values are stored in binary, so 0.1 and 0.2
        // are tiny approximations. Their sum is not exactly 0.3.
        double x = 0.1 + 0.2;
        double y = 0.3;
        System.out.println("x       : " + x);        // 0.30000000000000004
        System.out.println("x == y  : " + (x == y)); // false (surprise!)

        // Correct approach: "close enough" within a tolerance (epsilon)
        final double EPSILON = 1e-9;
        boolean closeEnough = Math.abs(x - y) < EPSILON;
        System.out.println("|x - y| < 1e-9 : " + closeEnough); // true
    }
}`,
              },
              {
                id: "tolerance-formula",
                type: "formula",
                latex: String.raw`|a - b| < \varepsilon \quad\text{where}\quad \varepsilon = 10^{-9}`,
                caption: "Two doubles count as equal when their distance is smaller than a chosen tolerance ε",
              },
              {
                id: "tolerance-why",
                type: "callout",
                variant: "info",
                text: "`Math.abs` matters because you don't know which value is larger. Without it, `x - y` could be a large negative number, which is still `< 1e-9`, so very different values would pass the check.",
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
                id: "railroad-analogy",
                type: "text",
                text: "**Analogy: railroad track switches.** Think of your program as a train moving down a track. Each `if` is a **track switch** with a sign that asks a yes/no question:\n\n- If the answer is **true**, the switch sends the train onto that branch. The train runs that block and then **rejoins the main line**. It never comes back to try the other switches.\n- If the answer is **false**, the train passes by and reaches the next switch, the next `else if`.\n- The final `else` is the **catch-all siding**. Any train that every switch turned away ends up there.\n\nA train can only be on **one** track at a time, so exactly one branch of an `if-else` chain runs. That's also why **order matters**. With `score = 95`, the first switch (`score >= 90`) diverts the train to `'A'`. It never reaches the `>= 80` switch, even though 95 is also ≥ 80.",
              },
              {
                id: "railroad-diagram",
                type: "code",
                language: "text",
                caption: "The grade chain below, drawn as a rail line (score = 85)",
                code: `  train ══╦══════════╦══════════╦══════════╗
          ║ >= 90?   ║ >= 80?   ║ >= 70?   ║ else
          ║ no       ║ YES ◄──  ║          ║
          ▼          ▼          ▼          ▼
         'A'        'B'        'C'        'F'
                     ║
  ═══════════════════╩═══ rejoin main line → next statement`,
              },
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
                id: "decision-branch-guide",
                type: "callout",
                variant: "tip",
                text: "🎮 **Hands-On Experiment:** Each tab of the visualizer below tests one idea:\n\n1. **switch:** Pick `day` 1 and note the highlighted path. Then turn the **break statements** toggle off. Predict which outputs now run before you look, and trace where execution stops.\n2. **ChineseZodiac:** Enter your own birth year, then add or subtract 12. Does the sign change? Why not? Then click a remainder tile to jump to a year with that sign.\n3. **Dangling else:** Set `i = 3`, `j = 2`, `k = 5`. Decide which `if` the `else` belongs to *before* you read the result. Then compare it with the braced fix from the if-else lesson.",
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
          {
            id: "m5-u2-l3",
            title: "Case Study: ChineseZodiac",
            description: "Turn a birth year into one of twelve signs with year % 12 and a switch.",
            estimatedMinutes: 12,
            blocks: [
              {
                id: "cycle-idea",
                type: "text",
                text: "The Chinese zodiac repeats every **12 years**: Rat, Ox, Tiger and so on, then back to Rat. Whenever something repeats in a fixed cycle, the remainder operator `%` is the tool for the job. `year % 12` throws away every complete 12-year cycle and keeps only **where you are inside the current one**. That position is always a whole number from 0 to 11, so it can index exactly 12 signs.",
              },
              {
                id: "mod-formula",
                type: "formula",
                latex: String.raw`r = \text{year} \bmod 12, \qquad r \in \{0, 1, \dots, 11\}`,
                caption: "Any year collapses to one of exactly twelve remainders",
              },
              {
                id: "clock-analogy",
                type: "callout",
                variant: "info",
                text: "**Analogy: a 12-hour clock.** If it's 3 o'clock, then 12 hours later it's 3 o'clock again. Years work the same way: 1996, 2008 and 2020 differ by multiples of 12, so all three leave remainder 4, which is the **Rat**.",
              },
              {
                id: "mapping-table",
                type: "text",
                text: "| `year % 12` | Sign | Example year |\n|---|---|---|\n| 0 | Monkey | 2016 |\n| 1 | Rooster | 2017 |\n| 2 | Dog | 2018 |\n| 3 | Pig | 2019 |\n| 4 | Rat | 1996 |\n| 5 | Ox | 1997 |\n| 6 | Tiger | 1998 |\n| 7 | Rabbit | 1999 |\n| 8 | Dragon | 2000 |\n| 9 | Snake | 2001 |\n| 10 | Horse | 2002 |\n| 11 | Sheep | 2003 |",
              },
              {
                id: "why-monkey",
                type: "callout",
                variant: "tip",
                text: "Why does the table start at **Monkey** and not Rat? Remainder 0 belongs to years divisible by 12, such as 2016 and 2004, and those happen to be Monkey years. The order of the signs never changes. Only the sign that lines up with remainder 0 is set by the calendar.",
              },
              {
                id: "worked-example",
                type: "code",
                language: "text",
                caption: "Worked example: 1996",
                code: `1996 ÷ 12 = 166 full cycles, remainder ?
166 × 12  = 1992
1996 − 1992 = 4        → 1996 % 12 == 4
case 4                 → "Rat"`,
              },
              {
                id: "program",
                type: "code",
                language: "java",
                caption: "ChineseZodiac.java (Lab 5, Exercise 5.2)",
                code: `import java.util.Scanner;

public class ChineseZodiac {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        System.out.print("Enter a birth year: ");
        int year = input.nextInt();

        String sign;
        switch (year % 12) {          // always 0..11
            case 0:  sign = "Monkey";  break;
            case 1:  sign = "Rooster"; break;
            case 2:  sign = "Dog";     break;
            case 3:  sign = "Pig";     break;
            case 4:  sign = "Rat";     break;
            case 5:  sign = "Ox";      break;
            case 6:  sign = "Tiger";   break;
            case 7:  sign = "Rabbit";  break;
            case 8:  sign = "Dragon";  break;
            case 9:  sign = "Snake";   break;
            case 10: sign = "Horse";   break;
            default: sign = "Sheep";   // only 11 is left
        }
        System.out.println("Zodiac Sign: " + sign);
    }
}`,
              },
              {
                id: "why-switch",
                type: "text",
                text: "**Why `switch` fits here:** the remainder is one `int` with twelve exact, separate values. That's the case `switch` was made for. An `if-else` chain would work too, but it would need eleven `==` comparisons and be harder to scan. Every case ends in `break`. Without it, `case 4` would fall through and overwrite `\"Rat\"` with `\"Ox\"`, `\"Tiger\"` and so on down to `\"Sheep\"`.",
              },
              {
                id: "default-note",
                type: "callout",
                variant: "info",
                text: "Using `default` for remainder 11 does more than save a line. The compiler can see that `sign` is assigned on every path, so `System.out.println(sign)` compiles. If you write `case 11:` and leave out `default`, you get *\"variable sign might not have been initialized\"*.",
              },
              {
                id: "negative-pitfall",
                type: "callout",
                variant: "error_pitfall",
                text: "In Java, `%` keeps the sign of the left operand: `-5 % 12` is `-5`, not `7`. A negative year would match no case and land in `default`. Validate that `year > 0`, or normalise with `((year % 12) + 12) % 12`.",
              },
              {
                id: "quiz",
                type: "quiz_preview",
                quizType: "output_prediction",
                text: "What does ChineseZodiac print for the year 2024? Show the remainder you computed.",
              },
            ],
            keyTakeaways: [
              "year % 12 maps any year onto the cycle positions 0 to 11.",
              "Years 12 apart always share a sign, because they have the same remainder.",
              "switch on the remainder, with a break in every case, picks exactly one sign.",
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
        labReference: "Lab 5, Exercise 5.1",
      },
      {
        title: "Chinese Zodiac",
        description:
          "Lab 5, Exercise 5.2: read a birth year and print its animal sign with a switch on year % 12 (0 = Monkey … 11 = Sheep), e.g. 1996 → Zodiac Sign: Rat.",
        filename: "ChineseZodiac.java",
        labReference: "Lab 5, Exercise 5.2",
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
                id: "why-loops",
                type: "text",
                text: "A **loop** repeats a block of code while a condition stays `true`. Without loops, printing 1 to 100 would take 100 `println` lines. With a loop it takes three. Java has three loop forms. The key question that separates them is: **is the condition checked *before* or *after* the body runs?**",
              },
              {
                id: "while-analogy",
                type: "callout",
                variant: "info",
                text: "**`while` = a security guard at the door.** The guard checks your ID **before** you go in. If the check fails the first time, you never get inside, not even once. Each time you come back around, the guard checks again. A `while` loop is a **pre-test** loop, so its body can run **zero** times.",
              },
              {
                id: "do-while-analogy",
                type: "callout",
                variant: "info",
                text: "**`do-while` = an amusement-park ride.** You get on and ride **once** first. Only when the ride ends does the operator ask, \"Do you have a pass for another go?\" If yes, you ride again. If no, you get off. A `do-while` loop is a **post-test** loop, so its body always runs **at least once**. That makes it ideal for menus and input prompts, which must show at least once.",
              },
              {
                id: "for-analogy",
                type: "callout",
                variant: "info",
                text: "**`for` = running a set number of laps.** You know before you start that you'll run exactly *n* laps. The start, the stopping rule and the lap counter all fit on one line: `for (start; condition; update)`. Use it when the number of repetitions is **known in advance**.",
              },
              {
                id: "loop-compare",
                type: "text",
                text: "| Loop | Analogy | Condition checked | Minimum runs | Typical use |\n|---|---|---|---|---|\n| `while` | Security guard | Before the body | 0 | Repeat until something changes (unknown count) |\n| `do-while` | Amusement-park ride | After the body | 1 | Input validation, menus |\n| `for` | Counted laps | Before the body | 0 | Known number of repetitions |",
              },
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
                id: "loop-debugger-guide",
                type: "callout",
                variant: "tip",
                text: "🎮 **Hands-On Experiment:** Test the guard and the ride in the debugger below:\n\n1. On the **while** tab, set `start` to `6` and `limit` to `5`. Step through. How many times does the body run? The guard turned you away at the door.\n2. Keep those values and switch to the **do-while** tab. Step again. The body runs once before the check. That's the ride you got on before anyone asked for a pass.\n3. On the **for** tab, change `n` and use the formula below to predict the final `sum` before you step to the end.\n4. On the **Sentinel** tab, move `-1` to the front of the input. What prints now, and why is the average never computed?",
              },
              {
                id: "loop-debugger",
                type: "interactive",
                interactiveWidgetId: "loop-debugger",
                caption: "Step through each loop form with live variables and condition checks. The Sentinel tab runs SentinelValue.java from Lab 6, Exercise 6.2, which stops on -1.",
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
        labReference: "Lab 6, Exercise 6.1",
      },
      {
        title: "Sentinel Running Average",
        description:
          "Lab 6, Exercise 6.2: read integers until the sentinel -1, then print the sum and floating-point average; if -1 is entered first, print \"No numbers were entered.\"",
        filename: "SentinelValue.java",
        labReference: "Lab 6, Exercise 6.2",
      },
    ],
  },
];

/** Syllabus phases shown on the dashboard roadmap, in order. */
export const curriculumPhases: CurriculumPhase[] = [
  { id: "A", title: "Core Fundamentals", moduleIds: ["module-1", "module-2", "module-3"] },
  { id: "B", title: "Intermediate", moduleIds: ["module-4", "module-5", "module-6"] },
];
