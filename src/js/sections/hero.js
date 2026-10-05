import { gsap, reducedMotion } from '../motion.js';
import { config } from '../../config.js';

// Делит строку на слова-span. Последние N слов (data-ink-words) станут чёрными,
// остальные — серыми, как на референсе.
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  const inkCount = Number(el.dataset.inkWords ?? words.length);
  el.innerHTML = words
    .map((w, i) => {
      const soft = i < words.length - inkCount;
      return `<span class="hero__word${soft ? ' hero__word--soft' : ''}">${w}</span>`;
    })
    .join(' ');
  return el.querySelectorAll('.hero__word');
}

export function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const c = config.hero;
  hero.style.setProperty('--hands-gap', c.handsGap);
  hero.style.setProperty('--hand-left-width', c.handsWidthLeft);
  hero.style.setProperty('--hand-right-width', c.handsWidthRight);

  const words = splitWords(hero.querySelector('.hero__line--reveal'));
  if (reducedMotion) return;   // всё остаётся в финальном статичном состоянии

  const title = hero.querySelector('.hero__title');
  const left = hero.querySelector('.hand--left');
  const right = hero.querySelector('.hand--right');

  // ---------- Загрузка ----------
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

  intro.fromTo('.hero__line:first-child',
      { yPercent: 30, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 1 },
      0.1);

  // Вторая строка проявляется слово за словом. Анимируем долю закрашивания --fill (0→1),
  // а сам цвет берёт CSS из текущей темы — поэтому всё верно и в дневном, и в ночном режиме
  intro.fromTo(words,
      { '--fill': 0 },
      {
        '--fill': 1,
        duration: c.wordDuration,
        stagger: c.wordStagger,
        ease: 'power2.out',
      },
      0.5);

  // Стартовая позиция рук (её же потом двигает скролл): у краёв экрана, с наклоном
  gsap.set(left,  { x: `-${c.handsStart}vw`, rotation: c.handsTiltLeft });
  gsap.set(right, { x: `${c.handsStart}vw`,  rotation: c.handsTiltRight });

  // Появление двигает внутреннюю обёртку (.hand__float), а не саму руку —
  // поэтому оно не спорит со скролл-анимацией, даже если начать скроллить сразу
  const [floatL, floatR] = hero.querySelectorAll('.hand__float');
  intro.fromTo([left, right], { autoAlpha: 0 }, { autoAlpha: 1, duration: c.handsDuration * 0.6 }, c.handsDelay)
    .fromTo(floatL, { x: '-15vw' }, { x: 0, duration: c.handsDuration }, c.handsDelay)
    .fromTo(floatR, { x: '15vw' },  { x: 0, duration: c.handsDuration }, c.handsDelay);

  intro.fromTo(['.hero__intro', '.hero__chips .chip'],
      { y: 16, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06 },
      1);

  // ---------- «Живые» руки ----------
  // Постоянное мягкое покачивание: каждая рука в своём ритме, поэтому движение не выглядит механическим
  const floats = hero.querySelectorAll('.hand__float');
  floats.forEach((el, i) => {
    const dir = i === 0 ? 1 : -1;
    const d = c.idleDuration * (i === 0 ? 1 : 1.27);
    gsap.fromTo(el,
      { rotation: -c.idleSway * dir, y: -c.idleFloat },
      { rotation: c.idleSway * dir, y: c.idleFloat, duration: d, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.6 });
  });

  // Растворение шара: множитель --orb-fade (прозрачность из настроек не трогаем)
  const orb = hero.querySelector('.hero__orb');
  const orbFade = { v: 1 };
  const setOrbFade = () => orb.style.setProperty('--orb-fade', orbFade.v.toFixed(3));

  // ---------- Скролл ----------
  // Hero закрепляется: руки медленно сходятся, текст в это время уходит назад
  const scrollTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: c.pinLength,
      pin: true,
      scrub: c.scrub,
      invalidateOnRefresh: true,
    },
  });

  scrollTl
    // руки и текст движутся одновременно на протяжении всего пина
    // руки сближаются и одновременно «выпрямляются» от плеча — живое движение, как у рук на референсе
    .fromTo(left,
      { x: () => `-${c.handsStart}vw`, rotation: c.handsTiltLeft },
      { x: 0, rotation: 0, duration: 1, ease: 'power1.inOut', immediateRender: false }, 0)
    .fromTo(right,
      { x: () => `${c.handsStart}vw`, rotation: c.handsTiltRight },
      { x: 0, rotation: 0, duration: 1, ease: 'power1.inOut', immediateRender: false }, 0)
    // лёгкое «покачивание» кистей по пути: чуть вверх-вниз навстречу друг другу
    .to(left,  { y: '-1.5vw', duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0)
    .to(right, { y: '1.5vw',  duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0)
    .to(title, {
      scale: c.recedeScale,
      opacity: c.recedeOpacity,
      filter: `blur(${c.recedeBlur}px)`,
      duration: 1,
      ease: 'power1.in',
    }, 0)
    // явные начальные значения: даже если скроллить во время появления, при возврате наверх текст вернётся
    .fromTo(['.hero__intro', '.hero__chips'],
      { autoAlpha: 1, y: 0 },
      { autoAlpha: 0, y: -20, duration: 0.3, immediateRender: false }, 0.6)
    // пока руки сближаются, шар тает и полностью исчезает ещё до касания
    .fromTo(orbFade, { v: 1 }, { v: 0, duration: 0.45, ease: 'power1.in', onUpdate: setOrbFade }, 0.35)
    // в самом конце между пальцами вспыхивает свет — момент «касания»
    .fromTo('.hero__spark', { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' }, 0.8)
    // из точки касания раскрывается круглый свет, и в нём появляется логотип
    .fromTo('.hero__reveal-light', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.95)
    .fromTo('.hero__reveal-logo', { scale: 0.4, opacity: 0, filter: 'blur(12px)' },
      { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.3, ease: 'back.out(1.6)' }, 1.1)
    .fromTo('.hero__reveal-name', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, 1.25)
    .to('.hero__spark', { opacity: 0, duration: 0.2 }, 1.1)
    .to({}, { duration: 0.15 });   // небольшая пауза, чтобы логотип успели увидеть
}
