/* El estilo b · cam: lo poco que añade el JS (sin él, todo se lee y los vídeos tienen sus
   mandos):
   - el «rec» de los reproductores cuenta el tiempo que llevas mirando;
   - en el móvil (sin ratón), al bajar, la estrella o la cam que pasa por el medio de la
     pantalla se destapa sola;
   - en tattoo, una cam al azar, otras que se destapan solas un momento y la cam privada:
     la foto en grande al darle.
   Destapar es lo mismo que pasar el ratón: js/astro.js escucha pointerenter y pointerleave. */

const destapar = (astro, si) => astro?.dispatchEvent(new Event(si ? 'pointerenter' : 'pointerleave'));

/* el rec */
const recs = document.querySelectorAll('.rec time');
if (recs.length) {
  const t0 = Date.now();
  const dd = (n) => String(n).padStart(2, '0');
  setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    for (const t of recs) t.textContent = `${dd(Math.floor(s / 60))}:${dd(s % 60)}`;
  }, 1000);
}

/* en el móvil, lo que cruza la línea del medio de la pantalla se destapa */
if (matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
  const ojo = new IntersectionObserver((entradas) => {
    for (const { target, isIntersecting } of entradas) destapar(target, isIntersecting);
  }, { rootMargin: '-45% 0px -45% 0px' });
  // al bajar, no al llegar: la primera pantalla se ve censurada
  addEventListener('scroll', () => document.querySelectorAll('.astro').forEach((a) => ojo.observe(a)), { once: true, passive: true });
}

/* tattoo */
const muro = document.querySelector('.muro');
if (muro) {
  const cams = [...muro.querySelectorAll('.cam')];
  const visibles = () => cams.filter((c) => { const r = c.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
  const flash = (c, ms) => {
    c.classList.add('destapada'); destapar(c.querySelector('.astro'), true);
    setTimeout(() => { c.classList.remove('destapada'); destapar(c.querySelector('.astro'), false); }, ms);
  };

  const azar = document.querySelector('[data-azar]');
  if (azar) {
    azar.hidden = false;
    azar.addEventListener('click', () => {
      const c = cams[Math.floor(Math.random() * cams.length)];
      c.scrollIntoView({ block: 'center' });
      setTimeout(() => flash(c, 2600), 350);
    });
  }

  // con ratón, una cam se destapa sola de vez en cuando
  if (matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(() => {
      const v = visibles().filter((c) => !c.matches(':hover'));
      if (v.length) flash(v[Math.floor(Math.random() * v.length)], 1300);
    }, 2400);
  }

  // la cam privada
  muro.addEventListener('click', (e) => {
    const a = e.target.closest('[data-privada]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const capa = document.createElement('div');
    capa.className = 'privada';
    capa.innerHTML = `<figure><img src="${a.href}" alt="${a.querySelector('.oculto')?.textContent || ''}"><span class="vivo">privado</span><button class="boton" type="button">✕ salir</button></figure>`;
    const cerrar = () => { capa.remove(); removeEventListener('keydown', tecla); a.focus(); };
    const tecla = (ev) => { if (ev.key === 'Escape') cerrar(); };
    capa.addEventListener('click', cerrar);
    addEventListener('keydown', tecla);
    document.body.append(capa);
    capa.querySelector('button').focus();
  });
}
