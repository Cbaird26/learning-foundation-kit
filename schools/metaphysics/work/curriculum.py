"""The Metaphysics Learning Foundation curriculum: kindergarten through a college philosophy degree with a
concentration in metaphysics to graduate study and research. K-12 core courses are reused from the Med School
Learning Foundation (same lessons), with metaphysics-oriented notes.
Writes work/courses_raw.json (writer-facing) and work/meta.json (site-facing extras)."""
import json, copy

ROOT = '/home/claude/metaphysics'
MED_RAW = {c['code']: c for c in json.load(open('/home/claude/med/work/courses_raw.json'))}

STAGES = [
    ('K', 'Elementary school (K–5)', 'Numbers, reading and writing, science and the world around us, plus philosophy for children: wondering together about big questions, asking good questions and giving reasons, with a grown-up close by.'),
    ('J', 'Middle school (6–8)', 'Ratios to algebra, reading and writing, the sciences and history, plus reasoning well (arguments, evidence and fallacies) and a first course in the big questions of philosophy.'),
    ('H', 'High school (9–12)', 'Algebra through calculus and statistics, the lab sciences, English and history, plus an introduction to philosophy, logic and critical reasoning, and ethics.'),
    ('C', 'College philosophy degree', 'The core of a philosophy major with a concentration in metaphysics: symbolic logic and logic with Python, the history of philosophy from the ancient Greeks to the twentieth century, ethics, epistemology, philosophy of mind, language, science, physics and religion, two courses in metaphysics, world philosophies, and intermediate and modal logic.'),
    ('P', 'Graduate study and research in metaphysics', 'Graduate seminars in contemporary metaphysics, mind and consciousness, and the metaphysics of science and physics, formal methods, philosophical research and writing, and preparation for qualifying exams and a dissertation prospectus.'),
]
LEVEL = {'K': 'elementary', 'J': 'middle', 'H': 'high', 'C': 'college', 'P': 'professional'}
FINAL_MIN = {'elementary': 30, 'middle': 45, 'high': 60, 'college': 120, 'professional': 120}
HOURS = {'elementary': '2–3', 'middle': '3–4', 'high': '4–6', 'college': '8–12', 'professional': '8–12'}

COURSES = []


def C(code, title, profile, req, soft, purpose, why, ready, reading, units, project, elective=False):
    assert len(units) == 6, code
    assert 'Week 7 midterm' in units[3][2], code
    lvl = LEVEL[code[0]]
    fm = FINAL_MIN[lvl]
    u = []
    for i, (a, b, d) in enumerate(units):
        u.append({'weeks': [2 * i + 1, 2 * i + 2], 'topics': [a, b], 'deliverable': d})
    u.append({'weeks': [13, 14], 'topics': ['Project and review', 'Cumulative final'],
              'deliverable': f'Submit the project; take an unseen {fm} minute final in week 14.'})
    completion = 'finish the project, take the week 7 midterm and week 14 cumulative final, then complete a new cumulative assessment after 1 to 2 weeks. Explain one major idea aloud without notes.'
    COURSES.append({'code': code, 'title': title, 'stage': code[0], 'level': lvl, 'profile': profile, 'req': req, 'soft': soft,
                    'prerequisites': (', '.join(req) if req else 'None') + ('; helpful: ' + ', '.join(soft) if soft else '') + '.',
                    'purpose': purpose, 'why': why, 'ready': ready,
                    'reading': {'title': reading[0], 'url': reading[1]}, 'readingScope': None, 'readingNote': None,
                    'units': u, 'project': project, 'completion': completion, 'supplement': None, 'elective': elective})


# ---------------- K-12: reused from the Med School Learning Foundation ----------------
WHY = {
    'K1': 'Counting and number sense are the start of exact thinking about how many and which.',
    'K2': 'Place value and multiplication train careful, step-by-step reasoning.',
    'K3': 'Fractions and decimals prepare you for probability, logic and the mathematics of later courses.',
    'K4': 'Reading is how you will meet every philosopher on this path.',
    'K5': 'Fluent reading and clear writing are the two main tools of philosophy.',
    'K6': 'Explaining your reasons in writing is the first step toward writing arguments.',
    'K7': 'Noticing and wondering about the world is where philosophy begins.',
    'K8': 'Science shows how to test ideas against evidence, which any account of reality must respect.',
    'K9': 'Communities and history show how people have lived by different ideas.',
    'J1': 'Ratios and rational numbers train exact reasoning, the habit behind logic.',
    'J2': 'Equations and probability begin formal reasoning and reasoning under uncertainty.',
    'J3': 'Functions and geometry teach you to reason from definitions and rules.',
    'J4': 'Close reading and argumentative writing are the daily work of philosophy.',
    'J5': 'Living things raise questions about life, minds and identity that philosophers study.',
    'J6': 'Matter, motion and energy are the physical world that metaphysics tries to understand.',
    'J7': 'Earth and space science give you a sense of time, scale and evidence.',
    'J8': 'History shows where ideas came from and how they shaped the world.',
    'H1': 'Algebra and functions build the formal fluency that logic courses rely on.',
    'H2': 'Geometric proof is the model of rigorous argument that philosophers since Plato have admired.',
    'H3': 'Trigonometry and vectors are needed for the physics behind the philosophy of space and time.',
    'H4': 'Precalculus completes the mathematics needed for calculus and the philosophy of physics.',
    'H5': 'Calculus is the mathematics of change and the infinite, two of the oldest puzzles in metaphysics.',
    'H6': 'Probability and statistics are the basis of reasoning about evidence, chance and confirmation.',
    'H7': 'Biology raises questions about life, organisms, species and minds that metaphysics takes up.',
    'H8': 'Chemistry shows what matter is made of, background for debates about composition and natural kinds.',
    'H9': 'Physics describes space, time, causation and matter, the raw material of metaphysics.',
    'H10': 'Close reading and essay writing prepare you to read and write philosophy.',
    'H11': 'Research and argument-driven writing are the skills behind every philosophy paper.',
    'H12': 'U.S. history and government show how ideas about rights and justice shaped institutions.',
    'H13': 'World history introduces the civilizations whose philosophies you will study.',
}
for code, why in WHY.items():
    t = copy.deepcopy(MED_RAW[code])
    t['why'] = why
    t['reusedFrom'] = 'med:' + code
    t['elective'] = False
    COURSES.append(t)

OCW = 'https://ocw.mit.edu/courses/'
OSX = 'https://openstax.org/details/books/'
SEP = 'https://plato.stanford.edu/'

# ---------------- new K-12 philosophy courses ----------------
C('K10', 'Philosophy for children: wondering, questions and good reasons', 'Y', [], ['K4'],
  'Wonder out loud about big questions with a grown-up (what is real, what is fair, what makes you you, whether animals think, what a friend is, and where numbers are) while learning to ask good questions, give reasons, listen to other views and change your mind for a good reason.',
  'Metaphysics begins with wondering what is real, and good reasons are how philosophers answer.',
  'Asks a question about a picture book that has no easy answer, gives a reason for an opinion with "because", and says what someone who disagrees might think.',
  ('Teaching Children Philosophy (Prindle Institute for Ethics)', 'https://www.prindleinstitute.org/teaching-children-philosophy/'),
  [('Wondering: what is a big question?', 'Asking good questions', 'Say or write five questions about a picture book and circle the big ones.'),
   ('Giving reasons: because', 'Agreeing, disagreeing and listening', 'Give one reason for and one against an answer to a big question.'),
   ('What is real? Dreams, pretend and make-believe', 'Same and different: what makes you you?', 'Draw yourself as a baby and now, and say what stayed the same.'),
   ('Fair and unfair', 'Friends and kindness', 'Week 7 midterm; act out a fair and an unfair way to share.'),
   ('Do animals think? Minds and feelings', 'Numbers, names and things you cannot touch', 'Talk about whether a pet can be happy and why.'),
   ('Time: yesterday, today and tomorrow', 'Changing your mind for a good reason', 'Tell about a time you changed your mind and why.')],
  'Big-question circle: choose a picture book, write three big questions about it with your helper, hold a family "philosophy circle" where everyone gives a reason, and draw or tell what you think now and one good reason someone gave that was different from yours.')

