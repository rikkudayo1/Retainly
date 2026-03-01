export interface Banner {
  id: string;
  label: string;
  // Use as style={{ backgroundImage, backgroundSize, backgroundRepeat, backgroundPosition }}
  backgroundImage: string;
  backgroundSize: string;
  backgroundRepeat: string;
  backgroundPosition: string;
}

// ── SVG helper ────────────────────────────────────────────────────────────
const svg = (content: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(content)}")`;

// ── Pattern builders (small tiles — meant to repeat) ─────────────────────

const diagonalLines = (color: string, gap = 12, width = 0.6) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='${gap * 2}' height='${gap * 2}'><line x1='0' y1='${gap * 2}' x2='${gap * 2}' y2='0' stroke='${color}' stroke-width='${width}'/><line x1='-${gap}' y1='${gap}' x2='${gap}' y2='-${gap}' stroke='${color}' stroke-width='${width}'/><line x1='${gap}' y1='${gap * 3}' x2='${gap * 3}' y2='${gap}' stroke='${color}' stroke-width='${width}'/></svg>`);

const squareGrid = (color: string, size = 20, width = 0.5) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><path d='M ${size} 0 L 0 0 0 ${size}' fill='none' stroke='${color}' stroke-width='${width}'/></svg>`);

const dotMatrix = (color: string, gap = 16, r = 0.8) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='${gap}' height='${gap}'><circle cx='${gap / 2}' cy='${gap / 2}' r='${r}' fill='${color}'/></svg>`);

const hexGrid = (color: string, size = 18, width = 0.6) => {
  const w = size * 2;
  const h = Math.round(size * Math.sqrt(3));
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><polygon points='${size},0 ${w},${h / 4} ${w},${(3 * h) / 4} ${size},${h} 0,${(3 * h) / 4} 0,${h / 4}' fill='none' stroke='${color}' stroke-width='${width}'/><polygon points='${size},${h} ${w},${(5 * h) / 4} ${w},${(7 * h) / 4} ${size},${2 * h} 0,${(7 * h) / 4} 0,${(5 * h) / 4}' fill='none' stroke='${color}' stroke-width='${width}'/></svg>`);
};

const crossHatch = (color: string, gap = 14, width = 0.5) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='${gap * 2}' height='${gap * 2}'><line x1='0' y1='${gap * 2}' x2='${gap * 2}' y2='0' stroke='${color}' stroke-width='${width}'/><line x1='0' y1='0' x2='${gap * 2}' y2='${gap * 2}' stroke='${color}' stroke-width='${width}'/></svg>`);

const circuitLines = (color: string) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path d='M0,20 H30 V50 H60' fill='none' stroke='${color}' stroke-width='0.7'/><path d='M40,0 V30 H70 V60' fill='none' stroke='${color}' stroke-width='0.7'/><path d='M0,60 H20 V40 H50 V80' fill='none' stroke='${color}' stroke-width='0.7'/><circle cx='30' cy='20' r='1.5' fill='${color}'/><circle cx='70' cy='30' r='1.5' fill='${color}'/><circle cx='50' cy='40' r='1.5' fill='${color}'/><circle cx='20' cy='60' r='1.5' fill='${color}'/></svg>`);

const scanLines = (color: string, gap = 4) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='2' height='${gap}'><rect x='0' y='0' width='2' height='1' fill='${color}'/></svg>`);

// ── Non-repeating full-cover overlays ────────────────────────────────────

/**
 * Corner brackets — fixed 200×100 canvas, placed at each corner with pixel-perfect
 * coords. Use backgroundSize "200px 100px" + "no-repeat" on the full-size slot,
 * centered via position so they sit in the actual corners regardless of banner width.
 * We render FOUR separate SVGs (one per corner) so each can be positioned independently.
 */
const bracketTL = (color: string) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='M2,20 L2,2 L20,2' fill='none' stroke='${color}' stroke-width='1.5' opacity='0.8'/></svg>`);
const bracketTR = (color: string) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='M30,20 L30,2 L12,2' fill='none' stroke='${color}' stroke-width='1.5' opacity='0.8'/></svg>`);
const bracketBL = (color: string) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='M2,12 L2,30 L20,30' fill='none' stroke='${color}' stroke-width='1.5' opacity='0.8'/></svg>`);
const bracketBR = (color: string) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='M30,12 L30,30 L12,30' fill='none' stroke='${color}' stroke-width='1.5' opacity='0.8'/></svg>`);

/** Angular shard — large fixed canvas, positioned top-right. Never tiles. */
const shardMask = (color: string) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><polygon points='180,0 320,0 320,110' fill='${color}' opacity='0.16'/><polygon points='230,0 320,0 320,55' fill='${color}' opacity='0.1'/><line x1='180' y1='0' x2='320' y2='110' stroke='${color}' stroke-width='1' opacity='0.4'/><line x1='230' y1='0' x2='320' y2='55' stroke='${color}' stroke-width='0.6' opacity='0.3'/></svg>`);

