import { ScrollTrigger } from '../motion.js';
import { config } from '../../config.js';

// Шапка плавно инвертирует цвета, пока под ней находится тёмный блок.
// Переход цвета делает CSS (.header.is-inverted), длительность берётся из конфига.
export function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  header.style.setProperty('--t-base', `${config.header.themeDuration}s`);

  // только секции: в ночном режиме data-theme="dark" стоит и на самом <html>
  document.querySelectorAll('section[data-theme="dark"]').forEach((section) => {
    // Если блок закреплён (pin), ориентируемся на его обёртку — она учитывает длину пина
    const target = section.parentElement?.classList.contains('pin-spacer') ? section.parentElement : section;
    ScrollTrigger.create({
      trigger: target,
      // переключаемся, когда край тёмного блока проходит середину шапки
      start: () => `top ${header.offsetHeight / 2}px`,
      end: () => `bottom ${header.offsetHeight / 2}px`,
      toggleClass: { targets: header, className: 'is-inverted' },
      invalidateOnRefresh: true,
    });
  });
}
