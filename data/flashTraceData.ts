import type { FlashTraceQuestion } from "@/types/flash-trace";

// Flash-Trace question bank: short CSC103 snippets answered under the 2-minute timer.
// Options are shuffled per session, so `correctAnswer` only has to match this file's order.
// Multi-line console output is written with " / " between lines.

export const flashTraceData: FlashTraceQuestion[] = [
  // -------------------------------------------------------------------------
  // Module 1 · Computers, Programs & the Java Platform
  // -------------------------------------------------------------------------
  {
    id: "ft-m1-01",
    title: "Besides Hello.java, which file does ls now list?",
    codeSnippet: `$ javac Hello.java
$ ls`,
    options: ["Hello.exe", "Hello.class", "Hello.jar", "Hello.obj"],
    correctAnswer: 1,
    explanation: "javac compiles source into platform-independent bytecode stored in a .class file named after the class.",
    topicTag: "module-1",
    difficulty: "easy",
  },
  {
    id: "ft-m1-02",
    title: "What runs the bytecode in the last step?",
    codeSnippet: `Hello.java  --javac-->  Hello.class
Hello.class --  ?  -->  console output`,
    options: ["The javac compiler", "The JVM", "The OS linker", "The IDE"],
    correctAnswer: 1,
    explanation: "The JVM (launched by the java command) loads the .class file and executes its bytecode.",
    topicTag: "module-1",
    difficulty: "easy",
  },
  {
    id: "ft-m1-03",
    title: "What happens when you compile this?",
    codeSnippet: `// saved as Main.java
public class Greeter {
    public static void main(String[] args) { }
}`,
    options: ["Compiles fine", "Compile error", "Runtime error", "Runs, prints nothing"],
    correctAnswer: 1,
    explanation: "A public class must live in a file with the same name, so javac rejects Greeter inside Main.java.",
    topicTag: "module-1",
    difficulty: "medium",
  },
  {
    id: "ft-m1-04",
    title: "What does the second command do?",
    codeSnippet: `$ javac Hello.java
$ java Hello.class`,
    options: ["Runs Hello", "Could not find or load main class", "Recompiles Hello", "Prints the bytecode"],
    correctAnswer: 1,
    explanation: "The java launcher takes a class name, not a file name, so it looks for a class literally called Hello.class.",
    topicTag: "module-1",
    difficulty: "medium",
  },

  // -------------------------------------------------------------------------
  // Module 2 · Java Syntax Fundamentals
  // -------------------------------------------------------------------------
  {
    id: "ft-m2-01",
    title: "What prints?",
    codeSnippet: `System.out.println("Sum: " + 2 + 3);`,
    options: ["Sum: 5", "Sum: 23", "Sum: 2 3", "Compile error"],
    correctAnswer: 1,
    explanation: "+ runs left to right: \"Sum: \" + 2 is already a String, so 3 is appended as text.",
    topicTag: "module-2",
    difficulty: "medium",
  },
  {
    id: "ft-m2-02",
    title: "What prints?",
    codeSnippet: `System.out.println(2 + 3 + " apples");`,
    options: ["23 apples", "5 apples", "2 + 3 apples", "Compile error"],
    correctAnswer: 1,
    explanation: "The two ints are added first (5) before the result meets a String and is concatenated.",
    topicTag: "module-2",
    difficulty: "easy",
  },
  {
    id: "ft-m2-03",
    title: "What prints?",
    codeSnippet: `System.out.println("x" + 1 + 2 * 3);`,
    options: ["x9", "x16", "x123", "x7"],
    correctAnswer: 1,
    explanation: "* binds tighter than +, so 2 * 3 becomes 6 first, then \"x\" + 1 + 6 concatenates to x16.",
    topicTag: "module-2",
    difficulty: "hard",
  },
  {
    id: "ft-m2-04",
    title: "What kind of error is this?",
    codeSnippet: `int a = 10;
int b = 0;
System.out.println(a / b);`,
    options: ["Prints 0", "Prints Infinity", "ArithmeticException", "Compile error"],
    correctAnswer: 2,
    explanation: "Integer division by zero compiles but throws ArithmeticException at run time.",
    topicTag: "module-2",
    difficulty: "medium",
  },
  {
    id: "ft-m2-05",
    title: "What happens?",
    codeSnippet: `int x = 5
System.out.println(x);`,
    options: ["Prints 5", "Compile error", "Runtime error", "Logic error"],
    correctAnswer: 1,
    explanation: "The missing semicolon is a syntax error, so javac reports ';' expected and nothing runs.",
    topicTag: "module-2",
    difficulty: "easy",
  },
  {
    id: "ft-m2-06",
    title: "Which declaration compiles?",
    codeSnippet: `int 2ndPlace = 2;   // A
int second-place = 2; // B
int _second = 2;    // C
int class = 2;      // D`,
    options: ["A", "B", "C", "D"],
    correctAnswer: 2,
    explanation: "Identifiers cannot start with a digit, contain '-', or be keywords; _second is legal.",
    topicTag: "module-2",
    difficulty: "medium",
  },

  // -------------------------------------------------------------------------
  // Module 3 · Primitive Data Types
  // -------------------------------------------------------------------------
  {
    id: "ft-m3-01",
    title: "What prints?",
    codeSnippet: `int a = 7;
int b = 2;
System.out.println(a / b);`,
    options: ["3.5", "3", "4", "3.0"],
    correctAnswer: 1,
    explanation: "Both operands are int, so Java performs integer division and discards the fraction.",
    topicTag: "module-3",
    difficulty: "easy",
  },
  {
    id: "ft-m3-02",
    title: "What prints?",
    codeSnippet: `int total = 17;
System.out.println(total % 5);`,
    options: ["3", "2", "3.4", "5"],
    correctAnswer: 1,
    explanation: "17 = 3 × 5 + 2, and % yields that remainder, 2.",
    topicTag: "module-3",
    difficulty: "easy",
  },
  {
    id: "ft-m3-03",
    title: "What prints?",
    codeSnippet: `System.out.println(-7 % 3);`,
    options: ["2", "-1", "1", "-2"],
    correctAnswer: 1,
    explanation: "In Java the remainder takes the sign of the dividend, so -7 % 3 is -1, not 2.",
    topicTag: "module-3",
    difficulty: "hard",
  },
  {
    id: "ft-m3-04",
    title: "What prints?",
    codeSnippet: `double price = 9.99;
int whole = (int) price;
System.out.println(whole);`,
    options: ["10", "9", "9.99", "9.0"],
    correctAnswer: 1,
    explanation: "Casting a double to int truncates toward zero; it never rounds.",
    topicTag: "module-3",
    difficulty: "easy",
  },
  {
    id: "ft-m3-05",
    title: "What prints?",
    codeSnippet: `double r = (double) 7 / 2;
System.out.println(r);`,
    options: ["3.0", "3.5", "3", "4.0"],
    correctAnswer: 1,
    explanation: "The cast applies to 7 before dividing, so double / int promotes to 3.5.",
    topicTag: "module-3",
    difficulty: "medium",
  },
  {
    id: "ft-m3-06",
    title: "What prints?",
    codeSnippet: `double r = (double) (7 / 2);
System.out.println(r);`,
    options: ["3.5", "3.0", "3", "4.0"],
    correctAnswer: 1,
    explanation: "The parentheses force integer division (3) first; casting 3 afterwards only gives 3.0.",
    topicTag: "module-3",
    difficulty: "medium",
  },
  {
    id: "ft-m3-07",
    title: "What prints?",
    codeSnippet: `char c = 'A';
System.out.println(c + 1);`,
    options: ["B", "66", "A1", "65"],
    correctAnswer: 1,
    explanation: "char + int promotes to int, so 'A' (65) + 1 prints the number 66.",
    topicTag: "module-3",
    difficulty: "medium",
  },
  {
    id: "ft-m3-08",
    title: "What prints?",
    codeSnippet: `char c = 'A';
c += 2;
System.out.println(c);`,
    options: ["67", "C", "Compile error", "A2"],
    correctAnswer: 1,
    explanation: "Compound assignment casts back to char implicitly, so c becomes 'C'.",
    topicTag: "module-3",
    difficulty: "medium",
  },
  {
    id: "ft-m3-09",
    title: "What prints?",
    codeSnippet: `int big = Integer.MAX_VALUE;
big = big + 1;
System.out.println(big);`,
    options: ["2147483648", "-2147483648", "ArithmeticException", "Compile error"],
    correctAnswer: 1,
    explanation: "int arithmetic overflows silently and wraps around to Integer.MIN_VALUE.",
    topicTag: "module-3",
    difficulty: "hard",
  },
  {
    id: "ft-m3-10",
    title: "What happens?",
    codeSnippet: `int count = 3.7;
System.out.println(count);`,
    options: ["Prints 3", "Prints 4", "Compile error", "Prints 3.7"],
    correctAnswer: 2,
    explanation: "Narrowing double to int needs an explicit cast; javac reports possible lossy conversion.",
    topicTag: "module-3",
    difficulty: "medium",
  },
  {
    id: "ft-m3-11",
    title: "What prints?",
    codeSnippet: `int x = 5;
int y = x++;
System.out.println(x + " " + y);`,
    options: ["5 6", "6 5", "6 6", "5 5"],
    correctAnswer: 1,
    explanation: "Post-increment hands back the old value (5) to y, then bumps x to 6.",
    topicTag: "module-3",
    difficulty: "easy",
  },
  {
    id: "ft-m3-12",
    title: "What prints?",
    codeSnippet: `int x = 5;
int y = ++x + x++;
System.out.println(x + " " + y);`,
    options: ["7 12", "7 11", "6 12", "7 13"],
    correctAnswer: 0,
    explanation: "++x makes x 6 and yields 6; x++ yields 6 and makes x 7, so y = 12.",
    topicTag: "module-3",
    difficulty: "hard",
  },
  {
    id: "ft-m3-13",
    title: "What prints?",
    codeSnippet: `double d = 10 / 0.0;
System.out.println(d);`,
    options: ["0.0", "Infinity", "ArithmeticException", "NaN"],
    correctAnswer: 1,
    explanation: "Floating-point division by zero does not throw; a positive value over 0.0 is Infinity.",
    topicTag: "module-3",
    difficulty: "hard",
  },

  // -------------------------------------------------------------------------
  // Module 4 · Console I/O
  // -------------------------------------------------------------------------
  {
    id: "ft-m4-01",
    title: "What prints?",
    codeSnippet: `double pi = 3.14159;
System.out.printf("%.2f", pi);`,
    options: ["3.14159", "3.14", "3.1", "3.15"],
    correctAnswer: 1,
    explanation: "%.2f rounds to two decimal places, and 3.14159 rounds down to 3.14.",
    topicTag: "module-4",
    difficulty: "easy",
  },
  {
    id: "ft-m4-02",
    title: "What prints?",
    codeSnippet: `System.out.printf("[%5d]", 42);`,
    options: ["[42   ]", "[   42]", "[00042]", "[42]"],
    correctAnswer: 1,
    explanation: "A width of 5 right-aligns the number, padding it with three leading spaces.",
    topicTag: "module-4",
    difficulty: "medium",
  },
  {
    id: "ft-m4-03",
    title: "What prints? ( / = new line)",
    codeSnippet: `System.out.print("A");
System.out.println("B");
System.out.print("C");`,
    options: ["ABC", "AB / C", "A / B / C", "A / BC"],
    correctAnswer: 1,
    explanation: "Only println ends the line, so A and B share line one and C starts line two.",
    topicTag: "module-4",
    difficulty: "medium",
  },
  {
    id: "ft-m4-04",
    title: "What prints?",
    codeSnippet: `System.out.println("C:\\\\new\\\\tab");`,
    options: ["C:\\new\\tab", "C:\\\\new\\\\tab", "C: / ew  ab", "Compile error"],
    correctAnswer: 0,
    explanation: "Each \\\\ escape prints a single backslash, so no newline or tab is produced.",
    topicTag: "module-4",
    difficulty: "hard",
  },
  {
    id: "ft-m4-05",
    title: "What prints?",
    codeSnippet: `int rate = 50;
System.out.printf("%d%%%n", rate);`,
    options: ["50%%", "50%", "50", "Runtime error"],
    correctAnswer: 1,
    explanation: "%% is the escape for a literal percent sign and %n ends the line.",
    topicTag: "module-4",
    difficulty: "medium",
  },
  {
    id: "ft-m4-06",
    title: "What happens?",
    codeSnippet: `System.out.printf("%d", 3.5);`,
    options: ["Prints 3", "Prints 4", "Prints 3.5", "Runtime exception"],
    correctAnswer: 3,
    explanation: "%d only accepts integers, so a double throws IllegalFormatConversionException at run time.",
    topicTag: "module-4",
    difficulty: "hard",
  },
  {
    id: "ft-m4-07",
    title: "What prints? ( / = new line)",
    codeSnippet: `System.out.println("Hi\\nThere");`,
    options: ["Hi\\nThere", "Hi / There", "HiThere", "Hi There"],
    correctAnswer: 1,
    explanation: "\\n is the newline escape, so There is printed on the next line.",
    topicTag: "module-4",
    difficulty: "easy",
  },

  // -------------------------------------------------------------------------
  // Module 5 · Selection Statements
  // -------------------------------------------------------------------------
  {
    id: "ft-m5-01",
    title: "What prints?",
    codeSnippet: `int score = 75;
if (score >= 90) System.out.println("A");
else if (score >= 70) System.out.println("B");
else System.out.println("C");`,
    options: ["A", "B", "C", "B then C"],
    correctAnswer: 1,
    explanation: "The first true condition (score >= 70) wins and the rest of the chain is skipped.",
    topicTag: "module-5",
    difficulty: "easy",
  },
  {
    id: "ft-m5-02",
    title: "What prints?",
    codeSnippet: `int day = 2;
switch (day) {
    case 1: System.out.print("A");
    case 2: System.out.print("B");
    case 3: System.out.print("C"); break;
    default: System.out.print("D");
}`,
    options: ["B", "BC", "BCD", "ABC"],
    correctAnswer: 1,
    explanation: "Without a break, case 2 falls through into case 3, which then breaks before default.",
    topicTag: "module-5",
    difficulty: "medium",
  },
  {
    id: "ft-m5-03",
    title: "What prints?",
    codeSnippet: `int x = 5;
if (x > 10)
    if (x > 20) System.out.println("huge");
else System.out.println("small");
System.out.println("end");`,
    options: ["small then end", "end", "huge then end", "Compile error"],
    correctAnswer: 1,
    explanation: "The else binds to the nearest if (x > 20), so when x > 10 is false nothing but end prints.",
    topicTag: "module-5",
    difficulty: "hard",
  },
  {
    id: "ft-m5-04",
    title: "What happens?",
    codeSnippet: `int x = 3;
if (x = 5) {
    System.out.println("five");
}`,
    options: ["Prints five", "Prints nothing", "Compile error", "Runtime error"],
    correctAnswer: 2,
    explanation: "x = 5 is an int assignment, and an if condition must be boolean, so it does not compile.",
    topicTag: "module-5",
    difficulty: "medium",
  },
  {
    id: "ft-m5-05",
    title: "What prints?",
    codeSnippet: `int a = 8, b = 3;
int max = (a > b) ? a : b;
System.out.println(max - b);`,
    options: ["8", "5", "3", "-5"],
    correctAnswer: 1,
    explanation: "The ternary picks a (8) because a > b, and 8 - 3 is 5.",
    topicTag: "module-5",
    difficulty: "easy",
  },
  {
    id: "ft-m5-06",
    title: "What prints?",
    codeSnippet: `int n = 0;
if (n > 0) System.out.print("pos ");
System.out.print("zero ");
System.out.print("done");`,
    options: ["zero done", "pos zero done", "done", "pos done"],
    correctAnswer: 0,
    explanation: "Without braces the if only guards its first statement; the next two always run.",
    topicTag: "module-5",
    difficulty: "medium",
  },

  // -------------------------------------------------------------------------
  // Module 6 · Logic and Loops
  // -------------------------------------------------------------------------
  {
    id: "ft-m6-01",
    title: "What prints?",
    codeSnippet: `int a = 0;
if (a != 0 && 10 / a > 1) {
    System.out.println("big");
}
System.out.println("done");`,
    options: ["done", "big then done", "ArithmeticException", "Compile error"],
    correctAnswer: 0,
    explanation: "&& short-circuits: a != 0 is false, so 10 / a is never evaluated.",
    topicTag: "module-6",
    difficulty: "medium",
  },
  {
    id: "ft-m6-02",
    title: "What prints?",
    codeSnippet: `int a = 0;
boolean ok = (a == 0) || (++a > 0);
System.out.println(a + " " + ok);`,
    options: ["1 true", "0 true", "0 false", "1 false"],
    correctAnswer: 1,
    explanation: "|| stops at the first true operand, so ++a never runs and a stays 0.",
    topicTag: "module-6",
    difficulty: "hard",
  },
  {
    id: "ft-m6-03",
    title: "What prints?",
    codeSnippet: `int a = 0;
boolean ok = (a == 0) | (++a > 0);
System.out.println(a + " " + ok);`,
    options: ["0 true", "1 true", "1 false", "Compile error"],
    correctAnswer: 1,
    explanation: "The single | always evaluates both sides, so ++a runs and a becomes 1.",
    topicTag: "module-6",
    difficulty: "hard",
  },
  {
    id: "ft-m6-04",
    title: "What prints?",
    codeSnippet: `boolean t = true, f = false;
System.out.println(!t || f && t);`,
    options: ["true", "false", "Compile error", "null"],
    correctAnswer: 1,
    explanation: "! binds first, then && before ||: false || (false && true) is false.",
    topicTag: "module-6",
    difficulty: "medium",
  },
  {
    id: "ft-m6-05",
    title: "What prints?",
    codeSnippet: `for (int i = 0; i < 6; i += 2) {
    System.out.print(i + " ");
}`,
    options: ["0 2 4", "0 2 4 6", "2 4 6", "0 1 2 3 4 5"],
    correctAnswer: 0,
    explanation: "i takes 0, 2 and 4; at 6 the condition i < 6 fails before printing.",
    topicTag: "module-6",
    difficulty: "easy",
  },
  {
    id: "ft-m6-06",
    title: "What prints?",
    codeSnippet: `int n = 10;
do {
    System.out.print(n);
} while (n < 5);`,
    options: ["Nothing", "10", "Infinite loop", "5"],
    correctAnswer: 1,
    explanation: "A do-while runs its body once before checking the condition.",
    topicTag: "module-6",
    difficulty: "medium",
  },
  {
    id: "ft-m6-07",
    title: "What prints?",
    codeSnippet: `int sum = 0, i = 1;
while (i <= 4) {
    sum += i++;
}
System.out.println(sum);`,
    options: ["6", "10", "15", "4"],
    correctAnswer: 1,
    explanation: "i++ adds 1, 2, 3 and 4 before the loop exits at i = 5, giving 10.",
    topicTag: "module-6",
    difficulty: "medium",
  },
  {
    id: "ft-m6-08",
    title: "How many times does the loop run?",
    codeSnippet: `int count = 0;
for (int i = 10; i > 0; i -= 3) count++;
System.out.println(count);`,
    options: ["3", "4", "10", "Infinite"],
    correctAnswer: 1,
    explanation: "i visits 10, 7, 4 and 1, then -2 fails the test, so the body runs 4 times.",
    topicTag: "module-6",
    difficulty: "hard",
  },
  {
    id: "ft-m6-09",
    title: "What prints?",
    codeSnippet: `int i = 0;
while (i < 3) {
    i++;
}
System.out.println(i);`,
    options: ["2", "3", "4", "0"],
    correctAnswer: 1,
    explanation: "The loop stops once i reaches 3, and that final value is printed after the loop.",
    topicTag: "module-6",
    difficulty: "easy",
  },
];
