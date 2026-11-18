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
     obra/<slug>/                         una obra: título, año, texto y sus fotos hacia abajo
     direccion-creativa/                  los proyectos, en lista (la portada al pasar)
     direccion-creativa/<slug>/           un proyecto, de lado y por pantallas, como en el
                                          Figma: la primera vista (logo, foto destacada y, si
                                          tiene partes, su índice), las fotos, los vídeos, y el
                                          texto con el logo al final; entre pantalla y pantalla,
                                          una raya
     direccion-creativa/<slug>/<parte>/   una parte de un proyecto (Tattoox → Riverland), igual
     tattoo/                              las fotos de tattoo/, en columnas
     about/                               la foto, el texto y el contacto

   Y la 404. Cada sección tiene su aspecto (css/style.css: la clase del <body>). */

import { home } from './home.mjs';

/** Escapa lo que va al documento, también las comillas (sirve en atributos). */
export const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
/** Los enlaces de fuera: «ver en youtube ↗»; si hay varios del mismo sitio, numerados. */
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
 *   projects          los de proyectos.mjs (loadProjects)
 *   tattoo            las fotos de tattoo/ (loadTattoo)
 *   aboutPhoto        { src, w, h } de about/<photo>.webp
 *   version(file)     el ?v= de un css o js ('' en la vista previa)
 *   mini(img)         la ruta de la foto pequeña de img (en la vista previa, la grande)
 *   og(img)           la ruta de su og:image, o null si no hay
 *   preview           true en la vista previa: los enlaces van a ?p=
 *
 * Devuelve las rutas de las páginas (`paths`, las que van al sitemap en
 * `listed`), render(path) y notFound().
 */
