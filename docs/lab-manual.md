# CSC103 Programming Fundamentals — Lab Manual & Practical Exercises

This document serves as the official practical laboratory guide for CSC103: Programming Fundamentals (Java). It contains lab objectives, problem specifications, expected sample runs, edge cases, and bug-spotting exercises designed to complement Modules 1 through 6.

---

## Lab 1: Development Environment Setup & Execution Lifecycle

### Objectives
* Verify JDK installation and environment variable (`PATH`) configuration.
* Execute the standard Java 5-stage execution lifecycle: Editing (`.java`) $\rightarrow$ Compiling (`.class`) $\rightarrow$ Loading $\rightarrow$ Verifying $\rightarrow$ Executing.
* Understand basic command-line developer tooling (`javac`, `java`).

### Exercise 1.1: Environment Verification
1. Open terminal/command prompt and verify Java installation:
   ```bash
   java -version
   javac -version
   ```
2. **Expected Output**: Standard JDK version details (e.g., `openjdk version "17.0.x"` or higher).

### Exercise 1.2: First Java Program (`Welcome.java`)
* **Task**: Create a source file named `Welcome.java` that prints three distinct statements.
* **Source Code**:
  ```java
  public class Welcome {
      public static void main(String[] args) {
          System.out.println("Welcome to CSC103 Programming Fundamentals!");
          System.out.println("Java Virtual Machine (JVM) executes bytecode.");
          System.out.println("Compiling with javac...");
      }
  }
  ```
* **Compilation & Execution Steps**:
  1. `javac Welcome.java`
  2. `java Welcome`

### Exercise 1.3: Bug-Spotting Challenge (Syntax vs Runtime vs Logic)
Identify the error type for each snippet:
1. `System.out.println("Hello World);` $\rightarrow$ **Syntax Error** (Missing closing quote).
2. `System.out.println(1 / 0);` $\rightarrow$ **Runtime Error** (`ArithmeticException: / by zero`).
3. `System.out.println("Area of circle r=2 is 12.56");` when calculated area is $12.57$ $\rightarrow$ **Logic Error**.

---

## Lab 2: Pseudocode, Flowcharts & Mathematical Algorithms

### Objectives
* Model problem solutions using pseudocode and flowchart conventions (terminal ovals, process rectangles, decision diamonds, I/O parallelograms).
* Implement mathematical formulas in program logic.

### Exercise 2.1: Euclidean Distance Calculation
* **Problem Statement**: Calculate the Euclidean distance between two points $(x_1, y_1)$ and $(x_2, y_2)$ using the formula:
  $$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$

* **Pseudocode**:
  ```text
  1. INPUT x1, y1, x2, y2
  2. COMPUTE dx = x2 - x1
  3. COMPUTE dy = y2 - y1
  4. COMPUTE distance = sqrt(dx*dx + dy*dy)
  5. PRINT distance
  ```

* **Sample Run**:
  * Inputs: $(0, 0)$ and $(3, 4)$
  * Output: `Distance = 5.0`

### Exercise 2.2: Exponential Value Computation ($x^y$)
* **Problem Statement**: Given a base $x$ and exponent $y$, compute $x^y$ using `Math.pow(x, y)`.
* **Sample Run**:
  * Base ($x$): `2`
  * Exponent ($y$): `10`
  * Output: `2.0 raised to 10.0 = 1024.0`

---

## Lab 3: Primitive Types, Memory Storage & Arithmetic Operations

### Objectives
* Gain hands-on understanding of fixed byte allocations for primitives (`byte`, `short`, `int`, `long`, `float`, `double`, `boolean`, `char`).
* Observe explicit type casting (narrowing) and integer division truncation behavior.

### Exercise 3.1: Variable Memory & Casting Tracing
* **Task**: Write a program `TypeCastingDemo.java` demonstrating widening and narrowing casts.
* **Source Code**:
  ```java
  public class TypeCastingDemo {
      public static void main(String[] args) {
          double originalDouble = 7.99;
          int truncatedInt = (int) originalDouble; // Explicit narrowing cast

          int bigInt = 130;
          byte overflowByte = (byte) bigInt; // Byte range: -128 to 127

          System.out.println("Original double: " + originalDouble);
          System.out.println("Truncated int: " + truncatedInt);
          System.out.println("Overflow byte: " + overflowByte);
      }
  }
  ```
* **Expected Output**:
  ```text
  Original double: 7.99
  Truncated int: 7
  Overflow byte: -126
  ```

### Exercise 3.2: Base System Representations
* **Task**: Demonstrate integer literal formats in Binary (`0b`), Hexadecimal (`0x`), and Octal (`0`).
* **Sample Snippet**:
  ```java
  int dec = 26;
  int hex = 0x1A;
  int bin = 0b00011010;
  System.out.println(dec == hex && hex == bin); // Outputs: true
  ```

---

## Lab 4: Console Input, Output Formatting & Escape Sequences

### Objectives
* Capture structured user input using `java.util.Scanner`.
* Apply `System.out.printf` format specifiers (`%d`, `%f`, `%s`, `%10.2f`) for tabular report layouts.
* Handle escape sequences (`\n`, `\t`, `\"`).

### Exercise 4.1: Circle Area Calculator (`CircleAreaCalculator.java`)
* **Problem Statement**: Prompt the user to enter the radius of a circle, compute its area using $A = \pi \cdot r^2$, and print the result rounded to two decimal places.
* **Source Code**:
  ```java
  import java.util.Scanner;

  public class CircleAreaCalculator {
      public static void main(String[] args) {
          final double PI = 3.141592653589793;
          Scanner input = new Scanner(System.in);

          System.out.print("Enter circle radius: ");
          double radius = input.nextDouble();

          double area = PI * radius * radius;

          System.out.printf("Radius: %10.2f\n", radius);
          System.out.printf("Calculated Area: %10.2f\n", area);

          input.close();
      }
  }
  ```
