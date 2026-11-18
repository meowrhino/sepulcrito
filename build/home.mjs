/* La home: intro (blanco → estrella → foto → zoom) y landing. Su CSS, css/home.css.
   Va aparte del resto de plantillas (build/build.mjs) para poder rehacerla sin tocarlas:
   el build la llama con lo que necesita y pone el <head>, el menú y el CSS. */

/** El cuerpo de la home. `r` es la ruta a la raíz ("" en la home). */
export function home({ site, esc, r }) {
  const lema = `${esc(site.lema)} `.repeat(4);
  return `<script>
  // sin intro si vienes de otra página de la web
  if (document.referrer.startsWith(location.origin)) document.documentElement.classList.add('sin-intro');
</script>
<div id="intro" aria-hidden="true">
  <img class="intro-foto" src="${r}assets/img/home.webp" alt="">
  <p class="intro-nombre">${esc(site.title)}</p>
  <img class="intro-estrella" src="${r}assets/img/star.webp" alt="">
  <p class="intro-lema">${esc(site.lema)}</p>
</div>
<main class="landing">
  <img class="foto" src="${r}assets/img/home.webp" alt="${esc(site.title)}">
  <img class="estrella e1" src="${r}assets/img/star.webp" alt="">
  <img class="estrella e2" src="${r}assets/img/star.webp" alt="">
  <img class="estrella e3" src="${r}assets/img/star.webp" alt="">
  <h1>${esc(site.title)}</h1>
  <p class="lema" aria-label="${esc(site.lema)}"><span aria-hidden="true">${lema}</span><span aria-hidden="true">${lema}</span></p>
</main>
<script>
  // un clic o una tecla se salta la intro
  const intro = document.getElementById('intro');
  const fuera = () => document.documentElement.classList.add('sin-intro');
  addEventListener('click', fuera, { once: true });
  addEventListener('keydown', fuera, { once: true });
  intro.addEventListener('animationend', (e) => { if (e.target === intro) fuera(); });
</script>`;
}
