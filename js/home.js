/* La intro de la home (build/home.mjs, css/home.css):
   1. blanco hasta que la foto ha cargado;
   2. «Sepulcrito», la estrella con la foto pixelada dentro y «Content Destroyer.»;
   3. a los 2,6 s, o con un clic o una tecla, la estrella crece hasta llenar la
      pantalla y la foto se despixela;
   4. la intro se funde y queda la landing.
   La foto se pinta en un <canvas> encajado como la de la landing (object-fit: cover
   y su object-position), y la estrella es la máscara del lienzo. */

const html = document.documentElement;
const intro = document.getElementById('intro');

if (html.classList.contains('intro')) {
  // si este script llega tarde, el respaldo del CSS ya ha quitado la intro
  if (performance.now() > 3800) html.classList.remove('intro');
  else {
    html.classList.add('intro-js');
    empezar();
  }
}

async function empezar() {
  const foto = document.querySelector('.landing .foto');
  const lienzo = intro.querySelector('canvas');
  const ctx = lienzo.getContext('2d');
  const poco = document.createElement('canvas');
  const pctx = poco.getContext('2d');

  const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
  let ya;
  const prisa = new Promise((ok) => { ya = ok; });
  addEventListener('click', () => ya(), { once: true });
  addEventListener('keydown', () => ya(), { once: true });

  try { await foto.decode(); } catch { return fuera(); }

  // bloque: tamaño del píxel, en px de la foto; empieza en 40 de ancho
  let bloque = foto.naturalWidth / 40;
  // ancho: el de la estrella, en px de pantalla; a0, el de la bienvenida
  const base = () => (innerWidth <= 700 ? innerWidth * 0.62 : Math.min(innerWidth * 0.28, innerHeight * 0.46));
  let ancho = base();
  let a0 = ancho;
  const mezcla = (p, q, t) => p + (q - p) * t;

  function pintar() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(innerWidth * dpr);
    const H = Math.round(innerHeight * dpr);
    if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
    const iw = foto.naturalWidth;
    const ih = foto.naturalHeight;
    // la foto empieza entera dentro de la estrella (cubre su caja, con margen) y crece
    // con ella hasta quedar como la de la landing: cover, con su object-position
    const enEstrella = (a) => 1.15 * Math.max(a / iw, (0.951 * a) / ih);
    const k1 = Math.max(W / iw, H / ih);
    const k0 = enEstrella(a0 * dpr);
    const k = Math.min(enEstrella(ancho * dpr), k1);
    const t = k1 > k0 ? Math.min(1, Math.log(k / k0) / Math.log(k1 / k0)) : 1;
    const [px, py] = getComputedStyle(foto).objectPosition.split(' ').map(parseFloat);
    const cx = mezcla(W / 2, ((W - iw * k1) * px) / 100 + (iw * k1) / 2, t);
    const cy = mezcla(H / 2 - 0.0502 * ancho * dpr, ((H - ih * k1) * py) / 100 + (ih * k1) / 2, t);
    const x = cx - (iw * k) / 2;
    const y = cy - (ih * k) / 2;
    if (bloque * k <= 1) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(foto, x, y, iw * k, ih * k);
    } else {
      poco.width = Math.ceil(iw / bloque);
      poco.height = Math.ceil(ih / bloque);
      pctx.drawImage(foto, 0, 0, poco.width, poco.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(poco, x, y, iw * k, ih * k);
    }
    // el centro de la estrella (el del círculo de sus puntas, a 274.5 de 522.13) en el centro de la pantalla
    lienzo.style.maskSize = `${ancho}px auto`;
    lienzo.style.maskPosition = `${(innerWidth - ancho) / 2}px ${innerHeight / 2 - ancho * 0.5257}px`;
  }

  let quieta = true;
  addEventListener('resize', () => { if (quieta) { ancho = a0 = base(); pintar(); } });

  // 1 → 2: del blanco a la bienvenida
  pintar();
  html.classList.add('bienvenida');
  await Promise.race([espera(800 + 2600), prisa]);

  // 3: entrar en la estrella: crece a ritmo de zoom (exponencial) y el bloque baja hasta 1 px
  quieta = false;
  html.classList.add('entrando');
  const b0 = bloque;
  await anima(1600, (e) => {
    const s = e < 0.5 ? 4 * e ** 3 : 1 - (-2 * e + 2) ** 3 / 2;
    // al final, 3,3 veces la diagonal: el pentágono de dentro tapa toda la pantalla
    ancho = a0 * ((3.3 * Math.hypot(innerWidth, innerHeight)) / a0) ** s;
    bloque = e < 1 ? b0 ** (1 - e) : 0;
    pintar();
  });

  // 4: fuera
  html.classList.add('saliendo');
  await espera(900);
  fuera();
}

function fuera() {
  html.classList.remove('intro', 'intro-js', 'bienvenida', 'entrando', 'saliendo');
}

function anima(ms, paso) {
  return new Promise((ok) => {
    const t0 = performance.now();
    const f = (t) => {
      const e = Math.min(1, Math.max(0, t - t0) / ms);
      paso(e);
      if (e < 1) requestAnimationFrame(f); else ok();
    };
    requestAnimationFrame(f);
  });
}
