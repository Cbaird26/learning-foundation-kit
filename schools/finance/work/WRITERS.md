# Writer runs (Finance Learning Foundation)

Template (sonnet, background):
Write course CODE (TITLE) of the Finance Learning Foundation. Read /home/claude/finance/toolkit/BRIEF.md first and follow it exactly; your course data is /home/claude/finance/toolkit/courses/CODE.json. Write only /home/claude/finance/content/CODE/L01.txt to L12.txt and project.txt. LEVEL_NOTE When all 13 files exist, run python3 /home/claude/finance/toolkit/validate.py CODE until it reports 0 errors, then finish with the short report the brief asks for.

Level notes:
- elementary: This course is for a young child with an adult helper who reads aloud; follow the brief's elementary guidance exactly: pretend money only, small exact amounts, and hands-on tasks the grown-up can check.
- middle/high: Every number must be right (compute each one with python3 -c); state the assumptions each item depends on (compounding, timing, tax year); keep personal-finance topics neutral, with no product names.
- college: University level. Every formula, number, journal entry and technical statement must be correct; compute every answer with python3 -c; state the conventions each problem uses; follow the brief's list of current facts.
- professional: Practical, current and exam-accurate; every question original (no CFA Institute text or exam questions); ethics items name the specific Standard; self items need complete model answers and specific rubrics; follow the brief's list of current facts.

Reused, not rewritten: K1–K9, J1–J8 and H1–H13 from the Med School Learning Foundation (30 courses, already reviewed) and J9, H14 from the Coding Learning Foundation (already reviewed).
New: K10 J10 H15 H16, C1–C21, P1–P6 (31 courses).
Runner: Brython 3.14.3 (BSD) in a Web Worker; harness src/pyharness.py; build scripts/pyworker.py; browser check toolkit/pycheck.py.

