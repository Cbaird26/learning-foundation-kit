# Writer runs (Mathematics Learning Foundation)

Template (sonnet, background):
Write course CODE (TITLE) of the Mathematics Learning Foundation. Read /home/claude/math/toolkit/BRIEF.md first and follow it exactly; your course data is /home/claude/math/toolkit/courses/CODE.json. Write only /home/claude/math/content/CODE/L01.txt to L12.txt and project.txt. LEVEL_NOTE COURSE_NOTE When all 13 files exist, run python3 /home/claude/math/toolkit/validate.py CODE until it reports 0 errors, then python3 /home/claude/math/toolkit/retype_check.py CODE and turn any listed item that only re-types an article function into a variant, then finish with the short report the brief asks for.

Level notes:
- college, T: University level, proof-based: every definition, theorem statement, proof and computation must be correct (check each computation with python3 -c, and test each claimed counterexample in code before you use it); prove the central results in full; add a code item in about half the lessons where computation illuminates the theory.
- college, P: University level, programming and computation: at least two code items in every lesson (usually three), each implementing or testing the week's idea from scratch in plain Python, with float comparisons inside a tolerance and exact arithmetic (integers or fractions.Fraction) where exactness matters; prove the correctness or the error bound of each central algorithm; check every number with python3 -c.
- professional: Graduate level, qualifying-exam preparation: theorems stated exactly with all hypotheses, complete proofs of the central results, the standard examples and counterexamples; self items are qualifying-exam problems with complete model proofs a faculty grader would accept and rubrics that name what earns credit; attribute only results you are sure of; check every computation with python3 -c.

Course notes:
- C9: C3 already taught matrix computation; focus on abstract vector spaces, linear maps and proofs, with code for exact row reduction (Fraction), Gram–Schmidt and the power method.
- C10, C11, P2: in code, a permutation of {0, ..., n-1} is a list p with p[i] the image of i (state it); in prose use 1-based cycle notation; small groups and finite fields as integers or tuples with a stated rule.
- C12, C13: C8 (real analysis I, on the line) is the prerequisite; in C13 use Python's built-in complex type and math in graded code, never cmath (it may be missing in the browser).
- C14, P3, P4: code where natural only (finite topologies as lists of sets, homology ranks over the rationals with Fraction); most items are proofs, counterexamples and computations.
- C15: integers in graded code below about 10^30; randomized algorithms take their random choices as a supplied list; toy RSA keys only.
- C16: the example lesson uses induction and the domino-tiling recurrence: use different recurrences, functions and data.
- C17, C19: floating-point results compared with tolerances; orders of convergence and Lyapunov exponents estimated from supplied or computed sequences; simulations of at most a few thousand steps.
- C18: numerical checks with stated step sizes and tolerances.
- C23: original problems only (never from competitions, textbooks or exams); code optional.
- P7: E profile, no code; qualifying exams and programs differ; no salary figures, job-market claims or recent prize winners.

Reused, not rewritten: K1–K11, J1–J9 and H1–H14 from the AI Learning Foundation (its K–12 with the programming track); C1–C4, C6–C8 and C20 from the ToE Learning Foundation (M2, M3, M4, M6, M5, M7, M9a renamed Real analysis I, M8b); C5 from the AI school (C2, Discrete mathematics); C21 from the Metaphysics school (C20, Intermediate logic); C22 from the Coding school (C11, Theory of computation). 45 courses; all validate with 0 errors here after small fixes: two "M2" references in C2 changed to "Calculus II", three self solutions in C7 with a code fence opened on the solution line, and two dollar-sign false alarms in C1 and C4.
New: C9–C19, C23 and P1–P7 (19 courses).
Runner: Brython 3.14.3 (BSD) in a Web Worker; same build as the AI and neuroscience schools.

Log:
- Setup (Nov 9): owner chose "Math to PhD quals" and "Yes, for computation"; pipeline copied from the neuroscience school; curriculum in work/curriculum.py (64 courses); storage prefix mathlf; readings checked online (Axler LADR and MIRA, Hammack, Judson, Lebl, Beck and colleagues, Morris, Stein, Keller and Trotter, Driscoll and Braun, Ghomi, MIT OCW 12.006J, Milne, Hatcher, Gualtieri, Durrett, arXiv); example lesson toolkit/example_math_lesson.txt (proof by induction, validated in CPython and the browser); BRIEF with notation, proof standards, standard attributions and checked current facts (largest known prime 2^136279841 − 1, checked Nov 9, 2026); REVIEW template adapted; app rebranded (scratchpad runs a prime sieve and checks Goldbach below 100, "evidence, not a proof"); trial build 12.2 MB with the 45 reused courses, no page errors.
- Team mode (Nov 9): the kit gained AGENTS.md and TEAM.md (Nov 8, from another Claude session): Claude leads, and the owner chose to split the 19 new courses three ways. Claude writes C9–C12, C23, P1 and P7 (reviewed internally here, then by Codex); Codex writes C15–C17, C19, P5 and P6 (reviewed by Grok); Grok writes C13, C14, C18 and P2–P4 (reviewed by Claude). Kit sync changed so that course content from other agents' merged pull requests is never overwritten (own_courses.txt lists the courses the lead may push).
- started C9, C10, C11, C12, C23, P1, P7
- P7 done (0 errors, 96 + 3 exam, no code items; Huang 2019, Gotsman–Linial, Nisan–Szegedy, Mihăilescu 2002, Faltings 1983 and the arXiv endorsement point passed to the reviewer as correct); internal review started P7
