/**
 * Segmented control highlights with the nav's pill feel. A hover pill follows the pointer
 * and the ink pill slides to the checked option. Both use the --spring-pill-* and
 * --spring-hop-* tokens and snap under reduced motion. Without JavaScript the options
 * colour themselves, see ContactPanel.astro.
 */
import './motion';

type Spring = { x: number; t: number; v: number; k: number; c: number };

const css = getComputedStyle(document.documentElement);
const token = (name: string, k: number, c: number): [number, number] => [
  parseFloat(css.getPropertyValue(`--spring-${name}-k`)) || k,
  parseFloat(css.getPropertyValue(`--spring-${name}-c`)) || c,
];
const pillSpring = token('pill', 560, 30);
const hopSpring = token('hop', 520, 24);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');

export const segmented = (track: HTMLElement) => {
  const springs: Spring[] = [];
  const renders: (() => void)[] = [];
  const spring = (x: number, [k, c]: [number, number]) => {
    const s = { x, t: x, v: 0, k, c };
    springs.push(s);

    return s;
  };

  let raf = 0;
  let last = 0;
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    const n = Math.ceil(dt * 240) || 1;
    const h = dt / n;
    let busy = false;
    last = now;

    for (const s of springs) {
      for (let i = 0; i < n; i++) {
        s.v += (-s.k * (s.x - s.t) - s.c * s.v) * h;
        s.x += s.v * h;
      }

      if (Math.abs(s.x - s.t) < 0.02 && Math.abs(s.v) < 0.02) {
        s.x = s.t;
        s.v = 0;
      } else {
        busy = true;
      }
    }

    renders.forEach((f) => f());
    raf = busy ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };

  const pill = (el: HTMLElement, playful: boolean) => {
    const [left, top, right, bottom] = [0, 0, 0, 0].map(() => spring(0, pillSpring));
    const lift = spring(0, hopSpring);
    let radius = '999px';

    const p = {
      on: false,
      move(option: HTMLElement, pop: boolean) {
        const a = option.getBoundingClientRect();
        const b = track.getBoundingClientRect();
        // The pills sit inside the track's border, so measure from there.
        const x = b.left + track.clientLeft;
        const y = b.top + track.clientTop;
        const r = { l: a.left - x, t: a.top - y, r: a.right - x, b: a.bottom - y };
        radius = getComputedStyle(option).borderTopLeftRadius;
        const snap = reduce.matches || (pop && !playful);

        if (pop && !snap) {
          // Pop from 76% of the option rather than flying in from elsewhere.
          const inset = (r.r - r.l) * 0.12;
          [left.x, top.x, right.x, bottom.x] = [r.l + inset, r.t, r.r - inset, r.b];

          [left, right].forEach((s) => {
            s.v = 0;
            [s.k, s.c] = pillSpring;
          });
        } else if (!snap && playful) {
          // The edge in the direction of travel is stiffer, so the pill stretches.
          const dir = Math.sign(r.l - left.t);
          const [lead, trail] = dir > 0 ? [right, left] : [left, right];
          [lead.k, lead.c] = [pillSpring[0] * 1.36, pillSpring[1] * Math.sqrt(1.36)];
          [trail.k, trail.c] = [pillSpring[0] * 0.73, pillSpring[1] * Math.sqrt(0.73)];
          const dist = Math.abs(r.l - left.t);

          if (dist > 1) {
            lift.v -= 72 * Math.min(dist / 140, 1.2);
          }
        }

        (
          [
            [left, r.l],
            [top, r.t],
            [right, r.r],
            [bottom, r.b],
          ] as const
        ).forEach(([s, t]) => {
          s.t = t;

          if (snap) {
            s.x = t;
            s.v = 0;
          }
        });

        p.on = true;
        el.style.opacity = '1';
        kick();
      },
      hide() {
        p.on = false;
        el.style.opacity = '0';
      },
    };

    renders.push(() => {
      const stretch = Math.max(0, (right.x - left.x) / Math.max(1, right.t - left.t) - 1);
      const sy = reduce.matches ? 1 : 1 - Math.min(stretch * 0.35, 0.16);
      const w = track.clientWidth;
      const h = track.clientHeight;
      el.style.clipPath = `inset(${top.x}px ${w - right.x}px ${h - bottom.x}px ${left.x}px round ${radius})`;
      el.style.transformOrigin = `${(left.x + right.x) / 2}px 50%`;
      el.style.transform = `translateY(${reduce.matches ? 0 : lift.x}px) scaleY(${sy})`;
    });

    return p;
  };

  const options = [...track.querySelectorAll<HTMLElement>('label')];
  const hover = pill(track.querySelector('[data-seg-hover]')!, true);
  const checked = pill(track.querySelector('[data-seg-checked]')!, false);
  const sync = (pop: boolean) => {
    const on = options.find((o) => o.querySelector('input')!.checked);

    if (on) {
      checked.move(on, pop || !checked.on);
    } else {
      checked.hide();
    }
  };

  track.dataset.js = '';
  sync(true);
  track.addEventListener('change', () => sync(false));
  new ResizeObserver(() => sync(true)).observe(track);

  let hiddenAt = 0;

  options.forEach((option) => {
    option.addEventListener('pointerenter', () => {
      if (fine.matches) {
        hover.move(option, !hover.on && performance.now() - hiddenAt > 260);
      }
    });
  });
  track.addEventListener('pointerleave', () => {
    if (hover.on) {
      hiddenAt = performance.now();
      hover.hide();
    }
  });
};
