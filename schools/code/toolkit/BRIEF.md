# Writing one course for the Coding Learning Foundation

The Coding Learning Foundation is a Khan Academy–style self-study site for a 63-course pathway from kindergarten to a software engineering job: elementary school (K–5), middle school, high school, a complete college computer science degree, and software engineering career preparation. Each course follows a 14-week syllabus. You write the lessons for ONE course: weeks 1–12 (one lesson per weekly topic) plus a project/review/final-exam file for weeks 13–14. Your course JSON says who the learner is (`audience`) and the course `level`; write for that learner. Address the learner as "you". Assume the course prerequisites, but briefly remind key prerequisite ideas when you use them. Use the standard names of algorithms, data structures, theorems, protocols, tools and principles (Dijkstra's algorithm, the master theorem, TCP, Git, SOLID): learners need them to use the readings, search documentation and pass interviews. Do not write about real people themselves (no biographies or anecdotes; eponyms such as "Dijkstra's algorithm" or "Turing machine" are fine), and never mention the curriculum's author.

The site runs Python in the learner's browser, so learners write and run real code inside lessons and the site grades it by running your tests.

## Files you write (only these)

- `/home/claude/code/content/<CODE>/L01.txt` … `L12.txt` — week N lesson = the syllabus topic for week N.
- `/home/claude/code/content/<CODE>/project.txt` — the week 13–14 project brief, review guide and cumulative exam items.

Your course data (audience, level, topics, block deliverables, project, primary reading) is in `/home/claude/code/toolkit/courses/<CODE>.json`. Read it and `/home/claude/code/toolkit/example_code_lesson.txt` (a complete, valid lesson showing the exact format, including code exercises) before writing anything. If your course is mathematics (C2, C14, C15, C16) also read `/home/claude/code/toolkit/example_lesson.txt` (a math lesson showing num and expr items).

## File format

Sections start with `@name` at the start of a line. Fields are `key: value`; a line that does not begin with a known key continues the previous field, so multi-line values are fine. Text inside ``` fences is kept exactly as written: inside a fence, lines that look like `key: value` or `@name` are just code, so decorators and dictionaries are safe there. Write TeX directly (`$\frac{1}{2}$`); inline math is `$...$`, display math is `$$...$$`. **A `$` outside code is read as math**: write `\$` for a literal dollar sign in prose (money: `\$4.50`), and put shell prompts, regular expressions, variables such as `$PATH` and anything else with `$` inside backticks or a fence, where `$` is safe.

Code in prose: inline code in single backticks (`len(xs)`); blocks in fences with a language (```python, ```c, ```sql, ```bash, ```text, ```javascript, ```html). Keep code lines under 80 characters where you can (the hard limit is 100), indent with 4 spaces, never tabs.

