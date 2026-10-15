import type { ModuleQuiz } from "@/types/quiz";

export const quizData: ModuleQuiz[] = [
  // -------------------------------------------------------------------------
  // Module 1 — Computing & Java system architecture
  // -------------------------------------------------------------------------
  {
    id: "module-1",
    moduleId: "module-1",
    title: "Computers, Programs & the Java Platform",
    description: "JDK tooling, the compile–execute lifecycle and formulas in code.",
    labReference: "Lab 1, Lab 2",
    passingScore: 60,
    questions: [
      {
        id: "q-m1-01",
        type: "multiple_choice",
        prompt: "Which component translates bytecode into native machine instructions while a program runs?",
        difficulty: "easy",
        lessonId: "m1-u1-l1",
        options: [
          { id: "a", text: "javac", feedback: "javac compiles source to bytecode before the program runs." },
          { id: "b", text: "The JVM" },
          { id: "c", text: "The JDK", feedback: "The JDK is the toolkit that bundles the compiler and the JRE." },
          { id: "d", text: "The operating system loader", feedback: "The OS cannot read bytecode; it runs the JVM." },
        ],
        correctOptionId: "b",
        explanation: {
          summary:
            "`javac` produces platform-neutral bytecode. At run time the **JVM** loads, verifies and executes that bytecode, interpreting or JIT-compiling it into native instructions.",
          takeaway: "JDK ⊃ JRE ⊃ JVM. Only the JVM executes bytecode.",
        },
      },
      {
        id: "q-m1-02",
        type: "multiple_choice",
        prompt: "After running `javac Welcome.java` without errors, what new file appears?",
        difficulty: "easy",
        lessonId: "m1-u1-l2",
        options: [
          { id: "a", text: "Welcome.exe", isCode: true, feedback: "Java does not compile to native executables." },
          { id: "b", text: "Welcome.class", isCode: true },
          { id: "c", text: "Welcome.jar", isCode: true, feedback: "JAR files are built by the jar tool, not javac." },
          { id: "d", text: "Welcome.obj", isCode: true, feedback: "Object files are a C/C++ concept." },
        ],
        correctOptionId: "b",
        explanation: {
          summary:
            "Compilation (stage 2 of the lifecycle) turns `Welcome.java` into `Welcome.class`, which holds bytecode. `java Welcome` then loads, verifies and executes it.",
          takeaway: "Edit → Compile → Load → Verify → Execute.",
        },
      },
      {
        id: "q-m1-03",
        type: "syntax_fix",
        prompt: "This code is saved as `Welcome.java` and fails to compile. Which change fixes it?",
        code: `public class welcome {
    public static void main(String[] args) {
        System.out.println("Welcome to CSC103!");
    }
}`,
        language: "java",
        errorLine: 1,
        difficulty: "medium",
        lessonId: "m1-u1-l2",
        options: [
          { id: "a", text: "public class Welcome {", isCode: true },
          {
            id: "b",
            text: "class welcome {",
            isCode: true,
            feedback: "This compiles, but produces welcome.class, so `java Welcome` fails to find the class.",
          },
          { id: "c", text: "public static class welcome {", isCode: true, feedback: "Top-level classes cannot be static." },
          { id: "d", text: "public Class Welcome {", isCode: true, feedback: "`Class` is not a keyword; `class` is lowercase." },
        ],
        correctOptionId: "a",
        fixedCode: `public class Welcome {
    public static void main(String[] args) {
        System.out.println("Welcome to CSC103!");
    }
}`,
        explanation: {
          summary:
            "A `public` class must live in a file with exactly the same name, and Java is case-sensitive. `welcome` ≠ `Welcome`.",
          errorKind: "syntax",
          diagnostic: "error: class welcome is public, should be declared in a file named welcome.java",
          takeaway: "Public class name = file name, letter for letter.",
        },
      },
      {
        id: "q-m1-04",
        type: "output_prediction",
        prompt: "A student wants to print 5 squared. What does this actually print?",
        code: `System.out.println(5 ^ 2);`,
        language: "java",
        difficulty: "medium",
        lessonId: "m1-u2-l1",
        options: [
          { id: "a", text: "25", isCode: true, feedback: "That is the intended result, but `^` is not exponentiation in Java." },
          { id: "b", text: "7", isCode: true },
          { id: "c", text: "10", isCode: true, feedback: "`^` does not multiply." },
          { id: "d", text: "Compilation error", feedback: "`^` is a valid operator on ints, so this compiles." },
        ],
        correctOptionId: "b",
        expectedOutput: "7",
        explanation: {
          summary:
            "In Java `^` is bitwise **XOR**: `101 ^ 010 = 111`, which is 7. The code compiles and runs but gives the wrong answer. Use `Math.pow(5, 2)` instead.",
          errorKind: "logic",
          takeaway: "Powers use Math.pow(x, y), never ^.",
        },
      },
      {
        id: "q-m1-05",
        type: "code_fill",
        prompt: "Complete the Euclidean distance formula $d = \\sqrt{dx^2 + dy^2}$.",
        code: `double dx = x2 - x1;
double dy = y2 - y1;
double distance = Math.{{b1}}(dx * dx + dy * dy);
System.out.println("Distance = " + distance);`,
        language: "java",
        difficulty: "easy",
        lessonId: "m1-u2-l1",
        blanks: [{ id: "b1", acceptedAnswers: ["sqrt"], caseSensitive: true, hint: "method" }],
        wordBank: ["sqrt", "pow", "abs", "root"],
        explanation: {
          summary:
            "`Math.sqrt(double)` returns the square root. For points (0, 0) and (3, 4) this prints `Distance = 5.0`.",
          takeaway: "Math.sqrt for roots, Math.pow for powers.",
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Module 2 — Java syntax fundamentals
  // -------------------------------------------------------------------------
  {
    id: "module-2",
    moduleId: "module-2",
    title: "Java Syntax Fundamentals",
    description: "Program structure, identifiers and the three kinds of programming error.",
    labReference: "Lab 1",
    passingScore: 60,
    questions: [
      {
        id: "q-m2-01",
        type: "syntax_fix",
        prompt: "This line will not compile. Which replacement fixes it?",
        code: `public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello World);
    }
}`,
        language: "java",
        errorLine: 3,
        difficulty: "easy",
        lessonId: "m2-u2-l1",
        options: [
          { id: "a", text: 'System.out.println("Hello World");', isCode: true },
          { id: "b", text: 'System.out.println("Hello World)";', isCode: true, feedback: "The quote now closes after the parenthesis, so `)` is part of the string and the call is never closed." },
          { id: "c", text: "System.out.println(Hello World);", isCode: true, feedback: "Without quotes, Hello and World are treated as identifiers." },
          { id: "d", text: "System.out.println('Hello World');", isCode: true, feedback: "Single quotes hold one char, not a String." },
        ],
        correctOptionId: "a",
        fixedCode: `public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`,
        explanation: {
          summary: "The string literal is never closed, so the compiler cannot find where the text ends.",
          errorKind: "syntax",
          diagnostic: "error: unclosed string literal",
          takeaway: "Every opening \" needs a closing \" on the same line.",
        },
      },
      {
        id: "q-m2-02",
        type: "multiple_choice",
        prompt: "What kind of error does this statement cause?",
        code: `System.out.println(1 / 0);`,
        language: "java",
        difficulty: "easy",
        lessonId: "m2-u2-l1",
        options: [
          { id: "a", text: "Syntax error", feedback: "The statement is well formed, so it compiles." },
          { id: "b", text: "Runtime error" },
          { id: "c", text: "Logic error", feedback: "A logic error runs to completion with a wrong result. This one crashes." },
          { id: "d", text: "No error; it prints Infinity", feedback: "Only floating-point division by zero gives Infinity." },
        ],
        correctOptionId: "b",
        explanation: {
          summary:
            "The code compiles, but integer division by zero throws an exception when the JVM executes it and the program terminates.",
          errorKind: "runtime",
          diagnostic: 'Exception in thread "main" java.lang.ArithmeticException: / by zero',
          takeaway: "It compiles but crashes while running, so it is a runtime error.",
        },
      },
      {
        id: "q-m2-03",
        type: "multiple_choice",
        prompt: "This program should print the average of 4 and 8. It compiles, runs and prints `8.0`. What kind of error is this?",
        code: `double a = 4, b = 8;
double average = a + b / 2;
System.out.println(average);`,
        language: "java",
        difficulty: "medium",
        lessonId: "m2-u2-l1",
        options: [
          { id: "a", text: "Syntax error", feedback: "It compiled, so the syntax is valid." },
          { id: "b", text: "Runtime error", feedback: "Nothing crashed; the program finished normally." },
          { id: "c", text: "Logic error" },
          { id: "d", text: "No error; 8.0 is correct", feedback: "(4 + 8) / 2 is 6.0." },
        ],
        correctOptionId: "c",
        explanation: {
          summary:
            "`/` binds tighter than `+`, so this computes `4 + (8 / 2) = 8.0`. The fix is `(a + b) / 2`, which gives 6.0. Nothing warns you about a logic error; only testing reveals it.",
          errorKind: "logic",
          takeaway: "It runs but gives the wrong answer, so it is a logic error. Check operator precedence.",
        },
      },
      {
        id: "q-m2-04",
        type: "multiple_choice",
        prompt: "Which of these is a valid Java identifier?",
        difficulty: "easy",
        lessonId: "m2-u1-l2",
        options: [
          { id: "a", text: "2ndPlace", isCode: true, feedback: "Identifiers cannot start with a digit." },
          { id: "b", text: "my-score", isCode: true, feedback: "`-` is the subtraction operator, not a name character." },
          { id: "c", text: "_total2", isCode: true },
          { id: "d", text: "class", isCode: true, feedback: "`class` is a reserved keyword." },
        ],
        correctOptionId: "c",
        explanation: {
          summary:
            "Identifiers may contain letters, digits, `_` and `$`, must not start with a digit, and cannot be reserved words.",
          errorKind: "syntax",
          takeaway: "Start with a letter, _ or $, and never use a keyword.",
        },
      },
      {
        id: "q-m2-05",
        type: "code_fill",
        prompt: "Fill in the return type of the `main` method.",
        code: `public class Welcome {
    public static {{b1}} main(String[] args) {
        System.out.println("Ready");
    }
}`,
        language: "java",
        difficulty: "easy",
        lessonId: "m2-u1-l1",
        blanks: [{ id: "b1", acceptedAnswers: ["void"], caseSensitive: true, hint: "return type" }],
        wordBank: ["void", "int", "static", "Void"],
        explanation: {
          summary:
            "`main` returns nothing, so its return type is `void`. Every method declaration needs a return type, and leaving it out is a compile error.",
          errorKind: "syntax",
          diagnostic: "error: invalid method declaration; return type required",
          takeaway: "Memorize the signature: public static void main(String[] args).",
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Module 3 — Primitive data types
  // -------------------------------------------------------------------------
  {
    id: "module-3",
    moduleId: "module-3",
    title: "Primitive Data Types",
    description: "Byte sizes, integer literals, widening and narrowing casts.",
    labReference: "Lab 3",
    passingScore: 60,
    questions: [
      {
        id: "q-m3-01",
        type: "output_prediction",
        prompt: "What does `TypeCastingDemo` print?",
        code: `double originalDouble = 7.99;
int truncatedInt = (int) originalDouble;

int bigInt = 130;
byte overflowByte = (byte) bigInt;

System.out.println("Truncated int: " + truncatedInt);
System.out.println("Overflow byte: " + overflowByte);`,
        language: "java",
        difficulty: "medium",
        lessonId: "m3-u2-l1",
        options: [
          { id: "a", text: "Truncated int: 8\nOverflow byte: 127", isCode: true, feedback: "Casting truncates instead of rounding, and it does not clamp to the max value." },
          { id: "b", text: "Truncated int: 7\nOverflow byte: -126", isCode: true },
          { id: "c", text: "Truncated int: 7\nOverflow byte: 130", isCode: true, feedback: "130 does not fit in a byte (−128 to 127)." },
          { id: "d", text: "Compilation error", feedback: "Explicit casts let narrowing conversions compile." },
        ],
        correctOptionId: "b",
        expectedOutput: "Truncated int: 7\nOverflow byte: -126",
        explanation: {
          summary:
            "`(int) 7.99` drops the fraction, giving 7. A `byte` keeps only the low 8 bits, so 130 wraps around: 130 − 256 = −126. Neither cast raises an error, so a careless cast becomes a silent logic error.",
          errorKind: "logic",
          takeaway: "Narrowing casts truncate and wrap. They never round or clamp.",
        },
      },
      {
        id: "q-m3-02",
        type: "multiple_choice",
        prompt: "Which pair of primitive types uses the same number of bytes?",
        difficulty: "easy",
        lessonId: "m3-u1-l1",
        options: [
          { id: "a", text: "int and long", isCode: true, feedback: "int is 4 bytes, long is 8." },
          { id: "b", text: "short and char", isCode: true },
          { id: "c", text: "float and double", isCode: true, feedback: "float is 4 bytes, double is 8." },
          { id: "d", text: "byte and short", isCode: true, feedback: "byte is 1 byte, short is 2." },
        ],
        correctOptionId: "b",
        explanation: {
          summary:
            "`short` and `char` are both 2 bytes. `short` is signed (−32,768 to 32,767), while `char` is an unsigned UTF-16 code unit (0 to 65,535). Sizes: byte 1, short 2, char 2, int 4, float 4, long 8, double 8.",
          takeaway: "Same size does not mean same range: signedness matters.",
        },
      },
      {
        id: "q-m3-03",
        type: "multiple_choice",
        prompt: "Which literal does **not** equal decimal 26?",
        difficulty: "hard",
        lessonId: "m3-u1-l2",
        options: [
          { id: "a", text: "0x1A", isCode: true, feedback: "1×16 + 10 = 26." },
          { id: "b", text: "0b11010", isCode: true, feedback: "16 + 8 + 2 = 26." },
          { id: "c", text: "032", isCode: true, feedback: "Octal: 3×8 + 2 = 26." },
          { id: "d", text: "026", isCode: true },
        ],
        correctOptionId: "d",
        explanation: {
          summary:
            "A leading `0` makes a literal **octal**, so `026` is 2×8 + 6 = 22. Padding a decimal number with a leading zero silently changes its value.",
          errorKind: "logic",
          takeaway: "0x is hex, 0b is binary, and a leading 0 is octal.",
        },
      },
      {
        id: "q-m3-04",
        type: "syntax_fix",
        prompt: "This declaration fails to compile. Which fix is correct?",
        code: `float price = 9.99;
System.out.println(price);`,
        language: "java",
        errorLine: 1,
        difficulty: "medium",
        lessonId: "m3-u2-l1",
        options: [
          { id: "a", text: "float price = 9.99f;", isCode: true },
          { id: "b", text: "float price = \"9.99\";", isCode: true, feedback: "A String cannot be assigned to a float." },
          { id: "c", text: "float price = (double) 9.99;", isCode: true, feedback: "The value is still a double, which is the problem." },
          { id: "d", text: "Float price = 9.99d;", isCode: true, feedback: "A double literal cannot be boxed into Float." },
        ],
        correctOptionId: "a",
        fixedCode: `float price = 9.99f;
System.out.println(price);`,
        explanation: {
          summary:
            "Floating-point literals are `double` (8 bytes) by default. Assigning one to a `float` (4 bytes) is a narrowing conversion, which Java rejects unless you add the `f` suffix or an explicit cast.",
          errorKind: "syntax",
          diagnostic: "error: incompatible types: possible lossy conversion from double to float",
          takeaway: "float literals need an f suffix.",
        },
      },
      {
        id: "q-m3-05",
        type: "output_prediction",
        prompt: "What does this print?",
        code: `double half = 7 / 2;
System.out.println(half);`,
        language: "java",
        difficulty: "medium",
        lessonId: "m3-u2-l1",
        options: [
          { id: "a", text: "3.5", isCode: true, feedback: "The division happens before the assignment, using ints." },
          { id: "b", text: "3", isCode: true, feedback: "The result is stored in a double, so it prints with a decimal point." },
          { id: "c", text: "3.0", isCode: true },
          { id: "d", text: "4.0", isCode: true, feedback: "Integer division truncates; it does not round." },
        ],
        correctOptionId: "c",
        expectedOutput: "3.0",
        explanation: {
          summary:
            "`7 / 2` is int ÷ int, which gives the int `3`. That int is then widened to `3.0` on assignment. Write `7.0 / 2` to get 3.5.",
          errorKind: "logic",
          takeaway: "Operand types decide the division, not the variable type.",
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Module 4 — Console I/O
  // -------------------------------------------------------------------------
  {
    id: "module-4",
    moduleId: "module-4",
    title: "Console I/O",
    description: "Scanner input, printf format specifiers and escape sequences.",
    labReference: "Lab 4",
    passingScore: 60,
    questions: [
      {
        id: "q-m4-01",
        type: "syntax_fix",
        prompt: "The compiler reports `cannot find symbol: class Scanner`. What line should be added at the top of the file?",
        code: `public class CircleAreaCalculator {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        double radius = input.nextDouble();
    }
}`,
        language: "java",
        errorLine: 3,
        difficulty: "easy",
        lessonId: "m4-u1-l1",
        options: [
          { id: "a", text: "import java.util.Scanner;", isCode: true },
          { id: "b", text: "import java.io.Scanner;", isCode: true, feedback: "Scanner lives in java.util, not java.io." },
          { id: "c", text: "include java.util.Scanner;", isCode: true, feedback: "`include` is C/C++; Java uses `import`." },
          { id: "d", text: "import Scanner;", isCode: true, feedback: "Imports need the fully qualified package name." },
        ],
        correctOptionId: "a",
        fixedCode: `import java.util.Scanner;

public class CircleAreaCalculator {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        double radius = input.nextDouble();
    }
}`,
        explanation: {
          summary: "Only `java.lang` is imported automatically. `Scanner` is in `java.util`, so it must be imported explicitly.",
          errorKind: "syntax",
          diagnostic: "error: cannot find symbol\n  symbol:   class Scanner",
          takeaway: "Scanner needs import java.util.Scanner;",
        },
      },
      {
        id: "q-m4-02",
        type: "output_prediction",
        prompt: "What does this print? (`|` marks the edges of the output.)",
        code: `double radius = 5.5;
System.out.printf("|%8.2f|", radius);`,
        language: "java",
        difficulty: "medium",
        lessonId: "m4-u2-l1",
        options: [
          { id: "a", text: "|5.50    |", isCode: true, feedback: "Numbers are right-aligned by default; use %-8.2f to left-align." },
          { id: "b", text: "|    5.50|", isCode: true },
          { id: "c", text: "|5.5|", isCode: true, feedback: ".2 forces exactly two decimals and 8 sets a minimum width." },
          { id: "d", text: "|00005.50|", isCode: true, feedback: "Zero padding needs the 0 flag: %08.2f." },
        ],
        correctOptionId: "b",
        expectedOutput: "|    5.50|",
        explanation: {
          summary:
            "`%8.2f` formats the number with 2 decimals (`5.50`, 4 characters) and then right-aligns it in a field 8 characters wide, so 4 spaces go in front.",
          takeaway: "%W.Pf means width W (right-aligned) with P decimal places.",
        },
      },
      {
        id: "q-m4-03",
        type: "output_prediction",
        prompt: "What does this print?",
        code: `System.out.println("She said \\"Hi\\"\\\\n");`,
        language: "java",
        difficulty: "hard",
        lessonId: "m4-u2-l2",
        options: [
          { id: "a", text: 'She said "Hi"', isCode: true, feedback: "`\\\\` is an escaped backslash, so `n` is printed literally." },
          { id: "b", text: 'She said \\"Hi\\"\\n', isCode: true, feedback: "Escape sequences are replaced, not printed as typed." },
          { id: "c", text: 'She said "Hi"\\n', isCode: true },
          { id: "d", text: "Compilation error", feedback: "Every quote inside the string is escaped, so it compiles." },
        ],
        correctOptionId: "c",
        expectedOutput: 'She said "Hi"\\n',
        explanation: {
          summary:
            "`\\\"` prints a double quote and `\\\\` prints one backslash. That backslash is followed by a plain `n`, so the output ends with the two characters `\\n` rather than a newline.",
          takeaway: "\\\" prints a quote, \\\\ prints a backslash, \\n prints a newline and \\t prints a tab.",
        },
      },
      {
        id: "q-m4-04",
        type: "multiple_choice",
        prompt: "What happens when this code runs?",
        code: `double total = 9.5;
System.out.printf("Total: %d%n", total);`,
        language: "java",
        difficulty: "medium",
        lessonId: "m4-u2-l1",
        options: [
          { id: "a", text: "It prints Total: 9", feedback: "printf does not convert types; it validates them." },
          { id: "b", text: "It prints Total: 9.5", feedback: "%d only accepts integer types." },
          { id: "c", text: "It fails to compile", feedback: "The compiler does not check format strings against arguments." },
          { id: "d", text: "It throws an exception at run time" },
        ],
        correctOptionId: "d",
        explanation: {
          summary:
            "The format string is only checked when it is used. `%d` expects an integer, so passing a `double` throws as soon as `printf` runs.",
          errorKind: "runtime",
          diagnostic: "java.util.IllegalFormatConversionException: d != java.lang.Double",
          takeaway: "Use %d for int/long, %f for float/double and %s for String.",
        },
      },
      {
        id: "q-m4-05",
        type: "code_fill",
        prompt: "Fill in the format specifier so the area prints with exactly two decimal places, e.g. `Area: 95.03`.",
        code: `double area = Math.PI * radius * radius;
System.out.printf("Area: %{{b1}}%n", area);`,
        language: "java",
        difficulty: "easy",
        lessonId: "m4-u2-l1",
        blanks: [{ id: "b1", acceptedAnswers: [".2f"], caseSensitive: true, hint: "specifier" }],
        wordBank: [".2f", "2f", ".2d", "f.2"],
        explanation: {
          summary: "`%.2f` formats a floating-point value rounded to two decimals. `%.2d` is invalid because integers have no precision.",
          takeaway: "Precision goes after a dot, before the conversion letter.",
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Module 5 — Selection statements
  // -------------------------------------------------------------------------
  {
    id: "module-5",
    moduleId: "module-5",
    title: "Selection Statements",
    description: "Relational operators, if-else chains, the dangling else and switch.",
    labReference: "Lab 5",
    passingScore: 60,
    questions: [
      {
        id: "q-m5-01",
        type: "output_prediction",
        prompt: "What does this print? Read it the way the compiler does, not by the indentation.",
        code: `int x = 5;
if (x > 10)
    if (x > 20)
        System.out.println("A");
else
    System.out.println("B");
System.out.println("done");`,
        language: "java",
        difficulty: "hard",
        lessonId: "m5-u1-l2",
        options: [
          { id: "a", text: "B\ndone", isCode: true, feedback: "That is what the indentation suggests, but `else` pairs with the inner `if`." },
          { id: "b", text: "done", isCode: true },
          { id: "c", text: "A\ndone", isCode: true, feedback: "x is 5, so neither condition is true." },
          { id: "d", text: "Compilation error", feedback: "A dangling else is legal Java." },
        ],
        correctOptionId: "b",
        expectedOutput: "done",
        explanation: {
          summary:
            "An `else` always pairs with the **nearest** unmatched `if`, which here is `if (x > 20)`. The outer `if (x > 10)` is false, so its whole body, including that `else`, is skipped.",
          errorKind: "logic",
          takeaway: "Always use braces in nested ifs. Indentation means nothing to the compiler.",
        },
      },
      {
        id: "q-m5-02",
        type: "syntax_fix",
        prompt: "This condition does not compile. Which line fixes it?",
        code: `int score = 90;
if (score = 90) {
    System.out.println("Perfect");
}`,
        language: "java",
        errorLine: 2,
        difficulty: "easy",
        lessonId: "m5-u1-l1",
        options: [
          { id: "a", text: "if (score == 90) {", isCode: true },
          { id: "b", text: "if (score === 90) {", isCode: true, feedback: "`===` is JavaScript; Java has no such operator." },
          { id: "c", text: "if (score.equals(90)) {", isCode: true, feedback: "Primitives have no methods." },
          { id: "d", text: "if score == 90 {", isCode: true, feedback: "Conditions must be wrapped in parentheses." },
        ],
        correctOptionId: "a",
        fixedCode: `int score = 90;
if (score == 90) {
    System.out.println("Perfect");
}`,
        explanation: {
          summary: "`=` assigns and `==` compares. `score = 90` evaluates to an `int`, but `if` requires a `boolean`.",
          errorKind: "syntax",
          diagnostic: "error: incompatible types: int cannot be converted to boolean",
          takeaway: "Use == in conditions; = is assignment.",
        },
      },
      {
        id: "q-m5-03",
        type: "output_prediction",
        prompt: "The zodiac lookup for 1996 (`1996 % 12 == 4`) prints more than expected. What is the output?",
        code: `switch (year % 12) {
    case 4:
        System.out.print("Rat ");
    case 5:
        System.out.print("Ox ");
        break;
    default:
        System.out.print("Unknown");
}`,
        language: "java",
        difficulty: "medium",
        lessonId: "m5-u2-l1",
        options: [
          { id: "a", text: "Rat", isCode: true, feedback: "Without `break`, execution continues into the next case." },
          { id: "b", text: "Rat Ox", isCode: true },
          { id: "c", text: "Rat Ox Unknown", isCode: true, feedback: "The `break` after Ox stops execution before `default`." },
          { id: "d", text: "Unknown", isCode: true, feedback: "1996 % 12 is 4, which matches case 4." },
        ],
        correctOptionId: "b",
        expectedOutput: "Rat Ox ",
        explanation: {
          summary:
            "Execution jumps to `case 4` and then **falls through** into `case 5` because no `break` stops it. The `break` after Ox ends the switch.",
          errorKind: "logic",
          takeaway: "End every case with break unless you mean to fall through.",
        },
      },
      {
        id: "q-m5-04",
        type: "multiple_choice",
        prompt: "This prints `false`. What is the most reliable way to compare the two values?",
        code: `double a = 0.1 + 0.2;
System.out.println(a == 0.3);`,
        language: "java",
        difficulty: "hard",
        lessonId: "m5-u1-l1",
        options: [
          { id: "a", text: "a.equals(0.3)", isCode: true, feedback: "Primitives have no methods." },
          { id: "b", text: "(int) a == (int) 0.3", isCode: true, feedback: "Both truncate to 0, so 0.1 would also \"equal\" 0.3." },
          { id: "c", text: "Math.abs(a - 0.3) < 1e-9", isCode: true },
          { id: "d", text: "a >= 0.3", isCode: true, feedback: "a is actually 0.30000000000000004, so this passes for the wrong reason." },
        ],
        correctOptionId: "c",
        explanation: {
          summary:
            "0.1 and 0.2 have no exact binary representation, so their sum is `0.30000000000000004`. Testing doubles with `==` is a logic error. Compare them within a small tolerance (epsilon) instead.",
          errorKind: "logic",
          takeaway: "Never use == on doubles. Check that |a − b| is below an epsilon.",
        },
      },
      {
        id: "q-m5-05",
        type: "code_fill",
        prompt: "Complete `GrossPayCalculator`: hours above 40 are paid at time-and-a-half. With 45 hours at $20/hr it should print `Gross Pay: $950.00`.",
        code: `if (hours > {{b1}}) {
    double regularPay = 40 * rate;
    double overtimePay = (hours - 40) * (rate * {{b2}});
    grossPay = regularPay + overtimePay;
} else {
    grossPay = hours * rate;
}`,
        language: "java",
        difficulty: "medium",
        lessonId: "m5-u2-l2",
        blanks: [
          { id: "b1", acceptedAnswers: ["40"], hint: "threshold" },
          { id: "b2", acceptedAnswers: ["1.5", "1.50"], hint: "multiplier" },
        ],
        wordBank: ["40", "45", "1.5", "2", "0.5"],
        explanation: {
          summary:
            "Regular pay covers the first 40 hours: 40 × 20 = 800. The other 5 hours pay 20 × 1.5 = 30 each, which is 150. Total: $950.00. Using `>=` or a different threshold would mispay workers at exactly 40 hours.",
          errorKind: "logic",
          takeaway: "Test the boundary values: 39, 40 and 41 hours.",
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Module 6 — Logic and loops
  // -------------------------------------------------------------------------
  {
    id: "module-6",
    moduleId: "module-6",
    title: "Logic and Loops",
    description: "Boolean operators, short-circuiting, while/do-while/for and sentinel loops.",
    labReference: "Lab 6",
    passingScore: 60,
    questions: [
      {
        id: "q-m6-01",
        type: "output_prediction",
        prompt: "What does this print?",
        code: `boolean a = true, b = false;
System.out.println(a ^ b);
System.out.println(!a || b);`,
        language: "java",
        difficulty: "easy",
        lessonId: "m6-u1-l1",
        options: [
          { id: "a", text: "true\nfalse", isCode: true },
          { id: "b", text: "false\ntrue", isCode: true, feedback: "^ is true when the operands differ." },
          { id: "c", text: "true\ntrue", isCode: true, feedback: "!a is false and b is false, so || gives false." },
          { id: "d", text: "1\n0", isCode: true, feedback: "On booleans, ^ gives a boolean, not a number." },
        ],
        correctOptionId: "a",
        expectedOutput: "true\nfalse",
        explanation: {
          summary: "`true ^ false` is `true` because exclusive-or is true when the operands differ. `!true || false` is `false || false`, which is `false`.",
          takeaway: "^ is true when the operands differ, && when both are true, || when either is true.",
        },
      },
      {
        id: "q-m6-02",
        type: "multiple_choice",
        prompt: "What happens when this runs?",
        code: `int count = 0;
if (count != 0 && 10 / count > 1) {
    System.out.println("Ratio is high");
}
System.out.println("Checked");`,
        language: "java",
        difficulty: "medium",
        lessonId: "m6-u1-l1",
        options: [
          { id: "a", text: "It throws ArithmeticException", feedback: "The division is never evaluated." },
          { id: "b", text: "It prints Ratio is high, then Checked", feedback: "The first condition is already false." },
          { id: "c", text: "It prints only Checked" },
          { id: "d", text: "It fails to compile", feedback: "The expression is valid." },
        ],
        correctOptionId: "c",
        explanation: {
          summary:
            "`&&` short-circuits: once `count != 0` is false, the right side is skipped, so `10 / count` never runs. Swapping the operands, or using the non-short-circuit `&`, would throw `ArithmeticException: / by zero`.",
          errorKind: "runtime",
          takeaway: "Put the guard first: check before you divide.",
        },
      },
      {
        id: "q-m6-03",
        type: "code_fill",
        prompt: "In `GuessNumber`, the secret must be a random integer from 0 to 100 **inclusive**. Fill in the multiplier.",
        code: `int secretNumber = (int) (Math.random() * {{b1}});`,
        language: "java",
        difficulty: "medium",
        lessonId: "m6-u2-l3",
        blanks: [{ id: "b1", acceptedAnswers: ["101"], hint: "number" }],
        wordBank: ["100", "101", "99", "100.5"],
        explanation: {
          summary:
            "`Math.random()` returns a value in [0.0, 1.0). Multiplying by 101 gives [0.0, 101.0), and the cast truncates it to an int from 0 to 100. Using 100 would make 100 impossible, an off-by-one logic error.",
          errorKind: "logic",
          takeaway: "(int)(Math.random() * n) yields 0 to n − 1.",
        },
      },
      {
        id: "q-m6-04",
        type: "output_prediction",
        prompt: "What does this print?",
        code: `int n = 10;
do {
    System.out.print(n + " ");
    n++;
} while (n < 5);`,
        language: "java",
        difficulty: "medium",
        lessonId: "m6-u2-l1",
        options: [
          { id: "a", text: "(nothing)", feedback: "That would be true of a while loop, which tests the condition first." },
          { id: "b", text: "10", isCode: true },
          { id: "c", text: "10 11 12 13 14", isCode: true, feedback: "n starts above 5, so the condition is false after the first pass." },
          { id: "d", text: "It loops forever", feedback: "The condition is checked after the first pass and is false." },
        ],
        correctOptionId: "b",
        expectedOutput: "10 ",
        explanation: {
          summary: "A `do-while` runs its body **once** before it checks the condition. It prints 10, then `11 < 5` is false, so the loop exits.",
          takeaway: "do-while runs at least once; while and for may run zero times.",
        },
      },
      {
        id: "q-m6-05",
        type: "syntax_fix",
        prompt: "This sentinel loop compiles, but if the first number isn't -1 it never ends. Which line, added at the end of the loop body, fixes it?",
        code: `int value = input.nextInt();
int sum = 0;
while (value != -1) {
    sum += value;
}
System.out.println("Sum: " + sum);`,
        language: "java",
        errorLine: 4,
        difficulty: "medium",
        lessonId: "m6-u2-l2",
        options: [
          { id: "a", text: "value = input.nextInt();", isCode: true },
          { id: "b", text: "int value = input.nextInt();", isCode: true, feedback: "Redeclaring `value` in the same scope is a compile error." },
          { id: "c", text: "value--;", isCode: true, feedback: "That ignores user input; a sentinel loop must stop only when the user types -1." },
          { id: "d", text: "break;", isCode: true, feedback: "That exits after one number, so it is no longer a sentinel loop." },
        ],
        correctOptionId: "a",
        fixedCode: `int value = input.nextInt();
int sum = 0;
while (value != -1) {
    sum += value;
    value = input.nextInt();
}
System.out.println("Sum: " + sum);`,
        explanation: {
          summary:
            "The loop condition depends on `value`, but the body never changes it, so the loop runs forever. A sentinel loop must read the next input at the end of every pass.",
          errorKind: "logic",
          takeaway: "Every loop body must move its condition toward false.",
        },
      },
    ],
  },
];
