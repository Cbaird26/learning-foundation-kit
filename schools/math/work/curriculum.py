"""The Mathematics Learning Foundation curriculum: kindergarten through a college mathematics degree to graduate study
and PhD qualifying exams. K-12 is shared with the AI Learning Foundation (with its programming track); calculus,
linear algebra, proof, differential equations, probability, real analysis and Fourier methods come from the ToE
Learning Foundation, discrete mathematics from the AI school, logic from the Metaphysics school and the theory of
computation from the Coding school (same lessons, renumbered). Writes work/courses_raw.json (writer-facing) and
work/meta.json (site-facing extras)."""
import json, copy

ROOT = '/home/claude/math'
SRC = {s: {c['code']: c for c in json.load(open(f'/home/claude/{s}/work/courses_raw.json'))}
       for s in ('ai', 'toe', 'metaphysics', 'code')}

STAGES = [
    ('K', 'Elementary school (K–5)', 'Numbers, reading and writing, science and the world around us, plus first steps in computational thinking and Python, learned with a grown-up close by.'),
    ('J', 'Middle school (6–8)', 'Ratios to algebra, reading and writing, life, physical and earth science, history, and programming in Python.'),
    ('H', 'High school (9–12)', 'Algebra, geometry, trigonometry, precalculus, calculus and statistics, the sciences, English and history, and Python for data and simulation.'),
    ('C', 'College mathematics degree', 'Calculus, linear algebra, proof and discrete mathematics; real and complex analysis, abstract algebra and topology; probability, number theory, combinatorics, numerical analysis and differential equations; geometry, dynamics, logic and computation as electives; and problem solving and mathematical writing.'),
    ('P', 'Graduate study and qualifying exams in mathematics', 'Measure theory, graduate algebra, algebraic topology, smooth manifolds, functional analysis and probability theory, with qualifying-exam preparation and a first expository paper.'),
]
LEVEL = {'K': 'elementary', 'J': 'middle', 'H': 'high', 'C': 'college', 'P': 'professional'}
FINAL_MIN = {'elementary': 30, 'middle': 45, 'high': 60, 'college': 120, 'professional': 180}
HOURS = {'elementary': '2–3', 'middle': '3–4', 'high': '4–6', 'college': '8–12', 'professional': '10–14'}

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


# ---------------- reused courses: (source school, old code) -> new code, with a mathematics reason ----------------
REUSE = [
    ('ai', 'K1', 'K1', 'Counting and number sense are where all of mathematics begins.'),
    ('ai', 'K2', 'K2', 'Place value, multiplication and fractions are the first big ideas of arithmetic.'),
    ('ai', 'K3', 'K3', 'Multi-digit operations, fractions and decimals complete the arithmetic every later course uses.'),
    ('ai', 'K4', 'K4', 'Reading opens every book and every word problem.'),
    ('ai', 'K5', 'K5', 'Clear reading and writing let you follow and explain mathematical reasoning.'),
    ('ai', 'K6', 'K6', 'Explaining your reasons in writing is the first step toward writing proofs.'),
    ('ai', 'K7', 'K7', 'Science gives you things to count, measure and compare.'),
    ('ai', 'K8', 'K8', 'Science teaches you to test ideas against evidence, as mathematicians test conjectures against proof.'),
    ('ai', 'K9', 'K9', 'Communities, maps and history show where mathematics is used and where it came from.'),
    ('ai', 'K10', 'K10', 'Step-by-step instructions and patterns are the seeds of algorithms and proofs.'),
    ('ai', 'K11', 'K11', 'Python lets you experiment with numbers and patterns, and you start writing it here.'),
    ('ai', 'J1', 'J1', 'Ratios, rational numbers and expressions are the bridge from arithmetic to algebra.'),
    ('ai', 'J2', 'J2', 'Proportions, equations and probability are the first tools of mathematical modeling.'),
    ('ai', 'J3', 'J3', 'Functions and geometry are two ideas the rest of mathematics is built on.'),
    ('ai', 'J4', 'J4', 'Close reading and clear writing help you read mathematics and explain your solutions.'),
    ('ai', 'J5', 'J5', 'Life science shows how mathematics describes growth, heredity and populations.'),
    ('ai', 'J6', 'J6', 'Physical science is where equations meet measurements.'),
    ('ai', 'J7', 'J7', 'Earth and space science use the geometry, scales and rates you are learning.'),
    ('ai', 'J8', 'J8', 'History shows how mathematical ideas developed across many cultures.'),
    ('ai', 'J9', 'J9', 'Variables, decisions, loops and functions in Python let you test conjectures and compute examples.'),
    ('ai', 'H1', 'H1', 'Algebra and functions are the language of all higher mathematics.'),
    ('ai', 'H2', 'H2', 'Geometry is where you first write proofs from axioms.'),
    ('ai', 'H3', 'H3', 'Trigonometry and vectors connect algebra to geometry and prepare you for calculus.'),
    ('ai', 'H4', 'H4', 'Precalculus completes the functions and reasoning that calculus needs.'),
    ('ai', 'H5', 'H5', 'Calculus is the gateway to analysis, differential equations and geometry.'),
    ('ai', 'H6', 'H6', 'Statistics and probability begin the mathematics of uncertainty.'),
    ('ai', 'H7', 'H7', 'Biology is full of patterns, from growth to heredity, that mathematics models.'),
    ('ai', 'H8', 'H8', 'Chemistry uses ratios, exponentials and logarithms every day.'),
    ('ai', 'H9', 'H9', 'Physics is where calculus and vectors were developed and still find their most famous uses.'),
    ('ai', 'H10', 'H10', 'Reading and writing well help you learn quickly and communicate mathematics.'),
    ('ai', 'H11', 'H11', 'Research and professional writing prepare you to write papers and reports.'),
    ('ai', 'H12', 'H12', 'Government and history give context for how mathematics and statistics are used in public life.'),
    ('ai', 'H13', 'H13', 'World history shows how mathematics grew from many traditions.'),
    ('ai', 'H14', 'H14', 'Data, algorithms and simulations in Python let you explore mathematics computationally.'),
    ('toe', 'M2', 'C1', 'Integration techniques, sequences and series complete single-variable calculus.'),
    ('toe', 'M3', 'C2', 'Calculus in several variables and vector fields is used in analysis, geometry and every applied field.'),
    ('toe', 'M4', 'C3', 'Linear algebra is the most widely used subject in mathematics.'),
    ('toe', 'M6', 'C4', 'Proof is the method of mathematics, and this course teaches you to read and write proofs.'),
    ('ai', 'C2', 'C5', 'Logic, sets, counting and graphs are the language of discrete mathematics.'),
    ('toe', 'M5', 'C6', 'Differential equations describe how things change and lead to dynamical systems.'),
    ('toe', 'M7', 'C7', 'Probability and statistical inference are the mathematics of uncertainty and data.'),
    ('toe', 'M9a', 'C8', 'Real analysis proves the theorems behind calculus and begins the rigorous study of limits.'),
    ('toe', 'M8b', 'C20', 'Fourier methods and partial differential equations connect analysis to physics and engineering.'),
    ('metaphysics', 'C20', 'C21', 'Metalogic, set theory and incompleteness show what proofs can and cannot do.'),
    ('code', 'C11', 'C22', 'Automata, computability and complexity are the mathematics of what computers can do.'),
]
TITLE = {'C8': 'Real analysis I'}
READY = {  # the ToE courses had no "ready" line
    'C1': 'Integrates by the standard techniques, tests series for convergence, and approximates functions with Taylor polynomials and error bounds.',
    'C2': 'Computes partial derivatives, multiple integrals and line and surface integrals, and applies the theorems of Green, Stokes and Gauss.',
    'C3': 'Solves linear systems, computes with matrices, determinants and eigenvalues, and explains linear maps geometrically.',
    'C4': 'Reads and writes direct, contrapositive, contradiction and induction proofs about sets, functions and numbers.',
    'C6': 'Solves first- and second-order equations and linear systems, and analyzes stability and qualitative behavior.',
    'C7': 'Computes with distributions, expectations and limit theorems, and carries out estimation and hypothesis tests.',
    'C8': 'Proves results about completeness, sequences, continuity, differentiation and integration from the definitions.',
    'C20': 'Expands functions in Fourier series and solves the heat, wave and Laplace equations by separation of variables.',
}
NEWCODE = {(s, old): new for s, old, new, _ in REUSE}
ELECTIVE = {'C18', 'C19', 'C20', 'C21', 'C22'}
REQ_OVERRIDE = {  # every reused college course gets prerequisites from this school
    'C1': (['H5'], ['H4']),
    'C2': (['C1'], ['H3']),
    'C3': (['H4'], ['C1']),
    'C4': (['H4'], ['C3']),
    'C5': (['H4'], ['C4', 'H14']),
    'C6': (['C1'], ['C3']),
    'C7': (['C1'], ['C2', 'H14']),
    'C8': (['C1', 'C4'], []),
    'C20': (['C2', 'C3', 'C6'], ['C13']),
    'C21': (['C4'], ['C5']),
    'C22': (['C5'], ['H14']),
}