Lesson file sections, in order:
- `@lesson` — `title:` (the week's topic as a clear title), `summary:` (one sentence: what the learner will be able to do), `objective:` ×2–4, `reading:` (see below).
- `@article` — markdown: paragraphs, `###` subheadings, **bold**, lists, tables, code blocks, `$math$`. Length by level (see below).
- `@example` ×1–2 — `title:`, `problem:`, `step:` ×2–6 (each step is revealed one at a time, Khan-style; a step may contain a code block), optional `answer:`.
- `@mistakes` — 2–4 lines starting with `- `.
- `@practice <type>` ×5 — ordered easy → hard.
- `@quiz <type>` ×2 — new problems used only in unit quizzes, the midterm and the final. Never near-copies of practice items, and never the data of a worked example.

## Item types

Item fields: `prompt:`, `answer:`, `check:`, `hint:` ×1–3 (progressive; the last hint gets the learner to the method but not the final answer), `solution:` (complete and short), plus the fields each type needs.

| type | learner does | you give | verified by |
|---|---|---|---|
| `code` | writes Python in an editor, runs it, presses Check | `starter:`, `tests:` and/or `stdout:`, `model:` | the validator runs `model` against your tests in CPython **and** in the browser's Python, and checks that `starter` fails them |
| `text` | types an exact short answer, usually what a program prints | `answer:`, optional `accept:` ×n | `check:` that computes the same text, usually `run("...program...")` |
| `num` | one number or exact value | `answer:` (`3/4`, `sqrt(2)/2`, `1.5e3`) | `check:` expression |
| `expr` | an expression in `vars` | `answer:`, `vars:` | `check:` lambda |
| `list` | several values, any order | `answer:` (`-2, 3` or `none`) | `check:` |
| `tuple` | ordered values | `answer:` (`(2, -1)`) | `check:` |
| `mc` | one choice | mark the correct `choice*:` | — |
| `ms` | select all that apply | mark every correct `choice*:` | — |
| `self` | writes or designs, then compares with a model | `solution:` (model answer) and `rubric:` ×2–4 | — |

`mc`/`ms` use `choice:` lines (3–5 total) with the correct ones written `choice*:`. **The site shuffles the choices**, so never use "all/none of the above" or "both A and B", and in hints and solutions name a choice by its content, never by its position ("the second choice", "option B"). Distractors come from real misconceptions (an off-by-one, the wrong complexity class, aliasing confusion, a plausible but wrong command). Use `self` for proofs, designs, explanations, written analyses, diagrams described in words, shell or Git sessions the learner performs on their own computer, and anything a person must judge; give a complete model `solution:` and 2–4 `rubric:` lines.

### `code` items

```
@practice code
prompt: Write `count_above(nums, limit)` that returns how many numbers in `nums` are strictly greater than `limit`.
starter:
```python
def count_above(nums, limit):
    pass
```
tests:
```python
assert count_above([3, 8, 10, 1], 5) == 2
assert count_above([5, 5, 5], 5) == 0
assert count_above([], 0) == 0
```
model:
```python
def count_above(nums, limit):
    count = 0
    for n in nums:
        if n > limit:
            count += 1
    return count
```
hint: A count is a total in which each item adds 1 or nothing.
solution: Start `count` at 0, add 1 for each `n > limit`, and return it after the loop.
```

- `starter:` (optional) is the code the editor starts with: usually the function header and `pass`. It must compile and must **fail** the tests. `model:` is your complete reference solution. Each of `starter`, `tests`, `model`, `stdin`, `stdout` holds exactly one fenced block.
- `tests:` is Python run after the learner's code, in the same namespace. Each top-level `assert` is one test: the learner sees a ✓ or ✗ beside each one, and a failing `assert expr == expected` automatically reports what the code gave and what was expected, so prefer `assert f(x) == value` over clever conditions. Write 3–6 asserts: the main case, edge cases (empty input, one item, negatives, duplicates, boundaries) and one case a typical wrong solution gets wrong. Non-assert lines (creating objects, calling functions, `write_file`) are setup and run in order. An optional message works: `assert f(0) == 1, "0! is defined as 1"`.
- `stdout:` (optional) is the exact text the program must print, for "write a program that prints …" exercises; trailing spaces and trailing blank lines are ignored, everything else must match. You may give both `stdout:` and `tests:`. `stdin:` (optional) holds the lines that `input()` returns, one per line; `input()` does not echo what it reads, exactly as when input is piped, so the expected output contains the prompt text but not the typed line. **A program that reads input must be checked on two or three different inputs**: repeat `stdin:` and `stdout:` as pairs, in order (`stdin:`, `stdout:`, `stdin:`, `stdout:` …), each holding one fenced block. The first pair is shown to the learner and used by the Run button; the others are hidden checks, so a program that ignores its input or handles only one case cannot pass. Choose inputs that exercise different branches (below and above a threshold, the boundary value itself).
- Helpers available to learner code and tests: `output()` returns the text printed since the tests began or since the last `output()` call (test printing functions: `show_board(b)` then `assert output() == "X.O\n"`); `write_file(name, text)` and `read_file(name)` set up and inspect files, and the learner's `open()` works on these in-memory files in text mode (`"r"`, `"w"`, `"a"`); `raises(ExcType, func, *args)` is True when the call raises that exception (`assert raises(ValueError, parse_age, "abc")`).
- `solution:` explains the approach in words. **The site shows your `model:` code right after the solution**, so do not paste the whole model again; quote a key line if it helps.
- The prompt must specify everything the tests check: the function name and parameters, the return value (returned, not printed, unless the exercise is about printing), how to treat edge cases, and anything not allowed ("without using `sorted`"). Give one example call in the prompt when it helps.
- Good code: idiomatic, readable, PEP 8, at the level of the course (do not use features the learner has not met yet). From H15 and in college courses, type hints are welcome in model solutions; tests must not depend on them.
- Keep the work small: model plus tests must finish in well under a second in the browser, which is about 20–50 times slower than CPython. No loops over millions of items, no recursion deeper than about 300 calls, no timing-based tests.
- **What the browser's Python can run.** It is Brython, implementing Python 3.14, and it also has to pass under CPython 3.13, so use features common to both. Available: the whole core language (classes, inheritance, generators, decorators, closures, comprehensions, `match`, f-strings, exceptions, `with`, `dataclasses`, `typing`, `enum`, `abc`) and most of the standard library: `collections`, `itertools`, `functools`, `heapq`, `bisect`, `math`, `random`, `re`, `json`, `string`, `textwrap`, `datetime`, `time`, `decimal`, `fractions`, `statistics`, `operator`, `copy`, `io`, `csv`, `contextlib`, `unittest` and `unittest.mock`, `hashlib`, `struct`, `base64`, `html`, `urllib.parse`, `ast`. **Not available**: `sqlite3`, real concurrency (`threading`, `multiprocessing`, `asyncio`), `subprocess`, `socket` and any network access, `tkinter`, `turtle`, `graphlib`, `cmath`, `doctest`, third-party packages (no `numpy`, `pandas`, `requests`, `flask`, `pytest`), real files (use the in-memory files above), and Python 3.15 features (`frozendict`, lazy imports). For those topics, use `text`, `mc` or `self` items, or simulate the idea in plain Python (a scheduler as a function over a list of jobs, a cache as a dictionary, a network as a dictionary of neighbors). The browser's `json` is CPython's own package, so invalid input raises `json.JSONDecodeError` (a `ValueError`) as in CPython, and `re` supports `\g<name>` replacements, `Pattern.subn`, `Match.lastindex` and `frozenset - set`; avoid only these rare regex corners, which differ: lazy patterns that can match empty strings (`a*?`), a capture group inside a repeated group keeping its value from an earlier repetition, and conditional groups `(?(1)...)`.
- **Tests must give the same result in any Python**: never test specific random values (seeded sequences differ between implementations; test properties instead: length, range, sortedness), set iteration order, the default `repr` of an object without `__repr__` (`<__main__.A object at 0x…>`), object ids, the exact wording of a built-in error message (test the exception type with `raises`), or anything that depends on time.
- Every lesson in a `P` (programming) course has at least two `code` items among its practice and quiz items. Other profiles use `code` where the topic is naturally programmed (implementing an algorithm, a simulation, a calculation).

### `text` items

For "what does this print?", "what is the value of `x`?", a command, a regular expression or any short exact answer:

```
@practice text
prompt: What does this program print?

```python
for i in range(3):
    print(i * i)
```
answer:
```
0
1
4
```
check: run("for i in range(3):\n    print(i * i)\n")
hint: `range(3)` gives 0, 1 and 2.
solution: The loop prints the squares of 0, 1 and 2, one per line.
```

- The learner's text is compared with `answer:` line by line after trimming each line and treating any run of spaces as one space; capital letters and punctuation matter. Multi-line answers go in a fence. `accept:` lines give other forms that are also correct (`accept: x = 5`), but keep answers unambiguous: say exactly what to type ("Type the output exactly", "Give the command only, without the prompt").
- `check:` must reproduce the answer independently, so for program output the check runs the program: `run(src)` runs Python (CPython 3.13) and returns what it prints, `run(src, stdin)` feeds input lines, and `run_c(src)` compiles a C program with gcc in C17 mode and returns what it prints. Write the program inside the check as a Python string with `\n` line breaks, as above, and copy it exactly from the prompt. For C, write a complete program with `#include <stdio.h>` and `int main(void)`.
- For SQL, `sql(setup, query)` runs the setup statements in a fresh in-memory SQLite database and returns the query's rows as a list of tuples: `check: sql("CREATE TABLE t(a INT); INSERT INTO t VALUES (1), (5);", "SELECT COUNT(*) FROM t WHERE a > 2")[0][0]` for a `num` item. Write standard SQL that SQLite accepts (joins of every kind, `GROUP BY`, `HAVING`, subqueries, CTEs, window functions, `CHECK` and foreign-key constraints), and avoid vendor-specific syntax unless the lesson is about it. In prompts give the schema and the data as SQL or as a small table.
- When the answer cannot be computed (a shell command, a Git command, a regular expression the learner writes), use `nocheck: <reason>` and keep the answer short and standard, with `accept:` for the other standard forms (`git switch -c feature` and `git checkout -b feature`). At most six `nocheck` items per course.

### Numeric and math items

`num`, `expr`, `list` and `tuple` use plain calculator syntax: `3/4`, `-sqrt(3)/2`, `2pi`, `e^(-x)`, `x^2`, `ln(x)`, `log(x)` (base 10), `abs(x)`, `5!`, `1.5e3`, `inf`, `dne`. No units, words or `x =` inside answers. Optional fields: `vars: x, y` (expr; also any multi-letter symbol such as `n_0`), `domain: x: 3..6` (sampling ranges for expr equivalence, default 0.35..2.65), `tol: 0.005` (absolute) or `tol: 1%` (relative) whenever the prompt asks for rounding or uses measured data, `form: expanded` or `form: factored`, `const: yes` (antiderivatives), `unit: ms` (shown after the input box), `lead: $T(n) =$` (shown before it). A `num` item without `tol:` needs an exact answer, so its prompt must not ask for a decimal. For a big-O answer, use `mc` (choices such as `$O(n \log n)$`), not `expr`.

`check:` is ONE Python expression that computes the expected result independently from the problem statement — never retype your answer. Use the program itself where you can (`int(run(...))`, `len(sql(...))`), or redo the arithmetic (`2**10`, `comb(5, 2)`, `ceil(log2(1000))`, `sum(1/(k*k) for k in range(1, 101))`). Available names: `run`, `run_c`, `sql`, `comb`, `perm`, `factorial`, `math`, `Fraction`, `np`, `floor`, `ceil`, `log2`, `log10`, `log` (natural), `sqrt`, `exp`, `sin`, `cos`, `pi`, `e`, `inf`, `quad`, `nderiv`, `root`, `roots`, `lin`, `det`, `inv`, `mat`, `dot`, `norm`, `eig`, `lim`, `nsum`, and builtins such as `sum`, `range`, `min`, `max`, `round`, `len`, `sorted`, `int`, `str`, `bin`, `hex`, `ord` and `chr` (`int("1011", 2)` works). For `expr`, the check is a lambda that returns the value the correct expression has for given inputs. Only when an item truly cannot be computed, write `nocheck: <reason>` (counted with the limit above).

## Writing for each level

- **Elementary (K10, K11).** The learner is a child with an adult helper who reads aloud. Short sentences, everyday words, one idea at a time, concrete things a child can see or do. Articles 150–350 words. Examples have 2–4 steps. K10 is "unplugged": no computer; instructions are numbered steps or arrows on a grid described in words (`↑ → → ↓`), and items are mostly `mc`, `num` and `text` (for example "Which square does the robot end on?" with the grid drawn as a small text block or table), with `self` items for hands-on tasks ("Write instructions for your grown-up to draw a square") whose rubric the adult checks. K11 uses real Python: tiny programs of 1–6 lines, mostly `code` items with `stdout:` ("Make the computer print `Hello, Sam!`"), `text` items that predict output, and friendly error explanations; no functions with parameters before week 11. Avoid TeX except for simple arithmetic.
- **Middle school (J9, J10).** Articles 250–450 words; clear, encouraging, concrete before abstract, with a short runnable code example in every programming article. Programs of up to about 20 lines.
- **High school (H14, H15).** Articles 300–600 words. Programs of up to about 40 lines.
- **College.** Articles 350–750 words; university-level precision. Programming courses: correct, idiomatic Python, clear specifications, tests, and complexity stated where relevant. Theory courses: precise definitions and statements, proofs written as a careful instructor would, worked examples with every step. Systems, networks, databases and security courses: concrete traces (a packet, a page-table walk, a query plan, a handshake), small numeric problems (delays, subnet sizes, cache hit rates, page counts), and code in the language the topic uses (C, SQL, assembly as text; Python for simulations the learner runs).
- **Professional (P1–P6).** Articles 400–800 words, practical and current, written as a senior engineer coaching a new hire. Use realistic scenarios (a pull request, an incident, a design review, an interview question). `self` items for designs, reviews, postmortems, STAR stories and plans have complete model answers and specific rubrics; interview-preparation lessons have several `code` items at interview level, with the pattern named in the solution and the time and space complexity stated.

## Content standards

- **Correct above all.** Precise definitions and true statements. Every code sample in an article or example must be correct and, if run, do what the text says; prefer short samples you are sure of. Do not invent functions, methods, flags, commands, options or library behavior; when unsure, choose a construct you know. Give complexities with the case (worst, average, amortized) and the model (comparisons, operations). State the language and version when behavior depends on it.
- **Python** (the course language for programming): Python 3 as current in 2026 (3.15, released October 2026, is the newest; teach features from 3.10 onward freely, and do not rely on 3.15-only features). PEP 8 style, f-strings, `if __name__ == "__main__":` for scripts in college courses, type hints where they help (H15 onward), docstrings for public functions in college and professional courses.
- **Other languages** appear where the topic needs them: C (C17, with notes where C23 changed something, such as `bool`, `true`, `false` and `nullptr` becoming keywords), SQL (standard SQL), RISC-V assembly (RV32I/RV64I base instructions and the standard calling convention), JavaScript (modern ECMAScript: `let`/`const`, arrow functions, `async`/`await`, `fetch`), HTML and CSS (current standards, semantic elements, flexbox and grid), the Unix shell (bash) and Git (current commands: `git switch` and `git restore` alongside `checkout`; new repositories commonly use `main` as the default branch).
- **Current facts to teach as current** (verified; use them where your course touches them):
  - Python 3.15 was released in October 2026 (lazy imports, a built-in `frozendict`, UTF-8 as the default encoding); 3.14 (October 2025) added template strings (t-strings) and deferred evaluation of annotations; 3.13 (October 2024) added an experimental free-threaded build and a new interactive interpreter.
  - OWASP Top 10:2025: A01 Broken Access Control, A02 Security Misconfiguration, A03 Software Supply Chain Failures, A04 Cryptographic Failures, A05 Injection, A06 Insecure Design, A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Security Logging and Alerting Failures, A10 Mishandling of Exceptional Conditions.
  - NIST SP 800-63B Revision 4 (final, August 2025) on passwords: at least 15 characters when a password is the only factor (at least 8 when it is part of multi-factor authentication); allow long passwords (at least 64 characters); no composition rules (such as requiring symbols); no forced periodic changes, but a required change when there is evidence of compromise; check new passwords against a blocklist of common and compromised passwords; no hints or security questions; store passwords salted and hashed with a slow, purpose-built key-derivation function.
  - TLS 1.3 (RFC 8446) is the current TLS version; HTTP/3 runs over QUIC (RFCs 9114 and 9000); NIST's first post-quantum cryptography standards, FIPS 203 (ML-KEM), FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA), were published in August 2024.
  - C23 (ISO/IEC 9899:2024) is the newest C standard; most courses and tools still default to C17, which the site's checks use.
  - WCAG 2.2 (2023) is the current W3C accessibility recommendation.
  - Large language models and other machine learning systems: describe how they work and their limitations (errors stated confidently, bias, privacy and security risks) factually and without hype; do not name or compare specific commercial products, and do not state benchmark numbers.
- **Security.** Teach as a university security course and defenders do: how each class of vulnerability arises, how to recognize it in code and design, and how to prevent and detect it. Vulnerable snippets must be short, clearly labeled, and shown next to the fixed version. Never give working exploit code, malware, instructions for attacking real systems or accounts, password-cracking procedures, or ways to evade security controls. Exercises attack only the learner's own toy code (for example, show that an unescaped string breaks a query, then fix it with parameters).
- **Ethics, law and society.** Factual and balanced: present the main perspectives on contested questions (AI policy, privacy, platform regulation) without taking sides. Open-source licenses are described accurately (permissive licenses such as MIT, BSD and Apache 2.0; copyleft licenses such as the GPL), with a note that this is not legal advice.
- **Khan-style teaching:** intuition and a concrete case first, then the precise statement; short paragraphs; worked examples whose steps each do one thing; for code, show the code and then trace it.
- **Course profile** (in your course JSON): P programming — `code` items are the backbone (at least 2 per lesson), plus `text` tracing items and `mc`/`ms` on concepts. T theory — `num`, `list`, `expr` and `text` computations, `mc`/`ms` on definitions and properties, `self` items for proofs and derivations (complete model proof, rubric on the key steps), and `code` items where an algorithm or simulation is naturally programmed. E engineering practice — `self` items for designs, plans, reviews and writing with model answers and rubrics, `mc`/`ms` on principles and trade-offs, and `code` or `text` items where the topic involves code (refactoring, tests, commands). Y young learner — see the elementary level.
- Each lesson's practice + quiz items include at least 3 auto-graded ones (not `self`).
- Where natural, one item in a block's second-week lesson exercises that block's deliverable (in your course JSON).
- Every item is self-contained: restate any code, data or schema it needs. Never write "the previous problem", "the example above" or "as above" in an item, because items appear alone in practice sessions and exams.
- **reading:** name the part of the course's primary reading to study that week (a chapter or section) only if you are confident it exists there; otherwise name the topic to look up in that resource. No URLs anywhere.
- Original wording and original code only: do not reproduce textbook passages, exercises, interview-site problems word for word, or released exam questions. Classic problems (two-sum, FizzBuzz, the knapsack problem, dining philosophers) are fine in your own words.
- Week 7 is an ordinary lesson; the site schedules the midterm itself.

## project.txt

- `@project` — `title:`, `overview:` (2–3 sentences), `goal:` ×2–4, `step:` ×4–8 (a concrete plan), `deliverable:` ×2–4, `rubric:` ×3–6, optional `safety:`, `tutor:` ×2–3 (good questions to ask the AI tutor while doing the project). Base it on the syllabus project. Any "supplied" data, specifications, starter code, problem statements, schemas or incidents the project needs must be written out in `material:` fields (one per item; markdown and code fences allowed), placed after the steps. Never put text after the `tutor:` lines: it would become part of the last tutor question. Projects are done on the learner's own computer (with Python, a C compiler, Git and so on, installed as the course teaches), so they may use any tool the course teaches.
- `@review` — markdown week-13 review guide: the course's key ideas week by week, a self-check list, and the most common errors. 250–600 words (elementary 120–300).
- `@exam <type>` ×3 — cumulative, multi-step final-exam problems that connect several weeks; at least one auto-graded (a `code` item is ideal in programming courses); same fields and checks as practice items.

## Workflow

1. Read your course JSON and the example lesson(s), once each. Do not open any other file: not the site's code, the validator, the toolkit scripts or other courses. Everything you need is in this brief. Do not run experiments before writing; write, then let the validator tell you what to fix. (You may run a short Python snippet with `python3 -c` to confirm what a program prints before you put it in an item.)
2. If some of your lesson files already exist (you may be resuming), run the validator first and continue with the missing ones. Never rewrite a lesson that already passes.
3. Write two lessons per message (two Write calls), in week order, then project.txt. Do not read your files back after writing them.
4. After every four lessons, run `python3 /home/claude/code/toolkit/validate.py <CODE>` and fix every ERROR in the files you have written (ignore "file missing" for files you have not written yet). Fix errors with Edit, using the reported line numbers. When all files exist, rerun until it reports 0 errors. The validator runs every `code` item's model solution in a headless browser, so it takes a minute or two.
5. Finish with a message of at most five lines: the validator result, the item count, any `nocheck` items, and any topic where you are unsure of accuracy. Do not paste lesson content.

Work only inside your course folder. Do not modify the toolkit, install packages or browse the web.