C('J9', 'Reasoning well: arguments, evidence and fallacies', 'T', ['K6'], ['J2'],
  'Spot arguments in everyday talk, pick out premises and conclusions, tell valid from invalid reasoning with simple patterns, judge evidence and sources, reason carefully about samples, causes and chances, recognize common fallacies and biases, and disagree respectfully.',
  'Philosophy is the careful study of arguments, and every later course asks you to build and test them.',
  'Finds the premises and conclusion of a short argument, says whether it is valid, names the fallacy in a flawed one, and explains how a better argument would go.',
  ('Wireless Philosophy (Wi-Phi) on Khan Academy: critical thinking videos', 'https://www.khanacademy.org/partner-content/wi-phi'),
  [('What is an argument? Premises and conclusions', 'Finding arguments in ads, news and conversation', 'Mark the premises and conclusion in ten short passages.'),
   ('Deductive validity: if the premises are true, must the conclusion be?', 'Valid patterns: modus ponens, modus tollens and the syllogism', 'Sort twelve arguments into valid and invalid.'),
   ('Inductive reasoning: samples and generalizations', 'Evidence, sources and how much to trust a claim', 'Rate five sources for a claim and explain each rating.'),
   ('Cause and correlation', 'Chance and probability in everyday reasoning', 'Week 7 midterm; explain why a correlation does not prove a cause.'),
   ('Fallacies of relevance: attacking the person, the straw man and appeals to popularity', 'Fallacies of ambiguity and presumption: equivocation, false dilemma and begging the question', 'Name the fallacy in ten short arguments.'),
   ('Biases in how we think', 'Disagreeing well: charity, the strongest version of a view and changing your mind', 'Rewrite a flawed argument as the strongest version you can.')],
  'Argument portfolio: collect five real arguments from ads, news articles or conversations, map each into premises and a conclusion, judge whether it is valid or strong and whether its premises are true, name any fallacies, and rewrite the weakest one as the best argument for its conclusion that you can make.')

C('J10', 'Big questions: a first course in philosophy', 'W', ['J9'], ['K10', 'J4'],
  'Meet the central questions of philosophy through short readings and thought experiments: what we can know, whether the world is as it seems, what a mind is, whether we have free will, what makes you the same person over time, what time is, whether God exists and what makes actions right, practicing careful reading, discussion and short argumentative writing.',
  'These are the questions metaphysics studies; meeting them early shows why careful argument matters.',
  'Explains a thought experiment such as the brain in a vat or the ship of Theseus, states two opposing answers fairly, and writes a one-page argument for one of them.',
  ('1000-Word Philosophy: an introductory anthology (free)', 'https://1000wordphilosophy.com/'),
  [('What is philosophy? Questions, arguments and thought experiments', 'How to read and discuss philosophy', 'Write a paragraph about a big question that puzzles you.'),
   ('Knowledge and skepticism: could you be dreaming?', 'Appearance and reality: is the world as it seems?', 'Explain the dream argument and one reply.'),
   ('Minds: what is a mind, and could a computer have one?', 'Free will: are your choices up to you?', 'Write one page on whether a robot could think.'),
   ('Personal identity: what makes you the same person over time?', 'Time: does the past still exist?', 'Week 7 midterm; explain the ship of Theseus and two answers.'),
   ('Does God exist? Classic arguments for and against', 'What exists? Numbers, colors, holes and shadows', "Summarize one argument for and one against God's existence fairly."),
   ('Right and wrong: what makes an action right?', 'The meaning of life and how to live', 'Write a one-page argument for your answer to one big question.')],
  "Philosophy dialogue: write a three- to four-page dialogue between two characters who disagree about one big question from the course (free will, minds, personal identity, time or God), in which each gives at least two real arguments and answers the other's objections, then add a half-page note on which argument you find strongest and why.")

C('H14', 'Introduction to philosophy', 'W', ['J10'], ['H10'],
  'Study the main areas of philosophy at a first-year college level: logic and argument, the beginnings of philosophy in Greece and around the world, epistemology, metaphysics, philosophy of mind, free will, philosophy of religion, value theory, ethics and political philosophy, reading primary texts closely and writing argumentative essays.',
  'This survey maps the whole field and shows where metaphysics fits among the other areas.',
  "Reconstructs a philosopher's argument from a short primary text, raises a serious objection to it, and writes a clear four-page argumentative essay.",
  ('OpenStax Introduction to Philosophy (free)', OSX + 'introduction-philosophy'),
  [('What philosophy is and how it works', 'Logic and argument: validity, soundness and strength', 'Reconstruct three arguments in standard form.'),
   ('Socrates, Plato and Aristotle: how philosophy began in Greece', 'Philosophy around the world: India, China, Africa and the Islamic world', "Compare two traditions' answers to one question."),
   ('Epistemology: knowledge, justification and skepticism', 'Metaphysics: substance, universals and the nature of reality', 'Explain a skeptical argument and evaluate one reply.'),
   ('Philosophy of mind: dualism, physicalism and consciousness', 'Free will and determinism', 'Week 7 midterm; write a short essay on the mind-body problem.'),
   ('Philosophy of religion: arguments about God and the problem of evil', 'Value theory: what is good?', "Reconstruct an argument for God's existence and an objection."),
   ('Normative ethics: consequences, duties and virtues', 'Political philosophy: justice, rights and the state', 'Write a four-page argumentative essay.')],
  'Argumentative essay: choose one question from the course, read two short primary texts (public-domain or free online) that answer it differently, reconstruct each argument in standard form, and write a 1,500-word essay that defends an answer and replies to the strongest objection.')

C('H15', 'Logic and critical reasoning', 'T', ['J9', 'H1'], ['H2'],
  "Analyze and evaluate arguments rigorously: standard form and argument diagrams, deductive validity and soundness, categorical logic with Venn diagrams, propositional logic with truth tables, informal fallacies, inductive and statistical reasoning, causal reasoning with Mill's methods, arguments from analogy and inference to the best explanation.",
  'Logic is the toolkit of metaphysics; every argument you meet later is judged with these tools.',
  'Tests an argument for validity with a truth table or a Venn diagram, names its fallacies, and judges the strength of an inductive or causal argument.',
  ('Introduction to Logic and Critical Thinking (Open Textbook Library, free)', 'https://open.umn.edu/opentextbooks/textbooks/introduction-to-logic-and-critical-thinking'),
  [('Arguments, standard form and diagrams', 'Deduction and induction: validity, soundness and strength', 'Put eight passages in standard form and diagram two.'),
   ('Categorical statements and the square of opposition', 'Categorical syllogisms and Venn diagrams', 'Test ten syllogisms with Venn diagrams.'),
   ('Propositional logic: connectives and translation', 'Truth tables for statements: tautologies, contradictions and contingencies', 'Translate ten English sentences into symbols.'),
   ('Truth tables for arguments: testing validity', 'Short truth tables and common valid forms', 'Week 7 midterm; test five arguments with truth tables.'),
   ('Informal fallacies', 'Inductive generalization and statistical reasoning', 'Identify the fallacies in a sample letter to the editor.'),
   ("Causal reasoning and Mill's methods", 'Analogy and inference to the best explanation', 'Evaluate a causal claim from a news report.')],
  'Logic casebook: choose four arguments from public sources (an opinion column, a court opinion, a classic philosophical text and a scientific claim), put each in standard form, test the deductive ones with truth tables or Venn diagrams, evaluate the inductive ones for strength, name every fallacy, and write a one-page verdict on each.')

C('H16', 'Ethics: how should we live?', 'W', ['H14'], [],
  'Examine the main ethical theories (consequentialism, Kantian ethics, virtue ethics, contract theory, care ethics and natural law), ask whether moral claims can be true, and apply the theories to questions about honesty, animals, the environment, wealth and poverty, technology and justice, presenting each side fairly.',
  'Ethics asks what is valuable and what we owe each other, and whether values are real is a metaphysical question.',
  'Applies three ethical theories to a case, explains where they disagree and why, and writes a balanced essay that defends a conclusion.',
  ('OpenStax Introduction to Philosophy: the chapters on value theory, normative moral theory and applied ethics (free)', OSX + 'introduction-philosophy'),
  [('What ethics studies: moral questions and moral reasoning', 'Relativism and disagreement', 'Explain the difference between describing a practice and judging it.'),
   ('Consequentialism and utilitarianism', 'Kant and duty-based ethics', 'Apply both theories to the same case about lying.'),
   ('Virtue ethics', 'Social contract theory and care ethics', 'Compare how three theories judge a dilemma between friends.'),
   ('Natural law and religious ethics', 'Metaethics: can moral claims be true?', 'Week 7 midterm; reconstruct an argument for or against moral realism.'),
   ('Applied ethics: animals and the environment', 'Applied ethics: wealth, poverty and what we owe others', 'Write a balanced analysis of an argument about a duty to give aid.'),
   ('Applied ethics: technology, privacy and AI', 'Justice, rights and fairness', 'Write a balanced essay on one applied question.')],
  'Ethics case study: choose one contested practical question from the course, set out the strongest case on each side with at least two ethical theories, answer the main objections, and write a 1,500-word essay that defends a conclusion while treating the other side fairly.')

