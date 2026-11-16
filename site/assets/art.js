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

  window.ART = { svg, C };
})();