export function sitio({ site, about, projects, tattoo, aboutPhoto, version = () => '', mini = (img) => img.src, og = () => null, preview = false }) {
  const abs = (path) => (site.url ? new URL(path, site.url).href : null);
  const visibles = (section) => projects.filter((p) => p.section === section && !p.hidden);
  const instagram = site.instagram ? `https://www.instagram.com/${site.instagram}/` : null;

  /* R: de la página que se pinta a la raíz ('../../' en obra/x/). */
  let R = '';
  const link = (path) => (preview ? `?p=/${path}` : R + path);
  const src = (s) => R + s;

  /** Una foto o un vídeo, con su ancho y alto para que la página no salte al cargar. */
  function pieza(m, alt, lazy, cls) {
    const c = cls ? ` class="${cls}"` : '';
    if (m.video) return `<video${c} src="${src(m.video)}" poster="${src(m.src)}" width="${m.w}" height="${m.h}" controls muted loop playsinline preload="none" aria-label="${esc(alt)}"></video>`;
    return `<img${c} src="${src(m.src)}" width="${m.w}" height="${m.h}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''}>`;
  }
  const miniatura = (m, alt = '') => `<img src="${src(mini(m))}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" loading="lazy">`;

  /* `body` es una función: se pinta después de saber R, la ruta a la raíz de esta página. */
  function pagina({ path, title, description = site.description, image, seccion, body, css, noindex }) {
    R = path === null ? (site.url || '/') : (preview ? '' : '../'.repeat(path.split('/').filter(Boolean).length));
    const full = title ? `${title} · ${site.title}` : site.title;
    const actual = path?.split('/')[0];
    const canonical = path !== null && abs(path);
    const ogImg = image && og(image);
    const ogUrl = ogImg && (abs(ogImg) || src(ogImg));
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
${headScript(preview)}<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
${site.noindex || noindex || path === null ? '<meta name="robots" content="noindex">\n' : ''}${canonical ? `<link rel="canonical" href="${esc(canonical)}">\n<meta property="og:url" content="${esc(canonical)}">\n` : ''}<meta property="og:site_name" content="${esc(site.title)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
${ogUrl ? `<meta property="og:image" content="${esc(ogUrl)}">\n<meta property="og:image:width" content="${OG_W}">\n<meta property="og:image:height" content="${OG_H}">\n<meta name="twitter:card" content="summary_large_image">\n` : ''}<link rel="icon" href="${src('assets/img/star.webp')}">
<link rel="stylesheet" href="${src('css/transicion.css')}${version('css/transicion.css')}">
<link rel="stylesheet" href="${src('css/style.css')}${version('css/style.css')}">
${css ? `<link rel="stylesheet" href="${src(css)}${version(css)}">\n` : ''}<script src="${src('js/transicion.js')}${version('js/transicion.js')}" defer></script>
<script src="${src('js/site.js')}${version('js/site.js')}" defer></script>
</head>
<body class="${seccion}">
${body()}
<nav class="menu">
${path ? `  <a class="menu-casa" href="${link('')}" aria-label="home">${estrella('')}</a>\n` : ''}${site.menu.map((m) => `  <a href="${link(m.href)}"${m.href.split('/')[0] === actual ? ' aria-current="page"' : ''}>${esc(m.text)}</a>`).join('\n')}
</nav>
</body>
</html>
`;
  }

  /* ── obra ── */

  const obra = visibles('obra');
  const obraIndex = () => pagina({
    path: 'obra/', title: site.lists.obra.name, seccion: 'obra', image: obra[0]?.cover,
    description: `${site.lists.obra.name} de ${site.title}: ${obra.map((p) => p.title).join(', ')}.`,
    body: () => `<header class="cabecera">
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

  const obraPagina = (p) => pagina({
    path: p.path, title: p.title, seccion: 'obra pieza', image: p.cover, noindex: p.hidden,
    description: p.text?.[0]?.slice(0, 160) || `${p.title}${p.year ? `, ${p.year}` : ''}. Obra de ${site.title}.`,
    body: () => `<header class="pieza-cabecera">
  <a class="volver" href="${link('obra/')}">← ${esc(site.lists.obra.name)}</a>
  <h1>${esc(p.title)}</h1>${p.year ? `\n  <p class="pieza-año">${p.year}</p>` : ''}
${parrafos(p.text)}
${enlaces(p.links)}
</header>
<main class="fotos">
${p.images.map((m, i) => `  ${pieza(m, `${p.title}, ${i + 1}`, i > 0)}`).join('\n')}
</main>
<footer class="pieza-pie"><a href="${link(siguiente(p).path)}">siguiente: ${esc(siguiente(p).title)} →</a></footer>`,
  });

  /* ── dirección creativa ── */

  const dc = visibles('direccion-creativa');
  const dcName = site.lists['direccion-creativa'].name;
  const dcIndex = () => pagina({
    path: 'direccion-creativa/', title: dcName, seccion: 'dc', image: dc[0]?.cover,
    description: `${dcName} de ${site.title}: ${dc.map((p) => p.title).join(', ')}.`,
    body: () => `<header class="cabecera">
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

  /* La marca de un proyecto: su logo (o su título) con la estrella detrás. */
  const marca = (p, h1) => `<div class="marca">
  ${estrella('marca-estrella')}
  ${p.logo ? `<img class="logo" src="${src(p.logo.src)}" width="${p.logo.w}" height="${p.logo.h}" alt="${esc(p.title)}">` : `<span class="marca-titulo">${esc(p.title)}</span>`}
</div>${h1 ? `\n<h1 class="oculto">${esc(h1)}</h1>` : ''}`;
  const raya = '<hr class="raya">';

  /** Un proyecto (o una parte, `g`), de lado y por pantallas, como en el Figma. */
  function tira(p, g) {
    const yo = g || p;
    const fotos = yo.images.filter((m) => !m.video);
    const videos = yo.images.filter((m) => m.video);
    const destacada = yo.cover;
    const resto = fotos.filter((m) => m !== destacada);
    const partes = p.groups.length ? `<ul class="partes">
${p.groups.map((x) => `  <li><a href="${link(`${p.path}${x.slug}/`)}"${x === g ? ' aria-current="page"' : ''}>${esc(x.title)}</a></li>`).join('\n')}
</ul>` : '';
    const sigP = g ? p.groups[(p.groups.indexOf(g) + 1) % p.groups.length] : null;
    const sig = g && p.groups.indexOf(g) < p.groups.length - 1
      ? { href: `${p.path}${sigP.slug}/`, title: sigP.title }
      : { href: siguiente(p).path, title: siguiente(p).title };
    const titulo = g ? `${p.title} · ${g.title}` : p.title;
    return `<main class="tira">
<section class="pantalla inicio">
  <a class="volver" href="${link(g ? p.path : 'direccion-creativa/')}">← ${esc(g ? p.title : dcName)}</a>
  ${partes}
  ${g ? `<p class="parte-titulo">${esc(g.title)}</p>` : ''}
  ${marca(p, titulo)}
  ${destacada ? pieza(destacada, titulo, false, 'destacada') : ''}
</section>
${!g && p.groups.length ? `${raya}
<section class="pantalla tira-partes">
${p.groups.map((x) => `  <a class="parte" href="${link(`${p.path}${x.slug}/`)}">
    ${miniatura(x.cover, x.title)}
    <span>${esc(x.title)}</span>
  </a>`).join('\n')}
</section>` : ''}
${resto.length ? `${raya}\n${resto.map((m, i) => pieza(m, `${titulo}, ${i + 2}`, i > 1)).join('\n')}` : ''}
${videos.length ? `${raya}\n${videos.map((m, i) => pieza(m, `${titulo}, vídeo ${i + 1}`, true)).join('\n')}` : ''}
${raya}
<section class="pantalla final">
  <div class="final-texto">
${parrafos(yo.text)}
${enlaces(yo.links)}
  <a class="siguiente" href="${link(sig.href)}">siguiente: ${esc(sig.title)} →</a>
  </div>
  ${marca(p)}
</section>
</main>`;
  }

  const dcPagina = (p, g) => pagina({
    path: g ? `${p.path}${g.slug}/` : p.path, title: g ? `${p.title} · ${g.title}` : p.title, seccion: 'dc pieza',
    image: (g || p).cover, noindex: p.hidden,
    description: (g || p).text?.[0]?.slice(0, 160) || `${g ? `${g.title}, de ${p.title}` : p.title}: ${dcName} de ${site.title}.`,
    body: () => tira(p, g),
  });

  /* ── tattoo y about ── */

  const tattooPagina = () => pagina({
    path: 'tattoo/', title: 'tattoo', seccion: 'tattoo', image: tattoo[0], description: `Tattoo de ${site.title}.`,
    body: () => `<header class="cabecera">
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
    body: () => `<main class="sobre">
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
    body: () => home({ site, esc, r: '', link }),
  });

  /* ── las rutas ── */

  const pages = new Map([
    ['', homePagina],
    ['obra/', obraIndex],
    ['direccion-creativa/', dcIndex],
    ['tattoo/', tattooPagina],
    ['about/', aboutPagina],
  ]);
  for (const p of projects) {
    if (p.section === 'obra') pages.set(p.path, () => obraPagina(p));
    else {
      pages.set(p.path, () => dcPagina(p));
      for (const g of p.groups) pages.set(`${p.path}${g.slug}/`, () => dcPagina(p, g));
    }
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