# ---------------- College philosophy degree ----------------
C('C1', 'Introduction to symbolic logic', 'T', ['H15'], ['H2'],
  'Learn formal logic as philosophers use it: truth-functional logic (symbolization, truth tables and natural deduction) and first-order logic with quantifiers, identity and relations (symbolization, interpretations and countermodels, and natural deduction proofs), with the ideas of soundness and completeness.',
  'Metaphysicians state and test their theories in formal logic, and graduate programs expect fluency in it.',
  'Symbolizes English sentences with nested quantifiers and identity, proves validity with natural deduction, and shows invalidity with a countermodel.',
  ('forall x: Calgary, an open introduction to formal logic (free)', 'https://forallx.openlogicproject.org/'),
  [('Arguments, validity and formal languages', 'Truth-functional logic: connectives and symbolization', 'Symbolize twenty English sentences.'),
   ('Truth tables: tautologies, entailment and equivalence', 'Partial truth tables and countermodels', 'Test eight arguments with complete or partial truth tables.'),
   ('Natural deduction: the basic rules', 'Natural deduction: conditional proof, indirect proof and strategy', 'Write ten proofs in truth-functional logic.'),
   ('First-order logic: names, predicates and quantifiers', 'Symbolizing multiple generality', 'Week 7 midterm; symbolize ten sentences with nested quantifiers.'),
   ('Identity, definite descriptions and numerical claims', 'Interpretations, models and countermodels', 'Build countermodels for five invalid arguments.'),
   ('Natural deduction for first-order logic', 'Soundness and completeness: what they say and why they matter', 'Write ten proofs with quantifiers.')],
  'Logic workbook: formalize five arguments from classic philosophical texts (for example an ontological argument, a skeptical argument and an argument about personal identity), prove the valid ones in natural deduction, give countermodels for the invalid ones, and write a page on what formalizing each argument revealed.')

C('C2', 'Logic and computation with Python', 'P', ['C1'], ['H1'],
  'Learn Python from scratch by building logic tools: values, conditionals, loops, functions, lists, tuples, strings, dictionaries, sets and recursion, used to represent formulas, evaluate them, print truth tables, test validity and equivalence, convert to normal forms, decide satisfiability by search, check simple proofs and evaluate first-order sentences in finite models.',
  'Programming makes logic concrete, and the same tools later let you check models in modal logic and formal metaphysics.',
  'Writes a tested program that represents formulas, prints their truth tables, decides validity, finds countermodels and evaluates quantified sentences in finite models.',
  ('Python for Everybody (free)', 'https://www.py4e.com/'),
  [('Python basics: values, variables, expressions and printing', "Booleans and conditionals: Python's logical operators", 'Write five programs that use if, and, or and not.'),
   ('Loops and functions', 'Lists, tuples and strings', 'Write functions for the conditional and the biconditional.'),
   ('Representing formulas as nested tuples', 'Recursion: evaluating formulas', 'Write an evaluator for propositional formulas.'),
   ('Generating truth tables with itertools.product', 'Testing tautology, entailment and equivalence', 'Week 7 midterm; print a complete truth table for any formula.'),
   ('Normal forms: negation normal form, CNF and DNF', 'Satisfiability by search and backtracking', 'Convert formulas to CNF and check the result.'),
   ('Sets and dictionaries: finite first-order models', 'Checking natural deduction proofs line by line', 'Evaluate quantified sentences in a finite model.')],
  'Logic toolkit: build and test a small Python module that represents propositional formulas, prints truth tables, decides tautology, entailment and equivalence, converts to CNF, finds countermodels and evaluates first-order sentences in finite models, with a test suite and a short user guide.')

C('C3', 'Ancient philosophy', 'W', ['H14'], ['H13'],
  'Read the founders of Western philosophy in translation: the Presocratics on change and being, Socrates and the Sophists, Plato on the Forms, knowledge, the soul and justice, Aristotle on logic, substance, the four causes, the soul and the good life, and the Hellenistic schools (Epicureans, Stoics and Skeptics).',
  'Metaphysics as a subject begins here: being, substance, cause, change and the soul are Greek questions.',
  "Reconstructs Parmenides' argument against change, Plato's theory of Forms and Aristotle's account of substance and the four causes, and evaluates one of these arguments in a short essay.",
  ('The Internet Classics Archive (MIT): Greek and Roman texts in translation (free)', 'http://classics.mit.edu/'),
  [('The first philosophers: Thales to Heraclitus', 'Parmenides, Zeno and the problem of change', "Reconstruct one of Zeno's paradoxes and a reply."),
   ('The atomists and the Sophists', 'Socrates: questioning, virtue and the examined life', 'Analyze a Socratic definition and its refutation.'),
   ('Plato: the Forms and the divided line', 'Plato: knowledge, recollection and the soul', 'Explain the allegory of the cave in terms of the theory of Forms.'),
   ('Plato: justice and the Republic', 'Aristotle: logic and the categories', 'Week 7 midterm; reconstruct an argument from the Republic.'),
   ('Aristotle: substance, form and matter', 'Aristotle: the four causes, nature and the soul', 'Apply the four causes to three examples.'),
   ('Aristotle: happiness and virtue', 'Hellenistic philosophy: Epicureans, Stoics and Skeptics', 'Compare the Epicurean and Stoic views of death.')],
  "Ancient metaphysics essay: write a 2,000-word essay comparing Plato's and Aristotle's answers to one question (what is most real, what explains change, or what the soul is), using passages from public-domain translations, and evaluate which answer better handles one objection.")

C('C4', 'Medieval philosophy', 'W', ['C3'], ['C19'],
  'Study philosophy from late antiquity to the fourteenth century in the Christian, Islamic and Jewish traditions: Augustine, Boethius, al-Farabi, Avicenna, Averroes, Maimonides, Anselm, Aquinas, Duns Scotus and Ockham on God, being and essence, universals, the soul, time, providence and free will, and faith and reason.',
  'Medieval thinkers sharpened essence and existence, universals and necessity, the core concepts of metaphysics.',
  'Explains the problem of universals and three medieval answers, reconstructs one argument for the existence of God, and assesses the problem of divine foreknowledge.',
  ('Stanford Encyclopedia of Philosophy: Medieval Philosophy (free)', SEP + 'entries/medieval-philosophy/'),
  [('Late antiquity: Neoplatonism and Augustine', 'Augustine on time, evil and free will', "Explain Augustine's puzzle about time."),
   ('Boethius: providence, foreknowledge and freedom', 'The problem of universals: Porphyry and Boethius', "Reconstruct the foreknowledge problem and Boethius's reply."),
   ('Philosophy in the Islamic world: al-Farabi and Avicenna on essence and existence', 'Averroes and Maimonides: faith, reason and the eternity of the world', "Explain Avicenna's distinction between essence and existence."),
   ('Anselm and the ontological argument', 'Aquinas: the five ways', "Week 7 midterm; reconstruct the ontological argument and Gaunilo's reply."),
   ('Aquinas on being, essence and the soul', 'Duns Scotus: univocity and individuation', 'Compare Aquinas and Scotus on what makes something an individual.'),
   ("Ockham: nominalism and the razor", 'The legacy of medieval metaphysics', 'Defend realism or nominalism about universals in two pages.')],
  'Medieval disputation: write a disputed question in the medieval style on one topic (universals, essence and existence, or foreknowledge): state the question, give three objections, a sed contra, your answer with arguments drawn from at least two medieval thinkers, and a reply to each objection, about 2,000 words in all.')

C('C5', 'Early modern philosophy I: Descartes and the rationalists', 'W', ['C3'], ['C4'],
  "Read Descartes, Spinoza and Leibniz on method, certainty, God, substance, mind and body, and freedom and necessity, together with Descartes's critics and correspondents (including Elisabeth of Bohemia) and Malebranche on causation, using modernized versions of the texts.",
  'The rationalists built the great systems of substance and causation that metaphysics still argues with.',
  "Reconstructs the cogito and the argument for the real distinction of mind and body, explains Spinoza's monism and Leibniz's monads, and evaluates one of their arguments.",
  ('Early Modern Texts: free modernized versions of the classic texts', 'https://www.earlymoderntexts.com/'),
  [('The scientific revolution and the new philosophy', 'Descartes: method and doubt', 'Explain the three stages of doubt in the First Meditation.'),
   ('Descartes: the cogito and clear and distinct ideas', 'Descartes: the proofs of God and the Cartesian circle', 'Reconstruct one proof of God and the circle objection.'),
   ('Descartes: mind, body and the real distinction', 'Elisabeth of Bohemia and the problem of interaction', "Write out Elisabeth's objection and the strongest reply."),
   ('Malebranche and occasionalism', 'Spinoza: substance, God and nature', "Week 7 midterm; reconstruct Spinoza's argument that there is only one substance."),
   ('Spinoza: mind, body and freedom', 'Leibniz: monads and pre-established harmony', 'Compare Spinoza and Leibniz on mind and body.'),
   ('Leibniz: the principle of sufficient reason and the best possible world', 'Leibniz: the identity of indiscernibles and the nature of space', 'Evaluate the principle of sufficient reason in two pages.')],
  'Rationalist systems essay: in 2,000 words, compare how Descartes, Spinoza and Leibniz answer one question (how many substances there are, how mind and body are related, or whether everything happens of necessity), reconstruct the central argument of each, and defend the view you find strongest against one objection.')

