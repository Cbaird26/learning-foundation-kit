/* Law School Learning Foundation — the study method and the path to law. */
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
      row(['College pre-law', '8–12 hours per course', 'Two or three courses at a time is a full load for self-study.']) +
      row(['Law school', '12–15 hours per course', 'Read and brief the cases before each lesson, build an outline as you go, and practice timed exam questions.']) +
      row(['Bar preparation', '15–20 hours per course', 'Most graduates study full time for about 8 to 10 weeks and take the three review courses together.']) +
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
      '<h2>The mastery gate</h2><p>Before you treat a course as done, aim for about 85% on two unseen, timed tests a week or two apart: here, the week 14 final and the course challenge. For bar-style law courses, aim for about 80% on timed mixed sets.</p>' +
      '<h2>Mastery levels on this site</h2><p>Each weekly lesson is one skill with five levels: Not started, Attempted, Familiar, Proficient and Mastered.</p><ul>' +
      '<li><strong>Practice</strong> moves a skill to Familiar at 70% and to Proficient at 100%. A question counts only when you answer it correctly on the first try without a hint.</li>' +
      '<li><strong>Unit quizzes</strong> move each skill up one level, as far as Proficient, when you answer its questions correctly, and down one level when you miss them.</li>' +
      '<li><strong>The midterm, the final and the course challenge</strong> can take a Proficient skill to Mastered. Misses there lower the level, so mastery stays honest.</li>' +
      '<li><strong>Mastery points</strong>: 50 for Familiar, 80 for Proficient and 100 for Mastered.</li></ul>' +
      '<h2>Assessment profiles</h2><p>Each course has a profile that sets what counts toward completion.</p><div class="table-wrap"><table><thead><tr><th>Profile</th><th>Weights</th><th>Completion evidence</th></tr></thead><tbody>' +
      Object.keys(prof).map((k) => '<tr><td>' + k + ' · ' + esc(prof[k].name) + '</td><td>' + prof[k].weights.map((w) => esc(w[0]) + ' ' + w[1] + '%').join('; ') + '</td><td>' + esc(prof[k].evidence) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<h2>Safety and honesty</h2><p>Home experiments use only safe household materials, with a grown-up for children. Legal content is for education only: it is not legal advice, the law varies by jurisdiction and changes over time, and a real legal problem needs a licensed lawyer in your jurisdiction. Self-study scores are private progress indicators and do not award credit, degrees or admission to the bar.</p>' +
      '<h2>Free resources</h2><div class="table-wrap"><table><thead><tr><th>Level</th><th>Free resources</th><th>Optional extra help</th></tr></thead><tbody>' +
      CAT.resources.map((r) => '<tr><td>' + esc(r.level) + '</td><td>' + r.free.map((f) => '<a href="' + esc(f[1]) + '" target="_blank" rel="noopener">' + esc(f[0]) + '</a>').join('<br>') + '</td><td>' + (r.paidUrl ? '<a href="' + esc(r.paidUrl) + '" target="_blank" rel="noopener">' + esc(r.paid) + '</a>' : esc(r.paid)) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>Course availability and terms change, so check before you pay for anything.</p>' +
      '</div></article><aside class="lesson-side"><div class="side-card"><span class="eyebrow">Start</span><a class="btn btn-primary" href="#start">Choose a starting point</a><a class="btn" href="#errors">Open your error log</a><a class="btn btn-quiet" href="#path">The path to law</a></div></aside></div></div>');
  }, 'method');

  const STRANDS = [
    ['Mathematics and quantitative reasoning', 'Counting to statistics, economics and accounting.', ['K1', 'K2', 'K3', 'J1', 'J2', 'J3', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'C5', 'C6', 'C9']],
    ['Reading, writing and reasoning', 'Letters to logic, argument, speaking and the LSAT.', ['K4', 'K5', 'K6', 'J4', 'H10', 'H11', 'C1', 'C2', 'C10', 'C12']],
    ['Science', 'Observation to the lab sciences behind expert evidence.', ['K7', 'K8', 'J5', 'J6', 'J7', 'H7', 'H8', 'H9']],
    ['People, history and government', 'Communities to government, philosophy, legal history and law and society.', ['K9', 'J8', 'H12', 'H13', 'C3', 'C4', 'C7', 'C8', 'C11']],
    ['Law', 'The first-year subjects, the upper-level courses and bar review.', ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'B1', 'B2', 'B3']],
  ];
  const MILESTONES = [
    ['Kindergarten to grade 5', 'About ages 5 to 11', 'Number sense, fluent reading, curiosity about the natural world, and how communities and rules work.'],
    ['Grades 6 to 8', 'About ages 11 to 14', 'Ratios to pre-algebra, evidence-based reading and writing, the sciences, and history and geography.'],
    ['Grades 9 to 12', 'About ages 14 to 18', 'Algebra through statistics, lab sciences, strong reading and writing, and history and government.'],
    ['College', 'Usually four years for a bachelor\'s degree', 'Any major can lead to law school; what matters is strong writing, reasoning and grades. Most applicants take the LSAT, scored from 120 to 180, and many schools also accept the GRE. Applications go through LSAC with a personal statement, a résumé and letters of recommendation.'],
    ['Law school, first year', 'The 1L year', 'The required first-year subjects: contracts, torts, civil procedure, property, criminal law, constitutional law, legislation and regulation, and legal research and writing. First-year grades weigh heavily for jobs and clerkships.'],
    ['Law school, second and third years', '2L and 3L', 'Evidence, professional responsibility and the other bar subjects, electives, clinics and externships, journals and moot court. Most students take the MPRE, a separate ethics exam scored from 50 to 150, during these years.'],
    ['After graduation', 'The bar exam, after about 2 to 3 months of study', 'The bar exam of the jurisdiction where you will practice. Most jurisdictions use the Uniform Bar Exam, which is being replaced by the NextGen bar exam: first given in July 2026 and scheduled in most jurisdictions by July 2028, with the legacy exam ending in February 2028. A few jurisdictions write their own exams. Admission also requires a passing MPRE score in nearly all jurisdictions and a character and fitness review. This site ends where practice begins.'],
  ];
  App.route(/^path$/, () => {
    App.mount('<div class="wrap"><div class="section"><span class="eyebrow">Why the curriculum is shaped this way</span><h1 class="lesson-title">The path to law</h1>' +
      '<p class="lesson-summary">Law rests on everything before it: close reading and clear writing, reasoning about arguments and evidence, the history and institutions that law grows out of, and enough mathematics and science to handle numbers and expert proof.</p></div>' +
      '<section class="section"><h2>The milestones</h2><div class="panel" style="padding:0"><div class="table-wrap"><table><thead><tr><th>Stage</th><th>Typical timing</th><th>What it builds</th></tr></thead><tbody>' +
      MILESTONES.map((r) => '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<p class="muted" style="max-width:70ch">This site teaches the knowledge. Becoming a lawyer also requires school and college diplomas, admission to law school, a JD from a law school your jurisdiction accepts (usually one approved by the American Bar Association; a few states allow other routes), the MPRE, the bar exam and a character and fitness review. Self-study here does not award credit, degrees or admission to the bar.</p></section>' +
      '<section class="section"><h2>Five strands</h2><div class="grid">' + STRANDS.map((s) => '<div class="panel stack" style="gap:10px"><span class="eyebrow">' + esc(s[0]) + '</span><p class="faint" style="font-size:var(--s-xs)">' + esc(s[1]) + '</p>' +
        '<div class="row" style="gap:6px;flex-wrap:wrap">' + s[2].map((c) => codeTag(c)).join('') + '</div></div>').join('') + '</div></section>' +
      '<div class="row" style="margin-top:22px"><a class="btn btn-primary" href="#courses">Browse all ' + CAT.courses.length + ' courses</a><a class="btn" href="#start">Find your starting point</a></div></div>');
  }, 'path');
})();
