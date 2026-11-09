/**
 * Elements with data-tilt pivot in 3D toward the pointer and catch a sheen. Styles live in
 * global.css and the --tilt-* tokens. --tilt-x and --tilt-y run from -1 to 1 across the element.
 * Fine pointers only, and off for reduced motion.
 */
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    if (!fine.matches || reduce.matches) {
      return;
    }

    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;

    el.style.setProperty('--tilt-x', Math.max(-1, Math.min(1, x)).toFixed(3));
    el.style.setProperty('--tilt-y', Math.max(-1, Math.min(1, y)).toFixed(3));
    el.classList.add('is-tilting');
  });
  el.addEventListener('pointerleave', () => el.classList.remove('is-tilting'));
});