C('C6', 'Early modern philosophy II: the empiricists and Kant', 'W', ['C5'], [],
  "Read Locke, Berkeley and Hume on ideas, substance, primary and secondary qualities, personal identity, causation, induction and the self, Reid's common-sense reply, and Kant's Critique of Pure Reason on synthetic a priori knowledge, space and time, the categories and the limits of metaphysics.",
  "Hume's challenge to causation and Kant's answer set the terms for every later metaphysics.",
  "Reconstructs Berkeley's argument for idealism, Hume's problem of induction and his account of causation, and explains Kant's distinction between appearances and things in themselves.",
  ('Early Modern Texts: free modernized versions of the classic texts', 'https://www.earlymoderntexts.com/'),
  [('Locke: ideas and the rejection of innate ideas', 'Locke: substance and primary and secondary qualities', 'Sort ten qualities into primary and secondary and explain why.'),
   ('Locke: personal identity and memory', 'Berkeley: to be is to be perceived', "Reconstruct Locke's memory criterion and one objection."),
   ('Berkeley: God, laws of nature and the objection from science', 'Hume: impressions, ideas and the copy principle', "Reconstruct Berkeley's master argument and evaluate it."),
   ('Hume: causation and necessary connection', 'Hume: the problem of induction', 'Week 7 midterm; reconstruct the problem of induction.'),
   ('Hume: the self, skepticism and natural belief', 'Reid: common sense and the reply to Hume', "Compare Hume's bundle view of the self with Reid's reply."),
   ('Kant: synthetic a priori judgments, space and time', 'Kant: the categories, the antinomies and the limits of metaphysics', "Explain one antinomy and Kant's resolution.")],
  "Causation from Hume to Kant: write a 2,000-word essay that reconstructs Hume's account of causation and his problem of induction, explains how Kant answers Hume, and evaluates whether Kant's answer succeeds, using passages from the modernized texts.")

C('C7', 'Ethics: normative theory and metaethics', 'W', ['H16'], ['C1'],
  'Study ethics at the level of a university ethics course: well-being and value, consequentialism, Kantian ethics, contractualism, virtue ethics, moral luck and responsibility, and metaethics (naturalist and non-naturalist realism, error theory, expressivism, constructivism, moral knowledge and the is-ought gap), with careful reconstruction of arguments.',
  'Metaethics asks whether values are part of reality, a metaphysical question at the heart of ethics.',
  'States and evaluates the main normative theories with counterexamples, and explains the debate between moral realists and anti-realists with the strongest argument on each side.',
  ('MIT OpenCourseWare 24.231 Ethics (free)', OCW + '24-231-ethics-fall-2009/'),
  [('Well-being: hedonism, desire satisfaction and objective lists', 'Consequentialism: the theory and its variants', 'Test three theories of well-being against cases.'),
   ('Objections to consequentialism: demandingness, rights and integrity', 'Kantian ethics: the categorical imperative', 'Apply the formula of universal law to four maxims.'),
   ('Contractualism and the social contract', 'Virtue ethics: character and the good life', 'Compare how contractualism and virtue ethics treat one case.'),
   ('Moral luck and responsibility', 'Metaethics: the questions and the map of positions', 'Week 7 midterm; analyze a moral luck case.'),
   ('Moral realism: naturalist and non-naturalist', 'Anti-realism: error theory and expressivism', 'Reconstruct the open question argument and one reply.'),
   ('Constructivism and moral knowledge', 'The is-ought gap and moral disagreement', 'Write a three-page essay on moral realism.')],
  'Metaethics paper: write a 2,500-word paper that reconstructs one central argument in metaethics (the argument from disagreement, the argument from queerness, the open question argument or the Frege-Geach problem), evaluates the strongest reply, and defends a conclusion while treating the other side fairly.')

C('C8', 'Epistemology', 'W', ['C1'], ['C6'],
  "Study the theory of knowledge: the analysis of knowledge and the Gettier problem, theories of justification (foundationalism, coherentism, reliabilism, internalism and externalism), skepticism and its replies, a priori knowledge, perception, induction, testimony and social epistemology, and formal epistemology with credences and Bayes's theorem.",
  'How we can know what is real is the twin of what is real; metaphysical claims need epistemic credentials.',
  "Builds a Gettier case, compares the main theories of justification, evaluates a skeptical argument, and updates a credence with Bayes's theorem.",
  ('MIT OpenCourseWare 24.211 Theory of Knowledge (free)', OCW + '24-211-theory-of-knowledge-spring-2014/'),
  [('The analysis of knowledge: justified true belief', 'The Gettier problem and responses', 'Construct two new Gettier cases.'),
   ('Foundationalism and coherentism', 'Reliabilism, internalism and externalism', 'Apply three theories of justification to the same case.'),
   ('Skepticism: dreams, demons and brains in vats', 'Replies to skepticism: Moore, contextualism and closure', 'Reconstruct the closure argument for skepticism.'),
   ('A priori knowledge and rational intuition', 'Perception and the given', 'Week 7 midterm; evaluate one reply to skepticism.'),
   ('Induction and inference to the best explanation', 'Testimony and social epistemology', 'Defend a view of when to trust testimony.'),
   ("Formal epistemology: credences, probability and Bayes's theorem", 'Peer disagreement and the ethics of belief', "Update credences with Bayes's theorem in four cases.")],
  'Epistemology paper: write a 2,500-word paper on one problem (Gettier cases, skepticism, the a priori or peer disagreement) that reconstructs the main argument, compares two responses, and defends one, with at least one case or worked example of your own.')

C('C9', 'Philosophy of mind', 'W', ['C1'], ['C6', 'H7'],
  'Study the mind-body problem and its main answers (substance and property dualism, behaviorism, the identity theory, functionalism and eliminativism), the Turing test and the Chinese room, intentionality, mental causation, consciousness and the hard problem, the knowledge and zombie arguments, and personal identity and the self.',
  'Whether minds are physical is one of the central questions of metaphysics.',
  'Explains each major theory of mind with its best argument and main objection, and reconstructs the knowledge argument and the zombie argument with replies.',
  ('MIT OpenCourseWare 24.09 Minds and Machines (free)', OCW + '24-09-minds-and-machines-fall-2011/'),
  [('The mind-body problem and Cartesian dualism', 'Behaviorism', "Reconstruct Descartes's argument for dualism and one objection."),
   ('The mind-brain identity theory', 'Functionalism and multiple realizability', 'Explain multiple realizability with three examples.'),
   ('Machines and minds: the Turing test', 'The Chinese room and replies', 'Evaluate the systems reply to the Chinese room.'),
   ('Intentionality and mental content', 'Mental causation and the exclusion problem', 'Week 7 midterm; reconstruct the exclusion argument.'),
   ('Consciousness and the hard problem', 'The knowledge argument and the zombie argument', 'Reconstruct the knowledge argument and the ability reply.'),
   ('Eliminativism, illusionism and panpsychism', 'Personal identity and the self', 'Write a three-page essay on the hard problem.')],
  'Philosophy of mind paper: write a 2,500-word paper defending an answer to one question (can physicalism explain consciousness, could a machine think, or is mental causation a problem for nonreductive physicalism), reconstructing the strongest opposing argument and replying to it.')

C('C10', 'Metaphysics I: existence, objects and persistence', 'W', ['C1', 'C6'], ['C3'],
  'Study the core of contemporary metaphysics about what there is: the aims and methods of metaphysics, existence and ontological commitment, universals and properties (realism, nominalism and tropes), abstract objects, substance and the bundle theory, material constitution, composition and the special composition question, persistence (endurance and perdurance), and personal identity.',
  'This is the heart of metaphysics: what exists, and what it takes for things to exist and persist.',
  "States Quine's criterion of ontological commitment, compares realism and nominalism about properties, and evaluates answers to the puzzles of constitution, composition and persistence.",
  ('Stanford Encyclopedia of Philosophy (free): entries on ontological commitment, properties, material constitution and temporal parts', SEP),
  [('What is metaphysics? Aims and methods', 'Existence and ontological commitment', 'Find the ontological commitments of five sentences.'),
   ('Universals and the problem of the one over many', 'Nominalism, tropes and resemblance', 'Compare realism and trope theory on one case.'),
   ('Abstract objects: numbers and the epistemological challenge', 'Substance, bundles and bare particulars', 'Reconstruct the epistemological argument against platonism.'),
   ('Material constitution: the statue and the clay', 'Composition: the special composition question', 'Week 7 midterm; evaluate three answers to the special composition question.'),
   ('Persistence: endurance, perdurance and stages', 'Change and the problem of temporary intrinsics', 'Explain how a perdurantist handles change.'),
   ('Personal identity: psychological and biological views', 'Fission, survival and what matters', 'Write a three-page essay on fission cases.')],
  'Metaphysics paper: write a 2,500-word paper on one puzzle from the course (the statue and the clay, the special composition question, the ship of Theseus, temporary intrinsics or fission) that states the puzzle precisely, compares two solutions with their costs, and defends one.')

