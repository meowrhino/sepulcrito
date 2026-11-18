/* data/ + assets/ → dist/

     dist/index.html                 la home: intro (blanco → estrella → foto → zoom) y landing
     dist/obra/index.html            todas las obras, en collage
     dist/obra/<slug>/index.html     cada obra: título, año, texto y sus fotos
     dist/404.html, sitemap.xml, robots.txt, .nojekyll

   Lo que se edita:

     data/site.json     título, descripción, dominio (url), lema y menú
     data/obra.json     las obras, una por bloque: slug, title, year, cover, text, photos
     assets/img/obra/<slug>-1.webp, -2.webp…   sus fotos (imgToWeb)

   Antes de escribir nada, valida: un JSON roto, un slug repetido o una
   foto que no está paran el build con un mensaje, y dist/ se queda como
   estaba. Las miniaturas y las imágenes para compartir las hace sharp
   en .cache/ (fuera de git).

     node build/build.mjs      (npm run build; npm run dev la sirve en localhost:8765) */

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = join(ROOT, 'dist');
const CACHE = join(ROOT, '.cache');

const fail = (lines) => {
  console.error(`\n${[].concat(lines).map((l) => `✗ ${l}`).join('\n')}\n\nNo se publica nada hasta que se arregle.\n`);
  process.exit(1);
};

/** Lee un JSON; si está roto, dice en qué línea (casi siempre una coma). */
function leer(file) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  try { return JSON.parse(text); } catch (e) {
    const pos = Number(/position (\d+)/.exec(e.message)?.[1]);
    const line = Number.isFinite(pos) ? text.slice(0, pos).split('\n').length : null;
    fail(`${file}${line ? `, línea ${line}` : ''}: el JSON está roto (${e.message}). Casi siempre es una coma que sobra o que falta.`);
  }
}

const site = leer('data/site.json');
const obra = leer('data/obra.json');

/* ── validar ── */

const errors = [];
const warnings = [];
const foto = (slug, n) => `assets/img/obra/${slug}-${n}.webp`;
if (!Array.isArray(obra)) fail('data/obra.json: tiene que ser una lista [ … ] de obras');
const vistos = new Set();
obra.forEach((w, i) => {
  const at = `data/obra.json, obra ${i + 1}${w?.title ? ` («${w.title}»)` : ''}`;
  if (typeof w?.slug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(w.slug)) errors.push(`${at}: «slug» va en minúsculas, sin acentos ni espacios, con guiones (sweet-wrecker)`);
  else if (vistos.has(w.slug)) errors.push(`${at}: el slug «${w.slug}» ya lo tiene otra obra`);
  vistos.add(w.slug);
  if (typeof w?.title !== 'string' || !w.title.trim()) errors.push(`${at}: falta «title»`);
  if (w?.year !== undefined && !Number.isInteger(w.year)) errors.push(`${at}: «year» es un número sin comillas (2025)`);
  if (w?.text !== undefined && !(Array.isArray(w.text) && w.text.every((p) => typeof p === 'string'))) errors.push(`${at}: «text» es una lista de párrafos: ["uno", "otro"]`);
  if (!Array.isArray(w?.photos) || !w.photos.length) { errors.push(`${at}: «photos» es la lista de fotos por número: ["1", "2", "3"]`); return; }
  for (const n of w.photos) if (!existsSync(join(ROOT, foto(w.slug, n)))) errors.push(`${at}: no encuentro ${foto(w.slug, n)}`);
  if (w.cover !== undefined && !w.photos.includes(w.cover)) errors.push(`${at}: «cover» («${w.cover}») tiene que ser una de sus «photos»`);
});
for (const f of readdirSync(join(ROOT, 'assets/img/obra')).filter((f) => f.endsWith('.webp'))) {
  const [, slug, n] = /^(.+)-([0-9]+)\.webp$/.exec(f) || [];
  if (!obra.some((w) => w.slug === slug && w.photos?.includes(n))) warnings.push(`assets/img/obra/${f} no sale en ninguna obra`);
}
for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) fail(errors);

