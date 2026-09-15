import { playerMap, tycoonPoint } from './tycoon-layout';
import { playerBuildingScale, resourceArtBounds } from './building-assets';

const W = playerMap.width;
const H = playerMap.height;

function facilityZone(kind: 'internet' | 'edge' | 'compute' | 'cache' | 'database') {
  const p = tycoonPoint(kind);
  const s = playerBuildingScale(kind);
  const b = resourceArtBounds(kind, s, true);
  return { cx: p.x, cy: p.y, x: p.x + b.x - 40, y: p.y + b.y - 60, w: b.width + 80, h: b.height + 120 };
}

function overlapsAny(x: number, y: number, w: number, h: number, zones: ReturnType<typeof facilityZone>[]) {
  return zones.some(z => x < z.x + z.w && x + w > z.x && y < z.y + z.h && y + h > z.y);
}

export function generateHallBackground(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const zones = (['internet', 'edge', 'compute', 'cache', 'database'] as const).map(facilityZone);

  // === BASE FLOOR ===
  const floorGrad = ctx.createRadialGradient(W * .5, H * .55, 100, W * .5, H * .55, W * .7);
  floorGrad.addColorStop(0, '#0f2a3d');
  floorGrad.addColorStop(0.5, '#0b2233');
  floorGrad.addColorStop(1, '#061520');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 0, W, H);

  // === ISOMETRIC FLOOR GRID ===
  const tile = 56;
  for (let row = -1; row < Math.ceil(H / (tile * .55)) + 1; row++) {
    for (let col = -1; col < Math.ceil(W / tile) + 1; col++) {
      const x = col * tile + (row % 2 ? tile / 2 : 0);
      const y = row * tile * .55;
      // Tile fill (alternating subtle)
      if ((row + col) % 4 === 0) {
        ctx.fillStyle = '#0d2536';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + tile / 2, y + tile * .275);
        ctx.lineTo(x, y + tile * .55); ctx.lineTo(x - tile / 2, y + tile * .275);
        ctx.closePath(); ctx.fill();
      }
      // Grid lines
      ctx.globalAlpha = 0.055;
      ctx.strokeStyle = '#4a7a94';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + tile / 2, y + tile * .275);
      ctx.lineTo(x, y + tile * .55); ctx.lineTo(x - tile / 2, y + tile * .275);
      ctx.closePath(); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // === FLOOR SECTORS (colored zones under each facility area) ===
  const sectorFill = (x: number, y: number, w: number, h: number, r: number, color: string, alpha: number, borderColor: string, glowColor: string, glowAlpha: number) => {
    // Outer glow halo
    const gx = x + w / 2, gy = y + h / 2;
    const grad = ctx.createRadialGradient(gx, gy, Math.min(w, h) * 0.2, gx, gy, Math.max(w, h) * 0.7);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.globalAlpha = glowAlpha;
    ctx.fillRect(x - 40, y - 40, w + 80, h + 80);
    // Fill
    ctx.fillStyle = color; ctx.globalAlpha = alpha;
    roundRect(ctx, x, y, w, h, r); ctx.fill();
    // Inner border (bright)
    ctx.strokeStyle = borderColor; ctx.globalAlpha = alpha * 1.8; ctx.lineWidth = 1.8;
    roundRect(ctx, x, y, w, h, r); ctx.stroke();
    // Outer soft border
    ctx.strokeStyle = borderColor; ctx.globalAlpha = alpha * 0.5; ctx.lineWidth = 4;
    roundRect(ctx, x - 3, y - 3, w + 6, h + 6, r + 3); ctx.stroke();
  };

  // Ingress zone (Intake area)
  sectorFill(360, 440, 440, 390, 18, '#0a2838', 0.6, '#2a7888', '#3090b0', 0.06);
  // Security corridor (Edge)
  sectorFill(660, 480, 440, 420, 18, '#0e1e28', 0.55, '#6a5040', '#906838', 0.05);
  // Central compute hall (App Service — MAIN HERO, largest + brightest)
  sectorFill(920, 420, 600, 580, 24, '#0c2a44', 0.7, '#3090b8', '#30a8d0', 0.1);
  // Cache zone
  sectorFill(1280, 320, 460, 420, 18, '#082830', 0.5, '#30a078', '#38c0a0', 0.06);
  // SQL data-core zone
  sectorFill(1540, 470, 580, 540, 22, '#0e1830', 0.6, '#3858b0', '#2850a0', 0.07);
  ctx.globalAlpha = 1;

  // === MAIN TRAFFIC CORRIDORS (floor markings between facilities) ===
  drawTrafficCorridors(ctx, zones);

  // === ZONE SEPARATOR STRIPS ===
  for (const y of [460, 990]) {
    ctx.fillStyle = '#091d2c';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(240, y - 7, 1920, 14);
    ctx.strokeStyle = '#5cc8d0';
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(240, y - 7); ctx.lineTo(2160, y - 7); ctx.stroke();
    ctx.strokeStyle = '#c8a854';
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.moveTo(240, y + 7); ctx.lineTo(2160, y + 7); ctx.stroke();
    // Amber dashes
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#cfb56f';
    ctx.lineWidth = 3;
    for (let x = 260; x < 2150; x += 90) {
      ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 18, y - 4); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // === WALL (top) ===
  const wallH = 130;
  const wallGrad = ctx.createLinearGradient(0, 0, 0, wallH);
  wallGrad.addColorStop(0, '#1a2c40');
  wallGrad.addColorStop(0.4, '#2a4058');
  wallGrad.addColorStop(0.8, '#223a50');
  wallGrad.addColorStop(1, '#142a3c');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, W, wallH);
  // Wall panels with depth
  for (let x = 30; x < W; x += 140) {
    ctx.strokeStyle = '#30495b';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, wallH); ctx.stroke();
    // Panel inner shading
    ctx.fillStyle = '#1a3040';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x + 2, 22, 66, wallH - 30);
    ctx.globalAlpha = 1;
    // Decorative rivet line
    ctx.fillStyle = '#4a6678';
    ctx.globalAlpha = 0.4;
    for (let ry = 30; ry < wallH - 10; ry += 25) {
      ctx.fillRect(x + 3, ry, 3, 3);
    }
    ctx.globalAlpha = 1;
  }
  // Wall trims
  ctx.strokeStyle = '#59788a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 11); ctx.lineTo(W, 11); ctx.stroke();
  ctx.strokeStyle = '#aa9464'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(W, 20); ctx.stroke();
  ctx.strokeStyle = '#14293d'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(W, 14); ctx.stroke();
  // Wall-floor shadow transition
  const wallShadow = ctx.createLinearGradient(0, wallH - 10, 0, wallH + 40);
  wallShadow.addColorStop(0, 'rgba(4,10,18,0.7)');
  wallShadow.addColorStop(1, 'rgba(4,10,18,0)');
  ctx.fillStyle = wallShadow;
  ctx.fillRect(0, wallH - 10, W, 50);

  // === WALL LIGHTS ===
  for (let x = 78; x < W; x += 140) {
    // Warm light pool on floor
    const pool = ctx.createRadialGradient(x, wallH + 40, 5, x, wallH + 40, 90);
    pool.addColorStop(0, 'rgba(255,216,154,0.09)');
    pool.addColorStop(0.5, 'rgba(255,200,130,0.04)');
    pool.addColorStop(1, 'rgba(255,200,130,0)');
    ctx.fillStyle = pool;
    ctx.fillRect(x - 90, wallH - 10, 180, 120);
    // Light fixture
    ctx.fillStyle = '#f0d5a4';
    ctx.globalAlpha = 0.85;
    roundRect(ctx, x - 8, 26, 17, 5, 2); ctx.fill();
    // Glow behind fixture
    ctx.fillStyle = '#ffeab8';
    ctx.globalAlpha = 0.12;
    drawEllipse(ctx, x, 38, 40, 20); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // === SIDE WALLS ===
  ctx.fillStyle = '#1e3548';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(24, 12); ctx.lineTo(24, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fill();
  // Left wall inner highlight
  ctx.strokeStyle = '#3a5a6e';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(22, 15); ctx.lineTo(22, H - 10); ctx.stroke();

  ctx.fillStyle = '#1a2f42';
  ctx.beginPath();
  ctx.moveTo(W - 18, 14); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(W - 18, H); ctx.closePath();
  ctx.fill();

  // === OVERHEAD CABLE TRAY ===
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#0e2234';
  ctx.fillRect(30, 155, W - 60, 16);
  ctx.strokeStyle = '#55a0b8'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.moveTo(30, 157); ctx.lineTo(W - 30, 157); ctx.stroke();
  ctx.strokeStyle = '#a0b088'; ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.moveTo(30, 169); ctx.lineTo(W - 30, 169); ctx.stroke();
  // Cable tray supports (vertical drops)
  ctx.strokeStyle = '#2a4858'; ctx.lineWidth = 2; ctx.globalAlpha = 0.55;
  for (let x = 80; x < W - 40; x += 120) {
    ctx.beginPath(); ctx.moveTo(x, 155); ctx.lineTo(x, 175); ctx.stroke();
    // Cable bundle below tray
    ctx.strokeStyle = '#1a3848'; ctx.lineWidth = 3; ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.moveTo(x - 15, 172); ctx.lineTo(x + 15, 172); ctx.stroke();
    ctx.strokeStyle = '#2a4858'; ctx.globalAlpha = 0.55;
  }
  // Secondary cable tray (mid-height)
  ctx.fillStyle = '#081820'; ctx.globalAlpha = 0.4;
  ctx.fillRect(200, 960, W - 400, 10);
  ctx.strokeStyle = '#3a6878'; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.moveTo(200, 960); ctx.lineTo(W - 200, 960); ctx.stroke();
  ctx.globalAlpha = 1;

  // === STATIC BACKGROUND INFRASTRUCTURE ===
  drawBackgroundRacks(ctx, zones);

  // === FLOOR BOTTOM BASEBOARD ===
  ctx.fillStyle = '#1c3445'; ctx.globalAlpha = 0.8;
  ctx.fillRect(22, H - 16, W - 44, 9);
  ctx.globalAlpha = 1;
  for (let x = 32; x < W - 25; x += 100) {
    ctx.strokeStyle = '#4a6270'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, H - 34); ctx.lineTo(x, H - 10); ctx.stroke();
    ctx.fillStyle = '#c2b181'; ctx.globalAlpha = 0.6;
    ctx.fillRect(x - 4, H - 36, 8, 3);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = '#314857'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(25, H - 19); ctx.lineTo(W - 25, H - 19); ctx.stroke();
  ctx.strokeStyle = '#b9a77b'; ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(25, H - 23); ctx.lineTo(W - 25, H - 23); ctx.stroke();
  for (let x = 27; x < W - 25; x += 40) {
    ctx.strokeStyle = '#c1ae7c'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(x, H - 20); ctx.lineTo(x + 7, H - 26); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // === ATMOSPHERIC DEPTH ===
  // Edge vignetting
  const vig = (x1: number, y1: number, x2: number, y2: number, a: number, fx: number, fy: number, fw: number, fh: number) => {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, `rgba(3,8,14,${a})`);
    g.addColorStop(1, 'rgba(3,8,14,0)');
    ctx.fillStyle = g; ctx.fillRect(fx, fy, fw, fh);
  };
  vig(0, 0, 250, 0, 0.55, 0, wallH, 250, H - wallH);
  vig(W, 0, W - 250, 0, 0.55, W - 250, wallH, 250, H - wallH);
  vig(0, H, 0, H - 180, 0.5, 0, H - 180, W, 180);

  // === FACILITY ZONE GLOW (strong under-lighting) ===
  drawZoneGlow(ctx, zones);

  // === TOP AMBIENT HAZE ===
  const haze = ctx.createLinearGradient(0, wallH, 0, wallH + 200);
  haze.addColorStop(0, 'rgba(10,24,38,0.55)');
  haze.addColorStop(1, 'rgba(10,24,38,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, wallH, W, 200);

  // === SUBTLE NOISE-LIKE VARIATION (painted feel) ===
  drawFloorVariation(ctx);

  return canvas;
}

export function generateForegroundLayer(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Overhead pipe/cable tray silhouettes at top and bottom edges
  // These create depth without blocking gameplay

  // Top edge: partial overhead cable tray
  ctx.fillStyle = '#0a1822';
  ctx.globalAlpha = 0.45;
  ctx.fillRect(60, 0, W - 120, 8);
  // Tray supports
  for (let x = 120; x < W - 80; x += 240) {
    ctx.fillStyle = '#0c1e2c';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(x - 3, 0, 6, 24);
    // Cross brace
    ctx.strokeStyle = '#1a3040';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(x - 20, 6);
    ctx.lineTo(x + 20, 6);
    ctx.stroke();
  }

  // Bottom-left foreground pipe silhouette
  ctx.fillStyle = '#081620';
  ctx.globalAlpha = 0.3;
  roundRect(ctx, 30, H - 60, 350, 12, 4);
  ctx.fill();
  // Pipe highlight
  ctx.strokeStyle = '#2a4858';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(35, H - 56);
  ctx.lineTo(375, H - 56);
  ctx.stroke();

  // Bottom-right foreground railing
  ctx.fillStyle = '#081620';
  ctx.globalAlpha = 0.25;
  ctx.fillRect(W - 380, H - 55, 340, 4);
  // Railing posts
  for (let x = W - 370; x < W - 50; x += 85) {
    ctx.fillRect(x, H - 65, 3, 18);
  }

  // Left edge: partial machinery silhouette
  ctx.fillStyle = '#060e18';
  ctx.globalAlpha = 0.2;
  roundRect(ctx, -5, 300, 40, 180, 6);
  ctx.fill();

  // Right edge: partial cabinet silhouette
  ctx.fillStyle = '#060e18';
  ctx.globalAlpha = 0.2;
  roundRect(ctx, W - 35, 400, 40, 200, 6);
  ctx.fill();

  ctx.globalAlpha = 1;
  return canvas;
}

function drawTrafficCorridors(ctx: CanvasRenderingContext2D, zones: ReturnType<typeof facilityZone>[]) {
  // Draw subtle floor path between adjacent facilities
  const path = [
    { from: zones[0], to: zones[1] }, // intake → edge
    { from: zones[1], to: zones[2] }, // edge → compute
    { from: zones[2], to: zones[3] }, // compute → cache
    { from: zones[2], to: zones[4] }, // compute → SQL
  ];

  for (const { from, to } of path) {
    const dx = to.cx - from.cx;
    const dy = to.cy - from.cy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const hw = 22; // half-width of corridor

    // Darker floor strip
    ctx.fillStyle = '#06131e';
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(from.cx + nx * hw, from.cy + ny * hw);
    ctx.lineTo(to.cx + nx * hw, to.cy + ny * hw);
    ctx.lineTo(to.cx - nx * hw, to.cy - ny * hw);
    ctx.lineTo(from.cx - nx * hw, from.cy - ny * hw);
    ctx.closePath();
    ctx.fill();

    // Edge lines (subtle guidance)
    ctx.strokeStyle = '#3a6878';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(from.cx + nx * hw, from.cy + ny * hw);
    ctx.lineTo(to.cx + nx * hw, to.cy + ny * hw);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(from.cx - nx * hw, from.cy - ny * hw);
    ctx.lineTo(to.cx - nx * hw, to.cy - ny * hw);
    ctx.stroke();

    // Center glow line
    const lineGrad = ctx.createLinearGradient(from.cx, from.cy, to.cx, to.cy);
    lineGrad.addColorStop(0, 'rgba(80,200,220,0.06)');
    lineGrad.addColorStop(0.5, 'rgba(80,200,220,0.12)');
    lineGrad.addColorStop(1, 'rgba(80,200,220,0.06)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(from.cx, from.cy);
    ctx.lineTo(to.cx, to.cy);
    ctx.stroke();

    // Direction arrows along path
    ctx.fillStyle = '#5ac0d0';
    ctx.globalAlpha = 0.12;
    const steps = Math.floor(len / 80);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const ax = from.cx + dx * t;
      const ay = from.cy + dy * t;
      const adx = dx / len * 6;
      const ady = dy / len * 6;
      ctx.beginPath();
      ctx.moveTo(ax + adx, ay + ady);
      ctx.lineTo(ax - adx + nx * 5, ay - ady + ny * 5);
      ctx.lineTo(ax - adx - nx * 5, ay - ady - ny * 5);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawBackgroundRacks(ctx: CanvasRenderingContext2D, zones: ReturnType<typeof facilityZone>[]) {
  type Rack = { x: number; y: number; w: number; h: number; kind: 'rack' | 'cooling' | 'cabinet' | 'pipe'; alpha?: number };
  const racks: Rack[] = [];

  // Upper back row (receding depth)
  for (let i = 0; i < 9; i++) racks.push({ x: 380 + i * 180, y: 240 + (i % 3) * 6, w: 48 + (i % 2) * 8, h: 82 + (i % 3) * 14, kind: i % 5 === 2 ? 'cooling' : i % 7 === 6 ? 'cabinet' : 'rack', alpha: 0.55 });
  // Left column (infrastructure corridor)
  for (let i = 0; i < 6; i++) racks.push({ x: 130 + (i % 2) * 30, y: 480 + i * 105, w: 65, h: 95 + (i % 2) * 18, kind: i % 3 === 0 ? 'cooling' : i % 3 === 1 ? 'cabinet' : 'rack', alpha: 0.65 });
  // Right column
  for (let i = 0; i < 6; i++) racks.push({ x: 2260 - (i % 2) * 25, y: 480 + i * 105, w: 60, h: 90 + (i % 2) * 15, kind: i % 3 === 1 ? 'cooling' : 'cabinet', alpha: 0.6 });
  // Deep back rows (between upper wall and facilities)
  for (let i = 0; i < 10; i++) racks.push({ x: 450 + i * 160, y: 340 + (i % 2) * 10, w: 55, h: 88, kind: i % 4 === 1 ? 'cooling' : 'rack', alpha: 0.45 });
  // Lower infrastructure row
  for (let i = 0; i < 9; i++) racks.push({ x: 720 + i * 145, y: 1100 + (i % 3) * 8, w: 52 + (i % 2) * 10, h: 85 + (i % 2) * 12, kind: i % 5 === 3 ? 'cooling' : 'rack', alpha: 0.6 });
  // Bottom-left cooling cluster
  for (let i = 0; i < 5; i++) racks.push({ x: 170 + i * 140, y: 1120 + (i % 2) * 12, w: 58, h: 92, kind: i % 2 === 0 ? 'cooling' : 'rack', alpha: 0.65 });
  // Electrical zone (right upper)
  for (let i = 0; i < 3; i++) racks.push({ x: 1520 + i * 200, y: 245, w: 56, h: 105, kind: 'cabinet', alpha: 0.55 });
  for (let i = 0; i < 3; i++) racks.push({ x: 1540 + i * 200, y: 410, w: 50, h: 78, kind: i % 2 ? 'cooling' : 'cabinet', alpha: 0.5 });
  // Pipe runs at bottom
  for (let i = 0; i < 6; i++) racks.push({ x: 180 + i * 160, y: 1260, w: 90, h: 24, kind: 'pipe', alpha: 0.5 });
  for (let i = 0; i < 4; i++) racks.push({ x: 1400 + i * 180, y: 1250, w: 85, h: 22, kind: 'pipe', alpha: 0.45 });

  // Filter overlapping
  const visible = racks.filter(r => !overlapsAny(r.x - r.w / 2, r.y - r.h, r.w, r.h + 15, zones));

  // Sort by Y for depth ordering
  visible.sort((a, b) => a.y - b.y);

  for (const rack of visible) {
    const { x, y, w, h, kind, alpha: baseAlpha } = rack;
    const a = baseAlpha ?? 0.7;

    // Contact shadow
    ctx.fillStyle = '#030a12';
    ctx.globalAlpha = a * 0.5;
    drawEllipse(ctx, x + 2, y + 5, w * 2, 16);
    ctx.fill();

    if (kind === 'pipe') {
      drawPipe(ctx, x, y, w, a);
      continue;
    }

    const depth = kind === 'cabinet' ? 12 : 10;

    // Front face
    const frontColor = kind === 'rack' ? '#253848' : kind === 'cooling' ? '#325060' : '#2e4555';
    ctx.fillStyle = frontColor; ctx.globalAlpha = a;
    ctx.fillRect(x - w / 2, y - h, w, h);

    // Side face (lighter = depth cue)
    const sideColor = kind === 'rack' ? '#1a2a38' : kind === 'cooling' ? '#243e4c' : '#223644';
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - h); ctx.lineTo(x + w / 2 + depth, y - h - 7);
    ctx.lineTo(x + w / 2 + depth, y - 7); ctx.lineTo(x + w / 2, y);
    ctx.closePath(); ctx.fill();

    // Top face
    const topColor = kind === 'rack' ? '#4a6678' : kind === 'cooling' ? '#5a7a86' : '#446070';
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w / 2 + depth, y - h - 7);
    ctx.lineTo(x + w / 2 + depth, y - h - 7); ctx.lineTo(x + w / 2, y - h);
    ctx.closePath(); ctx.fill();

    if (kind === 'rack') drawRackDetails(ctx, x, y, w, h, a);
    else if (kind === 'cooling') drawCoolingDetails(ctx, x, y, w, h, a);
    else drawCabinetDetails(ctx, x, y, w, h, a);

    ctx.globalAlpha = 1;
  }
}

function drawRackDetails(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a: number) {
  // Inner panel
  ctx.fillStyle = '#0e1a26'; ctx.globalAlpha = a * 0.85;
  ctx.fillRect(x - w / 2 + 4, y - h + 8, w - 8, h - 15);
  // Server slots
  const slots = Math.floor((h - 22) / 11);
  for (let j = 0; j < slots; j++) {
    const sy = y - h + 12 + j * ((h - 24) / slots);
    // Slot divider
    ctx.strokeStyle = '#354a5a'; ctx.globalAlpha = a * 0.55; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 6, sy); ctx.lineTo(x + w / 2 - 6, sy + 1.5); ctx.stroke();
    // LED (varied colors)
    const led = j % 4 === 0 ? '#5dc0e0' : j % 4 === 1 ? '#4a90b0' : j % 4 === 2 ? '#3a7090' : '#2a5570';
    ctx.fillStyle = led; ctx.globalAlpha = a * 0.8;
    ctx.fillRect(x + w / 2 - 10, sy + 1, 2, 2);
    // Occasional green LED
    if (j % 5 === 0) {
      ctx.fillStyle = '#40c080'; ctx.globalAlpha = a * 0.6;
      ctx.fillRect(x + w / 2 - 14, sy + 1, 2, 2);
    }
  }
  // Frame highlight
  ctx.strokeStyle = '#5a8098'; ctx.globalAlpha = a * 0.3; ctx.lineWidth = 0.6;
  ctx.strokeRect(x - w / 2 + 3, y - h + 7, w - 6, h - 13);
  // Top LED bar
  ctx.strokeStyle = '#40b0d8'; ctx.globalAlpha = a * 0.55; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - w / 2 + 5, y - h + 5); ctx.lineTo(x + w / 2 - 5, y - h + 8); ctx.stroke();
  // Bottom label plate
  ctx.fillStyle = '#b8a570'; ctx.globalAlpha = a * 0.35;
  ctx.fillRect(x - w / 2 + 6, y - 13, 10, 3);
  // Side vents
  if (w >= 40) {
    ctx.strokeStyle = '#3a5a6a'; ctx.globalAlpha = a * 0.3; ctx.lineWidth = 1;
    for (let v = 0; v < 3; v++) {
      const vy = y - h + 20 + v * 18;
      ctx.beginPath(); ctx.moveTo(x + w / 2 + 3, vy); ctx.lineTo(x + w / 2 + 9, vy - 4); ctx.stroke();
    }
  }
}

function drawCoolingDetails(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a: number) {
  const fans = h > 80 ? 3 : 2;
  for (let j = 0; j < fans; j++) {
    const fy = y - h + 14 + j * (h - 22) / fans;
    // Fan housing
    ctx.fillStyle = '#1e3040'; ctx.globalAlpha = a * 0.75;
    ctx.beginPath(); ctx.arc(x, fy, w * 0.24, 0, Math.PI * 2); ctx.fill();
    // Fan ring
    ctx.strokeStyle = '#7a9aa6'; ctx.globalAlpha = a * 0.55; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(x, fy, w * 0.24, 0, Math.PI * 2); ctx.stroke();
    // Blade cross
    ctx.globalAlpha = a * 0.45;
    for (const angle of [0, Math.PI / 2]) {
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * w * 0.18, fy + Math.sin(angle) * w * 0.18);
      ctx.lineTo(x - Math.cos(angle) * w * 0.18, fy - Math.sin(angle) * w * 0.18);
      ctx.stroke();
    }
  }
  // Grille lines
  ctx.strokeStyle = '#1a3545'; ctx.globalAlpha = a * 0.4; ctx.lineWidth = 1;
  for (let g = 0; g < 6; g++) {
    const gy = y - h + 8 + g * (h - 12) / 6;
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 3, gy); ctx.lineTo(x + w / 2 - 3, gy); ctx.stroke();
  }
}