C('C11', 'Metaphysics II: modality, causation, laws, time and free will', 'W', ['C10'], ['C9', 'C21'],
  'Study the metaphysics of how things could be and why they happen: possible worlds (modal realism, ersatzism and fictionalism), essence and de re modality, dispositions and powers, causation (regularity, counterfactual and process theories), laws of nature (Humean and non-Humean), time (the A-theory and the B-theory, presentism, eternalism and the growing block, and time travel) and free will (compatibilism, libertarianism and skepticism).',
  'Necessity, causation, laws, time and freedom are the structure of reality that metaphysics tries to describe.',
  'Explains the main views of possible worlds, compares theories of causation and laws using counterexamples, and evaluates arguments about time and free will.',
  ('Stanford Encyclopedia of Philosophy (free): entries on possible worlds, causation, laws of nature, time and free will', SEP),
  [('Modality: necessity, possibility and possible worlds', 'Modal realism, ersatzism and fictionalism', 'Evaluate the incredulous stare objection to modal realism.'),
   ('Essence and de re modality', 'Dispositions and powers', 'Compare a modal and a definitional account of essence.'),
   ('Causation: regularity and counterfactual theories', 'Problems for counterfactual theories: preemption and overdetermination', 'Analyze a preemption case with a counterfactual theory.'),
   ('Process theories and causal pluralism', 'Laws of nature: Humean and non-Humean views', 'Week 7 midterm; compare the best-system account with a governing view of laws.'),
   ('Time: McTaggart, the A-theory and the B-theory', 'Presentism, eternalism, the growing block and time travel', "Reconstruct McTaggart's argument and one reply."),
   ('Free will: the consequence argument and compatibilism', 'Libertarianism, Frankfurt cases and free will skepticism', 'Write a three-page essay on the consequence argument.')],
  'Metaphysics paper: write a 2,500-word paper on one debate (modal realism, the counterfactual theory of causation, Humean laws, presentism or the consequence argument) that states the strongest argument on each side, uses at least one case or thought experiment of your own, and defends a conclusion.')

C('C12', 'Philosophy of language', 'W', ['C1'], ['C10'],
  'Study meaning and reference: Frege on sense and reference, Russell on definite descriptions, Kripke on names and necessity, rigid designation and the necessary a posteriori, natural kind terms and externalism, theories of truth and truth-conditional semantics, speech acts and implicature, and context, indexicals and vagueness.',
  'Much of twentieth-century metaphysics was done through the philosophy of language, where names, necessity and truth meet.',
  "Explains Frege's puzzle, Russell's theory of descriptions and Kripke's arguments against descriptivism, and applies them to sentences about what exists and what is necessary.",
  ('MIT OpenCourseWare 24.251 Introduction to Philosophy of Language (free)', OCW + '24-251-introduction-to-philosophy-of-language-fall-2011/'),
  [('Meaning, reference and truth', 'Frege: sense and reference', "Explain Frege's puzzle with two new examples."),
   ('Russell: definite descriptions and negative existentials', 'Strawson, presupposition and referential uses', "Analyze four sentences with Russell's theory."),
   ('Kripke: names and the modal argument', 'Rigid designation and the necessary a posteriori', 'Reconstruct the modal argument against descriptivism.'),
   ('The causal theory of reference and natural kind terms', 'Twin Earth and externalism about meaning', 'Week 7 midterm; explain the Twin Earth argument.'),
   ('Truth: correspondence, deflationism and Tarski', 'Truth-conditional semantics and compositionality', "State Tarski's convention T and give instances."),
   ('Speech acts and implicature', 'Context, indexicals and vagueness', 'Explain one implicature and one context-sensitive term.')],
  'Philosophy of language paper: write a 2,500-word paper on how a theory of names or descriptions bears on a metaphysical question (negative existentials, the necessary a posteriori, or names in fiction), reconstructing the main arguments and defending a view.')

C('C13', 'Philosophy of science', 'W', ['C1', 'H6'], ['H9'],
  'Study how science works and what it tells us about reality: the demarcation problem and falsification, confirmation and the paradoxes of induction, Bayesian confirmation, explanation, Kuhn and scientific revolutions, Lakatos and Feyerabend, scientific realism and anti-realism, underdetermination and structural realism, reduction and emergence, and values in science.',
  'Metaphysics must fit with what science says, and scientific realism is itself a metaphysical stance.',
  'Explains falsificationism and its problems, computes a Bayesian update on evidence, and evaluates the no-miracles argument against the pessimistic induction.',
  ('Internet Encyclopedia of Philosophy: articles on the philosophy of science (free)', 'https://iep.utm.edu/'),
  [('What is science? The demarcation problem', 'Popper and falsification', 'Apply falsificationism to three theories.'),
   ('Confirmation, induction and the raven paradox', 'Bayesian confirmation', 'Compute Bayesian updates for three pieces of evidence.'),
   ('Explanation: the covering-law model and its rivals', 'Kuhn: paradigms and scientific revolutions', "Analyze a historical theory change with Kuhn's concepts."),
   ('Lakatos, Feyerabend and the rationality of science', 'Scientific realism and the no-miracles argument', 'Week 7 midterm; reconstruct the no-miracles argument.'),
   ('Anti-realism: constructive empiricism and the pessimistic induction', 'Underdetermination and structural realism', 'Evaluate the pessimistic induction.'),
   ('Reduction, emergence and the special sciences', 'Values, objectivity and science in society', 'Write a three-page essay on scientific realism.')],
  'Case study in the philosophy of science: choose a historical episode (the Copernican revolution, the discovery of oxygen, continental drift or the acceptance of atoms), describe it accurately from reliable sources, and write a 2,500-word paper that uses it to test one view from the course (falsificationism, Kuhn, Bayesianism or scientific realism).')

C('C14', 'Philosophy of physics: space, time and quantum mechanics', 'T', ['C13', 'H9'], ['H5', 'C11'],
  "Study what physics says about reality, with the mathematics it needs: absolute and relational space from Newton and Leibniz, the bucket argument, special relativity (spacetime diagrams, the relativity of simultaneity, time dilation and the twin paradox) and its bearing on the metaphysics of time, entropy and the direction of time, and quantum mechanics (states and probabilities, measurement, entanglement and Bell's theorem) with its main interpretations.",
  'Space, time, causation and the nature of matter are metaphysical questions on which physics has its say.',
  'Computes time dilation and simultaneity shifts in special relativity, works simple quantum probabilities, derives the CHSH bound, and explains how the main interpretations answer the measurement problem.',
  ('MIT OpenCourseWare 24.111 Philosophy of Quantum Mechanics (free)', OCW + '24-111-philosophy-of-quantum-mechanics-spring-2005/'),
  [('Newton and Leibniz: absolute and relational space', 'The bucket argument and Galilean relativity', 'Reconstruct the bucket argument and the relationist reply.'),
   ('Special relativity: the postulates, simultaneity and spacetime diagrams', 'Time dilation, length contraction and the twin paradox', 'Compute time dilation and the ages of the twins.'),
   ('Relativity and the metaphysics of time: presentism and the block universe', 'Entropy and the direction of time', 'Evaluate the argument from relativity against presentism.'),
   ('Quantum mechanics I: states, superposition and probabilities', 'Quantum mechanics II: measurement and the measurement problem', 'Week 7 midterm; compute outcome probabilities for spin measurements.'),
   ('Entanglement, EPR and locality', "Bell's theorem and the CHSH inequality", 'Derive the CHSH bound and the quantum value.'),
   ('Interpretations: collapse, pilot-wave and many-worlds', 'Interpretations: QBism, relational views and what quantum mechanics says about reality', 'Write a three-page comparison of two interpretations.')],
  'Interpretation report: choose two interpretations of quantum mechanics, explain how each answers the measurement problem using a worked example (a spin measurement or a Bell experiment), state what each says exists, compare their costs, and write a 2,500-word report that defends one or explains why the question remains open.')

