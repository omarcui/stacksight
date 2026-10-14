// Starter programs for the Java sandbox template selector (app/sandbox/page.tsx).
// Each one runs on the in-browser interpreter in lib/sandbox-runner.ts.

export type SandboxTemplate = {
  id: string;
  label: string;
  description: string;
  code: string;
};

export const sandboxTemplates: SandboxTemplate[] = [
  {
    id: "hello",
    label: "Hello, World",
    description: "The smallest complete Java program.",
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, StackSight!");
        System.out.print("print() stays on the same line, ");
        System.out.println("println() ends it.");
    }
}
`,
  },
  {
    id: "scanner-greeting",
    label: "Scanner: greeting",
    description: "Read a line and a number from the console.",
    code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);

        System.out.print("What is your name? ");
        String name = in.nextLine();

        System.out.print("How old are you? ");
        int age = in.nextInt();

        System.out.println("Hi " + name + "!");
        System.out.println("Next year you will be " + (age + 1) + ".");
    }
}
`,
  },
  {
    id: "printf-receipt",
    label: "printf: receipt",
    description: "Width, alignment, precision and grouping flags.",
    code: `public class Main {
    public static void main(String[] args) {
        String[] items = {"Notebook", "Pen", "Backpack"};
        int[] quantity = {3, 10, 1};
        double[] price = {2.5, 0.99, 34.0};

        System.out.printf("%-10s %5s %9s%n", "Item", "Qty", "Total");
        double sum = 0;
        for (int i = 0; i < items.length; i++) {
            double line = quantity[i] * price[i];
            sum += line;
            System.out.printf("%-10s %5d %9.2f%n", items[i], quantity[i], line);
        }
        System.out.printf("%-10s %15.2f%n", "TOTAL", sum);
        System.out.printf("Points earned: %,d%n", (int) (sum * 1000));
    }
}
`,
  },
  {
    id: "grade-average",
    label: "Scanner + arrays: grades",
    description: "Loop over input, store it in an array, then summarise.",
    code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        System.out.print("How many scores? ");
        int n = in.nextInt();
        int[] scores = new int[n];

        for (int i = 0; i < n; i++) {
            System.out.print("Score " + (i + 1) + ": ");
            scores[i] = in.nextInt();
        }

        int sum = 0;
        int best = Integer.MIN_VALUE;
        for (int s : scores) {
            sum += s;
            best = Math.max(best, s);
        }
        double average = (double) sum / n;

        System.out.printf("Average: %.1f  Best: %d  Grade: %c%n", average, best, letter(average));
    }

    static char letter(double average) {
        if (average >= 90) return 'A';
        if (average >= 80) return 'B';
        if (average >= 70) return 'C';
        return 'F';
    }
}
`,
  },
  {
    id: "nextline-pitfall",
    label: "Pitfall: nextInt + nextLine",
    description: "Why the name comes back empty, and the fix.",
    code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);

        System.out.print("Age: ");
        int age = in.nextInt();
        // nextInt() leaves the Enter key's newline in the buffer...
        System.out.print("Name: ");
        String name = in.nextLine(); // ...so this returns "" immediately.

        System.out.println("name = [" + name + "], age = " + age);
        // Fix: call in.nextLine() once after nextInt() to consume the newline.
    }
}
`,
  },
  {
    id: "string-pool",
    label: "Strings: == vs equals",
    description: "Literals share the String Pool; typed input does not.",
    code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String literal = "java";
        String alias = "java";

        System.out.print("Type java: ");
        String typed = in.next();

        System.out.println("literal == alias      : " + (literal == alias));
        System.out.println("literal == typed      : " + (literal == typed));
        System.out.println("literal.equals(typed) : " + literal.equals(typed));
    }
}
`,
  },
];
