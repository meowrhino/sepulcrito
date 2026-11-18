/* La home: la intro (blanco → la estrella → entras y se despixela) y la landing.
   Su CSS, css/home.css; la intro la mueve js/home.js (sin JS no hay intro).
   Va aparte del resto de plantillas (build/build.mjs) para poder rehacerla sin tocarlas:
   el build la llama con lo que necesita y pone el <head>, el menú y el CSS. */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const JS = 'js/home.js';
const hash = createHash('sha1').update(readFileSync(new URL(`../${JS}`, import.meta.url))).digest('hex').slice(0, 8);

/** El cuerpo de la home. `r` es la ruta a la raíz ("" en la home). */
export function home({ site, esc, r }) {
  const lema = `${esc(site.lema)} `.repeat(4);
  return `<script>
  // la intro, solo si no vienes de otra página de la web
  if (!document.referrer.startsWith(location.origin)) document.documentElement.classList.add('intro');
</script>
<div id="intro" aria-hidden="true">
  <div class="intro-hueco"><canvas></canvas></div>
  <p class="intro-nombre">${esc(site.title)}</p>
  <p class="intro-lema">${esc(site.lema)}</p>
</div>
<main class="landing">
  <img class="foto" src="${r}assets/img/home.webp" alt="${esc(site.title)}">
  <div class="huecos" aria-hidden="true"><img src="${r}pixel/assets/img/home.webp" alt=""></div>
  <h1><a href="${r}about/">${esc(site.title)}</a></h1>
  <p class="lema" aria-label="${esc(site.lema)}"><span aria-hidden="true">${lema}</span><span aria-hidden="true">${lema}</span></p>
</main>
<script src="${r}${JS}?v=${hash}" defer></script>`;
}
