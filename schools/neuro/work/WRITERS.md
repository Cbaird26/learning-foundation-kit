# Writer runs (Neuroscience Learning Foundation)

Template (sonnet, background):
Write course CODE (TITLE) of the Neuroscience Learning Foundation. Read /home/claude/neuro/toolkit/BRIEF.md first and follow it exactly; your course data is /home/claude/neuro/toolkit/courses/CODE.json. Write only /home/claude/neuro/content/CODE/L01.txt to L12.txt and project.txt. LEVEL_NOTE COURSE_NOTE When all 13 files exist, run python3 /home/claude/neuro/toolkit/validate.py CODE until it reports 0 errors, then python3 /home/claude/neuro/toolkit/retype_check.py CODE and turn any listed item that only re-types an article function into a variant, then finish with the short report the brief asks for.

Level notes:
- college, P: University level, programming and modeling: at least two code items in every lesson (usually three or four), each simulating, fitting or analyzing the week's idea from scratch in plain Python on tiny invented data with stated units, with float comparisons inside a tolerance; every mechanism, derivation and number must be correct (check each with python3 -c).
- college, T: University level, theory: every mechanism, finding, derivation and number must be correct, with the evidence for each claim and its limits; check each computation with python3 -c; add a code item in about half the lessons where the topic is naturally programmed.
- college, W: University level, reading and writing: exact definitions, accurately described findings and correct computations; describe laws and guidelines only as the brief's list of current facts says, with their dates; on contested questions present the strongest version of each main view and never make one the right answer.
- professional: Graduate level: an accurate, fair picture of each research area; attribute only results you are sure of; teach concepts, methods and well-established results, never the current state of the art as fact or current commercial products; self items need model answers a faculty reader would admire and specific rubrics.

Course notes:
- C12: Weeks 3–4 (the membrane as an RC circuit) are next to the example lesson's topic: use different parameters, numbers and exercises, and do not re-teach the integrate-and-fire neuron (C25 does).
- C25: Week 2 covers the leaky integrate-and-fire neuron, the topic of the example lesson: use entirely new parameters, functions, data and exercises (for example an f–I curve with refractoriness fitted to supplied rates, adaptation currents, or noise supplied as a list).
- C15: Analyses in plain Python without statistics libraries; give t, F and chi-square critical values in the prompt when an item needs them, rather than asking learners to look them up.
- C16, C17, C24, C26, C27: Data come as short typed-out lists (spike times, trials, reaction times, voxel time series); keep simulations to at most a few thousand steps.
- C13: Mostly structure and pathways: mc, ms, list and tuple items, num items for conduction times and similar, and code only where natural (it may have none).
- C14, C19: Describe classic experiments accurately (design, result, interpretation) and say which interpretations are debated.
- C20, C30, P3: No code items. Present nature–nurture (C20), neuroethics (C30) and consciousness (P3) debates even-handedly; C30 follows the brief's current facts on neural data laws and research ethics exactly.
- C18: Hormones, drugs and sleep at the textbook level; no doses or treatment advice.
- P2, P4: Fast-moving areas: concepts, methods and established results with their papers and years from the brief's list; never the current state of the art as fact; say which questions are open.
- P5, P6: Research practice; describe common practice and say that programs, journals and institutions differ. Projects use open data sets described generally, never animals or new data from people beyond low-risk tasks with volunteers.

Reused, not rewritten: K1–K11, J1–J9 and H1–H14 from the AI Learning Foundation (its K–12 with the programming track); C1–C4 and C5–C7 from the Med School Learning Foundation (Med C1–C4, C7, C8, C10); C8–C10, C22 and C23 from the AI school (AI C6–C8, C10, C17); C21 from the Metaphysics school (C9, Philosophy of mind); the clinical electives C28 and C29 from the Med school (S9, S10). 49 courses; all validate with 0 errors here after two percent-unit fixes in C7 and two cross-course references fixed in C23.
New: C11–C20, C24–C27, C30 and P1–P6 (21 courses).
Runner: Brython 3.14.3 (BSD) in a Web Worker; same build as the AI school.

Log:
- Setup (Nov 7–8): owner chose "Neuro + cog sci to PhD prep" and "Python in the page for data and modeling"; pipeline copied from the AI school; curriculum in work/curriculum.py; storage prefix nlf; example lesson toolkit/example_neuro_lesson.txt (the leaky integrate-and-fire neuron, validated, P-style with 2 code items); BRIEF with neuroscience notation and units, standard attributions and verified current facts (UNESCO neurotechnology recommendation 12 Nov 2025, Chile 2021 and 2023, four US state neural data laws and the MIND Act bill, Declaration of Helsinki 19 Oct 2024, the Common Rule, DSM-5-TR and ICD-11); REVIEW template adapted; app rebranded.
- batch 1 (Nov 8): C11 C12 C13 C14 C15
- C13 done (0 errors, 96 + 3 exam, one code item; neuron counts, decussation percentages, language dominance, hair-cell counts, CAG thresholds and SSEP peaks passed to the reviewer as verified); review started C13; started C16
- C11 done (0 errors, 97 + 3 exam, 6 code items; two-process constants as illustrative, 24.2 h period, debated points marked); review started C11; started C17