C('C15', 'Philosophy of religion', 'W', ['C5'], ['C4', 'C11'],
  'Examine the main questions of the philosophy of religion fairly, drawing on several traditions: the concept of God and the divine attributes, cosmological, design, fine-tuning and ontological arguments, the principle of sufficient reason, religious experience, the logical and evidential problems of evil, miracles, faith and reason, religious diversity, and non-theistic and naturalistic views.',
  'Whether there is a necessary being or a first cause is one of the oldest metaphysical questions.',
  "Reconstructs the main arguments for and against God's existence with their best objections, and explains the logical and evidential problems of evil without taking sides.",
  ('Introduction to Philosophy: Philosophy of Religion (Rebus Community, free)', 'https://press.rebus.community/intro-to-phil-of-religion/'),
  [('What the philosophy of religion asks', 'The concept of God: omnipotence, omniscience and goodness', 'Explain the paradox of the stone and two replies.'),
   ('Cosmological arguments: the kalam and contingency arguments', 'The principle of sufficient reason', 'Reconstruct the contingency argument and its key premise.'),
   ('Design arguments', 'Fine-tuning and the multiverse reply', 'Evaluate the fine-tuning argument and the multiverse reply.'),
   ('Ontological arguments: Anselm, Descartes and the modal version', 'Religious experience', 'Week 7 midterm; reconstruct a modal ontological argument.'),
   ('The logical problem of evil and the free will defense', 'The evidential problem of evil and skeptical theism', 'Reconstruct the evidential argument from evil and one reply.'),
   ('Miracles, faith and reason', 'Religious diversity and non-theistic traditions', 'Write a balanced essay on one argument.')],
  'Balanced dialogue: write a 2,500-word dialogue in which a theist, an atheist and an agnostic examine one argument (cosmological, fine-tuning, ontological or the problem of evil), each giving the strongest version of their view and replying to the others, followed by a one-page assessment of which considerations carry the most weight and why.')

C('C16', 'Kant, Hegel and nineteenth-century philosophy', 'W', ['C6'], [],
  "Study Kant's Critique of Pure Reason in depth (the transcendental aesthetic, the deduction of the categories, the analogies of experience and the refutation of idealism), then German idealism (Fichte, Schelling and Hegel), Schopenhauer, Marx's historical materialism, Kierkegaard, Nietzsche, Mill and the pragmatists Peirce and James.",
  "Kant's critique and the idealist systems after it shaped how later metaphysics understood its own limits.",
  "Explains the transcendental deduction and the second analogy, describes Hegel's dialectic accurately, and compares two nineteenth-century responses to Kant.",
  ('Kant, The Critique of Pure Reason, translated by J. M. D. Meiklejohn (Project Gutenberg, free)', 'https://www.gutenberg.org/ebooks/4280'),
  [('The Critique of Pure Reason: the project of critique', 'The transcendental aesthetic: space and time', 'Reconstruct the argument that the representation of space is a priori.'),
   ('The transcendental deduction of the categories', 'The analogies of experience: substance and causation', "Explain the second analogy's reply to Hume."),
   ('The refutation of idealism and the paralogisms', 'Transcendental idealism: two-world and two-aspect readings', 'Compare the two readings of things in themselves.'),
   ('Fichte and Schelling', 'Hegel: phenomenology, dialectic and the absolute', 'Week 7 midterm; explain the dialectic of lordship and bondage.'),
   ('Schopenhauer: the world as will and representation', 'Marx: historical materialism', "Compare Schopenhauer's and Marx's breaks with Hegel."),
   ('Kierkegaard, Nietzsche and the critique of metaphysics', 'Mill and the pragmatists: Peirce and James', 'Explain the pragmatic maxim with three examples.')],
  "Kant and after: write a 2,500-word paper that reconstructs one argument from the Critique of Pure Reason (the transcendental deduction, the second analogy or the refutation of idealism), presents one nineteenth-century philosopher's response to it, and evaluates whether the response succeeds.")

C('C17', 'Twentieth-century analytic philosophy', 'W', ['C1', 'C6'], ['C12'],
  "Trace analytic philosophy from Frege, Russell and Moore through Wittgenstein's Tractatus, the logical positivists and the verification principle, Carnap and Quine on ontology and analyticity, ordinary language philosophy and the later Wittgenstein, to the revival of metaphysics with modal logic, Kripke and Lewis.",
  'The story of how metaphysics was rejected and then revived explains the methods metaphysicians use today.',
  "Explains the verification principle and its problems, reconstructs Quine's case against the analytic-synthetic distinction, and explains how modal logic and possible worlds brought metaphysics back.",
  ('Internet Encyclopedia of Philosophy: Analytic Philosophy (free)', 'https://iep.utm.edu/analytic/'),
  [('Frege and the new logic', 'Russell and Moore: the revolt against idealism', "Explain Russell's paradox and why it mattered."),
   ('Logical atomism and the Tractatus', 'The Vienna Circle and the verification principle', 'Apply the verification principle to five sentences.'),
   ('Problems for verificationism', 'Carnap: linguistic frameworks and internal and external questions', "Explain Carnap's distinction between internal and external questions."),
   ('Quine: "Two Dogmas of Empiricism" and analyticity', 'Quine: naturalized epistemology and ontological relativity', "Week 7 midterm; reconstruct Quine's case against analyticity."),
   ('The later Wittgenstein: meaning as use and rule-following', 'Ordinary language philosophy: Austin and Ryle', 'Explain the private language argument.'),
   ('The return of metaphysics: modal logic, Kripke and Lewis', 'Analytic philosophy today: naturalism and its critics', 'Write a three-page essay on the Carnap-Quine debate.')],
  'History of a debate: write a 2,500-word paper tracing one debate (verificationism and its fall, the analytic-synthetic distinction, or the Carnap-Quine debate about ontology) from its origin to its present state, reconstructing the key arguments and assessing which side has the better of it today.')

C('C18', 'Phenomenology, existentialism and process philosophy', 'W', ['C16'], [],
  "Study the continental and process traditions on being and experience: Brentano and Husserl on intentionality and the phenomenological method, Heidegger's question of being and being-in-the-world, Sartre and de Beauvoir on freedom and existence, Merleau-Ponty on the body and perception, Bergson on duration, and Whitehead's process metaphysics.",
  'These traditions approach being and time through experience and process, offering real alternatives within metaphysics.',
  "Explains the phenomenological reduction, Heidegger's ontological difference and Whitehead's actual occasions, and compares one of them with an analytic view of the same question.",
  ('Stanford Encyclopedia of Philosophy: Phenomenology (free)', SEP + 'entries/phenomenology/'),
  [('Brentano and intentionality', 'Husserl: the phenomenological method and the epoché', 'Describe an experience using the phenomenological method.'),
   ('Husserl: time-consciousness and the lifeworld', 'Heidegger: the question of being', "Explain Husserl's retention and protention."),
   ('Heidegger: being-in-the-world and the ready-to-hand', 'Heidegger: time, death and authenticity', 'Explain readiness-to-hand with three examples.'),
   ('Sartre: being and nothingness', 'de Beauvoir: the ethics of ambiguity and The Second Sex', "Week 7 midterm; explain Sartre's claim that existence precedes essence."),
   ('Merleau-Ponty: the body and perception', 'Bergson: duration and becoming', "Compare Bergson's duration with clock time."),
   ('Whitehead: process and reality', 'Process thought, analytic metaphysics and the dialogue between traditions', 'Write a three-page comparison of process and substance views.')],
  'Comparative paper: write a 2,500-word paper comparing how a phenomenological, existentialist or process philosopher and an analytic metaphysician answer the same question (what time is, what a self is, or what it is to exist), and assess what each approach captures that the other misses.')

C('C19', 'World philosophies: Indian, Chinese, Islamic and African metaphysics', 'W', ['C3'], ['C4'],
  'Study metaphysics in several world traditions as philosophy, with careful attention to arguments: Indian schools (Nyaya-Vaisheshika realism, Samkhya, Advaita Vedanta, Buddhist no-self and momentariness, and Nagarjuna on emptiness), Chinese philosophy (Daoism, and Confucian and Neo-Confucian metaphysics of li and qi), Islamic philosophy (kalam atomism and occasionalism, al-Ghazali, Avicenna and Mulla Sadra) and African philosophy (personhood and ubuntu), compared with Western views.',
  'Other traditions argued about self, substance, causation and emptiness with rigor, and they offer real alternatives.',
  "Reconstructs the Buddhist argument for no-self, Nagarjuna's argument about emptiness and al-Ghazali's critique of necessary causal connection, and compares one of them with a Western view.",
  ('Internet Encyclopedia of Philosophy: articles on Indian, Chinese, Islamic and African philosophy (free)', 'https://iep.utm.edu/'),
  [('Comparative philosophy: methods and pitfalls', 'Nyaya-Vaisheshika: categories, substances and universals', "Compare the Vaisheshika categories with Aristotle's."),
   ('Samkhya and Advaita Vedanta: consciousness and Brahman', 'Buddhist metaphysics: no-self and dependent origination', 'Reconstruct the chariot argument for no-self.'),
   ('Buddhist momentariness and the Abhidharma', 'Nagarjuna: emptiness and the two truths', 'Explain the two truths with an example.'),
   ('Daoism: the Dao, change and non-being', 'Confucian and Neo-Confucian metaphysics: li and qi', 'Week 7 midterm; compare li and qi with form and matter.'),
   ('Kalam: atoms, accidents and occasionalism', "al-Ghazali on causation; Mulla Sadra on the primacy of existence", 'Compare al-Ghazali and Hume on causation.'),
   ('African philosophy: personhood, community and ubuntu', 'Comparative metaphysics: what traditions can learn from each other', 'Write a three-page comparison across two traditions.')],
  'Comparative metaphysics paper: write a 2,500-word paper that reconstructs one argument from a non-Western tradition (the Buddhist argument for no-self, Nagarjuna on causation, al-Ghazali on causation, or a Neo-Confucian account of li and qi), sets it beside a Western view of the same question, and evaluates both on their own terms.')

