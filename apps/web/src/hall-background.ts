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

  // --- Base floor ---
  const floorGrad = ctx.createLinearGradient(0, 0, W, H);
  floorGrad.addColorStop(0, '#0a1e2d');
  floorGrad.addColorStop(0.3, '#0d2436');
  floorGrad.addColorStop(0.6, '#102a3c');
  floorGrad.addColorStop(1, '#081a28');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 0, W, H);

  // --- Isometric floor grid (subtle) ---
  const tile = 56;
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#4a7a94';
  ctx.lineWidth = 0.5;
  for (let row = -1; row < Math.ceil(H / (tile * .55)) + 1; row++) {
    for (let col = -1; col < Math.ceil(W / tile) + 1; col++) {
      const x = col * tile + (row % 2 ? tile / 2 : 0);
      const y = row * tile * .55;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + tile / 2, y + tile * .275);
      ctx.lineTo(x, y + tile * .55); ctx.lineTo(x - tile / 2, y + tile * .275);
      ctx.closePath(); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // --- Floor sectors (visual zones) ---
  const sectorStyle = (color: string, alpha: number) => {
    ctx.fillStyle = color; ctx.globalAlpha = alpha;
  };

  // Ingress zone (left)
  sectorStyle('#0c2a3a', 0.5);
  roundRect(ctx, 60, 440, 480, 400, 24);
  ctx.fill();

  // Security corridor
  sectorStyle('#0e2230', 0.4);
  roundRect(ctx, 560, 480, 380, 380, 20);
  ctx.fill();

  // Central compute hall
  sectorStyle('#0f2638', 0.55);
  roundRect(ctx, 960, 450, 560, 520, 28);
  ctx.fill();

  // Cache acceleration zone
  sectorStyle('#0b2535', 0.4);
  roundRect(ctx, 1340, 340, 380, 380, 22);
  ctx.fill();

  // SQL data-core zone
  sectorStyle('#121e32', 0.5);
  roundRect(ctx, 1580, 520, 520, 480, 26);
  ctx.fill();

  ctx.globalAlpha = 1;

  // --- Floor treatment lines ---
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#3a6070';
  ctx.lineWidth = 2;
  // Main cable run
  ctx.beginPath();
  ctx.moveTo(280, 460); ctx.lineTo(2120, 460);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(280, 990); ctx.lineTo(2120, 990);
  ctx.stroke();

  // Zone separator strips
  ctx.globalAlpha = 0.15;
  for (const y of [460, 990]) {
    ctx.fillStyle = '#091d2c';
    ctx.fillRect(280, y - 6, 1840, 13);
    ctx.strokeStyle = '#7cd3d8';
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(280, y - 6); ctx.lineTo(2120, y - 6); ctx.stroke();
    ctx.globalAlpha = 0.15;
  }
  // Amber safety markings
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = '#cfb56f';
  ctx.lineWidth = 3;
  for (let x = 300; x < 2110; x += 135) {
    ctx.beginPath(); ctx.moveTo(x, 456); ctx.lineTo(x + 22, 456); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, 986); ctx.lineTo(x + 22, 986); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // --- Wall (top) ---
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 120);
  wallGrad.addColorStop(0, '#1c3046');
  wallGrad.addColorStop(0.5, '#2c4358');
  wallGrad.addColorStop(1, '#1a3248');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, W, 120);
  // Wall panel lines
  ctx.strokeStyle = '#30495b';
  ctx.lineWidth = 1.5;
  for (let x = 30; x < W; x += 140) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 120); ctx.stroke();
  }
  // Wall trim
  ctx.strokeStyle = '#59788a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 11); ctx.lineTo(W, 11); ctx.stroke();
  ctx.strokeStyle = '#aa9464';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(W, 20); ctx.stroke();
  ctx.strokeStyle = '#14293d';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 13); ctx.lineTo(W, 13); ctx.stroke();

  // --- Wall lights ---
  for (let x = 78; x < W; x += 140) {
    ctx.fillStyle = '#ffd89a';
    ctx.globalAlpha = 0.07;
    drawEllipse(ctx, x, 145, 95, 70);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#f0d5a4';
    roundRect(ctx, x - 8, 25, 17, 5, 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // --- Side walls ---
  ctx.fillStyle = '#293f53';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(21, 10); ctx.lineTo(21, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#22384d';
  ctx.beginPath();
  ctx.moveTo(W - 16, 12); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(W - 16, H); ctx.closePath();
  ctx.fill();

  // --- Overhead cable runs (top area) ---
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#152b40';
  ctx.fillRect(35, 155, W - 70, 14);
  ctx.strokeStyle = '#65a5bd';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(35, 159); ctx.lineTo(W - 35, 159); ctx.stroke();
  ctx.strokeStyle = '#abb895';
  ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.moveTo(35, 167); ctx.lineTo(W - 35, 167); ctx.stroke();
  // Vertical cable drops
  ctx.strokeStyle = '#334d61';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.4;
  for (let x = 40; x < W - 40; x += 55) {
    ctx.beginPath(); ctx.moveTo(x, 157); ctx.lineTo(x, 170); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // --- Static background racks (baked, NOT individual objects) ---
  drawBackgroundRacks(ctx, zones);

  // --- Floor bottom baseboard ---
  ctx.fillStyle = '#1c3445';
  ctx.globalAlpha = 0.8;
  ctx.fillRect(22, H - 15, W - 44, 8);
  ctx.globalAlpha = 1;
  for (let x = 32; x < W - 25; x += 120) {
    ctx.strokeStyle = '#4a6270';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, H - 32); ctx.lineTo(x, H - 11); ctx.stroke();
    ctx.fillStyle = '#c2b181';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(x - 4, H - 34, 8, 3);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = '#314857';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(25, H - 19); ctx.lineTo(W - 25, H - 19); ctx.stroke();
  ctx.strokeStyle = '#b9a77b';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.75;
  ctx.beginPath(); ctx.moveTo(25, H - 23); ctx.lineTo(W - 25, H - 23); ctx.stroke();
  ctx.globalAlpha = 1;
  for (let x = 27; x < W - 25; x += 44) {
    ctx.strokeStyle = '#c1ae7c';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(x, H - 20); ctx.lineTo(x + 7, H - 26); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // --- Atmospheric depth overlays ---
  // Vignette-like darkness at edges
  const vigL = ctx.createLinearGradient(0, 0, 200, 0);
  vigL.addColorStop(0, 'rgba(4,12,20,0.45)');
  vigL.addColorStop(1, 'rgba(4,12,20,0)');
  ctx.fillStyle = vigL;
  ctx.fillRect(0, 120, 200, H - 120);

  const vigR = ctx.createLinearGradient(W, 0, W - 200, 0);
  vigR.addColorStop(0, 'rgba(4,12,20,0.45)');
  vigR.addColorStop(1, 'rgba(4,12,20,0)');
  ctx.fillStyle = vigR;
  ctx.fillRect(W - 200, 120, 200, H - 120);

  const vigB = ctx.createLinearGradient(0, H, 0, H - 150);
  vigB.addColorStop(0, 'rgba(4,12,20,0.4)');
  vigB.addColorStop(1, 'rgba(4,12,20,0)');
  ctx.fillStyle = vigB;
  ctx.fillRect(0, H - 150, W, 150);

  // --- Facility zone glow pools ---
  drawZoneGlow(ctx, zones);

  // --- Ambient haze at top ---
  const haze = ctx.createLinearGradient(0, 120, 0, 350);
  haze.addColorStop(0, 'rgba(16,36,52,0.6)');
  haze.addColorStop(1, 'rgba(16,36,52,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 120, W, 230);

  return canvas;
}

function drawBackgroundRacks(ctx: CanvasRenderingContext2D, zones: ReturnType<typeof facilityZone>[]) {
  const racks: { x: number; y: number; w: number; h: number; kind: 'rack' | 'cooling' | 'cabinet' | 'pipe' }[] = [];

  // Top row racks (behind facilities)
  for (let i = 0; i < 7; i++) racks.push({ x: 480 + i * 155, y: 250, w: 54, h: 98 + (i % 3) * 10, kind: i % 4 === 2 ? 'cooling' : 'rack' });
  // Left infrastructure column
  for (let i = 0; i < 5; i++) racks.push({ x: 155, y: 500 + i * 118, w: 70, h: 100 + (i % 2) * 16, kind: i % 2 ? 'cabinet' : 'cooling' });
  // Right infrastructure column
  for (let i = 0; i < 5; i++) racks.push({ x: 2235, y: 500 + i * 118, w: 70, h: 100 + (i % 2) * 16, kind: i % 2 ? 'cooling' : 'cabinet' });
  // Back rack rows (deeper in hall)
  for (let i = 0; i < 8; i++) racks.push({ x: 550 + i * 148, y: 330 + (i % 2) * 8, w: 60, h: 95, kind: i % 5 === 3 ? 'cooling' : 'rack' });
  // Lower infrastructure
  for (let i = 0; i < 7; i++) racks.push({ x: 820 + i * 155, y: 1100 + (i % 2) * 14, w: 58, h: 92, kind: i % 6 === 4 ? 'cooling' : 'rack' });
  for (let i = 0; i < 5; i++) racks.push({ x: 200 + i * 150, y: 1110, w: 64, h: 96, kind: i % 3 === 0 ? 'cooling' : 'rack' });
  // Electrical/power zone (right of SQL)
  for (let i = 0; i < 4; i++) racks.push({ x: 1480 + i * 180, y: 250, w: 62, h: 110, kind: 'cabinet' });
  for (let i = 0; i < 4; i++) racks.push({ x: 1505 + i * 180, y: 420, w: 52, h: 85, kind: i % 2 ? 'cooling' : 'cabinet' });
  // Service corridors - pipe runs
  for (let i = 0; i < 5; i++) racks.push({ x: 225 + i * 145, y: 1260, w: 80, h: 30, kind: 'pipe' });

  // Filter out anything overlapping facility zones
  const visible = racks.filter(r => !overlapsAny(r.x - r.w / 2, r.y - r.h, r.w, r.h + 15, zones));

  for (const rack of visible) {
    const { x, y, w, h, kind } = rack;
    // Contact shadow
    ctx.fillStyle = '#040c14';
    ctx.globalAlpha = 0.35;
    drawEllipse(ctx, x, y + 4, w * 1.8, 14);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (kind === 'pipe') {
      drawPipe(ctx, x, y, w);
      continue;
    }

    // Isometric box
    const frontColor = kind === 'rack' ? '#2a3d4e' : kind === 'cooling' ? '#3a5562' : '#384d5e';
    const sideColor = kind === 'rack' ? '#1c2e3c' : kind === 'cooling' ? '#2a4350' : '#283c4e';
    const topColor = kind === 'rack' ? '#506878' : kind === 'cooling' ? '#5a7a84' : '#4a6272';
    const depth = 10;

    // Front face
    ctx.fillStyle = frontColor;
    ctx.globalAlpha = 0.72;
    ctx.fillRect(x - w / 2, y - h, w, h);

    // Side face
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - h); ctx.lineTo(x + w / 2 + depth, y - h - 6);
    ctx.lineTo(x + w / 2 + depth, y - 6); ctx.lineTo(x + w / 2, y);
    ctx.closePath(); ctx.fill();

    // Top face
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w / 2 + depth, y - h - 6);
    ctx.lineTo(x + w / 2 + depth, y - h - 6); ctx.lineTo(x + w / 2, y - h);
    ctx.closePath(); ctx.fill();

    ctx.globalAlpha = 1;

    if (kind === 'rack') {
      // Inner panel
      ctx.fillStyle = '#131f2c';
      ctx.globalAlpha = 0.75;
      ctx.fillRect(x - w / 2 + 4, y - h + 7, w - 8, h - 14);

      // Server slots
      const slots = Math.floor((h - 20) / 12);
      for (let j = 0; j < slots; j++) {
        const sy = y - h + 11 + j * ((h - 22) / slots);
        ctx.strokeStyle = '#3d5868';
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(x - w / 2 + 6, sy); ctx.lineTo(x + w / 2 - 6, sy + 2); ctx.stroke();
        // Status LED
        ctx.fillStyle = j % 3 === 0 ? '#5fafd1' : '#3a6080';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x + w / 2 - 9, sy, 2, 2);
      }
      // Frame highlight
      ctx.strokeStyle = '#6b8fa3';
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(x - w / 2 + 3, y - h + 6, w - 6, h - 13);
      // Top LED strip
      ctx.strokeStyle = '#45b1d6';
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - w / 2 + 5, y - h + 4); ctx.lineTo(x + w / 2 - 5, y - h + 8); ctx.stroke();
      // Label plate
      ctx.fillStyle = '#c3b58a';
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x - w / 2 + 6, y - 12, 9, 3);
    } else if (kind === 'cooling') {
      // Fan circles
      for (let j = 0; j < 2; j++) {
        const fy = y - h + 15 + j * (h - 30) / 2;
        ctx.fillStyle = '#2a3a44';
        ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc(x, fy, w * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8aa0a8';
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(x, fy, w * 0.22, 0, Math.PI * 2); ctx.stroke();
        // Fan blades
        ctx.beginPath(); ctx.moveTo(x - 4, fy - 4); ctx.lineTo(x + 4, fy + 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 4, fy + 4); ctx.lineTo(x + 4, fy - 4); ctx.stroke();
      }
    } else {
      // Cabinet door frame
      ctx.strokeStyle = '#7a8e98';
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x - w / 2 + 3, y - h + 7, w - 6, h - 14);
      // Handle
      ctx.fillStyle = '#b9a26b';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x + 2, y - 20, 3, 6);
    }
    ctx.globalAlpha = 1;
  }
}

