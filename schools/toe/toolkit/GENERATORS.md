# Practice generators for the ToE Learning Foundation

Write `/home/claude/toe/src/generators.js`: randomized problem generators that give unlimited fresh practice for the first courses of a self-study mathematics curriculum (Khan Academy style). Every answer is computed in code, so generated problems are always correct.

## Interface

```js
(function (root) {
  'use strict';
  const G = {};                        // key -> generator
  G['F1-03'] = function (r) { ... return item; };
  ...
  const api = { generators: G, has: (k) => !!G[k], make: (k, seed) => ... };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ToEGen = api;
})(typeof window !== 'undefined' ? window : this);
```

`make(key, seed)` builds a seeded PRNG (e.g. mulberry32), calls the generator with a small helper object `r` (`r.int(a, b)` inclusive, `r.pick(arr)`, `r.nonzero(a, b)`, `r.sign()`, `r.shuffle(arr)`, `r.rand()`), and returns the item with `gen: key` and `seed` added. A generator may pick among several sub-templates so practice feels varied.

An item has exactly the shape the site already grades (see `/home/claude/toe/src/checker.js`, function `grade`):

```js
{ type: 'num' | 'expr' | 'list' | 'tuple' | 'mc',
  prompt: 'Solve for $x$: $3x + 5 = 20$.',          // markdown + TeX in $...$
  answer: '5',                                       // canonical answer in calculator syntax (string); mc: index of correct choice
  choices: ['$x < 2$', ...],                         // mc only; 3-5 choices; no "all/none of the above"
  vars: ['x'],                                       // expr (and list/tuple with variables)
  tol: '0.005' | '1%', form: 'expanded' | 'factored', const: true, domain: 'x: 3..6', unit: 'cm', lead: '$x =$',
  hints: ['...', '...'],                             // 2-3 progressive hints that use THIS instance's numbers
  solution: '...' }                                  // full worked solution with this instance's numbers
```

Canonical answer syntax: `3/4`, `-sqrt(3)/2`, `2pi`, `pi/6`, `e^(-x)`, `x^2`, `ln(x)`, `log(x)` (base 10), `log_2(x)`, `abs(x)`, `5!`, `3-2i`, lists `-2, 3` (or `none`), tuples `(2, -1)`. Exact values unless the prompt asks for rounding (then give `tol`). Reduce fractions; use `-3/4`, never `3/-4`.

## Generators to write (key = course-week)

Write the F1 and F2 generators below (24 keys). Only after all of them pass the tests, add F3 and M1 ones if you can.

F1 Algebra and functions
- `F1-01` signed numbers: order of operations with negatives, absolute value, powers of negatives (num).
- `F1-02` fractions and ratios: add/subtract/multiply/divide fractions and mixed numbers; ratio and proportion word problems (num, exact fraction).
- `F1-03` linear equations: variables on both sides, brackets, fractions (num, answers may be fractions).
- `F1-04` inequalities: solve linear inequalities including dividing by a negative; mc with the four directions (<, >, ≤, ≥) at the right boundary, plus one distractor with the wrong boundary.
- `F1-05` graphs and slope: slope through two points, y-intercept, slope–intercept equation from point and slope (num or expr with `lead: $y =$`).
- `F1-06` systems of equations: 2×2 integer solutions (tuple), occasionally a word problem.
- `F1-07` exponents and radicals: exponent laws (expr in x, e.g. `x^7`), rational exponents like $8^{2/3}$ (num), simplest radical form like $\sqrt{72}=6\sqrt2$ (num, exact).
- `F1-08` polynomial operations: expand products (expr, `form: 'expanded'`), add/subtract polynomials.
- `F1-09` factoring and quadratics: factor $x^2+bx+c$ and $ax^2+bx+c$ with integer roots (expr, `form: 'factored'`); solve quadratics, including by the quadratic formula with irrational roots (list, exact).
- `F1-10` rational expressions: simplify (expr with a `domain` avoiding excluded values); excluded values (list).
- `F1-11` functions and inverses: evaluate $f(a)$, $f(g(a))$ (num); inverse of a linear or simple rational function (expr, `lead: $f^{-1}(x) =$`).
- `F1-12` exponentials and logarithms: evaluate logs, solve $b^x=N$, exponential growth/decay values with rounding (num with tol).

