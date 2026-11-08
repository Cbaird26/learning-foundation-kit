# Writer runs (Coding Learning Foundation)

Template (sonnet, background):
Write course CODE (TITLE) of the Coding Learning Foundation. Read /home/claude/code/toolkit/BRIEF.md first and follow it exactly; your course data is /home/claude/code/toolkit/courses/CODE.json. Write only /home/claude/code/content/CODE/L01.txt to L12.txt and project.txt. LEVEL_NOTE When all 13 files exist, run python3 /home/claude/code/toolkit/validate.py CODE until it reports 0 errors, then finish with the short report the brief asks for.

Level notes:
- elementary: This course is for a young child with an adult helper who reads aloud; follow the brief's elementary guidance for this course exactly, and keep every program and expected output tiny and exactly right.
- middle/high: Every code sample must run and do what the text says; write code items with precise prompts and tests that catch the common wrong answers.
- college: University level. Every code sample, command, number and technical statement must be correct; programming items are verified by running them, so write precise specifications and strong tests, and follow the brief's list of current facts.
- professional: Practical, current and written as a senior engineer coaching a new hire; self items need complete model answers and specific rubrics; follow the brief's list of current facts.

K–12: 30 courses reused from the Med School Learning Foundation (already reviewed).
Runner: Brython 3.14.3 (BSD) in a Web Worker; harness src/pyharness.py; build scripts/pyworker.py; browser check toolkit/pycheck.py.