function drawPipe(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = '#4a6878';
  ctx.globalAlpha = 0.55;
  for (const dy of [-8, 4]) {
    ctx.fillRect(x - w / 2, y + dy, w, 7);
    // Pipe brackets
    for (const bx of [x - w / 3, x, x + w / 3]) {
      ctx.fillStyle = '#6a838e';
      ctx.fillRect(bx - 3, y + dy - 2, 6, 11);
    }
    ctx.fillStyle = '#4a6878';
  }
  ctx.globalAlpha = 1;
}

function drawZoneGlow(ctx: CanvasRenderingContext2D, zones: ReturnType<typeof facilityZone>[]) {
  const glows: { cx: number; cy: number; color: string; rx: number; ry: number; alpha: number }[] = [
    // Intake - cool blue arrival glow
    { cx: zones[0].cx, cy: zones[0].cy, color: '#4a9ec8', rx: 160, ry: 120, alpha: 0.06 },
    // Edge - subtle red/amber security glow
    { cx: zones[1].cx, cy: zones[1].cy, color: '#8a6040', rx: 140, ry: 100, alpha: 0.05 },
    // Compute - dominant cyan glow (main hero)
    { cx: zones[2].cx, cy: zones[2].cy, color: '#3aaccc', rx: 220, ry: 180, alpha: 0.08 },
    // Cache - green/cyan energetic glow
    { cx: zones[3].cx, cy: zones[3].cy, color: '#40b8a0', rx: 130, ry: 100, alpha: 0.06 },
    // SQL - deep blue/indigo data core glow
    { cx: zones[4].cx, cy: zones[4].cy, color: '#3060a0', rx: 180, ry: 140, alpha: 0.07 },
  ];

  for (const g of glows) {
    const grad = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, Math.max(g.rx, g.ry));
    grad.addColorStop(0, g.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.globalAlpha = g.alpha;
    drawEllipse(ctx, g.cx, g.cy, g.rx * 2, g.ry * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
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