dropped = []
for s, old, new, why in REUSE:
    t = copy.deepcopy(SRC[s][old])
    t['code'] = new
    t['title'] = TITLE.get(new, t['title'])
    t['stage'], t['level'] = new[0], LEVEL[new[0]]
    t['why'] = why
    t['reusedFrom'] = f'{s}:{old}'
    t['elective'] = new in ELECTIVE
    t.setdefault('supplement', None)
    t.setdefault('readingScope', None)
    t.setdefault('readingNote', None)
    if not t.get('ready'):
        t['ready'] = READY[new]
    t.pop('page', None)
    if new in REQ_OVERRIDE:
        t['req'], t['soft'] = REQ_OVERRIDE[new]
    else:
        req, soft = [], []
        for lst, out in ((t.get('req', []), req), (t.get('soft', []), soft)):
            for r in lst:
                if (s, r) in NEWCODE:
                    out.append(NEWCODE[(s, r)])
                elif r[0] in 'KJH' and ('ai', r) in NEWCODE:
                    out.append(r)
                else:
                    dropped.append((new, r))
        t['req'], t['soft'] = req, soft
    t['prerequisites'] = (', '.join(t['req']) if t['req'] else 'None') + ('; helpful: ' + ', '.join(t['soft']) if t['soft'] else '') + '.'
    COURSES.append(t)

# ---------------- free readings (each checked online on Nov 9, 2026) ----------------
LADR = ('Linear Algebra Done Right by Sheldon Axler, 4th edition (free, open access)', 'https://linear.axler.net/')
MIRA = ('Measure, Integration & Real Analysis by Sheldon Axler (free, open access)', 'https://measure.axler.net/')
BOP = ('Book of Proof by Richard Hammack (free PDF)', 'https://www.people.vcu.edu/~rhammack/BookOfProof/')
AATA = ('Abstract Algebra: Theory and Applications by Thomas W. Judson (free online)', 'https://judsonbooks.org/abstract-algebra-theory-and-applications/')
LEBL = ('Basic Analysis I and II by Jiří Lebl (free online)', 'https://www.jirka.org/ra/')
BECK = ('A First Course in Complex Analysis by Beck, Marchesi, Pixton and Sabalka (free online)', 'https://matthbeck.github.io/complex.html')
TWT = ('Topology Without Tears by Sidney A. Morris (free PDF)', 'https://www.topologywithouttears.net/')
STEIN = ('Elementary Number Theory: Primes, Congruences, and Secrets by William Stein (free PDF)', 'https://wstein.org/ent/')
KT = ('Applied Combinatorics by Mitchel T. Keller and William T. Trotter (free online)', 'https://www.appliedcombinatorics.org/')
FNC = ('Fundamentals of Numerical Computation by Tobin A. Driscoll and Richard J. Braun, Python edition (free online)', 'https://fncbook.com/')
GHOMI = ('Lecture Notes on Differential Geometry, volume I: Curves and Surfaces, by Mohammad Ghomi (free PDF)', 'https://ghomi.math.gatech.edu/LectureNotes/')
CHAOS = ('MIT OpenCourseWare 12.006J Nonlinear Dynamics: Chaos, lecture notes by Daniel Rothman (free online)', 'https://ocw.mit.edu/courses/12-006j-nonlinear-dynamics-chaos-fall-2022/')
MILNE = ('Course notes by J. S. Milne: Group Theory, and Fields and Galois Theory (free PDF)', 'https://www.jmilne.org/math/CourseNotes/')
HATCHER = ('Algebraic Topology by Allen Hatcher (free PDF)', 'https://pi.math.cornell.edu/~hatcher/AT/ATpage.html')
GUALT = ('Lecture notes on smooth manifolds by Marco Gualtieri, University of Toronto (free PDF)', 'https://www.math.toronto.edu/mgualt/courses/17-1300/')
DURRETT = ('Probability: Theory and Examples by Rick Durrett, 5th edition (free PDF)', 'https://sites.math.duke.edu/~rtd/PTE/pte.html')
ARXIV = ('arXiv, the open archive of mathematics preprints', 'https://arxiv.org/')