/* Dónde se publica: en la Action, meowrhino.github.io/sepulcrito/ y sin
   indexar; fuera, el dominio de site.json → url, y se indexa si lo hay. */
const github = process.env.GITHUB_ACTIONS === 'true';
const [owner, repo] = (process.env.GITHUB_REPOSITORY || 'meowrhino/sepulcrito').split('/');
const url = github ? `https://${owner}.github.io/${repo}/` : (site.url || '').replace(/\/?$/, '/').replace(/^\/$/, '');
const noindex = github || !url;
const abs = (path) => (url ? url + path : null);

/* ── imágenes: medidas, miniaturas y og (sharp, en .cache/) ── */

const fresh = (out, src) => existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;
const medidas = new Map();
async function medir(src) {
  if (!medidas.has(src)) {
    const { width, height } = await sharp(join(ROOT, src)).metadata();
    medidas.set(src, { w: width, h: height });
  }
  return medidas.get(src);
}
const MINI = 900;
async function mini(src) {
  const out = join(CACHE, 'mini', src);
  if (!fresh(out, join(ROOT, src))) {
    mkdirSync(dirname(out), { recursive: true });
    await sharp(join(ROOT, src)).resize({ width: MINI, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  }
  return out;
}
async function og(src) {
  const out = join(CACHE, 'og', src.replace(/\.webp$/, '.jpg'));
  if (!fresh(out, join(ROOT, src))) {
    mkdirSync(dirname(out), { recursive: true });
    await sharp(join(ROOT, src)).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 85, mozjpeg: true }).toFile(out);
  }
  return out;
}

/* ?v=<hash>: que un deploy no deje a nadie con el CSS viejo en caché */
const v = (file) => `?v=${createHash('sha1').update(readFileSync(join(ROOT, file))).digest('hex').slice(0, 8)}`;
const CSS = `css/style.css${v('css/style.css')}`;

/* ── plantillas ── */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ogPath = (src) => `og/${src.replace(/^assets\/img\//, '').replace(/\.webp$/, '.jpg')}`;

function pagina({ path, title, description = site.description, image, seccion, body, base }) {
  const r = base ?? '../'.repeat(path.split('/').filter(Boolean).length);
  const full = title ? `${title} · ${site.title}` : site.title;
  const actual = path.split('/')[0];
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}${abs(path) !== null ? `<link rel="canonical" href="${esc(abs(path))}">\n<meta property="og:url" content="${esc(abs(path))}">\n` : ''}<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${image ? `<meta property="og:image" content="${esc(abs(ogPath(image)) ?? r + ogPath(image))}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n` : ''}<link rel="icon" href="${r}assets/img/star.webp">
<link rel="stylesheet" href="${r}${CSS}">
</head>
<body class="${seccion}">
<nav class="menu">
${site.menu.map((m) => `  <a href="${r}${m.href}"${m.href.split('/')[0] === actual ? ' aria-current="page"' : ''}>${esc(m.text)}</a>`).join('\n')}
</nav>
${body(r)}
</body>
</html>
`;
}

const lema = `${esc(site.lema)} `.repeat(4);

const home = () => pagina({
  path: '', seccion: 'home', image: 'assets/img/home.webp',
  body: (r) => `<script>
  // sin intro con "reducir movimiento" o si vienes de otra página de la web
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.referrer.startsWith(location.origin)) document.documentElement.classList.add('sin-intro');
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
</script>`,
});

const img = (r, src, m, alt, attrs = '') => `<img src="${r}${src}" width="${m.w}" height="${m.h}" alt="${esc(alt)}"${attrs}>`;
const portada = (w) => foto(w.slug, w.cover ?? w.photos[0]);

const obraIndex = (fichas) => pagina({
  path: 'obra/', title: 'obra', seccion: 'obra', image: portada(obra[0]),
  body: (r) => `<header class="cabecera">
  <img class="obra-estrella" src="${r}assets/img/obra/estrella.svg" alt="">
  <h1>obra</h1>
