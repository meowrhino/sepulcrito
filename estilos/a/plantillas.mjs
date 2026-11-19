/* A · censura: la estrella es la censura de una web porno: la foto en color y en mosaico,
   con su neón rosa, y al pasar se despixela (js/astro.js; en las fotos de las listas y de
   tattoo, la censura va encima de la foto, estilos/a/estilo.js). Títulos enormes con la
   letra de su sección, «Content Destroyer.» corriendo y botones de chicle, rectos y planos.
   El menú, una barra de chicle arriba (como en las referencias de la clienta).
   Sin JS se lee todo: la estrella sale con su foto sin pixelar. */

/* la estrella: un hueco con la foto (js/astro.js la pinta en mosaico); sin JS, la foto */
const astro = (c, foto, { n = 16, clase = '', fotos = null, y = null } = {}) => `<div class="astro neon ${clase}" data-n="${n}"${fotos ? ` data-fotos="${fotos.join(' ')}"` : ` data-src="${c.mini(foto)}"`}${y != null ? ` data-y="${y}"` : ''}><img src="${fotos ? fotos[0] : c.mini(foto)}" alt="" loading="lazy"></div>`;

/* una foto censurada: la foto y, encima, una estrella de mosaico (estilo.js) */
const censurada = (c, foto, alt, clase = '') => `<span class="censurada ${clase}">${c.miniatura(foto, alt)}</span>`;

const lema = (c) => {
  const t = `${c.esc(c.site.lema)} `.repeat(6);
  return `<p class="lema" aria-label="${c.esc(c.site.lema)}"><span aria-hidden="true">${t}</span><span aria-hidden="true">${t}</span></p>`;
};

const año = (y) => (y ? ` <small>${y}</small>` : '');

/* ── las listas: la cabecera (la estrella va cambiando entre las portadas) y las piezas ── */

function cabecera(c, titulo, ps) {
  return `<header class="a-cabecera">
  ${astro(c, null, { n: 18, clase: 'a-cabecera-astro', fotos: ps.map((p) => c.mini(p.cover)) })}
  <h1 class="a-gigante">${c.esc(titulo)}</h1>
  ${lema(c)}
</header>`;
}

function obra(c) {
  const l = c.lista('obra');
  return `${cabecera(c, l.name, l.projects)}
<main class="a-obras">
${l.projects.map((p, i) => `  <a class="a-obra" href="${c.link(p.path)}">
    ${censurada(c, p.cover, p.title, `e${i % 4}`)}
    <span class="a-obra-titulo">${c.esc(p.title)}${año(p.year)}</span>
  </a>`).join('\n')}
</main>`;
}

function dc(c) {
  const l = c.lista('direccion-creativa');
  return `${cabecera(c, l.name, l.projects)}
<main class="a-proyectos">
${l.projects.map((p, i) => `  <a class="a-proyecto" href="${c.link(p.path)}">
    <span class="a-num">${String(i + 1).padStart(2, '0')}</span>
    <span class="a-proyecto-titulo">${c.esc(p.title)}</span>
    ${astro(c, p.cover, { n: 10, clase: 'a-proyecto-astro' })}
  </a>`).join('\n')}
</main>`;
}

/* ── un proyecto: de lado (en el móvil, hacia abajo), en cuatro partes ── */

/* las partes de un proyecto (Tattoox), cada una en su estrellita */
const estrellitas = (c, p, g) => `<nav class="a-partes" aria-label="partes de ${c.esc(p.title)}">
${p.groups.map((x) => `    <a class="a-parte" href="${c.link(`${p.path}${x.slug}/`)}"${x === g ? ' aria-current="page"' : ''}>${astro(c, x.cover, { n: 8 })}<span>${c.esc(x.title)}</span></a>`).join('\n')}
  </nav>`;

