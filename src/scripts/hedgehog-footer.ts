/**
 * Hedgehog cut visualizer for the site footer (ported from the designer's
 * prototype, v21). One mango cheek scored into slices: at rest a flat field in
 * the section colour with a fine grain; under the pointer a mound lifts and fans
 * the slices out, with a glow following the pointer. Also adds the sign-off's
 * magnetic pull.
 *
 * Never imported statically: Footer.astro loads it with a dynamic import()
 * once the footer is near the viewport, motion is allowed, WebGL works and a
 * fine pointer has moved. Colours come from the footer's --fx-* custom
 * properties (one set per theme preset), so nothing here is orange-only.
 * On wide-gamut screens they are Display P3, and the canvas draws in P3 too.
 */
import {
  BoxGeometry,
  Color,
  ColorManagement,
  DoubleSide,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import {
  DisplayP3ColorSpace,
  DisplayP3ColorSpaceImpl,
  LinearDisplayP3ColorSpace,
  LinearDisplayP3ColorSpaceImpl,
} from 'three/examples/jsm/math/ColorSpaces.js';

ColorManagement.define({
  [DisplayP3ColorSpace]: DisplayP3ColorSpaceImpl,
  [LinearDisplayP3ColorSpace]: LinearDisplayP3ColorSpaceImpl,
});

type Cell = {
  i: number;
  j: number;
  x: number;
  y: number;
  lift: number;
  tx: number;
  ty: number;
  ph: number;
  g: number;
  h: number;
  w: number;
  n: Vector3;
  nb: number[];
};

const grow = 0.4;
const liftScale = 1.35;
const focusLift = 0.4;
const bulge = 1.0;
const reachScale = 1.5;
const nbOffsets = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

/** Mounts the effect into `footer` and returns a function that tears it down. */
export function mount(footer: HTMLElement): () => void {
  const host = footer.querySelector<HTMLElement>('[data-fx]');
  const band = footer.querySelector<HTMLElement>('[data-fx-band]');

  if (!host || !band) {
    return () => {};
  }

  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const css = getComputedStyle(footer);

  /** Reads a --fx-* colour as `#rrggbb` or `color(display-p3 r g b)`, as [r, g, b] from 0 to 1. */
  const channels = (name: string) => {
    const value = css.getPropertyValue(name).trim();
    const p3 = value.match(/^color\(display-p3 ([\d.]+) ([\d.]+) ([\d.]+)\)$/);

    if (p3) {
      return { rgb: p3.slice(1).map(Number), p3: true };
    }

    const hex = parseInt(value.slice(1), 16) || 0xff7e1d;

    return { rgb: [hex >> 16, (hex >> 8) & 255, hex & 255].map((v) => v / 255), p3: false };
  };
  const toColour = ({ rgb, p3 }: ReturnType<typeof channels>) =>
    new Color().setRGB(rgb[0]!, rgb[1]!, rgb[2]!, p3 ? DisplayP3ColorSpace : SRGBColorSpace);
  // The slice sides are tinted toward the shade, by the ratio the designer tuned for orange.
  const tintFix = [0.9803, 1.0133, 0.9496];
  const palette = (fill: string, shadeName: string, glow: string) => {
    const base = channels(fill);
    const shade = channels(shadeName);
    const tint = shade.rgb.map((s, i) => {
      const ratio = Math.sqrt((s + 0.02) / (base.rgb[i]! + 0.02));

      return Math.min(1, Math.min(1, Math.max(0.55, ratio)) * tintFix[i]!);
    });

    return {
      p3: base.p3,
      fill: toColour(base),
      shade: toColour(shade),
      glow: toColour(channels(glow)),
      tint: new Vector3(tint[0], tint[1], tint[2]),
    };
  };

  let width = host.clientWidth;
  let height = host.clientHeight;

  let renderer: WebGLRenderer;

  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return () => {};
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);

  if (channels('--fx-base').p3 && 'drawingBufferColorSpace' in renderer.getContext()) {
    // three multiplies its sRGB to P3 output matrix in the wrong order and turns orange yellow, so work in P3.
    ColorManagement.workingColorSpace = LinearDisplayP3ColorSpace;
    renderer.outputColorSpace = DisplayP3ColorSpace;
  }

  // The footer rests in the page colour and turns hedgehog orange while the pointer is over the field.
  const page = palette('--fx-base', '--fx-shade', '--fx-glow');
  const mango = palette(
    '--color-hedgehog',
    '--color-fx-hedgehog-shade',
    '--color-fx-hedgehog-glow',
  );
  const mangoWash = host.querySelector<HTMLElement>('[data-fx-mango]');

  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'fx-canvas';
  host.querySelector('[data-fx-shade]')?.before(canvas) ?? host.appendChild(canvas);

  /**
   * The field: a flat plane below the straight edge y = edge (the bottom of the white band). The camera leans
   * toward the field, so slices that rise out of the plane move across the edge on screen, out over the white.
   */
  const side = -1;
  let edge = 0;
  let fx = 1;
  let fy1 = 1;
  let visW = 1;
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, width / height, 0.1, 200);
  const view = new Vector3();
  const frameRay = new Raycaster();
  const ground = new Plane(new Vector3(0, 0, 1), 0);
  const hitP = new Vector3();
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ] as const;
  const onGround = (x: number, y: number) => {
    frameRay.setFromCamera(new Vector2(x, y), camera);
    frameRay.ray.intersectPlane(ground, hitP);

    return hitP.clone();
  };

  const frameCamera = () => {
    const split = 1 - band!.offsetHeight / height;

    camera.aspect = width / height;
    view.set(0, 0.3 * side, 1).normalize();
    camera.position.copy(view).multiplyScalar(14);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    const ey = side * (1 - 2 * split);
    edge = onGround(0, ey).y;
    visW = onGround(-1, ey).distanceTo(onGround(1, ey));
    const far = corners.filter(([, y]) => y === side).map(([x, y]) => onGround(x, y));
    fx = Math.max(...far.map((p) => Math.abs(p.x)), visW / 2);
    fy1 = Math.max(...far.map((p) => side * (p.y - edge)));
  };

  frameCamera();

  // Shader uniforms: pointer (field xy), opening, glow radius and palette.
  const uniforms = {
    uPtr: { value: new Vector2(999, 999) },
    uI: { value: 0 },
    uR: { value: 2 },
    uG: { value: 1 },
    uReach: { value: reachScale },
    uFill: { value: page.fill },
    uGlow: { value: page.glow },
    uBase: { value: page.shade },
    uTint: { value: page.tint },
    uMangoFill: { value: mango.fill },
    uMangoGlow: { value: mango.glow },
    uMangoBase: { value: mango.shade },
    uMangoTint: { value: mango.tint },
    uMango: { value: 0 },
    uSideLen: { value: 1 },
  };

  /**
   * Slices take their colour from their rest position (aRest + local xy), so the glow lines up across them. The
   * fill is unlit, so at rest the field is exactly the section colour. The sides fade from the shade at the root
   * up to the fill, slices that tip away darken a little, and a fine grain runs over everything. The skin is a
   * sheet over the slices that fades out only where the field opens, so at rest there are no seams.
   */
  const fleshMat = new MeshBasicMaterial({ side: DoubleSide });
  const skinMat = new MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false });
  const patch = (sheet: boolean) => (sh: WebGLProgramParametersWithUniforms) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader =
      (sheet ? '' : 'attribute vec3 aRest; attribute float aFlare;\n') +
      'varying vec2 vRXY; varying float vSide, vUp, vTop, vTilt;\n' +
      sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
    ${
      sheet
        ? 'vRXY = position.xy; vSide = 0.; vUp = 1.; vTop = 1.; vTilt = 1.;'
        : `transformed.xy *= mix(1., aFlare, position.z + .5);
    vRXY = aRest.xy + transformed.xy * aRest.z; vSide = 1. - abs(normal.z);
    vUp = (position.z + .5) * length(instanceMatrix[2].xyz); vTop = step(.5, normal.z);
    vTilt = abs(normalize(mat3(instanceMatrix) * normal).z);`
    }`,
      );
    sh.fragmentShader =
      `varying vec2 vRXY; varying float vSide, vUp, vTop, vTilt;
    uniform float uI, uR, uG, uReach, uSideLen, uMango; uniform vec2 uPtr;
    uniform vec3 uFill, uGlow, uBase, uTint, uMangoFill, uMangoGlow, uMangoBase, uMangoTint;
    float grain(vec3 p) { p = fract(p); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z) - .5; }
    ` +
      sh.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
      vec2 dp = vRXY - uPtr;
      float glow = exp(-dot(dp, dp) / (uG * uG * 1.2)) * uI;
      vec3 fill = mix(uFill, uMangoFill, uMango), shade = mix(uBase, uMangoBase, uMango);
      vec3 c = mix(fill, mix(uGlow, uMangoGlow, uMango), glow * .8);
      c = mix(c, c * mix(uTint, uMangoTint, uMango), vSide * .8);
      float lit = mix(smoothstep(0., uSideLen, vUp), 1., vTop);
      lit = lit * lit * (3. - 2. * lit);
      lit = max(lit + grain(gl_FragCoord.xyx * .1031) * .56 * (1. - vTop), 0.);
      c = mix(shade, c, min(lit, 1.)) * max(lit, 1.);
      c *= mix(.84, 1., smoothstep(.55, 1., vTilt)) * (1. + grain(gl_FragCoord.yxy * .0973) * .12);
      diffuseColor.rgb = c;
      ${sheet ? 'diffuseColor.a = 1. - clamp(uI * exp(-dot(dp, dp) / (2. * uR * uR * uReach * uReach)) * 3.5, 0., 1.);' : ''}`,
      );
  };

  fleshMat.onBeforeCompile = patch(false);
  skinMat.onBeforeCompile = patch(true);
  fleshMat.customProgramCacheKey = () => 'mango-flesh';
  skinMat.customProgramCacheKey = () => 'mango-skin';
  const rootMat = new MeshBasicMaterial({ color: page.shade.clone() });

  // Slices sit on a square grid of about 73 CSS px. moundR is the broad mound, focusR the tight focus under the pointer.
  let step = 1;
  let depth = 1;
  let moundR = 1;
  let focusR = 1;
  let sphere = 1;
  let count = 0;
  let cells: Cell[] = [];
  let mesh: InstancedMesh | null = null;
  let root: Mesh | null = null;
  let sheet: Mesh | null = null;
  let flare: InstancedBufferAttribute | null = null;

  const build = () => {
    [mesh, root, sheet].forEach((m) => {
      if (m) {
        scene.remove(m);
        m.geometry.dispose();
      }
    });

    const cols = Math.max(6, Math.min(22, Math.round(width / 73)));
    step = visW / cols;
    depth = step * 1.1;
    moundR = step * 4.08;
    focusR = step * 1.56;
    sphere = step * 3.72;
    uniforms.uR.value = moundR;
    uniforms.uG.value = step * 2.28;
    uniforms.uSideLen.value = depth + step * 1.6;

    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // the grid starts exactly at the edge, so the edge runs between two rows and no slice is ever cut
    const half = Math.ceil((fx + moundR * 1.5) / step);
    const rows = Math.ceil((fy1 + moundR) / step);
    fx = (half + 0.5) * step;
    fy1 = rows * step;
    // Order matters, the seeded rnd() runs i then j and that sets the slice pattern.
    cells = Array.from({ length: 2 * half + 1 }, (_, a) => a - half).flatMap((i) =>
      Array.from({ length: rows }, (_, j) => ({
        i,
        j,
        x: step * i,
        y: edge + side * step * (j + 0.5),
        lift: 0.5 + 1.0 * rnd(),
        tx: (rnd() - 0.5) * 0.22,
        ty: (rnd() - 0.5) * 0.22,
        ph: rnd() * 6.28,
        g: 0,
        h: 0,
        w: 0,
        n: new Vector3(0, 0, 1),
        nb: [],
      })),
    );
    count = cells.length;

    const geo = new BoxGeometry(1, 1, 1);
    const restAttr = new Float32Array(count * 3);
    cells.forEach((c, k) => {
      restAttr[3 * k] = c.x;
      restAttr[3 * k + 1] = c.y;
      restAttr[3 * k + 2] = step;
    });
    mesh = new InstancedMesh(geo, fleshMat, count);
    geo.setAttribute('aRest', new InstancedBufferAttribute(restAttr, 3));
    flare = new InstancedBufferAttribute(new Float32Array(count).fill(1), 1);
    flare.setUsage(DynamicDrawUsage);
    geo.setAttribute('aFlare', flare);

    const at = new Map(cells.map((c, k) => [c.i + ',' + c.j, k]));

    cells.forEach((c) => {
      c.nb = nbOffsets.map(([i, j]) => at.get(c.i + i + ',' + (c.j + side * j)) ?? -1);
    });
    mesh.frustumCulled = false;
    scene.add(mesh);

    // a root sheet in the shade colour under the slices, so any glimpse between their bases is coloured too
    root = new Mesh(new PlaneGeometry(2 * fx, fy1 - step * 0.01), rootMat);
    root.position.set(0, edge + (side * (fy1 + step * 0.01)) / 2, -depth + 0.01);
    scene.add(root);

    // the skin: one flat sheet over the whole field, ending exactly on the edge
    const skinGeo = new PlaneGeometry(2 * fx, fy1, 1, 1);
    skinGeo.translate(0, edge + (side * fy1) / 2, 0.004);
    sheet = new Mesh(skinGeo, skinMat);
    sheet.renderOrder = 1;
    scene.add(sheet);
  };

  build();

  const m4 = new Matrix4();
  const q4 = new Quaternion();
  const up = new Vector3(0, 0, 1);
  const n3 = new Vector3();
  const pos = new Vector3();
  const scl = new Vector3();
  const root3 = new Vector3();
  const ptr = new Vector2(999, 999);
  let opening = 0;
  let mangoMix = 0;
  let time = 0;
  let dirty = false;
  const bump = (x: number, y: number) =>
    Math.exp(-((x - ptr.x) ** 2 + (y - ptr.y) ** 2) / (2 * moundR * moundR)) * opening;

  const layout = (force: boolean, dt = 0) => {
    if (!mesh || !flare) {
      return;
    }

    if (!force && opening < 0.0005 && !dirty) {
      return;
    }

    dirty = opening >= 0.0005;
    const t = time;

    for (const c of cells) {
      // each slice eases toward its share of the bump, a little out of step with its neighbours
      const goal = bump(c.x, c.y);
      c.g = force ? goal : c.g + (goal - c.g) * Math.min(1, dt * (5 + 3 * c.lift));
      const g = c.g;
      // near the pointer the field is pushed inside out over a small sphere, so slices splay apart evenly
      const dx = c.x - ptr.x;
      const dy = c.y - ptr.y;
      const wf = Math.exp(-(dx * dx + dy * dy) / (2 * (1.15 * moundR) ** 2)) * opening;
      const gF = Math.exp(-(dx * dx + dy * dy) / (2 * focusR * focusR)) * opening;
      n3.set(dx / sphere, dy / sphere, 1).normalize();
      n3.set(n3.x * wf + c.tx * g, n3.y * wf + c.ty * g, 1 + (n3.z - 1) * wf).normalize();
      const wob = 1 + 0.12 * Math.sin(t * 1.4 + c.ph) * g;
      c.h = depth + step * (liftScale * g * c.lift + focusLift * gF) * wob;
      c.w = step * (1.003 + 0.1 * g + grow * gF * (0.7 + 0.3 * c.lift));
      c.n.copy(n3);
    }

    // No cutting in: bases stay one cell wide and each slice widens only as fast as it splays from its neighbours
    for (let k = 0; k < count; k++) {
      const c = cells[k]!;
      let slope = Infinity;

      for (let s = 0; s < 8; s++) {
        const j = c.nb[s]!;

        if (j < 0) {
          continue;
        }
        const o = cells[j]!;
        const [i, jj] = nbOffsets[s]!;
        const apart = i * (o.n.x / o.n.z - c.n.x / c.n.z) + jj * (o.n.y / o.n.z - c.n.y / c.n.z);
        slope = Math.min(slope, s < 4 ? apart / 2 : apart / 4);
      }

      if (!isFinite(slope)) {
        slope = 0;
      }

      const nz = c.n.z;
      const b = step * 0.998 * nz;
      const top = Math.max(step * 0.35, Math.min(c.w, nz * (step * 0.998 + 2 * slope * c.h * nz)));
      root3.set(c.x, c.y, bulge * step * bump(c.x, c.y) - depth);
      pos.copy(root3).addScaledVector(c.n, c.h / 2);
      q4.setFromUnitVectors(up, c.n);
      mesh.setMatrixAt(k, m4.compose(pos, q4, scl.set(b, b, c.h)));
      flare.array[k] = top / b;
    }

    flare.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  };

  // Input: pointer events are tracked on the footer itself (the canvas never takes them), fine pointers only.
  let hovering = false;
  let cx = -1e4;
  let cy = -1e4;
  const ndc = new Vector2(0.1, 0.05);
  const ray = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const target = new Vector3();
  const toWorld = () => {
    ray.setFromCamera(ndc, camera);

    return ray.ray.intersectPlane(plane, target);
  };

  const toNdc = (x: number, y: number) => {
    cx = x;
    cy = y;
    const b = canvas.getBoundingClientRect();
    ndc.set(((x - b.left) / b.width) * 2 - 1, -((y - b.top) / b.height) * 2 + 1);
  };

  // Sign-off magnetic pull: inside a generous radius it leans toward the pointer, springs back when it leaves.
  const mag = footer.querySelector<HTMLElement>('[data-signoff-mag]');
  const cta = footer.querySelector<HTMLElement>('[data-signoff]');
  const inner = cta?.querySelector<HTMLElement>('[data-signoff-word]') ?? null;
  let mx = 0;
  let my = 0;
  let wx = 0;
  let wy = 0;
  let vx = 0;
  let vy = 0;
  let magRaf = 0;
  let overCta = false;

  const magKick = () => {
    if (!magRaf && mag) {
      magRaf = requestAnimationFrame(magTick);
    }
  };

  const magTick = () => {
    magRaf = 0;

    if (!mag || !inner) {
      return;
    }

    const r = mag.getBoundingClientRect();
    const ccx = r.left + r.width / 2 - mx;
    const ccy = r.top + r.height / 2 - my;
    const dx = cx - ccx;
    const dy = cy - ccy;
    const d = Math.hypot(dx, dy);
    const reach = Math.max(r.width * 0.75, 320);
    const pull = overCta ? 1 : Math.max(0, 1 - d / reach) ** 2;
    const k = overCta ? 0.22 : 0.16;
    const tx = dx * k * pull;
    const ty = dy * k * pull * 1.2;

    vx = (vx + (tx - mx) * 0.14) * 0.74;
    vy = (vy + (ty - my) * 0.14) * 0.74;
    mx += vx;
    my += vy;
    wx += (tx * 0.35 - wx) * 0.2;
    wy += (ty * 0.35 - wy) * 0.2;

    mag.style.transform = `translate(${mx.toFixed(2)}px, ${my.toFixed(2)}px)`;
    inner.style.translate = `${wx.toFixed(2)}px ${wy.toFixed(2)}px`;

    if (Math.abs(tx - mx) + Math.abs(ty - my) + Math.abs(vx) + Math.abs(vy) > 0.05 || overCta) {
      magKick();
    }
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') {
      return;
    }

    toNdc(e.clientX, e.clientY);
    hovering = true;
    loop();
    magKick();
  };
  const onLeave = () => {
    hovering = false;
    overCta = false;
    cx = cy = -1e4;
    magKick();
  };
  const onScroll = () => {
    if (hovering) {
      toNdc(cx, cy);
      loop();
      magKick();
    }
  };
  // Enter can fire with no pointermove first, such as when a scroll slides the link under a still pointer.
  const onCtaEnter = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') {
      return;
    }

    toNdc(e.clientX, e.clientY);
    overCta = true;
    magKick();
  };
  const onCtaLeave = () => {
    overCta = false;
    magKick();
  };

  if (fine) {
    footer.addEventListener('pointermove', onMove, { passive: true });
    footer.addEventListener('pointerleave', onLeave);
    addEventListener('blur', onLeave);
    addEventListener('scroll', onScroll, { passive: true });
    cta?.addEventListener('pointerenter', onCtaEnter);
    cta?.addEventListener('pointerleave', onCtaLeave);
  }

  const update = (dt: number) => {
    const hit = toWorld();

    // only the field reacts, the white band stays still
    const over = !!hit && side * (target.y - edge) > 0;
    const goal = hovering && over ? 1 : 0;
    opening += (goal - opening) * Math.min(1, dt * (goal > opening ? 3.2 : 1.8));
    mangoMix += (goal - mangoMix) * Math.min(1, dt * (goal > mangoMix ? 2.4 : 1.4));
    time += dt;

    if (hit) {
      // the opening follows the pointer with a little lag so it feels like soft flesh, not a cursor stamp
      if (ptr.x > 900) {
        ptr.set(target.x, target.y);
      }
      const k = Math.min(1, dt * 9);
      ptr.x += (target.x - ptr.x) * k;
      ptr.y += (target.y - ptr.y) * k;
    }

    uniforms.uPtr.value.copy(ptr);
    uniforms.uI.value = opening;
    uniforms.uMango.value = mangoMix;
    rootMat.color.lerpColors(page.shade, mango.shade, mangoMix);

    if (mangoWash) {
      mangoWash.style.opacity = String(mangoMix);
    }

    // fully closed: the skin alone shows, with no slice edges peeking under its rim
    if (mesh && root) {
      mesh.visible = root.visible = opening > 0.001;
    }
    layout(false, dt);
  };

  // Render loop: runs only while the footer is on screen and the tab is visible.
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let shown = false;

  const frame = (now: number) => {
    raf = 0;

    if (!visible || document.hidden) {
      return;
    }

    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    renderer.render(scene, camera);

    if (!shown) {
      shown = true;
      footer.dataset.fxReady = '';
    }
    loop();
  };

  const loop = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting;

    if (visible) {
      loop();
    }
  });
  io.observe(footer);

  const onVisibility = () => {
    if (!document.hidden) {
      loop();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  layout(true);
  loop();

  // the footer resizes with the window and its content
  let rw = width;
  let rh = height;
  let resizeRaf = 0;
  const ro = new ResizeObserver(() => {
    if (resizeRaf) {
      return;
    }

    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;

      if (host.clientWidth === rw && host.clientHeight === rh) {
        return;
      }

      width = rw = host.clientWidth;
      height = rh = host.clientHeight;
      frameCamera();
      renderer.setSize(width, height, false);
      build();
      layout(true);
      loop();
    });
  });
  ro.observe(host);

  // motion turned off mid-visit: tear down and fall back to the static CSS field
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const onMotion = () => {
    if (motion.matches) {
      dispose();
    }
  };
  motion.addEventListener('change', onMotion);

  let disposed = false;
  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    cancelAnimationFrame(raf);
    cancelAnimationFrame(magRaf);
    cancelAnimationFrame(resizeRaf);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    motion.removeEventListener('change', onMotion);
    footer.removeEventListener('pointermove', onMove);
    footer.removeEventListener('pointerleave', onLeave);
    removeEventListener('blur', onLeave);
    removeEventListener('scroll', onScroll);
    cta?.removeEventListener('pointerenter', onCtaEnter);
    cta?.removeEventListener('pointerleave', onCtaLeave);

    if (mag) {
      mag.style.transform = '';
    }

    if (inner) {
      inner.style.translate = '';
    }
    delete footer.dataset.fxReady;

    [mesh, root, sheet].forEach((m) => {
      m?.geometry.dispose();
    });
    fleshMat.dispose();
    skinMat.dispose();
    rootMat.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  return dispose;
}
