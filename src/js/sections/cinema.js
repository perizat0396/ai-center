import { gsap, reducedMotion } from '../motion.js';
import { config } from '../../config.js';

// Длинные слова уменьшаются, чтобы поместиться в ширину экрана.
// offsetWidth не зависит от transform-анимации.
function fitWords(section, items, maxShare) {
  const max = section.clientWidth * maxShare;
  items.forEach((el) => {
    el.style.fontSize = '';
    const width = el.offsetWidth;
    if (width > max) {
      const size = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = `${Math.floor(size * (max / width))}px`;
    }
  });
}

// Секция 3: камера летит вглубь светового коридора, коридор «съедает» слово —
// оно уходит в глубину, а следующее выплывает из глубины навстречу
export function initCinema(getTunnel) {
  const section = document.querySelector('.cinema');
  if (!section) return;

  const c = config.cinema;
  const items = [...section.querySelectorAll('.cinema__item')];

  const fit = () => fitWords(section, items, c.maxWidth);
  fit();
  document.fonts?.ready.then(fit);
  window.addEventListener('resize', fit);

  if (reducedMotion) return;   // при reduced motion — статичное первое слово

  // Состояния слова: «в глубине» (маленькое, размытое) и «съеденное» (улетело ещё дальше)
  const deep = { scale: c.depthScale, opacity: 0, filter: 'blur(10px)' };
  const eaten = { scale: c.eatScale, opacity: 0, filter: 'blur(14px)' };

  gsap.set(items.slice(1), deep);

  const speed = { boost: 0 };   // ускорение коридора на смене слов

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: c.pinLength,
      pin: true,
      scrub: c.scrub,
    },
    onUpdate: () => getTunnel()?.setBoost(speed.boost),
  });

  for (let k = 0; k < items.length - 1; k++) {
    const at = k + 0.15;
    tl.fromTo(items[k], { scale: 1, opacity: 1, filter: 'blur(0px)' },
        { ...eaten, ease: 'power2.in', duration: 0.45, immediateRender: false }, at)
      .to(items[k + 1], { scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.5 }, at + 0.35)
      .to(speed, { boost: 1, ease: 'power2.in', duration: 0.35 }, at)
      .to(speed, { boost: 0, ease: 'power2.out', duration: 0.5 }, at + 0.35);
  }
  tl.to({}, { duration: 0.35 });   // пауза на последнем слове

  gsap.fromTo(section.querySelector('.cinema__text'),
    { y: 30, autoAlpha: 0 },
    {
      y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 40%', toggleActions: 'play none none reverse' },
    });
}
