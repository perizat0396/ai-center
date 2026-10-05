import 'lenis/dist/lenis.css';
import './styles/main.css';
import './styles/dark.css';
import './styles/about.css';
import './styles/ustaz-demo.css';
import { initTheme } from './js/theme.js';
import { initStars } from './js/stars.js';
import { initHandFallbacks, initVideoFallback } from './js/fallbacks.js';
import { createTunnel } from './js/tunnel.js';
import { initSmoothScroll, ScrollTrigger, reducedMotion } from './js/motion.js';
import { initHeader } from './js/sections/header.js';
import { initHero } from './js/sections/hero.js';
import { initCinema } from './js/sections/cinema.js';
import { initStats } from './js/sections/stats.js';
import { initProjects } from './js/sections/projects.js';
import { initUstazDemo } from './js/sections/ustaz-demo.js';
import { initFinale } from './js/sections/finale.js';
import { initAbout } from './js/pages/about.js';

initTheme();
initStars();
initHandFallbacks();
let tunnel = null;   // canvas-туннель создаётся, только если нет видео
initVideoFallback((canvas) => { tunnel = createTunnel(canvas, { animate: !reducedMotion }); });

// Анимации подключаются по одной секции
const lenis = initSmoothScroll();
if (import.meta.env.DEV) window.__lenis = lenis;   // для отладки в консоли
// Секции с пином создаются раньше шапки: пины сдвигают позиции секций ниже
initHero();        // 2. Hero
initCinema(() => tunnel);   // 3. Тёмный блок
initHeader();      // 1. Шапка
initStats();       // 4. Цифры
initProjects();    // 5. Карточки
initUstazDemo();   // демо в карточке AI-USTAZ
initFinale();      // 6. Финал (есть и на главной, и на About)
initAbout();       // страница About us

// Пины удлиняют страницу — после каждого пересчёта ScrollTrigger Lenis заново меряет её высоту,
// иначе скролл «упирается» на середине страницы
ScrollTrigger.addEventListener('refresh', () => lenis?.resize());
ScrollTrigger.refresh();

// Пересчитать позиции после загрузки шрифтов и картинок
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());
