import { gsap, ScrollTrigger, reducedMotion } from '../motion.js';
import { config } from '../../config.js';

// Делит текст на буквы-span (пробелы — неразрывные, чтобы не схлопывались)
function splitChars(el) {
  const chars = [...el.textContent];
  el.innerHTML = chars.map((ch) => `<span class="marquee__char">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  return [...el.querySelectorAll('.marquee__char')];
}

// Делит абзац на слова-span
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="finale__word">${w}</span>`).join(' ');
  return [...el.querySelectorAll('.finale__word')];
}

// Секция 6: бесконечная бегущая строка (ускоряется при скролле); буквы, уходящие влево, перетекают из серого в чёрный
export function initFinale() {
  const section = document.querySelector('.finale');
  if (!section || reducedMotion) return;

  const c = config.marquee;
  const track = section.querySelector('.marquee__track');
  const chars = [...section.querySelectorAll('.marquee__item')].flatMap(splitChars);
  const words = splitWords(section.querySelector('.finale__text'));

  // Цвет буквы зависит от её положения на экране:
  // левее границы — чёрная, правее — серая, между ними плавный переход
  const paint = () => {
    const vw = window.innerWidth;
    const from = vw * c.inkEdge, span = vw * c.fadeWidth;
    for (const ch of chars) {
      const r = ch.getBoundingClientRect();
      const t = gsap.utils.clamp(0, 1, (r.left + r.width / 2 - from) / span);
      ch.style.setProperty('--fill', (1 - t).toFixed(3));   // 1 — цвет текста, 0 — серый (цвета берёт CSS из темы)
    }
  };

  // Бесконечная бегущая строка: две одинаковые копии, сдвиг на −50% = ровно одна копия,
  // поэтому цикл бесшовный и вся фраза постоянно проплывает мимо
  const loop = gsap.fromTo(track, { xPercent: 0 }, {
    xPercent: -50,
    duration: c.loopDuration,
    ease: 'none',
    repeat: -1,
    paused: true,           // запускается, когда финал появляется на экране
  });

  // При скролле строка ускоряется, потом плавно возвращается к обычной скорости
  let boost = 1;
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      boost = Math.max(boost, 1 + Math.min(Math.abs(self.getVelocity()) / c.boostSensitivity, c.maxBoost));
    },
    onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),   // вне экрана — не крутим
  });
  // Колесо мыши и свайп разгоняют строку напрямую — даже в самом конце страницы,
  // где прокручивать уже некуда и скорость скролла равна нулю
  let visible = false;
  ScrollTrigger.create({
    trigger: section, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { visible = self.isActive; },
  });
  const kick = (delta) => {
    if (!visible) return;
    boost = Math.min(1 + c.maxBoost, boost + Math.abs(delta) / c.wheelSensitivity);
  };
  window.addEventListener('wheel', (e) => kick(e.deltaY || e.deltaX), { passive: true });
  let touchY = null;
  window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    const y = e.touches[0].clientY;
    if (touchY !== null) kick((touchY - y) * 3);
    touchY = y;
  }, { passive: true });

  gsap.ticker.add(() => {
    boost += (1 - boost) * c.boostDecay;   // плавно возвращаемся к обычной скорости
    loop.timeScale(boost);
    if (!loop.paused()) paint();
  });

  // Абзац закрашивается по словам из серого в чёрный, пока финал въезжает на экран
  gsap.fromTo(words, { '--fill': 0 }, {
    '--fill': 1,
    stagger: 0.05,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 70%', end: 'bottom bottom', scrub: true },
  });

  paint();
  window.addEventListener('resize', paint);

  // кнопки и футер мягко появляются
  gsap.fromTo('.finale__actions .pill',
    { y: 30, autoAlpha: 0 },
    {
      y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.finale__body', start: 'top 85%', toggleActions: 'play none none reverse' },
    });

  gsap.fromTo('.footer > *',
    { y: 16, autoAlpha: 0 },
    {
      y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06,
      scrollTrigger: { trigger: '.footer', start: 'top 98%', toggleActions: 'play none none reverse' },
    });
}