C('C20', 'Intermediate logic: metalogic, sets and incompleteness', 'T', ['C1', 'C2'], ['C17'],
  "Study logic about logic: naive set theory, relations, functions and cardinality (countable and uncountable sets and Cantor's diagonal argument), induction on formulas, the soundness and completeness of first-order logic, compactness and the Löwenheim-Skolem theorems, Turing machines and the halting problem, and Gödel's incompleteness theorems, using Python for set operations, encodings and diagonalization.",
  'Metaphysicians use set theory and metalogic constantly, and incompleteness bears on minds, truth and proof.',
  'Proves a cardinality result with a bijection or a diagonal argument, explains the completeness and compactness theorems, and outlines the proof of the first incompleteness theorem.',
  ('The Open Logic Project: Sets, Logic, Computation and Incompleteness and Computability (free)', 'https://builds.openlogicproject.org/'),
  [('Sets, subsets and operations', 'Relations, functions and orders', 'Prove five set identities and check them in Python.'),
   ('Countable sets and bijections', "Cantor's diagonal argument and uncountable sets", 'Build a bijection between the natural numbers and the integers.'),
   ('Induction on formulas and structural recursion', 'Soundness of propositional and first-order logic', 'Prove a property of all formulas by induction.'),
   ('Completeness: maximal consistent sets and Henkin models', 'Compactness and the Löwenheim-Skolem theorems', "Week 7 midterm; explain the main steps of the completeness proof."),
   ('Computability: Turing machines and the Church-Turing thesis', 'The halting problem and undecidability', 'Simulate a small Turing machine in Python.'),
   ('Arithmetization and Gödel numbering', 'The incompleteness theorems and their philosophical significance', 'Gödel-number five formulas and decode three.')],
  "Metalogic report: write a careful proof of one major result (Cantor's theorem, the undecidability of the halting problem or the compactness theorem) with every step justified, implement a Python demonstration of its key construction (a diagonal argument, a reduction or an encoding), and write a page on the result's philosophical significance.")

C('C21', 'Modal logic and formal metaphysics', 'T', ['C20'], ['C11'],
  'Learn modal logic and its uses in metaphysics: the language of necessity and possibility, Kripke models and frames, the systems K, T, S4 and S5 and their frame conditions, proofs and countermodels, quantified modal logic with varying domains and the Barcan formula, counterfactuals in Lewis-Stalnaker semantics, temporal and deontic logic, and formalized arguments in metaphysics, with Python model checkers.',
  'Modal logic is the formal language of possibility and necessity in which metaphysics now states its theories.',
  'Evaluates modal formulas in Kripke models by hand and in code, proves or refutes validity in K, T, S4 and S5, and formalizes a modal argument from metaphysics.',
  ('Boxes and Diamonds: an open introduction to modal logic (Open Logic Project, free)', 'https://bd.openlogicproject.org/'),
  [('The modal language: necessity, possibility and duality', 'Kripke models: worlds, accessibility and truth', 'Evaluate ten formulas in a Kripke model by hand and in Python.'),
   ('Validity in frames and the system K', 'Frame conditions: reflexive, transitive, symmetric and Euclidean', 'Prove which axioms each frame condition validates.'),
   ('The systems T, S4 and S5', 'Proofs in modal logic', 'Prove five theorems in S4 and S5.'),
   ('Countermodels and the finite model property', 'Quantified modal logic: domains and the Barcan formula', 'Week 7 midterm; build countermodels for five invalid formulas.'),
   ('Counterfactuals: Lewis-Stalnaker semantics', 'Temporal logic and deontic logic', 'Evaluate counterfactuals in a model with a similarity ordering.'),
   ('Formal metaphysics: the modal ontological argument', 'Necessitism, contingentism and the logic of existence', 'Formalize a modal argument and test it in S5.')],
  'Modal model checker: write and test a Python program that represents Kripke models, evaluates propositional modal formulas, checks frame conditions and tests formulas for validity on all frames up to a small size, then use it to analyze one modal argument from metaphysics and write a two-page report on what you found.')

# ---------------- Graduate study and research in metaphysics ----------------
C('P1', 'Contemporary metaphysics: grounding, fundamentality and metaontology', 'W', ['C10', 'C11'], ['C17', 'C21'],
  'Work through current research in metaphysics at the graduate level: metaontology (Quine, Carnap and their successors, quantifier variance and easy ontology), grounding and metaphysical explanation, fundamentality and priority monism, essence and real definition, Humean supervenience and its rivals, powers, metaphysical indeterminacy, and the epistemology of metaphysics, reading research papers and writing seminar papers.',
  'Grounding, fundamentality and metaontology are where the research frontier of metaphysics is today.',
  'Presents a current debate fairly at seminar level, reconstructs a recent argument from a research paper, and writes a seminar paper with an original objection or reply.',
  ('Stanford Encyclopedia of Philosophy: Metaphysical Grounding (free)', SEP + 'entries/grounding/'),
  [('Metaontology: Quine, Carnap and the existence question', 'Deflationism, quantifier variance and easy ontology', 'Write a seminar response paper on quantifier variance.'),
   ('Grounding: the idea and its logic', 'Skepticism about grounding and its alternatives', 'Present the formal properties of grounding with examples.'),
   ('Fundamentality, levels and priority monism', 'Essence and real definition', 'Reconstruct the argument for priority monism.'),
   ('Humean supervenience and its rivals', 'Powers, dispositions and the new essentialism', 'Week 7 midterm; write a seminar paper proposal.'),
   ('Metaphysical indeterminacy and vagueness in the world', 'Time and tense in current metaphysics', 'Present a recent argument about metaphysical indeterminacy.'),
   ('The epistemology of metaphysics: intuitions, theoretical virtues and naturalism', 'Writing and presenting a seminar paper', 'Submit a seminar paper draft for review.')],
  'Seminar paper: write a 5,000- to 7,000-word seminar paper on one current debate from the course that surveys the literature accurately, reconstructs the main argument, and defends an original objection, reply or refinement; revise it after written feedback and present it in 20 minutes.')

C('P2', 'Mind, consciousness and AI seminar', 'W', ['C9'], ['C11', 'C20'],
  'Study current research on the metaphysics of mind: scientific and philosophical theories of consciousness (higher-order, representationalist, global workspace and integrated information theories), the hard problem and illusionism, panpsychism and the combination problem, mental causation, the self, and whether artificial intelligence systems, including large language models, could understand, be conscious or have moral status.',
  'Consciousness may be the hardest case for any complete metaphysics, and artificial intelligence makes the questions urgent.',
  'Compares the main theories of consciousness fairly, evaluates arguments about machine understanding and consciousness, and writes a seminar paper with an original contribution.',
  ('Stanford Encyclopedia of Philosophy: Consciousness (free)', SEP + 'entries/consciousness/'),
  [('The problems of consciousness', 'Physicalism, the explanatory gap and the hard problem', 'Write a response paper on the explanatory gap.'),
   ('Higher-order and representationalist theories', 'Global workspace and integrated information theories', 'Compare how two theories explain the same experiment.'),
   ('Illusionism and the meta-problem', 'Panpsychism, Russellian monism and the combination problem', 'Reconstruct the combination problem.'),
   ('Mental causation revisited', 'The self, personal identity and the brain', 'Week 7 midterm; write a seminar paper proposal.'),
   ('AI and understanding: from the Chinese room to language models', 'Could an AI system be conscious? Theories, indicators and tests', 'Evaluate an argument about whether language models understand.'),
   ('Moral status: animals and AI', 'Writing and presenting a seminar paper', 'Submit a seminar paper draft for review.')],
  'Seminar paper: write a 5,000- to 7,000-word seminar paper on one question (the hard problem, illusionism, the combination problem or AI consciousness) that surveys the literature accurately, reconstructs the strongest opposing view and offers an original argument; revise it after written feedback.')

