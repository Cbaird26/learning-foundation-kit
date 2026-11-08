# Writer runs (AI Learning Foundation)

Template (sonnet, background):
Write course CODE (TITLE) of the AI Learning Foundation. Read /home/claude/ai/toolkit/BRIEF.md first and follow it exactly; your course data is /home/claude/ai/toolkit/courses/CODE.json. Write only /home/claude/ai/content/CODE/L01.txt to L12.txt and project.txt. LEVEL_NOTE COURSE_NOTE When all 13 files exist, run python3 /home/claude/ai/toolkit/validate.py CODE until it reports 0 errors, then finish with the short report the brief asks for.

Level notes:
- college, P: University level, programming and modeling: at least two code items in every lesson (usually three or four), each building the week's algorithm from scratch in plain Python on tiny invented data, with float comparisons inside a tolerance; every derivation and number must be correct (check each with python3 -c).
- college, T: University level, theory: every definition, derivation, theorem statement (with its conditions) and number must be correct; check each computation with python3 -c; add a code item in about half the lessons where the topic is naturally programmed.
- college, W: University level, reading and writing: exact definitions and correct computations; describe laws and standards only as the brief's list of current facts says, with their dates; on contested questions present the strongest version of each main view and never make one the right answer.
- professional: Graduate level: an accurate, fair picture of each research area; attribute only results you are sure of; teach concepts and well-established results, never the current state of the art or current commercial models; self items need model answers a faculty reader would admire and specific rubrics.

Course notes:
- C12: Weeks 5–6 cover gradient descent, the topic of the example lesson: use entirely new functions, data, numbers and exercises.
- C15: Week 1 covers linear regression by gradient descent, next to the example lesson's topic: use multi-feature models, new data and new exercises.
- C11: Learners know Python and linear algebra but have not written numerical code; explain floating point carefully, and keep matrices tiny (at most 4 by 4 in code items).
- C14: Data comes as small CSV text written with write_file in tests, or as lists of dictionaries; charts are described in words and tables.
- C17, C18: Code items build networks from scratch with tiny sizes (a few neurons, a few examples); trace computations by hand in num and text items.
- C19: Use invented sentences and a short public-domain passage for corpora; keep vocabularies tiny.
- C20: Images are small grids of integers (at most 8 by 8 in code items).
- C21: Use tiny MDPs and gridworlds (at most 5 by 5) written out in full.
- C23: No code items; computations (fairness metrics, the Laplace mechanism, audit statistics) are num items. Present AI-risk and policy debates even-handedly; follow the brief's current facts on laws exactly.
- C24: Engineering practice in plain Python (validation functions, tests, drift statistics, quantization arithmetic); describe infrastructure tools generically, without naming commercial services.
- P3, P4: Fast-moving fields: concepts and established results with their papers and years from the brief's list; never the current state of the art, leaderboards or current commercial models; say which questions are open.
- P5, P6: Research practice; describe common practice and say that programs, venues and rules differ.

Reused, not rewritten: K1–K11, J1–J10 and H1–H15 from the Coding Learning Foundation (J1, H11 and H13 in their corrected Finance versions), and the CS core renumbered: C1–C5 (same), C6 = Coding C14, C7 = C15, C8 = C16, C9 = C18, C10 = C19 (46 courses; all validate with 0 errors here after two position-reference fixes).
New: C11–C24 and P1–P6 (20 courses).
Runner: Brython 3.14.3 (BSD) in a Web Worker; same build as Finance and Metaphysics.

Log:
- Setup (Nov 7): pipeline copied from Metaphysics (newest validator); curriculum in work/curriculum.py; storage prefix alf; example lesson toolkit/example_ml_lesson.txt (gradient descent for a one-parameter model, validated, P-style with 2 code items); BRIEF with ML notation, plain-Python code rules, standard attributions and verified current facts (EU AI Act and the 2026 Digital Omnibus dates, US executive orders, California SB 53, NIST AI RMF).
- AI school: reused courses validated under the newest validator (44 ok); fixed two position references in reused C8 L04 and C9 L07 (same issue remains in the Coding school's C16 L04 and C18 L07).
- batch 1 (Nov 7): C11 C12 C13 C14 C15
- C14 done (0 errors, 4 long-line warnings, 96 + 3 exam, no nocheck; datasheets 2018 checked); review started C14; started C16
