"""Build the site's embedded catalog (all 39 syllabi + study-method data) from the parsed study guide."""
import json, re

raw = json.load(open('/home/claude/toe/work/courses_raw.json'))
ORDER = [c['code'] for c in raw]

GROUPS = [
    {'key': 'F', 'name': 'Foundation mathematics', 'blurb': 'Rebuild algebra, trigonometry and precalculus until they are routine, and learn Python for scientific work.'},
    {'key': 'M', 'name': 'University mathematics', 'blurb': 'Calculus, linear algebra, differential equations, proof, probability, complex and Fourier methods, analysis and geometry.'},
    {'key': 'P', 'name': 'Undergraduate physics', 'blurb': 'Mechanics, electromagnetism, waves, relativity, quantum mechanics, statistical physics and experiment.'},
    {'key': 'G', 'name': 'Graduate preparation and research', 'blurb': 'Graduate core courses, general relativity, quantum field theory, cosmology and a research apprenticeship.'},
    {'key': 'E', 'name': 'Optional enrichment', 'blurb': 'Group theory and functional analysis: the mathematics of symmetry and of quantum state spaces.'},
]

WHY = {
    'F1': 'Every later derivation assumes these operations are routine.',
    'F2': 'Physics uses components, oscillations and rotations constantly.',
    'F3': 'Bridges algebra into calculus.',
    'F4': 'Computation makes models testable.',
    'M1': 'Supports motion and rates of change.',
    'M2': 'Needed for waves and approximation.',
    'M3': 'Essential for fields, continuum physics and preparation for general relativity.',
    'M4': 'The foundation of quantum mechanics and coupled systems.',
    'M5': 'Physical laws often predict evolution through differential equations.',
    'M6': 'Prepares for analysis and careful theoretical claims.',
    'M7': 'Necessary for experiments and quantum claims.',
    'M8a': 'A bridge to wave, electromagnetic and quantum problems.',
    'M8b': 'A bridge to wave, electromagnetic and quantum problems.',
    'M9a': 'Adds mathematical precision to calculus.',
    'M9b': 'Adds the geometric precision general relativity needs.',
    'P1': 'The first full use of calculus in physical prediction.',
    'P2': 'Essential for field theory and experimental literacy.',
    'P3': 'Gives intuition for quantum amplitudes.',
    'P4': 'Bridges introductory and advanced physics.',
    'P5': 'Needed for advanced theory.',
    'P6a': 'Deepens Maxwell theory beyond survey level.',
    'P6b': 'Deepens Maxwell theory beyond survey level.',
    'P7a': 'Required before graduate quantum mechanics and quantum field theory.',
    'P7b': 'Required before graduate quantum mechanics and quantum field theory.',
    'P8': 'Connects microscopic states to macroscopic laws.',
    'P9': 'Theory needs confrontation with data.',
    'G1': 'Advanced analytic methods for physical boundary and eigenvalue problems.',
    'G2': 'Graduate-depth Hamiltonian mechanics: the structure quantum theory is built on.',
    'G3': 'Graduate-depth boundary, multipole and radiation problems.',
    'G4': 'Graduate-depth symmetry, angular momentum, scattering and approximation.',
    'G5': 'Interacting systems, fluctuations and phase transitions.',
    'G6': 'Numerical experiments you can trust: stability, convergence and verification.',
    'G7a': 'Curved spacetime: one half of what a unified theory must reconcile.',
    'G7b': 'Quantized fields: the other half of what a unified theory must reconcile.',
    'G7c': 'Renormalization and gauge symmetry, the working language of the Standard Model.',
    'G7d': 'Where particle physics meets cosmic observation.',
    'G8': 'Turns everything you have learned into a reproducible investigation.',
    'E1': 'Groups and representations: the language of symmetry in quantum mechanics and gauge theory.',
    'E2': 'Separates finite-dimensional intuition from the infinite-dimensional spaces quantum theory needs.',
}

