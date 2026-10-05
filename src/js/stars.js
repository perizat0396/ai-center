// Звёздное небо для ночного режима: случайные звёзды разного размера и яркости,
// медленно дрейфуют и смещаются при скролле (параллакс), часть тихо мерцает. Неярко, чтобы не отвлекать от контента.
// Рисуется только в ночной теме и только пока вкладка видна.
import { config } from '../config.js';

export function initStars() {
  const canvas = document.querySelector('.stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const s = config.stars;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let stars = [], raf = 0, last = 0;

  function build() {
    const w = innerWidth, h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((w * h) / 10000 * s.density);
    stars = Array.from({ length: count }, () => {
      const big = Math.random() < 0.06;               // редкие звёзды покрупнее
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: (big ? 0.9 + Math.random() * 0.8 : 0.3 + Math.random() * 0.6) * s.size,
        a: big ? 0.5 + Math.random() * 0.4 : 0.12 + Math.random() * 0.35,
        tw: Math.random() < s.twinkleShare,           // мерцает ли
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 1.2,
        tint: Math.random() < 0.25 ? '190, 205, 255' : '255, 255, 255',
        depth: 0.3 + Math.random() * 0.7,             // «глубина»: ближние звёзды движутся быстрее
      };
    });
  }

  let drift = 0;          // накопленный дрейф неба
  function draw(t) {
    const w = innerWidth, h = innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const st of stars) {
      // медленный дрейф по диагонали + параллакс от прокрутки; за краем — переносим на другую сторону
      const x = ((st.x - drift * s.driftX * st.depth) % w + w) % w;
      const y = ((st.y - drift * s.driftY * st.depth - scrollY * s.parallax * st.depth) % h + h) % h;
      const alpha = st.tw ? st.a * (0.55 + 0.45 * Math.sin(t * 0.001 * st.sp + st.ph)) : st.a;
      ctx.fillStyle = `rgba(${st.tint}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, st.r, 0, Math.PI * 2);
      ctx.fill();
      if (st.r > 1.2 * s.size) {                      // у крупных — лёгкий ореол
        ctx.fillStyle = `rgba(${st.tint}, ${alpha * 0.15})`;
        ctx.beginPath();
        ctx.arc(x, y, st.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  function loop(t) {
    if (t - last > 1000 / 30) {                       // 30 кадров в секунду достаточно
      drift += (t - (last || t)) / 1000;
      draw(t);
      last = t;
    }
    raf = requestAnimationFrame(loop);
  }

  function update() {
    cancelAnimationFrame(raf);
    if (!isDark()) return;
    draw(performance.now());
    if (!reduce) raf = requestAnimationFrame(loop);
  }

  document.documentElement.style.setProperty('--stars-opacity', s.opacity);
  build();
  update();
  window.addEventListener('resize', () => { build(); update(); });
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