Log:
- batch 1 (Nov 5): K11 J9 H14 C1 C2 C4 C9 P4
- K11 done (0 errors, 84 items + 3 exam; no nocheck); started K10; review started K11
- K11 reviewed (4 fixes; quiz items moved off article data, SyntaxError wording; unsure: stdout-only items accept hard-coded prints — fine at this level)
- started H15 C5
- J9 done (0 errors, 84 items + 3 exam; weeks 1–8 code items use stdin/stdout before functions); started J10; review started J9
- J9 reviewed (1 fix: example restated the article program; unsure: stdin/stdout-only items test one input)
- K10 done (0 errors, 87 items, unplugged, no nocheck; possible week 7 materials mismatch passed to reviewer); started C3; review started K10
- K10 reviewed (3 fixes; week 7 materials now ten cards, robot "turn" wording, accept: lines for child-likely answer forms)
- Brython fixes found by writers: "".split() gave [''] and rsplit() without a separator failed; replaced both in scripts/pyworker.py (34/34 cases match CPython); emoji were garbled in runner output by Brython's json ensure_ascii, fixed in the harness; a transport turned \u escapes into raw U+2028/2029 for ~3 minutes (worker briefly unloadable), fixed by building escapes from code points
- C1 done (0 errors, 84 + 3 exam, text-analyzer project spec in materials); H14 done (0 errors; L11 privacy reading line generic); P4 done (0 errors, 85 items; L12 salary figures illustrative); C2 done (0 errors; terse self proofs flagged); C4 done (0 errors, 87; AVL bound, CPython growth factor, ODS chapter numbers flagged); C9 done (0 errors, 85; Reno model simplified); J10 done (0 errors, 84, 17 code items)
- reviews started C1 H14 C2 (queued: P4 C4 C9 J10); started C6 C7 C8 C10
- format: code items may now repeat stdin:/stdout: pairs (hidden extra input cases); validator warns on single-input programs; BRIEF updated
- H14 reviewed (9 fixes; float gap 3e-17, list methods returning None, Timsort worst case, project skipped-lines wording, random.shuffle)
- C1 reviewed (6 fixes; quiz items moved off example data, empty-string test, O(n) wording)
- C2 reviewed (14 fixes; tree unique-path proof and exam induction made rigorous, RSA prime-modulus step, multigraph note, extra asserts)
- H15 done (0 errors, 84 + 3 code exams)
- fixer started for J9 (11 items) and C1 (1 item) stdin cases; reviews started P4 C4 (queued: C9 J10 H15); started C11 C12
- fixer: J9 11 items and C1 1 item now have 2–3 extra hidden input cases (0 warnings)
- end-to-end check (44 courses embedded): 179 routes, 301 Try-it buttons, 0 KaTeX errors, 0 page errors
- review started C9 (queued: J10 H15)
- C5 done (0 errors, 84 + 3; hand-written proofs flagged for review; reading lines by topic); started C13
- P4 reviewed (10 fixes; ambiguous two-sum data and pair_sum test, sliding-window trace, cliff vesting wording, illustrative-figure labels, ladder begin==end, cycle assert)
- C3 done (0 errors, 2 nocheck: git restore --staged, python3 -m venv; Makefiles use .RECIPEPREFIX — to be changed to real tabs in review since macOS make 3.81 lacks it)
- review started J10 (queued: H15 C5 C3); started C14
- browser check page (all 9 runner checks pass in Chromium) staged for a Safari test on the Mac
- container restart (~05:00–21:30 ET): writers C6 C7 C8 C10 C11 C12 C13 C14 and reviews C9 (1 fix) J10 (5) H15 (3) finished during it; revalidating all
- Safari 26.3 on the Mac: browser Python check page passed all 9 checks (start 2.7 s, loop stopped at 6 s, restart, recursion); default browser is Brave (Chromium, same engine as the headless tests)
- revalidated after restart: all 21 new courses written so far at 0 errors (C3 C7 C8 have 2 nocheck each)
- C6 C7 C8 C10 C11 C12 C13 C14 done; C9 reviewed (1 fix), J10 reviewed (5), H15 reviewed (3)
- started C15 C16 C17 C18 C19 C20 C21 P1; reviews started C5 C3 (Makefile tabs) C6 (queued: C7 C8 C10 C11 C12 C13 C14); left to start: P2 P3 P5 P6
- started P2 P3 (left to start: P5 P6)
- C3 reviewed (8 fixes; Makefiles now real tabs (checked: make parses all four), HEAD~2 quiz replaces example copy, git status -sb wording, accept: git restore -S)
- review started C7 (queued: C8 C10 C11 C12 C13 C14)
- C6 reviewed (2 fixes; alu and/or asserts, MemToReg don't-care wording; all encodings, caches and project simulations recomputed and correct; load_use_stalls rule matches the textbook hazard-detection unit, left as is)
- review started C8 (queued: C10 C11 C12 C13 C14)
- C5 reviewed (18 fixes; BFS, Kruskal exchange, max-flow min-cut and inversion proofs made rigorous; knapsack, maze and Ford-Fulkerson tests added; quiz items moved off example data)
- C7 reviewed (5 fixes; pointer comparison UB wording, link duplicate-symbol and classify_access spanning asserts, quiz items off article data); follow-ups by me: L10 example title, L11 `_exit` is the system call, L04 `==` compares addresses
- C8 reviewed (4 fixes; week reference, STCF and page-fault EAT quiz data, L12 reading line); follow-up by me: project review guide now says when SJF and STCF are optimal (matches the L03 mistakes list)
- reviews started C10 C11 C12 (queued: C13 C14, then C15-C21 P1-P3 P5 P6 as written)
- C10 reviewed (8 fixes; alias-in-WHERE labeled standard SQL vs SQLite, BCNF and write-skew quiz items off article data, self-contained schedule and log formats, Q10 average over all members, CHECK constraint does not stop the lost update); follow-ups by me: SQLite NULL in PRIMARY KEY note, Q13 ties
- review started C13 (queued: C14, then C15-C21 P1-P3 P5 P6 as written)
- C12 reviewed (8 fixes; associativity sentence, leftover tokens, quiz items off example data, typed() tuple entries, project bool/int check); follow-ups by me: Java lambdas wording, `not` precedence note in the Mini spec
- C15 done (0 errors, 87; PageRank and least-squares numbers computed with numpy); C16 done (0 errors, 84 + 3; Chernoff forms, sample-size formula and t values flagged for review)
- started P5 P6 (all 33 writers started); review started C14
- C13 reviewed (11 fixes; Little's law lead vs cycle time, rules of thumb labeled, extra asserts); follow-ups by me: "code is read far more often than written", relative-sizing claim hedged
- C11 reviewed (8 fixes; star construction epsilon move, 1^(n^2) and a^nb^nc^n pumping proofs completed, a^nb^nc^n TM stage 1, self-contained prompts, negative-index test); follow-ups by me: Cook-Levin 3SAT as refinement, HAMPATH with s and t, A_CFG empty string
- P1 done (0 errors, 84; tool command forms flagged); C21 done (0 errors, 84; van Steen chapter numbers flagged); P2 done (0 errors, 84; Cosmic Python chapter numbers flagged); C19 done (0 errors, 84; EU AI Act and fairness wording flagged); C17 done (0 errors, 85; CVSS bands, 90-day convention, GDPR 72 h, TLS RTT flagged)
- reviews started C15 C16 C17 C19 C21 P1 P2 (8 reviewers while 5 writers run)
- C14 reviewed (8 fixes; comparison-test mistake wording, float equality in tests, max_iter and new-list asserts, Lagrange remainder hypotheses, quiz off article limit, independent exam check); follow-ups by me: Simpson ratio wording, project non-convergence instruction
- P3 done (0 errors, 84; L08 quorum/CAP wording and L12 burn rates flagged); review started P3
- C18 done (0 errors, 84; Brython frozenset - set failure worked around in L07/L08 models); C20 done (0 errors, 84; regex and json.loads invalid-input tests removed because Brython failed on them) -> investigating these Brython gaps before their reviews
- C16 reviewed (6), C15 reviewed (9), C17 reviewed (3), C19 reviewed (11), P2 reviewed (15 edits; log line says 12), P3 reviewed (6), C21 reviewed (11; van Steen chapters checked), P1 reviewed (17)
- follow-ups by me: C17 TLS 1.3 forward-secrecy wording, IDOR report severity without an unverified calculator band, safe_url now cleans spaces/control characters/tabs first (+3 asserts); C19 random-forest defaults and paired comparison; P2 exam precedence rule (+1 assert) and Epilogue reading; C21 Raft truncation rule in the project protocol
- P5 done (0 errors, 1 nocheck: git switch -c); P6 done (0 errors, 3 long-line warnings); all 33 writers finished
- browser runtime fixes (scripts/pyworker.py, checked against CPython with 11 comparison files): frozenset - set; re replacement templates (\g<name>, \g<n>, octal, escapes), [\b], Pattern.subn and re.subn with a function, Match.lastindex/lastgroup/re/pos/endpos/regs, Pattern.pattern/flags/groups/groupindex, PatternError name/message/.msg/.pos, re flags compare and hash like ints, sub/split with characters beyond U+FFFF, bytes patterns; json replaced by CPython 3.13's pure-Python json (vendor/cpython-json, PSF licence): JSONDecodeError, NaN/Infinity, json.decoder etc.; the runner's own messages keep Brython's fast JS codec. Known remaining differences (rare): lazy empty matches (a*?), group values kept across repetitions, conditional groups, str repr of some Unicode spaces, surrogate concatenation
- full revalidation with the new runtime: 63/63 courses, 0 errors
- reviews started C18 C20 P5 P6 (last four)
- container restart (Nov 6); reviews finished during it: C18 (9 fixes; unreachable tic-tac-toe board, Poole & Mackworth chapter titles, regression "deletes no goal fluent", synchronous value-iteration asserts), C20 (12; Content-Length, sRGB 0.04045, Enter/Space on links vs buttons, invalid-JSON tests restored, ASCII-digit route tests, Flask session cookie defaults), P5 (16; actions/checkout and setup-python now @v7 (confirmed by search), compose DATABASE_URL host db, .env.example DB_PASSWORD, HSTS, TLS 1.2/1.3 wording, extra asserts), P6 (8 logged / 9 edits; DORA five metrics, RACI, SPDX ids, WCAG 2.2 levels, GDPR scope and 72 h wording)
- Safari 26.3 on the Mac: updated runner check page passed all 11 checks (json and re fixes included), start 1.5 s
- follow-ups by me: C20 serve exam body uses ensure_ascii=False so the byte-length test means something; C20 L06 model's done toggle is a real button (aria-pressed); P6 review guide notes the newer DORA names
- all 63 courses written and reviewed
- more runtime fixes: unittest.main() works (learner code now runs as a real __main__ module, in CPython too; Brython tracebacks start at the test method; method __doc__ fixed), traceback.print_exc() hides runner frames, logging %(asctime)s works (time functions no longer bind), unittest.mock import prints nothing, random.seed() with big ints and str matches CPython
- build: "Try it" now only for blocks that run the same in the browser as in CPython (11 left without it: flask, werkzeug, numpy, sqlite3, socket, cmath); 488 runnable blocks
- final: 63/63 courses 0 errors; final_test 446 routes, 484 Try-it, 0 KaTeX/page errors; ui_test and exam_test pass; Safari 26.3 check page 11/11
- delivered (local only, not published): ~/Projects/coding-learning-foundation/coding-learning-foundation.html (15.8 MB, sha1 7aee5725) and README.txt; python-check.html left beside it as an optional self-test