Log:
- Brython fixes before writing (scripts/pyworker.py): round(x, n) now correctly rounded like CPython (round(2.675, 2) was 2.68), round(int, negative n) no longer crashes; float formatting 'f', 'F', '%', 'e', 'E', 'g', 'n' now exact (half-even ties, '.0%' kept its '%', -0.0 and negative values rounding to zero keep '-', numbers from 1e21 printed in full, '_' grouping, no comma after a minus sign, '+' on zero); 1,000+ value/spec combinations match CPython exactly. Decimal, statistics (correlation, linear_regression, NormalDist), datetime and csv match CPython.
- Site checker: number answers accept $, thousands separators and a trailing % (as hundredths, or ignored when the unit is %); "needs an exact value" no longer shown for decimal answers.
- Validator: finance helpers for checks (tvm_*, npv, irr, bond_price, bond_ytm, mac_duration, mod_duration, bsm, ncdf, ninv, cents); money-read-as-math check ("$5 and $10").
- batch 1 (Nov 6): K10 J10 H15 H16 C1 C2 C3 C4 C5 C6
- K10 done (0 errors, 84 + 3 exam, no nocheck; week 10 'Pretend Bank' 1¢ per dollar a week, said to be far above real banks); review started K10; started C7
- K10 reviewed (7 fixes; quiz items moved off practice and example data, two-quarter payment, FDIC per bank; unsure: L05/L08 practice reuse example numbers — fine at this age)
- J10 done (0 errors, 84 + 3 exam, no code, no nocheck; card interest simplified as APR/12 on start-of-month balance, stated); review started J10; started C8
- H16 done (0 errors, 85 + 3 exam, no nocheck; textbook 1/rr multiplier with the zero-reserve-requirement note); review started H16; started C9
- J10 reviewed (3 fixes; minimum-payment total $644.96/$144.96 recomputed, unit-price math now shows \$; exam 3 savings-vs-card comparison left as is: factual, no products)
- H15 done (0 errors, 84 + 3 exam, 5 code items, no nocheck); review started H15; started C10
- C2 done (0 errors, 84 + 3 exam, 5 code items, no nocheck; FIFO example keeps unrounded $5.0353 per EU; L12 notes NPV ranking ignores unequal lives); review started C2; started C11
- H16 reviewed (8 fixes; HHI quiz off article data, M1 includes savings deposits since 2020, reading lines by topic); follow-ups by me: L11 money-market graph reconciled with ample reserves, L07 chained-dollar note, exam 'target range'
- H15 reviewed (8 fixes; three quiz items moved off example/practice data and recomputed (tax refund 240, payment 197.87, PITI 1,549.10), subsidized-loan wording, position reference, card APR hypothetical, project pre-tax premium step); unsure items checked and left (neutral trade-off framing)
- C1 done (0 errors, 84 + 3 exam, 5 code items, no nocheck; project ledger checked in Python; unsure: IFRS/GAAP impairment and write-down reversals, SOX 404(b) thresholds — passed to reviewer); review started C1; started C12
- C6 done (0 errors, 84 + 3 exam, 5 code, no nocheck); follow-up by me: College Algebra 2e matrix sections are 7.5–7.7 (were cited as 9.5–9.7, Precalculus numbering); review started C6
- C3 done (0 errors, 84 + 3 exam, 5 code, no nocheck); review started C3
- C2 reviewed (3 fixes; three practice items moved off worked-example data, answers recomputed)
- C4 done (0 errors, 84 + 3 exam, 5 code, no nocheck; FRED series IDs checked: GDPC1 GDPPOT GDPDEF CPIAUCSL PCEPI PCEPILFE UNRATE FEDFUNDS DGS2 DGS10 T10Y2Y); review queued
- C5 done (0 errors, 84 + 3 exam, code in every lesson, no nocheck); follow-up by me: regression is Chapter 13 of Introductory Business Statistics 2e (was cited as 12); review queued
- started C13 C14 C15 C16
- C1 reviewed (2 fixes; SOX 404(b) attestation scope made precise, example 2 restates its adjustments); follow-ups by me: L08 off-topic depreciation quiz replaced by a discount-bond effective-interest quiz (new bond, recomputed), L06 objective matches the periodic-only examples, project self-check wording
- review started C4 (queued: C5)
- C6 reviewed (6 fixes; CAGR line, quiz off article data, factor 33.0354, S_n terms, no-short-sale condition, project rubric on negative weights); follow-up by me: e^x is its own derivative (only Ce^x are)
- C3 reviewed (8 fixes; corner-solution direction, items and code tests moved off example/quiz data, minimum-wage passage balanced, exam PD payoffs new (δ ≥ 2/5 checked))
- review started C5
- C8 done (0 errors, 84 + 3 exam, 4 code, no nocheck; circuit breakers 7/13/20%, Reg T 50%/FINRA 25%, Basel III minimums, LCR 75% inflow cap, FDIC joint accounts, 2008 and 2023 episodes passed to reviewer); review started C8; started C17
- C4 reviewed (14 fixes; GNP/GNI wording, saving identity, many items and code tests moved off example data, rounding of a few intermediate values); follow-up by me: L07 IS-LM quiz given its own economy (Y = 2725 checked with root)
- validator: percent-unit rule no longer fires on "r is in percent" or "as a percentage of"
- C7 done (0 errors, 84 + 3 exam, 8 code, no nocheck; week 4 new material); review started C7; started C18
- C5 reviewed (13 fixes; quiz items and code tests moved off worked-example data, collinearity sentence, project exam exact binomial is 21+ defaults (1.05%))
- C8 reviewed (11 fixes, logged as 10; items and code tests moved off worked-example data, street-name beneficial owner; June 5, 2026 is a Friday, checked)
- C10 done (0 errors, 84 + 3 exam, no nocheck; project data from a seeded generator, reviewer asked to make it version-proof); review started C10; started C19
- C9 done (0 errors, 84 + 3 exam, 4 code, no nocheck; IFRS 18/IAS 7, ASU dates, IAS 12 amendments passed to reviewer); review started C9; started C20
- C7 reviewed (6 fixes; CAGR 5.54% and doubling time, NPV term sum, accounting break-even OCF = depreciation and the Windmere NPV (about -\$580,000), restated practice data)
- C11 done (0 errors, 85 + 3 exam, 5 code, no nocheck; FCFF under IFRS interest classification, lease EBIT adjustment, Altman Z passed to reviewer); review started C11; started C21 (writers left to start: P1–P6)
- BRIEF: practice items and code tests must use their own numbers (for writers from C19 on)
- C15 done (0 errors, 84 + 3 exam, 5 code, no nocheck); review started C15 (163(j) EBITDA-based ATI from 2025 under the OBBBA, verified); started P1; BRIEF: corporate tax facts added (21%, 163(j), 1% buyback excise)
- C11 reviewed (14 fixes, logged as 12; many items and code tests moved off example data, debt-ratio balance convention, accruals reversal reason, IFRS FCFE/FCFF adjustments); follow-up by me: IFRS 18 makes interest/dividends paid financing from 2027
- C10 reviewed (20 fixes, logged as 21; items, code tests and exam moved off example data, project seed note softened)
- C13 done (0 errors, 84 + 3 exam, no nocheck; conventions stated per problem); review started C13; started P2
- C9 reviewed (14 fixes; right-of-return asset wording, IAS 38 criteria count, items and code tests moved off example data, DTL rate change, corridor assumption, IAS 33/ASC 260 assumed proceeds, IAS 12 vs ASC 740 in the review guide)
- C16 done (0 errors, 85 + 3 exam, 5 code, no nocheck; GIPS, foundation payout, ERISA/UPMIFA, 28(e), SEC 2019 interpretation passed to reviewer); review started C16; started P3
- C14 done (0 errors, 84 + 3 exam, code in 11 lessons, no nocheck); review started C14; started P4 (left to start: P5 P6)
- C15 reviewed (8 fixes; code tests moved off example data, 163(j) EBITDA-based ATI under the OBBBA, exam valuation range and average fixed); follow-up by me: L09 premium sentence states its market-value assumption
- C16 reviewed (6 fixes; $122.7 compounding, code tests and self item moved off example data, conflict-cost practice recomputed (112952))
- C18 done (0 errors, 90 items, 5 code, no nocheck; ASC 830/IAS 21, highly inflationary test, crisis summaries passed to reviewer); review started C18; started P5 (left to start: P6)
- C13 reviewed (17 fixes; code tests, quizzes and exam moved off worked-example data (Z-spread 172 bp, OAS 210 bp, 250 PSA 0.603%), grammar)
- C14 reviewed (13 fixes; US dollar swaps reference SOFR, European put lower bound below intrinsic value, call rises with T only when q = 0, hedge saving $480,000, items, code tests and exam moved off example data); follow-up by me: currency-swap quiz states the original 1.10 rate
- C12 done (0 errors, 84 + 3 exam, code in every lesson, no nocheck; DW, DF and Engle-Granger critical values from tables, passed to reviewer); review started C12; started P6 (all 31 writers started)
- C17 done (0 errors, 84 + 3 exam, 2+ code per lesson, no nocheck; pandas/NumPy only in "on your own computer" blocks); review started C17
- C19 done (0 errors, 84 + 3 exam, 5 code, no nocheck; Basel and insurance regulation facts passed to reviewer); review started C19
- C18 reviewed (14 fixes, logged as 13; items, code tests and quizzes moved off example data, GBP/USD convention); follow-up by me: L01 IMF identity is CA + KA + EO = FA
- C12 reviewed (7 fixes; code tests moved off example data, residual 0.65, project HC1 slope SE 0.151, F critical 3.08); follow-ups by me: pooled-OLS SE caveat and clustered SEs, Engle-Granger value source
- C21 done (0 errors, 84 + 3 exam, no nocheck; 10b5-1, Reg E, filing deadlines, GENIUS Act, CFPB funding case, FinCEN March 2025 BOI rule passed to reviewer); review started C21
- P1 done (0 errors, 84 + 3 exam, 2 code, 3 self, no nocheck); review started P1
- P2 done (0 errors, 84 + 3 exam, no nocheck); review started P2; BRIEF: Level II = 88 questions in 22 item sets, two 2h12m sessions; Level III = two 2h12m sessions (checked with a prep provider's exam-details page)
- C17 reviewed (about 36 fixes; mostly code tests and items moved off article/example data, L04 amortization table columns corrected, extra asserts, project exam names choices by content); follow-up by me: L02 IRR caveat matches what the code checks
- C19 reviewed (12 fixes; VaR tolerances widened for 4-decimal z values, quantile rounding instructions in prompts, example arithmetic with 2.32635, IFRS 17 scope, RAROC practice data); follow-up by me: FRTB ES scaled for liquidity horizons
- C20 done (0 errors, 84 + 3 exam, 5 code, no nocheck; Odean PGR/PLR, auto-enrollment 37%→86%, nudge effect sizes 1.4 vs 8.7, Nasdaq 2000–2002, SECURE 2.0 auto-enrollment checked from memory: consistent)
- review started C20
- C21 reviewed (7 fixes; facts in model answers, CFO relationship, churning elements, whistleblower protection for FINRA reports, award formula, exam explains rather than advises); follow-up by me: L05 materiality vs duty to disclose
- P3 done (0 errors, 84 + 3 exam, no nocheck; Singer-Terhaar segmentation convention passed to reviewer); review started P3
- P1 reviewed (8 fixes; unsupported claims softened, GIPS time-weighted "for most strategies", vendor risk model wording, position reference, 10 bp = 0.1%); follow-up by me: US private-company goodwill amortization alternative noted
- P2 reviewed (8 fixes; ethics-at-all-levels claim, VII(B) wording, pension interest cost, control for consolidation, EV-to-equity bridge, credit-spread wording, smoothing vs bias, pacing practice data); follow-ups by me: Cassian distractor now 'employer only' (VI(A) covers clients too), software-company wording
- P4 done (0 errors, 84 + 3 exam, 2+ code per lesson, no nocheck; 2023 Merger Guidelines HHI 1,800, filing deadlines, Reg AC and FINRA 2241 passed to reviewer); review started P4
- C20 reviewed (10 fixes; lottery count, example value 265.0, value function stated in the code prompt, anchoring step, practice data, borrow fee paid, merger-gain condition, code tests off example data, disposition-effect denominator); follow-up by me: framing-effect replication claim softened
- P3 reviewed (13 fixes, logged as 16; Singer-Terhaar segmentation assumptions stated, contingent immunization floor, holding-period return wording, hedge-ratio regression, interaction effect, case facts, hurdle timing, practice and exam data); Type I/II manager-selection convention checked: matches (null = no skill)
- P5 done (0 errors, 85 + 3 exam, 2 code, no nocheck; fictional Corvane Instruments; V(C) seven years, ISSB/SASB, IFRS S1/S2, say-on-pay 8-K passed to reviewer); review started P5
- P4 reviewed (10 fixes; code tests moved off example data, sweep arithmetic in a solution, repayment assumption stated, loss case asserts zero tax, exam terminal-value formula stated)
- P6 done (0 errors, 84 + 3 exam, no nocheck; CE hours, SEC PDA withdrawal, Reg S-P 2024, FinCEN adviser AML postponement, licensing details, GIPS required elements passed to reviewer); review started P6 (all 31 courses written)
- P5 reviewed (9 fixes; V(C) requires records with the Handbook's seven-year recommendation, say-on-pay on Form 8-K, changed ratings under III(B) and V(A), 30% of words, rating bands stated); follow-up by me: lease treatment in the equity bridge qualified for US GAAP vs IFRS 16
- P6 reviewed (5 fixes; Series 7 and SIE wording with a sponsoring firm, portfolio count, GIPS missing-items list, resume bullet data, fictional firm renamed); follow-ups by me: GIPS 2020 requires total firm assets each year (checked: percentage cannot replace it), NASAA develops the 63/65/66 exams that FINRA administers
- validator: nine reused K–12 percent items (J1, H11, H13) given unit: % (answers already in percent)
- ALL 31 new courses written and reviewed
- FINAL (Nov 6): integrate 63/63 ok; site 15.1 MB, 63 courses with projects, 140 runnable blocks; end-to-end 421 routes, 0 KaTeX errors, 0 page errors; UI test (Try it, code check, finance scratchpad, 6 s loop stop, mobile 390 px), exam test (C17 final, 6 code questions), money-input test ($7,600.00 and 4.91% accepted); privacy scan clean (only base64 font noise, app code, stdlib author notices)
- staged publish/ (index.html sha1 ce7669b2…, README.md, THIRD-PARTY-NOTICES.md, .nojekyll); repo Cbaird26/finance-learning-foundation does not exist yet; desktop bridge not connected → asked the user to link the computer or create the repo
