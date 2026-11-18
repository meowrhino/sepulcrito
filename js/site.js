/* Lo poco que añade el JS (sin él, todo se ve igual y los vídeos tienen sus mandos):
   - los vídeos se ponen solos, sin sonido, cuando se ven, y se paran cuando no;
   - en la tira de dirección creativa, la rueda del ratón mueve de lado. */

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