// ── Helper: build a banner with correct per-layer sizing ──────────────────

type Layer = {
  img: string;
  size: string;
  repeat: string;
  position: string;
};

// Fixed-size overlays
const COVER: Omit<Layer, "img"> = { size: "100% 100%", repeat: "no-repeat", position: "0 0" };
// Shard: fixed 320×200 canvas, pinned top-right
const SHARD: Omit<Layer, "img"> = { size: "320px 200px", repeat: "no-repeat", position: "right top" };
// Brackets: 32×32 each, pinned to corners
const TL: Omit<Layer, "img"> = { size: "32px 32px", repeat: "no-repeat", position: "8px 8px" };
const TR: Omit<Layer, "img"> = { size: "32px 32px", repeat: "no-repeat", position: "right 8px top 8px" };
const BL: Omit<Layer, "img"> = { size: "32px 32px", repeat: "no-repeat", position: "8px bottom 8px" };
const BR: Omit<Layer, "img"> = { size: "32px 32px", repeat: "no-repeat", position: "right 8px bottom 8px" };
// Tiling patterns
const tile = (px: number): Omit<Layer, "img"> => ({ size: `${px}px ${px}px`, repeat: "repeat", position: "0 0" });

const makeBanner = (
  id: string,
  label: string,
  gradient: string,
  accentColor: string,
  patternLayers: Layer[],
): Banner => {
  const brackets: Layer[] = [
    { img: bracketTL(accentColor), ...TL },
    { img: bracketTR(accentColor), ...TR },
    { img: bracketBL(accentColor), ...BL },
    { img: bracketBR(accentColor), ...BR },
    { img: shardMask(accentColor), ...SHARD },
  ];

  const allLayers = [...brackets, ...patternLayers];
  const gradientLayer = { img: gradient, ...COVER };
  const all = [...allLayers, gradientLayer];

  return {
    id,
    label,
    backgroundImage: all.map((l) => l.img).join(", "),
    backgroundSize: all.map((l) => l.size).join(", "),
    backgroundRepeat: all.map((l) => l.repeat).join(", "),
    backgroundPosition: all.map((l) => l.position).join(", "),
  };
};

// ── Banner definitions ────────────────────────────────────────────────────

