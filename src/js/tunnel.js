import { config } from '../config.js';

// Световой коридор на canvas: камера летит вглубь футуристического тоннеля.
// На стенах — светящиеся панели, вокруг — размытые огоньки.
// Рисуется только когда блок виден. setBoost(0..1) ускоряет полёт (на смене слов).
export function createTunnel(canvas, { animate = true } = {}) {
  const ctx = canvas.getContext('2d');
  const t = config.cinema.tunnel;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const DEPTH = 12;                      // глубина коридора (условные единицы)
  let w = 0, h = 0, raf = 0, last = 0, visible = false, boost = 0;

  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // Панели на стенах: wall 0..3 — левая, правая, верх, низ; u — положение вдоль стены
  const spawnPanel = (p, z = Math.random() * DEPTH) => {
    p.wall = (Math.random() * 4) | 0;
    p.u = Math.random() * 2 - 1;
    p.z = z;
    p.len = 0.15 + Math.random() * 0.6;  // длина полоски света
    p.color = pick(t.colors);
    p.bright = 0.4 + Math.random() * 0.6;
    return p;
  };
  // Огоньки внутри коридора (боке)
  const spawnDot = (p, z = Math.random() * DEPTH) => {
    p.x = (Math.random() * 2 - 1) * 0.9;
    p.y = (Math.random() * 2 - 1) * 0.9;
    p.z = z;
    p.r = 0.01 + Math.random() * 0.03;
    p.color = pick(t.colors);
    return p;
  };
  const panels = Array.from({ length: t.panels }, () => spawnPanel({}));
  const dots = Array.from({ length: t.dots }, () => spawnDot({}));
  const rings = Array.from({ length: 10 }, (_, i) => ({ z: (i / 10) * DEPTH }));

  function resize() {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Проекция точки коридора на экран: чем дальше (z больше) — тем ближе к центру
  const f = () => Math.min(w, h) * 0.55;
  const proj = (x, y, z) => ({ x: w / 2 + (x / z) * f() * (w / h > 1 ? w / h : 1), y: h / 2 + (y / z) * f() });

  function wallPoint(p, z, along = 0) {
    const u = p.u;
    switch (p.wall) {
      case 0: return proj(-1, u, z + along);
      case 1: return proj(1, u, z + along);
      case 2: return proj(u, -1, z + along);
      default: return proj(u, 1, z + along);
    }
  }

  function draw() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#03040a';
    ctx.fillRect(0, 0, w, h);

    // глубина: тёмно-синее свечение в конце коридора
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.5);
    g.addColorStop(0, `rgba(40,70,200,${0.35 + boost * 0.3})`);
    g.addColorStop(0.4, 'rgba(10,20,60,.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';

    // каркас коридора: прямоугольные «рёбра», уходящие вдаль
    for (const r of rings) {
      const a = proj(-1, -1, r.z), b = proj(1, 1, r.z);
      const alpha = Math.max(0, 1 - r.z / DEPTH) * 0.12;
      ctx.strokeStyle = `rgba(120,150,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    }

    // светящиеся панели на стенах — тянутся вдоль коридора
    const stretch = 1 + boost * 2.5;
    for (const p of panels) {
      if (p.z < 0.25) continue;
      const a = wallPoint(p, p.z), b = wallPoint(p, p.z, p.len * stretch);
      const near = 1 - p.z / DEPTH;
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = Math.max(0, near) * p.bright;
      ctx.lineWidth = Math.max(1, 6 / p.z);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    // размытые огоньки
    for (const d of dots) {
      if (d.z < 0.3) continue;
      const c = proj(d.x, d.y, d.z);
      const rad = (d.r / d.z) * f() * 3;
      const near = 1 - d.z / DEPTH;
      const rg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rad);
      rg.addColorStop(0, d.color);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = near * 0.5;
      ctx.fillStyle = rg;
      ctx.fillRect(c.x - rad, c.y - rad, rad * 2, rad * 2);
    }
    ctx.globalAlpha = 1;

    ctx.globalCompositeOperation = 'source-over';
  }

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const v = t.speed * (1 + boost * t.boost) * dt;   // камера летит вперёд
    for (const p of panels) { p.z -= v; if (p.z < 0.2) spawnPanel(p, DEPTH); }
    for (const d of dots) { d.z -= v; if (d.z < 0.25) spawnDot(d, DEPTH); }
    for (const r of rings) { r.z -= v; if (r.z < 0.3) r.z += DEPTH; }
    draw();
    if (visible) raf = requestAnimationFrame(tick);
  }

  resize();
  draw();
  window.addEventListener('resize', () => { resize(); draw(); });

  if (animate) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) { last = performance.now(); raf = requestAnimationFrame(tick); }
    }).observe(canvas);
  }

  return {
    setBoost(v) { boost = v; if (!animate) draw(); },
  };
}