</header>
<main class="obras">
${fichas.map(({ w, m }) => `  <a class="ficha" href="${r}obra/${w.slug}/">
    ${img(r, `assets/img/mini/obra/${portada(w).split('/').pop()}`, m, '', ' loading="lazy"')}
    <span class="ficha-titulo">${esc(w.title)}</span>${w.year ? ` <span class="ficha-año">${w.year}</span>` : ''}
  </a>`).join('\n')}
</main>`,
});

const obraPagina = (w, fotos, siguiente) => pagina({
  path: `obra/${w.slug}/`, title: w.title, seccion: 'obra pieza', image: portada(w),
  description: w.text?.[0]?.slice(0, 160) || `${w.title}${w.year ? `, ${w.year}` : ''}. Obra de ${site.title}.`,
  body: (r) => `<header class="pieza-cabecera">
  <a class="volver" href="${r}obra/">← obra</a>
  <h1>${esc(w.title)}</h1>${w.year ? `\n  <p class="pieza-año">${w.year}</p>` : ''}
${(w.text || []).map((p) => `  <p class="pieza-texto">${esc(p)}</p>`).join('\n')}
</header>
<main class="fotos">
${fotos.map(({ src, m }, i) => `  ${img(r, src, m, `${w.title}, ${i + 1}`, i ? ' loading="lazy"' : '')}`).join('\n')}
</main>
<footer class="pieza-pie"><a href="${r}obra/${siguiente.slug}/">siguiente: ${esc(siguiente.title)} →</a></footer>`,
});

const noEncontrada = () => pagina({
  path: '404', title: 'no está', seccion: 'obra pieza', base: url || '/',
  body: () => `<header class="pieza-cabecera"><h1>esta página no está</h1><p class="pieza-año"><a href="${url || '/'}">volver a la home</a></p></header>`,
});

/* ── escribir ── */

const fichas = await Promise.all(obra.map(async (w) => ({ w, m: await medir(portada(w)) })));
const minis = await Promise.all(obra.map((w) => mini(portada(w))));
const ogs = [...new Set(['assets/img/home.webp', ...obra.map(portada)])];
const ogHechas = await Promise.all(ogs.map(og));

rmSync(OUT, { recursive: true, force: true, maxRetries: 5 });
mkdirSync(OUT, { recursive: true });
for (const d of ['css', 'fonts', 'assets']) cpSync(join(ROOT, d), join(OUT, d), { recursive: true });
obra.forEach((w, i) => cpSync(minis[i], join(OUT, 'assets/img/mini/obra', portada(w).split('/').pop())));
ogs.forEach((src, i) => { mkdirSync(dirname(join(OUT, ogPath(src))), { recursive: true }); cpSync(ogHechas[i], join(OUT, ogPath(src))); });

const paginas = { '': home(), 'obra/': obraIndex(fichas) };
for (const [i, w] of obra.entries()) {
  const fotos = await Promise.all(w.photos.map(async (n) => ({ src: foto(w.slug, n), m: await medir(foto(w.slug, n)) })));
  paginas[`obra/${w.slug}/`] = obraPagina(w, fotos, obra[(i + 1) % obra.length]);
}
for (const [path, html] of Object.entries(paginas)) {
  mkdirSync(join(OUT, path), { recursive: true });
  writeFileSync(join(OUT, path, 'index.html'), html);
}
writeFileSync(join(OUT, '404.html'), noEncontrada());
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(paginas).map((p) => `  <url><loc>${esc(abs(p) ?? p)}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), noindex ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${abs('sitemap.xml')}\n`);
writeFileSync(join(OUT, '.nojekyll'), '');

console.log(`✓ dist/: home, obra y ${obra.length} obras, 404, sitemap y robots${noindex ? ' (sin indexar)' : ''}.`);