export const BANNERS: Banner[] = [
  makeBanner("aurora", "Aurora",
    "linear-gradient(135deg, #0f0c29 0%, #302b63 55%, #24243e 100%)",
    "rgba(167,139,250,0.9)",
    [
      { img: diagonalLines("rgba(167,139,250,0.12)", 16, 0.7), ...tile(32) },
      { img: squareGrid("rgba(99,102,241,0.1)", 32, 0.5), ...tile(32) },
    ],
  ),

  makeBanner("sovereign", "Sovereign",
    "linear-gradient(135deg, #1c1003 0%, #3d2200 40%, #0f0a00 100%)",
    "rgba(251,191,36,0.9)",
    [
      { img: circuitLines("rgba(251,191,36,0.15)"), ...tile(80) },
      { img: dotMatrix("rgba(251,191,36,0.18)", 14, 0.9), ...tile(14) },
    ],
  ),

  makeBanner("operative", "Operative",
    "linear-gradient(135deg, #020c12 0%, #0c2d3d 50%, #010a10 100%)",
    "rgba(34,211,238,0.9)",
    [
      { img: circuitLines("rgba(34,211,238,0.15)"), ...tile(80) },
      { img: squareGrid("rgba(34,211,238,0.08)", 24, 0.5), ...tile(24) },
    ],
  ),

  makeBanner("inferno", "Inferno",
    "linear-gradient(135deg, #1a0500 0%, #450a0a 45%, #0f0000 100%)",
    "rgba(249,115,22,0.9)",
    [
      { img: crossHatch("rgba(251,146,60,0.12)", 18, 0.6), ...tile(36) },
      { img: diagonalLines("rgba(249,115,22,0.1)", 10, 0.5), ...tile(20) },
    ],
  ),

  makeBanner("phantom", "Phantom",
    "linear-gradient(160deg, #060809 0%, #111827 50%, #030507 100%)",
    "rgba(148,163,184,0.7)",
    [
      { img: hexGrid("rgba(148,163,184,0.1)", 16, 0.5), ...tile(32) },
      { img: scanLines("rgba(0,0,0,0.18)", 4), ...tile(4) },
    ],
  ),

  makeBanner("prism", "Prism",
    "linear-gradient(135deg, #1a0533 0%, #4c1d95 50%, #2e1065 100%)",
    "rgba(192,132,252,0.9)",
    [
      { img: hexGrid("rgba(216,180,254,0.12)", 18, 0.6), ...tile(36) },
      { img: dotMatrix("rgba(192,132,252,0.15)", 20, 1), ...tile(20) },
    ],
  ),

  makeBanner("verdant", "Verdant",
    "linear-gradient(135deg, #011408 0%, #052e16 55%, #010c04 100%)",
    "rgba(74,222,128,0.9)",
    [
      { img: squareGrid("rgba(74,222,128,0.09)", 20, 0.5), ...tile(20) },
      { img: dotMatrix("rgba(74,222,128,0.14)", 16, 0.8), ...tile(16) },
    ],
  ),

  makeBanner("tundra", "Tundra",
    "linear-gradient(135deg, #0c1a29 0%, #0c4a6e 55%, #082030 100%)",
    "rgba(186,230,253,0.9)",
    [
      { img: crossHatch("rgba(186,230,253,0.1)", 22, 0.5), ...tile(44) },
      { img: squareGrid("rgba(147,197,253,0.08)", 28, 0.4), ...tile(28) },
    ],
  ),

  makeBanner("basalt", "Basalt",
    "linear-gradient(150deg, #0f1117 0%, #1e2433 55%, #0a0c10 100%)",
    "rgba(203,213,225,0.7)",
    [
      { img: circuitLines("rgba(203,213,225,0.1)"), ...tile(80) },
      { img: crossHatch("rgba(148,163,184,0.07)", 16, 0.4), ...tile(32) },
    ],
  ),

  makeBanner("ember", "Ember",
    "linear-gradient(135deg, #1a0a00 0%, #7c2d12 45%, #431407 100%)",
    "rgba(251,191,36,0.9)",
    [
      { img: diagonalLines("rgba(252,211,77,0.1)", 12, 0.6), ...tile(24) },
      { img: hexGrid("rgba(251,191,36,0.08)", 20, 0.5), ...tile(40) },
    ],
  ),

  makeBanner("bloom", "Bloom",
    "linear-gradient(135deg, #1a0010 0%, #831843 50%, #500724 100%)",
    "rgba(251,207,232,0.9)",
    [
      { img: dotMatrix("rgba(251,207,232,0.2)", 14, 0.9), ...tile(14) },
      { img: scanLines("rgba(0,0,0,0.12)", 5), ...tile(5) },
    ],
  ),

  makeBanner("signal", "Signal",
    "linear-gradient(135deg, #00110a 0%, #064e3b 50%, #022c20 100%)",
    "rgba(52,211,153,0.9)",
    [
      { img: circuitLines("rgba(52,211,153,0.18)"), ...tile(80) },
      { img: squareGrid("rgba(16,185,129,0.1)", 18, 0.5), ...tile(18) },
    ],
  ),
];

export const getBanner = (id: string): Banner =>
  BANNERS.find((b) => b.id === id) ?? BANNERS[0];