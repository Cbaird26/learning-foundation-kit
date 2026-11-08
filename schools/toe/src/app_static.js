/* ToE Learning Foundation — the study method and the path to a unified theory. */
(function () {
  'use strict';
  const App = window.ToEApp;
  const { CAT, esc, codeTag, tex } = App;

  App.route(/^method$/, () => {
    const prof = CAT.profiles;
    App.mount('<div class="wrap"><div class="lesson-layout"><article style="min-width:0">' +
      '<div class="section"><span class="eyebrow">How to study here</span><h1 class="lesson-title">The study method</h1><p class="lesson-summary">A steady weekly rhythm, an honest error log, and assessments you take on your own. Consistency matters more than marathon sessions.</p></div>' +
      '<div class="prose">' +
      '<h2>Find your starting point</h2><p>Spend the first two weeks locating your level. Take the <a href="#start">placement check</a> and solve representative problems on paper without hints. Record each missed skill rather than assigning yourself a starting grade.</p>' +
      '<div class="table-wrap"><table><thead><tr><th>Result</th><th>Next action</th></tr></thead><tbody>' +
      '<tr><td>Algebra or fractions are unreliable</td><td>Begin at F1 week 1, with 4–6 weeks of daily mixed practice. No graded calculus yet.</td></tr>' +
      '<tr><td>Algebra works; trigonometry and functions are weak</td><td>Study functions, logarithms and trigonometry (F1 weeks 11–12, F2), then F3 Precalculus.</td></tr>' +
      '<tr><td>Precalculus is fluent</td><td>Start M1 Calculus I and P1 Mechanics in parallel.</td></tr></tbody></table></div>' +
      '<h2>A week of study</h2><p>Start with 4–6 hours a week: four 40-minute problem sessions, one 60-minute review and a short weekend quiz. Expand to 7–10 hours when your schedule allows. Reserve one rest day. Every fourth week is consolidation: no new topic until old errors are repaired.</p>' +
      '<div class="table-wrap"><table><thead><tr><th>Session</th><th>Task</th><th>Output</th></tr></thead><tbody>' +
      '<tr><td>A · 40–60 min</td><td>Learn one concept, then solve 6–10 varied problems on paper.</td><td>Annotated solutions and questions.</td></tr>' +
      '<tr><td>B · 40–60 min</td><td>Retrieval: solve earlier problems before reviewing notes.</td><td>Scores by topic in the error log.</td></tr>' +
      '<tr><td>C · 40–60 min</td><td>New problems, one derivation, one physical application.</td><td>A one-page explanation in your own words.</td></tr>' +
      '<tr><td>D · 40–60 min</td><td>A timed mixed set with no AI, notes or answer key.</td><td>An independent score and corrections.</td></tr>' +
      '<tr><td>Weekend · 60–90 min</td><td>Rework missed problems and attempt a cumulative quiz.</td><td>Next week\'s repair priorities.</td></tr></tbody></table></div>' +
      '<p>Budget about 5–7 hours per instructional week for foundation courses, 8–12 for undergraduate work and 10–15 for graduate work. At 4–6 hours a week, a 14-week undergraduate syllabus may take 28 weeks or more. A laboratory course can demand more time than its size suggests.</p>' +
      '<h2>The error log</h2><p>For each error, record five things: the problem, the first incorrect step, the missing prerequisite, the corrected solution, and a new parallel problem solved 48 hours later. This site fills in the problem and the solution for you, keeps the 48-hour clock, and serves the parallel problem. You supply the two columns that make you think: where it went wrong, and why.</p>' +
      '<h2>Using AI well</h2><p>Use the tutor for a hint, an alternative explanation, a critique of your attempt or extra practice. Attempt every problem yourself first. Check disputed reasoning against the course reading or a worked solution; agreement between two AI assistants does not establish that something is correct.</p><p>For mock exams, disable AI entirely. On this site the tutor switches itself off during quizzes, the midterm, the final, the course challenge and the placement check. The independent parts of projects use no AI either.</p>' +
      '<h2>The mastery gate</h2><p>Before you treat a course as done, aim for about 85% on two representative, timed, unseen assessments, with sound reasoning and repaired prerequisites. Here, that means the week 14 final and a course challenge taken 1–2 weeks later. Include conceptual and computational problems, look at the quality of your reasoning, and repeat with different questions. A strong score with fragile algebra calls for repair before you move on. The 85% figure is a personal planning threshold, not an official rule of any institution.</p>' +
      '<h2>Mastery levels on this site</h2><p>Each weekly lesson is one skill with five levels: Not started, Attempted, Familiar, Proficient and Mastered.</p><ul>' +
      '<li><strong>Practice</strong> moves a skill to Familiar at 70% and to Proficient at 100%. A question counts only when you answer it correctly on the first try without a hint.</li>' +
      '<li><strong>Unit quizzes</strong> move each skill up one level, as far as Proficient, when you answer its questions correctly, and down one level when you miss them.</li>' +
      '<li><strong>The midterm, the final and the course challenge</strong> can take a Proficient skill to Mastered. Misses there lower the level, so mastery stays honest.</li>' +
      '<li><strong>Mastery points</strong>: 50 for Familiar, 80 for Proficient and 100 for Mastered.</li></ul>' +
      '<h2>Assessments and completion</h2><p>Each course has an assessment profile. For theory exams, select unseen questions matched to the syllabus and keep solutions closed. Foundation finals take 90 minutes, university finals 120 and graduate finals 180. A second cumulative test after 1–2 weeks checks retention. Proof courses need correctness review, ideally from a qualified tutor. Self-study scores are private progress indicators; they do not award credit.</p>' +
      '<div class="table-wrap"><table><thead><tr><th>Profile</th><th>Weights</th><th>Completion evidence</th></tr></thead><tbody>' +
      Object.keys(prof).map((k) => '<tr><td>' + k + ' · ' + esc(prof[k].name) + '</td><td>' + prof[k].weights.map((w) => esc(w[0]) + ' ' + w[1] + '%').join('; ') + '</td><td>' + esc(prof[k].evidence) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>Home experiments prepare you for supervised labs but do not replace lab credit. Use safe motion experiments or low-voltage circuits, and label simulations and supplied data accurately.</p>' +
      '<h2>Your first seven days</h2><ol>' +
      '<li><strong>Day 1:</strong> set up a paper or digital problem notebook and book four study sessions for the coming week.</li>' +
      '<li><strong>Days 2 and 3:</strong> take the algebra parts of the placement check without hints, and work five unfamiliar function problems on paper.</li>' +
      '<li><strong>Day 4:</strong> take the trigonometry part; list only the specific identities, graphs or vector operations that failed.</li>' +
      '<li><strong>Days 5 and 6:</strong> repair the two most frequent errors with the lessons and the reading, then solve new parallel problems.</li>' +
      '<li><strong>Day 7:</strong> complete a 30-minute mixed quiz without AI, review the result, and choose your first four-week block.</li></ol>' +
      '<p>The first milestone is a reliable study habit and an honest baseline. A test score is information about the next lesson, not a verdict on your ability.</p>' +
      '<h2>A first 24-week cycle</h2><div class="table-wrap"><table><thead><tr><th>Weeks</th><th>Primary work</th><th>Checkpoint</th></tr></thead><tbody>' +
      [['1–2', 'Placement check: arithmetic, algebra, functions and trigonometry; start the error log.', 'A baseline closed-book test and a starting unit.'],
        ['3–6', 'Repair fractions, equations, factoring and graph interpretation.', 'Two spaced mixed quizzes; identify persistent error types.'],
        ['7–10', 'Functions, exponentials, logarithms and inverse functions.', 'Model growth and solve unfamiliar function problems.'],
        ['11–14', 'Unit circle, trigonometric functions, identities and vectors.', 'A timed cumulative algebra and trigonometry test.'],
        ['15–18', 'Precalculus integration: graphing, composition and analytic geometry.', 'Chapter reviews without hints.'],
        ['19–22', 'A preview of limits and rates, and a gentle introduction to mechanics.', 'Explain the derivative concept and model 1D motion.'],
        ['23–24', 'Review and a mock precalculus final; choose the next cycle.', 'Advance only after two sound independent attempts.']].map((r) => '<tr><td class="tnum">' + r[0] + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>If the placement check shows a stronger starting point, compress this cycle and begin calculus. If it exposes arithmetic gaps, extend it. A calendar is a planning aid; mastery decides progress.</p>' +
      '<h2>Free resources</h2><div class="table-wrap"><table><thead><tr><th>Level</th><th>Free resources</th><th>Optional extra help</th></tr></thead><tbody>' +
      CAT.resources.map((r) => '<tr><td>' + esc(r.level) + '</td><td>' + r.free.map((f) => '<a href="' + esc(f[1]) + '" target="_blank" rel="noopener">' + esc(f[0]) + '</a>').join('<br>') + '</td><td>' + (r.paidUrl ? '<a href="' + esc(r.paidUrl) + '" target="_blank" rel="noopener">' + esc(r.paid) + '</a>' : esc(r.paid)) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>Do not buy every platform. The zero-cost stack is Khan Academy, OpenStax, MIT OpenCourseWare and the Perimeter Institute. If you want one paid tool, try it for eight weeks against your actual practice and budget. Course availability and subscription terms change, so check before you pay.</p>' +
      '</div></article><aside class="lesson-side"><div class="side-card"><span class="eyebrow">Start</span><a class="btn btn-primary" href="#start">Take the placement check</a><a class="btn" href="#errors">Open your error log</a><a class="btn btn-quiet" href="#path">The path to a unified theory</a></div></aside></div></div>');
  }, 'method');

  const GRAVITY = [['M3', 'Vector calculus: fields, flux, the integral theorems'], ['M9b', 'Tensors, metrics, connections and curvature'], ['P4', 'Special relativity and spacetime'], ['P5', 'Lagrangians and action principles'], ['G7a', 'General relativity: gravity as curved spacetime'], ['G7d', 'Cosmology: the expanding universe and its history']];
  const QUANTUM = [['M4', 'Linear algebra: vector spaces and eigenvalues'], ['P7a', 'Quantum mechanics: states, operators, measurement'], ['P7b', 'Spin, approximation methods, identical particles'], ['G4', 'Graduate quantum mechanics: symmetry and scattering'], ['G7b', 'Quantum field theory: quantized fields and Feynman rules'], ['G7c', 'Renormalization and gauge theory']];
  App.route(/^path$/, () => {
    const col = (title, sub, arr) => '<div class="panel stack" style="gap:10px"><span class="eyebrow">' + esc(title) + '</span><p class="faint" style="font-size:var(--s-xs)">' + esc(sub) + '</p><ol class="steps">' +
      arr.map((x) => '<li><div class="row" style="gap:8px;align-items:flex-start;flex-wrap:nowrap">' + codeTag(x[0]) + '<span>' + esc(x[1]) + '</span></div></li>').join('') + '</ol></div>';
    App.mount('<div class="wrap"><div class="section"><span class="eyebrow">Why the curriculum is shaped this way</span><h1 class="lesson-title">The path to a unified theory</h1>' +
      '<p class="lesson-summary">Physics today rests on two tested frameworks: general relativity, which describes gravity as the geometry of spacetime, and quantum field theory, which describes matter and the other forces. A theory of everything must reproduce both where they have been tested, resolve where they conflict, and make new predictions that experiment can check.</p></div>' +
      '<div class="grid" style="margin-top:18px">' + col('The gravity branch', 'Geometry first, then spacetime.', GRAVITY) + col('The quantum branch', 'Linear algebra first, then fields.', QUANTUM) +
      '<div class="panel stack" style="gap:10px"><span class="eyebrow">Where they meet</span><p>Both branches stand on the same foundation: the F courses, calculus (M1–M2), differential equations (M5), Fourier and complex methods (M8a, M8b) and statistical physics (P8). They meet in research.</p><ol class="steps"><li><div class="row" style="gap:8px;align-items:flex-start;flex-wrap:nowrap">' + codeTag('G5') + '<span>Statistical mechanics: phase transitions and the renormalization idea</span></div></li><li><div class="row" style="gap:8px;align-items:flex-start;flex-wrap:nowrap">' + codeTag('E1') + '<span>Symmetry groups: the language of gauge theory</span></div></li><li><div class="row" style="gap:8px;align-items:flex-start;flex-wrap:nowrap">' + codeTag('G8') + '<span>Research apprenticeship: reproduce a baseline, state a falsifier, report null results</span></div></li></ol>' +
      '<p class="faint" style="font-size:var(--s-xs)">The Einstein field equations, ' + tex('G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\tfrac{8\\pi G}{c^4} T_{\\mu\\nu}') + ', and a quantum field\'s path integral, ' + tex('Z = \\int \\mathcal{D}\\phi\\, e^{iS[\\phi]/\\hbar}') + ', are the two ends this curriculum climbs toward.</p></div></div>' +
      '<section class="section"><h2>How to evaluate any candidate unified theory</h2><p class="muted" style="max-width:70ch">The aim is to learn enough to evaluate each claim yourself: derive the equations, identify their assumptions, check their consistency and test their predictions. Conceptual or philosophical value and demonstrated physical validity are separate assessments.</p>' +
      '<div class="panel" style="padding:0"><div class="table-wrap"><table><thead><tr><th>Kind of claim</th><th>What the curriculum gives you</th><th>A useful first audit</th></tr></thead><tbody>' +
      [['New fields in a Lagrangian', 'Variational mechanics, PDEs, symmetry and quantum field theory (P5, M8b, E1, G7b)', 'Check units, symmetries, equations of motion and limiting cases.'],
        ['Quantum measurement and outcome rates', 'Linear algebra, quantum mechanics, open systems and statistics (M4, P7a, G4, M7)', 'Separate single-shot probabilities from continuous-monitoring rates.'],
        ['Cosmology or a fifth force', 'General relativity, field theory, cosmology and statistical inference (G7a, G7b, G7d, M7)', 'Compare quantitative predictions with existing experimental constraints.'],
        ['Consciousness or other new variables', 'Measurement theory, operational definitions and experimental design (M7, P9, G8)', 'State the observables, controls, null hypothesis and falsifier.'],
        ['Evidence from simulation or AI', 'Numerical analysis, reproducibility and causal inference (F4, P9, G6)', 'Replicate a baseline and distinguish simulation behaviour from physical evidence.']]
        .map((r) => '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<p class="muted" style="max-width:70ch">Start research replication with textbook benchmarks before testing new models, and record null and contradictory results as carefully as positive ones.</p></section>' +
      '<div class="row" style="margin-top:22px"><a class="btn btn-primary" href="#courses">Browse all 39 courses</a><a class="btn" href="#start">Find your starting point</a></div></div>');
  }, 'path');
})();
