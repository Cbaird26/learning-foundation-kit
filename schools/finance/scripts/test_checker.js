const K = require('/home/claude/finance/src/checker.js');
let fails = 0;
function t(item, input, expect) {
  const r = K.grade(item, input);
  if (r.correct !== expect) { fails++; console.log('FAIL', JSON.stringify(item), JSON.stringify(input), '->', JSON.stringify(r)); }
}
const num = (a, extra) => Object.assign({ type: 'num', answer: a }, extra || {});
t(num('7'), '7', true); t(num('7'), 'x = 7', true); t(num('7'), '7.0', true); t(num('7'), '8', false);
t(num('3/4'), '0.75', true); t(num('3/4'), '6/8', true); t(num('sqrt(2)/2'), '1/sqrt2', true); t(num('sqrt(2)/2'), '0.7071', false);
t(num('2pi'), '2π', true); t(num('2pi'), '6.2832', false); t(num('2pi'), '6.28', true && false);
t(num('9.81', { tol: '1%' }), '9.8', true); t(num('3.14', { tol: '0.005' }), '3.142', true);
t(num('-2'), '(-8)^(1/3)', true); t(num('120'), '5!', true); t(num('-i/2'), '-0.5i', true); t(num('1+2i'), '1 + 2i', true);
t(num('inf'), '∞', true); t(num('dne'), 'DNE', true); t(num('e^2'), 'exp(2)', true); t(num('ln(2)'), 'log(2)/log(e)', true);
t(num('3'), 'log_2(8)', true); t(num('3'), 'log2(8)', true); t(num('2'), 'log(100)', true);
t(num('6', { unit: 'm/s' }), '6 m/s', true);
t(num('1.5e3'), '1500', true); t(num('1500'), '1.5*10^3', true); t(num('1500'), '1.5×10^3', true);
const ex = (a, vars, extra) => Object.assign({ type: 'expr', answer: a, vars: vars }, extra || {});
t(ex('x + 8', ['x']), '8+x', true); t(ex('x + 8', ['x']), 'x+9', false);
t(ex('3x^2 sin(x) + x^3 cos(x)', ['x']), 'x^3cos x + 3x^2 sin x', true);
t(ex('sin(2x)', ['x']), 'sin2x', true); t(ex('sin(2x)', ['x']), '2sin(x)cos(x)', true);
t(ex('x(x+1)', ['x'], { form: 'factored' }), 'x^2+x', false); t(ex('x(x+1)', ['x'], { form: 'factored' }), '(x+1)x', true);
t(ex('x^2+5x+6', ['x'], { form: 'expanded' }), '(x+2)(x+3)', false); t(ex('x^2+5x+6', ['x'], { form: 'expanded' }), '6+5x+x^2', true);
t(ex('x^3/3', ['x'], { const: true }), 'x^3/3 + 5', true);
t(ex('m*g*h', ['m', 'g', 'h']), 'mgh', true); t(ex('v_0 t + g t^2/2', ['v_0', 't', 'g']), 'v_0t + 0.5g t^2', true);
t(ex('e^(-x)', ['x']), 'exp(-x)', true); t(ex('e^(-x)', ['x']), 'e^-x', true); t(ex('1/(2pi)', ['x']), '1/(2pi)', true);
t(ex('omega^2', ['omega']), 'ω^2', true); t(ex('sqrt(x-3)', ['x'], { domain: 'x: 3.5..6' }), '(x-3)^(1/2)', true);
t(ex('x', ['x']), 'y', false); t(ex('abs(x-1)', ['x']), '|x-1|', true); t(ex('sin(x)^2', ['x']), 'sin^2(x)', true);
const li = (a, extra) => Object.assign({ type: 'list', answer: a }, extra || {});
t(li('2, 3'), '3, 2', true); t(li('2, 3'), 'x = 3 or x = 2', true); t(li('2, 3'), '2', false); t(li('2, 3'), '{2, 3}', true);
t(li('none'), 'no solution', true); t(li('-sqrt(2), sqrt(2)'), '±? '.replace('±? ', '-1.41421356237, 1.41421356237'), true);
const tu = (a, extra) => Object.assign({ type: 'tuple', answer: a }, extra || {});
t(tu('(2, -1)'), '(2,-1)', true); t(tu('(2, -1)'), '(-1, 2)', false); t(tu('(2, -1)'), 'x=2, y=-1', true); t(tu('(3, 4, 0)'), '<3,4,0>', true);
t({ type: 'mc', answer: 2 }, 2, true); t({ type: 'ms', answer: [0, 2] }, [2, 0], true);
console.log('previews:', K.preview('3x^2 sin x + sqrt(2)/2', { vars: ['x'] }), '|', K.preview('e^-x/(2pi)', { vars: ['x'] }));
console.log(fails ? fails + ' failures' : 'all passed');
