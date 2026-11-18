/* Lo poco que añade el JS (sin él, todo se ve igual y los vídeos tienen sus mandos):
   - los vídeos se ponen solos, sin sonido, cuando se ven, y se paran cuando no;
   - en la tira de un proyecto, la rueda del ratón mueve de lado;
   - un vídeo de YouTube es su fotograma hasta que se le da: entonces se pone el reproductor
     (youtube-nocookie, de oriol-colomer). Con cmd/ctrl/shift el enlace abre aparte. */

const videos = document.querySelectorAll('video');
if (videos.length && 'IntersectionObserver' in window) {
  const ojo = new IntersectionObserver((entradas) => {
    for (const { target, intersectionRatio } of entradas) {
      if (intersectionRatio >= 0.5) target.play().catch(() => {});
      else target.pause();
    }
  }, { threshold: [0, 0.5] });
  videos.forEach((v) => ojo.observe(v));
}

const tira = document.querySelector('.tira');
if (tira) {
  tira.addEventListener('wheel', (e) => {
    // solo si la tira va de lado (en el móvil va hacia abajo) y el gesto es vertical
    if (tira.scrollWidth <= tira.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    tira.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });
}

for (const a of document.querySelectorAll('a.yt[data-yt]')) {
  a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    a.replaceWith(Object.assign(document.createElement('iframe'), {
      title: a.getAttribute('aria-label') || '', allowFullscreen: true, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
      src: `https://www.youtube-nocookie.com/embed/${a.dataset.yt}?autoplay=1&rel=0&playsinline=1${a.dataset.t ? `&start=${a.dataset.t}` : ''}`,
    }));
  });
}
