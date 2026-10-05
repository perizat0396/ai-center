import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { config } from '../config.js';

gsap.registerPlugin(ScrollTrigger);

// true, если в системе включено «Уменьшить движение»
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Плавный скролл Lenis, синхронизированный с ScrollTrigger.
// При reduced motion — обычный нативный скролл.
export function initSmoothScroll() {
  if (reducedMotion) return null;

  const lenis = new Lenis({
    duration: config.lenis.duration,
    wheelMultiplier: config.lenis.wheelMultiplier,
    anchors: { offset: 0 },   // плавный переход по якорным ссылкам
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export { gsap, ScrollTrigger };
