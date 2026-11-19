/* La estrella: un hueco con la foto dentro, en color y censurada en mosaico (como en
   las referencias de la clienta). Al pasar, el mosaico se deshace hasta la foto.

   <div class="astro" data-src="foto.webp" data-n="22" data-fotos="a.webp b.webp">
   data-n: cuántos bloques caben a lo ancho de la estrella (por defecto 22).
   data-fotos: si hay varias, va cambiando de una a otra (la cabecera de una sección). */

const PATH = 'M261.065 0L322.694 189.675H522.13L360.783 306.9L422.412 496.575L261.065 379.35L99.718 496.575L161.347 306.9L0 189.675H199.436L261.065 0Z';
const MASK = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 522.13 496.575'><path d='${PATH}'/></svg>`)}")`;

const cargar = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

for (const el of document.querySelectorAll('.astro')) {
  const lienzo = document.createElement('canvas');
  lienzo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
    + (el.dataset.forma === 'rect' ? '' : `-webkit-mask:${MASK} center/contain no-repeat;mask:${MASK} center/contain no-repeat`);
  el.prepend(lienzo);
  const ctx = lienzo.getContext('2d');
  const poco = document.createElement('canvas');
  const pctx = poco.getContext('2d');
  const N = +el.dataset.n || 22;
  const fotos = (el.dataset.fotos || el.dataset.src).split(/\s+/);
  let foto = null;
  let n = N;   // bloques a lo ancho; Infinity = la foto tal cual

  function pintar() {
    if (!foto) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(el.clientWidth * dpr), H = Math.round(el.clientHeight * dpr);
    if (!W || !H) return;
    if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
    const k = Math.max(W / foto.naturalWidth, H / foto.naturalHeight);
    const w = foto.naturalWidth * k, h = foto.naturalHeight * k;
    const x = (W - w) / 2, y = (H - h) * (+el.dataset.y || 0.35);
    ctx.clearRect(0, 0, W, H);
    if (!isFinite(n) || W / n <= 1.2) { ctx.imageSmoothingEnabled = true; ctx.drawImage(foto, x, y, w, h); return; }
    // la foto, a n bloques del ancho de la estrella, y otra vez grande sin suavizar
    poco.width = Math.max(1, Math.round((w / W) * n));
    poco.height = Math.max(1, Math.round((h / W) * n));
    pctx.drawImage(foto, 0, 0, poco.width, poco.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(poco, x, y, w, h);
  }

  let anim = 0;
  function ir(destino, ms) {
    cancelAnimationFrame(anim);
    const desde = isFinite(n) ? n : 400, hasta = isFinite(destino) ? destino : 400, t0 = performance.now();
    const paso = (t) => {
      const e = Math.min(1, (t - t0) / ms);
      const s = e < 0.5 ? 4 * e ** 3 : 1 - (-2 * e + 2) ** 3 / 2;
      n = desde * (hasta / desde) ** s;   // a ritmo de zoom
      if (e === 1) n = destino;
      pintar();
      if (e < 1) anim = requestAnimationFrame(paso);
    };
    anim = requestAnimationFrame(paso);
  }

  el.addEventListener('pointerenter', () => ir(Infinity, 700));
  el.addEventListener('pointerleave', () => ir(N, 500));
  new ResizeObserver(pintar).observe(el);

  (async () => {
    const imgs = (await Promise.all(fotos.map(cargar))).filter(Boolean);
    let i = 0;
    foto = imgs[0]; pintar();
    if (imgs.length > 1) setInterval(() => { i = (i + 1) % imgs.length; foto = imgs[i]; pintar(); }, +el.dataset.cada || 1400);
  })();
}
