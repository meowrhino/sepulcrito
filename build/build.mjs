/* data/ + assets/ + tattoo/ → dist/

     dist/index.html                           la home: intro (blanco → estrella → foto → zoom) y landing
     dist/obra/                                las obras en collage; dist/obra/<slug>/, cada una
     dist/direccion-creativa/                  los proyectos en lista; dist/direccion-creativa/<slug>/,
                                               cada uno en una tira horizontal (con sus grupos, si los tiene)
     dist/tattoo/                              las fotos de tattoo/, por orden de nombre (1.webp, 2.webp…)
     dist/about/                               la foto y el texto de data/about.json
     dist/404.html, sitemap.xml, robots.txt, .nojekyll

   Cada sección tiene su aspecto (css/style.css): la home rosa con la foto,
   obra rosa con letra de mano, dirección creativa blanca con serif, tattoo
   roja, about negra.

   Lo que se edita (la guía, en GUIA.md):

     data/site.json                 título, descripción, dominio, lema, instagram, email y menú
     data/obra.json                 las obras, una por bloque
     data/direccion-creativa.json   los proyectos, uno por bloque
     data/about.json                la foto y el texto del about
     assets/img/<sección>/<slug>-1.webp …   las fotos de cada bloque (imgToWeb); un vídeo,
                                    <slug>-N.webm + <slug>-N.poster.webp (videoToWeb)
     assets/img/about/1.webp        la foto del about
     tattoo/1.webp, 2.webp …        las fotos de tattoo, sin JSON

   Antes de escribir nada, valida: un JSON roto, un slug repetido o una foto
   que no está paran el build con un mensaje, y dist/ se queda como estaba.
   Las miniaturas y las imágenes para compartir las hace sharp en .cache/.

     node build/build.mjs      (npm run build; npm run dev la sirve en localhost:8765) */

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = join(ROOT, 'dist');
const CACHE = join(ROOT, '.cache');
const has = (src) => existsSync(join(ROOT, src));

const fail = (lines) => {
  console.error(`\n${[].concat(lines).map((l) => `✗ ${l}`).join('\n')}\n\nNo se publica nada hasta que se arregle: la web se queda como estaba.\n`);
  process.exit(1);
};

/** Lee un JSON; si está roto, dice en qué línea (casi siempre una coma). */
function leer(file) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  try { return JSON.parse(text); } catch (e) {
    const pos = Number(/position (\d+)/.exec(e.message)?.[1]);
    const line = Number.isFinite(pos) ? text.slice(0, pos).split('\n').length : null;
    return fail(`${file}${line ? `, hacia la línea ${line}` : ''}: el JSON está roto. Casi siempre es una coma que sobra o que falta, o unas comillas sin cerrar.`);
  }
}

const site = leer('data/site.json');
const obra = leer('data/obra.json');
const dc = leer('data/direccion-creativa.json');
const about = leer('data/about.json');

/* ── fotos y vídeos ──
   Una foto es <base>.webp; un vídeo, <base>.webm con su póster <base>.poster.webp. */
const media = (base) => {
  if (has(`${base}.webp`)) return { type: 'img', src: `${base}.webp` };
  if (has(`${base}.webm`)) return { type: 'video', src: `${base}.webm`, poster: has(`${base}.poster.webp`) ? `${base}.poster.webp` : null };
  return null;
};
const OBRA = 'assets/img/obra';
const DC = 'assets/img/direccion-creativa';

/* ── validar ── */

const errors = [];
const warnings = [];
const esLista = (x) => Array.isArray(x) && x.every((p) => typeof p === 'string');
const numero = /^[1-9][0-9]*$/;