READY = {
    'F1': 'Solve mixed unfamiliar algebra and function problems at about 85%, twice.',
    'F2': 'Derive identities and resolve 2D vectors unaided.',
    'F3': 'Complete a cumulative precalculus test in time, with clear written steps.',
    'F4': 'Write and explain a small simulation and plot from scratch.',
    'M1': 'Pass a timed mixed exam; derive and interpret velocity and acceleration.',
    'M2': 'Choose methods independently; explain convergence and error.',
    'M3': 'Compute a gradient, a flux and a constrained extremum.',
    'M4': 'Diagonalize a simple operator and explain basis changes.',
    'M5': 'Solve a driven oscillator and interpret its parameters.',
    'M6': 'Write valid direct, contradiction and induction proofs.',
    'M7': 'Design and critique a simple inference or simulation.',
    'M8a': 'Solve one transform or contour problem cleanly.',
    'M8b': 'Solve one boundary value or transform problem cleanly.',
    'M9a': 'Prove a basic convergence result.',
    'M9b': 'Compute simple metric quantities.',
    'P1': 'Solve novel multistep problems and report uncertainty from a lab.',
    'P2': 'Use symmetry and integrals to solve standard field problems.',
    'P3': 'Model a damped wave or interference experiment.',
    'P4': 'Work Lorentz and basic quantum problems without analogy alone.',
    'P5': 'Derive Euler–Lagrange equations for two distinct systems.',
    'P6a': 'Solve electrostatic boundary problems.',
    'P6b': 'Solve wave and radiation boundary problems.',
    'P7a': 'Solve eigenvalue and spin problems.',
    'P7b': 'Solve perturbation and spin problems.',
    'P8': 'Derive a simple partition function and a thermodynamic quantity.',
    'P9': 'Submit a reproducible report with code, plots and uncertainties.',
    'G1': 'Solve a new boundary value problem with a justified method.',
    'G2': 'Derive a Hamiltonian and a conserved quantity in unfamiliar systems.',
    'G3': 'Work extended boundary and radiation exercises unaided.',
    'G4': 'Complete a coherent multi-hour problem set independently.',
    'G5': 'Derive results from partition functions and explain the assumptions.',
    'G6': 'Reproduce a published benchmark and document the code tests.',
    'G7a': 'Reproduce textbook derivations and identify untested assumptions.',
    'G7b': 'Reproduce textbook derivations and identify untested assumptions.',
    'G7c': 'Reproduce textbook derivations and identify untested assumptions.',
    'G7d': 'Reproduce textbook derivations and identify untested assumptions.',
    'G8': 'Present a short reproducible report, including null results.',
}

SUPPLEMENTS = {
    'M7': {'text': 'Use MIT probability for distributions and limit theorems; add OpenStax Introductory Statistics for inference and regression.',
           'links': [['OpenStax Introductory Statistics', 'https://openstax.org/details/books/introductory-statistics-2e']]},
    'M8b': {'text': 'Use the PDE notes together with the Fourier and Laplace units in M5 and the complex methods in M8a.', 'links': []},
    'G1': {'text': 'Use the PDE notes together with the Fourier and Laplace units in M5 and the complex methods in M8a.', 'links': []},
    'M9b': {'text': 'Combine the geometry notes with the tensor and connection chapters of the general relativity notes.',
            'links': [['David Tong, General Relativity notes', 'https://www.damtp.cam.ac.uk/user/tong/gr/grhtml/']]},
    'P4': {'text': 'Combine MIT relativity with OpenStax University Physics Volume 3 for modern physics.',
           'links': [['OpenStax University Physics Volume 3', 'https://openstax.org/books/university-physics-volume-3/pages/preface']]},
    'P7b': {'text': 'Use MIT Quantum Physics II for the formalism and MIT Quantum Physics III for advanced approximations and scattering.',
            'links': [['MIT Quantum Physics III (course search)', 'https://ocw.mit.edu/search/?q=8.06']]},
    'G3': {'text': 'Begin from the linked electromagnetism notes, then use an advanced electrodynamics text for graduate boundary and radiation exercises.',
           'links': [['MIT graduate electromagnetism (course search)', 'https://ocw.mit.edu/search/?q=graduate%20electromagnetism']]},
    'G4': {'text': 'Add advanced many-body or relativistic topics later if a target syllabus requires them.', 'links': []},
}

LEVEL = lambda code: {'F': 'foundation', 'M': 'university', 'P': 'university', 'G': 'graduate', 'E': 'university'}[code[0]]
HOURS = {'foundation': '5–7', 'university': '8–12', 'graduate': '10–15'}
FINAL_MIN = {'foundation': 90, 'university': 120, 'graduate': 180}

def parse_prereq(code, text):
    req, soft = [], []
    for clause in text.split(';'):
        found = re.findall(r'\b([FMPGE]\d+[a-d]?)\b', clause)
        # "At least P5 to P9"
        rng = re.search(r'\b(P\d)\s+to\s+(P\d)\b', clause)
        if rng:
            a, b = ORDER.index(rng.group(1)), ORDER.index(rng.group(2))
            found = ORDER[a:b + 1]
        isoft = re.search(r'helpful|useful|recommended|concurrent|alongside|before systems|\bfor\b', clause)
        for f in found:
            if f == code or f not in ORDER:
                continue
            (soft if isoft else req).append(f)
    # M8 grouping in prerequisite text never appears; keep order and uniqueness
    dedup = lambda xs: [x for i, x in enumerate(xs) if x not in xs[:i]]
    req = dedup(req); soft = [s for s in dedup(soft) if s not in req]
    return req, soft

