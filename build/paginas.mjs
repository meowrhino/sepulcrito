/* Las plantillas de la web: los datos → el HTML de cada página.

   Las usan dos:

     build/build.mjs     en Node, al publicar: escribe dist/
     build/preview.mjs   en el navegador, con Live Server: pinta la página al
                         vuelo, leyendo los JSON (index.html?p=/obra/sweet-wrecker/)

   Por eso este archivo no toca el disco: lo que necesita de él (las fotos
   pequeñas, las og:image, el ?v= de cada archivo) se lo pasa quien lo llama,
   en sitio() (al final).

   Las páginas:

     ''                                   la home (su plantilla, build/home.mjs; su CSS, css/home.css)
     obra/                                las obras, en collage
     obra/<slug>/                         una obra, como un proyecto (abajo)
     direccion-creativa/                  los proyectos, en lista (la portada al pasar)
     direccion-creativa/<slug>/           un proyecto, de lado (en el móvil, hacia abajo) y en
                                          cuatro partes: el inicio (la estrella con el logo y el
                                          texto), las fotos, los vídeos (.webm y YouTube) y el
                                          final (como el inicio, con text2)
     direccion-creativa/<slug>/<parte>/   una parte de un proyecto (Tattoox → Riverland), igual
     tattoo/                              las fotos de tattoo/, en columnas
     about/                               la foto, el texto y el contacto

   Y la 404. Cada sección tiene su aspecto: sus colores y letras, en data/config.json (que
   aquí se vuelve un <style>); lo demás, en css/style.css, por la clase del <body>. */

import { home } from './home.mjs';

/** Escapa lo que va al documento, también las comillas (sirve en atributos). */
export const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* La clase del <body> de cada sección de data/config.json, y cada letra del esquema con
   las de recambio (las woff2 están en fonts/ y en css/style.css). */
const CLASE = { obra: 'obra', 'direccion-creativa': 'dc', tattoo: 'tattoo', about: 'about' };
const LETRAS = {
  Anton: 'Anton, Impact, sans-serif',
  Italianno: 'Italianno, var(--guion)',
  Pinyon: 'var(--guion)',
  'Instrument Serif': '"Instrument Serif", Georgia, serif',
  'Irish Grover': '"Irish Grover", fantasy',
  Times: '"Times New Roman", Times, serif',
  Georgia: 'Georgia, serif',
};

export const OG_W = 1200;
export const OG_H = 630;

/* La estrella del Figma, en línea para pintarla del color de cada sección. */
const PATH = 'M261.065 0L322.694 189.675H522.13L360.783 306.9L422.412 496.575L261.065 379.35L99.718 496.575L161.347 306.9L0 189.675H199.436L261.065 0Z';
const estrella = (cls) => `<svg class="${cls}" viewBox="0 0 522.13 496.575" aria-hidden="true"><path d="${PATH}"/></svg>`;

/* La transición de la casa (JAMstack, patrones §6c; js/transicion.js): la
   página nace tapada si se llega desde otra de la web, o con atrás y
   adelante. En la vista previa la página se pinta cuando el navegador ya ha
   revelado index.html: no hay View Transition que esperar. */
const headScript = (preview) => `<script>{
const html = document.documentElement;
html.classList.add('js');
let back = false;
try {
  const d = JSON.parse(sessionStorage.getItem('transicion'));
  back = !d && performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  if (d?.carga) html.style.setProperty('--carga', d.carga);
  if (back || d) html.classList.add('tapada');
} catch {}
window.revelada = ${preview ? 'false' : "'onpagereveal' in window"} ? new Promise((done) => addEventListener('pagereveal', (e) => {
  const vt = e.viewTransition;
  if (vt && back && html.classList.contains('tapada')) { html.classList.add('tapando'); done(vt); }
  else { vt?.ready.catch(() => {}); vt?.skipTransition(); done(null); }   // saltarla rechaza ready: sin error en la consola
}, { once: true })) : Promise.resolve(null);
}</script>
`;