function proyecto(c, p, g) {
  const yo = g || p;
  const titulo = g ? `${p.title} · ${g.title}` : p.title;
  const fotos = yo.images.filter((m) => !m.video);
  const webms = yo.images.filter((m) => m.video);
  const yts = (yo.links || []).filter(c.youtube);
  const videos = [...webms.map((m, i) => c.pieza(m, `${titulo}, vídeo ${i + 1}`)), ...yts.map((l) => c.embed(l, titulo))];
  const sig = c.sigDe(p, g);
  const seccion = c.site.lists[p.section].name;
  // el rótulo: de qué es (la sección, o el proyecto de la parte)
  const rotulo = g ? `<a href="${c.link(p.path)}">${c.esc(p.title)}</a> · ${c.esc(seccion)}` : c.esc(seccion);
  // con logo (y sin ser una parte), el logo es el título, abajo, sobre la estrella
  const logo = !g && p.logo;
  const nombre = logo
    ? `<h1 class="a-logo"><img src="${c.src(p.logo.src)}" width="${p.logo.w}" height="${p.logo.h}" alt="${c.esc(p.title)}"></h1>`
    : `<h1 class="a-titulo">${c.esc(yo.title)}${año(yo.year)}</h1>`;
  const texto2 = yo.text2?.length ? yo.text2 : yo.text;

  return `<main class="tira a-tira">
<section class="pantalla a-inicio${logo ? ' con-logo' : ''}${!g && p.groups.length ? ' con-partes' : ''}">
  ${astro(c, yo.cover, { n: 16, clase: 'a-astro' })}
  <div class="a-texto">
    <p class="a-rotulo">${rotulo}${logo && p.year ? ` · ${p.year}` : ''}</p>
${c.parrafos(yo.text)}
  </div>
  ${nombre}
  ${!g && p.groups.length ? estrellitas(c, p, g) : ''}
</section>
${fotos.length ? `<section class="pantalla a-fotos">
${fotos.map((m, i) => `  <figure>${c.pieza(m, `${titulo}, ${i + 1}`, i > 0)}<figcaption>${i + 1}/${fotos.length}</figcaption></figure>`).join('\n')}
</section>` : ''}
${videos.length ? `<section class="pantalla a-videos${videos.length === 1 ? ' solo' : ''}">
${videos.length === 1 && webms.length ? `  ${astro(c, webms[0], { n: 12, clase: 'a-flanco uno' })}
  ${astro(c, webms[0], { n: 12, clase: 'a-flanco dos', y: 0.2 })}
` : ''}${videos.map((x) => `  <div class="a-video">${x}</div>`).join('\n')}
</section>` : ''}
<section class="pantalla a-inicio a-final">
  ${astro(c, yo.cover, { n: 22, clase: 'a-astro' })}
  <div class="a-texto">
    <p class="a-rotulo">${c.esc(yo.title)}${yo.year ? ` · ${yo.year}` : ''}</p>
${c.parrafos(texto2)}
${c.enlaces((yo.links || []).filter((l) => !c.youtube(l)))}
    <a class="chicle a-siguiente" href="${c.link(sig.href)}">siguiente: ${c.esc(sig.title)} →</a>
  </div>
  ${g ? estrellitas(c, p, g) : ''}
  ${lema(c)}
</section>
</main>`;
}

/* ── tattoo: las fotos censuradas, cada una con su estrella; al pasar, sin censura ── */

function tattoo(c) {
  return `<header class="a-cabecera">
  ${astro(c, null, { n: 18, clase: 'a-cabecera-astro', fotos: c.tattoo.slice(0, 8).map((m) => c.mini(m)) })}
  <h1 class="a-gigante">tattoo</h1>
${c.instagram ? `  <p class="a-citas"><a class="chicle" href="${c.esc(c.instagram)}" target="_blank" rel="noopener">pide cita: @${c.esc(c.site.instagram)} ↗</a></p>\n` : ''}  ${lema(c)}
</header>
<main class="a-tatuajes">
${c.tattoo.map((m, i) => `${c.instagram && i % 9 === 4 ? `  <a class="chicle a-pegatina" href="${c.esc(c.instagram)}" target="_blank" rel="noopener">★ pide cita ★<small>@${c.esc(c.site.instagram)} ↗</small></a>\n` : ''}  <a href="${c.src(m.src)}">${censurada(c, m, `tattoo ${i + 1}`, `e${i % 4}`)}</a>`).join('\n')}
</main>`;
}

/* ── about: la foto en la estrella, el nombre con neón ── */

function about(c) {
  const f = c.aboutPhoto;
  return `<main class="a-about">
  ${astro(c, f, { n: 18, clase: 'a-astro', y: 0.25 })}
  <div class="a-about-texto">
    <h1 class="a-gigante">${c.esc(c.site.title)}</h1>
${c.parrafos(c.about.text)}
    <p class="a-contacto">${[
      c.instagram && `<a class="chicle" href="${c.esc(c.instagram)}" target="_blank" rel="noopener">instagram @${c.esc(c.site.instagram)}</a>`,
      c.site.email && `<a class="chicle" href="mailto:${c.esc(c.site.email)}">${c.esc(c.site.email)}</a>`,
    ].filter(Boolean).join(' ')}</p>
    <p class="firma">web: <a href="https://meowrhino.studio" target="_blank" rel="noopener">meowrhino.studio</a></p>
  </div>
  ${lema(c)}
</main>`;
}

/* ── el menú: la barra de chicle arriba; el volver, un botón de chicle abajo ── */

function menu(c, { actual, volver }) {
  return `<nav class="a-menu">
  <a class="a-casa" href="${c.link('')}">${c.estrella('')}<span>${c.esc(c.site.title)}</span></a>
${c.site.menu.map((m) => `  <a href="${c.link(m.href)}"${m.href.split('/')[0] === actual ? ' aria-current="page"' : ''}>${c.esc(m.text)}</a>`).join('\n')}
</nav>
${volver ? `<a class="chicle a-volver" href="${c.link(volver.href)}">← ${c.esc(volver.text)}</a>` : ''}`;
}

export default { obra, dc, proyecto, tattoo, about, menu };
