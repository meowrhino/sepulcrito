/* data/ + projects/ + tattoo/ + about/ → dist/

   Las páginas salen de build/paginas.mjs (las plantillas, las mismas que usa
   la vista previa, build/preview.mjs); aquí, lo que toca el disco: leer los
   JSON y las fotos, comprobarlos, hacer las fotos pequeñas y las imágenes
   para compartir, y escribirlo todo en dist/. Lo que sale, en paginas.mjs.

   Lo que se edita (la guía, en GUIA.md):

     data/site.json                 título, descripción, dominio, lema, instagram, email,
                                    las listas (qué proyectos salen en obra y en dirección
                                    creativa, y en qué orden) y el menú
     data/about.json                la foto y el texto del about
     data/config.json               los colores y las letras de cada sección
     projects/<slug>/project.json   cada obra o proyecto
     projects/<slug>/img/1.webp …   sus fotos (imgToWeb); un vídeo, N.webm + N.poster.webp (videoToWeb)
     tattoo/1.webp …                las fotos de tattoo, sin JSON
     about/1.webp                   la foto del about

   Antes de escribir nada, valida: un JSON roto, un campo que no dice schema/,
   una foto que no está o un archivo de más de 25 MB paran el build con un
   mensaje, y la web publicada se queda como estaba (en la Action, además, un
   issue: CLAUDE.md). Las fotos pequeñas y las og las hace sharp en .cache/;
   sin sharp se publica igual, con las grandes y sin og.

     node build/build.mjs      (npm run build; npm run dev la sirve en localhost:8765) */

