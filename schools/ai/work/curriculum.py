"""The AI Learning Foundation curriculum: kindergarten through a college degree in artificial intelligence and
machine learning to graduate study and research. K-12 courses and the computer science core are reused from the
Coding Learning Foundation (same lessons; the college courses are renumbered), with AI-oriented notes.
Writes work/courses_raw.json (writer-facing) and work/meta.json (site-facing extras)."""
import json, copy

ROOT = '/home/claude/ai'
CODE_RAW = {c['code']: c for c in json.load(open('/home/claude/code/work/courses_raw.json'))}

STAGES = [
    ('K', 'Elementary school (K–5)', 'Numbers, reading and writing, science and the world around us, plus first steps in computational thinking and Python, learned with a grown-up close by.'),
    ('J', 'Middle school (6–8)', 'Ratios to algebra, reading and writing, the sciences and history, plus programming in Python and how computers and the internet work.'),
    ('H', 'High school (9–12)', 'Algebra through calculus and statistics, the lab sciences, English and history, plus Python with data and algorithms, and object-oriented programming.'),
    ('C', 'College AI and machine learning degree', 'The computer science core (programming, discrete mathematics, tools, data structures and algorithms), the mathematics of machine learning (calculus, linear algebra, probability, optimization, statistics and information theory), numerical computing and data science, supervised and unsupervised learning, deep learning and its architectures, language, vision, reinforcement learning, causal inference, AI ethics, safety and governance, and machine learning engineering.'),
    ('P', 'Graduate study and research in machine learning', 'Statistical learning theory, probabilistic and generative models, large language models, interpretability and alignment, research methods, and a research apprenticeship with qualifying-exam preparation.'),
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


# ---------------- reused from the Coding Learning Foundation ----------------
# K-12 keep their codes. College courses are renumbered so the degree reads in order: old code -> new code.
RENUMBER = {'C1': 'C1', 'C2': 'C2', 'C3': 'C3', 'C4': 'C4', 'C5': 'C5', 'C14': 'C6', 'C15': 'C7', 'C16': 'C8', 'C18': 'C9', 'C19': 'C10'}
# J1, H11 and H13 use the later corrected versions of the same lessons from the Finance school (see setup notes).
WHY = {
    'K1': 'Counting and number sense are where every computation, and every learning algorithm, begins.',
    'K2': 'Place value and multiplication are the arithmetic that computers and models do billions of times a second.',
    'K3': 'Fractions and decimals prepare you for probabilities, averages and the numbers inside every model.',
    'K4': 'Reading opens every tutorial, manual and paper you will learn from.',
    'K5': 'Clear reading and writing let you explain what a program or a model does.',
    'K6': 'Explaining your reasons in writing is the start of good documentation and research.',
    'K7': 'Noticing patterns in the world is what learning from data is all about.',
    'K8': 'Science teaches you to test ideas against evidence, the core habit of machine learning.',
    'K9': 'Communities and history show how technology changes people\'s lives, a theme of AI ethics.',
    'K10': 'Step-by-step instructions and patterns are the seeds of algorithms and of AI.',
    'K11': 'Python is the main language of AI and machine learning, and you start writing it here.',
    'J1': 'Ratios and rates are the language of probabilities, accuracy scores and error rates.',
    'J2': 'Equations and probability start the reasoning under uncertainty that machine learning depends on.',
    'J3': 'Functions are what models learn: every model maps inputs to outputs.',
    'J4': 'Close reading and clear writing help you learn from documentation and explain your results.',
    'J5': 'Cells, heredity and nervous systems inspired neural networks and are a major field for AI.',
    'J6': 'Matter, energy and electricity explain the hardware that AI runs on.',
    'J7': 'Earth and space science are full of data that AI helps scientists analyze.',
    'J8': 'History shows how new technologies have changed work and society.',
    'J9': 'Variables, decisions, loops and functions are the building blocks of every AI program.',
    'J10': 'Knowing how computers and networks work explains where data comes from and where models run.',
    'H1': 'Algebra and functions are the language in which models and loss functions are written.',
    'H2': 'Distances and shapes become vectors, similarity and decision boundaries in machine learning.',
    'H3': 'Vectors are how machine learning represents data, words and images.',
    'H4': 'Exponentials, logarithms and functions appear in every loss, activation and probability.',
    'H5': 'Derivatives are how models learn: gradient descent follows them downhill.',
    'H6': 'Statistics and probability are the foundation of learning from data.',
    'H7': 'Biology is a leading field for AI, from protein structures to medical images.',
    'H8': 'Chemistry is a growing field for AI, from new materials to drug discovery.',
    'H9': 'Physics trains modeling skills and explains the energy and hardware behind computation.',
    'H10': 'Reading and writing well help you learn quickly and communicate your work.',
    'H11': 'Research and professional writing are the skills behind papers, reports and documentation.',
    'H12': 'Government and law shape how AI is regulated and used.',
    'H13': 'World history shows how technologies spread and change societies around the globe.',
    'H14': 'Data, algorithms and simulations in Python are the daily work of machine learning.',
    'H15': 'Objects and data structures organize the code of every real AI system.',
    'C1': 'Systematic programming is the base of every machine learning project.',
    'C2': 'Logic, proofs, sets and counting underpin algorithms, probability and learning theory.',
    'C3': 'The command line, Git and debugging are how ML engineers and researchers work every day.',
    'C4': 'Arrays, trees, graphs and hash tables organize data for learning algorithms.',
    'C5': 'Algorithm design and analysis tell you what will scale to large data.',
    'C14': 'Gradients of many-variable functions are how every model is trained.',
    'C15': 'Vectors and matrices are the data structures and the mathematics of machine learning.',
    'C16': 'Probability and statistics let you model uncertainty and judge your results.',
    'C18': 'Search, logic, planning and probabilistic reasoning are the classical core of AI.',
    'C19': 'This first survey of machine learning maps the field that the rest of the degree explores in depth.',
}


def remap(codes):
    return [RENUMBER.get(c, c) for c in codes]


for old, why in WHY.items():
    t = copy.deepcopy(CODE_RAW[old])
    new = RENUMBER.get(old, old)
    t['code'] = new
    t['why'] = why
    t['reusedFrom'] = 'code:' + old
    t['elective'] = False
    t['req'], t['soft'] = remap(t['req']), remap(t['soft'])
    t['prerequisites'] = (', '.join(t['req']) if t['req'] else 'None') + ('; helpful: ' + ', '.join(t['soft']) if t['soft'] else '') + '.'
    COURSES.append(t)

# ---------------- new college courses ----------------
C('C11', 'Numerical computing in Python for machine learning', 'P', ['C1', 'C7'], ['C6'],
  'Learn the numerical computing that machine learning is built on, in plain Python: floating-point numbers and rounding error, vectors and matrices as lists, matrix products and their cost, solving linear systems stably, least squares with QR, eigenvectors by power iteration, numerical derivatives and gradient checking, random numbers, sampling and Monte Carlo, reading data files, and how array libraries such as NumPy make the same operations fast.',
  'Every model is arithmetic on vectors and matrices; knowing how that arithmetic works and fails makes you a far better practitioner.',
  'Implements and tests vector and matrix routines, a stable linear solver and a gradient checker, and explains rounding error and the cost of each operation.',
  ('Python for Data Analysis, 3rd edition, by Wes McKinney (free online)', 'https://wesmckinney.com/book/'),
  [('Floating-point numbers and rounding error', 'Vectors as lists: norms, dot products and distances', 'Write a small, tested vector library.'),
   ('Matrices as lists of lists: products and their cost', 'Vectorization: how array libraries such as NumPy work', 'Multiply matrices two ways and count the operations.'),
   ('Solving linear systems: Gaussian elimination with pivoting', 'Conditioning and numerical stability', 'Solve a family of systems and measure how the error grows with the condition number.'),
   ('Least squares with the normal equations and QR', 'Eigenvectors by power iteration', 'Week 7 midterm; fit a line by QR and compare with the normal equations.'),
   ('Numerical derivatives and gradient checking', 'Random numbers, seeds and sampling', 'Check an analytic gradient against finite differences.'),
   ('Monte Carlo estimation and its error', 'Reading data files and preparing arrays', 'Estimate a probability by simulation and report its standard error.')],
  'Mini array library: write a tested Python module of vector and matrix operations (products, transposes, a linear solver with partial pivoting, QR least squares, power iteration and a gradient checker), use it to fit a regression model to a small data set read from a CSV file, and write a short report comparing your results and running times with the same computation in NumPy on your own computer.')

C('C12', 'Optimization for machine learning', 'T', ['C6', 'C7'], ['C11'],
  'Learn the optimization behind training models: gradients, Jacobians and Hessians, the multivariable chain rule, convex sets and functions, gradient descent and step sizes, convergence rates, stochastic gradient descent and mini-batches, momentum and adaptive methods, Newton\'s method, constrained optimization with Lagrange multipliers and the KKT conditions, duality, and the non-convex landscapes of deep learning.',
  'Training a model is solving an optimization problem; this course explains why training works, and why it sometimes fails.',
  'Derives gradients of common losses, proves or refutes convexity, chooses and justifies step sizes, and implements and compares the main optimizers.',
  ('Mathematics for Machine Learning by Deisenroth, Faisal and Ong (free PDF)', 'https://mml-book.github.io/'),
  [('Gradients, Jacobians and Hessians', 'The multivariable chain rule in matrix form', 'Derive the gradients of five common loss functions.'),
   ('Convex sets and convex functions', 'Optimality conditions and why convexity matters', 'Prove or refute the convexity of six functions.'),
   ('Gradient descent and the choice of step size', 'Convergence: smoothness, strong convexity and rates', 'Run gradient descent with three step sizes and explain what happens.'),
   ('Stochastic gradient descent and mini-batches', 'Momentum and Nesterov acceleration', 'Week 7 midterm; compare full-batch and stochastic descent on one problem.'),
   ('Adaptive methods: AdaGrad, RMSProp and Adam', "Newton's method and quasi-Newton methods", 'Implement Adam and Newton steps on a test function.'),
   ('Constrained optimization: Lagrange multipliers and the KKT conditions', 'Duality, and non-convex optimization: saddle points and local minima', 'Solve a constrained problem with Lagrange multipliers and check it numerically.')],
  "Optimizer study: implement gradient descent, stochastic gradient descent with momentum, Adam and Newton's method in plain Python, run them on a convex quadratic, a logistic regression problem and Rosenbrock's function, and write a report with convergence tables, the step sizes you tried, and an explanation of each result in terms of the theory.")

C('C13', 'Probability, statistics and information theory for machine learning', 'T', ['C8', 'C6'], ['C7'],
  'Learn the probabilistic toolkit of machine learning: joint, marginal and conditional distributions in several variables, covariance and the multivariate Gaussian, maximum likelihood and maximum a posteriori estimation, Bayesian inference with conjugate priors, sampling methods including importance sampling and Markov chain Monte Carlo, entropy, cross-entropy, KL divergence and mutual information, and the statistics of comparing models: bootstrap intervals and paired tests.',
  'Loss functions, regularizers and evaluations are all statements about probability; this course makes them precise.',
  'Derives maximum-likelihood and Bayesian estimates, computes entropies and divergences and links them to losses, and reports model comparisons with honest uncertainty.',
  ('Information Theory, Inference, and Learning Algorithms by David MacKay (free PDF)', 'https://www.inference.org.uk/itila/book.html'),
  [('Joint, marginal and conditional distributions', 'Expectation, covariance and the multivariate Gaussian', 'Compute marginals and conditionals of a small joint table and of a two-dimensional Gaussian.'),
   ('Maximum likelihood estimation', 'Maximum a posteriori estimation and regularization', 'Derive the maximum-likelihood and MAP estimates for three models.'),
   ('Bayesian inference with conjugate priors', 'Predictive distributions and model comparison', 'Update a Beta prior with data and report the posterior predictive probability.'),
   ('Monte Carlo and importance sampling', 'Markov chain Monte Carlo: the Metropolis algorithm', 'Week 7 midterm; estimate an expectation by importance sampling.'),
   ('Entropy and cross-entropy', 'KL divergence and mutual information', 'Compute entropies and divergences and connect them to loss functions.'),
   ('The bootstrap and confidence intervals for model performance', 'Comparing models: paired tests and multiple comparisons', 'Report a bootstrap interval for the accuracy of a classifier.')],
  'Bayesian A/B analysis: for a supplied data set of outcomes from two model variants, compute maximum-likelihood and Bayesian estimates with Beta priors, simulate the posterior to estimate the probability that one variant is better, compute a bootstrap interval for the difference, and write a two-page report explaining the results and the assumptions behind them.')

C('C14', 'Data science: wrangling, exploration and visualization', 'P', ['C1', 'C8'], ['C3'],
  'Work with data from start to finish in Python: reading CSV and JSON data, cleaning missing and inconsistent values, filtering, grouping, joining and reshaping tables, summary statistics and distributions, exploratory analysis, choosing and describing charts, feature engineering, sampling bias and data leakage, documenting data sets, and handling personal data responsibly.',
  'Most of the work in machine learning is getting the data right; models are only as good as the data they learn from.',
  'Loads, cleans, joins and summarizes real tables with tested functions, spots leakage and sampling bias, and documents a data set with a datasheet.',
  ('Computational and Inferential Thinking: The Foundations of Data Science (free online)', 'https://inferentialthinking.com/'),
  [('The data science workflow and tabular data', 'Reading CSV and JSON files into Python structures', 'Load three small data files and report their shape and types.'),
   ('Cleaning data: missing values, types and inconsistencies', 'Filtering, sorting and grouping', 'Clean a messy table with reusable functions.'),
   ('Joining and reshaping tables', 'Summary statistics and distributions', 'Join two tables and summarize a variable by group.'),
   ('Exploratory data analysis', 'Visualization: choosing and reading charts', 'Week 7 midterm; describe the charts you would make for a data set and why.'),
   ('Feature engineering: scaling, encoding and derived features', 'Sampling bias, data leakage and train-test contamination', 'Engineer features for a prediction task and check for leakage.'),
   ('Documenting data: datasheets and data dictionaries', 'Privacy and the responsible use of personal data', 'Write a datasheet for a data set you cleaned.')],
  'Data analysis report: take a supplied raw data set, clean it with documented functions, explore it with summary tables and charts you make with any plotting tool on your own computer, engineer features for one prediction question, and write a report with a data dictionary, a datasheet, the main findings and the limitations of the data.')

C('C15', 'Supervised learning in depth', 'P', ['C10', 'C12'], ['C13'],
  'Build the main supervised learning methods from scratch and learn when each works: linear regression by the normal equations and gradient descent, ridge and lasso regularization, logistic and softmax regression, support vector machines and the kernel trick, decision trees, bagging and random forests, gradient boosting, probability calibration, evaluation on imbalanced data, and model selection with cross-validation and hyperparameter search.',
  'Supervised learning is the workhorse of applied machine learning, and building the methods yourself shows what each one assumes.',
  'Implements regression, classification, tree and ensemble methods from scratch, evaluates them correctly on imbalanced data, and chooses a model by cross-validation with a clear justification.',
  ('The Elements of Statistical Learning by Hastie, Tibshirani and Friedman (free PDF)', 'https://hastie.su.domains/ElemStatLearn/'),
  [('Linear regression in depth: normal equations, gradient descent and diagnostics', 'Regularization: ridge and lasso', 'Fit ridge regression for a range of penalties and tabulate the coefficient paths.'),
   ('Logistic regression and maximum likelihood', 'Softmax regression for many classes', 'Train logistic regression from scratch and check its gradient.'),
   ('Support vector machines and the margin', 'Kernels and the kernel trick', 'Compute kernel matrices and classify points with a kernel method.'),
   ('Decision trees: splitting criteria and pruning', 'Bagging and random forests', 'Week 7 midterm; grow a small decision tree by hand and in code.'),
   ('Gradient boosting', 'Calibration and probabilistic predictions', 'Boost decision stumps and measure calibration.'),
   ('Evaluation on imbalanced data: precision, recall, ROC and PR curves', 'Model selection: cross-validation and hyperparameter search', 'Choose a model by cross-validation and report its test performance.')],
  'Model comparison study: implement logistic regression, a decision tree, a random forest and gradient-boosted stumps from scratch in plain Python, compare them on a supplied tabular classification data set with cross-validation, report accuracy, precision, recall, ROC AUC and calibration, and explain which model you would deploy and why.')

C('C16', 'Unsupervised learning and probabilistic models', 'P', ['C10', 'C13'], ['C11'],
  'Find structure in unlabeled data: k-means and its initialization, hierarchical and density-based clustering, Gaussian mixture models and the EM algorithm, principal component analysis by the SVD, low-dimensional embeddings, matrix factorization for recommender systems, anomaly detection, hidden Markov models with the forward and Viterbi algorithms, and an introduction to probabilistic graphical models.',
  'Most data has no labels; unsupervised methods find the structure that later models and analyses build on.',
  'Implements clustering, EM, PCA and HMM algorithms from scratch, chooses among them with stated criteria, and interprets their output with care.',
  ('Probabilistic Machine Learning: An Introduction by Kevin Murphy (free PDF)', 'https://probml.github.io/pml-book/book1.html'),
  [('Clustering with k-means and k-means++', 'Hierarchical and density-based clustering', 'Cluster a small data set three ways and compare the results.'),
   ('Gaussian mixture models', 'The EM algorithm', 'Run two iterations of EM by hand on a one-dimensional mixture.'),
   ('Principal component analysis and the SVD', 'Embeddings for visualization: MDS, t-SNE and UMAP', 'Compute the principal components of a small data set.'),
   ('Matrix factorization and recommender systems', 'Anomaly detection', 'Week 7 midterm; factorize a small ratings matrix by alternating least squares.'),
   ('Hidden Markov models and the forward algorithm', 'Decoding with the Viterbi algorithm', 'Decode the most likely hidden state sequence for a small HMM.'),
   ('Probabilistic graphical models: Bayesian networks and Markov random fields', 'Evaluating unsupervised learning', 'Answer a query in a small Bayesian network by enumeration.')],
  'Segmentation and anomaly report: on a supplied unlabeled data set, standardize the features, run k-means and a Gaussian mixture model, choose the number of clusters with a stated criterion, project the data with PCA, flag anomalies, and write a report that interprets each cluster and states what the methods cannot tell you.')

C('C17', 'Deep learning foundations', 'P', ['C10', 'C12'], ['C11'],
  'Understand and build neural networks from the ground up: neurons and multilayer perceptrons, loss functions, backpropagation as reverse-mode automatic differentiation (by writing a tiny autograd engine), training loops, initialization, optimizers in practice, regularization with weight decay, dropout and early stopping, normalization layers, training diagnostics, residual connections, and how frameworks such as PyTorch organize the same ideas.',
  'Deep learning drives modern AI; building it from scratch once makes every framework and paper easier to understand.',
  'Builds and trains a small neural network with a hand-written autograd engine, checks gradients numerically, and diagnoses failed training runs from their learning curves.',
  ('Understanding Deep Learning by Simon Prince (free PDF)', 'https://udlbook.github.io/udlbook/'),
  [('Neurons, activation functions and the multilayer perceptron', 'Loss functions: squared error and cross-entropy', 'Compute a forward pass and the loss of a small network by hand.'),
   ('Computational graphs and the chain rule', 'Backpropagation as reverse-mode automatic differentiation', 'Build a scalar autograd engine and check it against finite differences.'),
   ('Training a network: mini-batches, epochs and learning rates', 'Initialization: why scale matters', 'Train a small network on a toy classification task from scratch.'),
   ('Optimizers in practice: momentum and Adam', 'Regularization: weight decay, dropout and early stopping', 'Week 7 midterm; compare training with and without regularization.'),
   ('Normalization: batch normalization and layer normalization', 'Training diagnostics: learning curves, vanishing and exploding gradients', 'Diagnose three failed training runs from their learning curves.'),
   ('Residual connections and very deep networks', 'Deep learning frameworks: tensors, modules and automatic differentiation', 'Describe how your from-scratch network maps onto a framework.')],
  'Neural network from scratch: extend your autograd engine into a small neural network library (layers, losses, an optimizer and a training loop), train a multilayer perceptron on a supplied classification data set, run an ablation of initialization, learning rate and regularization, and write a report with learning curves as tables and what each experiment shows.')

C('C18', 'Deep learning architectures: convolution, recurrence and attention', 'P', ['C17'], ['C11'],
  'Learn the architectures behind modern deep learning: convolution and pooling, convolutional networks from LeNet to ResNet, recurrent networks, LSTMs and GRUs, sequence-to-sequence models, attention, the transformer, embeddings and positional encodings, graph neural networks, self-supervised and contrastive learning, and transfer learning and fine-tuning.',
  'Architectures encode what a network assumes about its data; the transformer, in particular, underlies today\'s language and vision models.',
  'Computes convolutions, recurrent steps and attention by hand and in code, traces a transformer block, and justifies an architecture choice for a new problem.',
  ('Dive into Deep Learning (free online)', 'https://d2l.ai/'),
  [('Convolution and pooling', 'Convolutional networks: from LeNet to ResNet', 'Compute convolutions and output shapes for a small network by hand and in code.'),
   ('Recurrent networks and backpropagation through time', 'LSTMs and GRUs', 'Run a recurrent cell over a short sequence by hand.'),
   ('Sequence-to-sequence models', 'Attention', 'Compute attention weights and outputs for a small set of queries and keys.'),
   ('The transformer: self-attention, multiple heads and feed-forward blocks', 'Embeddings and positional encodings', 'Week 7 midterm; trace one transformer block on a tiny input.'),
   ('Graph neural networks and message passing', 'Self-supervised and contrastive learning', 'Run one round of message passing on a small graph.'),
   ('Transfer learning and fine-tuning', 'Choosing an architecture for a problem', 'Write a design memo choosing an architecture for three tasks.')],
  'Tiny transformer: implement scaled dot-product attention, multi-head attention, a transformer block with layer normalization and positional encodings, train a very small model on a supplied character-level toy task (such as reversing short strings) with plain Python or any framework on your own computer, and write a report on what the attention weights show and how accuracy changes with model size.')

C('C19', 'Natural language processing', 'P', ['C18', 'C13'], [],
  'Learn how computers process human language: text normalization and tokenization including byte-pair encoding, n-gram language models and smoothing, perplexity, word embeddings, text classification with naive Bayes and logistic regression, sequence labeling, neural language models and transformers for language, pretraining objectives, decoding strategies, evaluation with automatic metrics and human judgment, and bias, multilinguality and the limits of language technology.',
  'Language is where AI meets people most directly, and modern language models grew out of the ideas in this course.',
  'Builds a tokenizer, a smoothed language model and a text classifier, implements decoding strategies, and evaluates generated text with suitable metrics and an eye for bias.',
  ('Speech and Language Processing by Jurafsky and Martin, 3rd edition draft (free)', 'https://web.stanford.edu/~jurafsky/slp3/'),
  [('Text normalization and tokenization', 'Byte-pair encoding and subword tokenization', 'Train a byte-pair encoder on a small corpus by hand and in code.'),
   ('N-gram language models and smoothing', 'Perplexity and evaluating language models', 'Build a bigram model with add-one smoothing and compute its perplexity.'),
   ('Word embeddings: co-occurrence, PMI and word2vec', 'Text classification with naive Bayes and logistic regression', 'Compute cosine similarities and classify short texts.'),
   ('Sequence labeling: part-of-speech tagging and named entities', 'Neural language models and transformers for language', 'Week 7 midterm; tag a sentence with a Viterbi decoder.'),
   ('Pretraining objectives: masked and causal language modeling', 'Decoding: greedy search, beam search and sampling', 'Implement greedy, beam and top-k decoding on a toy model.'),
   ('Evaluating generated text: BLEU, ROUGE and human judgment', 'Bias, multilinguality and the limits of language technology', "Audit a small model's outputs for one kind of bias.")],
  'Language model and classifier: build a byte-pair tokenizer and a smoothed n-gram language model on a supplied public-domain text, generate text with two decoding strategies, train a naive Bayes classifier on a supplied labeled set of short texts, and write a report with perplexities, sample outputs, error analysis and a section on limitations.')

C('C20', 'Computer vision', 'P', ['C18'], ['C11'],
  'Learn how machines see: images as arrays and color spaces, filtering and edge detection, features, convolutional networks for image classification, data augmentation, object detection with bounding boxes, intersection over union and non-maximum suppression, semantic and instance segmentation, vision transformers and self-supervised vision, image generation in brief, cameras and 3-D vision basics, and the robustness, bias and responsible use of vision systems.',
  'Vision systems read medical scans, guide robots and sort the world\'s images; their methods shaped deep learning itself.',
  'Implements filtering, edge detection, IoU and non-maximum suppression, explains how detectors and segmenters work, and evaluates a vision model across subgroups.',
  ('Computer Vision: Algorithms and Applications, 2nd edition, by Richard Szeliski (free PDF)', 'https://szeliski.org/Book/'),
  [('Images as arrays: pixels, channels and color spaces', 'Filtering: blurring, sharpening and convolution', 'Apply filters to a small grayscale image by hand and in code.'),
   ('Edges, corners and features', 'Image classification with convolutional networks', 'Detect edges in a small image with Sobel filters.'),
   ('Data augmentation and training vision models', 'Object detection: bounding boxes and intersection over union', 'Compute IoU for pairs of boxes.'),
   ('Non-maximum suppression and detection metrics', 'Segmentation: semantic and instance', 'Week 7 midterm; run non-maximum suppression on a list of detections.'),
   ('Vision transformers and self-supervised learning', 'Image generation in brief', 'Split an image into patches and compute patch embeddings.'),
   ('Cameras, geometry and 3-D vision basics', 'Robustness, bias and the responsible use of vision systems', "Evaluate a model's accuracy across subgroups of a test set.")],
  'Shape detector: implement filtering, edge detection, a simple sliding-window or connected-component detector and non-maximum suppression in plain Python for supplied small grayscale images given as grids of numbers, evaluate it with IoU, precision and recall, and write a report on its failures and how a convolutional network would address them.')

C('C21', 'Reinforcement learning', 'P', ['C9', 'C17', 'C13'], [],
  'Learn how agents learn from reward: multi-armed bandits and exploration, Markov decision processes and the Bellman equations, dynamic programming with policy and value iteration, Monte Carlo and temporal-difference learning, Q-learning and SARSA, function approximation and deep Q-networks, policy gradients and actor-critic methods, model-based reinforcement learning and planning, and the safety problems of reward-driven systems.',
  'Reinforcement learning trains game-playing systems, controls robots and is used to fine-tune language models from human feedback.',
  'Solves small MDPs by dynamic programming, implements bandit, Monte Carlo, TD and Q-learning agents, derives the policy gradient, and explains how a badly specified reward goes wrong.',
  ('Reinforcement Learning: An Introduction, 2nd edition, by Sutton and Barto (free PDF)', 'http://incompleteideas.net/book/the-book-2nd.html'),
  [('Multi-armed bandits: exploration and exploitation', 'Upper confidence bounds and Thompson sampling', 'Run epsilon-greedy and UCB on a simulated bandit and compare their regret.'),
   ('Markov decision processes and returns', 'The Bellman equations', 'Write the Bellman equations for a small MDP and solve them.'),
   ('Dynamic programming: policy evaluation and policy iteration', 'Value iteration', 'Run value iteration on a gridworld.'),
   ('Monte Carlo methods', 'Temporal-difference learning', 'Week 7 midterm; compare Monte Carlo and TD estimates on a random walk.'),
   ('Q-learning and SARSA', 'Function approximation and deep Q-networks', 'Train a Q-learning agent on a small grid with hazards.'),
   ('Policy gradients and actor-critic methods', 'Model-based reinforcement learning, planning and the safety problems of reward', 'Derive the REINFORCE update and run it on a bandit.')],
  'Gridworld agents: implement value iteration, Monte Carlo control, SARSA and Q-learning in plain Python for a supplied gridworld with hazards, compare their learned policies and learning curves (as tables), test how each handles a change in the reward, and write a report that includes one example of an agent exploiting a badly specified reward.')

C('C22', 'Causal inference and experimentation', 'T', ['C13'], ['C14'],
  'Learn to answer cause-and-effect questions with data: potential outcomes and causal effects, randomized experiments and A/B tests, power and sample size, causal graphs, d-separation and the backdoor criterion, confounding and adjustment, propensity scores, matching and weighting, instrumental variables, difference-in-differences and regression discontinuity, heterogeneous effects, and how causal reasoning improves machine learning models and evaluations.',
  'Prediction is not explanation: decisions need causal answers, and models that learn shortcuts fail when the world changes.',
  'Designs a sound experiment with enough power, reads causal graphs to choose adjustment sets, estimates effects with several methods, and states their assumptions plainly.',
  ('Causal Inference: What If by Hernán and Robins (free PDF)', 'https://miguelhernan.org/whatifbook'),
  [('Correlation, causation and potential outcomes', 'Average treatment effects and the fundamental problem of causal inference', 'Compute effects from a table of potential outcomes.'),
   ('Randomized experiments and A/B tests', 'Power, sample size and experiment pitfalls', 'Compute the sample size for an A/B test.'),
   ('Causal graphs and d-separation', 'Confounding and the backdoor criterion', 'Find valid adjustment sets in four causal graphs.'),
   ('Adjustment, stratification and regression', 'Propensity scores, matching and weighting', 'Week 7 midterm; estimate an effect by inverse probability weighting.'),
   ('Instrumental variables', 'Difference-in-differences and regression discontinuity', 'Compute a difference-in-differences estimate.'),
   ('Heterogeneous effects and uplift modeling', 'Causality in machine learning: shortcuts, distribution shift and fairness', 'Explain a shortcut a classifier learned using a causal graph.')],
  'Causal analysis memo: for a supplied observational data set about a treatment and an outcome, draw and defend a causal graph, choose an adjustment set, estimate the effect by stratification and by inverse probability weighting, run one sensitivity check, and write a memo for a decision maker that states the estimate, its assumptions and what a randomized experiment would add.')

C('C23', 'AI ethics, safety and governance', 'W', ['C10'], ['C9'],
  'Think clearly about the ethical, safety and policy questions raised by AI: ethical frameworks applied to AI, fairness definitions and the impossibility results, privacy and differential privacy, transparency and explanation, accountability and documentation, safety problems such as specification gaming, robustness failures and misuse, effects on work, information and the environment, the debate about risks from advanced AI, and how AI is governed in law and practice, with the main views on contested questions presented fairly.',
  'Building AI responsibly is part of building it well, and practitioners increasingly answer to laws, standards and the public.',
  'Computes fairness metrics and differential-privacy noise, writes a model card, analyzes a system with ethical frameworks and current law, and states opposing views on AI risk fairly.',
  ('Introduction to AI Safety, Ethics, and Society by Dan Hendrycks (free online)', 'https://www.aisafetybook.com/'),
  [('Ethical frameworks for AI decisions', 'Harms, stakeholders and who decides', 'Analyze a deployed system with two ethical frameworks.'),
   ('Fairness: definitions and measurements', 'Impossibility results and trade-offs', "Compute three fairness metrics for a classifier's predictions."),
   ('Privacy and differential privacy', 'Transparency, explanation and contestability', 'Add Laplace noise to a count and explain the privacy guarantee.'),
   ('Accountability: documentation, audits and model cards', 'Safety problems: specification gaming, robustness and misuse', 'Week 7 midterm; write a model card for a classifier.'),
   ('AI, work, information and the environment', 'The debate about risks from advanced AI', 'Write the strongest case for two opposing positions on AI risk.'),
   ('Governing AI: laws, standards and institutions', 'Professional responsibility for AI practitioners', "Map a system's obligations under one AI law.")],
  'Impact assessment: for a supplied AI system description (such as a hiring screener or a hospital triage model), identify stakeholders and harms, compute fairness metrics on supplied prediction data, propose a privacy approach, write a model card, assess the system against one current legal framework, and write a recommendation with the strongest objection to it and your reply.')

C('C24', 'Machine learning engineering and MLOps', 'P', ['C3', 'C15'], ['C14'],
  'Learn to turn models into reliable systems: framing problems and choosing metrics, data pipelines and validation, reproducible experiments, testing machine learning code, training at scale with accelerators, mixed precision and distributed training, efficient models through quantization, pruning and distillation, deployment for batch and online prediction, monitoring and drift detection, experiments with models in production, and cost, energy, documentation and incident response.',
  'A model creates value only when it runs reliably in the real world; most machine learning jobs are about exactly this.',
  'Writes validated pipelines, tests and reproducible training code, estimates compute and memory, quantizes a model, monitors drift, and writes a deployment plan and a postmortem.',
  ('Made With ML by Goku Mohandas (free online course)', 'https://madewithml.com/'),
  [('Framing ML problems: objectives, metrics and baselines', 'Data pipelines and data validation', 'Write a data validation function for a training pipeline.'),
   ('Reproducible experiments: seeds, versions and tracking', 'Testing machine learning code', 'Write tests for a feature transformation and a model wrapper.'),
   ('Training at scale: accelerators, memory and mixed precision', 'Distributed training: data and model parallelism', 'Estimate the memory and compute needed to train a model.'),
   ('Efficient models: quantization, pruning and distillation', 'Deployment: batch and online serving, latency and throughput', 'Week 7 midterm; quantize weights to 8 bits and measure the error.'),
   ('Monitoring models in production', 'Detecting data drift and concept drift', 'Implement a drift check with the population stability index.'),
   ('Experiments in production: shadow tests, canaries and A/B tests', 'Cost, energy, documentation and incident response', 'Write a postmortem for a model failure.')],
  'Production-ready model package: take a model you built in an earlier course, wrap it in a tested Python package with a data validation step, a reproducible training script with fixed seeds and logged settings, a batch prediction function, a drift monitor and a model card, and write a deployment and monitoring plan with the alerts you would set.')

# ---------------- graduate study and research ----------------
C('P1', 'Statistical learning theory', 'T', ['C12', 'C13', 'C2'], ['C15'],
  'Learn the mathematics of why learning works: the statistical learning framework and empirical risk minimization, PAC learning, finite hypothesis classes, the VC dimension and Sauer\'s lemma, the fundamental theorem of PAC learning, Rademacher complexity, the bias–complexity trade-off and the no-free-lunch theorem, regularization and stability, margins and the theory of support vector machines, boosting, online learning and regret, and current puzzles about generalization in deep learning.',
  'Learning theory says when and why learning from data is possible, and it frames many open questions about deep learning.',
  'States and proves the core results (sample complexity for finite classes, VC bounds, Rademacher bounds, the multiplicative-weights regret bound) and explains what they do and do not say about practice.',
  ('Understanding Machine Learning: From Theory to Algorithms by Shalev-Shwartz and Ben-David (free PDF)', 'https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/'),
  [('The learning problem and empirical risk minimization', 'PAC learning and finite hypothesis classes', 'Prove a sample complexity bound for a finite class.'),
   ('The VC dimension', "Sauer's lemma and the fundamental theorem of PAC learning", 'Compute the VC dimension of four hypothesis classes.'),
   ('Rademacher complexity and uniform convergence', 'The bias–complexity trade-off and the no-free-lunch theorem', 'Bound the Rademacher complexity of a linear class.'),
   ('Regularization, stability and generalization', 'Margins and the theory of support vector machines', 'Week 7 midterm; derive a margin-based bound.'),
   ('Boosting and its analysis', 'Online learning: experts, regret and multiplicative weights', 'Prove the regret bound of the multiplicative weights algorithm.'),
   ('Generalization in deep learning: overparameterization and double descent', 'Open problems and how to read learning theory papers', 'Outline a short talk presenting a learning theory result.')],
  'Theory write-up: choose one result from the course (such as the fundamental theorem of PAC learning, a Rademacher bound for linear classes, or the regret bound of multiplicative weights), write a complete, self-contained proof with all lemmas, run a small simulation that compares the bound with observed behavior, and explain in two pages what the bound does and does not explain about practice.')

C('P2', 'Probabilistic machine learning and generative models', 'T', ['C13', 'C18'], ['C16'],
  'Learn the probabilistic view of machine learning and the generative models built on it: Bayesian linear regression and Gaussian processes, variational inference and the evidence lower bound, variational autoencoders, autoregressive models, normalizing flows, generative adversarial networks, diffusion and score-based models, energy-based models, evaluating generative models, and the uses and risks of generated media.',
  'Generative models create images, audio and text; their probabilistic foundations explain both their power and their failures.',
  'Derives and computes Gaussian-process posteriors, ELBOs, change-of-variables densities and diffusion steps, and compares generative models with suitable metrics.',
  ('Probabilistic Machine Learning: Advanced Topics by Kevin Murphy (free PDF)', 'https://probml.github.io/pml-book/book2.html'),
  [('Bayesian linear regression', 'Gaussian processes', 'Compute a Gaussian process posterior from a few observations.'),
   ('Variational inference and the evidence lower bound', 'Variational autoencoders', 'Derive the ELBO and compute it for a small example.'),
   ('Autoregressive models', 'Normalizing flows and the change-of-variables formula', 'Compute the density of a transformed random variable.'),
   ('Generative adversarial networks', 'Diffusion models: the forward and reverse processes', 'Week 7 midterm; simulate a forward diffusion process.'),
   ('Score matching and score-based models', 'Energy-based models', 'Compute the score function of a Gaussian mixture.'),
   ('Evaluating generative models', 'Generated media: uses, risks and provenance', 'Compare two evaluation metrics on supplied samples.')],
  'Generative model study: implement a one- or two-dimensional generative model of your choice (a Gaussian mixture fitted by EM, a simple flow, or a toy diffusion model) for a supplied data set, compare its samples with the data using two metrics, and write a short paper-style report with method, results, limitations and a statement on responsible use.')

C('P3', 'Large language models', 'T', ['C19'], ['C24', 'P2'],
  'Understand large language models from the inside: the transformer language model in detail, tokenization, pretraining data and objectives, scaling laws and compute-optimal training, emergent abilities and the debate about them, fine-tuning and instruction tuning, learning from human feedback and preference optimization, in-context learning and prompting, retrieval-augmented generation, tool use and agents, efficient inference, evaluation and benchmark contamination, and open problems such as hallucination.',
  'Large language models are the most visible AI systems today; understanding how they are built and evaluated is essential for research and responsible use.',
  'Counts parameters and compute, applies a scaling law, computes preference-learning losses, designs retrieval and evaluation setups, and explains the limits of current models with evidence.',
  ('Stanford CS336: Language Modeling from Scratch (free lectures and assignments)', 'https://cs336.stanford.edu/'),
  [('The transformer language model in detail', 'Tokenization and pretraining data', 'Count the parameters of a transformer from its configuration.'),
   ('Pretraining objectives and training dynamics', 'Scaling laws and compute-optimal training', 'Use a scaling law to choose a model size for a compute budget.'),
   ('Emergent abilities and the debate about them', 'Fine-tuning and instruction tuning', 'Explain how the choice of metric can make an ability look sudden.'),
   ('Learning from human feedback: reward models and RLHF', 'Preference optimization without reinforcement learning: DPO and related methods', 'Week 7 midterm; compute a reward-model loss on preference pairs.'),
   ('In-context learning, prompting and retrieval-augmented generation', 'Tool use and agents', 'Design and evaluate a retrieval step for a question-answering system.'),
   ('Efficient inference: caching, quantization and decoding', 'Evaluation, contamination, hallucination and open problems', 'Design an evaluation for a capability and check it for contamination.')],
  'Small language model study: train a small character- or word-level transformer language model on a supplied public-domain text with any framework on your own computer, measure loss against model size or data size and fit a simple scaling curve, implement two decoding methods, and write a short paper with your measurements, sample outputs and a discussion of what the results do and do not show about larger models.')

C('P4', 'Interpretability and AI alignment', 'T', ['C17', 'C23'], ['P3'],
  'Learn the research fields that try to understand what models compute and to make them reliably do what people intend: feature attribution, probing and its pitfalls, mechanistic interpretability (features, circuits, induction heads, superposition and sparse dictionary learning), adversarial robustness, the alignment problem (specification gaming, reward hacking and goal misgeneralization), learning from human feedback and its limits, scalable oversight, evaluations and red-teaming, and the governance of advanced AI, with open problems and disagreements among researchers presented fairly.',
  'As AI systems grow more capable, understanding and steering them becomes one of the central open problems of the field.',
  'Computes attributions and adversarial perturbations for small models, explains the main interpretability and alignment results and their limits, and writes a focused research proposal.',
  ('Interpretable Machine Learning by Christoph Molnar (free online)', 'https://christophm.github.io/interpretable-ml-book/'),
  [('Why interpretability: questions and methods', 'Feature attribution: gradients, integrated gradients and Shapley values', 'Compute attributions for a small model by hand and in code.'),
   ('Probing representations and its pitfalls', 'Mechanistic interpretability: features and circuits', 'Train a linear probe on supplied activations.'),
   ('Induction heads and in-context learning', 'Superposition and sparse dictionary learning', 'Analyze a toy model in which features share dimensions.'),
   ('Adversarial examples and robustness', 'The alignment problem: specification gaming, reward hacking and goal misgeneralization', 'Week 7 midterm; craft an adversarial perturbation for a linear classifier.'),
   ('Learning from human feedback and its limits', 'Scalable oversight: debate, recursive reward modeling and AI feedback', 'Analyze a failure of a learned reward model.'),
   ('Evaluations, red-teaming and dangerous-capability testing', 'Governance of advanced AI and open research problems', 'Write a research proposal on one open problem.')],
  'Interpretability or alignment mini-project: choose one supplied option (find a circuit in a small network whose weights are supplied, train a sparse autoencoder on supplied activations, or demonstrate reward hacking in a small supplied reinforcement learning environment), run the experiment, and write a workshop-style paper with a clear claim, evidence, limitations and the strongest alternative explanation of your results.')

C('P5', 'Research methods in machine learning', 'E', ['C17'], ['C22', 'C13'],
  'Learn how machine learning research is done well: reading papers efficiently, finding and sharpening a research question, related work, experimental design with strong baselines, ablations and multiple seeds, the statistics of results, compute budgets, reproducibility and open science, benchmarks and their limits, writing and presenting a paper, peer review, and research ethics including dual use, with a realistic picture of research careers.',
  'Good research habits separate real progress from noise, and they are learnable.',
  'Critiques a paper, designs experiments with baselines, ablations and seeds, reports results with honest statistics, writes a referee report, and plans a reproducible project.',
  ('Patterns, Predictions, and Actions by Hardt and Recht (free online)', 'https://mlstory.org/'),
  [('How to read a machine learning paper', 'Finding and sharpening a research question', 'Write a one-page summary and critique of a paper.'),
   ('Related work and positioning a contribution', 'Experimental design: baselines, ablations and controls', 'Design the experiments for a stated hypothesis.'),
   ('Seeds, variance and the statistics of results', 'Compute budgets and efficient experimentation', 'Analyze supplied results from multiple seeds and report them correctly.'),
   ('Reproducibility and open science', 'Benchmarks, datasets and their limits', 'Week 7 midterm; audit a paper with a reproducibility checklist.'),
   ('Writing a paper: structure, figures and claims', 'Peer review: reviewing and responding to reviews', 'Write a referee report on a supplied short paper.'),
   ('Research ethics: dual use, data and impact statements', 'Presenting research, and research careers', 'Give a recorded ten-minute talk on a paper.')],
  'Research proposal: write a six-page proposal on a machine learning question you could study with modest compute, with related work, a hypothesis, an experimental plan with baselines, ablations, seeds and statistics, a compute and timeline estimate, a reproducibility plan and an ethics statement, then write a referee-style critique of your own proposal.')

C('P6', 'Research apprenticeship and qualifying exams', 'E', ['P5'], ['P1', 'P3'],
  'Complete the first milestones of a research career in machine learning: reproduce a published result and extend it, write it up as a workshop paper and present it, prepare for qualifying exams that span theory, methods and applications, and choose a thesis direction and plan the next steps toward a PhD or a research role.',
  'Reproducing and extending a result is how most researchers begin, and qualifying exams test the breadth this curriculum has built.',
  'Delivers an honest reproduction-and-extension paper with released code, answers timed qualifying questions across the field, and writes a credible research statement.',
  ('OpenReview: public peer reviews of machine learning papers (free)', 'https://openreview.net/'),
  [('Choosing a paper to reproduce', 'Planning a reproduction: scope, compute and success criteria', 'Write a reproduction plan.'),
   ('Running the reproduction', 'When results do not match: debugging and honest reporting', 'Report your first results with their uncertainty.'),
   ('Extending a result: ablations and new settings', 'Writing a workshop paper', "Draft the paper's method and results sections."),
   ('Qualifying exam review: theory and optimization', 'Qualifying exam review: models and methods', 'Week 7 midterm; answer timed questions on theory and methods.'),
   ('Qualifying exam review: applications and responsible AI', 'Oral examination practice', 'Take a mock oral exam on your reading list.'),
   ('Choosing a thesis direction and an advisor', 'Paths in research: PhD programs, industry labs and independent research', 'Write a one-page research statement.')],
  'Reproduction paper: reproduce one result from a published machine learning paper with modest compute, extend it with one ablation or new setting, write a four- to six-page workshop-style paper that reports honestly what did and did not reproduce, release your code with instructions, and pass a mock qualifying exam of three timed answers.')

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
