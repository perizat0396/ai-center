// Дневной / ночной режим: кнопка в шапке, выбор запоминается в браузере.
// Начальная тема ставится ещё в <head> (index.html), здесь — только переключение.
const root = document.documentElement;

function apply(theme, animate) {
  if (animate) {
    root.classList.add('theme-switching');           // плавная смена цветов
    clearTimeout(apply.t);
    apply.t = setTimeout(() => root.classList.remove('theme-switching'), 700);
  }
  root.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-toggle').forEach((b) => b.setAttribute('aria-pressed', String(theme === 'dark')));
}

export function initTheme() {
  apply(root.getAttribute('data-theme') || 'light', false);

  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next, true);
      try { localStorage.setItem('theme', next); } catch (e) { /* приватный режим — просто не запоминаем */ }
    });
  });

  // если пользователь сам не выбирал — следуем за темой системы
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) { /* нет доступа к хранилищу */ }
    if (!saved) apply(e.matches ? 'dark' : 'light', true);
  });
}