const parrafos = (text, cls = 'texto') => (text || []).map((p) => `<p class="${cls}">${esc(p)}</p>`).join('\n');
const sitioDe = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').replace(/\.com$/, ''); } catch { return 'enlace'; } };
/** El id de un vídeo de YouTube, de cualquiera de sus enlaces (de oriol-colomer); null si no lo es. */
export const youtube = (link) => (/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/.exec(String(link || '')) || [])[1] || null;
/** Los enlaces de fuera: «ver en instagram ↗»; si hay varios del mismo sitio, numerados. */
function enlaces(links) {
  if (!links?.length) return '';
  const total = {}; const visto = {};
  for (const l of links) total[sitioDe(l)] = (total[sitioDe(l)] || 0) + 1;
  return `<ul class="enlaces">\n${links.map((l) => {
    const s = sitioDe(l); visto[s] = (visto[s] || 0) + 1;
    return `  <li><a href="${esc(l)}" target="_blank" rel="noopener">ver en ${esc(s)}${total[s] > 1 ? ` ${visto[s]}` : ''} ↗</a></li>`;
  }).join('\n')}\n</ul>`;
}

/**
 * La web, con lo que hace falta para pintarla:
 *
 *   site, about       data/site.json y data/about.json
 *   config            data/config.json: los colores y las letras de cada sección
 *   projects          los de proyectos.mjs (loadProjects)
 *   tattoo            las fotos de tattoo/ (loadTattoo)
 *   aboutPhoto        { src, w, h } de about/<photo>.webp
 *   version(file)     el ?v= de un css o js ('' en la vista previa)
 *   mini(img)         la ruta de la foto pequeña de img (en la vista previa, la grande)
 *   og(img)           la ruta de su og:image, o null si no hay
 *   pixel(src)        la ruta de la foto pixelada de la home (en la vista previa, la normal)
 *   astro(img)        la ruta de img en 28 bloques, para la estrella de un proyecto (en la
 *                     vista previa, la normal: la estrella sale sin pixelar)
 *   yt(id)            la ruta del fotograma de un vídeo de YouTube, o null (se pide a YouTube)
 *   preview           true en la vista previa: los enlaces van a ?p=
 *   estilo, prefijo   para las versiones de prueba del diseño (estilos/<letra>/plantillas.mjs,
 *                     publicadas en /<letra>/): sus plantillas, que cambian el cuerpo de cada
 *                     página, y 'a/'. Sin ellas, la web de siempre
 *
 * Devuelve las rutas de las páginas (`paths`, las que van al sitemap en
 * `listed`), render(path) y notFound().
 */
