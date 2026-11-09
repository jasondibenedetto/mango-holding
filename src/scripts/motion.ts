/**
 * Derives the CSS spring easings from the spring tokens, so changing --spring-*-k/c updates
 * the JS springs and the CSS curves together. tokens.css keeps baked linear() values as the
 * no-JS fallback.
 */
const css = getComputedStyle(document.documentElement);

/** Integrates x'' = -k(x-1) - cx' from 0 (dt 0.5ms) until it settles. */
export const springCurve = (k: number, c: number, samples = 32) => {
  const xs = [0];
  let x = 0;
  let v = 0;
  let t = 0;

  while (t < 3 && (Math.abs(x - 1) > 0.005 || Math.abs(v) > 0.05)) {
    v += (-k * (x - 1) - c * v) * 0.0005;
    x += v * 0.0005;
    xs.push(x);
    t += 0.0005;
  }

  const ms = Math.round(xs.length * 0.05) * 10;
  const pts = Array.from({ length: samples }, (_, i) =>
    i === samples - 1 ? 1 : +xs[Math.round((i / (samples - 1)) * (xs.length - 1))].toFixed(3),
  );

  return { ease: `linear(${pts.join(', ')})`, ms };
};

const token = (name: string) => parseFloat(css.getPropertyValue(`--spring-${name}`));

[
  ['spring', 'pill'],
  ['spring-playful', 'hop'],
  ['spring-menu', 'menu'],
].forEach(([name, spring]) => {
  const k = token(`${spring}-k`);
  const c = token(`${spring}-c`);

  if (!k || !c) {
    return;
  }

  const { ease, ms } = springCurve(k, c);
  document.documentElement.style.setProperty(`--ease-${name}`, ease);
  document.documentElement.style.setProperty(`--duration-${name}`, `${ms}ms`);
});
