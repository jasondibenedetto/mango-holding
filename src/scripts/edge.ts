/**
 * --edge-top and --edge-bottom on <html> follow the colour at the top and bottom of the
 * viewport. html paints the nearer one, which Safari 26 uses for the status bar, toolbar and
 * overscroll. theme-color follows the top for older browsers. The colour is the topmost
 * element's --edge (set where the background is a gradient, like the footer) or its opaque
 * background-color. While the mobile menu is open, html takes --color-surface-menu so Safari's
 * bars match the menu.
 */
const html = document.documentElement;
const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const sheet = document.getElementById('mobile-menu');

const colourAt = (y: number) => {
  for (const el of document.elementsFromPoint(innerWidth / 2, y)) {
    // body and html are the page background, not a section, so we are past the content.
    if (el === document.body || el === html) {
      break;
    }

    if (sheet?.contains(el)) {
      continue;
    }

    const cs = getComputedStyle(el);
    const edge = cs.getPropertyValue('--edge').trim();

    if (edge) {
      return edge;
    }

    if (!/^(transparent|rgba\(.*,\s*0\))$/.test(cs.backgroundColor)) {
      return cs.backgroundColor;
    }
  }

  return '';
};

let upper = '';
let lower = '';
let raf = 0;

const update = () => {
  raf = 0;
  const max = html.scrollHeight - innerHeight;
  const open = sheet?.matches(':popover-open');

  if (open) {
    html.style.setProperty('--edge-top', 'var(--color-surface-menu)');
    html.style.setProperty('--edge-bottom', 'var(--color-surface-menu)');
    html.dataset.edgeEnd = 'top';
  } else {
    // Rubber-band overscroll keeps the colours, which is what they are for.
    if (scrollY < 0 || scrollY > max) {
      return;
    }

    upper = colourAt(0) || upper;
    lower = colourAt(innerHeight - 1) || lower;

    if (upper) {
      html.style.setProperty('--edge-top', upper);
    }

    if (lower) {
      html.style.setProperty('--edge-bottom', lower);
    }
    html.dataset.edgeEnd = scrollY > max / 2 ? 'bottom' : 'top';
  }

  // html paints the top colour unless near the bottom, so resolve it for theme-color.
  if (meta && html.dataset.edgeEnd === 'top') {
    meta.content = getComputedStyle(html).backgroundColor;
  } else if (meta && upper) {
    meta.content = upper;
  }
};

const queue = () => (raf ||= requestAnimationFrame(update));

addEventListener('scroll', queue, { passive: true });
addEventListener('resize', queue);
sheet?.addEventListener('toggle', update);
update();