# ---------------- new college courses ----------------
C('C9', 'Linear algebra II: vector spaces, inner products and spectral theory', 'T', ['C3', 'C4'], ['C8'],
  'Study linear algebra as mathematicians use it: abstract vector spaces, bases and dimension, linear maps and their matrices, quotients and duality, eigenvalues and invariant subspaces, inner product spaces and orthogonality, the spectral theorem, the singular value decomposition, determinants and traces, and the Jordan form, with proofs and with computation in Python.',
  'Linear algebra is used in every branch of mathematics, and this course turns matrix skills into the theory that analysis, algebra and geometry assume.',
  'Proves standard results about linear maps and spectra, computes canonical forms and decompositions by hand and in code, and chooses the right structure theorem for a problem.',
  LADR,
  [('Vector spaces and subspaces over a field', 'Span, linear independence, bases and dimension', 'Prove that a supplied set is a basis and find the dimension of a subspace.'),
   ('Linear maps, null spaces and ranges', 'Matrices of linear maps, change of basis, quotients and duality', 'Prove the rank–nullity theorem and apply it to a supplied map.'),
   ('Eigenvalues, eigenvectors and invariant subspaces', 'Upper-triangular matrices and diagonalizability', 'Decide which supplied operators are diagonalizable and prove it.'),
   ('Inner product spaces, norms and orthonormal bases', 'Gram–Schmidt, orthogonal projection and least squares', 'Week 7 midterm; prove a projection result and compute a least-squares fit.'),
   ('Self-adjoint and normal operators: the spectral theorem', 'Positive operators, isometries and the singular value decomposition', 'Prove the spectral theorem for real symmetric 2 × 2 matrices and compute an SVD.'),
   ('Determinants and traces', 'Generalized eigenvectors and the Jordan form', 'Find the Jordan form of a supplied matrix and justify each step.')],
  'Spectral portfolio: prove three structure theorems in full (rank–nullity, the spectral theorem for real symmetric matrices and the existence of the singular value decomposition), implement Gram–Schmidt, the power method and a small singular value decomposition in plain Python, and apply them to least squares, image compression or a Markov chain with a written explanation of every step.')

C('C10', 'Abstract algebra I: groups', 'T', ['C4'], ['C3', 'C5'],
  "Learn group theory with proofs: groups, subgroups and cyclic groups, permutation and symmetry groups, cosets and Lagrange's theorem, normal subgroups and quotient groups, homomorphisms and the isomorphism theorems, direct products and finite abelian groups, group actions and counting, conjugacy and the class equation, and the Sylow theorems, with computation in Python.",
  'Groups describe symmetry throughout mathematics and science, and this course is the first half of the algebra every mathematician uses.',
  'Proves standard group-theoretic results, computes with permutations and small groups, and classifies groups of small order.',
  AATA,
  [('Groups, examples and basic properties', 'Subgroups and cyclic groups', 'Prove that a supplied subset is a subgroup and find the orders of its elements.'),
   ('Permutation groups and symmetry groups', "Cosets and Lagrange's theorem", "Compute with permutations in cycle notation and apply Lagrange's theorem."),
   ('Normal subgroups and quotient groups', 'Homomorphisms and the first isomorphism theorem', 'Identify a quotient group by means of a homomorphism.'),
   ('The second and third isomorphism theorems', 'Direct products and finite abelian groups', 'Week 7 midterm; classify the abelian groups of a given order.'),
   ('Group actions, orbits and stabilizers', "Counting with group actions: Burnside's lemma", "Count colorings up to symmetry with Burnside's lemma."),
   ('Conjugacy classes and the class equation', 'The Sylow theorems and groups of small order', 'Use the Sylow theorems to show that no group of a given order is simple.')],
  "Symmetry casebook: find the symmetry groups of five objects (regular polygons, a cube and two patterns), identify each up to isomorphism with proofs, implement permutation multiplication and orbit counting in plain Python, and use Burnside's lemma to count the colorings of two of the objects.")

C('C11', 'Abstract algebra II: rings, fields and Galois theory', 'T', ['C10'], ['C9'],
  'Continue algebra with rings and fields: rings, ideals and quotient rings, prime and maximal ideals, polynomial rings and irreducibility, Euclidean, principal ideal and unique factorization domains, field extensions and degrees, splitting fields and finite fields, ruler-and-compass constructions, and the fundamental theorem of Galois theory with its classic consequences.',
  'Rings and fields are the structures behind number theory, algebraic geometry and coding theory, and Galois theory answers questions that stood open for centuries.',
  'Proves results about ideals and factorization, computes in polynomial rings and finite fields, and uses the Galois correspondence to answer questions about constructibility and solvability.',
  AATA,
  [('Rings, subrings and integral domains', 'Ideals, quotient rings and ring homomorphisms', 'Find the ideals of a supplied ring and identify a quotient.'),
   ('Prime and maximal ideals', 'Fields of fractions and the characteristic of a ring', 'Prove that a quotient ring is a field exactly when the ideal is maximal.'),
   ('Polynomial rings and the division algorithm', 'Irreducibility tests: rational roots, reduction modulo a prime and Eisenstein', 'Decide the irreducibility of supplied polynomials with proofs.'),
   ('Euclidean domains, principal ideal domains and unique factorization', 'Field extensions, algebraic elements and degrees', 'Week 7 midterm; compute the degree of a supplied field extension.'),
   ('Splitting fields and finite fields', 'Ruler-and-compass constructions', 'Construct a finite field of a given order and prove an impossibility result.'),
   ('Field automorphisms and the fundamental theorem of Galois theory', 'Solvability by radicals and the insolvability of the general quintic', 'Compute the Galois group and the subfield lattice of a supplied polynomial.')],
  'Galois notebook: work out in full the Galois groups and intermediate fields of three polynomials (one with a cyclic group, one with group S3 and one biquadratic), implement arithmetic in a finite field of order p^n in plain Python and check that its multiplicative group is cyclic, and write a clear expository account of why the general quintic is not solvable by radicals.')

