/* Med School Learning Foundation — the study method and the path to medicine. */
(function () {
  'use strict';
  const App = window.ToEApp;
  const { CAT, esc, codeTag } = App;

  App.route(/^method$/, () => {
    const prof = CAT.profiles;
    const row = (cells) => '<tr>' + cells.map((c) => '<td>' + c + '</td>').join('') + '</tr>';
    App.mount('<div class="wrap"><div class="lesson-layout"><article style="min-width:0">' +
      '<div class="section"><span class="eyebrow">How to study here</span><h1 class="lesson-title">The study method</h1><p class="lesson-summary">A steady rhythm, an honest error log, and tests you take on your own. Short daily practice beats long, rare sessions at every age.</p></div>' +
      '<div class="prose">' +
      '<h2>Find your starting point</h2><p>Use the <a href="#start">starting-point page</a> to pick your stage. If you think you already know a course, take its course challenge: one unseen question from every week. About 85% means you can move on; a lower score shows exactly which weeks to study. Starting a little too early costs a few days; starting too late costs months of confusion.</p>' +
      '<h2>How much time to plan</h2><div class="table-wrap"><table><thead><tr><th>Stage</th><th>A typical week</th><th>Notes</th></tr></thead><tbody>' +
      row(['Elementary (K–5)', '15–30 minutes a day, 4–5 days a week, per subject', 'A grown-up reads along, helps with the hands-on tasks and checks the rubrics. Stop while it is still fun.']) +
      row(['Middle school', '3–4 hours per course', 'Three or four courses at a time: math, English, a science and history.']) +
      row(['High school', '4–6 hours per course', 'Lab courses need extra time for the hands-on investigations.']) +
      row(['College pre-medical', '8–12 hours per course', 'Two or three courses at a time is a full load for self-study.']) +
      row(['Medical school', '12–15 hours per course', 'Pair each course with a question bank or flashcards for spaced retrieval.']) +
      '</tbody></table></div><p>A 14-week syllabus at a slower pace may take 20–30 weeks. That is fine: mastery decides progress, not the calendar. Every fourth week, learn nothing new and repair old errors instead.</p>' +
      '<h2>A week of study</h2><div class="table-wrap"><table><thead><tr><th>Session</th><th>Task</th><th>Output</th></tr></thead><tbody>' +
      row(['Learn', 'Read one lesson and its worked examples, then the matching part of the course reading.', 'Notes in your own words and questions to ask.']) +
      row(['Practice', 'Solve the practice questions on paper before entering answers.', 'Skills move up as you answer correctly on the first try.']) +
      row(['Retrieve', 'Redo earlier problems before looking at your notes.', 'A list of what has faded.']) +
      row(['Repair', 'Retry the parallel problems waiting in your error log.', 'Errors marked repaired.']) +
      row(['Test', 'A unit quiz or timed mixed set with no notes, tutor or AI.', 'An honest score and next week\'s priorities.']) +
      '</tbody></table></div>' +
      '<h2>The error log</h2><p>For each miss, note the first wrong step and the missing idea behind it, then solve a new parallel problem 48 hours later. This site records the problem and its solution, keeps the 48-hour clock and serves the parallel problem; you supply the two columns that make you think: where it went wrong, and why.</p>' +
      '<h2>Using the tutor and AI well</h2><p>Use the tutor for a hint, another explanation, a check of your working or extra practice, after you have tried yourself. Check important claims against the course reading or a worked solution: agreement with an AI is not proof. The tutor is switched off during quizzes and exams. Children should use the tutor with a grown-up.</p>' +
      '<h2>The mastery gate</h2><p>Before you treat a course as done, aim for about 85% on two unseen, timed tests a week or two apart: here, the week 14 final and the course challenge. For board-style clinical courses, aim for about 80% on timed mixed blocks.</p>' +
      '<h2>Mastery levels on this site</h2><p>Each weekly lesson is one skill with five levels: Not started, Attempted, Familiar, Proficient and Mastered.</p><ul>' +
      '<li><strong>Practice</strong> moves a skill to Familiar at 70% and to Proficient at 100%. A question counts only when you answer it correctly on the first try without a hint.</li>' +
      '<li><strong>Unit quizzes</strong> move each skill up one level, as far as Proficient, when you answer its questions correctly, and down one level when you miss them.</li>' +
      '<li><strong>The midterm, the final and the course challenge</strong> can take a Proficient skill to Mastered. Misses there lower the level, so mastery stays honest.</li>' +
      '<li><strong>Mastery points</strong>: 50 for Familiar, 80 for Proficient and 100 for Mastered.</li></ul>' +
      '<h2>Assessment profiles</h2><p>Each course has a profile that sets what counts toward completion.</p><div class="table-wrap"><table><thead><tr><th>Profile</th><th>Weights</th><th>Completion evidence</th></tr></thead><tbody>' +
      Object.keys(prof).map((k) => '<tr><td>' + k + ' · ' + esc(prof[k].name) + '</td><td>' + prof[k].weights.map((w) => esc(w[0]) + ' ' + w[1] + '%').join('; ') + '</td><td>' + esc(prof[k].evidence) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<h2>Safety and honesty</h2><p>Home experiments use only safe household materials, with a grown-up for children. Medical content is for education only: it is not medical advice, and any dose or guideline must be checked against current references before clinical use. Physical examination skills need practice under supervision. Self-study scores are private progress indicators and do not award credit, degrees or licensure.</p>' +
      '<h2>Free resources</h2><div class="table-wrap"><table><thead><tr><th>Level</th><th>Free resources</th><th>Optional extra help</th></tr></thead><tbody>' +
      CAT.resources.map((r) => '<tr><td>' + esc(r.level) + '</td><td>' + r.free.map((f) => '<a href="' + esc(f[1]) + '" target="_blank" rel="noopener">' + esc(f[0]) + '</a>').join('<br>') + '</td><td>' + (r.paidUrl ? '<a href="' + esc(r.paidUrl) + '" target="_blank" rel="noopener">' + esc(r.paid) + '</a>' : esc(r.paid)) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>Course availability and terms change, so check before you pay for anything.</p>' +
      '</div></article><aside class="lesson-side"><div class="side-card"><span class="eyebrow">Start</span><a class="btn btn-primary" href="#start">Choose a starting point</a><a class="btn" href="#errors">Open your error log</a><a class="btn btn-quiet" href="#path">The path to medicine</a></div></aside></div></div>');
  }, 'method');

  const STRANDS = [
    ['Mathematics', 'Counting to calculus and statistics.', ['K1', 'K2', 'K3', 'J1', 'J2', 'J3', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']],
    ['Reading and writing', 'Letters to research writing and the personal statement.', ['K4', 'K5', 'K6', 'J4', 'H10', 'H11', 'C12']],
    ['Science', 'Observation to the pre-medical sciences.', ['K7', 'K8', 'J5', 'J6', 'J7', 'H7', 'H8', 'H9', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']],
    ['People and society', 'Communities to psychology, sociology and the MCAT.', ['K9', 'J8', 'H12', 'H13', 'C11', 'C13']],
    ['Medicine', 'Foundations, organ systems, clerkships and boards.', ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9']],
  ];
  const MILESTONES = [
    ['Kindergarten to grade 5', 'About ages 5 to 11', 'Number sense, fluent reading, curiosity about the natural world, and how communities work.'],
    ['Grades 6 to 8', 'About ages 11 to 14', 'Ratios to pre-algebra, evidence-based reading and writing, and the life, physical and earth sciences.'],
    ['Grades 9 to 12', 'About ages 14 to 18', 'Algebra through calculus, statistics, lab sciences, strong writing, and history and government.'],
    ['College', 'Usually four years for a bachelor\'s degree', 'The pre-medical requirements (biology, general and organic chemistry, physics, biochemistry, statistics, psychology and sociology, English), often with research and clinical volunteering. Most applicants take the MCAT, scored from 472 to 528, in the year before applying.'],
    ['Medical school, years 1 and 2', 'The preclinical years', 'Foundations and organ systems, clinical skills, and USMLE Step 1, which has been reported as pass or fail since 2022.'],
    ['Medical school, years 3 and 4', 'The clinical years', 'Core clerkships and electives, then USMLE Step 2 CK, a scored exam that residency programs weigh heavily.'],
    ['After graduation', 'Residency, 3 to 7 years', 'Supervised specialty training, USMLE Step 3, a medical license and board certification. This site ends where residency begins.'],
  ];
  App.route(/^path$/, () => {
    App.mount('<div class="wrap"><div class="section"><span class="eyebrow">Why the curriculum is shaped this way</span><h1 class="lesson-title">The path to medicine</h1>' +
      '<p class="lesson-summary">Medicine rests on everything before it: reading and writing to learn and to communicate, mathematics and statistics to reason about evidence, the sciences to understand the body, and an understanding of people and society to care for patients well.</p></div>' +
      '<section class="section"><h2>The milestones</h2><div class="panel" style="padding:0"><div class="table-wrap"><table><thead><tr><th>Stage</th><th>Typical timing</th><th>What it builds</th></tr></thead><tbody>' +
      MILESTONES.map((r) => '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<p class="muted" style="max-width:70ch">This site teaches the knowledge. Becoming a physician also requires accredited school and college diplomas, admission to medical school, supervised clinical training, licensing exams and residency. Self-study here does not award credit, degrees or licensure.</p></section>' +
      '<section class="section"><h2>Five strands</h2><div class="grid">' + STRANDS.map((s) => '<div class="panel stack" style="gap:10px"><span class="eyebrow">' + esc(s[0]) + '</span><p class="faint" style="font-size:var(--s-xs)">' + esc(s[1]) + '</p>' +
        '<div class="row" style="gap:6px;flex-wrap:wrap">' + s[2].map((c) => codeTag(c)).join('') + '</div></div>').join('') + '</div></section>' +
      '<div class="row" style="margin-top:22px"><a class="btn btn-primary" href="#courses">Browse all ' + CAT.courses.length + ' courses</a><a class="btn" href="#start">Find your starting point</a></div></div>');
  }, 'path');
})();