F2 Trigonometry and vectors
- `F2-01` angles and radians: degrees ↔ radians (exact multiples of pi), arc length $s=r\theta$.
- `F2-02` unit circle: exact sin/cos/tan at multiples of $\pi/6$ and $\pi/4$, including undefined tan (`dne`).
- `F2-03` trig graphs: amplitude, period, phase shift, midline of $y = A\sin(Bx - C) + D$.
- `F2-04` inverse trig functions: exact principal values (num), and compositions like $\sin(\arccos(3/5))$.
- `F2-05` identities: simplify trig expressions to a single function (expr in x; equivalence is checked numerically, so any equivalent form is accepted).
- `F2-06` trig equations: all solutions in $[0, 2\pi)$ (list).
- `F2-07` triangles: right-triangle trig, law of sines, law of cosines (num with tol, degrees or lengths).
- `F2-08` polar coordinates: rectangular ↔ polar (tuple; angle in radians in $[0, 2\pi)$ or exact).
- `F2-09` vectors and components: components from magnitude and direction (tuple with tol), magnitude, vector sums (tuple).
- `F2-10` dot products: dot product (num), angle between vectors in degrees (num with tol), projection scalar.
- `F2-11` complex plane: modulus, argument, products and quotients, polar form values (num, complex answers allowed like `3-4i`).
- `F2-12` oscillation models: amplitude, angular frequency, frequency, period, phase of $x(t)=A\cos(\omega t+\phi)$; value at a time (num with tol).

F3 Precalculus synthesis
- `F3-02` composition and inverses; `F3-03` polynomial zeros with multiplicity (list) and end behaviour (mc); `F3-04` rational functions: vertical asymptotes (list), horizontal asymptote (num or `dne`), holes; `F3-05` exponential models (doubling time, half-life, continuous growth, with tol); `F3-06` logarithmic equations (num); `F3-08` circles and parabolas from equations (center/radius tuple, vertex tuple); `F3-09` arithmetic and geometric sequences (nth term); `F3-10` finite arithmetic and geometric sums, infinite geometric sums; `F3-11` average rate of change (num); `F3-12` limits of rational functions at removable discontinuities (num).

M1 Calculus I
- `M1-01` limits (removable discontinuities, limits at infinity of rational functions, `dne` for unequal one-sided limits); `M1-03` derivative from the definition at a point (num); `M1-04` power, sum and constant-multiple rules (expr in x, `lead: $f'(x) =$`); `M1-05` chain rule and implicit differentiation (expr); `M1-07` optimization word problems with integer-friendly answers (num); `M1-09` antiderivatives (expr, `const: true`, tell the learner to omit $+C$); `M1-10` definite integrals of polynomials (num); `M1-11` fundamental theorem: $\frac{d}{dx}\int_a^{x} f(t)\,dt$ and $\int_a^b f'(x)dx$ (expr / num); `M1-12` u-substitution (expr, `const: true`).

## Quality bar

- Numbers chosen so the work is reasonable by hand: small integers, answers that are integers or simple fractions unless the template is about rounding. Avoid degenerate cases (zero coefficients, $1x$, $+-3$, $x^1$, `--`), duplicate mc choices and trivial problems.
- Pretty TeX: format coefficients and signs properly (write a helper that renders polynomials: `3x^2 - x + 4`, never `3x^2 + -1x + 4`).
- Hints and solutions use the instance's actual numbers and teach the method (Khan style). Last hint gets the learner to the method but not the final value.

## Tests (required)

Write `/home/claude/toe/scripts/test_generators.js` and run it with `node`. For every key, generate 400 instances (different seeds) and assert:
1. `ToEChecker.grade(item, item.answer).correct === true` (load `/home/claude/toe/src/checker.js`); for mc, the answer index is valid and choices are distinct.
2. Every `$...$` segment in prompt, choices, hints and solution parses with KaTeX: `require('/opt/npm-tools/node_modules/katex').renderToString(tex, {throwOnError: true})` (use `require('/home/claude/toe/src/mathtext.js').protect(text).maths` to extract segments).
3. No `NaN`, `undefined`, `Infinity`, `+ -`, `- -`, `1x`, `^1` (unless `^{1}` is intended) or `[object` in any text.
4. An independent verification per generator: substitute the answer back into the problem using the checker's `parse`/`evaluate` or plain JS math (e.g. for a linear equation check $a\cdot ans + b = c$; for factoring, evaluate the factored answer against the original polynomial at sample points; for trig equation lists, check each value satisfies the equation and lies in $[0,2\pi)$ and that the count is right).
Print a short summary and exit non-zero on any failure. Iterate until all tests pass.

Do not edit `checker.js` or `mathtext.js`, and do not read other parts of the site. Write the generators directly from this spec; run the tests to find problems. Write generators.js in several parts (for example F1 first, then F2) so progress is saved if you are interrupted; if generators.js already exists, run the tests and continue from what is there. If the grader seems to misjudge a correct answer, report it (with the exact item) in your final message instead of changing it. Finish with at most five lines: generator count, test result, any grader issues found.