C('C12', 'Real analysis II: metric spaces, uniform convergence and several variables', 'T', ['C8'], ['C2', 'C9'],
  'Extend analysis beyond the real line: metric spaces, open and closed sets, completeness and compactness, continuity and connectedness, sequences and series of functions and uniform convergence, power series, the Weierstrass approximation and Arzelà–Ascoli theorems, the contraction mapping principle, derivatives of maps between Euclidean spaces, the inverse and implicit function theorems, and multiple integrals.',
  'These are the working tools of modern analysis, differential equations and geometry, and the core of every analysis qualifying exam.',
  'Proves results about compactness, completeness and uniform convergence, applies the contraction mapping, inverse and implicit function theorems, and computes derivatives of maps between Euclidean spaces.',
  LEBL,
  [('Metric spaces, open and closed sets', 'Convergence, Cauchy sequences and completeness', 'Prove that a supplied metric space is complete or exhibit a Cauchy sequence that does not converge.'),
   ('Compactness and the Heine–Borel theorem', 'Continuity, uniform continuity and connectedness in metric spaces', 'Prove that a continuous function on a compact metric space attains its extreme values and is uniformly continuous.'),
   ('Sequences and series of functions: pointwise and uniform convergence', 'Interchanging limits with derivatives and integrals', 'Decide which supplied sequences converge uniformly and justify each interchange of limits.'),
   ('Power series and the Weierstrass approximation theorem', 'Equicontinuity and the Arzelà–Ascoli theorem', 'Week 7 midterm; prove that a power series converges uniformly on compact subintervals of its interval of convergence.'),
   ('The contraction mapping principle', 'Derivatives of maps between Euclidean spaces', 'Use the contraction mapping principle to solve an equation and bound the error of the iteration.'),
   ('The inverse and implicit function theorems', 'Multiple integrals and change of variables', 'Apply the implicit function theorem to a supplied system of equations.')],
  'Analysis portfolio: prove the Arzelà–Ascoli theorem and the inverse function theorem in full with every step justified, implement Picard iteration in plain Python for two initial value problems and compare its convergence with the contraction estimate, and write a short exposition of three counterexamples that show why uniform convergence matters.')

C('C13', 'Complex analysis', 'T', ['C2', 'C8'], ['C12'],
  "Learn the analysis of functions of a complex variable: complex numbers and the Riemann sphere, analytic functions and the Cauchy–Riemann equations, power series and the elementary functions, contour integrals, Cauchy's theorem and integral formula, Liouville's theorem and the fundamental theorem of algebra, Taylor and Laurent series, singularities and residues, evaluation of real integrals, the argument principle and Rouché's theorem, and conformal maps.",
  'Complex analysis is one of the most beautiful and useful theories in mathematics, a standard qualifying-exam subject, and a tool in number theory, physics and engineering.',
  "Proves the central theorems, evaluates integrals with residues, locates zeros with the argument principle and Rouché's theorem, and builds conformal maps between simple regions.",
  BECK,
  [('Complex numbers, the plane and the Riemann sphere', 'Functions of a complex variable, limits and continuity', 'Describe the images of supplied regions under simple maps.'),
   ('Differentiability and the Cauchy–Riemann equations', 'Power series, the exponential, logarithms and branches', 'Decide where supplied functions are analytic and choose a branch of the logarithm.'),
   ('Contour integrals and the estimation lemma', "Cauchy's theorem and Cauchy's integral formula", "Evaluate contour integrals with Cauchy's integral formula."),
   ("Liouville's theorem, the maximum modulus principle and the fundamental theorem of algebra", 'Taylor and Laurent series', 'Week 7 midterm; find Laurent series in supplied annuli.'),
   ('Isolated singularities and the residue theorem', 'Evaluating real integrals and series with residues', 'Evaluate three real integrals with residues.'),
   ("The argument principle and Rouché's theorem", 'Conformal maps and Möbius transformations', "Count the zeros in a disk with Rouché's theorem and map a half-plane onto the disk.")],
  'Residue and mapping workbook: evaluate eight real integrals and two infinite series by residues with every contour justified, check each value numerically in plain Python, prove the fundamental theorem of algebra two ways (with Liouville\'s theorem and with Rouché\'s theorem), and construct and check three conformal maps between standard regions.')

C('C14', 'Topology', 'T', ['C8'], ['C10', 'C12'],
  "Learn point-set topology and a first look at algebraic topology: topological spaces and bases, closure and interior, continuous maps and homeomorphisms, subspace, product and quotient topologies, connectedness and path connectedness, compactness, countability and separation axioms, Urysohn's lemma and metrization in outline, and homotopy and the fundamental group of the circle.",
  'Topology is the language of continuity used throughout analysis and geometry, and a standard qualifying-exam subject.',
  'Proves results about connectedness, compactness and separation, builds spaces as products and quotients, and computes simple fundamental groups.',
  TWT,
  [('Topological spaces, open sets and bases', 'Closed sets, closure, interior and limit points', 'Decide which supplied collections are topologies and find closures and interiors.'),
   ('Continuous maps and homeomorphisms', 'Subspace, product and quotient topologies', 'Show that a supplied quotient space is homeomorphic to a familiar space.'),
   ('Connectedness and path connectedness', 'Compactness and the tube lemma', 'Prove that supplied spaces are or are not connected or compact.'),
   ('Compactness of finite products and compactness in metric spaces', 'Countability and separation axioms', 'Week 7 midterm; prove a separation property of a supplied space.'),
   ("Normal spaces and Urysohn's lemma", 'Metrization in outline and the Cantor set', "Use Urysohn's lemma to separate disjoint closed sets by a continuous function."),
   ('Homotopy and the fundamental group', 'The fundamental group of the circle and its applications', 'Prove the two-dimensional Brouwer fixed point theorem from the fundamental group of the circle.')],
  "Counterexample atlas: build a written atlas of twelve spaces (including the Sorgenfrey line, the topologist's sine curve, the Cantor set and the line with two origins) that shows exactly which properties each has and lacks, with proofs, and write a full proof that the fundamental group of the circle is the integers, with two applications.")

