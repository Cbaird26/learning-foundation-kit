"""The Neuroscience Learning Foundation curriculum: kindergarten through a college degree in neuroscience and cognitive
science to graduate study and research. K-12 is shared with the AI Learning Foundation (with its programming track);
the college sciences come from the Med School Learning Foundation, the mathematics and machine learning courses from
the AI Learning Foundation, and philosophy of mind from the Metaphysics Learning Foundation (same lessons, renumbered).
Writes work/courses_raw.json (writer-facing) and work/meta.json (site-facing extras)."""
import json, copy

ROOT = '/home/claude/neuro'
SRC = {s: {c['code']: c for c in json.load(open(f'/home/claude/{s}/work/courses_raw.json'))}
       for s in ('ai', 'med', 'metaphysics')}

STAGES = [
    ('K', 'Elementary school (K–5)', 'Numbers, reading and writing, science and the world around us, plus first steps in computational thinking and Python, learned with a grown-up close by.'),
    ('J', 'Middle school (6–8)', 'Ratios to algebra, reading and writing, life, physical and earth science, history, and programming in Python.'),
    ('H', 'High school (9–12)', 'Algebra through calculus and statistics, biology, chemistry and physics, English and history, and Python for data and simulation.'),
    ('C', 'College neuroscience and cognitive science degree', 'Biology, chemistry, physics and the mathematics of data; the brain from molecules and cells to neural systems; perception, learning, memory, emotion, language and thought; statistics, neural data analysis, computational neuroscience, cognitive modeling and neuroimaging; philosophy of mind, machine learning and neuroethics.'),
    ('P', 'Graduate study and research in neuroscience', 'Theoretical neuroscience, circuits and systems methods, the science of consciousness, brains and machines, research methods and reproducibility, and a research apprenticeship with qualifying-exam preparation.'),
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


# ---------------- reused courses: (source school, old code) -> new code, with a neuroscience reason ----------------
REUSE = [
    ('ai', 'K1', 'K1', 'Counting and number sense are where every measurement of the brain and of behavior begins.'),
    ('ai', 'K2', 'K2', 'Place value and multiplication let you handle the large and small numbers of the nervous system: billions of neurons, thousandths of a second.'),
    ('ai', 'K3', 'K3', 'Fractions and decimals prepare you for rates, proportions and probabilities, the language of brain data.'),
    ('ai', 'K4', 'K4', 'Reading opens every book and article about how the brain works.'),
    ('ai', 'K5', 'K5', 'Clear reading and writing let you describe what you observe and explain why.'),
    ('ai', 'K6', 'K6', 'Explaining your reasons in writing is the start of every lab report and research paper.'),
    ('ai', 'K7', 'K7', 'Living things and their senses are the first chapter of neuroscience.'),
    ('ai', 'K8', 'K8', 'Science teaches you to test ideas against evidence, the core habit of brain science.'),
    ('ai', 'K9', 'K9', 'People, communities and history are what the mind sciences try to understand.'),
    ('ai', 'K10', 'K10', 'Step-by-step instructions and patterns are the seeds of algorithms and of models of the mind.'),
    ('ai', 'K11', 'K11', 'Python is the main language of neuroscience data analysis and modeling, and you start writing it here.'),
    ('ai', 'J1', 'J1', 'Ratios and rates are how scientists describe firing rates, reaction times and accuracy.'),
    ('ai', 'J2', 'J2', 'Equations and probability start the reasoning under uncertainty that brain and behavior research depends on.'),
    ('ai', 'J3', 'J3', 'Functions describe how a neuron or a person turns an input into a response.'),
    ('ai', 'J4', 'J4', 'Close reading and clear writing help you learn from articles and explain your findings.'),
    ('ai', 'J5', 'J5', 'Cells, body systems and the nervous system are the foundations of neuroscience.'),
    ('ai', 'J6', 'J6', 'Electricity, motion and energy explain how neurons signal and how muscles move.'),
    ('ai', 'J7', 'J7', 'Earth and space science train the same habits of observation and measurement that brain science needs.'),
    ('ai', 'J8', 'J8', 'History shows how ideas about the mind and the brain have changed over time.'),
    ('ai', 'J9', 'J9', 'Variables, decisions, loops and functions are the building blocks of every analysis and simulation of the brain.'),
    ('ai', 'H1', 'H1', 'Algebra and functions are the language of every model of neurons and behavior.'),
    ('ai', 'H2', 'H2', 'Geometry describes the shapes, angles and spaces of the brain and of the visual world.'),
    ('ai', 'H3', 'H3', 'Trigonometry and vectors describe brain waves, oscillations and directions of movement.'),
    ('ai', 'H4', 'H4', 'Exponentials and logarithms describe membrane charging, forgetting curves and the senses\' response to intensity.'),
    ('ai', 'H5', 'H5', 'Rates of change are how neuron models and learning rules are written.'),
    ('ai', 'H6', 'H6', 'Statistics and probability are how every experiment on the brain and behavior is analyzed.'),
    ('ai', 'H7', 'H7', 'Biology, from cells to organisms, is the ground on which neuroscience is built.'),
    ('ai', 'H8', 'H8', 'Chemistry explains ions, membranes, neurotransmitters and drugs.'),
    ('ai', 'H9', 'H9', 'Physics explains electrical signals, light, sound and the instruments that record the brain.'),
    ('ai', 'H10', 'H10', 'Reading and writing well help you learn quickly and communicate your work.'),
    ('ai', 'H11', 'H11', 'Research and professional writing are the skills behind lab reports and papers.'),
    ('ai', 'H12', 'H12', 'Government and law shape how research with people and animals is done and how health care works.'),
    ('ai', 'H13', 'H13', 'World history shows how cultures have understood the mind, the body and illness.'),
    ('ai', 'H14', 'H14', 'Data, algorithms and simulations in Python are the daily work of modern neuroscience.'),
    ('med', 'C1', 'C1', 'Molecules and cells are where every neural signal begins.'),
    ('med', 'C2', 'C2', 'Evolution and physiology explain why nervous systems look and work the way they do.'),
    ('med', 'C3', 'C3', 'Ions, solutions and energy are the chemistry of the resting and action potentials.'),
    ('med', 'C4', 'C4', 'Equilibria, acids and bases, and kinetics underlie receptors, channels and drug action.'),
    ('med', 'C7', 'C5', 'Mechanics and energy describe movement, forces and the work done by muscles.'),
    ('med', 'C8', 'C6', 'Electricity, circuits, waves and optics are the physics of neurons, the eye, the ear and brain recordings.'),
    ('med', 'C10', 'C7', 'Genes and their expression shape neural development, and genetic tools now control specific neurons.'),
    ('ai', 'C6', 'C8', 'Functions of many variables, gradients and series are the mathematics of neural models and data.'),
    ('ai', 'C7', 'C9', 'Vectors and matrices describe populations of neurons, images and brain recordings.'),
    ('ai', 'C8', 'C10', 'Probability and statistics let you model noise and judge what your data show.'),
    ('metaphysics', 'C9', 'C21', 'The mind–body problem, mental representation and consciousness are the questions cognitive science hopes to answer.'),
    ('ai', 'C10', 'C22', 'Machine learning gives you the methods that decode brain signals and model behavior.'),
    ('ai', 'C17', 'C23', 'Deep networks are both tools for analyzing brain data and candidate models of how brains compute.'),
    ('med', 'S9', 'C28', 'Clinical neuroscience shows how damage to each part of the nervous system appears in patients.'),
    ('med', 'S10', 'C29', 'Psychiatry connects the brain and behavior to mental illness and its treatment.'),
]
NEWCODE = {(s, old): new for s, old, new, _ in REUSE}
ELECTIVE = {'C28', 'C29'}
REQ_OVERRIDE = {  # reused courses whose original prerequisites do not exist in this school
    'C10': (['H5', 'H6'], ['C8']),
    'C21': (['C11'], ['C14']),
    'C23': (['C22'], ['C8']),
    'C28': (['C12', 'C13'], ['C18']),
    'C29': (['C18', 'C19'], ['C14']),
}

dropped = []
for s, old, new, why in REUSE:
    t = copy.deepcopy(SRC[s][old])
    t['code'] = new
    t['stage'], t['level'] = new[0], LEVEL[new[0]]
    t['why'] = why
    t['reusedFrom'] = f'{s}:{old}'
    t['elective'] = new in ELECTIVE
    if new in REQ_OVERRIDE:
        t['req'], t['soft'] = REQ_OVERRIDE[new]
    else:
        req, soft = [], []
        for lst, out in ((t['req'], req), (t['soft'], soft)):
            for r in lst:
                if (s, r) in NEWCODE:
                    out.append(NEWCODE[(s, r)])
                elif r[0] in 'KJH' and ('ai', r) in NEWCODE:   # the K-12 courses are the same lessons in every school
                    out.append(r)
                else:
                    dropped.append((new, r))
        t['req'], t['soft'] = req, soft
    t['prerequisites'] = (', '.join(t['req']) if t['req'] else 'None') + ('; helpful: ' + ', '.join(t['soft']) if t['soft'] else '') + '.'
    COURSES.append(t)

NOL = ('Neuroscience Online, an open-access textbook from McGovern Medical School at UTHealth Houston (free)', 'https://nba.uth.tmc.edu/neuroscience/')
PSY = ('Psychology 2e from OpenStax (free online)', 'https://openstax.org/details/books/psychology-2e')
NOBA = ('The Noba Project psychology modules (free online)', 'https://nobaproject.com/')
OIS = ('OpenIntro Statistics (free PDF)', 'https://www.openintro.org/book/os/')
ND = ('Neuronal Dynamics by Gerstner, Kistler, Naud and Paninski (free online)', 'https://neuronaldynamics.epfl.ch/online/')
NMA = ('Neuromatch Academy computational neuroscience course materials (free online)', 'https://compneuro.neuromatch.io/')

# ---------------- new college courses ----------------
C('C11', 'Introduction to neuroscience: brain and behavior', 'T', ['H7'], ['H8', 'H6'],
  'Survey the nervous system from cells to behavior: neurons and glia, electrical and chemical signaling in outline, the organization of the brain, how sensory systems and movement work, learning and memory, emotion and motivation, sleep, language and thought, development and plasticity, disorders of the brain, and the methods neuroscientists use, with the history of the main discoveries.',
  'This survey gives you the map of the whole field that every later course fills in.',
  'Explains how neurons signal, names the main brain systems and what they do, and reads a short neuroscience article with understanding.',
  NOL,
  [('Neurons, glia and the neuron doctrine', 'Electrical signals: resting and action potentials in outline', 'Label the parts of a neuron and trace a signal through it.'),
   ('Synapses, neurotransmitters and drugs', 'The organization of the nervous system', 'Map the major brain regions and their main functions.'),
   ('Sensory systems: from receptors to perception', 'Movement: muscles, motor cortex, basal ganglia and cerebellum', 'Trace one sensation and one movement through the nervous system.'),
   ('Learning, memory and plasticity', 'Emotion, motivation and reward', 'Week 7 midterm; explain a classic memory case and what it showed.'),
   ('Sleep, rhythms and consciousness in outline', 'Language, thought and the cerebral cortex', 'Summarize the evidence for one localized function and its limits.'),
   ('Development, aging and plasticity', 'Disorders of the brain and the methods of neuroscience', 'Compare what three research methods can and cannot show.')],
  'Brain systems guide: write an illustrated-in-words guide to one brain system (for example vision, memory or reward) that traces it from molecules and cells to behavior, explains one classic experiment and one clinical case, and lists three open questions, with a one-page quiz and answer key for a classmate.')

C('C12', 'Cellular and molecular neuroscience', 'P', ['C11', 'C1', 'C3'], ['C5', 'H14'],
  'Learn how neurons compute with electricity and chemistry: ion concentrations and the Nernst and Goldman–Hodgkin–Katz equations, the membrane as an RC circuit, passive spread and the cable equation, voltage-gated channels and the Hodgkin–Huxley model, action potential propagation and myelination, synaptic transmission and quantal release, receptors and postsynaptic potentials, synaptic integration, neuromodulation, and the molecular machinery of neurons, with simulations in Python.',
  'The rest of neuroscience is built on how single neurons and synapses work.',
  'Computes equilibrium and resting potentials, simulates a membrane and an action potential in code, and explains synaptic transmission and integration quantitatively.',
  ND,
  [('Ions, membranes and the Nernst equation', 'The resting potential and the Goldman–Hodgkin–Katz equation', 'Compute equilibrium and resting potentials from ion concentrations.'),
   ('The membrane as an RC circuit', 'Passive spread: length constants and the cable equation', 'Simulate the charging of a membrane in code.'),
   ('Voltage-gated channels and the Hodgkin–Huxley model', 'Action potentials: threshold, refractoriness and propagation', 'Simulate an action potential with Euler steps.'),
   ('Myelination and conduction velocity', 'Synaptic transmission: release, quantal analysis and receptors', 'Week 7 midterm; analyze supplied quantal release data.'),
   ('Postsynaptic potentials and synaptic integration', 'Neuromodulation and second messengers', 'Model summation of synaptic inputs in time and space.'),
   ('Molecular machinery: channels, transporters and genes', 'Channelopathies and drugs that act on neurons', 'Explain one disease or drug at the level of channels and synapses.')],
  'Neuron simulator: build a small, tested Python program that simulates a patch of membrane with Hodgkin–Huxley channels and a synaptic input, reproduce threshold, refractoriness and the effect of blocking a channel, and write a short report with tables of your simulations and the equations behind them.')

C('C13', 'Neuroanatomy and functional systems', 'T', ['C11'], ['C2'],
  'Learn the structure of the nervous system and how its parts work together: development and the plan of the nervous system, the spinal cord and brainstem, cranial nerves, the thalamus and hypothalamus, the cerebral cortex and its areas, the basal ganglia and cerebellum, the limbic system, blood supply and the ventricles, the major pathways for sensation and movement, and how the location of damage predicts what a person loses.',
  'Knowing where things are, and how they connect, is the map you need to read every study of the brain.',
  'Locates the main structures and pathways, traces sensory and motor pathways from end to end, and predicts deficits from the location of a lesion.',
  NOL,
  [('Development and the plan of the nervous system', 'Directions, planes and the meninges, ventricles and blood supply', 'Describe the brain in standard anatomical terms.'),
   ('The spinal cord and spinal reflexes', 'The brainstem and the cranial nerves', 'Trace a spinal reflex and test the cranial nerves in words.'),
   ('The thalamus and the hypothalamus', 'The cerebral cortex: lobes, areas and layers', 'Match cortical areas to their functions and inputs.'),
   ('Somatosensory pathways', 'Motor pathways and the corticospinal tract', 'Week 7 midterm; trace the pathways for touch, pain and voluntary movement.'),
   ('The basal ganglia and the cerebellum', 'The limbic system, hippocampus and amygdala', 'Explain the effects of damage to the basal ganglia and the cerebellum.'),
   ('Visual and auditory pathways', 'Localizing lesions: from symptoms to sites', 'Localize the lesion in written clinical vignettes.')],
  'Pathway atlas: write a pathway atlas, in words and tables, of five major pathways (touch, pain, vision, hearing and voluntary movement), each traced from receptor or cortex to target with every relay and decussation, and use it to localize the lesions in six supplied vignettes.')

C('C14', 'Cognitive psychology', 'T', ['H6'], ['C11'],
  'Learn how the mind processes information, and how psychologists find out: attention, perception and pattern recognition, working memory, long-term memory and forgetting, categories and concepts, mental imagery, problem solving and reasoning, judgment and decision making, and metacognition, with the classic experiments, the reaction-time and accuracy methods behind them, and the debates about how to interpret them.',
  'Cognitive psychology gives the behavioral evidence that every theory of the mind and brain must explain.',
  'Explains the main findings and models of attention, memory, concepts and reasoning, analyzes reaction-time and accuracy data, and critiques an experiment.',
  PSY,
  [('Cognition and its methods: reaction time, accuracy and the information-processing view', 'Attention: selection, capacity and control', 'Analyze supplied reaction times from a cueing experiment.'),
   ('Perception and pattern recognition', 'Working memory', 'Estimate a memory span and a search slope from supplied data.'),
   ('Long-term memory: encoding, storage and retrieval', 'Forgetting, false memory and eyewitness testimony', 'Fit a forgetting curve to supplied recall data.'),
   ('Concepts and categories', 'Mental imagery and spatial cognition', 'Week 7 midterm; compare prototype and exemplar accounts on supplied data.'),
   ('Problem solving and reasoning', 'Judgment and decision making', 'Design a short decision experiment and predict its results.'),
   ('Metacognition and individual differences', 'Cognitive psychology and the brain', 'Critique a classic experiment and propose a better test.')],
  'Replication study: choose one classic finding (such as the Stroop effect, the testing effect or visual search), run a small online or in-person replication with friends who consent, analyze the reaction times or accuracies with the methods of the course, and write a lab report that compares your result with the original and discusses what differs.')

C('C15', 'Statistics and experimental design for brain and behavioral science', 'P', ['C10', 'H14'], ['C14'],
  'Learn to design experiments on brains and behavior and to analyze their data honestly, in Python: describing data, sampling distributions and confidence intervals, t-tests and their assumptions, effect sizes and power, analysis of variance and factorial designs, correlation and regression, repeated measures and mixed-effects models in outline, nonparametric and permutation tests, the bootstrap, multiple comparisons, and preregistration and the habits that prevent false findings.',
  'Every claim in neuroscience and psychology rests on a design and an analysis; this course teaches you to get both right.',
  'Designs a controlled experiment with an adequate sample size, analyzes it with the right test in plain Python, and reports effect sizes and intervals honestly.',
  OIS,
  [('Describing data and the logic of experiments', 'Sampling distributions and confidence intervals', 'Compute and interpret confidence intervals in code.'),
   ('t-tests: one sample, paired and independent', 'Effect sizes and statistical power', 'Choose a sample size for a planned experiment.'),
   ('Analysis of variance and factorial designs', 'Correlation and simple regression', 'Analyze a supplied two-factor experiment.'),
   ('Multiple regression and its pitfalls', 'Repeated measures and mixed-effects models in outline', 'Week 7 midterm; analyze a within-subject experiment correctly.'),
   ('Nonparametric tests, permutation tests and the bootstrap', 'Multiple comparisons: Bonferroni and false discovery rate', 'Run a permutation test and correct a family of tests.'),
   ('Preregistration, questionable research practices and replication', 'Reporting results: figures in words, tables and honest claims', 'Write a preregistration for a small experiment.')],
  'Analysis report: analyze a supplied data set from a reaction-time experiment with two factors, in plain Python written without statistics libraries for the core tests, from cleaning to effect sizes, intervals, a permutation check and a correction for multiple tests, and write a short results section that a reviewer would accept.')

C('C16', 'Sensation, perception and psychophysics', 'P', ['C11', 'C15'], ['C14', 'C6'],
  'Learn how the senses turn physical energy into experience, and how to measure it: psychophysical methods, thresholds and Weber\'s law, signal detection theory, psychometric functions, the eye and early vision, color, the visual cortex and receptive fields, object and face recognition, motion and depth, hearing and sound localization, touch, pain, taste and smell, and perception as inference, including Bayesian cue combination, with analyses in Python.',
  'Perception is where the brain meets the world, and psychophysics is the most precise measuring tool of the mind sciences.',
  'Measures thresholds and sensitivity with standard methods, computes d-prime and fits psychometric functions in code, and explains how each sense encodes its stimulus.',
  NOL,
  [('Psychophysical methods and thresholds', "Weber's law and scaling", 'Estimate a threshold from supplied staircase data.'),
   ('Signal detection theory', 'Psychometric functions and their fitting', 'Compute d-prime and criterion and fit a psychometric function in code.'),
   ('The eye, the retina and early vision', 'Color vision', 'Explain color matching and color blindness with cone responses.'),
   ('The visual cortex and receptive fields', 'Object, face and scene recognition', 'Week 7 midterm; model a simple receptive field on a small image grid.'),
   ('Motion, depth and perceptual organization', 'Hearing and sound localization', 'Compute interaural time differences for sound sources.'),
   ('Touch, pain, taste and smell', 'Perception as inference: Bayesian cue combination', 'Combine two noisy cues optimally and test the prediction.')],
  'Psychophysics experiment: design and run a small threshold or signal-detection experiment on yourself and consenting volunteers (for example contrast detection on a screen or a two-tone pitch discrimination), analyze it with your own Python code for d-prime and a fitted psychometric function, and write a lab report with the results and their uncertainty.')

C('C17', 'Learning, memory and plasticity', 'P', ['C11', 'C15'], ['C12', 'C14'],
  'Learn how experience changes behavior and the brain: classical and instrumental conditioning, the Rescorla–Wagner model, reinforcement learning and dopamine prediction errors, habits and goals, memory systems and amnesia, the hippocampus and memory consolidation, place cells and grid cells, synaptic plasticity (long-term potentiation, Hebbian and spike-timing-dependent plasticity), and associative memory networks, with models in Python.',
  'Learning and memory link the levels of neuroscience, from synapses to behavior, better than any other topic.',
  'Simulates conditioning, reinforcement learning and Hebbian plasticity in code, and explains the evidence for memory systems and their neural basis.',
  NOL,
  [('Classical conditioning and the Rescorla–Wagner model', 'Instrumental conditioning and reinforcement schedules', 'Simulate blocking and extinction with the Rescorla–Wagner rule.'),
   ('Reinforcement learning: values and temporal-difference errors', 'Dopamine and reward prediction errors', 'Simulate temporal-difference learning on a conditioning task.'),
   ('Habits, goals and the basal ganglia', 'Memory systems and amnesia', 'Classify supplied patient findings by memory system.'),
   ('The hippocampus, consolidation and sleep', 'Place cells, grid cells and cognitive maps', 'Week 7 midterm; decode position from supplied place-cell rates.'),
   ('Synaptic plasticity: long-term potentiation and depression', 'Hebbian and spike-timing-dependent plasticity', 'Simulate Hebbian learning with a normalizing rule.'),
   ('Associative memory networks', 'Memory in development, aging and disease', 'Store and recall patterns in a small Hopfield network.')],
  'Learning model study: implement and test in plain Python a Rescorla–Wagner model and a temporal-difference model, fit their learning rates to a supplied set of trial-by-trial choices or responses, compare the fits, and write a short paper on what each model explains and what neural data would tell them apart.')

C('C18', 'Behavioral neuroscience: motivation, emotion, sleep and stress', 'T', ['C11'], ['C13'],
  'Learn how the brain and body produce the drives and states that organize behavior: homeostasis and the hypothalamus, hunger and thirst, hormones and behavior, sexual behavior and its development, emotion and the amygdala, fear learning, stress and the hypothalamic–pituitary–adrenal axis, reward and addiction, sleep and its stages, circadian rhythms, and the neural basis of social behavior.',
  'Motivation, emotion and sleep determine what animals and people do, and their disorders are among the most common illnesses.',
  'Explains the neural and hormonal control of motivated states, emotion, stress and sleep, and evaluates evidence from animal and human studies.',
  NOL,
  [('Homeostasis and the hypothalamus', 'Hunger, thirst and energy balance', 'Explain a feedback loop that regulates intake.'),
   ('Hormones and behavior', 'Sexual differentiation and reproductive behavior', 'Evaluate a supplied study on hormones and behavior.'),
   ('Emotion: theories and the amygdala', 'Fear learning and its extinction', 'Design an experiment that separates two theories of emotion.'),
   ('Stress and the HPA axis', 'Reward, drugs and addiction', 'Week 7 midterm; trace the stress response from threat to cortisol and back.'),
   ('Sleep: stages, functions and regulation', 'Circadian rhythms and the clock', 'Model sleep pressure and the circadian rhythm with two simple curves.'),
   ('Social behavior and its neural basis', 'Comparing species: what animal studies can tell us about people', 'Weigh the evidence from animal models for one human behavior.')],
  'Behavioral neuroscience review: write a review article of about 2,500 words on one motivated state or emotion (for example fear, hunger, sleep or social bonding), covering its neural circuits, hormones, animal and human evidence and open questions, with a critical discussion of how well the animal findings apply to people.')

C('C19', 'Cognitive neuroscience', 'T', ['C13', 'C14'], ['C15'],
  'Learn how mental processes arise from brain activity and how we can tell: the methods (lesions, single neurons, EEG and MEG, functional MRI, brain stimulation) and the logic of inference from each, then attention, perception and object recognition, memory, executive function and the prefrontal cortex, language, emotion and social cognition, decision making, and hemispheric specialization, with the debates about localization, networks and reverse inference.',
  'Cognitive neuroscience joins the study of the mind to the study of the brain, and its methods shape what we can claim about both.',
  'Explains what each method can and cannot show, evaluates brain–behavior evidence for the main cognitive functions, and spots invalid inferences such as reverse inference.',
  NOL,
  [('Levels of explanation and the logic of cognitive neuroscience', 'Lesions, dissociations and neuropsychology', 'Identify single and double dissociations in supplied patient data.'),
   ('Recording neurons and populations', 'EEG, event-related potentials and MEG', 'Read an event-related potential experiment and its timing claims.'),
   ('Functional MRI and the BOLD signal', 'Brain stimulation: TMS and its logic', 'Evaluate the inferences in a supplied imaging study.'),
   ('Attention and its control networks', 'Object and face recognition in the ventral stream', 'Week 7 midterm; evaluate the evidence for a face-selective region.'),
   ('Memory systems in the human brain', 'Executive function and the prefrontal cortex', 'Explain a frontal lobe patient\'s deficits with a cognitive model.'),
   ('Language, hemispheres and the split brain', 'Emotion, social cognition and decision making', 'Critique a claim that rests on reverse inference.')],
  'Research proposal: write a six-page proposal for a cognitive neuroscience study that tests a specific claim about one cognitive function, with the hypothesis, the method chosen and why the alternatives are weaker, the design and analysis plan, the predicted results, and the alternative explanations your design rules out.')

C('C20', 'Language and cognitive development', 'W', ['C14'], ['C19'],
  'Learn how language works in the mind and brain and how thinking develops from infancy: the parts of language, speech perception and production, word recognition and sentence processing, the brain networks for language and aphasia, language acquisition and its theories, bilingualism, reading and dyslexia, infant perception and cognition, Piaget, Vygotsky and modern views, theory of mind, and the debates about nature and nurture.',
  'Language and development are where the biggest questions about the mind, and about what is innate, are tested.',
  'Explains the main findings and theories of language processing and cognitive development, evaluates the evidence in the nature–nurture debates, and writes balanced analyses.',
  NOBA,
  [('The parts of language: sounds, words, sentences and meaning', 'Speech perception and production', 'Analyze a sentence at each level of language.'),
   ('Word recognition and sentence processing', 'Language in the brain and aphasia', 'Classify supplied aphasia cases.'),
   ('Language acquisition: the evidence', 'Theories of acquisition: nativist, statistical and usage-based', 'Compute transitional probabilities in a supplied syllable stream.'),
   ('Bilingualism', 'Reading and dyslexia', 'Week 7 midterm; evaluate a claim about bilingual advantages.'),
   ('Infant perception and cognition', 'Piaget, Vygotsky and modern views of development', 'Design a looking-time experiment and say what it can show.'),
   ('Theory of mind and social cognition', 'Nature, nurture and their interplay', 'Write a balanced analysis of one nature–nurture debate.')],
  'Development essay and study plan: write a 2,500-word essay on one question in language or cognitive development (for example whether there is a critical period for language), presenting the strongest evidence and arguments on each side, followed by the design of one study that could move the debate forward.')

C('C24', 'Neural data analysis', 'P', ['C15', 'C12'], ['C9'],
  'Learn to analyze the data neuroscientists record, in Python: spike trains and firing rates, peristimulus time histograms and raster data, tuning curves, spike-train statistics and the Poisson model, correlations between neurons, local field potentials and the Fourier transform, power spectra and filtering, calcium imaging traces, encoding models, population decoding, and dimensionality reduction of neural populations.',
  'Modern neuroscience produces huge data sets; turning them into understanding is a core skill.',
  'Computes firing rates, tuning curves, spectra and decoders from small recorded data sets in plain Python, and explains the assumptions behind each analysis.',
  ('Case Studies in Neural Data Analysis by Kramer and Eden, Python edition (free online)', 'https://mark-kramer.github.io/Case-Studies-Python/'),
  [('Spike trains, rasters and firing rates', 'Peristimulus time histograms and smoothing', 'Compute a PSTH from supplied spike times.'),
   ('Tuning curves and their fitting', 'Spike-train statistics and the Poisson model', 'Fit a tuning curve and test a Poisson assumption.'),
   ('Correlations between neurons', 'Local field potentials and the Fourier transform', 'Compute a cross-correlogram from two spike trains.'),
   ('Power spectra, filtering and oscillations', 'Calcium imaging traces and spike inference', 'Week 7 midterm; compute the power spectrum of a supplied signal.'),
   ('Encoding models: linear–nonlinear and Poisson regression', 'Population decoding', 'Decode a stimulus from supplied population responses.'),
   ('Dimensionality reduction of neural populations', 'Reproducible analysis pipelines', 'Find the main dimensions of a supplied population recording.')],
  'Data analysis report: analyze a small supplied data set of spike times recorded during a task, in plain Python written without analysis libraries for the core steps, computing rasters, firing rates, tuning curves and a simple decoder, and write a report that states each result with its uncertainty and what it does and does not show about the neurons.')

C('C25', 'Computational neuroscience', 'P', ['C12', 'C8', 'C9'], ['H14'],
  'Learn to model neurons and networks with mathematics and simulation: integrate-and-fire neurons, the Hodgkin–Huxley model and its reductions, phase planes and excitability, synapses and short-term plasticity, recurrent networks and rate models, excitation and inhibition, attractor networks and working memory, neural coding and information, efficient coding, and network oscillations, with simulations in Python.',
  'Models make ideas about the brain precise and testable, and computational skills are now central to neuroscience research.',
  'Builds and analyzes neuron and network models in code, relates their behavior to their equations, and states what a model can and cannot explain.',
  ND,
  [('Why model? Levels of description', 'The leaky integrate-and-fire neuron', 'Simulate a neuron and compute its firing-rate curve.'),
   ('The Hodgkin–Huxley model revisited', 'Two-dimensional reductions and the phase plane', 'Find the fixed points of a two-variable neuron model.'),
   ('Synapses and short-term plasticity', 'Networks of spiking neurons', 'Simulate two coupled neurons with synapses.'),
   ('Rate models and recurrent networks', 'Excitation, inhibition and balance', 'Week 7 midterm; analyze the stability of a two-population rate model.'),
   ('Attractor networks and working memory', 'Neural coding: rates, timing and populations', 'Simulate persistent activity in a small attractor network.'),
   ('Information theory and efficient coding', 'Oscillations and synchrony', 'Compute the information a model neuron carries about a stimulus.')],
  'Modeling project: build and test in plain Python a small network model of one phenomenon (for example persistent activity, gain control or oscillations), explore how its behavior depends on two parameters, compare it with a simpler model, and write a short paper with the equations, tables of results and the predictions the model makes for experiments.')

C('C26', 'Computational cognitive modeling', 'P', ['C14', 'C15'], ['C10', 'C22'],
  'Learn to turn theories of the mind into models that make quantitative predictions, and to fit and compare them, in Python: why model cognition, signal detection and choice models, the drift-diffusion model of decisions, reinforcement learning models of choice, Bayesian models of perception and cognition, models of categorization, memory models, connectionist models and their history, maximum likelihood fitting, model comparison with likelihoods and information criteria, and parameter recovery.',
  'Cognitive models let theories be tested precisely, and fitting them to behavior is a standard tool of modern cognitive science.',
  'Implements cognitive models in code, fits them to behavioral data by maximum likelihood, compares them properly, and checks that parameters can be recovered.',
  ('Probabilistic Models of Cognition by Goodman and Tenenbaum (free online)', 'https://probmods.org/'),
  [('Why model cognition? Marr\'s levels and model types', 'Choice models and the likelihood', 'Write the likelihood of supplied choices under a simple model.'),
   ('Maximum likelihood fitting', 'Signal detection and choice models revisited', 'Fit a model to supplied choices by a grid search.'),
   ('The drift-diffusion model', 'Speed–accuracy trade-offs', 'Simulate a diffusion model with supplied noise and compare its predictions.'),
   ('Reinforcement learning models of choice', 'Model comparison: likelihood ratios and information criteria', 'Week 7 midterm; compare two learning models on supplied data.'),
   ('Bayesian models of perception and cognition', 'Models of categorization and memory', 'Build a Bayesian model of a concept-learning task.'),
   ('Connectionist models and their history', 'Parameter recovery, model recovery and good practice', 'Run a parameter-recovery study for a fitted model.')],
  'Model-fitting study: fit two competing cognitive models (for example a delta-rule learner and a Bayesian learner, or two decision models) to a supplied behavioral data set in plain Python, compare them with likelihoods and an information criterion, run a parameter and model recovery check, and write a short paper on what the comparison shows and what it cannot.')

C('C27', 'Neuroimaging methods: fMRI, EEG and MEG', 'P', ['C15', 'C19', 'C9'], ['C6'],
  'Learn how brain-imaging data are produced and analyzed, in Python: the physics of MRI and the BOLD signal, the hemodynamic response, experimental designs for fMRI, preprocessing, the general linear model, contrasts and statistical maps, multiple comparisons and cluster inference, region-of-interest and multivariate pattern analysis, functional connectivity, EEG and MEG signals, event-related potentials and time–frequency analysis, and the common pitfalls of circular analysis and reverse inference.',
  'Imaging is how most human brain research is done, and its methods decide which claims are sound.',
  'Fits a general linear model to a small time series in code, chooses designs and corrections soundly, and explains the strengths and pitfalls of each imaging method.',
  ("Andy's Brain Book, a free online guide to neuroimaging analysis", 'https://andysbrainbook.readthedocs.io/'),
  [('MRI physics in outline and the BOLD signal', 'The hemodynamic response and convolution', 'Convolve a supplied event sequence with a hemodynamic response.'),
   ('Experimental designs for fMRI', 'Preprocessing: motion, slice timing, registration and smoothing', 'Compare a block and an event-related design for a question.'),
   ('The general linear model for fMRI', 'Contrasts and statistical maps', 'Fit a general linear model to a short time series in code.'),
   ('Multiple comparisons and cluster inference', 'Regions of interest and circular analysis', 'Week 7 midterm; correct a supplied set of voxel tests.'),
   ('Multivariate pattern analysis', 'Functional connectivity', 'Decode a condition from supplied voxel patterns with cross-validation.'),
   ('EEG and MEG: event-related potentials', 'Time–frequency analysis and source localization in outline', 'Compute an event-related potential from supplied trials.')],
  'Imaging analysis: analyze a small supplied fMRI-like data set (a few regions, a design and time series) and a small EEG-like data set in plain Python written without imaging libraries for the core steps, fitting a general linear model with contrasts and computing an event-related potential, and write a methods and results section that reports corrections, effect sizes and limitations correctly.')

C('C30', 'Neuroethics and neurotechnology', 'W', ['C11'], ['C21', 'C19'],
  'Learn the ethical, legal and social questions raised by brain science and neurotechnology: research ethics with people and animals, consent and capacity, incidental findings, brain–computer interfaces and neural implants, neurostimulation and enhancement, mental privacy and neural data, neuroscience in the courtroom, free will and responsibility, brain death and disorders of consciousness, psychiatric neurosurgery and identity, and the governance of neurotechnology, with each main position presented fairly.',
  'Neurotechnology is moving from the lab to clinics and consumer devices, and its ethical and legal questions concern everyone.',
  'States the main rules of research ethics and the current laws on neural data accurately, and writes balanced analyses of contested neuroethics questions.',
  ('Stanford Encyclopedia of Philosophy, "Neuroethics" (free online)', 'https://plato.stanford.edu/entries/neuroethics/'),
  [('What is neuroethics?', 'Research ethics with people: consent, capacity and incidental findings', 'Review a supplied consent form against the main principles.'),
   ('Research ethics with animals', 'Brain–computer interfaces and neural implants', 'Analyze the risks and benefits of an implanted device.'),
   ('Neurostimulation and cognitive enhancement', 'Mental privacy and neural data', 'Write a balanced analysis of an enhancement question.'),
   ('Neuroscience in the courtroom', 'Free will and responsibility', 'Week 7 midterm; evaluate a legal use of brain evidence.'),
   ('Brain death and disorders of consciousness', 'Psychiatric neurosurgery, deep brain stimulation and identity', 'Analyze a supplied case of a patient with a disorder of consciousness.'),
   ('Governing neurotechnology: laws, standards and principles', 'Public communication of neuroscience and neuromyths', 'Write a policy brief on neural data.')],
  'Neuroethics brief: write a 3,000-word analysis of one neurotechnology (for example a consumer EEG headset, a brain–computer interface or deep brain stimulation for depression), covering the science, the benefits and risks, the main ethical positions in their strongest form, the current law as of the course date, and a recommendation with its strongest objection.')

# ---------------- graduate study and research ----------------
C('P1', 'Theoretical neuroscience', 'T', ['C25', 'C9'], ['C10'],
  'Study the mathematical theory of neural computation at graduate level: dynamical systems for single neurons and networks, bifurcations and excitability, mean-field and population models, attractor dynamics and continuous attractors, balanced networks and irregular activity, information theory and neural coding, efficient and sparse coding, Bayesian brain hypotheses and neural sampling, synaptic learning rules and their stability, and low-dimensional dynamics in high-dimensional recordings, with the open questions of the field.',
  'Theory turns the growing flood of neural data into principles, and it is a central skill for research in neuroscience.',
  'Analyzes neural models with dynamical-systems and information-theoretic tools, derives their key results, and reads theory papers critically.',
  ND,
  [('Dynamical systems for neurons: fixed points, stability and bifurcations', 'Excitability classes and phase response', 'Classify the bifurcation of a two-variable neuron model.'),
   ('Mean-field and population rate models', 'Balanced networks and irregular firing', 'Derive the balanced state of a two-population network.'),
   ('Attractor networks: discrete and continuous', 'Ring attractors and head direction', 'Analyze the stability of a ring attractor.'),
   ('Information theory for neural codes', 'Efficient and sparse coding', 'Week 7 midterm; derive the efficient code for a supplied input distribution.'),
   ('The Bayesian brain and probabilistic population codes', 'Learning rules: Hebbian, BCM and their stability', 'Analyze the stability of a Hebbian rule with normalization.'),
   ('Low-dimensional dynamics in population recordings', 'Open problems in theoretical neuroscience', 'Write a referee-style critique of a theory paper.')],
  'Theory paper: choose one theoretical result (for example the balanced state, a ring attractor or an efficient-coding prediction), derive it carefully, verify it with a small simulation of your own, extend it in one direction, and write a workshop-style paper with the derivation, the numerical check and a discussion of how experiments could test it.')

C('P2', 'Circuits and systems neuroscience: methods and causal evidence', 'T', ['C24', 'C13'], ['C25'],
  'Study how modern neuroscience links circuits to behavior and what each method lets you conclude: electrophysiology from single units to high-density probes, optical imaging of activity, optogenetics and chemogenetics, anatomical tracing and connectomics, behavioral paradigms in animals, causal inference from perturbations, the problems of compensation and off-target effects, cross-species comparison and the translation of findings to humans, with worked studies of sensory, motor, memory and decision circuits.',
  'Most discoveries in systems neuroscience come from combining measurement and perturbation; judging that evidence is a core research skill.',
  'Explains the principles and limits of the main circuit methods, evaluates causal claims from perturbation studies, and designs experiments that support a causal conclusion.',
  NMA,
  [('Questions in systems neuroscience and the logic of evidence', 'Electrophysiology: from single units to dense probes', 'Estimate what a recording can and cannot resolve.'),
   ('Optical imaging of neural activity', 'Anatomy, tracing and connectomics', 'Evaluate a connectivity claim from supplied tracing data.'),
   ('Optogenetics and chemogenetics', 'Causal inference from perturbations', 'Design controls for an optogenetic experiment.'),
   ('Behavioral paradigms and their interpretation', 'Sensory and motor circuits: case studies', 'Week 7 midterm; critique a supplied perturbation study.'),
   ('Memory and navigation circuits: case studies', 'Decision circuits: case studies', 'Compare correlational and causal evidence for one circuit.'),
   ('Cross-species comparison and translation', 'Open problems and new methods', 'Write a short proposal combining measurement and perturbation.')],
  'Experimental design proposal: write a ten-page proposal for a circuit experiment that tests a causal claim about one behavior, with the circuit hypothesis, the recording and perturbation methods and why, controls for compensation and off-target effects, the analysis plan with power, and what each possible result would show.')

C('P3', 'Consciousness and the science of the mind', 'W', ['C19', 'C21'], ['C26'],
  'Study the science of consciousness and its debates at graduate level: what needs explaining and the hard problem, measuring consciousness and its contents, contrastive methods and neural correlates, blindsight and neglect, the major theories (global workspace, higher-order, recurrent processing, integrated information and predictive processing), adversarial collaborations, consciousness in disorders of consciousness, anesthesia and sleep, and the questions about infants, animals and artificial systems, with each view presented in its strongest form.',
  'Consciousness is the deepest open question in the mind sciences, and the debates over its theories are now experimental.',
  'States each major theory and its predictions accurately, evaluates the experimental evidence, and writes balanced analyses at the level of a graduate seminar.',
  ('Stanford Encyclopedia of Philosophy, "The Neuroscience of Consciousness" (free online)', 'https://plato.stanford.edu/entries/consciousness-neuroscience/'),
  [('What needs explaining: the hard problem and the easy problems', 'Measuring consciousness: reports, no-report paradigms and confidence', 'Compute a metacognitive sensitivity measure from supplied data.'),
   ('Contrastive methods and neural correlates', 'Blindsight, neglect and unconscious processing', 'Evaluate a claim of unconscious perception.'),
   ('Global workspace theories', 'Higher-order theories', 'State the predictions that separate two theories.'),
   ('Recurrent processing theory', 'Integrated information theory', 'Week 7 midterm; compute a simple integration measure for a tiny system.'),
   ('Predictive processing and the free-energy principle', 'Adversarial collaborations and testing theories', 'Design an experiment that pits two theories against each other.'),
   ('Disorders of consciousness, anesthesia and sleep', 'Infants, animals and machines', 'Write a balanced analysis of consciousness in one non-human system.')],
  'Seminar paper: write a 5,000-word seminar paper that evaluates one theory of consciousness against the strongest evidence and objections, presents its main rival fairly, and proposes one experiment whose result would count against the theory you find more plausible.')

C('P4', 'Brains and machines: neural networks as models of the brain', 'T', ['C23', 'C25'], ['C26', 'C22'],
  'Study the two-way exchange between neuroscience and artificial intelligence at graduate level: the history from perceptrons to deep learning, deep networks as models of the visual system, comparing models and brains with encoding models and representational similarity analysis, recurrent networks as models of cognition and dynamics, reinforcement learning and the dopamine system, learning rules and the question of backpropagation in the brain, predictive coding, language models and the brain\'s language network, and what such comparisons can and cannot show.',
  'Artificial networks are now leading models of brain function, and judging the comparison is a key research skill.',
  'Implements comparisons between model and brain representations in code, explains the main results and their limits, and critiques claims that a model explains a brain function.',
  NMA,
  [('From perceptrons to deep learning: the shared history', 'Deep networks as models of the ventral visual stream', 'Compare layers of a toy network with supplied neural responses.'),
   ('Encoding models and their evaluation', 'Representational similarity analysis', 'Compute and compare representational dissimilarity matrices in code.'),
   ('Recurrent networks as models of cognition', 'Trained networks and neural dynamics', 'Train a tiny recurrent network on a timing task.'),
   ('Reinforcement learning and dopamine', 'Learning rules: is there backpropagation in the brain?', 'Week 7 midterm; compare a biologically plausible rule with gradient descent on a toy task.'),
   ('Predictive coding and generative models', 'Language models and the brain\'s language network', 'Evaluate a claim that a language model predicts brain activity.'),
   ('What model–brain comparisons can and cannot show', 'Open problems in NeuroAI', 'Write a referee-style critique of a model–brain paper.')],
  'Model–brain comparison: compare the internal representations of a small network you train on your own computer with a supplied set of neural or behavioral responses, using an encoding model and representational similarity analysis with proper cross-validation and noise ceilings, and write a workshop-style paper that states what the comparison shows and the strongest alternative explanation.')

C('P5', 'Research methods and reproducibility in the brain and behavioral sciences', 'E', ['C15'], ['C24', 'C27'],
  'Learn how research on the brain and behavior is done well: reading papers, sharpening a research question, design and power, the replication crisis and what caused it, preregistration and registered reports, analysis flexibility and double dipping, open data and code, research ethics with people and animals, writing and presenting, peer review, and research careers, with a realistic picture of the field.',
  'Good research habits separate real discoveries from noise, and they are learnable.',
  'Critiques published studies, designs well-powered preregistered studies, reports results honestly, writes a referee report, and plans an open, reproducible project.',
  ('Improving Your Statistical Inferences by Daniël Lakens (free online)', 'https://lakens.github.io/statistical_inferences/'),
  [('How to read a neuroscience or psychology paper', 'Finding and sharpening a research question', 'Write a one-page summary and critique of a paper.'),
   ('Design, power and sample size', 'The replication crisis: evidence and causes', 'Compute the power of a supplied published design.'),
   ('Preregistration and registered reports', 'Analysis flexibility, double dipping and circular analysis', 'Preregister a small study.'),
   ('Open data, code and materials', 'Research ethics with people and animals', 'Week 7 midterm; audit a paper with a reproducibility checklist.'),
   ('Writing a paper: structure, figures and claims', 'Peer review: reviewing and responding', 'Write a referee report on a supplied short paper.'),
   ('Presenting research', 'Research careers', 'Give a recorded ten-minute talk on a paper.')],
  'Registered report: write a stage-one registered report for a study you could run with modest resources, with the introduction, hypotheses, a design with a power analysis, a preregistered analysis plan, the ethics approval you would need, and a data and code sharing plan, then write a referee-style critique of your own proposal.')

C('P6', 'Research apprenticeship and qualifying exams', 'E', ['P5'], ['P1', 'P2'],
  'Complete the first milestones of a research career in neuroscience or cognitive science: reanalyze or reproduce a published result from open data and extend it, write it up as a short paper and present it, prepare for qualifying exams that span cellular, systems, cognitive and computational neuroscience and methods, and choose a thesis direction, an advisor and the next steps toward a PhD or a research role.',
  'Reproducing and extending a result is how most researchers begin, and qualifying exams test the breadth this curriculum has built.',
  'Delivers an honest reanalysis-and-extension paper with shared code, answers timed qualifying questions across neuroscience, and writes a credible research statement.',
  ('OpenNeuro, a free archive of open neuroimaging data sets', 'https://openneuro.org/'),
  [('Choosing a result to reproduce from open data', 'Planning a reanalysis: scope, data and success criteria', 'Write a reanalysis plan.'),
   ('Running the reanalysis', 'When results do not match: debugging and honest reporting', 'Report your first results with their uncertainty.'),
   ('Extending a result: new analyses and controls', 'Writing a short paper', "Draft the paper's methods and results sections."),
   ('Qualifying exam review: cellular and systems neuroscience', 'Qualifying exam review: cognitive and computational neuroscience', 'Week 7 midterm; answer timed questions across the field.'),
   ('Qualifying exam review: methods, statistics and ethics', 'Oral examination practice', 'Take a mock oral exam on your reading list.'),
   ('Choosing a thesis direction and an advisor', 'Paths in research: PhD programs, research jobs and other routes', 'Write a one-page research statement.')],
  'Reanalysis paper: reproduce one published result from an open neuroscience or psychology data set with modest computing, extend it with one new analysis or control, write a four- to six-page paper that reports honestly what did and did not reproduce, share your code with instructions, and pass a mock qualifying exam of three timed answers.')

# ---------------- write ----------------
_ORDER = {k: i for i, (k, _, _) in enumerate(STAGES)}
_NUM = lambda c: int(''.join(ch for ch in c['code'][1:] if ch.isdigit()) or 0)
COURSES.sort(key=lambda c: (_ORDER[c['stage']], _NUM(c)))
for c in COURSES:
    assert c['units'][-1]['weeks'] == [13, 14], c['code']
codes = [c['code'] for c in COURSES]
assert len(codes) == len(set(codes)), codes
for c in COURSES:
    for r in c['req'] + c['soft']:
        assert r in codes, (c['code'], r)
json.dump(COURSES, open(f'{ROOT}/work/courses_raw.json', 'w'), indent=1, ensure_ascii=False)
json.dump({'stages': [{'key': k, 'name': n, 'blurb': b} for k, n, b in STAGES], 'hours': HOURS, 'finalMin': FINAL_MIN},
          open(f'{ROOT}/work/meta.json', 'w'), indent=1, ensure_ascii=False)
from collections import Counter
print(len(COURSES), 'courses;', sum(1 for c in COURSES if c.get('reusedFrom')), 'reused;', dict(Counter(c['stage'] for c in COURSES)),
      dict(Counter(c['profile'] for c in COURSES if not c.get('reusedFrom'))))
print('dropped prerequisites (not in this school):', dropped)