import { createHash } from 'node:crypto';
import { closeSync, cpSync, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { OG_H, OG_W, esc, sitio, youtube } from './paginas.mjs';
import { leerJSON, loadProjects, loadTattoo, slugOf, validar, webpSize } from './proyectos.mjs';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = join(ROOT, 'dist');
const CACHE = join(ROOT, '.cache');

/** Para el build: cada línea con su ✗ (la Action las copia al issue). */
const fail = (lines) => {
  console.error(`\n${[].concat(lines).map((l) => `✗ ${l}`).join('\n')}\n\nNo se publica nada hasta que se arregle (en VS Code sale subrayado en rojo; con Go Live lo ves igual): la web se queda como estaba.\n`);
  process.exit(1);
};

/* Cada JSON se lee y se comprueba con su esquema (schema/), el mismo con el
   que VS Code subraya lo que está mal. */
const schema = (type) => JSON.parse(readFileSync(join(ROOT, 'schema', `${type}.json`), 'utf8'));
const invalid = [];
function read(file, type) {
  let data;
  try { data = leerJSON(readFileSync(join(ROOT, file), 'utf8'), file); } catch (e) { fail(e.message); }
  invalid.push(...validar(data, schema(type), file));
  return data;
}

const site = read('data/site.json', 'site');
const about = read('data/about.json', 'about');
const config = read('data/config.json', 'config');
if (invalid.length) fail(invalid);
const files = new Map();
for (const list of Object.values(site.lists)) {
  for (const slug of list.projects.map(slugOf)) {
    const at = `projects/${slug}/project.json`;
    if (existsSync(join(ROOT, at))) files.set(at, read(at, 'project'));
  }
}
if (invalid.length) fail(invalid);

/* Dónde se publica (JAMstack, patrones §5): en la Action de GitHub (nuestra
   copia), meowrhino.github.io/sepulcrito/ y sin indexar; en cualquier otro
   sitio (Workers Builds, la copia de la clienta), la raíz con el dominio de
   site.json → "url", y se indexa si lo hay. */
const github = process.env.GITHUB_ACTIONS === 'true';
const [owner, repo] = (process.env.GITHUB_REPOSITORY || 'meowrhino/sepulcrito').split('/');
if (github) site.url = `https://${owner}.github.io/${repo}/`;
else if (site.url) site.url = site.url.replace(/\/?$/, '/');
site.noindex = github || !site.url;

/* ── validar ── */

/** El ancho y alto de una foto, de sus primeros bytes; null si no es un
    WebP de verdad, undefined si no está. De un .webm, {} si está. */
function size(src) {
  const file = join(ROOT, src);
  if (!existsSync(file)) return undefined;
  if (src.endsWith('.webm')) return {};
  const b = Buffer.alloc(30);
  const fd = openSync(file, 'r');
  readSync(fd, b, 0, 30, 0);
  closeSync(fd);
  return webpSize(b);
}

const { projects, errors, warnings } = loadProjects(site, {
  json: (at) => files.get(at),
  size,
  folders: readdirSync(join(ROOT, 'projects'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `projects/${e.name}`),
});

/* tattoo/: las que se llaman 1.webp, 2.webp…, por su número; lo demás no sale. */
const tattooFiles = readdirSync(join(ROOT, 'tattoo')).filter((f) => !f.startsWith('.'));
for (const f of tattooFiles) if (!/^[1-9][0-9]*\.webp$/.test(f)) warnings.push(`tattoo/${f} no sale: las fotos de tattoo se llaman 1.webp, 2.webp… (como las saca imgToWeb)`);
const numbers = tattooFiles.map((f) => /^([1-9][0-9]*)\.webp$/.exec(f)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
const gap = numbers.findIndex((n, i) => n !== i + 1);
if (gap >= 0) warnings.push(`tattoo: falta ${gap + 1}.webp (en la web salen todas, pero la vista previa se para ahí)`);
const { images: tattoo, errors: tattooErrors } = loadTattoo(numbers, size);
errors.push(...tattooErrors);

/* about/<photo>.webp */
const aboutSize = size(`about/${about.photo}.webp`);
if (aboutSize === undefined) errors.push(`data/about.json: en «photo», no encuentro about/${about.photo}.webp`);
if (aboutSize === null) errors.push(`about/${about.photo}.webp no es un WebP de verdad (pásala por imgToWeb)`);
const aboutPhoto = aboutSize ? { src: `about/${about.photo}.webp`, ...aboutSize } : null;

/* Cloudflare (la copia de la clienta) no publica archivos de más de 25 MB. */
for (const dir of ['projects', 'tattoo', 'about', 'assets']) {
  for (const f of readdirSync(join(ROOT, dir), { recursive: true }).map(String)) {
    const st = statSync(join(ROOT, dir, f));
    if (st.isFile() && st.size > 25 * 1024 * 1024) errors.push(`${dir}/${f} pesa ${Math.round(st.size / 1048576)} MB, y el máximo es 25: pásalo otra vez por imgToWeb o videoToWeb (un vídeo, más corto)`);
  }
}

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) fail(errors);

/* ── lo que necesitan las plantillas del disco ── */

/* ?v=<hash>: que un deploy no deje a nadie con el CSS o el JS viejos en caché. */
const hashes = new Map();
const version = (file) => {
  if (!hashes.has(file)) hashes.set(file, `?v=${createHash('sha1').update(readFileSync(join(ROOT, file))).digest('hex').slice(0, 8)}`);
  return hashes.get(file);
};

/* Las imágenes que hace el build, con sharp, en .cache/ (fuera de git) y
   solo si no están o ha cambiado la foto de la que salen:
     mini/<src>        la foto a 900 px de ancho, para las listas y tattoo
     og/<src>.jpg      la de compartir, 1200×630, recortada por lo que importa
     astro/<src>       la portada en 28 bloques, para la estrella de su proyecto
                       (el CSS la estira sin suavizar)
   Las plantillas las piden mientras pintan y sharp va aparte (es asíncrono):
   una primera pasada apunta cuáles hacen falta, se hacen, y se pinta. */
let sharp;
try { sharp = (await import('sharp')).default; } catch (e) {
  console.warn(`⚠ sin sharp (${e.code || e.message}): las listas usan las fotos grandes y no hay imagen al compartir. Se arregla con: npm ci`);
}
const fresh = (out, src) => existsSync(out) && statSync(out).mtimeMs >= statSync(join(ROOT, src)).mtimeMs;
const miniWanted = new Set();
const ogWanted = new Set();
const miniDone = new Set();
const astroWanted = new Set();
const astroDone = new Set();
const ogDone = new Set();
const ogPath = (src) => `og/${src.replace(/\.webp$/, '.jpg')}`;
/* la foto de la home pixelada (80 bloques de ancho, del mismo tamaño que la original para
   que case encima), para las estrellas de la landing: pixel/<src>. */
const PIXEL = 'assets/img/home.webp';
let pixelDone = false;
const images = {
  mini: (img) => { miniWanted.add(img.src); return miniDone.has(img.src) ? `mini/${img.src}` : img.src; },
  pixel: (src) => (pixelDone ? `pixel/${src}` : src),
  astro: (img) => { astroWanted.add(img.src); return astroDone.has(img.src) ? `astro/${img.src}` : img.src; },
  yt: (id) => (ytDone.has(id) ? `yt/${id}.jpg` : null),
  og: (img) => { ogWanted.add(img.src); return ogDone.has(img.src) ? ogPath(img.src) : null; },
};

/* Los fotogramas de los vídeos de YouTube (de oriol-colomer): se bajan al publicar, a
   .cache/yt/, y se sirven desde la web: abrir un proyecto no le pide nada a Google hasta
   darle al play. Sin red, se piden a YouTube como antes. */
const ytDone = new Set();
await Promise.all([...new Set(projects.flatMap((p) => [p, ...p.groups]).flatMap((x) => x.links || []).map(youtube).filter(Boolean))].map(async (id) => {
  const out = join(CACHE, 'yt', `${id}.jpg`);
  if (existsSync(out)) return ytDone.add(id);
  for (const q of ['maxresdefault', 'hqdefault']) {
    try {
      const r = await fetch(`https://i.ytimg.com/vi/${id}/${q}.jpg`, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) continue;
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, Buffer.from(await r.arrayBuffer()));
      return ytDone.add(id);
    } catch { /* se prueba la siguiente, o se queda en YouTube */ }
  }
  console.warn(`⚠ no he podido bajar el fotograma del vídeo de YouTube ${id}: se pide a YouTube al abrir la página`);
}));

/* Las versiones de prueba del diseño: cada carpeta de estilos/ con su plantillas.mjs se
   publica entera en /<carpeta>/ (sin indexar), con la home de siempre. */
const estilos = existsSync(join(ROOT, 'estilos'))
  ? await Promise.all(readdirSync(join(ROOT, 'estilos')).filter((d) => existsSync(join(ROOT, 'estilos', d, 'plantillas.mjs')))
    .map(async (d) => ({ nombre: d, ...(await import(pathToFileURL(join(ROOT, 'estilos', d, 'plantillas.mjs')).href)).default })))
  : [];
const webs = (opts) => [sitio(opts), ...estilos.map((estilo) => sitio({ ...opts, estilo, prefijo: `${estilo.nombre}/` }))];

for (const dry of webs({ site, config, about, projects, tattoo, aboutPhoto, version, ...images })) for (const path of dry.paths) dry.render(path);
if (sharp) {
  for (const src of miniWanted) {
    const out = join(CACHE, 'mini', src);
    try {
      if (!fresh(out, src)) {
        mkdirSync(dirname(out), { recursive: true });
        await sharp(join(ROOT, src)).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
      }
      miniDone.add(src);
    } catch (e) { console.warn(`⚠ ${src}: no se ha podido hacer su foto pequeña (${e.message})`); }
  }
  for (const src of astroWanted) {
    const out = join(CACHE, 'astro', src);
    try {
      if (!fresh(out, src)) {
        mkdirSync(dirname(out), { recursive: true });
        await sharp(join(ROOT, src)).resize(28, 27, { fit: 'cover', position: 'attention' }).webp({ lossless: true }).toFile(out);
      }
      astroDone.add(src);
    } catch (e) { console.warn(`⚠ ${src}: no se ha podido pixelar para la estrella (${e.message}); sale la foto tal cual`); }
  }
  try {
    const out = join(CACHE, 'pixel', PIXEL);
    if (!fresh(out, PIXEL)) {
      mkdirSync(dirname(out), { recursive: true });
      const { width: w, height: h } = await sharp(join(ROOT, PIXEL)).metadata();
      const poco = await sharp(join(ROOT, PIXEL)).resize(80, Math.round((80 * h) / w), { fit: 'fill' }).toBuffer();
      await sharp(poco).resize(w, h, { fit: 'fill', kernel: 'nearest' }).webp({ lossless: true }).toFile(out);
    }
    pixelDone = true;
  } catch (e) { console.warn(`⚠ ${PIXEL}: no se ha podido hacer la versión pixelada (${e.message}); las estrellas de la home salen con la foto tal cual`); }
  for (const src of ogWanted) {
    const out = join(CACHE, ogPath(src));
    try {
      if (!fresh(out, src)) {
        mkdirSync(dirname(out), { recursive: true });
        await sharp(join(ROOT, src)).resize(OG_W, OG_H, { fit: 'cover', position: 'attention' }).jpeg({ quality: 85, mozjpeg: true }).toFile(out);
      }
      ogDone.add(src);
    } catch (e) { console.warn(`⚠ ${src}: no se ha podido hacer la imagen para compartir (${e.message})`); }
  }
}

/* ── escribir ── */

rmSync(OUT, { recursive: true, force: true, maxRetries: 5 });
mkdirSync(OUT, { recursive: true });
const sinNotas = (f) => !f.endsWith('.DS_Store') && !f.endsWith('.json');
for (const d of ['css', 'js', 'fonts', 'assets', 'tattoo', 'about', 'projects']) cpSync(join(ROOT, d), join(OUT, d), { recursive: true, filter: sinNotas });
for (const { nombre } of estilos) cpSync(join(ROOT, 'estilos', nombre), join(OUT, 'estilos', nombre), { recursive: true, filter: (f) => sinNotas(f) && !f.endsWith('.mjs') });
cpSync(join(ROOT, '_headers'), join(OUT, '_headers'));
for (const src of miniDone) { mkdirSync(dirname(join(OUT, 'mini', src)), { recursive: true }); cpSync(join(CACHE, 'mini', src), join(OUT, 'mini', src)); }
for (const src of astroDone) { mkdirSync(dirname(join(OUT, 'astro', src)), { recursive: true }); cpSync(join(CACHE, 'astro', src), join(OUT, 'astro', src)); }
if (ytDone.size) cpSync(join(CACHE, 'yt'), join(OUT, 'yt'), { recursive: true });
if (pixelDone) { mkdirSync(dirname(join(OUT, 'pixel', PIXEL)), { recursive: true }); cpSync(join(CACHE, 'pixel', PIXEL), join(OUT, 'pixel', PIXEL)); }
for (const src of ogDone) { mkdirSync(dirname(join(OUT, ogPath(src))), { recursive: true }); cpSync(join(CACHE, ogPath(src)), join(OUT, ogPath(src))); }

const [web, ...versiones] = webs({ site, config, about, projects, tattoo, aboutPhoto, version, ...images });
for (const [w, pre] of [[web, ''], ...versiones.map((v, i) => [v, `${estilos[i].nombre}/`])]) {
  for (const path of w.paths) {
    mkdirSync(join(OUT, pre, path), { recursive: true });
    writeFileSync(join(OUT, pre, path, 'index.html'), w.render(path));
  }
}
writeFileSync(join(OUT, '404.html'), web.notFound());
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${web.listed.map((p) => `  <url><loc>${esc(web.abs(p) ?? `/${p}`)}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), site.noindex ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${web.abs('sitemap.xml')}\n`);
writeFileSync(join(OUT, '.nojekyll'), '');   // GitHub Pages: servir los archivos tal cual, sin Jekyll

const n = (s) => projects.filter((p) => p.section === s).length;
if (estilos.length) console.log(`✓ y las versiones del diseño: ${estilos.map((e) => `/${e.nombre}/`).join(', ')}`);
console.log(`✓ dist/: ${web.paths.length} páginas (home, ${n('obra')} obras, ${n('direccion-creativa')} proyectos con sus partes, tattoo con ${tattoo.length} fotos y about), 404, sitemap y robots${site.noindex ? ', sin indexar' : ''}.`);