C('C15', 'Number theory', 'P', ['C4'], ['C10', 'H14'],
  "Learn elementary number theory with computation: divisibility and the Euclidean algorithm, primes and unique factorization, congruences and the Chinese remainder theorem, Fermat's and Euler's theorems, public-key cryptography, primitive roots, primality tests and factoring, quadratic residues and quadratic reciprocity, continued fractions and Pell's equation, and arithmetic functions and the distribution of primes, with Python throughout.",
  'Number theory trains proof and computation together, and its ideas secure the internet and lead to some of the deepest open problems in mathematics.',
  'Proves classical theorems, computes efficiently with large integers in Python, and explains why public-key cryptography works and what makes it secure.',
  STEIN,
  [("Divisibility, the Euclidean algorithm and Bézout's identity", 'Primes and the fundamental theorem of arithmetic', 'Implement the extended Euclidean algorithm and prove that it is correct.'),
   ('Congruences and modular arithmetic', 'Linear congruences and the Chinese remainder theorem', 'Solve systems of congruences by hand and in code.'),
   ("Fermat's little theorem, Euler's theorem and fast exponentiation", 'The RSA cryptosystem', 'Encrypt and decrypt with a toy RSA key and explain why decryption works.'),
   ('Primitive roots and discrete logarithms', 'Primality tests and factoring algorithms', 'Week 7 midterm; implement a probabilistic primality test.'),
   ('Quadratic residues and the Legendre symbol', 'Quadratic reciprocity', 'Use quadratic reciprocity to decide whether supplied congruences are solvable.'),
   ("Continued fractions and Pell's equation", 'Arithmetic functions, the prime number theorem and open problems', 'Solve a Pell equation with continued fractions.')],
  "Number theory toolkit: write a tested plain-Python library with the extended Euclidean algorithm, modular inverses, the Chinese remainder theorem, fast modular exponentiation, the Miller–Rabin test, Pollard's rho method and continued fractions, use it to build a toy RSA key and to factor a deliberately weak one, and write a report that proves each algorithm correct and explains what makes real keys secure.")

C('C16', 'Combinatorics and graph theory', 'P', ['C5'], ['C3', 'H14'],
  "Learn to count and to reason about networks: counting principles, binomial coefficients and combinatorial proofs, inclusion–exclusion, the pigeonhole principle and Ramsey numbers, recurrence relations and generating functions, graphs and isomorphism, trees and spanning trees, connectivity, Eulerian and Hamiltonian paths, matchings and Hall's theorem, coloring and planarity, and network flows, with algorithms in Python.",
  'Combinatorics and graph theory are the mathematics of discrete structures, from algorithms and networks to probability and coding theory.',
  'Counts arrangements with the main techniques, proves graph-theoretic results, and implements and analyzes the standard graph algorithms.',
  KT,
  [('Counting principles, permutations and combinations', 'Binomial coefficients and combinatorial proofs', 'Prove two identities by double counting.'),
   ('Inclusion–exclusion and derangements', 'The pigeonhole principle and Ramsey numbers', 'Count derangements and surjections with inclusion–exclusion.'),
   ('Recurrence relations', 'Generating functions', 'Solve a supplied recurrence with a generating function and check it in code.'),
   ('Graphs, degrees and isomorphism', 'Trees, spanning trees and counting trees', 'Week 7 midterm; implement a minimum spanning tree algorithm.'),
   ('Connectivity, Eulerian and Hamiltonian paths', "Matchings and Hall's theorem", 'Find a maximum matching and prove that it is maximum.'),
   ('Graph coloring and planarity', 'Network flows and the max-flow min-cut theorem', 'Compute a maximum flow and a minimum cut of equal capacity.')],
  "Discrete structures report: implement and test in plain Python a solver for linear recurrences, breadth-first search, Kruskal's and Dijkstra's algorithms, a bipartite matching algorithm and a maximum-flow algorithm, prove two of them correct, and apply them to a supplied scheduling and assignment problem in a written report.")

C('C17', 'Numerical analysis', 'P', ['C2', 'C3'], ['C6', 'H14'],
  'Learn how computers solve mathematical problems and how to trust the answers: floating-point arithmetic and error, conditioning and stability, root finding, interpolation and polynomial approximation, numerical differentiation and integration, direct methods for linear systems, least squares, iterative and eigenvalue methods, and numerical methods for ordinary differential equations, with convergence proofs and Python throughout.',
  'Almost every application of mathematics ends in a computation, and numerical analysis tells you when the computed answer can be believed.',
  'Implements the standard algorithms from scratch, predicts and measures their rates of convergence and their errors, and chooses a stable method for a given problem.',
  FNC,
  [('Floating-point numbers, rounding and cancellation', 'Conditioning and stability', 'Measure the cancellation error in a supplied formula and rewrite the formula stably.'),
   ("Root finding: bisection, fixed-point iteration and Newton's method", 'Orders of convergence', "Implement Newton's method and measure its order of convergence."),
   ('Polynomial interpolation and the Runge phenomenon', 'Chebyshev points and splines', 'Compare equispaced and Chebyshev interpolation of a supplied function.'),
   ('Numerical differentiation and Richardson extrapolation', 'Numerical integration: trapezoid, Simpson and Gaussian quadrature', 'Week 7 midterm; verify the orders of the trapezoid and Simpson rules.'),
   ('Gaussian elimination, LU factorization and pivoting', 'Condition numbers, least squares and QR factorization', 'Solve a supplied system and bound its error with the condition number.'),
   ('Iterative methods and the power method', 'Euler and Runge–Kutta methods for differential equations', 'Implement a Runge–Kutta method and verify its order.')],
  "Numerical methods library: write a tested plain-Python library with Newton's method, Chebyshev interpolation, adaptive Simpson integration, LU factorization with partial pivoting and the classical fourth-order Runge–Kutta method, verify each method's order of convergence numerically in tables, and write a report that proves two of the error bounds and explains one case where a method fails.")