/** Comprueba una sección de bloques (obra, dirección creativa): slugs, títulos, fotos. */
function validar(file, bloques, dir) {
  if (!Array.isArray(bloques)) return errors.push(`${file}: tiene que ser una lista [ … ] de bloques`);
  const vistos = new Set();
  bloques.forEach((b, i) => {
    const at = `${file}, bloque ${i + 1}${typeof b?.title === 'string' ? ` («${b.title}»)` : ''}`;
    if (typeof b?.slug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.slug)) return errors.push(`${at}: «slug» va en minúsculas, sin acentos ni espacios, con guiones (sweet-wrecker)`);
    if (vistos.has(b.slug)) errors.push(`${at}: el slug «${b.slug}» ya lo tiene otro bloque`);
    vistos.add(b.slug);
    if (typeof b.title !== 'string' || !b.title.trim()) errors.push(`${at}: falta «title»`);
    if (b.year !== undefined && !Number.isInteger(b.year)) errors.push(`${at}: «year» es un número sin comillas (2025)`);
    if (b.links !== undefined && !esLista(b.links)) errors.push(`${at}: «links» es una lista de direcciones: ["https://…"]`);
    const fotos = (lista, donde) => {
      if (!Array.isArray(lista)) return errors.push(`${donde}: «photos» es la lista de fotos por número: ["1", "2", "3"]`);
      for (const n of lista) {
        if (typeof n !== 'string' || !numero.test(n)) { errors.push(`${donde}: en «photos», ${JSON.stringify(n)} no es un número entre comillas ("3")`); continue; }
        const m = media(`${dir}/${b.slug}-${n}`);
        if (!m) errors.push(`${donde}: no encuentro ${dir}/${b.slug}-${n}.webp (ni un vídeo .webm con ese número)`);
        else if (m.type === 'video' && !m.poster) warnings.push(`${dir}/${b.slug}-${n}.webm no tiene póster (${b.slug}-${n}.poster.webp): sale en negro hasta que se mueve`);
      }
    };
    if (b.text !== undefined && !esLista(b.text)) errors.push(`${at}: «text» es una lista de párrafos: ["uno", "otro"]`);
    fotos(b.photos, at);
    for (const [j, g] of (b.groups || []).entries()) {
      const gat = `${at}, grupo ${j + 1}${g?.title ? ` («${g.title}»)` : ''}`;
      if (typeof g?.title !== 'string') errors.push(`${gat}: falta «title»`);
      if (g?.text !== undefined && !esLista(g.text)) errors.push(`${gat}: «text» es una lista de párrafos`);
      if (g?.links !== undefined && !esLista(g.links)) errors.push(`${gat}: «links» es una lista de direcciones`);
      fotos(g?.photos, gat);
    }
    const todas = [...(b.photos || []), ...(b.groups || []).flatMap((g) => g?.photos || [])];
    if (!todas.length) errors.push(`${at}: no tiene ninguna foto`);
    if (b.cover !== undefined && !has(`${dir}/${b.slug}-${b.cover}.webp`)) errors.push(`${at}: «cover» («${b.cover}») tiene que ser una foto (no un vídeo) que esté: ${dir}/${b.slug}-${b.cover}.webp`);
    if (b.logo !== undefined && !has(`${dir}/${b.slug}-${b.logo}.webp`)) errors.push(`${at}: «logo» («${b.logo}»): no encuentro ${dir}/${b.slug}-${b.logo}.webp`);
    if (b.cover === undefined && !todas.some((n) => has(`${dir}/${b.slug}-${n}.webp`))) errors.push(`${at}: necesita al menos una foto (no vídeo) para la portada, o «cover»`);
  });
  // lo que hay en la carpeta y no sale en ningún bloque
  for (const f of readdirSync(join(ROOT, dir)).filter((f) => /\.(webp|webm)$/.test(f) && !f.endsWith('.poster.webp'))) {
    const [, slug, n] = /^(.+)-([0-9]+)\.(webp|webm)$/.exec(f) || [];
    const b = bloques.find?.((x) => x?.slug === slug);
    const usada = b && [b.logo, b.cover, ...(b.photos || []), ...(b.groups || []).flatMap((g) => g?.photos || [])].includes(n);
    if (!usada) warnings.push(`${dir}/${f} no sale en ningún bloque de ${file}`);
  }
}
validar('data/obra.json', obra, OBRA);
validar('data/direccion-creativa.json', dc, DC);

if (typeof about?.photo !== 'string' || !has(`assets/img/about/${about.photo}.webp`)) errors.push(`data/about.json: «photo» es el número de la foto de assets/img/about/ ("1"), y tiene que estar`);
if (about?.text !== undefined && !esLista(about.text)) errors.push('data/about.json: «text» es una lista de párrafos: ["uno", "otro"]');
if (!Array.isArray(site?.menu) || site.menu.some((m) => typeof m?.text !== 'string' || typeof m?.href !== 'string')) errors.push('data/site.json: «menu» es una lista de { "text": "obra", "href": "obra/" }');
for (const k of ['title', 'description', 'lema']) if (typeof site?.[k] !== 'string') errors.push(`data/site.json: falta «${k}»`);