function drawCabinetDetails(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a: number) {
  // Door outline
  ctx.strokeStyle = '#6a8090'; ctx.globalAlpha = a * 0.4; ctx.lineWidth = 0.8;
  ctx.strokeRect(x - w / 2 + 4, y - h + 8, w - 8, h - 15);
  // Handle
  ctx.fillStyle = '#c0a860'; ctx.globalAlpha = a * 0.5;
  ctx.fillRect(x + 3, y - h / 2, 3, 8);
  // Status panel
  if (w >= 42) {
    ctx.fillStyle = '#162a3c'; ctx.globalAlpha = a * 0.6;
    ctx.fillRect(x - w / 2 + 7, y - h + 14, w - 14, 16);
    ctx.strokeStyle = '#b8a870'; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.4;
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 10, y - h + 22); ctx.lineTo(x + w / 2 - 10, y - h + 22); ctx.stroke();
    // Indicator LEDs
    ctx.fillStyle = '#60c0a0'; ctx.globalAlpha = a * 0.5;
    ctx.fillRect(x - w / 2 + 10, y - h + 17, 3, 3);
    ctx.fillStyle = '#d0a040'; ctx.fillRect(x - w / 2 + 16, y - h + 17, 3, 3);
  }
  // Cable entry grille at bottom
  ctx.strokeStyle = '#3a5565'; ctx.globalAlpha = a * 0.35; ctx.lineWidth = 0.8;
  for (let g = 0; g < 3; g++) {
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 6, y - 12 - g * 4); ctx.lineTo(x + w / 2 - 6, y - 12 - g * 4); ctx.stroke();
  }
}

