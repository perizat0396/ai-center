import { gsap, reducedMotion } from '../motion.js';

// Печатает текст элемента по буквам (текст берётся из data-text)
function typeIn(el, duration) {
  const text = el.dataset.text;
  const state = { n: 0 };
  return gsap.to(state, {
    n: text.length,
    duration,
    ease: 'none',
    onStart: () => el.classList.add('is-typing'),
    onUpdate: () => { el.textContent = text.slice(0, Math.round(state.n)); },
    onComplete: () => el.classList.remove('is-typing'),
  });
}

// Карточка AI-USTAZ: при наведении увеличивается и показывает сценарий
// «запрос в чат → ответ ИИ → кнопка Use → генерация микрокурса». Повторяется, пока курсор на карточке.
export function initUstazDemo() {
  const card = document.querySelector('[data-demo="ustaz"]');
  if (!card) return;

  const q = (s) => card.querySelector(s);
  const [userType, aiType] = card.querySelectorAll('.ud-type');
  const userMsg = q('.ud-msg--user'), aiMsg = q('.ud-msg--ai'), dots = q('.ud-dots');
  const use = q('.ud-use'), chat = q('.ud-chat'), course = q('.ud-course');
  const bar = q('.ud-bar span'), modules = card.querySelectorAll('.ud-modules li');
  const done = q('.ud-done'), cursor = q('.ud-cursor');

  const reset = () => {
    userType.textContent = ''; aiType.textContent = '';
    use.classList.remove('is-pressed');
    gsap.set([userMsg, aiMsg, use, course, modules, done, cursor], { autoAlpha: 0, y: 0, x: 0, scale: 1 });
    gsap.set(chat, { autoAlpha: 1, y: 0 });
    gsap.set(dots, { display: 'inline-flex' });
    gsap.set(bar, { scaleX: 0 });
  };

  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.4, onRepeat: reset });
  tl.add(reset)
    // 1. пользователь пишет запрос
    .fromTo(userMsg, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.2)
    .add(typeIn(userType, 1.3), 0.35)
    // 2. ИИ «думает» и отвечает
    .fromTo(aiMsg, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 1.9)
    .set(dots, { display: 'none' }, 2.8)
    .add(typeIn(aiType, 1.6), 2.8)
    // 3. появляется кнопка Use, курсор подлетает и нажимает
    .fromTo(use, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 4.5)
    .fromTo(cursor, { autoAlpha: 0, x: () => card.offsetWidth * 0.75, y: () => card.offsetHeight * 0.85 },
      {
        autoAlpha: 1,
        x: () => use.offsetLeft + use.offsetWidth * 0.6,
        y: () => use.offsetTop + use.offsetHeight * 0.4,
        duration: 0.7, ease: 'power2.inOut',
      }, 4.8)
    .to(use, { scale: 0.88, duration: 0.1, onStart: () => use.classList.add('is-pressed') }, 5.55)
    .to(use, { scale: 1, duration: 0.2 }, 5.65)
    .to(cursor, { autoAlpha: 0, duration: 0.2 }, 5.9)
    // 4. чат уходит, начинается генерация микрокурса
    .to(chat, { autoAlpha: 0, y: -16, duration: 0.35 }, 6)
    .fromTo(course, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 6.2)
    .to(bar, { scaleX: 1, duration: 1.8, ease: 'power1.inOut' }, 6.4)
    .fromTo(modules, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.4 }, 6.6)
    .fromTo(done, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 8.4)
    .to({}, { duration: 1.2 });   // подержать готовый результат

  const start = () => {
    if (card.classList.contains('is-demo')) return;
    card.classList.add('is-demo');
    if (reducedMotion) { tl.progress(0.97).pause(); return; }   // без анимации — сразу готовый курс
    tl.restart();
  };
  const stop = () => {
    card.classList.remove('is-demo');
    tl.pause(0);
    reset();
  };

  card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') start(); });
  card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') stop(); });
  card.addEventListener('focus', start);
  card.addEventListener('blur', stop);
  // на телефоне — по касанию
  card.addEventListener('click', (e) => {
    if (e.pointerType === 'mouse') return;
    card.classList.contains('is-demo') ? stop() : start();
  });
  reset();
}
