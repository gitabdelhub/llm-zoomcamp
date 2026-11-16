// Les illustrations du site : des formes géométriques plates et vives, façon affiche.
// window.ART.svg(seed, bg, opts) rend une composition différente pour chaque module.
// Les formes marquées "spin" ou "drift" bougent lentement (rien si l'utilisateur a demandé moins d'animations).
(function () {
  const C = {
    lav: "#c8bcff", magenta: "#ff24bd", green: "#1fc16b", lime: "#e4ff97", blue: "#4d49fc",
    black: "#0a0a0a", orange: "#ff7a2f", sky: "#4cc2ff", yellow: "#ffd23f", cream: "#f6ffe6", white: "#ffffff"
  };
  // Petit générateur pseudo-aléatoire : la même graine donne toujours le même dessin.
  function rng(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  // Chaque forme est dessinée dans une case de 100 x 100, centrée en (50, 50).
  const SHAPES = {
    hex: c => `<polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="${c}"/><circle cx="50" cy="50" r="13" fill="${C.black}"/>`,
    asterisk: c => `<g class="spin" stroke="${c}" stroke-width="13" stroke-linecap="round">${[0, 45, 90, 135].map(a => `<line x1="50" y1="12" x2="50" y2="88" transform="rotate(${a} 50 50)"/>`).join("")}</g>`,
    flower: c => {
      let d = "";
      for (let i = 0; i <= 96; i++) { const t = i / 96 * Math.PI * 2, r = 34 + 9 * Math.sin(t * 8); d += (i ? "L" : "M") + (50 + r * Math.cos(t)).toFixed(1) + " " + (50 + r * Math.sin(t)).toFixed(1); }
      return `<g class="spin slow"><path d="${d}Z" fill="${c}" stroke="${C.black}" stroke-width="3"/><path d="M50 30 Q60 50 50 70 Q40 50 50 30Z M30 50 Q50 40 70 50 Q50 60 30 50Z" fill="none" stroke="${C.black}" stroke-width="3"/></g>`;
    },
    checker: (c, c2) => {
      let s = "";
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) s += `<rect x="${x * 25}" y="${y * 25}" width="25" height="25" fill="${(x + y) % 2 ? c : c2}"/>`;
      return `<g class="drift">${s}</g>`;
    },
    blob: c => `<g fill="${c}"><rect x="22" y="22" width="56" height="56"/>${[[30, 30], [70, 30], [30, 70], [70, 70], [50, 14], [50, 86], [14, 50], [86, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14"/>`).join("")}</g>`,
    dot: c => `<circle cx="50" cy="50" r="44" fill="${c}"/><circle cx="50" cy="50" r="15" fill="${C.black}"/>`,
    half: c => `<path d="M6 70 A44 44 0 0 1 94 70Z" fill="${c}"/><rect x="6" y="74" width="88" height="10" fill="${C.black}"/>`,
    hatch: c => `<g stroke="${c}" stroke-width="3">${[0, 1, 2, 3, 4, 5, 6].map(i => `<line x1="${i * 16 - 10}" y1="100" x2="${i * 16 + 30}" y2="0"/>`).join("")}</g>`,
    arc: c => `<g class="spin slow" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round"><path d="M20 50 A30 30 0 1 1 50 80"/></g>`,
    pill: c => `<rect x="8" y="30" width="84" height="40" rx="20" fill="${c}"/><circle cx="72" cy="50" r="12" fill="${C.white}"/>`
  };

  // Une composition : 5 cases posées en quinconce sur un fond coloré, comme une affiche.
  function svg(seed, bg, opts) {
    opts = opts || {};
    const r = rng(seed || 1);
    const W = opts.w || 400, H = opts.h || 260;
    const kinds = ["hex", "asterisk", "flower", "checker", "blob", "dot", "half", "arc", "pill"];
    const fills = [C.magenta, C.green, C.blue, C.black, C.orange, C.sky, C.yellow, C.lime];
    const tiles = [C.black, C.green, C.lime, C.white, C.magenta, C.cream];
    // Positions fixes, puis on décale un peu au hasard.
    const slots = [[0.08, 0.30, 0.30], [0.30, 0.48, 0.34], [0.36, 0.08, 0.30], [0.58, 0.36, 0.32], [0.70, 0.04, 0.34]];
    let out = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true" class="art"><rect width="${W}" height="${H}" fill="${bg || C.lav}"/>`;
    // Les hachures de fond
    out += `<g opacity=".55" transform="translate(${(W * .45).toFixed(0)} ${(H * .35).toFixed(0)}) scale(${(H * .006).toFixed(2)})">${SHAPES.hatch(C.lime === bg ? C.black : C.lime)}</g>`;
    const used = new Set();
    slots.forEach(([x, y, s], i) => {
      let k = pick(r, kinds); let guard = 0;
      while (used.has(k) && guard++ < 10) k = pick(r, kinds);
      used.add(k);
      const size = s * H * (0.9 + r() * 0.25);
      const px = x * W + (r() - .5) * W * .04, py = y * H + (r() - .5) * H * .05;
      let f = pick(r, fills); if (f === bg) f = C.black;
      const tile = r() < .55 ? pick(r, tiles.filter(t => t !== f && t !== bg)) : null;
      const sc = (size / 100).toFixed(3);
      out += `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${sc})"><g style="transform-origin:50px 50px;transform-box:fill-box">`;
      if (tile) out += `<rect x="-6" y="-6" width="112" height="112" rx="${r() < .5 ? 0 : 18}" fill="${tile}"/>`;
      out += SHAPES[k](f, f === C.cream ? C.green : C.cream) + `</g></g>`;
      if (i === 2 && r() < .7) out += `<rect x="${(px + size * .1).toFixed(1)}" y="${(py + size * 1.08).toFixed(1)}" width="${(size * .12).toFixed(1)}" height="${(size * .12).toFixed(1)}" fill="${C.black}"/>`;
    });
    return out + "</svg>";
  }


  // ---------- Les couvertures des modules : les vrais logos des outils + un dessin de ce qu'on apprend ----------
  // Tout est dessiné dans une case de 400 x 260. À gauche, les logos (tuiles blanches, ombre noire).
  // Au centre et à droite, la scène du module. Le coin bas-droit reste libre pour le grand numéro de la carte.
  const K = C.black, W = C.white;
  const T = (x, y, t, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-family="Geist Mono,ui-monospace,monospace" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || K}"${o.a ? ` text-anchor="${o.a}"` : ""}>${t}</text>`; };
  const R = (x, y, w, h, f, o) => { o = o || {}; return `<rect x="${x}" y="${y}" width="${w}" height="${h}"${o.r ? ` rx="${o.r}"` : ""} fill="${f}"${o.st === 0 ? "" : ` stroke="${K}" stroke-width="${o.st || 3}"`}/>`; };
  const head = (x, y, a, c) => `<polygon points="0,-6 12,0 0,6" fill="${c || K}" transform="translate(${x} ${y}) rotate(${a})"/>`;
  const star = (x, y, r, f) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; d += (i ? "L" : "M") + (x + q * Math.cos(a)).toFixed(1) + " " + (y + q * Math.sin(a)).toFixed(1); } return `<path d="${d}Z" fill="${f}" stroke="${K}" stroke-width="2"/>`; };
  const ast = (x, y, s, c) => `<g transform="translate(${x - s / 2} ${y - s / 2}) scale(${s / 100})"><g style="transform-origin:50px 50px;transform-box:fill-box">${SHAPES.asterisk(c)}</g></g>`;

  // Une tuile de logo. lg = [nom de l'icône, couleur]. Les logos viennent de assets/icons.js.
  function tile(x, y, s, lg, rot, wide) {
    const I = typeof ICONS !== "undefined" && ICONS[lg[0]]; if (!I) return "";
    const w = wide ? s * 1.75 : s, p = s * .19, iw = w - 2 * p, ih = s - 2 * p;
    let g = `<g transform="rotate(${rot || 0} ${x + w / 2} ${y + s / 2})">${R(x + 5, y + 5, w, s, K, { st: 0 })}${R(x, y, w, s, W, { st: 2.5 })}`;
    if (I.img) g += `<image href="${I.img}" x="${x + p}" y="${y + p}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet"/>`;
    else if (I.raw) g += `<svg x="${x + p}" y="${y + p}" width="${iw}" height="${ih}" viewBox="${I.vb}" style="color:${K}">${I.raw}</svg>`;
    else g += `<svg x="${x + p}" y="${y + p}" width="${iw}" height="${ih}" viewBox="${I.vb}"><path fill="${lg[1] || K}" d="${I.d}"/></svg>`;
    return g + "</g>";
  }
  function doc(x, y, rot, f) {
    return `<g transform="rotate(${rot} ${x + 33} ${y + 42})">${R(x, y, 66, 84, f || W)}${[16, 28, 40, 52].map((dy, i) => R(x + 12, y + dy, i === 3 ? 26 : 42, 4, K, { st: 0 })).join("")}</g>`;
  }
  const flow = (d, c, w) => `<path class="flow" d="${d}" fill="none" stroke="${c || K}" stroke-width="${w || 3}" stroke-dasharray="7 6" stroke-linecap="round"/>`;

  // Zones à laisser libres sur les cartes : en haut à droite (le badge) et en bas à droite (le numéro).
  const SCENES = {
    // 01 : les documents, la recherche, le modèle qui répond, et l'outil qu'il appelle (l'agent)
    rag: () => doc(132, 62, -9, C.cream) + doc(146, 56, 0) + doc(160, 64, 9) +
      `<circle cx="212" cy="136" r="25" fill="${C.lime}" stroke="${K}" stroke-width="6"/><line x1="230" y1="154" x2="250" y2="176" stroke="${K}" stroke-width="10" stroke-linecap="round"/>` +
      flow("M236 116 C250 100 256 98 262 98") + head(264, 98, 0) +
      R(270, 60, 112, 74, K, { r: 18, st: 0 }) + `<path d="M282 132 L268 152 L306 132Z" fill="${K}"/>` + ast(304, 97, 44, C.blue) +
      R(334, 80, 34, 6, W, { st: 0 }) + R(334, 94, 26, 6, W, { st: 0 }) + R(334, 108, 36, 6, W, { st: 0 }) +
      R(290, 144, 86, 26, W, { r: 13 }) + T(333, 162, "search()", { a: "middle" }) +
      `<path d="M384 100 C396 116 396 140 380 150" fill="none" stroke="${C.magenta}" stroke-width="4"/>` + head(378, 152, 150, C.magenta),
    // 02 : des points dans l'espace des vecteurs ; ta question tombe près des documents qui ont le même sens
    vectors: () => `<path d="M140 196 L140 50 M140 196 L292 196" stroke="${K}" stroke-width="3" fill="none"/>` + head(140, 46, -90) + head(296, 196, 0) +
      [[172, 72], [192, 62], [188, 92], [208, 80], [166, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${C.magenta}" stroke="${K}" stroke-width="2"/>`).join("") +
      [[214, 168], [236, 158], [244, 178], [222, 184], [198, 178]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${C.green}" stroke="${K}" stroke-width="2"/>`).join("") +
      `<circle class="pulse" cx="282" cy="104" r="38" fill="${W}" fill-opacity=".55" stroke="${K}" stroke-width="2" stroke-dasharray="5 5"/>` +
      [[262, 88], [300, 86], [272, 128], [306, 116]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${C.blue}" stroke="${K}" stroke-width="2"/>`).join("") +
      star(284, 106, 13, C.yellow) + R(150, 116, 106, 26, W, { r: 4, st: 2 }) + T(203, 133, "[0.12, -0.48, …]", { a: "middle", s: 11 }) +
      R(318, 150, 64, 22, W, { r: 11, st: 2 }) + T(350, 165, "proche", { a: "middle", s: 10.5 }),
    // 03 : un DAG Airflow qui refait l'index tout seul, à heure fixe
    dag: () => {
      const node = (x, y, t, c) => R(x, y, 86, 32, W, { r: 6 }) + R(x + 3, y + 3, 9, 26, c, { r: 2, st: 0 }) + T(x + 50, y + 21, t, { a: "middle", s: 12 });
      return node(124, 66, "fetch", C.green) + node(240, 66, "chunk", C.green) + node(240, 122, "embed", C.green) + node(200, 172, "index", C.lime) +
        flow("M212 82 L230 82") + head(234, 82, 0) + flow("M283 100 L283 114") + head(283, 118, 90) + flow("M262 156 L262 162") + head(262, 166, 90) +
        `<circle cx="158" cy="142" r="24" fill="${W}" stroke="${K}" stroke-width="3"/><g class="spin" style="transform-origin:158px 142px"><line x1="158" y1="142" x2="158" y2="125" stroke="${K}" stroke-width="4" stroke-linecap="round"/></g><line x1="158" y1="142" x2="169" y2="148" stroke="${C.magenta}" stroke-width="4" stroke-linecap="round"/><circle cx="158" cy="142" r="3" fill="${K}"/>` +
        T(158, 186, "@daily", { a: "middle", s: 11 });
    },
    // W1 : les traces des appels au modèle (du JSON) qui deviennent une table
    pipeline: () => [[150, 54, '{"tokens": 812}'], [164, 88, '{"model": "gpt"}'], [150, 122, '{"cost": 0.002}']].map(([x, y, t]) => R(x, y, 128, 26, W, { r: 4, st: 2 }) + T(x + 64, y + 17, t, { a: "middle", s: 10.5 })).join("") +
      `<path d="M298 101 C350 101 348 160 276 176" fill="none" stroke="${K}" stroke-width="14" stroke-linecap="round"/>` + flow("M298 101 C350 101 348 160 276 176", C.lime, 4) +
      R(148, 156, 120, 54, W) + R(148, 156, 120, 14, K, { st: 0 }) + [184, 197].map(y => `<line x1="148" y1="${y}" x2="268" y2="${y}" stroke="${K}" stroke-width="2"/>`).join("") +
      [188, 228].map(x => `<line x1="${x}" y1="170" x2="${x}" y2="210" stroke="${K}" stroke-width="2"/>`).join(""),
    // 04 : la cible (le bon document est-il trouvé ?) et les notes hit rate / MRR
    eval: () => [[70, W], [52, C.magenta], [34, W], [16, K]].map(([r, f]) => `<circle cx="206" cy="140" r="${r}" fill="${f}" stroke="${K}" stroke-width="3"/>`).join("") +
      `<line x1="210" y1="136" x2="282" y2="72" stroke="${K}" stroke-width="5" stroke-linecap="round"/><polygon points="282,72 278,58 292,64" fill="${C.yellow}" stroke="${K}" stroke-width="2"/><polygon points="282,72 296,76 290,62" fill="${C.yellow}" stroke="${K}" stroke-width="2"/>` +
      R(296, 96, 86, 70, W, { r: 4 }) + T(306, 116, "hit rate", { s: 10.5 }) + R(306, 122, 62, 8, C.green, { st: 2 }) + T(306, 146, "MRR", { s: 10.5 }) + R(306, 152, 52, 8, C.blue, { st: 2 }),
    // 05 : le tableau de bord : les réponses, leur note et le retour de l'utilisateur
    monitor: () => R(130, 60, 244, 112, W) + R(130, 60, 244, 20, K, { st: 0 }) + [C.magenta, C.yellow, C.green].map((c, i) => `<circle cx="${144 + i * 14}" cy="70" r="4" fill="${c}"/>`).join("") +
      [104, 124, 144].map(y => `<line x1="144" y1="${y}" x2="292" y2="${y}" stroke="#d8d8d4" stroke-width="2"/>`).join("") +
      `<polyline points="144,156 170,136 196,142 222,114 248,122 274,96 292,100" fill="none" stroke="${C.green}" stroke-width="4" stroke-linejoin="round"/>` +
      `<path d="M308 150 A28 28 0 0 1 364 150" fill="none" stroke="#d8d8d4" stroke-width="10"/><path d="M308 150 A28 28 0 0 1 352 128" fill="none" stroke="#F46800" stroke-width="10"/><line x1="336" y1="150" x2="350" y2="132" stroke="${K}" stroke-width="3" stroke-linecap="round"/>` +
      R(140, 186, 56, 24, W, { r: 12, st: 2 }) + `<polygon points="150,204 156,192 162,204" fill="${C.green}"/>` + T(178, 203, "42", { a: "middle", s: 11 }) +
      R(204, 186, 50, 24, W, { r: 12, st: 2 }) + `<polygon points="214,192 220,204 226,192" fill="${C.magenta}"/>` + T(238, 203, "3", { a: "middle", s: 11 }),
    // 06 : deux recherches (mots et sens) fusionnées puis reclassées
    hybrid: () => {
      const col = (x, y, lab, c, ws) => T(x, y, lab, { s: 11 }) + ws.map((w, i) => R(x, y + 8 + i * 20, w, 12, c, { st: 2 })).join("");
      return col(128, 56, "mots-clés", C.magenta, [70, 54, 40]) + col(128, 140, "sens", C.blue, [64, 58, 34]) +
        flow("M210 88 C240 88 246 112 268 116") + head(270, 117, 15) + flow("M210 172 C240 172 246 140 268 136") + head(270, 135, -15) +
        T(282, 88, "rerank", { s: 11 }) + [[C.blue, 78], [C.magenta, 64], [C.blue, 50]].map(([c, w], i) => `<circle cx="292" cy="${106 + i * 24}" r="9" fill="${K}"/>` + T(292, 110 + i * 24, i + 1, { a: "middle", s: 10, c: W }) + R(306, 100 + i * 24, w, 12, c, { st: 2 })).join("");
    },
    // 07 : l'application complète : une page de chat (Flask) et son tableau de bord
    app: () => R(128, 58, 250, 118, W) + `<line x1="128" y1="80" x2="378" y2="80" stroke="${K}" stroke-width="3"/>` + [C.magenta, C.yellow, C.green].map((c, i) => `<circle cx="${142 + i * 13}" cy="69" r="4" fill="${c}"/>`).join("") +
      R(186, 63, 96, 13, "#efefec", { r: 6, st: 0 }) + T(234, 73, "localhost:5000", { a: "middle", s: 9 }) +
      R(206, 90, 70, 16, "#e3e3e0", { r: 8, st: 0 }) + R(140, 114, 112, 36, K, { r: 10, st: 0 }) + R(152, 125, 70, 5, W, { st: 0 }) + R(152, 136, 52, 5, W, { st: 0 }) +
      R(140, 156, 40, 14, W, { r: 7, st: 2 }) + `<polygon points="153,166 158,158 163,166" fill="${C.green}"/>` +
      `<line x1="292" y1="80" x2="292" y2="176" stroke="${K}" stroke-width="2"/>` + [[302, 26], [318, 46], [334, 36], [350, 60]].map(([x, h]) => R(x, 164 - h, 12, h, "#F46800", { st: 2 })).join(""),
    // P : ton dépôt, ton README, ta CI au vert, et le drapeau d'arrivée
    launch: () => R(128, 56, 162, 120, W) + R(128, 56, 162, 24, C.cream, { st: 3 }) + T(140, 73, "README.md", { s: 11, w: 600 }) +
      [94, 107, 120].map((y, i) => R(140, y, [126, 100, 112][i], 5, K, { st: 0 })).join("") + R(140, 134, 64, 30, C.lav, { st: 2 }) +
      `<circle cx="262" cy="150" r="15" fill="${C.green}" stroke="${K}" stroke-width="2.5"/><path d="M255 150 L260 155 L270 144" fill="none" stroke="${K}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<line x1="330" y1="70" x2="330" y2="172" stroke="${K}" stroke-width="4" stroke-linecap="round"/><g class="drift">` + [0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${332 + c * 12}" y="${72 + r * 12}" width="12" height="12" fill="${(r + c) % 2 ? W : K}"/>`).join("")).join("") +
      `<rect x="332" y="72" width="48" height="36" fill="none" stroke="${K}" stroke-width="2"/></g>` + star(230, 148, 10, C.yellow)
  };

  // m : un module de course.js (m.art.bg, m.cover.scene, m.cover.logos)
  function cover(m) {
    const c = m.cover || {}, bg = (m.art && m.art.bg) || C.lav, logos = c.logos || [];
    let out = `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true" class="art"><rect width="400" height="260" fill="${bg}"/>`;
    out += `<g opacity=".5" transform="translate(236 118) scale(1.5)">${SHAPES.hatch(bg === C.lime ? C.white : C.white)}</g>`;
    out += (SCENES[c.scene] || (() => ""))();
    const pos = [[20, 34, 66, -4], [56, 112, 54, 5], [18, 176, 48, -3]];
    logos.slice(0, 3).forEach((lg, i) => { const [x, y, s, r] = pos[i]; out += tile(x, y, s, lg, r, lg[2] === "wide"); });
    return out + "</svg>";
  }

  // L'accueil : le chemin d'une question dans une application RAG, entouré des outils du cours
  function home() {
    let out = `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true" class="art"><rect width="400" height="260" fill="${C.lav}"/>`;
    out += `<g opacity=".5" transform="translate(150 70) scale(1.6)">${SHAPES.hatch(C.white)}</g>`;
    out += R(18, 112, 92, 34, W, { r: 17 }) + T(64, 133, "ta question ?", { a: "middle", s: 11 }) + flow("M112 129 L128 129") + head(132, 129, 0);
    out += doc(140, 92, -8, C.cream) + doc(152, 96, 6) + `<circle cx="204" cy="150" r="20" fill="${C.lime}" stroke="${K}" stroke-width="5"/><line x1="218" y1="164" x2="234" y2="180" stroke="${K}" stroke-width="8" stroke-linecap="round"/>`;
    out += flow("M228 128 L246 128") + head(250, 128, 0) + R(258, 94, 120, 80, K, { r: 18, st: 0 }) + `<path d="M280 172 L272 194 L302 172Z" fill="${K}"/>` + ast(296, 134, 48, C.blue) +
      R(326, 116, 38, 6, W, { st: 0 }) + R(326, 130, 28, 6, W, { st: 0 }) + R(326, 144, 34, 6, W, { st: 0 });
    [[["openai"], 22, 22, 46, -5], [["huggingface", "#FFD21E"], 96, 16, 42, 4], [["postgresql", "#4169E1"], 166, 24, 42, -3], [["apacheairflow", "#017CEE"], 236, 14, 44, 5], [["python", "#3776AB"], 312, 22, 42, -4],
     [["dlt", "", "wide"], 30, 204, 38, 3], [["grafana", "#F46800"], 128, 206, 40, -4], [["streamlit", "#FF4B4B"], 196, 200, 42, 5], [["langchain", "#1C3C3C"], 270, 206, 40, -3], [["docker", "#2496ED"], 338, 198, 42, 4]]
      .forEach(([lg, x, y, s, r]) => { out += tile(x, y, s, lg, r, lg[2] === "wide"); });
    return out + "</svg>";
  }

  // Le bloc noir « ce que tu sais déjà » : les outils appris au Zoomcamp DE
  function de() {
    let out = `<svg viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true" class="art"><rect width="400" height="380" fill="${K}"/>`;
    out += `<g opacity=".7" transform="translate(180 170) scale(1.9)">${SHAPES.hatch(C.lime)}</g>` + ast(338, 318, 56, C.yellow) + `<g transform="translate(46 286) scale(.6)">${SHAPES.half(C.magenta)}</g>`;
    [[["git", "#F05032"], 66, 92, 70, -5], [["github", "#181717"], 166, 104, 70, 4], [["docker", "#2496ED"], 266, 90, 70, -3],
     [["postgresql", "#4169E1"], 78, 200, 66, 4], [["apacheairflow", "#017CEE"], 172, 210, 66, -4], [["dlt", "", "wide"], 254, 200, 56, 3]]
      .forEach(([lg, x, y, s, r]) => { out += tile(x, y, s, lg, r, lg[2] === "wide"); });
    return out + "</svg>";
  }

  window.ART = { svg, C, cover, home, de };
})();
