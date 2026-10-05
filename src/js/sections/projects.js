import { gsap, reducedMotion } from '../motion.js';
import { config } from '../../config.js';

// Секция 5: «today» закрашивается, стопка карточек → веер → ровный ряд
export function initProjects() {
  const section = document.querySelector('.projects');
  if (!section || reducedMotion) return;

  const c = config.deck;
  const today = section.querySelector('.projects__today');
  const deck = section.querySelector('.deck');
  const cards = [...section.querySelectorAll('.deck__card')];
  const partners = section.querySelectorAll('.partner');

  // «today» закрашивается из серого в чёрный, пока секция въезжает на экран
  gsap.fromTo(today, { '--fill': 0 }, {
    '--fill': 1,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 15%', scrub: true },
  });

  // Смещение каждой карточки к центру колоды (из ряда в стопку).
  // Считаем от реального положения в ряду — работает и на телефоне, где карточки в две строки.
  // offsetLeft/Top не зависят от transform, поэтому расчёт верен и после пересчёта размеров
  const toCenter = (card) => ({
    x: deck.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2),
    y: deck.clientHeight / 2 - (card.offsetTop + card.offsetHeight / 2),
  });
  const mid = (cards.length - 1) / 2;

  // Состояния: закрученная стопка (лежат друг на друге в 3D, как спираль) и раскрытый веер
  const stack = {
    x: (i, el) => toCenter(el).x,
    y: (i, el) => toCenter(el).y - i * c.stackOffsetY,
    rotationX: c.stackRotateX,
    rotationZ: (i) => -c.stackTwist + i * (c.stackTwist * 2 / cards.length),
    scale: 0.9,
  };
  const fan = {
    x: (i, el) => toCenter(el).x + (i - mid) * c.fanSpread,
    y: (i, el) => toCenter(el).y + Math.abs(i - mid) * c.fanSpread * 0.35,
    rotationX: c.stackRotateX * 0.25,
    rotationZ: (i) => (i - mid) * c.fanAngle - c.spin,   // кружатся, раскрываясь
    scale: 0.95,
  };
  // Итог: ряд, где каждая карточка стоит по-своему — на разной высоте и с лёгким наклоном
  const landed = {
    x: 0,
    y: (i) => c.landY[i % c.landY.length],
    rotationX: 0,
    rotationZ: (i) => c.landRotate[i % c.landRotate.length],
    scale: 1,
  };

  gsap.set(cards, { transformOrigin: '50% 90%', transformPerspective: 1400 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: c.scrubLength,
      pin: true,
      scrub: c.scrub,
      invalidateOnRefresh: true,   // пересчитать смещения при изменении размера окна
    },
  });

  tl.fromTo(cards, stack, { ...fan, ease: 'power2.inOut', duration: 0.45, immediateRender: true }, 0)
    .to(cards, { ...landed, ease: 'back.out(1.2)', duration: 0.45, stagger: 0.03 }, 0.45)
    .fromTo(partners, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.15, stagger: 0.03 }, 0.85);
}
