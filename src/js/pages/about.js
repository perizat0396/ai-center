import { gsap, ScrollTrigger, reducedMotion } from '../motion.js';
import { config } from '../../config.js';

// Делит текст на слова-span с классом cls
function splitWords(el, cls) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="${cls}">${w}</span>`).join(' ');
  return [...el.querySelectorAll(`.${cls}`)];
}

// Страница About us
export function initAbout() {
  const page = document.querySelector('.page-about');
  if (!page) return;
  const c = config.about;

  // слова второй строки заголовка: последние N — полный цвет, остальные — серые (как на главной)
  const reveal = page.querySelector('.about-hero__line--reveal');
  const ink = Number(reveal.dataset.inkWords ?? 99);
  const heroWords = splitWords(reveal, 'hero__word');
  heroWords.forEach((w, i) => { if (i < heroWords.length - ink) w.classList.add('hero__word--soft'); });
  const missionWords = splitWords(page.querySelector('.mission__text'), 'mission__word');

  const students = [...page.querySelectorAll('.student')];
  initStudentFilter(page, students);   // фильтр работает и без анимаций

  if (reducedMotion) {
    page.querySelectorAll('.timeline__item').forEach((el) => el.classList.add('is-active'));
    return;
  }

  // ---------- 1. Hero: появление ----------
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro.fromTo('.about-hero__eyebrow', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.1)
    .fromTo('.about-hero__line:first-child', { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1 }, 0.2)
    .fromTo(heroWords, { '--fill': 0 }, { '--fill': 1, duration: 0.9, stagger: 0.12, ease: 'power2.out' }, 0.6)
    .fromTo('.about-hero__bottom', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, 1);

  // при скролле шар уплывает вверх, заголовок уходит назад
  gsap.to('.about-hero__orb-wrap', {
    yPercent: -20, ease: 'none',
    scrollTrigger: { trigger: '.about-hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.about-hero__title', {
    scale: 0.92, opacity: 0.3, ease: 'none',
    scrollTrigger: { trigger: '.about-hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // ---------- 2. Mission: слова закрашиваются по скроллу ----------
  gsap.fromTo(missionWords, { '--fill': 0 }, {
    '--fill': 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.mission', start: 'top 70%', end: 'bottom 70%', scrub: true },
  });

  // ---------- 3. Story: линия прорисовывается, годы «загораются» ----------
  const fill = page.querySelector('.timeline__fill');
  ScrollTrigger.create({
    trigger: '.timeline',
    start: 'top 65%',
    end: 'bottom 65%',
    scrub: true,
    onUpdate: (self) => fill.style.setProperty('--progress', self.progress.toFixed(3)),
    onLeaveBack: () => fill.style.setProperty('--progress', '0'),
  });
  fill.style.setProperty('--progress', '0');
  page.querySelectorAll('.timeline__item').forEach((item) => {
    gsap.fromTo(item, { x: 40, autoAlpha: 0 }, {
      x: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 80%', toggleActions: 'play none none reverse' },
    });
    ScrollTrigger.create({
      trigger: item, start: 'top 65%',
      onEnter: () => item.classList.add('is-active'),
      onLeaveBack: () => item.classList.remove('is-active'),
    });
  });

  // ---------- Заголовки секций ----------
  page.querySelectorAll('.section-title, .eyebrow:not(.about-hero__eyebrow)').forEach((el) => {
    gsap.fromTo(el, { y: 30, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  });

  // ---------- 4. Offer: карточки выезжают по очереди и наклоняются за курсором ----------
  const cards = page.querySelectorAll('.offer__card');
  gsap.fromTo(cards, { y: 60, rotationX: -18, autoAlpha: 0 }, {
    y: 0, rotationX: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.1,
    scrollTrigger: { trigger: '.offer__grid', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
  if (matchMedia('(hover: hover)').matches) {
    cards.forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * c.tilt);
        rx(-((e.clientY - r.top) / r.height - 0.5) * c.tilt);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  // ---------- 5. Team: строки выезжают, линии прорисовываются ----------
  const rows = page.querySelectorAll('.staff__row');
  rows.forEach((row, i) => {
    gsap.fromTo(row.querySelectorAll('.staff__index, .staff__avatar, .staff__name, .staff__focus, .staff__role, .staff__arrow'),
      { yPercent: 60, autoAlpha: 0 },
      {
        yPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out', stagger: 0.04, delay: i * 0.08,
        scrollTrigger: { trigger: row, start: 'top 90%', toggleActions: 'play none none reverse' },
      });
  });
  initStaffPreview(page, rows);

  // ---------- 6. Студенты: появляются по очереди, фильтр по проектам ----------
  gsap.fromTo(students, { y: 30, autoAlpha: 0 }, {
    y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06,
    scrollTrigger: { trigger: '.students__grid', start: 'top 85%', toggleActions: 'play none none reverse' },
  });
}

// Фильтр студентов по проекту: скрытые карточки исчезают, оставшиеся плавно встают на новые места (FLIP)
function initStudentFilter(page, students) {
  const buttons = [...page.querySelectorAll('.filter')];
  buttons.forEach((btn) => btn.addEventListener('click', () => {
    const project = btn.dataset.filter;
    buttons.forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });

    const before = new Map(students.map((el) => [el, el.getBoundingClientRect()]));
    students.forEach((el) => el.classList.toggle('is-hidden', project !== 'All' && el.dataset.project !== project));
    if (reducedMotion) return ScrollTrigger.refresh();

    students.forEach((el) => {
      if (el.classList.contains('is-hidden')) return;
      const a = before.get(el), b = el.getBoundingClientRect();
      const wasHidden = a.width === 0;
      gsap.fromTo(el,
        wasHidden ? { autoAlpha: 0, scale: 0.92, x: 0, y: 12 } : { x: a.left - b.left, y: a.top - b.top },
        { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.5, ease: 'power3.out' });
    });
    ScrollTrigger.refresh();   // высота секции изменилась — пересчитать позиции ниже
  }));
}

// Фото сотрудника летит за курсором, пока он над строкой (только на устройствах с мышью)
function initStaffPreview(page, rows) {
  const preview = page.querySelector('.staff__preview');
  if (!preview || !matchMedia('(hover: hover)').matches) return;
  const photo = preview.querySelector('.staff__preview-photo');
  const half = () => preview.offsetWidth / 2;
  const x = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
  const y = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });
  const tilt = gsap.quickTo(preview, 'rotation', { duration: 0.6, ease: 'power3.out' });
  let lastX = 0;

  rows.forEach((row) => {
    row.addEventListener('pointerenter', (e) => {
      const css = getComputedStyle(row);
      preview.style.setProperty('--g1', css.getPropertyValue('--g1'));
      preview.style.setProperty('--g2', css.getPropertyValue('--g2'));
      // если у строки есть data-photo — показываем фото, иначе инициалы на градиенте
      photo.style.setProperty('--photo', row.dataset.photo ? `url(${row.dataset.photo})` : 'none');
      photo.textContent = row.dataset.photo ? '' : row.querySelector('.staff__avatar').textContent;
      gsap.set(preview, { x: e.clientX - half(), y: e.clientY - half() * 1.25 });
      preview.classList.add('is-visible');
    });
    row.addEventListener('pointerleave', () => preview.classList.remove('is-visible'));
  });

  window.addEventListener('pointermove', (e) => {
    x(e.clientX - half());
    y(e.clientY - half() * 1.25);
    tilt(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.6));   // лёгкий наклон по направлению движения
    lastX = e.clientX;
  });
}