/* tattoo/: las que se llaman 1.webp, 2.webp…, por orden de número; lo demás no sale */
const tattooFiles = readdirSync(join(ROOT, 'tattoo')).filter((f) => !f.startsWith('.'));
for (const f of tattooFiles) if (!/^[1-9][0-9]*\.webp$/.test(f)) warnings.push(`tattoo/${f} no sale: las fotos de tattoo se llaman 1.webp, 2.webp… (como las saca imgToWeb)`);
const tatuajes = tattooFiles.filter((f) => /^[1-9][0-9]*\.webp$/.test(f)).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).map((f) => `tattoo/${f}`);
if (!tatuajes.length) errors.push('tattoo/: no hay ninguna foto (1.webp, 2.webp…)');

/* Cloudflare (la copia de la clienta) no publica archivos de más de 25 MB */
const pesados = (dir) => readdirSync(join(ROOT, dir), { recursive: true }).map((f) => join(dir, String(f))).filter((f) => statSync(join(ROOT, f)).isFile() && statSync(join(ROOT, f)).size > 25 * 1024 * 1024);
for (const f of ['assets', 'tattoo'].flatMap(pesados)) errors.push(`${f} pesa más de 25 MB: pásalo otra vez por imgToWeb o videoToWeb (un vídeo, más corto)`);

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) fail(errors);

/* Dónde se publica: en la Action, meowrhino.github.io/sepulcrito/ y sin
   indexar; fuera, el dominio de site.json → url, y se indexa si lo hay. */
const github = process.env.GITHUB_ACTIONS === 'true';
const [owner, repo] = (process.env.GITHUB_REPOSITORY || 'meowrhino/sepulcrito').split('/');
const url = github ? `https://${owner}.github.io/${repo}/` : (site.url || '').replace(/\/?$/, '/').replace(/^\/$/, '');
const noindex = github || !url;
const abs = (path) => (url ? url + path : null);

/* ── medidas, miniaturas y og (sharp, en .cache/) ── */

const fresh = (out, src) => existsSync(out) && statSync(out).mtimeMs >= statSync(join(ROOT, src)).mtimeMs;
const medidas = new Map();
async function medir(src) {
  if (!src) return null;
  if (!medidas.has(src)) {
    const { width, height } = await sharp(join(ROOT, src)).metadata();
    medidas.set(src, { w: width, h: height });
  }
  return medidas.get(src);
}
/** La foto a 900 px de ancho, para los índices: dist/mini/<src>. */
const minis = new Set();
async function mini(src) {
  const out = join(CACHE, 'mini', src);
  if (!fresh(out, src)) {
    mkdirSync(dirname(out), { recursive: true });
    await sharp(join(ROOT, src)).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  }
  minis.add(src);
  return `mini/${src}`;
}
/** La imagen para compartir, 1200×630: dist/og/<src>.jpg. */
const ogs = new Set();
const ogPath = (src) => `og/${src.replace(/\.webp$/, '.jpg')}`;
async function og(src) {
  const out = join(CACHE, ogPath(src));
  if (!fresh(out, src)) {
    mkdirSync(dirname(out), { recursive: true });
    await sharp(join(ROOT, src)).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 85, mozjpeg: true }).toFile(out);
  }
  ogs.add(src);
  return src;
}

/* ?v=<hash>: que un deploy no deje a nadie con el CSS o el JS viejos en caché */
const v = (file) => `${file}?v=${createHash('sha1').update(readFileSync(join(ROOT, file))).digest('hex').slice(0, 8)}`;
const CSS = v('css/style.css');
const JS = v('js/site.js');

