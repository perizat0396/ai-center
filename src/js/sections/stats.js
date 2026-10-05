import { gsap, reducedMotion } from '../motion.js';
import { config } from '../../config.js';

// Последняя цифра превращается в «барабан» слот-машины: столбик цифр,
// который прокручивается снизу вверх и останавливается на нужной
function buildRoller(valueEl) {
  const text = valueEl.dataset.to;
  const head = text.slice(0, -1);           // первые цифры стоят на месте
  const target = Number(text.slice(-1));    // последняя — крутится
  // один полный круг цифр, заканчивающийся на нужной
  const seq = Array.from({ length: 10 }, (_, i) => (target + 1 + i) % 10);
  valueEl.innerHTML =
    `${head}<span class="roller"><span class="roller__col">${seq.map((d) => `<span>${d}</span>`).join('')}</span></span>`;
  return { col: valueEl.querySelector('.roller__col'), steps: seq.length - 1 };
}

// Секция 4: сначала быстро прокручиваются цифры, потом при скролле
// выезжают стеклянные полосы с кружками (data-end="left" — едут налево, "right" — направо)
export function initStats() {
  const section = document.querySelector('.stats');
  const rows = [...document.querySelectorAll('.stat')];
  if (!section || !rows.length || reducedMotion) return;

  const c = config.stats;

  // 1. Цифры — «барабаны»: как только секция на экране, быстро прокручиваются
  const numbers = gsap.timeline({ paused: true });
  rows.forEach((row, i) => {
    const { col, steps } = buildRoller(row.querySelector('.stat__value'));
    numbers.fromTo(col, { yPercent: 0 }, {
      yPercent: (-100 * steps) / (steps + 1),
      duration: c.rollDuration,
      ease: 'power3.out',
    }, i * c.rollStagger);
  });
  gsap.fromTo(section.querySelectorAll('.stat__head, .stat__plus'),
    { y: 24, autoAlpha: 0 },
    {
      y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06,
      scrollTrigger: {
        trigger: section, start: 'top 60%',
        onEnter: () => numbers.restart(),
        onLeaveBack: () => numbers.pause(0),
        toggleActions: 'play none none reverse',
      },
    });

  // 2. Полосы при скролле: выезжают и проявляются из прозрачного,
  //    кружок едет вместе с ними к своему краю
  const travel = (slider) => slider.clientWidth - slider.querySelector('.slider__knob').offsetWidth - 12;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: c.pinLength,
      pin: true,
      scrub: c.scrub,
      invalidateOnRefresh: true,
      onLeave: () => rows.forEach((r) => r.querySelector('.slider').classList.add('is-shining')),
      onEnterBack: () => rows.forEach((r) => r.querySelector('.slider').classList.remove('is-shining')),
    },
  });

  rows.forEach((row, i) => {
    const slider = row.querySelector('.slider');
    const toLeft = slider.dataset.end !== 'right';
    const dir = toLeft ? 1 : -1;           // откуда выезжает: налево едет — значит стартует правее
    tl.fromTo(slider,
        { x: () => dir * slider.clientWidth * 0.35, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, i * 0.1)
      .fromTo(slider.querySelector('.slider__knob'),
        { x: () => dir * travel(slider) },
        { x: 0, duration: 0.8, ease: 'power2.inOut' }, i * 0.1);
  });
}
