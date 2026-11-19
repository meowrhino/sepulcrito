/* A · censura: lo que añade a js/astro.js (la estrella).
   - .censurada: la foto, y encima una estrella con la misma foto en mosaico, al píxel (la
     censura de una web porno). Su sitio y su tamaño, --x --y --w en el CSS. Al pasar, el
     mosaico se deshace y queda la foto limpia.
   - Al pasar por una fila (dirección creativa, una parte de Tattoox), su estrella se despixela.
   - En el móvil (sin ratón), la estrella o la censura que pasa por el centro de la pantalla
     se despixela sola.
   Sin JS, las fotos se ven tal cual. */

const BLOQUES = 9;   // bloques a lo ancho de la estrella de la censura
const suave = (e) => (e < 0.5 ? 4 * e ** 3 : 1 - (-2 * e + 2) ** 3 / 2);

for (const fig of document.querySelectorAll('.censurada')) {
  const img = fig.querySelector('img');
  const capa = document.createElement('span');
  capa.className = 'censura';
  const lienzo = document.createElement('canvas');
  capa.append(lienzo);
  fig.append(capa);
  const ctx = lienzo.getContext('2d');
  const poco = document.createElement('canvas');
  const pctx = poco.getContext('2d');
  let n = BLOQUES;
  let anim = 0;

  // la foto como el <img> (object-fit: cover, centrada), en bloques del ancho de la estrella
  function pintar() {
    if (!img.naturalWidth) return;
    const W = fig.clientWidth, H = fig.clientHeight;   // a 1×: son bloques
    if (!W || !H) return;
    if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
    const k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * k, h = img.naturalHeight * k;
    const estrella = (parseFloat(getComputedStyle(fig).getPropertyValue('--w')) / 100 || 0.5) * W;
    const b = Math.max(1, estrella / n);   // el lado de un bloque, en px
    poco.width = Math.max(1, Math.round(w / b));
    poco.height = Math.max(1, Math.round(h / b));
    pctx.drawImage(img, 0, 0, poco.width, poco.height);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(poco, (W - w) / 2, (H - h) / 2, w, h);
  }

  // de n bloques a `hasta` (a ritmo de zoom); muchos = sin censura (se ve la foto de debajo)
  function ir(hasta, ms) {
    cancelAnimationFrame(anim);
    const desde = n, t0 = performance.now();
    if (hasta === BLOQUES) fig.classList.remove('limpia');
    const paso = (t) => {
      const e = Math.min(1, (t - t0) / ms);
      n = desde * (hasta / desde) ** suave(e);
      pintar();
      if (e < 1) anim = requestAnimationFrame(paso);
      else if (hasta > BLOQUES) fig.classList.add('limpia');
    };
    anim = requestAnimationFrame(paso);
  }
  fig.limpiar = () => ir(160, 650);
  fig.censurar = () => ir(BLOQUES, 450);

  const a = fig.closest('a') || fig;
  a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') fig.limpiar(); });
  a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') fig.censurar(); });
  a.addEventListener('focus', () => fig.limpiar());
  a.addEventListener('blur', () => fig.censurar());
  new ResizeObserver(pintar).observe(fig);
  if (img.complete) pintar(); else img.addEventListener('load', pintar, { once: true });
}

/* una estrella de js/astro.js se despixela con pointerenter y vuelve con pointerleave */
const astro = (el, si) => el?.dispatchEvent(new PointerEvent(si ? 'pointerenter' : 'pointerleave'));
for (const fila of document.querySelectorAll('.a-proyecto, .a-parte')) {
  const el = fila.querySelector('.astro');
  fila.addEventListener('pointerenter', (e) => { if (e.target === fila) astro(el, true); });
  fila.addEventListener('pointerleave', (e) => { if (e.target === fila) astro(el, false); });
  fila.addEventListener('focus', () => astro(el, true));
  fila.addEventListener('blur', () => astro(el, false));
}

/* sin ratón: lo que pasa por la franja del medio de la pantalla, sin censura */
if (matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
  const ojo = new IntersectionObserver((entradas) => {
    for (const { target, isIntersecting } of entradas) {
      if (target.classList.contains('censurada')) (isIntersecting ? target.limpiar : target.censurar)?.();
      else astro(target, isIntersecting);
    }
  }, { rootMargin: '-38% 0px -38% 0px' });
  // al empezar a bajar: al llegar, lo de arriba se ve censurado
  addEventListener('scroll', () => document.querySelectorAll('.censurada, .astro').forEach((el) => ojo.observe(el)), { once: true, passive: true });
}