* **Sample Run**:
  ```text
  Enter circle radius: 5.5
  Radius:       5.50
  Calculated Area:      95.03
  ```

### Exercise 4.2: Escape Sequences & Formatting Tabular Output
* **Task**: Output a stylized item receipt using `\t`, `\n`, and `%12s` alignment.
* **Expected Console Output**:
  ```text
  ITEM          QTY    PRICE
  ---------------------------------
  Notebook        2   $  4.50
  Pen            10   $  1.20
  ```

---

## Lab 5: Decision Structures & Branching Logic

### Objectives
* Implement `if`, `if-else`, and nested selection statements.
* Avoid common pitfalls such as dangling `else` ambiguities and floating-point equality checks (`==`).
* Use `switch` statements with break/default mechanics.

### Exercise 5.1: Overtime Gross Pay Calculator (`GrossPayCalculator.java`)
* **Problem Statement**: Calculate weekly gross pay given hours worked and hourly pay rate. Hours exceeding 40 receive overtime compensation paid at $1.5 \times$ the regular rate.
* **Source Code**:
  ```java
  import java.util.Scanner;

  public class GrossPayCalculator {
      public static void main(String[] args) {
          Scanner input = new Scanner(System.in);

          System.out.print("Enter hours worked: ");
          double hours = input.nextDouble();
          System.out.print("Enter hourly rate: ");
          double rate = input.nextDouble();

          double grossPay;
          if (hours > 40) {
              double regularPay = 40 * rate;
              double overtimePay = (hours - 40) * (rate * 1.5);
              grossPay = regularPay + overtimePay;
          } else {
              grossPay = hours * rate;
          }

          System.out.printf("Gross Pay: $%.2f\n", grossPay);
          input.close();
      }
  }
  ```
* **Sample Run**:
  * Inputs: `45` hours, `$20.00`/hr
  * Calculation: $(40 \times 20) + (5 \times 30) = 800 + 150 = 950$
  * Output: `Gross Pay: $950.00`

### Exercise 5.2: Chinese Zodiac Calendar (`ChineseZodiac.java`)
* **Problem Statement**: Determine the animal sign for a given birth year using `year % 12` in a `switch` construct.
* **Mapping Table**:
  * `0`: Monkey | `1`: Rooster | `2`: Dog | `3`: Pig | `4`: Rat | `5`: Ox
  * `6`: Tiger | `7`: Rabbit | `8`: Dragon | `9`: Snake | `10`: Horse | `11`: Sheep
* **Sample Run**:
  * Input: `1996` ($1996 \pmod{12} = 4$)
  * Output: `Zodiac Sign: Rat`

---

## Lab 6: Logical Operators, Ternary Operators & Repetition Loops

### Objectives
* Evaluate boolean expressions using `!`, `&&`, `||`, and `^`.
* Master loop execution mechanics using `while`, `do-while`, and counter-controlled `for` loops.
* Build sentinel-controlled and flag-controlled interactive programs.

### Exercise 6.1: Number Guessing Game (`GuessNumber.java`)
* **Problem Statement**: Generate a random integer between $0$ and $100$ using `Math.random()`. Allow the user to repeatedly guess until they find the secret number, providing "Too High" or "Too Low" hints after each guess.
* **Source Code**:
  ```java
  import java.util.Scanner;

  public class GuessNumber {
      public static void main(String[] args) {
          int secretNumber = (int) (Math.random() * 101);
          Scanner input = new Scanner(System.in);
          int guess = -1;
          int attempts = 0;

          System.out.println("Guess a magic number between 0 and 100");

          while (guess != secretNumber) {
              System.out.print("Enter your guess: ");
              guess = input.nextInt();
              attempts++;

              if (guess == secretNumber) {
                  System.out.printf("Correct! You found it in %d attempts.\n", attempts);
              } else if (guess > secretNumber) {
                  System.out.println("Your guess is too high.");
              } else {
                  System.out.println("Your guess is too low.");
              }
          }
          input.close();
      }
  }
  ```

### Exercise 6.2: Running Average Calculator (`SentinelValue.java`)
* **Problem Statement**: Continuously prompt the user for integer inputs until the sentinel value `0` is entered. Calculate and display the sum and floating-point average of all non-zero numbers entered.
* **Edge Case**: If the first entry is `0`, display `"No numbers were entered."`.

---

## Lab Exercise Mapping Matrix

| Lab ID | Core Java Topics | Associated Deliverable / Interactive Widget |
| :--- | :--- | :--- |
| **Lab 1** | JDK tools, Execution Lifecycle, Syntax Errors | `Welcome.java` & Compilation Lifecycle Simulator |
| **Lab 2** | Pseudocode, Flowcharts, Math Functions | Euclidean Distance & Exponential ($x^y$) Evaluator |
| **Lab 3** | Primitives, Memory Allocation, Casting | Byte Memory Trace & Implicit/Explicit Type Cast Sandbox |
| **Lab 4** | `Scanner`, Output Formatting, Escape Codes | `CircleAreaCalculator.java` & Formatted Print Builder |
| **Lab 5** | Selection Structures, `if-else`, `switch` | `GrossPayCalculator.java` & `ChineseZodiac.java` |
| **Lab 6** | Boolean Logic, `while`/`for` Loops, Sentinels | `GuessNumber.java` Mini-Game & Running Average Visualizer |