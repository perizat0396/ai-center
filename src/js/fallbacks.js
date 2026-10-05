// Заглушки для отсутствующих медиафайлов в /public

// Руки: если PNG не загрузился — подменяем на CSS-формы
export function initHandFallbacks() {
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    const swap = () => {
      const div = document.createElement('div');
      div.className = 'hand-fallback';
      img.replaceWith(div);
    };
    if (img.complete && img.naturalWidth === 0) swap();
    else img.addEventListener('error', swap, { once: true });
  });
}

// Видео туннеля: если файла нет — показываем canvas
export function initVideoFallback(onFallback) {
  const section = document.querySelector('.cinema');
  const video = section?.querySelector('.cinema__video');
  if (!video) return;

  const useCanvas = () => {
    if (section.classList.contains('no-video')) return;
    section.classList.add('no-video');
    onFallback?.(section.querySelector('.cinema__canvas'));
  };

  // error у <video src> срабатывает на самом элементе
  video.addEventListener('error', useCanvas, { once: true });
  if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) useCanvas();
}