C('C18', 'Differential geometry of curves and surfaces', 'T', ['C2', 'C3'], ['C8'],
  "Learn the geometry of curves and surfaces in space: parametrized curves, arc length, curvature and torsion, the Frenet frame, regular surfaces and tangent planes, the first fundamental form, the Gauss map and the second fundamental form, principal, Gaussian and mean curvature, Gauss's Theorema Egregium, geodesics, and the Gauss–Bonnet theorem.",
  'This course is where calculus becomes geometry, and its ideas lead to Riemannian geometry, general relativity and modern geometric analysis.',
  'Computes curvatures, fundamental forms and geodesics, proves the main theorems in their classical form, and explains what the Gauss–Bonnet theorem says about shape.',
  GHOMI,
  [('Parametrized curves and arc length', 'Curvature, torsion and the Frenet frame', 'Compute the curvature and torsion of supplied curves.'),
   ('The fundamental theorem of curves', 'Plane curves, the rotation index and the four-vertex theorem', 'Reconstruct a curve from its curvature and torsion.'),
   ('Regular surfaces and tangent planes', 'The first fundamental form: lengths, angles and areas', 'Compute lengths and areas on a supplied surface.'),
   ('The Gauss map and the second fundamental form', 'Principal, Gaussian and mean curvature', 'Week 7 midterm; compute the curvatures of a surface of revolution.'),
   ("Gauss's Theorema Egregium", 'Isometries and developable surfaces', 'Prove that no region of a sphere is isometric to a region of the plane.'),
   ('Geodesics and their equations', 'The Gauss–Bonnet theorem', 'Verify the Gauss–Bonnet theorem for a supplied surface.')],
  'Curvature atlas: compute the first and second fundamental forms, principal curvatures and Gaussian curvature of six surfaces (including a torus, a catenoid and a saddle), check each by numerical differentiation in plain Python, integrate the geodesic equations numerically on two of them, and verify the Gauss–Bonnet theorem for the torus with a written proof.',
  elective=True)

C('C19', 'Dynamical systems and chaos', 'P', ['C6'], ['C3', 'H14'],
  'Learn how systems evolve: flows on the line and bifurcations, linear systems in the plane, nonlinear systems, linearization and phase portraits, conservative systems and limit cycles, the Poincaré–Bendixson theorem, Hopf bifurcations, one-dimensional maps and the logistic map, period doubling and chaos, Lyapunov exponents, the Lorenz system and fractal dimension, with simulation in Python.',
  'Dynamical systems model everything from populations and circuits to climate and the brain, and chaos showed that simple deterministic rules can produce unpredictable behavior.',
  'Classifies fixed points and bifurcations, sketches phase portraits, simulates and measures chaos, and explains the limits of prediction.',
  CHAOS,
  [('Flows on the line and fixed points', 'Bifurcations: saddle-node, transcritical and pitchfork', 'Draw the bifurcation diagram of a supplied one-dimensional system.'),
   ('Linear systems in the plane and their classification', 'Nonlinear systems, linearization and phase portraits', 'Classify the fixed points of a supplied system and sketch its phase portrait.'),
   ('Conservative systems and energy', 'Limit cycles and the Poincaré–Bendixson theorem', 'Prove that a supplied system has a periodic orbit.'),
   ('Hopf bifurcations', 'One-dimensional maps and the logistic map', 'Week 7 midterm; locate a Hopf bifurcation and the first period-doubling of the logistic map.'),
   ('Period doubling, Feigenbaum scaling and chaos', 'Lyapunov exponents', 'Compute the Lyapunov exponent of the logistic map in code.'),
   ('The Lorenz system and strange attractors', 'Fractals and fractal dimension', 'Estimate a box-counting dimension from supplied points.')],
  'Chaos laboratory: simulate in plain Python the logistic map, a nonlinear oscillator and the Lorenz system, produce a bifurcation diagram, estimate Lyapunov exponents and a fractal dimension with error checks, and write a report that connects each computation to the theorem or definition behind it.',
  elective=True)

C('C23', 'Problem solving and mathematical writing', 'T', ['C4'], ['C8', 'C10'],
  'Learn to solve problems you have not seen before and to write mathematics clearly: strategies for unfamiliar problems (small cases, invariants, the extremal principle, symmetry, induction and the pigeonhole principle), inequalities, problems in number theory, combinatorics and algebra, writing proofs that others can follow, typesetting mathematics with LaTeX, and reading and presenting mathematics.',
  'Solving unfamiliar problems and explaining the solutions are the skills that research, qualifying exams and every mathematical job demand.',
  'Solves challenging problems with a range of strategies, writes clear and complete proofs, and presents mathematics to others in writing and aloud.',
  BOP,
  [('How to attack an unfamiliar problem', 'Small cases, patterns and conjectures', 'Solve three supplied problems and record every strategy you tried.'),
   ('Invariants and monovariants', 'The extremal principle', 'Use an invariant to prove that a supplied process can never reach a target state.'),
   ('Induction in problem solving', 'The pigeonhole principle and counting arguments', 'Write complete induction and pigeonhole proofs.'),
   ('Inequalities: AM–GM, Cauchy–Schwarz and rearrangement', 'Divisibility and number theory problems', 'Week 7 midterm; prove two inequalities and solve a divisibility problem.'),
   ('Functional equations and polynomials', 'Writing proofs readers can follow', 'Rewrite a supplied messy proof so that a classmate can follow it.'),
   ('Typesetting mathematics with LaTeX', 'Reading papers and presenting mathematics', 'Typeset a two-page solution set and present one solution aloud.')],
  'Problem portfolio: solve twelve problems from the supplied list, drawn from several areas, write each solution as a polished proof typeset in LaTeX with a paragraph on how you found it, and record a ten-minute presentation of your favorite solution for a peer.')

