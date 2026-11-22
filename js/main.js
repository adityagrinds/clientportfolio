/* =========================================================
   MOHAMMAD SOHAIL — PORTFOLIO
   3D drivetrain (three.js) + scroll choreography (GSAP + Lenis)
   ========================================================= */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth <= 900;

  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* -------------------------------------------------------
     SVG GEARS (2D, used across the UI)
     ------------------------------------------------------- */
  function gearPath(teeth, R = 47) {
    const m = (2 * R) / teeth;
    const ra = R + m * 0.95;
    const rd = R - m * 1.2;
    const step = (Math.PI * 2) / teeth;
    const P = (r, a) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
    let d = '';
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      const pts = [
        P(rd, a - 0.5 * step), P(rd, a - 0.3 * step), P(R, a - 0.19 * step),
        P(ra, a - 0.1 * step), P(ra, a + 0.1 * step), P(R, a + 0.19 * step), P(rd, a + 0.3 * step)
      ];
      d += (i === 0 ? 'M' : 'L') + pts.join(' L') + ' ';
    }
    d += 'Z ';
    const circle = (cx, cy, r) =>
      `M ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} Z `;
    const hole = R * 0.22;
    d += circle(0, 0, hole);
    if (teeth >= 20) {
      const inner = hole + R * 0.12, outer = rd - R * 0.12;
      const pr = (inner + outer) / 2, hr = ((outer - inner) / 2) * 0.85;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        d += circle(+(Math.cos(a) * pr).toFixed(2), +(Math.sin(a) * pr).toFixed(2), hr);
      }
    }
    return d;
  }
  $$('.svg-gear').forEach((svg) => {
    const p = svg.querySelector('path');
    p.setAttribute('d', gearPath(+svg.dataset.teeth || 20));
    p.setAttribute('fill-rule', 'evenodd');
  });

  /* barcode from roll number */
  (function barcode() {
    const svg = $('.barcode');
    if (!svg) return;
    const code = '2K26MEU01SN06';
    let x = 0, html = '';
    const bars = [];
    for (const ch of code) {
      const c = ch.charCodeAt(0);
      for (let b = 0; b < 6; b++) bars.push(((c >> b) & 1) + 1, ((c * 7 + b) % 3) + 1);
    }
    const unit = 220 / bars.reduce((s, v) => s + v, 0);
    bars.forEach((w, i) => {
      if (i % 2 === 0) html += `<rect x="${x.toFixed(2)}" y="0" width="${(w * unit).toFixed(2)}" height="34"/>`;
      x += w * unit;
    });
    svg.innerHTML = html;
  })();

  /* -------------------------------------------------------
     TEXT SPLITTING
     ------------------------------------------------------- */
  function split(el, mode) {
    const out = [];
    if (mode === 'chars') el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'word';
            if (mode === 'chars') {
              w.setAttribute('aria-hidden', 'true');
              Array.from(part).forEach((c) => {
                const s = document.createElement('span');
                s.className = 'char';
                s.textContent = c;
                w.appendChild(s);
                out.push(s);
              });
            } else {
              w.textContent = part;
              out.push(w);
            }
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(el);
    return out;
  }

  $$('.hero-title .split').forEach((el) => split(el, 'chars'));
  const revealHeads = $$('[data-reveal]').map((el) => ({ el, chars: split(el, 'chars') }));
  const manifestoWords = $$('[data-words]').flatMap((el) => split(el, 'words'));
  manifestoWords.forEach((w) => {
    if (/^(motion|meaning|machines?)/i.test(w.textContent)) w.classList.add('hl');
  });

  /* -------------------------------------------------------
     SMOOTH SCROLL
     ------------------------------------------------------- */
  let lenis = null;
  if (!reduceMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollVel = () => (lenis ? lenis.velocity : 0);

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* -------------------------------------------------------
     3D DRIVETRAIN
     ------------------------------------------------------- */
  let GL = null;

  async function initGL() {
    const canvas = $('#gl');
    let THREE, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
    try {
      THREE = await import('three');
      const mods = await Promise.all([
        import('three/addons/environments/RoomEnvironment.js'),
        import('three/addons/postprocessing/EffectComposer.js'),
        import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/UnrealBloomPass.js'),
        import('three/addons/postprocessing/OutputPass.js')
      ]);
      ({ RoomEnvironment } = mods[0]);
      ({ EffectComposer } = mods[1]);
      ({ RenderPass } = mods[2]);
      ({ UnrealBloomPass } = mods[3]);
      ({ OutputPass } = mods[4]);
    } catch (err) {
      console.warn('[gl] modules failed to load', err);
      canvas.style.display = 'none';
      return null;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (err) {
      console.warn('[gl] WebGL unavailable', err);
      canvas.style.display = 'none';
      return null;
    }
    const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(DPR);
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0b0d);
    scene.fog = new THREE.Fog(0x0a0b0d, 16, 34);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 0, 16);

    /* lights */
    const key = new THREE.DirectionalLight(0xfff1e0, 1.6);
    key.position.set(6, 7, 9);
    scene.add(key);
    const rim = new THREE.PointLight(0xff5b1f, 60, 30, 2);
    rim.position.set(-7, -2, -4);
    scene.add(rim);
    const fill = new THREE.PointLight(0x7fcfff, 22, 30, 2);
    fill.position.set(7, -5, 5);
    scene.add(fill);

    /* materials */
    const M = {
      steel: new THREE.MeshStandardMaterial({ color: 0xc3c8d0, metalness: 1, roughness: 0.3, envMapIntensity: 0.85 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x23272e, metalness: 0.85, roughness: 0.42, envMapIntensity: 0.6 }),
      orange: new THREE.MeshStandardMaterial({ color: 0xff5b1f, metalness: 0.4, roughness: 0.34, emissive: 0xff3a00, emissiveIntensity: 0.14, envMapIntensity: 0.8 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xd8a650, metalness: 1, roughness: 0.27, envMapIntensity: 0.9 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x9fd8ff, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }),
      glow: new THREE.MeshBasicMaterial({ color: 0xff7a3a }),
      glowRed: new THREE.MeshBasicMaterial({ color: 0xff3b2f })
    };
    M.glow.color.multiplyScalar(3);
    M.glowRed.color.multiplyScalar(3);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x7fcfff, transparent: true, opacity: 0 });
    const addEdges = (mesh, thresh = 28) => {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, thresh), edgeMat);
      mesh.add(e);
      return mesh;
    };

    /* gear geometry */
    function gearGeometry({ teeth, m = 0.1, depth = 0.34, hole = 0.16, spokes = false }) {
      const r = (m * teeth) / 2, ra = r + m, rd = r - 1.25 * m;
      const step = (Math.PI * 2) / teeth;
      const s = new THREE.Shape();
      let first = true;
      for (let i = 0; i < teeth; i++) {
        const a = i * step;
        const pts = [
          [rd, a - 0.5 * step], [rd, a - 0.3 * step], [r, a - 0.19 * step],
          [ra, a - 0.1 * step], [ra, a + 0.1 * step], [r, a + 0.19 * step], [rd, a + 0.3 * step]
        ];
        for (const [rr, aa] of pts) {
          const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr;
          if (first) { s.moveTo(x, y); first = false; } else s.lineTo(x, y);
        }
      }
      s.closePath();
      const h = new THREE.Path();
      h.absarc(0, 0, hole, 0, Math.PI * 2, true);
      s.holes.push(h);
      if (spokes) {
        const inner = hole + 0.24, outer = rd - 0.2;
        const pr = (inner + outer) / 2, hr = ((outer - inner) / 2) * 0.88;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          const p = new THREE.Path();
          p.absarc(Math.cos(a) * pr, Math.sin(a) * pr, hr, 0, Math.PI * 2, true);
          s.holes.push(p);
        }
      }
      const g = new THREE.ExtrudeGeometry(s, {
        depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.022, bevelSegments: 2, curveSegments: 18
      });
      g.translate(0, 0, -depth / 2);
      return g;
    }
    const cylZ = (r, len, seg = 32) => {
      const g = new THREE.CylinderGeometry(r, r, len, seg);
      g.rotateX(Math.PI / 2);
      return g;
    };

    /* rig & assembly */
    const rig = new THREE.Group();
    scene.add(rig);
    const assembly = new THREE.Group();
    assembly.position.set(0.15, -1.2, 0);
    rig.add(assembly);

    const parts = {};
    const addPart = (name, obj, off, rot = [0, 0, 0]) => {
      assembly.add(obj);
      parts[name] = { obj, base: obj.position.clone(), baseRot: obj.rotation.clone(), off: new THREE.Vector3(...off), rot: new THREE.Euler(...rot) };
      return obj;
    };

    // gear centres
    const zA = 40, zB = 16, zC = 24, mod = 0.1;
    const rA = (mod * zA) / 2, rB = (mod * zB) / 2, rC = (mod * zC) / 2;
    const phiB = -0.45, phiC = 2.55;
    const posA = new THREE.Vector2(0, 0);
    const posB = new THREE.Vector2(Math.cos(phiB) * (rA + rB), Math.sin(phiB) * (rA + rB));
    const posC = new THREE.Vector2(Math.cos(phiC) * (rA + rC), Math.sin(phiC) * (rA + rC));

    // Gear A — large spur
    const gearA = new THREE.Group();
    gearA.add(addEdges(new THREE.Mesh(gearGeometry({ teeth: zA, spokes: true, hole: 0.17 }), M.steel)));
    const hubA = new THREE.Mesh(cylZ(0.34, 0.5), M.dark);
    gearA.add(hubA);
    const keyA = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.52), M.orange);
    keyA.position.y = 0.2;
    gearA.add(keyA);
    gearA.position.set(posA.x, posA.y, 0);
    addPart('gearA', gearA, [0, 0, -0.5], [0, 0.15, 0]);

    // Gear B — orange pinion
    const gearB = new THREE.Group();
    gearB.add(addEdges(new THREE.Mesh(gearGeometry({ teeth: zB, hole: 0.15, depth: 0.42 }), M.orange)));
    gearB.add(new THREE.Mesh(cylZ(0.26, 0.6), M.dark));
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 8, 48), M.glow);
    ringB.position.z = 0.31;
    gearB.add(ringB);
    gearB.position.set(posB.x, posB.y, 0);
    addPart('gearB', gearB, [1.0, -0.6, 1.0], [0, -0.2, 0]);

    // Gear C — brass driven gear
    const gearC = new THREE.Group();
    gearC.add(addEdges(new THREE.Mesh(gearGeometry({ teeth: zC, spokes: true, hole: 0.15 }), M.brass)));
    gearC.add(new THREE.Mesh(cylZ(0.28, 0.5), M.dark));
    gearC.position.set(posC.x, posC.y, 0);
    addPart('gearC', gearC, [-0.7, 0.1, 0.4], [0, 0.2, 0]);

    // Shafts
    const shafts = new THREE.Group();
    [posA, posB, posC].forEach((p) => {
      const s = new THREE.Mesh(cylZ(0.13, 1.9), M.steel);
      s.position.set(p.x, p.y, 0.05);
      shafts.add(s);
      const collar = new THREE.Mesh(cylZ(0.2, 0.08), M.brass);
      collar.position.set(p.x, p.y, -0.42);
      shafts.add(collar);
    });
    addPart('shafts', shafts, [0, 0, -1.5]);

    // Crank disc on gear C shaft
    const rc = 0.45, rodL = 1.7, zCrank = 0.55, zRod = 0.74;
    const crank = new THREE.Group();
    crank.add(addEdges(new THREE.Mesh(cylZ(0.62, 0.16, 48), M.dark)));
    const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.17, 48, 1, false, Math.PI * 0.72, Math.PI * 0.56), M.orange);
    cw.rotation.x = Math.PI / 2;
    crank.add(cw);
    const pin = new THREE.Mesh(cylZ(0.085, 0.42), M.steel);
    pin.position.set(rc, 0, 0.18);
    crank.add(pin);
    crank.position.set(posC.x, posC.y, zCrank);
    addPart('crank', crank, [-0.6, 0.1, 1.6], [0, 0.25, 0]);

    // Connecting rod (built along +Y)
    const rod = new THREE.Group();
    const rodBar = new THREE.Mesh(new THREE.BoxGeometry(0.13, rodL - 0.2, 0.1), M.steel);
    rodBar.position.y = rodL / 2;
    rod.add(addEdges(rodBar));
    const eye1 = new THREE.Mesh(cylZ(0.15, 0.14), M.dark);
    const eye2 = new THREE.Mesh(cylZ(0.12, 0.14), M.dark);
    eye2.position.y = rodL;
    rod.add(eye1, eye2);
    rod.position.set(posC.x + rc, posC.y, zRod);
    addPart('rod', rod, [-0.9, 0.5, 2.5]);

    // Piston
    const piston = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.62, 48), M.steel);
    pBody.position.y = 0.12;
    piston.add(addEdges(pBody));
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.402, 0.012, 6, 48), M.dark);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.3 - i * 0.08;
      piston.add(ring);
    }
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 48), M.glow);
    crown.rotation.x = Math.PI / 2;
    crown.position.y = 0.44;
    piston.add(crown);
    const wrist = new THREE.Mesh(cylZ(0.07, 0.6), M.brass);
    piston.add(wrist);
    piston.position.set(posC.x, posC.y + 1.6, zRod);
    addPart('piston', piston, [0, 1.25, 1.6]);

    // Cylinder liner
    const liner = new THREE.Group();
    const linerH = 2.0, linerY = posC.y + 2.05;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, linerH, 48, 1, true), M.glass);
    liner.add(tube);
    const tubeEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.47, 0.47, linerH, 24, 4, true), 1),
      new THREE.LineBasicMaterial({ color: 0x7fcfff, transparent: true, opacity: 0.22 })
    );
    liner.add(tubeEdges);
    [-1, 1].forEach((sgn) => {
      const fl = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.045, 10, 48), M.brass);
      fl.rotation.x = Math.PI / 2;
      fl.position.y = (sgn * linerH) / 2;
      liner.add(fl);
    });
    liner.position.set(posC.x, linerY, zRod);
    addPart('liner', liner, [0, 2.1, 0.6]);

    // Mounting plate
    const plateShape = new THREE.Shape();
    const rr = 0.35, px0 = -4.25, px1 = 3.95, py0 = -2.65, py1 = 3.15;
    plateShape.moveTo(px0 + rr, py0);
    plateShape.lineTo(px1 - rr, py0);
    plateShape.quadraticCurveTo(px1, py0, px1, py0 + rr);
    plateShape.lineTo(px1, py1 - rr);
    plateShape.quadraticCurveTo(px1, py1, px1 - rr, py1);
    plateShape.lineTo(px0 + rr, py1);
    plateShape.quadraticCurveTo(px0, py1, px0, py1 - rr);
    plateShape.lineTo(px0, py0 + rr);
    plateShape.quadraticCurveTo(px0, py0, px0 + rr, py0);
    [posA, posB, posC].forEach((p) => {
      const h = new THREE.Path();
      h.absarc(p.x, p.y, 0.2, 0, Math.PI * 2, true);
      plateShape.holes.push(h);
    });
    const plateCorners = [[px0 + 0.4, py0 + 0.4], [px1 - 0.4, py0 + 0.4], [px0 + 0.4, py1 - 0.4], [px1 - 0.4, py1 - 0.4]];
    plateCorners.forEach(([x, y]) => {
      const h = new THREE.Path();
      h.absarc(x, y, 0.1, 0, Math.PI * 2, true);
      plateShape.holes.push(h);
    });
    const plateGeo = new THREE.ExtrudeGeometry(plateShape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1, curveSegments: 16 });
    const plate = new THREE.Group();
    plate.add(addEdges(new THREE.Mesh(plateGeo, M.dark), 40));
    // status LEDs on the plate (a nod to the Arduino builds)
    [[px1 - 0.45, py1 - 1.0, M.glowRed], [px1 - 0.45, py1 - 1.35, M.glow]].forEach(([x, y, mat]) => {
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), mat);
      led.position.set(x, y, 0.2);
      plate.add(led);
    });
    plate.position.set(0, 0, -0.72);
    addPart('plate', plate, [0, 0, -2.8], [0.1, -0.1, 0]);

    // Bolts
    const bolts = new THREE.Group();
    plateCorners.forEach(([x, y]) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 6), M.steel);
      b.rotation.x = Math.PI / 2;
      b.position.set(x, y, -0.48);
      bolts.add(b);
    });
    addPart('bolts', bolts, [0, 0, 3.6]);

    // HUD rings around the machine
    const rings = new THREE.Group();
    rig.add(rings);
    const mkRing = (r, opacity, dash) => {
      const pts = [];
      for (let i = 0; i <= 256; i++) { const a = (i / 256) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = dash
        ? new THREE.LineDashedMaterial({ color: 0xff5b1f, transparent: true, opacity, dashSize: 0.12, gapSize: 0.2 })
        : new THREE.LineBasicMaterial({ color: 0xecebe6, transparent: true, opacity });
      const l = new THREE.Line(g, mat);
      if (dash) l.computeLineDistances();
      return l;
    };
    const ring1 = mkRing(5.4, 0.35, true);
    const ring2 = mkRing(6.0, 0.08, false);
    rings.add(ring1, ring2);
    rings.position.z = -1.2;

    // Dust field
    const dustN = isMobile() ? 350 : 800;
    const dustPos = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 34;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      dustPos[i * 3 + 2] = -14 + Math.random() * 18;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9aa3b0, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false }));
    scene.add(dust);

    /* post-processing */
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(DPR);
    composer.setSize(innerWidth, innerHeight);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.55, 0.86);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    /* label anchors (assembly-local offsets from each part origin) */
    const anchorOffsets = {
      gearA: new THREE.Vector3(1.25, 1.1, 0.2), gearB: new THREE.Vector3(0.45, -0.45, 0.25), gearC: new THREE.Vector3(-0.85, 0.5, 0.2),
      crank: new THREE.Vector3(-0.45, -0.3, 0.1), rod: new THREE.Vector3(0, 0, 0), piston: new THREE.Vector3(0.4, 0.3, 0),
      liner: new THREE.Vector3(0.47, 0.6, 0), plate: new THREE.Vector3(3.6, -2.3, 0.1)
    };
    const labels = $$('.label').map((el) => ({ el, part: el.dataset.part, shown: -1, left: null }));

    /* state */
    const S = (o) => Object.assign({ px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, sc: 1, ex: 0, al: 1, sp: 1, ed: 0 }, o);
    const cur = S({ px: 3.3, py: -0.3, rx: 0.28, ry: -0.62, sc: 0.92 });
    let keys = [];
    let intro = 1;
    let anatomyProgress = 0;
    let labelsActive = false;

    function buildKeys(sections, anaST) {
      const H = innerHeight;
      const m = isMobile();
      const top = (el) => el.getBoundingClientRect().top + window.scrollY;
      const max = ScrollTrigger.maxScroll(window);
      const st = {
        hero: m ? S({ px: 0, py: 1.7, pz: -5, rx: 0.32, ry: -0.5, sc: 0.72, al: 0.7 })
                : S({ px: 3.3, py: -0.2, rx: 0.28, ry: -0.62, sc: 0.84, sp: 1 }),
        manifesto: S({ px: m ? 0 : 1.5, py: 0.2, pz: -5, rx: 0.95, ry: 0.4, rz: 0.25, sc: 1.05, al: 0.32, sp: 0.6, ex: 0.12 }),
        about: m ? S({ px: 0, py: 0, pz: -8, rx: 0.2, ry: -1.1, al: 0.2, sp: 0.7 })
                 : S({ px: -4.6, py: 0.2, pz: -7, rx: 0.2, ry: 0.9, sc: 1, al: 0.4, sp: 0.7 }),
        an0: S({ px: m ? 0 : 2.7, py: m ? -0.4 : -0.25, rx: 0.32, ry: -0.75, sc: m ? 0.6 : 0.82, sp: 0.8, ed: 0.15 }),
        an1: S({ px: m ? 0 : 2.9, py: m ? -0.5 : -0.45, rx: 0.36, ry: -0.98, sc: m ? 0.46 : 0.66, ex: 1, sp: 0.35, ed: 1 }),
        an2: S({ px: m ? 0 : 2.9, py: m ? -0.5 : -0.45, rx: 0.18, ry: -0.32, sc: m ? 0.46 : 0.66, ex: 1, sp: 0.45, ed: 1 }),
        gone: S({ px: m ? 0 : 2.9, py: 5, pz: -6, rx: 0.2, ry: 0.3, sc: 0.8, ex: 0.7, al: 0, sp: 0.5, ed: 0.6 }),
        pre: S({ px: 0, py: -5, pz: -6, rx: 0.6, ry: -0.6, ex: 0.6, al: 0, sp: 1 }),
        contact: m ? S({ px: 0, py: -1.4, pz: -6, rx: 0.35, ry: -0.5, al: 0.45, sp: 2.4 })
                   : S({ px: 3.8, py: -0.3, pz: -2.5, rx: 0.35, ry: -0.5, al: 0.6, sp: 2.4 })
      };
      const k = [
        { p: 0, s: st.hero },
        { p: H * 0.15, s: st.hero },
        { p: top(sections.manifesto) + H * 0.25, s: st.manifesto },
        { p: top(sections.about) + H * 0.1, s: st.about },
        { p: anaST.start, s: st.an0 },
        { p: anaST.start + (anaST.end - anaST.start) * 0.5, s: st.an1 },
        { p: anaST.end - H * 0.05, s: st.an2 },
        { p: anaST.end + H * 0.75, s: st.gone },
        { p: top(sections.contact) - H * 0.9, s: st.pre },
        { p: Math.min(top(sections.contact) + H * 0.15, max), s: st.contact }
      ];
      for (let i = 1; i < k.length; i++) if (k[i].p <= k[i - 1].p) k[i].p = k[i - 1].p + 1;
      keys = k;
    }

    const ease = (t) => t * t * (3 - 2 * t);
    const target = S({});
    function sample(y) {
      if (!keys.length) return cur;
      if (y <= keys[0].p) return keys[0].s;
      for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i], b = keys[i + 1];
        if (y < b.p) {
          const t = ease((y - a.p) / (b.p - a.p));
          for (const key in a.s) target[key] = lerp(a.s[key], b.s[key], t);
          return target;
        }
      }
      return keys[keys.length - 1].s;
    }

    /* pointer parallax */
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    window.addEventListener('pointermove', (e) => {
      mouse.x = (e.clientX / innerWidth) * 2 - 1;
      mouse.y = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });

    /* resize */
    function resize() {
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      bloom.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);

    /* animation */
    let angle = 0;
    let spin = 0;
    const v3 = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    const stepB = (Math.PI * 2) / zB, stepC = (Math.PI * 2) / zC;
    const rpmEl = $('.rpm');
    const explodeEl = $('.explode-pct');
    let rpmTick = 0;

    function frame(time, dtMs) {
      const dt = Math.min(dtMs / 1000, 0.05);
      const s = sample(window.scrollY);
      const k = 1 - Math.pow(0.0009, dt); // frame-rate independent damping
      for (const key in cur) cur[key] = lerp(cur[key], s[key], k);

      const alpha = clamp(cur.al, 0, 1);
      canvas.style.opacity = alpha.toFixed(3);

      // explode amount (intro assembles from exploded state)
      const ex = clamp(Math.max(cur.ex, intro), 0, 1);
      const exE = ex * ex * (3 - 2 * ex);

      // spin, driven by state speed and scroll velocity
      const targetSpin = 0.55 * cur.sp + clamp(scrollVel() * 0.02, -3, 3);
      spin = lerp(spin, targetSpin, 1 - Math.pow(0.02, dt));
      angle += spin * dt;

      if (rpmEl && ++rpmTick % 6 === 0) {
        const rpm = Math.abs(spin) * (60 / (Math.PI * 2)) * (zA / zB) * 40;
        rpmEl.textContent = String(Math.round(rpm)).padStart(4, '0');
      }
      if (explodeEl && labelsActive) explodeEl.textContent = String(Math.round(cur.ex * 100)).padStart(3, '0') + '%';

      // gear kinematics (meshing phase-correct)
      const thA = angle;
      const thB = phiB + Math.PI - 0.5 * stepB + (phiB - thA) * (zA / zB);
      const thC = phiC + Math.PI - 0.5 * stepC + (phiC - thA) * (zA / zC);
      gearA.rotation.z = thA;
      gearB.rotation.z = thB;
      gearC.rotation.z = thC;
      crank.rotation.z = thC;

      // crank-slider kinematics
      const cpx = posC.x + Math.cos(thC) * rc;
      const cpy = posC.y + Math.sin(thC) * rc;
      const dx = posC.x - cpx;
      const pinY = cpy + Math.sqrt(rodL * rodL - dx * dx);
      rod.position.set(cpx, cpy, zRod);
      rod.rotation.z = Math.atan2(pinY - cpy, posC.x - cpx) - Math.PI / 2;
      piston.position.set(posC.x, pinY, zRod);
      parts.rod.base.copy(rod.position);
      parts.piston.base.copy(piston.position);

      // apply exploded offsets
      for (const name in parts) {
        const p = parts[name];
        p.obj.position.set(
          p.base.x + p.off.x * exE,
          p.base.y + p.off.y * exE,
          p.base.z + p.off.z * exE
        );
        if (name !== 'gearA' && name !== 'gearB' && name !== 'gearC' && name !== 'crank' && name !== 'rod') {
          p.obj.rotation.set(p.baseRot.x + p.rot.x * exE, p.baseRot.y + p.rot.y * exE, p.baseRot.z);
        } else {
          p.obj.rotation.x = p.rot.x * exE;
          p.obj.rotation.y = p.rot.y * exE;
        }
      }
      edgeMat.opacity = clamp(cur.ed, 0, 1) * 0.55;

      // rig transform + mouse parallax
      mouse.sx = lerp(mouse.sx, mouse.x, 1 - Math.pow(0.05, dt));
      mouse.sy = lerp(mouse.sy, mouse.y, 1 - Math.pow(0.05, dt));
      rig.position.set(cur.px, cur.py, cur.pz);
      rig.rotation.set(cur.rx + mouse.sy * 0.12, cur.ry + mouse.sx * 0.2, cur.rz);
      rig.scale.setScalar(cur.sc);
      rings.rotation.z = time * 0.08;
      ring1.rotation.z = -time * 0.15;

      dust.rotation.y = time * 0.01;
      dust.position.y = window.scrollY * 0.0015;

      camera.position.x = lerp(camera.position.x, mouse.sx * 0.4, 0.05);
      camera.position.y = lerp(camera.position.y, -mouse.sy * 0.3, 0.05);
      camera.lookAt(0, 0, 0);

      // projected callout labels
      const show = labelsActive ? clamp((cur.ex - 0.45) / 0.3, 0, 1) * alpha : 0;
      if (show > 0.001 || labels.some((l) => l.shown !== 0)) {
        scene.updateMatrixWorld();
        const W = innerWidth, H = innerHeight;
        labels.forEach((l, i) => {
          const p = parts[l.part];
          const o = Math.round(clamp(show * 1.6 - i * 0.07, 0, 1) * 100) / 100;
          if (o !== l.shown) { l.el.style.opacity = o; l.shown = o; }
          if (o <= 0) return;
          v3.copy(p.obj.position).add(anchorOffsets[l.part]);
          assembly.localToWorld(v3);
          v3.project(camera);
          const x = (v3.x * 0.5 + 0.5) * W;
          const y = (-v3.y * 0.5 + 0.5) * H;
          const left = x < W * (isMobile() ? 0.5 : 0.62) || x > W - 260;
          if (left !== l.left) { l.el.classList.toggle('is-left', left); l.left = left; }
          l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        });
      }

      if (alpha > 0.005) composer.render();
    }

    return {
      frame,
      buildKeys,
      assemble() {
        gsap.to({ v: 1 }, {
          v: 0, duration: 2.6, ease: 'expo.inOut',
          onUpdate() { intro = this.targets()[0].v; }
        });
        gsap.fromTo(camera, { fov: 46 }, { fov: 32, duration: 2.8, ease: 'expo.inOut', onUpdate: () => camera.updateProjectionMatrix() });
      },
      setAnatomy(p, active) { anatomyProgress = p; labelsActive = active; },
      get anatomyProgress() { return anatomyProgress; }
    };
  }

  /* -------------------------------------------------------
     SCROLL CHOREOGRAPHY
     ------------------------------------------------------- */
  const sections = {
    hero: $('.hero'), manifesto: $('.manifesto'), about: $('.about'),
    anatomy: $('.anatomy'), builds: $('.builds'), contact: $('.contact')
  };

  // Hero rows drift apart
  gsap.to('.row-1', { xPercent: -16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.row-2', { xPercent: 16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to(['.hero-foot', '.hero-hud', '.hero-kicker'], { opacity: 0, y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: '80% top', scrub: true } });

  // Manifesto words light up
  gsap.to(manifestoWords, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.manifesto-text', start: 'top 80%', end: 'bottom 50%', scrub: true }
  });

  // Headline reveals
  revealHeads.forEach(({ el, chars }) => {
    gsap.from(chars, {
      yPercent: 110, rotate: 6, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.018,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
  $$('.reveal-up').filter((el) => !el.closest('.hero')).forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  // Stat counters
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const start = end > 1000 ? end - 30 : 0;
    const o = { v: start };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'expo.out', onUpdate: () => { el.textContent = String(Math.round(o.v)).padStart(end < 10 ? 2 : 1, '0'); } })
    });
  });

  /* ----- ID card: lanyard swing, tilt, flip ----- */
  (function idCard() {
    const card = $('.card'), lanyard = $('.lanyard'), front = $('.card-front');
    if (!card) return;
    const cs = { flip: -180, click: 0, tx: 0, ty: 0, ttx: 0, tty: 0, swing: 0, sv: 0 };
    gsap.fromTo(cs, { flip: -200 }, {
      flip: 0, ease: 'none',
      scrollTrigger: { trigger: '.about', start: 'top 90%', end: 'top 15%', scrub: 1 }
    });
    card.addEventListener('click', () => {
      gsap.to(cs, { click: cs.click + 180, duration: 1.4, ease: 'expo.out' });
    });
    let lastX = null;
    sections.about.addEventListener('pointermove', (e) => {
      if (lastX !== null) cs.sv += clamp((e.clientX - lastX) * 0.025, -1.2, 1.2);
      lastX = e.clientX;
    });
    sections.about.addEventListener('pointerleave', () => { lastX = null; });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      cs.tty = (nx - 0.5) * 22;
      cs.ttx = -(ny - 0.5) * 18;
      front.style.setProperty('--mx', (nx * 100).toFixed(1) + '%');
      front.style.setProperty('--my', (ny * 100).toFixed(1) + '%');
      front.style.setProperty('--hx', (nx * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', () => { cs.ttx = 0; cs.tty = 0; });
    gsap.ticker.add((time) => {
      cs.sv += -cs.swing * 0.04;
      cs.sv *= 0.93;
      cs.swing = clamp(cs.swing + cs.sv, -28, 28);
      cs.tx = lerp(cs.tx, cs.ttx, 0.1);
      cs.ty = lerp(cs.ty, cs.tty, 0.1);
      const idle = reduceMotion ? 0 : Math.sin(time * 1.1) * 1.2;
      lanyard.style.transform = `rotate(${(cs.swing + idle).toFixed(2)}deg)`;
      card.style.transform = `rotateX(${cs.tx.toFixed(2)}deg) rotateY(${(cs.flip + cs.click + cs.ty).toFixed(2)}deg)`;
    });
  })();

  /* ----- Anatomy (pinned) ----- */
  const steps = $$('.anatomy .step');
  let activeStep = 0;
  const anatomyST = ScrollTrigger.create({
    trigger: sections.anatomy,
    start: 'top top',
    end: () => '+=' + Math.round(innerHeight * 2.6),
    pin: true,
    onUpdate(self) {
      const p = self.progress;
      const idx = p < 0.3 ? 0 : p < 0.72 ? 1 : 2;
      if (idx !== activeStep) {
        steps[activeStep].classList.remove('is-active');
        steps[idx].classList.add('is-active');
        activeStep = idx;
      }
      if (GL) GL.setAnatomy(p, self.isActive);
    },
    onToggle(self) { if (GL) GL.setAnatomy(self.progress, self.isActive); }
  });

  /* ----- Builds: horizontal track ----- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('.builds-track');
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: sections.builds, start: 'top top', end: () => '+=' + dist(),
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1
      }
    });
    $$('.build').forEach((b) => {
      const ca = { trigger: b, containerAnimation: tween };
      gsap.fromTo(b.querySelector('.cover-img'), { clipPath: 'inset(0% 100% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { ...ca, start: 'left 95%', end: 'left 35%', scrub: true }
      });
      b.querySelectorAll('.cover-img img').forEach((img) => {
        gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { ...ca, start: 'left right', end: 'right left', scrub: true } });
      });
      gsap.fromTo(b.querySelector('.g1'), { rotation: -40 }, { rotation: 140, ease: 'none', scrollTrigger: { ...ca, start: 'left right', end: 'right left', scrub: true } });
      gsap.fromTo(b.querySelector('.g2'), { rotation: 80 }, { rotation: -380, ease: 'none', scrollTrigger: { ...ca, start: 'left right', end: 'right left', scrub: true } });
      gsap.from(b.querySelectorAll('.spec > *'), {
        x: 80, opacity: 0, stagger: 0.08, ease: 'none', scrollTrigger: { ...ca, start: 'left 75%', end: 'left 25%', scrub: true }
      });
      const callout = b.querySelector('.detail-callout');
      if (callout) gsap.from(callout, { scale: 0, rotate: -90, ease: 'none', scrollTrigger: { ...ca, start: 'left 45%', end: 'left 15%', scrub: true } });
      gsap.from(b.querySelector('.title-block'), { yPercent: 120, opacity: 0, ease: 'none', scrollTrigger: { ...ca, start: 'left 70%', end: 'left 40%', scrub: true } });
    });
    gsap.from('.builds-intro > *', { y: 60, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: sections.builds, start: 'top 70%' } });
    return () => gsap.set(track, { clearProps: 'transform' });
  });
  mm.add('(max-width: 900px)', () => {
    $$('.build').forEach((b) => {
      gsap.fromTo(b.querySelector('.cover-img'), { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: b, start: 'top 85%', end: 'top 30%', scrub: true }
      });
      gsap.fromTo(b.querySelector('.g1'), { rotation: 0 }, { rotation: 180, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo(b.querySelector('.g2'), { rotation: 0 }, { rotation: -400, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from(b.querySelectorAll('.spec > *'), { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: b.querySelector('.spec'), start: 'top 85%' } });
    });
  });

  /* ----- Gauges ----- */
  $$('.gauge').forEach((g) => {
    const svg = g.querySelector('svg');
    const ticksG = svg.querySelector('.ticks');
    const R = 78;
    const pt = (deg, r) => {
      const a = (deg * Math.PI) / 180;
      return [100 + Math.sin(a) * r, 100 - Math.cos(a) * r];
    };
    let ticks = '';
    for (let i = 0; i <= 27; i++) {
      const deg = -135 + (270 / 27) * i;
      const major = i % 3 === 0;
      const [x1, y1] = pt(deg, major ? 84 : 88);
      const [x2, y2] = pt(deg, 94);
      ticks += `<line class="${major ? 'major' : ''}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
    }
    ticksG.innerHTML = ticks;
    const [sx, sy] = pt(-135, R), [ex, ey] = pt(135, R);
    const d = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R} ${R} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
    const bg = svg.querySelector('.arc-bg'), fg = svg.querySelector('.arc-fg');
    bg.setAttribute('d', d);
    fg.setAttribute('d', d);
    const len = fg.getTotalLength();
    gsap.set(fg, { strokeDasharray: len, strokeDashoffset: len });
    const needle = svg.querySelector('.needle');
    gsap.set(needle, { rotation: -135, svgOrigin: '100 100' });
    const v = +g.dataset.value;
    const toAngle = -135 + 270 * v;
    ScrollTrigger.create({
      trigger: g, start: 'top 85%', once: true,
      onEnter: () => {
        gsap.to(needle, { rotation: toAngle, svgOrigin: '100 100', duration: 2.2, ease: 'elastic.out(1, 0.45)', delay: Math.random() * 0.3 });
        gsap.to(fg, { strokeDashoffset: len * (1 - v), duration: 1.8, ease: 'expo.out' });
      }
    });
    g.addEventListener('mouseenter', () => {
      gsap.timeline()
        .to(needle, { rotation: 128, svgOrigin: '100 100', duration: 0.35, ease: 'power3.out' })
        .to(needle, { rotation: toAngle, svgOrigin: '100 100', duration: 1.6, ease: 'elastic.out(1, 0.35)' });
    });
  });

  /* ----- Timeline ----- */
  gsap.fromTo('.timeline-line', { scaleY: 0 }, {
    scaleY: 1, transformOrigin: '50% 0%', ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true }
  });
  $$('.t-item').forEach((el) => {
    gsap.from(el, { x: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 82%' } });
  });

  /* ----- Contact ----- */
  gsap.from('.c-line', {
    yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.contact-title', start: 'top 80%' }
  });
  gsap.from(['.big-btn', '.contact-links a'], {
    y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.contact-row', start: 'top 90%' }
  });

  /* ----- HUD ----- */
  const hudSection = $('.hud-section'), hudPct = $('.hud-pct'), hudBar = $('.hud-bar i');
  const hudSecs = $$('[data-hud]');
  hudSecs.forEach((s, i) => {
    ScrollTrigger.create({
      trigger: s, start: 'top 50%',
      onEnter: () => { hudSection.textContent = s.dataset.hud; },
      onLeaveBack: () => { hudSection.textContent = hudSecs[Math.max(0, i - 1)].dataset.hud; }
    });
  });

  /* ----- Velocity marquee ----- */
  const marquees = $$('.marquee-row').map((row, i) => ({ el: row.querySelector('.marquee-inner'), x: i ? -50 : 0, dir: i ? 1 : -1 }));
  let skew = 0;

  /* ----- Project 01: detection toggle + sonar ----- */
  (function sensor() {
    const box = $('.toggle-img'), tag = box && box.querySelector('.detect-tag b'), cm = $('.sonar-cm');
    if (!box) return;
    const o = { d: 12 };
    let detected = true;
    const set = () => {
      detected = !detected;
      box.classList.toggle('is-off', !detected);
      tag.textContent = detected ? 'OBJECT DETECTED' : 'PATH CLEAR';
      gsap.to(o, { d: detected ? 8 + Math.random() * 8 : 70 + Math.random() * 60, duration: 1.1, ease: 'power3.inOut', onUpdate: () => { cm.textContent = String(Math.round(o.d)).padStart(3, '0'); } });
    };
    if (!reduceMotion) setInterval(set, 2600);
  })();

  /* ----- Project 03: PWM dimmer ----- */
  (function dimmer() {
    const pot = $('#pot');
    if (!pot) return;
    const raw = $('.d-raw'), pwm = $('.d-pwm'), wrap = $('.dimmer');
    const upd = () => {
      const v = +pot.value;
      const b = Math.floor((v * 255) / 1023);
      raw.textContent = v;
      pwm.textContent = b;
      wrap.style.setProperty('--b', (0.08 + (b / 255) * 0.92).toFixed(3));
      pot.style.setProperty('--p', ((v / 1023) * 100).toFixed(1) + '%');
    };
    pot.addEventListener('input', upd);
    upd();
  })();

  /* ----- Cursor ----- */
  (function cursor() {
    if (isTouch) return;
    const c = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-label'), xy = $('.cursor-xy');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    const xx = gsap.quickTo(xy, 'x', { duration: 0.6, ease: 'power3' });
    const xyy = gsap.quickTo(xy, 'y', { duration: 0.6, ease: 'power3' });
    let seen = false;
    window.addEventListener('pointermove', (e) => {
      if (!seen) { seen = true; gsap.to(c, { opacity: 1, duration: 0.4 }); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      xx(e.clientX + 26); xyy(e.clientY + 22);
      xy.textContent = `X ${String(Math.round(e.clientX)).padStart(4, '0')} · Y ${String(Math.round(e.clientY + window.scrollY)).padStart(5, '0')}`;
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, input, [data-magnetic]');
      c.classList.toggle('is-label', !!lab);
      c.classList.toggle('is-hover', !lab && !!hov);
      if (lab) label.textContent = lab.dataset.cursor;
    });
    document.addEventListener('pointerleave', () => gsap.to(c, { opacity: 0, duration: 0.3 }));
    document.addEventListener('pointerenter', () => gsap.to(c, { opacity: 1, duration: 0.3 }));
  })();

  /* ----- Magnetic elements ----- */
  if (!isTouch) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ----- Text scramble ----- */
  const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ΣΩ∆';
  $$('[data-scramble]').forEach((el) => {
    const original = el.textContent;
    let raf = null;
    el.addEventListener('mouseenter', () => {
      cancelAnimationFrame(raf);
      let f = 0;
      const total = 18;
      const run = () => {
        el.textContent = original.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          return i < (f / total) * original.length ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }).join('');
        if (++f <= total) raf = requestAnimationFrame(run);
        else el.textContent = original;
      };
      run();
    });
  });

  /* ----- Clock ----- */
  const clock = $('.clock');
  const tickClock = () => {
    try { clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }); }
    catch (e) { clock.textContent = new Date().toLocaleTimeString(); }
  };
  tickClock();
  setInterval(tickClock, 1000);

  /* -------------------------------------------------------
     MAIN TICKER
     ------------------------------------------------------- */
  gsap.ticker.add((time, deltaTime) => {
    // HUD progress
    const max = ScrollTrigger.maxScroll(window) || 1;
    const p = clamp(window.scrollY / max, 0, 1);
    hudPct.textContent = String(Math.round(p * 100)).padStart(3, '0');
    hudBar.style.transform = `scaleX(${p})`;

    // marquee
    const v = scrollVel();
    skew = lerp(skew, clamp(v * 0.25, -10, 10), 0.1);
    marquees.forEach((m) => {
      if (v !== 0) m.dir = (v > 0 ? -1 : 1) * (m === marquees[1] ? -1 : 1);
      const speed = 0.02 + Math.min(Math.abs(v) * 0.01, 0.6);
      m.x += speed * m.dir * (deltaTime / 16.67);
      if (m.x <= -50) m.x += 50;
      if (m.x > 0) m.x -= 50;
      m.el.style.transform = `translate3d(${m.x}%,0,0) skewX(${(-skew).toFixed(2)}deg)`;
    });

    if (GL) GL.frame(time, deltaTime);
  });

  /* -------------------------------------------------------
     PRELOADER → INTRO
     ------------------------------------------------------- */
  const preNum = $('.pre-num'), preBar = $('.pre-bar i'), preStatus = $('.pre-status');
  const counter = { v: 0 };
  const renderCount = () => {
    preNum.textContent = String(Math.round(counter.v)).padStart(3, '0');
    preBar.style.transform = `scaleX(${counter.v / 100})`;
  };
  gsap.from('.pre-log p', { width: 0, opacity: 0, duration: 0.8, stagger: 0.45, ease: 'power2.out' });
  const countTween = gsap.to(counter, { v: 86, duration: 2.0, ease: 'power2.out', onUpdate: renderCount });

  const imgsLoaded = Promise.all($$('img').map((img) => img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; })));
  const timeout = (ms) => new Promise((r) => setTimeout(r, ms));

  const glPromise = initGL().then((g) => { GL = g; return g; }).catch((e) => { console.warn(e); return null; });

  Promise.race([
    Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), imgsLoaded, glPromise, timeout(1800)]),
    timeout(9000)
  ]).then(() => {
    countTween.kill();
    preStatus.textContent = 'READY';
    const refreshKeys = () => { if (GL) GL.buildKeys(sections, anatomyST); };
    ScrollTrigger.addEventListener('refresh', refreshKeys);

    const tl = gsap.timeline();
    tl.to(counter, { v: 100, duration: 0.6, ease: 'power2.inOut', onUpdate: renderCount })
      .to('.pre-count', { yPercent: -60, opacity: 0, duration: 0.7, ease: 'expo.in' })
      .to('.pre-gear', { scale: 2.2, opacity: 0, duration: 0.9, ease: 'expo.in' }, '<')
      .to(['.pre-top', '.pre-bottom'], { opacity: 0, duration: 0.4 }, '<')
      .to('.preloader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'expo.inOut' }, '-=0.15')
      .add(() => { if (GL) GL.assemble(); }, '<-0.1')
      .from('.hero-title .char', { yPercent: 115, duration: 1.5, ease: 'expo.out', stagger: 0.045 }, '-=0.55')
      .from('.hero-kicker > *', { y: 20, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out' }, '<0.25')
      .from('.hero .reveal-up', { y: 30, opacity: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out' }, '<0.1')
      .from('.hero-hud > div', { x: 30, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out' }, '<')
      .from(['.nav', '.hud'], { opacity: 0, duration: 1.2, ease: 'power2.out' }, '<')
      .add(() => {
        $('.preloader').remove();
        document.body.classList.remove('is-loading');
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }, '-=1.2');

    gsap.set('.preloader', { clipPath: 'inset(0% 0% 0% 0%)' });
    ScrollTrigger.refresh();
  });
})();
