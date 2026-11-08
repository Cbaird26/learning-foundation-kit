# Writing one course for the Metaphysics Learning Foundation

The Metaphysics Learning Foundation is a Khan Academy–style self-study site for a 63-course pathway from kindergarten to graduate study in metaphysics: elementary school (K–5), middle school, high school, a complete college philosophy degree with a concentration in metaphysics, and graduate seminars, formal methods, research and writing, and preparation for qualifying exams and a dissertation. Each course follows a 14-week syllabus. You write the lessons for ONE course: weeks 1–12 (one lesson per weekly topic) plus a project/review/final-exam file for weeks 13–14. Your course JSON says who the learner is (`audience`) and the course `level`; write for that learner. Address the learner as "you". Assume the course prerequisites, but briefly remind key prerequisite ideas when you use them. Use the standard names of arguments, positions, principles, thought experiments and systems (modus ponens, the problem of universals, Leibniz's Law, the ontological argument, the special composition question, the consequence argument, the Chinese room, the knowledge argument, S5, the Barcan formula): learners need them to use the readings, pass exams and talk with other philosophers. Philosophers' views and arguments are the subject matter, so attribute them by name, accurately (see Content standards); but do not write biographies or anecdotes about real people, and never mention the curriculum's author.

The site runs Python in the learner's browser, so in the logic courses learners can write and run real code inside lessons, and the site grades it by running your tests. Only C2, C20, C21 and P4 have code items; no other course does.

## Files you write (only these)

- `/home/claude/metaphysics/content/<CODE>/L01.txt` … `L12.txt` — week N lesson = the syllabus topic for week N.
- `/home/claude/metaphysics/content/<CODE>/project.txt` — the week 13–14 project brief, review guide and cumulative exam items.

Your course data (audience, level, topics, block deliverables, project, primary reading) is in `/home/claude/metaphysics/toolkit/courses/<CODE>.json`. Before writing anything, read it and `/home/claude/metaphysics/toolkit/example_philosophy_lesson.txt`: a complete, valid lesson that shows the exact format, the way to set out arguments and positions, and the conventions for items. If your course has Python exercises (C2, C20, C21 and P4), also read `/home/claude/metaphysics/toolkit/example_code_lesson.txt`. The example lessons and the examples in this brief are format samples: never copy their examples, cases or items. C12 (week 12 covers vagueness) and P1 (week 9 covers metaphysical indeterminacy) overlap the philosophy example's topic and must write entirely new material: new cases, new series and new items.

## File format

Sections start with `@name` at the start of a line. Fields are `key: value`; a line that does not begin with a known key continues the previous field, so multi-line values are fine. Text inside ``` fences is kept exactly as written: inside a fence, lines that look like `key: value` or `@name` are just code, so decorators and dictionaries are safe there. Write TeX directly (`$\neg P \to Q$`); inline math is `$...$`, display math is `$$...$$`.

**Dollar signs.** A `$` outside code starts math. You will rarely need a dollar sign in philosophy; if you do (a price in a decision problem), write it with a backslash: `\$20`. The validator rejects math that looks like a dollar amount. Percent signs need no escape in prose; inside math write `\%`.

**Logic notation.** Use TeX inside `$...$` with one consistent notation: $\neg$ `\neg`, $\wedge$ `\wedge`, $\vee$ `\vee`, $\to$ `\to`, $\leftrightarrow$ `\leftrightarrow`, $\forall x$ `\forall x`, $\exists x$ `\exists x`, $=$, $\Box$ `\Box`, $\Diamond$ `\Diamond`, $\vDash$ `\vDash`, $\vdash$ `\vdash`, $\bot$ `\bot`, $\in$ `\in`, $\subseteq$ `\subseteq`, $\varnothing$ `\varnothing`, $\mathbb{N}$ `\mathbb{N}`. Sentence letters are capital letters ($P$, $Q$, $R$) in C1, C21 and other college logic, as in forall x: Calgary; lowercase letters are fine in H15. Predicates are capitals with variables ($Fx$, $Rab$). Write the material conditional with $\to$, never `⊃` or `=>`, and English quotation marks around English sentences.

**Arguments in standard form.** Set out an argument as a two-column table with no header row, premises labeled P1, P2, … and the conclusion C (intermediate conclusions C1, C2, …):

```text
| P1 | If there is no God, then nothing is objectively wrong. |
| P2 | Some things are objectively wrong. |
| C | So there is a God. |
```

Then refer to "premise P2" in the text. State every argument so that it is valid as written: add the hidden premise it needs (an argument that is only "nearly valid" makes it impossible to say which premise a reply denies). Then each objection or reply can be matched to the premise it denies, and items that ask "which premise does this reply attack?" have one right answer. Natural deduction proofs (C1, C20 and C21) go in ```text blocks, Fitch-style: line numbers, `|` bars for subproofs, a short rule above the premises' end, and the rule names of forall x: Calgary (basic rules `R`, `∧I`, `∧E`, `→I`, `→E`, `¬I`, `¬E`, `IP`, `X`, `∨I`, `∨E`, `↔I`, `↔E`; derived rules `DS`, `MT`, `DNE`, `LEM`, `DeM`; for quantifiers `∀E`, `∀I`, `∃I`, `∃E`, `=I`, `=E` and the derived `CQ`; `¬E` takes $\neg A$ and $A$ and gives $\bot$, cited in that order; premises are marked `PR` and assumptions `AS`):

```text
1 | P → Q        PR
2 | ¬Q           PR
  |---
3 | | P          AS
4 | | Q          →E 1, 3
5 | | ⊥          ¬E 2, 4
6 | ¬P           ¬I 3–5
```

Code in prose: inline code in single backticks; blocks in fences with a language (```python, ```text). Keep code lines under 80 characters where you can (the hard limit is 100), and indent with 4 spaces, never tabs.

**The site shows no images.** Describe diagrams in words, with tables: a Venn diagram as a table of which regions are shaded or marked with an X, a truth table as a markdown table, a Kripke model as a list of worlds, the accessibility relation and what is true at each world, a spacetime diagram as coordinates and events.

Lesson file sections, in order:
- `@lesson` — `title:` (the week's topic as a clear title), `summary:` (one sentence: what the learner will be able to do), `objective:` ×2–4, `reading:` (see below).
- `@article` — markdown: paragraphs, `###` subheadings, **bold**, lists, tables, code blocks, `$math$`. Length by level (see below).
- `@example` ×1–2 — `title:`, `problem:`, `step:` ×2–6 (each step is revealed one at a time, Khan-style; a step may contain a table or a code block), optional `answer:`.
- `@mistakes` — 2–4 lines starting with `- `.
- `@practice <type>` ×5 — ordered easy → hard, each with its own cases and data: never reuse a worked example, the article's own cases or its numbers (also in code items' example calls and tests), so learners must apply the idea rather than recognize an answer they have seen.
- `@quiz <type>` ×2–3 — new problems used only in unit quizzes, the midterm and the final. Never near-copies of practice items, and never the cases of a worked example. In W and E courses, one quiz item is usually a `self` item.

## Item types

Item fields: `prompt:`, `answer:`, `check:`, `hint:` ×1–3 (progressive; the last hint gets the learner to the method but not the final answer), `solution:` (complete and short), plus the fields each type needs.

| type | learner does | you give | verified by |
|---|---|---|---|
| `num` | one number | `answer:`, usually `tol:`, and `unit:` when it helps | `check:` expression |
| `mc` | one choice | mark the correct `choice*:` | — |
| `ms` | select all that apply | mark every correct `choice*:` | — |
| `self` | writes, explains, proves or builds, then compares with a model | `solution:` (model answer) and `rubric:` ×2–4 | — |
| `code` | writes Python in an editor, runs it, presses Check | `starter:`, `tests:` and/or `stdout:`, `model:` | the validator runs `model` against your tests in CPython **and** in the browser's Python, and checks that `starter` fails them |
| `text` | types an exact short answer, usually what a program prints or a truth-table column | `answer:`, optional `accept:` ×n | `check:` that computes the same text |
| `list` | several values, any order | `answer:` (`-2, 3` or `none`) | `check:` |
| `tuple` | ordered values | `answer:` (`(2, -1)`) | `check:` |

`mc`/`ms` use `choice:` lines (3–5 total) with the correct ones written `choice*:`. **The site shuffles the choices**, so never use "all/none of the above" or "both A and B", and in hints and solutions name a choice by its content, never by its position ("the second choice", "option B"). Each `mc` item has exactly one best answer. Distractors come from real misconceptions: confusing validity with soundness or truth, necessary with sufficient conditions, the converse with the contrapositive, epistemic with metaphysical possibility, de re with de dicto readings, the A-theory with presentism, compatibilism with determinism, a view with the objection to it, which premise an objection attacks, or one philosopher's view with another's. `ms` items suit "which of these claims does this view accept?" and "which of these cases are counterexamples to this analysis?". Use `self` for argument reconstructions, objections and replies, short essays, proofs and translations to be checked by eye, thought experiments the learner builds, discussion tasks, and anything a person must judge; give a complete model `solution:` and 2–4 specific `rubric:` lines.

**What an auto-graded item may test.** An `mc`, `ms`, `num`, `text`, `list` or `tuple` item must have an answer that is correct whatever view the learner holds: what a text or a philosopher says, what a position is committed to, what follows from what, whether an argument is valid, which premise a response rejects, which case is a counterexample to which analysis, or a computed result. Never make a contested philosophical claim (that God exists or not, that physicalism is true, that moral realism is false, that a given interpretation of quantum mechanics is correct) the correct answer, and never mark a reasonable view wrong. Questions about what the learner thinks go in `self` items, whose model answers defend one view well and note the strongest reply, and whose rubrics reward the quality of the reasoning, never agreement with a position.

### Numbers (`num` items)

`num` items belong in logic (the number of truth-table rows, of rows making a formula true, of countermodels, of worlds where a formula holds), probability and confirmation (Bayes's theorem, credences, expected value), counting in formal metaphysics (mereological sums in a finite model, $2^n - 1$), set theory (cardinalities, Gödel numbers), and physics (time dilation, simultaneity, quantum probabilities, the CHSH value).
- `answer:` is a plain number: `3`, `0.95`, `-0.25`, `3/4`, `2.83`. No `%`, commas or words in the answer field. Learners may type `1,234` or `7.25%`: the site removes thousands separators, and a `%` typed into an item whose unit is `%` is ignored.
- **Percentages**: answer as a percent with `unit: %` ("Give the probability as a percent to one decimal place" → `answer: 37.5`, `unit: %`). A probability asked for as a decimal or a fraction has no unit.
- **Other units**: `unit: rows`, `unit: worlds`, `unit: sharpenings`, `unit: years`, `unit: seconds`, `unit: m`.
- **Tolerance**: whenever the prompt asks for rounding, set `tol:` to one unit of the last place asked for (two decimal places → `tol: 0.01`), so that a learner who rounds intermediate steps a little differently is still right. A `num` item without `tol:` must have an exact answer (an integer, or a terminating decimal such as `0.95` that needs no rounding).

`check:` is ONE Python expression that computes the expected result independently from the problem statement — never retype your answer. Redo the arithmetic (`0.3 * 0.9 / (0.3 * 0.9 + 0.7 * 0.2)`, `1 / sqrt(1 - 0.6 ** 2)`), use the program itself (`run(...)`), or use these helpers:
- Logic: a formula is a Python function of its sentence letters, with `implies(a, b)`, `iff(a, b)` and `xor(a, b)` available: `count_models(lambda p, q: implies(p, q))` is `3`. `tautology(f)`, `satisfiable(f)`, `contradiction(f)`, `contingent(f)` and `equivalent(f, g)` return True or False; `entails([premise, ...], conclusion)` tests validity; `count_countermodels([premise, ...], conclusion)` counts the rows that make every premise true and the conclusion false; `tt_column(f)` gives a column such as `'TFTT'` in the standard row order (all letters true first, the last letter alternating fastest); `tt_rows(n)` lists the rows; `product` is `itertools.product`. All formulas in one call must take the same letters in the same order.
- General: `math`, `comb`, `perm`, `factorial`, `sqrt`, `exp`, `log` (natural), `log10`, `floor`, `ceil`, `Fraction`, `statistics`, `itertools`, and builtins such as `sum`, `range`, `min`, `max`, `round`, `len`, `sorted`, `set`, `int`, `abs`, `all`, `any`, `zip` and `enumerate`.
Only when an item truly cannot be computed, write `nocheck: <reason>` (at most six per course).

### `code` items (C2, C20, C21 and P4 only)

```
@practice code
prompt: Write `models(f, n)` that returns how many rows of the truth table make `f` true, where `f` is a function of `n` truth values (each `True` or `False`). For example, `models(lambda p, q: p or q, 2)` returns `3`.
starter:
```python
def models(f, n):
    pass
```
tests:
```python
assert models(lambda p, q: p or q, 2) == 3
assert models(lambda p: p and not p, 1) == 0
assert models(lambda p, q, r: p or q or r, 3) == 7
assert models(lambda: True, 0) == 1
```
model:
```python
from itertools import product

def models(f, n):
    """Count the rows of the truth table on which f is true."""
    return sum(1 for row in product([True, False], repeat=n) if f(*row))
```
hint: `itertools.product([True, False], repeat=n)` produces every row.
solution: Generate every assignment of truth values with `product`, call `f` on each row with `*row`, and count the rows that come out true.
```

- `starter:` (optional) is the code the editor starts with: usually the function header and `pass`. It must compile and must **fail** the tests. `model:` is your complete reference solution. Each of `starter`, `tests`, `model`, `stdin`, `stdout` holds exactly one fenced block.
- `tests:` is Python run after the learner's code, in the same namespace. Each top-level `assert` is one test: the learner sees a ✓ or ✗ beside each one, and a failing `assert expr == expected` automatically reports what the code gave and what was expected, so prefer `assert f(x) == value` over clever conditions. Write 3–6 asserts: the main case, edge cases (an empty set, a formula with no letters, a model with one world, a reflexive loop) and one case a typical wrong solution gets wrong (treating the conditional as "and", a box evaluated at the current world instead of the accessible ones, forgetting worlds with no successors).
- **Representations.** State the representation in the prompt and keep to it within a lesson. Good choices: formulas as nested tuples (`('->', ('atom', 'P'), ('not', ('atom', 'Q')))` or `('imp', 'P', ('not', 'Q'))`), valuations as dictionaries (`{'P': True, 'Q': False}`), finite models as a domain set plus dictionaries or sets of tuples for predicates and relations, Kripke models as a set of worlds, a set of `(w, v)` pairs for accessibility and a dictionary from worlds to the set of letters true there.
- **Results with no fixed order.** Sets have no fixed order, so tests compare sets or sorted lists (`assert sorted(f(x)) == [...]`), never a printed set or a list built from one.
- `stdout:` (optional) is the exact text the program must print, for "write a program that prints …" exercises (a truth table); trailing spaces and trailing blank lines are ignored, everything else must match. `stdin:` (optional) holds the lines that `input()` returns, one per line; `input()` does not echo what it reads, so the expected output contains the prompt text but not the typed line. **A program that reads input must be checked on two or three different inputs**: repeat `stdin:` and `stdout:` as pairs, in order, each holding one fenced block. The first pair is shown to the learner and used by the Run button; the others are hidden checks.
- Helpers available to learner code and tests: `output()` returns the text printed since the tests began or since the last `output()` call; `write_file(name, text)` and `read_file(name)` set up and inspect files, and the learner's `open()` works on these in-memory files in text mode; `raises(ExcType, func, *args)` is True when the call raises that exception.
- `solution:` explains the approach in words. **The site shows your `model:` code right after the solution**, so do not paste the whole model again.
- The prompt must specify everything the tests check: the function name and parameters, the representation of formulas and models, the return value (returned, not printed, unless the exercise is about printing), how to treat edge cases, and anything not allowed. Give one example call in the prompt when it helps.
- Good code: idiomatic, readable, PEP 8, docstrings for public functions in college and graduate courses, type hints welcome in model solutions (tests must not depend on them). Recursion over formulas is natural and fine; keep the recursion depth small.
- Keep the work small: model plus tests must finish in well under a second in the browser, which is about 20–50 times slower than CPython. A truth table over up to about 10 letters, all frames on up to 3 worlds ($2^9 = 512$ relations), or a Turing machine run of a few thousand steps is fine. No timing-based tests.
- **What the browser's Python can run.** It is Brython, implementing Python 3.14, and it also has to pass under CPython 3.13, so use features common to both. Available: the whole core language (classes, dataclasses, generators, comprehensions, `match`, f-strings, exceptions, `with`, `enum`, `typing`) and most of the standard library: `itertools`, `functools`, `collections`, `fractions`, `math`, `statistics`, `random`, `string`, `re`, `json`, `copy`, `operator`, `textwrap`, `unittest`. **Not available in the browser**: `numpy`, `sympy` and every other third-party package; `sqlite3`; threads and `asyncio`; networking. Code items therefore use plain Python.
- **Tests must give the same result in any Python**: never test specific random values, set iteration order or the printed form of a set, default object reprs, object ids, the exact wording of a built-in error message (test the exception type with `raises`), or anything that depends on the date or time.
- Every lesson in C2 (a programming course) has at least two `code` items among its practice and quiz items. C20, C21 and P4 have a `code` item in about half of their lessons, where the topic is naturally programmed (set operations, bijections and enumerations, diagonalization, Turing machines, Gödel numbering, Kripke model checking, frame conditions, finite mereological models), and `text` items that trace small programs.

### `text` items

For "what does this program print?" and truth-table columns:

```
@practice text
prompt: Fill in the main column of the truth table for $(P \to Q) \wedge \neg Q$, with the rows in the standard order TT, TF, FT, FF for $P$ and $Q$. Type four letters, T or F, with no spaces.
answer: FFFT
check: tt_column(lambda p, q: implies(p, q) and not q)
hint: Work out $P \to Q$ and $\neg Q$ on each row, then combine them with "and".
solution: $P \to Q$ is T, F, T, T and $\neg Q$ is F, T, F, T, so the conjunction is true only on the last row: F, F, F, T.
```

- The learner's text is compared with `answer:` line by line after trimming each line and treating any run of spaces as one space; capital letters and punctuation matter. Multi-line answers go in a fence. `accept:` lines give other forms that are also correct, but keep answers unambiguous: say exactly what to type.
- `check:` must reproduce the answer independently: `run(src)` runs Python (CPython 3.13) and returns what it prints, and `run(src, stdin)` feeds input lines; copy the program exactly from the prompt into the check as a Python string with `\n` line breaks. `tt_column(...)` gives truth-table columns.
- Prefer `mc` for names and terms (which fallacy, which philosopher, which rule): spellings vary, and a learner who knows the answer should not be marked wrong for a hyphen.

## Writing for each level

- **Elementary (K10).** The learner is a child with an adult helper who reads aloud. Short sentences, everyday words, one idea at a time, and things a child can see and do: a picture book read together, drawings, sorting cards, acting out a story, a family "philosophy circle" where everyone gives a reason. Articles 150–350 words; examples with 2–4 steps; almost no TeX. Auto-graded items test thinking skills with clear answers: which sentence gives a reason (the one with "because"), which question is a big question with no easy answer, which two things are the same in a stated way, how many equal shares make a fair split (`num`, exact). Open questions ("Can a dog be happy?") go in `self` items for the adult, whose rubric accepts any answer with a reason and rewards listening to others. Keep every topic gentle and safe: no frightening scenarios, nothing about death beyond what a picture book for young children would say, and never ask a child about private family matters, the family's beliefs or religion. No code.
- **Middle school (J9, J10).** Articles 250–450 words; clear, encouraging, concrete before abstract, with situations from school, games, friends, ads and news. J9 (T): `mc`/`ms` on premises and conclusions, validity and fallacies, and simple `num` items on samples and chances. J10 (W): short readings retold in plain words, `mc`/`ms` on what each view says, and short `self` writing tasks. On God and religion, present the main arguments for and against fairly and respectfully, and never ask learners to reveal their own beliefs.
- **High school (H14, H15, H16).** Articles 300–600 words. H15 is formal and numerical: standard form, Venn diagrams described as tables, translation into symbols, truth tables (`text` items for columns, `num` items for counting rows and models, `mc` for validity), and inductive and causal reasoning with simple numbers. H14 and H16 work like a good first-year college course: primary texts retold accurately with short public-domain quotations where you are sure of the wording, arguments in standard form, objections and replies, and `self` essay tasks with model answers.
- **College (C1–C21).** Articles 400–800 words; university-level precision, as in a good undergraduate philosophy course. Every lesson sets out at least one argument in standard form and evaluates it: which premises are doing the work, the best objection and the best reply. History courses explain what the text says and argues, with standard locations you are sure of (Meditation II, Republic Book VII, Treatise 1.3.6, the Critique's B-edition Transcendental Deduction), and distinguish exegesis from evaluation. Logic courses (C1, C2, C20, C21) and C14 are rigorous and numerical: definitions, proofs in full, worked derivations with every step, and checked numbers. Cases and examples are invented ("Ana's watch", "the planet Lumen") unless they are the standard thought experiments of the literature, which you describe in your own words.
- **Graduate (P1–P6).** Articles 450–850 words, written as a faculty member coaching a graduate student: the shape of the current debate, the main positions with accurate attributions, the arguments that drive it, open problems, and how to read and contribute to the literature. `self` items are seminar work (a response paper paragraph, an argument reconstruction, an objection and reply, an abstract, a referee report paragraph, a prospectus section, a timed exam answer) with model answers that a faculty reader would admire and rubrics that name what earns credit. `mc`/`ms` items test distinctions, commitments, formal results and what a well-known paper argues. P4 is formal: proofs, models, `num` and `code` items. P5 and P6 teach research practice and the milestones of a PhD accurately: programs differ, so describe common practice and tell learners to check their own program's rules.

## Content standards

- **Correct above all.** Precise definitions and true statements; arguments stated in their standard forms; logic results stated exactly (soundness, completeness, compactness, Löwenheim-Skolem, the incompleteness theorems, which axiom corresponds to which frame condition); proofs that are correct line by line; arithmetic you have checked (run it with `python3 -c`). Do not invent principles, results, rule names, dates or terminology; when unsure, choose a statement you know is true.
- **Attribution.** Attribute a view or argument to a philosopher only when you are sure that philosopher held or made it, in the form you give. Standard attributions are fine (Descartes's cogito, Hume's problem of induction, Kant's synthetic a priori, Frege's sense and reference, Russell's theory of descriptions, Quine's criterion of ontological commitment, Gettier's counterexamples, Kripke's rigid designators and the necessary a posteriori, Lewis's modal realism, Jackson's knowledge argument, Searle's Chinese room, Chalmers's hard problem, Frankfurt cases, van Inwagen's consequence argument, Parfit on fission and what matters). When you are unsure who first made an argument, or in which work, describe it without the name ("a classic objection holds…"). Never invent a quotation, a title, a date or a citation. Describe living philosophers only through their well-known published positions, and never attribute personal beliefs, motives or private life to anyone. Report interpretive disagreements about historical figures as disagreements ("on one reading, Kant's things in themselves are…").
- **Quotation.** Paraphrase by default. You may quote a sentence or two from a work in the public domain (ancient, medieval and early modern texts in translations published before 1929, such as Jowett's Plato or Meiklejohn's Kant, and works first published before 1929), only when you are certain of the exact wording, and with its location. Never quote modern works, modern translations or modernized versions (including the Early Modern Texts versions and every encyclopedia entry): paraphrase them and say where the idea appears. Do not reproduce textbook passages, exercises or exam questions from the readings; write original items.
- **Balance on contested questions.** On questions where informed philosophers disagree (God, the mind-body problem, free will, personal identity, moral realism, the nature of time, abstract objects, the interpretation of quantum mechanics, whether AI systems could understand or be conscious), present the strongest version of each main position and the best objections to each, and do not tell the learner which view is true. You may say where the field stands using the figures below, but say clearly that the share of philosophers who hold a view is not evidence that it is true. Treat religious traditions and believers of every faith and none with respect; describe traditions accurately, in their own terms, without caricature. World philosophies (C19 and elsewhere) are philosophy with arguments to reconstruct and evaluate, not exotic curiosities.
- **Where the field stands.** In the 2020 PhilPapers Survey of professional philosophers (1,785 respondents, fewer on each question; figures are the percentages who accept or lean toward each view, and respondents could choose more than one option or none, so they need not add to 100): abstract objects, Platonism 38% and nominalism 42%; free will, compatibilism 59%, libertarianism 19% and no free will 11%; God, theism 19% and atheism 67%; mind, physicalism 52% and non-physicalism 32%; time, the A-theory 27% and the B-theory 38%; personal identity, the psychological view 44%, the biological view 19% and the further-fact view 15%; laws of nature, non-Humean 54% and Humean 31%; zombies, metaphysically possible 24%, conceivable but not metaphysically possible 37% and inconceivable 16%; metaethics, moral realism 62% and anti-realism 26%; normative ethics, virtue ethics 37%, deontology 32% and consequentialism 31%; knowledge, empiricism 44% and rationalism 34%; the external world, non-skeptical realism 80%, skepticism 5% and idealism 7%; quantum mechanics (only 556 answered), hidden-variables 22%, many-worlds 19%, collapse 17% and epistemic 13%; consciousness, functionalism 33%, dualism 22%, identity theory 13%, panpsychism 8% and eliminativism 5%. The survey's own pages caution against comparing these figures directly with its 2009 survey. Use rounded figures as here, only where they help, and never in an item whose answer a learner would have to memorize.
- **Current facts to teach as current** (verified; use them where your course touches them):
  - **Physics.** Experiments with entangled particles violate Bell inequalities, as quantum mechanics predicts; tests in 2015 closed the main loopholes together, and the 2022 Nobel Prize in Physics recognized experiments with entangled photons that established violations of Bell inequalities. For the CHSH quantity, local hidden-variable theories give $|S| \le 2$ and quantum mechanics allows up to $2\sqrt{2} \approx 2.83$ (Tsirelson's bound). The measurement problem has no agreed solution, and physicists and philosophers still disagree about the interpretation of quantum mechanics. Special relativity is extremely well confirmed (time dilation is measured with fast-moving particles and with atomic clocks in aircraft and satellites, and GPS must correct for it). The speed of light in vacuum is exactly 299,792,458 m/s, by the definition of the meter. Gravitational waves were first detected directly in 2015. On the standard cosmological model, the universe is about 13.8 billion years old. There is no accepted theory of quantum gravity; whether spacetime is fundamental or emergent is open.
  - **Logic and mathematics.** Russell's paradox (found in 1901, communicated to Frege in 1902); Gödel's completeness theorem for first-order logic (1929–1930) and incompleteness theorems (1931); Turing's analysis of computability and the unsolvability of the halting problem (1936); standard set theory is ZFC, and the continuum hypothesis is independent of ZFC (Gödel 1940, Cohen 1963).
  - **Artificial intelligence.** As of 2026 there is no scientific or philosophical consensus on whether any AI system understands, is conscious or has moral status, or on what would settle it; leading theories of consciousness give different verdicts, and the question is actively researched. Present the arguments; never state that current AI systems are or are not conscious or understanding as settled fact, and do not name commercial AI products or companies.
  - **The profession.** The Stanford Encyclopedia of Philosophy and the Internet Encyclopedia of Philosophy are free, peer-reviewed online encyclopedias; PhilPapers is the main index of philosophical research; PhilJobs is the field's main job listing site; the American Philosophical Association is the main professional organization in the United States. In the United States a philosophy PhD usually takes about five to seven years, with coursework, a qualifying or comprehensive requirement that varies by program, a prospectus and a dissertation; many programs fund their students. The academic job market in philosophy is highly competitive, with far more new PhDs than permanent academic positions in most years, and many philosophy PhDs build careers outside academia. Say that requirements and market conditions vary and change, and send learners to their own program and the APA for current information.
- **Sensitive topics.** Death, the meaning of life, free will skepticism, skepticism about the external world and arguments about God can unsettle some learners: treat them seriously and calmly, and present them as live questions that thoughtful people answer in different ways. Keep applied ethics to the syllabus topics, present each view fairly, and avoid graphic detail.
- **Khan-style teaching:** a puzzle or concrete case first, then the precise statement; short paragraphs; worked examples whose steps each do one thing (find the conclusion, find the premises, add the hidden premise, check validity, assess each premise, raise an objection, reply); for formal work, show each step and the rule it uses.
- **Course profile** (in your course JSON): T theory — `num`, `text` and `mc` items on proofs, truth tables, models and computations are the backbone, with `ms` on concepts, `self` items for proofs, translations and explanations, and `code` in C20 and C21 where noted. W reading and writing — `mc`/`ms` on what texts and positions say, distinctions, which premise an objection targets and which case refutes which analysis, and `self` items for reconstructions, objections and replies and short essays, with model answers and rubrics. P programming (C2) — `code` items are the backbone (at least 2 per lesson), plus `text` tracing items and `num` items on the logic. E research practice (P5, P6) — `self` items for research and writing tasks with model answers and rubrics, and `mc`/`ms` on research norms, citation, academic integrity and the content being reviewed. Y young learner — see the elementary level.
- Each lesson's practice + quiz items include at least 3 auto-graded ones (not `self`).
- Where natural, one item in a block's second-week lesson exercises that block's deliverable (in your course JSON).
- Every item is self-contained: restate any argument, case, passage, formula, model or code it needs. Never write "the previous problem", "the example above" or "as above" in an item, because items appear alone in practice sessions and exams.
- **reading:** name the part of the course's primary reading to study that week (a chapter, a section, an encyclopedia entry or a primary text with its section) only if you are confident it exists there under that name; otherwise name the topic to look up in that resource. No URLs anywhere.
- Week 7 is an ordinary lesson; the site schedules the midterm itself.

## project.txt

- `@project` — `title:`, `overview:` (2–3 sentences), `goal:` ×2–4, `step:` ×4–8 (a concrete plan), `deliverable:` ×2–4, `rubric:` ×3–6, optional `safety:`, `tutor:` ×2–3 (good questions to ask the AI tutor while doing the project). Base it on the syllabus project. Any supplied passages, cases, arguments or data the project needs must be written out in `material:` fields (one per item; markdown tables and code fences allowed), placed after the steps; a supplied passage must be your own writing or a short public-domain text whose wording you are sure of. Never put text after the `tutor:` lines: it would become part of the last tutor question. Projects are done on the learner's own computer or on paper, so they may use any tool the course teaches; when a project needs sources, tell the learner to find them through the course reading, the encyclopedias and PhilPapers, and to cite what they use.
- `@review` — markdown week-13 review guide: the course's key ideas week by week, the key arguments and distinctions (or formulas and rules), a self-check list, and the most common errors. 250–600 words (elementary 120–300).
- `@exam <type>` ×3 — cumulative final-exam problems that connect several weeks; at least one auto-graded; same fields and checks as practice items. In W and E courses, one is usually a `self` essay question with a model answer and rubric.

## Workflow

1. Read your course JSON and the example lesson(s), once each. Do not open any other file: not the site's code, the validator, the toolkit scripts or other courses. Everything you need is in this brief. Do not run experiments before writing; write, then let the validator tell you what to fix. (You may run a short Python snippet with `python3 -c` to compute a number, check a truth table or confirm what a program prints before you put it in an item.)
2. If some of your lesson files already exist (you may be resuming), run the validator first and continue with the missing ones. Never rewrite a lesson that already passes.
3. Write two lessons per message (two Write calls), in week order, then project.txt. Do not read your files back after writing them.
4. After every four lessons, run `python3 /home/claude/metaphysics/toolkit/validate.py <CODE>` and fix every ERROR in the files you have written (ignore "file missing" for files you have not written yet). Fix errors with Edit, using the reported line numbers. When all files exist, rerun until it reports 0 errors. In the logic courses the validator runs every `code` item's model solution in a headless browser, so it can take a minute or two.
5. Finish with a message of at most five lines: the validator result, the item count, any `nocheck` items, and any topic where you are unsure of accuracy. Do not paste lesson content.

Work only inside your course folder. Do not modify the toolkit, install packages or browse the web.