/* ── plantillas ── */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const parrafos = (text, cls) => (text || []).map((p) => `<p class="${cls}">${esc(p)}</p>`).join('\n');
const sitio = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').replace(/\.com$/, ''); } catch { return 'enlace'; } };
/** Los enlaces: «ver en youtube ↗»; si hay varios del mismo sitio, numerados. */
function enlaces(links) {
  if (!links?.length) return '';
  const total = {}; const visto = {};
  for (const l of links) total[sitio(l)] = (total[sitio(l)] || 0) + 1;
  return `<ul class="enlaces">\n${links.map((l) => {
    const s = sitio(l); visto[s] = (visto[s] || 0) + 1;
    return `  <li><a href="${esc(l)}" target="_blank" rel="noopener">ver en ${esc(s)}${total[s] > 1 ? ` ${visto[s]}` : ''} ↗</a></li>`;
  }).join('\n')}\n</ul>`;
}
const instagram = site.instagram ? `https://www.instagram.com/${site.instagram}/` : null;

/* la estrella del Figma, en línea para pintarla del color de cada sección */
const estrella = (cls) => `<svg class="${cls}" viewBox="0 0 522.13 496.575" aria-hidden="true"><path d="M261.065 0L322.694 189.675H522.13L360.783 306.9L422.412 496.575L261.065 379.35L99.718 496.575L161.347 306.9L0 189.675H199.436L261.065 0Z"/></svg>`;

function pagina({ path, title, description = site.description, image, seccion, body, base, js = true }) {
  const r = base ?? '../'.repeat(path.split('/').filter(Boolean).length);
  const full = title ? `${title} · ${site.title}` : site.title;
  const actual = path.split('/')[0];
  const canonical = abs(path);
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}${canonical ? `<link rel="canonical" href="${esc(canonical)}">\n<meta property="og:url" content="${esc(canonical)}">\n` : ''}<meta property="og:site_name" content="${esc(site.title)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
${image ? `<meta property="og:image" content="${esc(abs(ogPath(image)) ?? r + ogPath(image))}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n` : ''}<link rel="icon" href="${r}assets/img/star.webp">
<link rel="stylesheet" href="${r}${CSS}">
${js ? `<script src="${r}${JS}" defer></script>\n` : ''}</head>
<body class="${seccion}">
<nav class="menu">
${site.menu.map((m) => `  <a href="${r}${m.href}"${m.href.split('/')[0] === actual ? ' aria-current="page"' : ''}>${esc(m.text)}</a>`).join('\n')}
</nav>
${body(r)}
</body>
</html>
`;
}

/** Una foto o un vídeo, con su ancho y alto para que la página no salte al cargar. */
function pieza(r, m, alt, lazy) {
  if (m.type === 'video') {
    return `<video src="${r}${m.src}"${m.poster ? ` poster="${r}${m.poster}"` : ''}${m.size ? ` width="${m.size.w}" height="${m.size.h}"` : ''} controls muted loop playsinline preload="none" aria-label="${esc(alt)}"></video>`;
  }
  return `<img src="${r}${m.src}" width="${m.size.w}" height="${m.size.h}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''}>`;
}
async function cargar(base) {
  const m = media(base);
  return { ...m, size: await medir(m.type === 'img' ? m.src : m.poster) };
}

/* home */