courses = []
for c in raw:
    code = c['code']
    req, soft = parse_prereq(code, c['prerequisites'])
    lvl = LEVEL(code)
    units = []
    for n, u in enumerate(c['units'], 1):
        fix = lambda t: t.replace('Schrodinger', 'Schrödinger').replace('Gauss law', "Gauss's law").replace('Ampere law', "Ampère's law")
        caps = [fix(t[0].upper() + t[1:]) for t in u['topics']]
        u = dict(u, topics=[fix(t) for t in u['topics']])
        units.append({'n': n, 'weeks': u['weeks'], 'topics': caps, 'name': caps[0] + ', ' + u['topics'][1], 'deliverable': u['deliverable']})
    reading = {'title': c['reading']['title'], 'url': c['reading']['url']}
    if code == 'G8':
        reading['title'] = 'Example: a university physics program and its research requirements (FAU catalog)'
    entry = {
        'code': code, 'title': c['title'], 'group': code[0], 'level': lvl, 'hours': HOURS[lvl], 'finalMinutes': FINAL_MIN[lvl],
        'prereqText': c['prerequisites'].rstrip('.'), 'req': req, 'soft': soft,
        'purpose': c['purpose'].replace('Elective: ', ''), 'why': WHY[code], 'ready': READY.get(code),
        'reading': reading, 'readingNote': c['readingNote'], 'supplement': SUPPLEMENTS.get(code),
        'units': units, 'project': c['project'], 'profile': c['profile'], 'completion': c['completion'],
        'elective': code.startswith('E'),
    }
    courses.append(entry)

# reverse edges
for c in courses:
    c['leadsTo'] = [d['code'] for d in courses if c['code'] in d['req']]

PROFILES = {
    'T': {'name': 'Theory', 'weights': [['Problem sets', 25], ['Quizzes', 10], ['Midterm', 20], ['Final', 30], ['Project', 15]],
          'evidence': 'Two independent cumulative attempts near 85%, with sound reasoning and repaired prerequisites.'},
    'C': {'name': 'Computation', 'weights': [['Programs', 40], ['Verification tests', 20], ['Quizzes', 10], ['Final project', 30]],
          'evidence': 'Code works from a clean start; oral explanation; compared against an independent benchmark.'},
    'L': {'name': 'Laboratory', 'weights': [['Reports', 40], ['Code', 25], ['Midcourse review', 15], ['Final project', 20]],
          'evidence': 'Raw data, uncertainty, calibration, controls and reproducible analysis.'},
    'R': {'name': 'Research', 'weights': [['Proposal', 15], ['Reproduction', 25], ['Audit', 25], ['Report', 25], ['Oral defense', 10]],
          'evidence': 'A reproducible baseline, a defensible interpretation and explicitly stated unresolved limitations.'},
}

RESOURCES = [
    {'level': 'Algebra through precalculus', 'free': [['Khan Academy mathematics', 'https://www.khanacademy.org/math'], ['OpenStax Precalculus 2e', 'https://openstax.org/books/precalculus-2e/pages/preface']],
     'paid': 'Math Academy Foundations I–III for adaptive retrieval practice (optional).', 'paidUrl': 'https://www.mathacademy.com/courses'},
    {'level': 'Calculus and core mathematics', 'free': [['MIT OCW Scholar: 18.01SC, 18.02SC, 18.03SC, 18.06SC', 'https://ocw.mit.edu/collections/ocw-scholar/'], ['OpenStax Calculus Volume 1', 'https://openstax.org/books/calculus-volume-1/pages/preface']],
     'paid': 'An adaptive practice platform, used for practice rather than as your only exam source (optional).', 'paidUrl': None},
    {'level': 'Introductory physics', 'free': [['MIT OCW 8.01SC and electromagnetism', 'https://ocw.mit.edu/collections/ocw-scholar/'], ['OpenStax University Physics Volume 1', 'https://openstax.org/books/university-physics-volume-1/pages/preface']],
     'paid': 'A tutor or study group if weekly independent problem solving stalls.', 'paidUrl': None},
    {'level': 'Upper physics', 'free': [['MIT OCW physics syllabi and assignments', 'https://ocw.mit.edu/collections/ocw-scholar/']],
     'paid': 'A used standard text, chosen from a current course syllabus.', 'paidUrl': None},
    {'level': 'Graduate theory', 'free': [['Perimeter Institute free online training', 'https://perimeterinstitute.ca/training/online-training']],
     'paid': 'A university course for credit, after prerequisites and advising.', 'paidUrl': None},
]

catalog = {'groups': GROUPS, 'courses': courses, 'profiles': PROFILES, 'resources': RESOURCES}
json.dump(catalog, open('/home/claude/toe/src/catalog.json', 'w'), ensure_ascii=False, separators=(',', ':'))
for c in courses:
    print(c['code'], 'req', c['req'], 'soft', c['soft'], '→', c['leadsTo'])