function drawPipe(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, a: number) {
  for (const dy of [-6, 6]) {
    // Pipe body
    ctx.fillStyle = '#4a6878'; ctx.globalAlpha = a * 0.7;
    roundRect(ctx, x - w / 2, y + dy - 4, w, 8, 3); ctx.fill();
    // Highlight
    ctx.strokeStyle = '#6a8a98'; ctx.lineWidth = 0.8; ctx.globalAlpha = a * 0.35;
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 5, y + dy - 3); ctx.lineTo(x + w / 2 - 5, y + dy - 3); ctx.stroke();
    // Brackets
    ctx.fillStyle = '#5a7888'; ctx.globalAlpha = a * 0.6;
    for (const bx of [x - w * 0.35, x, x + w * 0.35]) {
      roundRect(ctx, bx - 4, y + dy - 5, 8, 10, 1); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawZoneGlow(ctx: CanvasRenderingContext2D, zones: ReturnType<typeof facilityZone>[]) {
  const glows: { cx: number; cy: number; color: string; rx: number; ry: number; alpha: number }[] = [
    // Intake - cool blue arrival
    { cx: zones[0].cx, cy: zones[0].cy, color: '#3a90c0', rx: 200, ry: 160, alpha: 0.14 },
    // Edge - amber/security
    { cx: zones[1].cx, cy: zones[1].cy, color: '#a07040', rx: 170, ry: 130, alpha: 0.11 },
    // Compute - DOMINANT cyan (main hero, biggest and brightest glow)
    { cx: zones[2].cx, cy: zones[2].cy, color: '#30b0e0', rx: 300, ry: 260, alpha: 0.2 },
    // Cache - green/cyan energetic
    { cx: zones[3].cx, cy: zones[3].cy, color: '#38c8a8', rx: 170, ry: 140, alpha: 0.13 },
    // SQL - deep indigo data core
    { cx: zones[4].cx, cy: zones[4].cy, color: '#2858b0', rx: 220, ry: 190, alpha: 0.16 },
  ];

  for (const g of glows) {
    // Outer diffuse glow
    const outerGrad = ctx.createRadialGradient(g.cx, g.cy + 20, 0, g.cx, g.cy + 20, Math.max(g.rx, g.ry) * 1.3);
    outerGrad.addColorStop(0, g.color);
    outerGrad.addColorStop(0.4, g.color);
    outerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = outerGrad; ctx.globalAlpha = g.alpha * 0.4;
    drawEllipse(ctx, g.cx, g.cy + 20, g.rx * 2.6, g.ry * 2.6);
    ctx.fill();
    // Inner bright core
    const innerGrad = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, Math.max(g.rx, g.ry) * 0.6);
    innerGrad.addColorStop(0, g.color);
    innerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = innerGrad; ctx.globalAlpha = g.alpha;
    drawEllipse(ctx, g.cx, g.cy, g.rx * 1.2, g.ry * 1.2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloorVariation(ctx: CanvasRenderingContext2D) {
  // Subtle color variation patches to break uniformity (painted feel)
  const patches = [
    { x: 400, y: 550, r: 120, color: '#0a2030', a: 0.2 },
    { x: 1100, y: 700, r: 180, color: '#0c2838', a: 0.15 },
    { x: 1900, y: 850, r: 140, color: '#081828', a: 0.18 },
    { x: 700, y: 1050, r: 100, color: '#0e2535', a: 0.12 },
    { x: 1600, y: 400, r: 130, color: '#0a2030', a: 0.16 },
    { x: 300, y: 800, r: 90, color: '#122838', a: 0.14 },
    { x: 2100, y: 600, r: 110, color: '#0a1e30', a: 0.15 },
    { x: 1200, y: 1200, r: 150, color: '#0c2030', a: 0.13 },
  ];
  for (const p of patches) {
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    g.addColorStop(0, p.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.globalAlpha = p.a;
    ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  }
  ctx.globalAlpha = 1;
}

function drawEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(1, w / 2), Math.max(1, h / 2), 0, 0, Math.PI * 2);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