# ---------------- graduate study and qualifying exams ----------------
C('P1', 'Measure theory and integration', 'T', ['C12'], ['C14'],
  "Learn the foundation of modern analysis: σ-algebras and measures, outer measure and the construction of Lebesgue measure, measurable functions, the Lebesgue integral, the monotone and dominated convergence theorems and Fatou's lemma, modes of convergence, product measures and the Fubini–Tonelli theorem, L^p spaces and their completeness, signed measures and the Radon–Nikodym theorem, and differentiation of integrals.",
  'Measure theory is the language of analysis, probability and much of applied mathematics, and the core of the real analysis qualifying exam.',
  'Proves the convergence theorems and applies them with justification, computes integrals with the Fubini–Tonelli theorem, and works confidently in L^p spaces.',
  MIRA,
  [('σ-algebras, measures and why they are needed', 'Outer measure and the construction of Lebesgue measure', 'Prove that every countable set has Lebesgue measure zero and outline the construction of a non-measurable set.'),
   ('Measurable functions and simple functions', 'The Lebesgue integral', 'Compute Lebesgue integrals of supplied functions from the definition.'),
   ("The monotone convergence theorem and Fatou's lemma", 'The dominated convergence theorem', 'Justify or refute the interchanges of limits in supplied examples.'),
   ('Modes of convergence: almost everywhere, in measure and in L^p', 'Product measures and the Fubini–Tonelli theorem', 'Week 7 midterm; compute an iterated integral and justify the order of integration.'),
   ('L^p spaces: the Hölder and Minkowski inequalities and completeness', 'Dense subspaces and approximation', 'Prove the completeness of L^1 and outline the density of continuous functions.'),
   ('Signed measures and the Radon–Nikodym theorem', 'The Lebesgue differentiation theorem', 'Apply the Radon–Nikodym theorem to a supplied pair of measures.')],
  'Qualifying-exam dossier in real analysis: write complete solutions to twenty exam-style problems on measure, integration and L^p spaces with every theorem cited, prove the dominated convergence theorem and the completeness of L^p from the definitions, and build a plain-Python demonstration of convergence failures (moving bumps and escaping mass) that shows numerically why each hypothesis is needed.')

C('P2', 'Graduate algebra: groups, rings, modules and fields', 'T', ['C11'], ['C9'],
  'Consolidate and extend algebra to the level of a qualifying exam: group actions and the Sylow theorems, solvable and nilpotent groups, free groups and presentations, rings and localization, modules and exact sequences, modules over a principal ideal domain and canonical forms, tensor products, Noetherian rings and the Hilbert basis theorem, Galois theory and its applications, and an introduction to representations and characters of finite groups.',
  'Algebra is one of the pillars of almost every mathematics PhD program, and its structures appear throughout geometry, topology and number theory.',
  'Solves qualifying-exam problems in groups, rings, modules and fields, proves the structure theorems, and computes Galois groups and the character tables of small groups.',
  MILNE,
  [('Group actions and the Sylow theorems revisited', 'Solvable and nilpotent groups and composition series', 'Classify the groups of a supplied small order.'),
   ('Free groups and presentations', 'Rings, ideals and localization', 'Find a presentation of a supplied group and verify it.'),
   ('Modules, exact sequences and free modules', 'Modules over a principal ideal domain', 'Decompose a supplied finitely generated abelian group.'),
   ('Rational and Jordan canonical forms from module theory', 'Tensor products', 'Week 7 midterm; derive a canonical form from a module decomposition.'),
   ('Noetherian rings and the Hilbert basis theorem', 'Galois theory: separability, normality and the fundamental theorem', 'Compute the Galois group of a supplied polynomial.'),
   ('Applications of Galois theory: finite fields, cyclotomic extensions and solvability', 'Representations and characters of finite groups', 'Build the character table of a small group.')],
  'Qualifying-exam dossier in algebra: write complete solutions to twenty exam-style problems across groups, rings, modules and fields, compute the Galois groups of five polynomials with proofs, compute the character tables of S3, D4 and A4 by hand and check their orthogonality relations in plain Python, and write a two-page summary of the structure theorems with their hypotheses.')

C('P3', 'Algebraic topology', 'T', ['C14', 'C10'], ['C11'],
  "Learn the main invariants of algebraic topology: homotopy and the fundamental group, van Kampen's theorem, covering spaces and their classification, cell complexes, simplicial and singular homology, exact sequences and excision, the Mayer–Vietoris sequence, cellular homology and the Euler characteristic, and classic applications such as the Brouwer fixed point theorem and degree theory.",
  'Algebraic topology turns questions about shape into algebra, and it is one of the standard subjects of PhD qualifying exams.',
  'Computes fundamental groups and homology groups of standard spaces, classifies covering spaces, and proves classic applications.',
  HATCHER,
  [('Homotopy, homotopy equivalence and the fundamental group', 'The fundamental groups of the circle and the spheres', 'Compute the fundamental groups of supplied spaces.'),
   ("Van Kampen's theorem", 'Cell complexes and their fundamental groups', 'Compute the fundamental group of a surface from its cell structure.'),
   ('Covering spaces and the lifting criterion', 'The classification of covering spaces and deck transformations', 'Find all connected covering spaces of a supplied space up to a given number of sheets.'),
   ('Simplicial homology', 'Singular homology and homotopy invariance', 'Week 7 midterm; compute the simplicial homology of a supplied complex.'),
   ('Exact sequences and excision', 'The Mayer–Vietoris sequence', 'Compute the homology of spheres and surfaces with the Mayer–Vietoris sequence.'),
   ('Cellular homology and the Euler characteristic', 'Applications: degree, fixed points and vector fields on spheres', 'Prove the Brouwer fixed point theorem in every dimension from homology.')],
  'Qualifying-exam dossier in topology: write complete solutions to twenty exam-style problems on fundamental groups, covering spaces and homology, compute the homology of eight spaces by two methods where possible, write a plain-Python program that computes rational homology from a list of simplices by matrix ranks and use it to check your hand computations, and write a two-page summary of the main theorems with their hypotheses.')

C('P4', 'Smooth manifolds', 'T', ['C12', 'C14'], ['C18', 'C9'],
  "Learn the language of modern geometry: smooth manifolds and smooth maps, partitions of unity, tangent spaces and differentials, submersions, immersions and embeddings, submanifolds and the regular value theorem, Sard's theorem in outline, vector fields, flows and Lie brackets, Lie groups, vector bundles and differential forms, the exterior derivative, orientation and integration, Stokes's theorem, de Rham cohomology, and Riemannian metrics.",
  'Manifolds are the setting of modern geometry, topology and physics, and their theory is a qualifying-exam subject in many programs.',
  'Works with charts, tangent vectors and differential forms, proves the main theorems, and computes the de Rham cohomology of simple manifolds.',
  GUALT,
  [('Topological and smooth manifolds, charts and atlases', 'Smooth maps and partitions of unity', 'Show that spheres and projective spaces are smooth manifolds.'),
   ('Tangent vectors and the differential', 'Submersions, immersions and embeddings', 'Compute differentials and decide which supplied maps are immersions.'),
   ('Submanifolds and the regular value theorem', "Sard's theorem and transversality in outline", 'Prove that a supplied level set is a submanifold.'),
   ('Vector fields, integral curves and flows', 'Lie brackets and Lie groups', 'Week 7 midterm; compute the flows and Lie brackets of supplied vector fields.'),
   ('Vector bundles, covectors and differential forms', 'The exterior derivative, orientation and integration', 'Integrate a supplied differential form over an oriented manifold.'),
   ("Stokes's theorem", 'De Rham cohomology and Riemannian metrics', 'Compute the de Rham cohomology of the circle and the punctured plane.')],
  "Qualifying-exam dossier in geometry: write complete solutions to twenty exam-style problems on manifolds, forms and Stokes's theorem, prove the regular value theorem and Stokes's theorem in full, check Stokes's theorem numerically in plain Python on two examples, and write a two-page guide to the definitions and theorems with their hypotheses.")

