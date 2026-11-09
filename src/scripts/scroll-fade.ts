/**
 * [data-scroll-fade] paints one solid colour that follows the scroll (Home A2). It holds cobalt
 * until its [data-scroll-fade-track] reaches the middle of the screen, then blends to cream by the
 * time the track's end reaches the bottom. Without JS it stays cobalt.
 */
const stops = [
  { at: 0, color: '--color-a2-cobalt' },
  { at: 1, color: '--color-grey-100' },
];
// Cream and ink type have the same contrast on the blend here, so the theme flips at this point.
const flipAt = 0.26;

const fades = [...document.querySelectorAll<HTMLElement>('[data-scroll-fade]')];
let pending = 0;

const progress = (track: Element) => {
  const { top, height } = track.getBoundingClientRect();
  const half = innerHeight / 2;

  return Math.min(1, Math.max(0, (half - top) / Math.max(1, height - half)));
};

const paint = () => {
  pending = 0;

  fades.forEach((fade) => {
    const track = fade.querySelector('[data-scroll-fade-track]') ?? fade;
    const p = progress(track);
    const end = stops.findIndex((stop) => stop.at >= p) || 1;
    const from = stops[end - 1];
    const to = stops[end];
    const mix = ((p - from.at) / (to.at - from.at)) * 100;
    const theme = p >= flipAt ? 'light' : 'cobalt';

    fade.style.backgroundColor = `color-mix(in oklab, var(${from.color}), var(${to.color}) ${mix.toFixed(1)}%)`;

    if (fade.dataset.theme !== theme) {
      [fade, ...fade.querySelectorAll<HTMLElement>('[data-theme]')].forEach((el) => {
        el.dataset.theme = theme;
      });
    }
  });
};

const request = () => (pending ||= requestAnimationFrame(paint));

addEventListener('scroll', request, { passive: true });
addEventListener('resize', request);
paint();