C('P3', 'Metaphysics of science and physics seminar', 'W', ['C14', 'C11'], ['C13'],
  'Study current research where metaphysics meets physics: naturalized metaphysics, the metaphysics of spacetime (substantivalism, relationalism and the hole argument), laws, symmetries and structure, chance, the direction of time and the past hypothesis, the metaphysics of quantum mechanics (wave function realism, primitive ontology, many worlds and branching), nonlocality and relativity, emergence, and the possible emergence of spacetime in quantum gravity.',
  'Our best physics constrains, and is interpreted by, metaphysical theories of space, time, laws and matter.',
  'Explains the hole argument, the debate over wave function realism and the role of the past hypothesis, and writes a seminar paper that engages the physics accurately.',
  ('Stanford Encyclopedia of Philosophy: Quantum Mechanics (free)', SEP + 'entries/qm/'),
  [('Naturalized metaphysics and its critics', 'The metaphysics of spacetime: substantivalism and relationalism', 'Write a response paper on naturalized metaphysics.'),
   ('The hole argument and its responses', 'Laws, symmetries and structure', 'Reconstruct the hole argument.'),
   ('Chance and probability in physics', 'The direction of time and the past hypothesis', 'Explain how the past hypothesis is meant to ground the arrow of time.'),
   ('Wave function realism and primitive ontology', 'Many worlds, branching and probability', 'Week 7 midterm; write a seminar paper proposal.'),
   ("Nonlocality, relativity and Bell's theorem", 'Emergence and levels in physics', 'Present the tension between nonlocality and relativity.'),
   ('Quantum gravity and the possible emergence of spacetime', 'Writing and presenting a seminar paper', 'Submit a seminar paper draft for review.')],
  'Seminar paper: write a 5,000- to 7,000-word seminar paper on one question at the boundary of metaphysics and physics (the hole argument, wave function realism, probability in many worlds or the past hypothesis) that presents the physics accurately, surveys the literature and defends an original thesis; revise it after written feedback.')

C('P4', 'Formal methods in metaphysics: mereology, plural and higher-order logic, hyperintensionality', 'T', ['C21'], ['P1'],
  'Learn the formal tools of current metaphysics: ground mereology and classical extensional mereology and their alternatives, plural logic and plural quantification, second-order and higher-order logic, counterpart theory and the logic of identity, impossible worlds and hyperintensionality, and the logic of grounding, with small Python models for checking claims.',
  'Current research states metaphysical theories in these formal languages; reading and writing it requires them.',
  'Proves theorems of classical mereology, translates plural and higher-order claims correctly, builds models that show independence results, and evaluates a hyperintensional argument.',
  ('Stanford Encyclopedia of Philosophy: Mereology (free)', SEP + 'entries/mereology/'),
  [('Mereology: parthood axioms and ground mereology', 'Classical extensional mereology: sums and extensionality', 'Prove five theorems of ground mereology.'),
   ('Finite models of mereology in Python', 'Alternatives: gunk, junk and non-extensional mereology', 'Check mereological axioms in finite models with code.'),
   ('Plural logic: plural reference and quantification', 'Second-order logic and its semantics', 'Translate ten plural sentences into plural logic.'),
   ('Higher-order metaphysics', 'Counterpart theory and the logic of identity', 'Week 7 midterm; prove a result in counterpart theory.'),
   ('Impossible worlds and hyperintensionality', 'The logic of grounding', 'Build an impossible-worlds model for a hyperintensional claim.'),
   ('Formal methods in practice: a case study', 'Writing formal metaphysics', 'Formalize and test an argument from a recent paper.')],
  'Formal analysis: take one argument from a recent metaphysics paper, formalize it in the appropriate logic (mereology, plural or higher-order logic, counterpart theory or a logic of grounding), prove the valid steps, build models by hand or in Python that test the questionable premises, and write a 3,000-word analysis of what the formalization shows.')

C('P5', 'Philosophical research and writing', 'E', ['C10'], ['C17'],
  'Learn the craft of professional philosophy: finding and reading the literature with PhilPapers and the encyclopedias, reconstructing the argument of a journal article, finding an original contribution, structuring and writing a paper, citation and academic integrity, refereeing, revising, presenting at conferences, and preparing a writing sample for graduate applications.',
  'Graduate study in metaphysics is judged by your writing; this course turns arguments into papers that could be published.',
  'Writes a 6,000-word paper with an original thesis, an accurate survey of the literature and careful replies to objections, and writes a referee report on another paper.',
  ('PhilPapers: the index of philosophical research (free)', 'https://philpapers.org/'),
  [('What makes a philosophy paper good', 'Finding and reading the literature: PhilPapers, the encyclopedias and journals', 'Build an annotated bibliography of ten sources.'),
   ("Reconstructing a journal article's argument", 'Finding an original contribution', 'Write a one-page reconstruction of a recent article.'),
   ('Thesis, structure and signposting', 'Objections and replies', 'Draft a thesis and an outline.'),
   ('Clarity: definitions, examples and precision', 'Citation, quotation and academic integrity', 'Week 7 midterm; submit a full first draft.'),
   ('Refereeing: writing and receiving reports', 'Revising a paper', "Write a referee report on a peer's draft."),
   ('Presenting at conferences and handling questions', 'Writing samples and graduate applications', 'Submit a revised paper and a 20-minute talk.')],
  'Writing sample: write and revise a 6,000- to 8,000-word paper in metaphysics with an original thesis, an accurate survey of the relevant literature and replies to the strongest objections; write a referee report on one peer paper; and prepare a 20-minute conference presentation of your own paper.')

C('P6', 'Qualifying exams and the dissertation prospectus', 'E', ['P1', 'P5'], ['P2', 'P3', 'P4'],
  'Prepare for the milestones of a PhD in metaphysics: build and master a qualifying-exam reading list across metaphysics, mind, language, epistemology and the history of philosophy, practice timed written and oral comprehensive exams, see where the field stands on the big questions, choose a dissertation topic and committee, write and defend a dissertation prospectus, and plan for academic and other careers.',
  'Qualifying exams and the prospectus are the gates of a PhD; preparing for them well saves years.',
  'Writes clear timed answers on core topics, defends a reading list orally, and produces a dissertation prospectus that a committee would approve with small changes.',
  ('The 2020 PhilPapers Survey: what professional philosophers think (free)', 'https://survey2020.philpeople.org/'),
  [('How PhD programs work: coursework, qualifying exams and the dissertation', 'Building a qualifying-exam reading list', 'Draft a reading list of forty core works.'),
   ('Core review: ontology, modality and causation', 'Core review: mind, language and epistemology', 'Write two timed answers on core topics.'),
   ('History of philosophy review', 'Timed written exam practice', 'Take a timed three-hour written exam.'),
   ('Oral exams: explaining and defending', 'Where the field stands: what philosophers believe and why it matters', 'Week 7 midterm; a mock oral exam on your reading list.'),
   ('Choosing a dissertation topic and committee', 'Writing a dissertation prospectus', 'Draft a prospectus outline.'),
   ('Defending the prospectus', 'Careers: the academic job market and other paths', 'Submit and defend a full prospectus.')],
  "Dissertation prospectus: write a 6,000- to 8,000-word prospectus with a research question, a literature review, the dissertation's thesis and chapter outline, a timeline and a bibliography; pass a mock qualifying exam of three timed essays; and defend the prospectus in a recorded mock oral examination.")

# ---------------- write ----------------
_ORDER = {k: i for i, (k, _, _) in enumerate(STAGES)}
COURSES.sort(key=lambda c: _ORDER[c['stage']])  # stable: new K-12 courses follow the reused ones of their stage
for c in COURSES:
    assert c['units'][-1]['weeks'] == [13, 14], c['code']
codes = [c['code'] for c in COURSES]
assert len(codes) == len(set(codes))
for c in COURSES:
    for r in c['req'] + c['soft']:
        assert r in codes, (c['code'], r)
json.dump(COURSES, open(f'{ROOT}/work/courses_raw.json', 'w'), indent=1, ensure_ascii=False)
json.dump({'stages': [{'key': k, 'name': n, 'blurb': b} for k, n, b in STAGES], 'hours': HOURS, 'finalMin': FINAL_MIN},
          open(f'{ROOT}/work/meta.json', 'w'), indent=1, ensure_ascii=False)
from collections import Counter
print(len(COURSES), 'courses;', sum(1 for c in COURSES if c.get('reusedFrom')), 'reused;', Counter(c['stage'] for c in COURSES),
      Counter(c['profile'] for c in COURSES if not c.get('reusedFrom')))