C('P5', 'Functional analysis', 'T', ['P1'], ['C9'],
  'Learn analysis in infinite-dimensional spaces: normed and Banach spaces, bounded operators and dual spaces, Hilbert spaces, orthonormal bases and Fourier series, the Riesz representation theorem, the Hahn–Banach theorem, the Baire category theorem and its consequences (uniform boundedness, open mapping and closed graph theorems), weak convergence in outline, compact operators, the spectral theorem for compact self-adjoint operators, and applications to integral and differential equations.',
  'Functional analysis is the framework for partial differential equations, quantum mechanics, optimization and modern probability, and an analysis qualifying-exam subject.',
  'Proves and applies the main theorems of Banach and Hilbert space theory and uses the spectral theorem for compact operators to solve equations.',
  MIRA,
  [('Normed and Banach spaces', 'Bounded linear operators and dual spaces', 'Prove that supplied spaces are complete and compute operator norms.'),
   ('Hilbert spaces and orthogonal projection', 'Orthonormal bases and Fourier series', "Expand a supplied function in an orthonormal basis and verify Parseval's identity."),
   ('The Riesz representation theorem', 'The Hahn–Banach theorem', 'Use the Hahn–Banach theorem to separate a point from a closed subspace.'),
   ('The Baire category theorem and the uniform boundedness principle', 'The open mapping and closed graph theorems', 'Week 7 midterm; apply the uniform boundedness principle to a supplied family of operators.'),
   ('Weak convergence and reflexivity in outline', 'Compact operators', 'Prove that a supplied integral operator is compact.'),
   ('The spectral theorem for compact self-adjoint operators', 'Applications to integral and differential equations', 'Solve a supplied integral equation with the spectral theorem.')],
  'Qualifying-exam dossier in functional analysis: write complete solutions to twenty exam-style problems, prove the Hahn–Banach, uniform boundedness and open mapping theorems in full, approximate the eigenvalues of a compact integral operator in plain Python by discretization and compare them with the exact values, and write a two-page summary of the main theorems with their hypotheses.')

C('P6', 'Probability theory', 'T', ['P1'], ['C7'],
  'Learn probability on a measure-theoretic foundation: probability spaces and random variables, independence and the Borel–Cantelli lemmas, expectation and modes of convergence, the weak and strong laws of large numbers, characteristic functions and the central limit theorem, conditional expectation, martingales and the optional stopping theorem, martingale convergence, Markov chains, and Brownian motion in outline, with simulation in Python.',
  'Probability is a major field of research and a tool across mathematics, statistics, physics and computer science, and many programs offer it as a qualifying-exam subject.',
  'Proves the limit theorems and martingale results, computes conditional expectations and distributions, and uses simulation to test conjectures.',
  DURRETT,
  [('Probability spaces, random variables and distributions', 'Independence and the Borel–Cantelli lemmas', 'Apply the Borel–Cantelli lemmas to supplied sequences of events.'),
   ('Expectation, inequalities and modes of convergence', 'The weak and strong laws of large numbers', "Prove a weak law with Chebyshev's inequality and check its rate by simulation."),
   ('Characteristic functions', 'The central limit theorem', 'Outline the proof of the central limit theorem and check it by simulation.'),
   ('Conditional expectation', 'Martingales and stopping times', 'Week 7 midterm; compute conditional expectations in supplied examples.'),
   ('The optional stopping theorem', 'Martingale convergence theorems', "Solve a gambler's ruin problem with the optional stopping theorem."),
   ('Markov chains: recurrence, transience and stationary distributions', 'Brownian motion in outline', 'Classify the states of a supplied chain and find its stationary distribution.')],
  'Qualifying-exam dossier in probability: write complete solutions to twenty exam-style problems, prove the strong law of large numbers for variables with finite fourth moments and the optional stopping theorem in full, and test five conjectures by plain-Python simulation (with stated seeds and error bars), explaining which were confirmed and which theorem proves each.',
  elective=True)

C('P7', 'Research apprenticeship and qualifying exams', 'E', ['P1', 'P2'], ['P3', 'P4'],
  'Complete the first milestones of a research career in mathematics: prepare systematically for written and oral qualifying exams in analysis, algebra and topology, read research papers and surveys, choose an advisor and a problem, write and typeset an expository paper on a recent topic, present it, and learn how mathematical research, publishing and careers work.',
  'Qualifying exams test the breadth this curriculum has built, and reading, writing and presenting mathematics are how research begins.',
  'Passes timed mock qualifying exams across the core subjects, writes a clear expository paper on a research topic, and gives a polished talk.',
  ARXIV,
  [('How qualifying exams work and how to prepare', 'Building a reading list and a study plan', "Write a twelve-week study plan for your program's qualifying exams."),
   ('Qualifying exam review: real and complex analysis', 'Qualifying exam review: algebra', 'Take a timed mock exam in analysis and grade it with a rubric.'),
   ('Qualifying exam review: topology and geometry', 'Oral examination practice', 'Take a mock oral exam on a supplied syllabus.'),
   ('Reading a research paper', 'Choosing an advisor and a problem', 'Week 7 midterm; write a one-page summary of a research paper.'),
   ('Writing an expository paper', 'Typesetting, references and preprints', 'Draft an expository paper on a recent topic.'),
   ('Giving a mathematics talk', 'Paths in mathematics: academia, industry and teaching', 'Give a recorded twenty-minute talk on your paper.')],
  'Expository paper and talk: choose a theorem proved in the last fifty years, read the original paper and a survey, write an eight- to twelve-page expository paper in LaTeX that a first-year graduate student could follow, give a recorded twenty-minute talk, and pass a final mock qualifying exam across analysis, algebra and topology.')

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