export function sitio({ site, config, about, projects, tattoo, aboutPhoto, version = () => '', mini = (img) => img.src, og = () => null, pixel = (src) => src, astro = (img) => img.src, yt = () => null, preview = false, estilo: E = null, prefijo = '' }) {
  const abs = (path) => (site.url ? new URL(path, site.url).href : null);
  const visibles = (section) => projects.filter((p) => p.section === section && !p.hidden);
  const instagram = site.instagram ? `https://www.instagram.com/${site.instagram}/` : null;

  /* data/config.json → las variables de css/style.css, una regla por sección (la clase del
     <body>). Los colores y las letras ya vienen comprobados por schema/config.json. */
  const variables = Object.entries(config.sections).map(([s, c]) => `.${CLASE[s]} { --fondo: ${c.background}; --tinta: ${c.color}; --menu: ${c.color}; --activa: ${c.highlight}; --astro: ${c.star}; --estrella: ${c.header_star}; --titular: ${LETRAS[c.title_font]}; --letra: ${LETRAS[c.text_font]}; }`).join('\n');

  /* R: de la página que se pinta a la raíz ('../../' en obra/x/). */
  let R = '';
  const link = (path) => (preview ? `?p=/${prefijo}${path}` : R + prefijo + path);
  const src = (s) => R + s;

  /** Una foto o un vídeo, con su ancho y alto para que la página no salte al cargar. */
  function pieza(m, alt, lazy, cls) {
    const c = cls ? ` class="${cls}"` : '';
    if (m.video) return `<video${c} src="${src(m.video)}" poster="${src(m.src)}" width="${m.w}" height="${m.h}" controls muted loop playsinline preload="none" aria-label="${esc(alt)}"></video>`;
    return `<img${c} src="${src(m.src)}" width="${m.w}" height="${m.h}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''}>`;
  }
  const miniatura = (m, alt = '') => `<img src="${src(mini(m))}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" loading="lazy">`;

  /* `body` es una función: se pinta después de saber R, la ruta a la raíz de esta página. */
  function pagina({ path, title, description = site.description, image, seccion, body, css, noindex, volver }) {
    R = path === null ? (site.url || '/') : (preview ? '' : '../'.repeat((prefijo + path).split('/').filter(Boolean).length));
    const full = title ? `${title} · ${site.title}` : site.title;
    const actual = path?.split('/')[0];
    const canonical = path !== null && !prefijo && abs(path);
    const ogImg = image && og(image);
    const ogUrl = ogImg && (abs(ogImg) || src(ogImg));
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
${headScript(preview)}<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
${site.noindex || noindex || prefijo || path === null ? '<meta name="robots" content="noindex">\n' : ''}${canonical ? `<link rel="canonical" href="${esc(canonical)}">\n<meta property="og:url" content="${esc(canonical)}">\n` : ''}<meta property="og:site_name" content="${esc(site.title)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
${ogUrl ? `<meta property="og:image" content="${esc(ogUrl)}">\n<meta property="og:image:width" content="${OG_W}">\n<meta property="og:image:height" content="${OG_H}">\n<meta name="twitter:card" content="summary_large_image">\n` : ''}<link rel="icon" href="${src('assets/img/star.webp')}">
<link rel="stylesheet" href="${src('css/transicion.css')}${version('css/transicion.css')}">
<link rel="stylesheet" href="${src('css/style.css')}${version('css/style.css')}">
<style>
${variables}
</style>
${css ? `<link rel="stylesheet" href="${src(css)}${version(css)}">\n` : ''}<script src="${src('js/transicion.js')}${version('js/transicion.js')}" defer></script>
<script src="${src('js/site.js')}${version('js/site.js')}" defer></script>
${E && path !== '' ? `<link rel="stylesheet" href="${src(`estilos/${E.nombre}/estilo.css`)}${version(`estilos/${E.nombre}/estilo.css`)}">
<script src="${src('js/astro.js')}${version('js/astro.js')}" defer></script>
<script src="${src(`estilos/${E.nombre}/estilo.js`)}${version(`estilos/${E.nombre}/estilo.js`)}" defer></script>
` : ''}</head>
<body class="${seccion}${E && path !== '' ? ` estilo-${E.nombre}` : ''}">
${body()}
${E?.menu && path !== '' ? E.menu(ctx, { path, actual, volver }) : `<nav class="menu">
${volver ? `  <a class="volver" href="${link(volver.href)}">←<span> ${esc(volver.text)}</span></a>\n` : ''}${path ? `  <a class="menu-casa" href="${link('')}" aria-label="home">${estrella('')}</a>\n` : ''}${site.menu.map((m) => `  <a href="${link(m.href)}"${m.href.split('/')[0] === actual ? ' aria-current="page"' : ''}>${esc(m.text)}</a>`).join('\n')}
</nav>`}
</body>
</html>
`;
  }

  /* ── obra ── */

  const obra = visibles('obra');
  const obraIndex = () => pagina({
    path: 'obra/', title: site.lists.obra.name, seccion: 'obra', image: obra[0]?.cover,
    description: `${site.lists.obra.name} de ${site.title}: ${obra.map((p) => p.title).join(', ')}.`,
    body: () => E?.obra ? E.obra(ctx) : `<header class="cabecera">
  ${estrella('cabecera-estrella')}
  <h1>${esc(site.lists.obra.name)}</h1>
</header>
<main class="obras">
${obra.map((p) => `  <a class="ficha" href="${link(p.path)}">
    ${miniatura(p.cover)}
    <span class="ficha-titulo">${esc(p.title)}</span>${p.year ? ` <span class="ficha-año">${p.year}</span>` : ''}
  </a>`).join('\n')}
</main>`,
  });

  const siguiente = (p) => { const l = visibles(p.section); return l[(l.indexOf(p) + 1) % l.length] || l[0]; };
  /** Adónde lleva «siguiente» desde un proyecto (o una parte, `g`): su parte siguiente o el
      proyecto siguiente de su lista. { href, title } */
  function sigDe(p, g) {
    const i = g ? p.groups.indexOf(g) : -1;
    if (g && i < p.groups.length - 1) return { href: `${p.path}${p.groups[i + 1].slug}/`, title: p.groups[i + 1].title };
    return { href: siguiente(p).path, title: siguiente(p).title };
  }

  /* ── dirección creativa ── */

  const dc = visibles('direccion-creativa');
  const dcName = site.lists['direccion-creativa'].name;
  const dcIndex = () => pagina({
    path: 'direccion-creativa/', title: dcName, seccion: 'dc', image: dc[0]?.cover,
    description: `${dcName} de ${site.title}: ${dc.map((p) => p.title).join(', ')}.`,
    body: () => E?.dc ? E.dc(ctx) : `<header class="cabecera">
  ${estrella('cabecera-estrella')}
  <h1>${esc(dcName).replace(' ', '<br>')}</h1>
</header>
<main class="proyectos">
${dc.map((p) => `  <a class="proyecto" href="${link(p.path)}">
    <span class="proyecto-titulo">${esc(p.title)}</span>
    ${miniatura(p.cover)}
  </a>`).join('\n')}
</main>`,
  });

  /* La marca de un proyecto: la estrella (un hueco con su foto pixelada, del color de la
     sección; al pasar se despixela) y, encima, su logo o su título. */
  const marca = (p, foto) => `<div class="marca">
    <div class="marca-estrella"><div class="marca-forma"><img class="marca-px" src="${src(astro(foto))}" alt=""><img class="marca-foto" src="${src(mini(foto))}" alt="" loading="lazy"></div></div>
    ${p.logo ? `<img class="logo" src="${src(p.logo.src)}" width="${p.logo.w}" height="${p.logo.h}" alt="${esc(p.title)}">` : `<span class="marca-titulo">${esc(p.title)}</span>`}
  </div>`;

  /** Un vídeo de YouTube: su fotograma con el play, que es un enlace. El reproductor
      (youtube-nocookie) lo pone js/site.js al darle: abrir la página no le pide nada a
      Google si el build ha bajado el fotograma. */
  function embed(l, titulo) {
    const id = youtube(l);
    const t = /[?&]t=(\d+)/.exec(l)?.[1];
    return `<a class="yt" href="${esc(l)}" target="_blank" rel="noopener" data-yt="${id}"${t ? ` data-t="${t}"` : ''} aria-label="ver el vídeo: ${esc(titulo)}"><img src="${yt(id) ? src(yt(id)) : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`}" alt="" loading="lazy"></a>`;
  }

  /** Un proyecto o una obra (o una parte, `g`), de lado y por pantallas, en cuatro partes:
      1. el inicio: el fondo de su sección, la estrella con el logo y el texto;
      2. las fotos (en Tattoox, antes, sus partes);
      3. los vídeos: los suyos (.webm) y los de YouTube, si hay;
      4. el final: como el inicio, con el segundo texto (text2; si no hay, el mismo),
         los enlaces y el siguiente. */
  function tira(p, g) {
    const yo = g || p;
    const titulo = g ? `${p.title} · ${g.title}` : p.title;
    const fotos = yo.images.filter((m) => !m.video);
    const webms = yo.images.filter((m) => m.video);
    const yts = (yo.links || []).filter(youtube);
    const partes = p.groups.length ? `<ul class="partes">
${p.groups.map((x) => `      <li><a href="${link(`${p.path}${x.slug}/`)}"${x === g ? ' aria-current="page"' : ''}>${esc(x.title)}</a></li>`).join('\n')}
    </ul>` : '';
    const nombre = `${esc(yo.title)}${yo.year ? ` <span>${yo.year}</span>` : ''}`;
    const sig = sigDe(p, g);
    return `<main class="tira">
<section class="pantalla inicio">
  <div class="pantalla-texto">
    ${partes}
    <h1 class="pieza-titulo">${nombre}</h1>
${parrafos(yo.text)}
  </div>
  ${marca(p, yo.cover)}
</section>
${!g && p.groups.length ? `<section class="pantalla fila">
${p.groups.map((x) => `  <a class="parte" href="${link(`${p.path}${x.slug}/`)}">
    ${miniatura(x.cover, x.title)}
    <span>${esc(x.title)}</span>
  </a>`).join('\n')}
</section>` : ''}
${fotos.length ? `<section class="pantalla fila">
${fotos.map((m, i) => `  ${pieza(m, `${titulo}, ${i + 1}`, i > 0)}`).join('\n')}
</section>` : ''}
${webms.length || yts.length ? `<section class="pantalla videos">
${[...webms.map((m, i) => pieza(m, `${titulo}, vídeo ${i + 1}`)), ...yts.map((l) => embed(l, titulo))].map((x) => `  ${x}`).join('\n')}
</section>` : ''}
<section class="pantalla inicio final">
  <div class="pantalla-texto">
    <p class="pieza-titulo">${nombre}</p>
${parrafos(yo.text2?.length ? yo.text2 : yo.text)}
${enlaces((yo.links || []).filter((l) => !youtube(l)))}
    <a class="siguiente" href="${link(sig.href)}">siguiente: ${esc(sig.title)} →</a>
  </div>
  ${marca(p, yo.cover)}
</section>
</main>`;
  }

  const proyecto = (p, g) => pagina({
    path: g ? `${p.path}${g.slug}/` : p.path, title: g ? `${p.title} · ${g.title}` : p.title, seccion: `${CLASE[p.section]} ${E?.proyecto ? 'proyecto' : 'pieza'}`,
    image: (g || p).cover, noindex: p.hidden,
    volver: g ? { href: p.path, text: p.title } : { href: `${p.section}/`, text: site.lists[p.section].name },
    description: (g || p).text?.[0]?.slice(0, 160) || `${g ? `${g.title}, de ${p.title}` : `${p.title}${p.year ? `, ${p.year}` : ''}`}: ${site.lists[p.section].name} de ${site.title}.`,
    body: () => (E?.proyecto ? E.proyecto(ctx, p, g) : tira(p, g)),
  });

  /* ── tattoo y about ── */

  const tattooPagina = () => pagina({
    path: 'tattoo/', title: 'tattoo', seccion: 'tattoo', image: tattoo[0], description: `Tattoo de ${site.title}.`,
    body: () => E?.tattoo ? E.tattoo(ctx) : `<header class="cabecera">
  ${estrella('cabecera-estrella')}
  <h1>tattoo</h1>
${instagram ? `  <p class="tattoo-citas">citas por instagram: <a href="${esc(instagram)}" target="_blank" rel="noopener">@${esc(site.instagram)}</a></p>\n` : ''}</header>
<main class="tatuajes">
${tattoo.map((m, i) => `  <a href="${src(m.src)}">${miniatura(m, `tattoo ${i + 1}`)}</a>`).join('\n')}
</main>`,
  });

  const aboutPagina = () => pagina({
    path: 'about/', title: 'about', seccion: 'about', image: aboutPhoto,
    description: about.text?.[0]?.slice(0, 160) || site.description,
    body: () => E?.about ? E.about(ctx) : `<main class="sobre">
  <img class="sobre-foto" src="${src(aboutPhoto.src)}" width="${aboutPhoto.w}" height="${aboutPhoto.h}" alt="${esc(site.title)}">
  <div class="sobre-texto">
    <h1>${esc(site.title)}</h1>
    <p class="sobre-lema">${esc(site.lema)}</p>
${parrafos(about.text)}
    <p class="sobre-contacto">${[
      instagram && `<a href="${esc(instagram)}" target="_blank" rel="noopener">instagram @${esc(site.instagram)}</a>`,
      site.email && `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>`,
    ].filter(Boolean).join('<br>')}</p>
    <p class="firma">web: <a href="https://meowrhino.studio" target="_blank" rel="noopener">meowrhino.studio</a></p>
  </div>
</main>`,
  });

  const homePagina = () => pagina({
    path: '', seccion: 'home', image: { src: 'assets/img/home.webp' }, css: 'css/home.css',
    body: () => home({ site, esc, r: R, link, version, pixel }),
  });

  /* Lo que reciben las plantillas de un estilo (estilos/<letra>/plantillas.mjs). Las funciones
     leen R al llamarlas: sirven dentro de body(). */
  const ctx = {
    site, config, about, aboutPhoto, tattoo, projects, instagram, preview,
    esc, link, src, pieza, miniatura, parrafos, enlaces, embed, youtube, estrella, visibles, siguiente, sigDe,
    mini: (m) => src(mini(m)),
    lista: (section) => ({ ...site.lists[section], projects: visibles(section) }),
  };

  /* ── las rutas ── */

  const pages = new Map([
    ['', homePagina],
    ['obra/', obraIndex],
    ['direccion-creativa/', dcIndex],
    ['tattoo/', tattooPagina],
    ['about/', aboutPagina],
  ]);
  for (const p of projects) {
    pages.set(p.path, () => proyecto(p));
    for (const g of p.groups) pages.set(`${p.path}${g.slug}/`, () => proyecto(p, g));
  }
  const hidden = new Set(projects.filter((p) => p.hidden).flatMap((p) => [p.path, ...p.groups.map((g) => `${p.path}${g.slug}/`)]));
  const paths = [...pages.keys()];
  return {
    paths,
    listed: paths.filter((p) => !hidden.has(p)),
    abs,
    render: (path) => pages.get(path)?.(),
    notFound: () => pagina({
      path: null, title: 'no está', seccion: 'about',
      body: () => `<main class="sobre sobre-404"><div class="sobre-texto"><h1>esta página no está</h1><p class="sobre-contacto"><a href="${link('')}">volver a la home</a></p></div></main>`,
    }),
  };
}