const lema = `${esc(site.lema)} `.repeat(4);
const home = () => pagina({
  path: '', seccion: 'home', image: 'assets/img/home.webp', js: false,
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

/* obra */

const portada = (dir, b) => `${dir}/${b.slug}-${b.cover ?? [...(b.photos || []), ...(b.groups || []).flatMap((g) => g.photos)].find((n) => has(`${dir}/${b.slug}-${n}.webp`))}.webp`;

const obraIndex = (fichas) => pagina({
  path: 'obra/', title: 'obra', seccion: 'obra', image: portada(OBRA, obra[0]),
  description: `Obra de ${site.title}: ${obra.map((w) => w.title).join(', ')}.`,
  body: (r) => `<header class="cabecera">
  ${estrella('obra-estrella')}
  <h1>obra</h1>
</header>
<main class="obras">
${fichas.map(({ b, m }) => `  <a class="ficha" href="${r}obra/${b.slug}/">
    <img src="${r}${m.src}" width="${m.size.w}" height="${m.size.h}" alt="" loading="lazy">
    <span class="ficha-titulo">${esc(b.title)}</span>${b.year ? ` <span class="ficha-año">${b.year}</span>` : ''}
  </a>`).join('\n')}
</main>`,
});

const obraPagina = (b, fotos, siguiente) => pagina({
  path: `obra/${b.slug}/`, title: b.title, seccion: 'obra pieza', image: portada(OBRA, b),
  description: b.text?.[0]?.slice(0, 160) || `${b.title}${b.year ? `, ${b.year}` : ''}. Obra de ${site.title}.`,
  body: (r) => `<header class="pieza-cabecera">
  <a class="volver" href="${r}obra/">← obra</a>
  <h1>${esc(b.title)}</h1>${b.year ? `\n  <p class="pieza-año">${b.year}</p>` : ''}
${parrafos(b.text, 'pieza-texto')}
${enlaces(b.links)}
</header>
<main class="fotos">
${fotos.map((m, i) => `  ${pieza(r, m, `${b.title}, ${i + 1}`, i > 0)}`).join('\n')}
</main>
<footer class="pieza-pie"><a href="${r}obra/${siguiente.slug}/">siguiente: ${esc(siguiente.title)} →</a></footer>`,
});

/* dirección creativa */

const dcIndex = (fichas) => pagina({
  path: 'direccion-creativa/', title: 'dirección creativa', seccion: 'dc', image: portada(DC, dc[0]),
  description: `Dirección creativa de ${site.title}: ${dc.map((p) => p.title).join(', ')}.`,
  body: (r) => `<header class="cabecera">
  ${estrella('dc-estrella')}
  <h1>dirección<br>creativa</h1>
</header>
<main class="proyectos">
${fichas.map(({ b, m }) => `  <a class="proyecto" href="${r}direccion-creativa/${b.slug}/">
    <span class="proyecto-titulo">${esc(b.title)}</span>
    <img src="${r}${m.src}" width="${m.size.w}" height="${m.size.h}" alt="" loading="lazy">
  </a>`).join('\n')}
</main>`,
});

const dcPagina = (b, logo, fotos, grupos, siguiente) => pagina({
  path: `direccion-creativa/${b.slug}/`, title: b.title, seccion: 'dc pieza', image: portada(DC, b),
  description: b.text?.[0]?.slice(0, 160) || `${b.title}: dirección creativa de ${site.title}.`,
  body: (r) => `<main class="tira">
<section class="panel panel-inicio">
  <a class="volver" href="${r}direccion-creativa/">← dirección creativa</a>
  ${logo ? `<img class="logo" src="${r}${logo.src}" width="${logo.size.w}" height="${logo.size.h}" alt="${esc(b.title)}">\n  <h1 class="h1-con-logo">${esc(b.title)}</h1>` : `<h1>${esc(b.title)}</h1>`}
  ${parrafos(b.text, 'pieza-texto')}
  ${enlaces(b.links)}
</section>
${fotos.map((m, i) => pieza(r, m, `${b.title}, ${i + 1}`, i > 1)).join('\n')}
${grupos.map(({ g, fotos: gf }) => `<section class="panel grupo">
  <h2>${esc(g.title)}</h2>
  ${parrafos(g.text, 'pieza-texto')}
  ${enlaces(g.links)}
</section>
${gf.map((m, i) => pieza(r, m, `${b.title}, ${g.title}, ${i + 1}`, true)).join('\n')}`).join('\n')}
<section class="panel panel-fin">
  <a href="${r}direccion-creativa/${siguiente.slug}/">siguiente:<br><span class="siguiente">${esc(siguiente.title)}</span> →</a>
</section>
</main>`,
});

/* tattoo */

const tattooPagina = (fotos) => pagina({
  path: 'tattoo/', title: 'tattoo', seccion: 'tattoo', image: tatuajes[0],
  description: `Tattoo de ${site.title}.`,
  body: (r) => `<header class="cabecera">
  ${estrella('tattoo-estrella')}
  <h1>tattoo</h1>
</header>
${instagram ? `<p class="tattoo-citas">citas por instagram: <a href="${esc(instagram)}" target="_blank" rel="noopener">@${esc(site.instagram)}</a></p>\n` : ''}<main class="tatuajes">
${fotos.map(({ src, m }, i) => `  <a href="${r}${src}"><img src="${r}${m.src}" width="${m.size.w}" height="${m.size.h}" alt="tattoo ${i + 1}" loading="lazy"></a>`).join('\n')}
</main>`,
});

/* about */

const aboutPagina = (foto) => pagina({
  path: 'about/', title: 'about', seccion: 'about', image: `assets/img/about/${about.photo}.webp`,
  description: about.text?.[0]?.slice(0, 160) || site.description,
  body: (r) => `<main class="sobre">
  <img class="sobre-foto" src="${r}assets/img/about/${about.photo}.webp" width="${foto.w}" height="${foto.h}" alt="${esc(site.title)}">
  <div class="sobre-texto">
    <h1>${esc(site.title)}</h1>
    <p class="sobre-lema">${esc(site.lema)}</p>
    ${parrafos(about.text, 'pieza-texto')}
    <p class="sobre-contacto">${[
      instagram && `<a href="${esc(instagram)}" target="_blank" rel="noopener">instagram @${esc(site.instagram)}</a>`,
      site.email && `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>`,
    ].filter(Boolean).join('<br>')}</p>
  </div>
</main>`,
});

const noEncontrada = () => pagina({
  path: '404', title: 'no está', seccion: 'about', base: url || '/', js: false,
  body: (r) => `<main class="sobre sobre-404"><div class="sobre-texto"><h1>esta página no está</h1><p class="sobre-contacto"><a href="${r}">volver a la home</a></p></div></main>`,
});

/* ── escribir ── */

const paginas = { '': home() };

await og('assets/img/home.webp');
const fichasObra = await Promise.all(obra.map(async (b) => {
  const src = await og(portada(OBRA, b));
  return { b, m: { src: await mini(src), size: await medir(src) } };
}));
paginas['obra/'] = obraIndex(fichasObra);
for (const [i, b] of obra.entries()) {
  const fotos = await Promise.all(b.photos.map((n) => cargar(`${OBRA}/${b.slug}-${n}`)));
  paginas[`obra/${b.slug}/`] = obraPagina(b, fotos, obra[(i + 1) % obra.length]);
}

const fichasDc = await Promise.all(dc.map(async (b) => {
  const src = await og(portada(DC, b));
  return { b, m: { src: await mini(src), size: await medir(src) } };
}));
paginas['direccion-creativa/'] = dcIndex(fichasDc);
for (const [i, b] of dc.entries()) {
  const logo = b.logo ? { src: `${DC}/${b.slug}-${b.logo}.webp`, size: await medir(`${DC}/${b.slug}-${b.logo}.webp`) } : null;
  const fotos = await Promise.all((b.photos || []).map((n) => cargar(`${DC}/${b.slug}-${n}`)));
  const grupos = await Promise.all((b.groups || []).map(async (g) => ({ g, fotos: await Promise.all(g.photos.map((n) => cargar(`${DC}/${b.slug}-${n}`))) })));
  paginas[`direccion-creativa/${b.slug}/`] = dcPagina(b, logo, fotos, grupos, dc[(i + 1) % dc.length]);
}

await og(tatuajes[0]);
const fotosTattoo = await Promise.all(tatuajes.map(async (src) => ({ src, m: { src: await mini(src), size: await medir(src) } })));
paginas['tattoo/'] = tattooPagina(fotosTattoo);

await og(`assets/img/about/${about.photo}.webp`);
paginas['about/'] = aboutPagina(await medir(`assets/img/about/${about.photo}.webp`));

rmSync(OUT, { recursive: true, force: true, maxRetries: 5 });
mkdirSync(OUT, { recursive: true });
for (const d of ['css', 'js', 'fonts', 'assets', 'tattoo']) cpSync(join(ROOT, d), join(OUT, d), { recursive: true, filter: (f) => !f.endsWith('.DS_Store') });
for (const src of minis) { mkdirSync(dirname(join(OUT, 'mini', src)), { recursive: true }); cpSync(join(CACHE, 'mini', src), join(OUT, 'mini', src)); }
for (const src of ogs) { mkdirSync(dirname(join(OUT, ogPath(src))), { recursive: true }); cpSync(join(CACHE, ogPath(src)), join(OUT, ogPath(src))); }

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

console.log(`✓ dist/: ${Object.keys(paginas).length} páginas (home, ${obra.length} obras, ${dc.length} proyectos, tattoo con ${tatuajes.length} fotos y about), 404, sitemap y robots${noindex ? ', sin indexar' : ''}.`);
