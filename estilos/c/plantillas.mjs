/* El estilo c · mínima: lo de ahora, ordenado. Una estrella censurada (la foto en color y en
   mosaico, con neón; al pasar se despixela: js/astro.js) y el título enorme con la letra de su
   sección; lo demás, letra pequeña en minúscula. El único gesto raro es la estrella.

   Las páginas:
     obra/                 la estrella cambiando entre las portadas, «obra» enorme; las obras en
                           una rejilla ordenada
     direccion-creativa/   igual arriba; los proyectos, una lista de nombres grandes que
                           enseñan su estrella al pasar
     un proyecto           de lado (en el móvil, hacia abajo) y en cuatro partes:
                           1. inicio: el texto, la estrella con el logo encima, el título enorme
                           2. las fotos en fila (en Tattoox, antes, sus partes como la lista
                              de dirección creativa)
                           3. los vídeos: cada .webm en medio de su pantalla, con su fotograma
                              en mosaico de fondo; los de YouTube, en medio
                           4. el final: el segundo texto, los enlaces y el siguiente, enorme
     tattoo/               la estrella con los tatuajes, las citas y las fotos como una hoja de
                           flash numerada
     about/                la foto en la estrella, el nombre enorme y el texto */

const largo = (t) => [...String(t)].length;

/** La estrella: un hueco con la foto (o las fotos, que va cambiando) en mosaico. Sin JS, la
    primera foto con la forma de la estrella (o tal cual, si es un rectángulo). */
function astro(ctx, fotos, { n = 22, cls = '', rect = false, alt = '' } = {}) {
  const srcs = fotos.map((m) => ctx.mini(m));
  const datos = srcs.length > 1 ? `data-fotos="${srcs.join(' ')}"` : `data-src="${srcs[0]}"`;
  return `<div class="astro${cls ? ` ${cls}` : ''}" ${datos} data-n="${n}"${rect ? ' data-forma="rect"' : ''}${alt ? ` role="img" aria-label="${ctx.esc(alt)}"` : ' aria-hidden="true"'}><noscript><img class="sin-js${rect ? ' rect' : ''}" src="${srcs[0]}" alt=""></noscript></div>`;
}

/** El título enorme: --n (las letras) le da el tamaño para que quepa en una línea. */
const titulo = (ctx, texto, tag = 'h1', extra = '') => `<${tag} class="c-titulo" style="--n:${largo(texto)}">${ctx.esc(texto)}${extra}</${tag}>`;

/** La cabecera de una sección: la estrella cambiando entre sus fotos y el título enorme. */
const cabecera = (ctx, nombre, fotos, extra = '') => `<header class="c-cab">
  ${astro(ctx, fotos, { n: 16, cls: 'neon' })}
  ${titulo(ctx, nombre)}
${extra}</header>`;

/** Una lista de nombres grandes; al pasar por uno, su estrella (sin pasar, la del primero). */
const nombres = (ctx, items, cls = '') => `<ol class="c-nombres${cls ? ` ${cls}` : ''}">
${items.map(({ href, title, cover, actual }) => `  <li><a href="${href}"${actual ? ' aria-current="page"' : ''}><span>${ctx.esc(title)}</span>${astro(ctx, [cover], { cls: 'neon' })}</a></li>`).join('\n')}
</ol>`;

const volver = (ctx, href, texto) => `<a class="flecha" href="${ctx.link(href)}">volver a ${ctx.esc(texto)}</a>`;

export default {
  menu(ctx, { path, actual }) {
    return `<nav class="menu">
  <a class="menu-casa" href="${ctx.link('')}" aria-label="home">${ctx.estrella('')}</a>
${ctx.site.menu.map((m) => `  <a href="${ctx.link(m.href)}"${m.href.split('/')[0] === actual ? ' aria-current="page"' : ''}>${ctx.esc(m.text)}</a>`).join('\n')}
</nav>`;
  },

  obra(ctx) {
    const { name, projects } = ctx.lista('obra');
    return `${cabecera(ctx, name, projects.map((p) => p.cover))}
<main class="c-obras">
${projects.map((p, i) => `  <a class="c-ficha" href="${ctx.link(p.path)}">
    ${ctx.miniatura(p.cover, p.title)}
    <span class="c-pie"><span>${String(i + 1).padStart(2, '0')}</span> ${ctx.esc(p.title)}${p.year ? ` <span>${p.year}</span>` : ''}</span>
  </a>`).join('\n')}
</main>`;
  },

  dc(ctx) {
    const { name, projects } = ctx.lista('direccion-creativa');
    return `${cabecera(ctx, name, projects.map((p) => p.cover))}
<main class="c-lista">
${nombres(ctx, projects.map((p) => ({ href: ctx.link(p.path), title: p.title, cover: p.cover })))}
</main>`;
  },

  proyecto(ctx, p, g) {
    const yo = g || p;
    const nombre = g ? `${p.title} · ${g.title}` : p.title;
    const fotos = yo.images.filter((m) => !m.video);
    const webms = yo.images.filter((m) => m.video);
    const yts = (yo.links || []).filter(ctx.youtube);
    const sig = ctx.sigDe(p, g);
    const vuelta = g ? volver(ctx, p.path, p.title) : volver(ctx, `${p.section}/`, ctx.site.lists[p.section].name);
    const donde = g ? `<p class="c-donde">${ctx.esc(p.title)} · ${p.groups.indexOf(g) + 1} de ${p.groups.length}</p>` : '';
    const marca = `<div class="c-marca">
    ${astro(ctx, [yo.cover], { cls: 'neon', alt: nombre })}
    ${p.logo ? `<img class="c-logo" src="${ctx.src(p.logo.src)}" width="${p.logo.w}" height="${p.logo.h}" alt="${ctx.esc(p.title)}">` : ''}
  </div>`;
    const año = yo.year ? `<small>${yo.year}</small>` : '';
    const texto2 = yo.text2?.length ? yo.text2 : yo.text;

    return `<main class="tira c-tira">
<section class="pantalla c-inicio">
  <div class="c-texto">
    ${donde}
${ctx.parrafos(yo.text)}
    <p class="c-vuelta">${vuelta}</p>
  </div>
  ${marca}
  ${titulo(ctx, yo.title, 'h1', año)}
</section>
${!g && p.groups.length ? `<section class="pantalla c-partes">
  <p class="c-rotulo">${ctx.esc(p.title)} · ${p.groups.length} partes</p>
  ${nombres(ctx, p.groups.map((x) => ({ href: ctx.link(`${p.path}${x.slug}/`), title: x.title, cover: x.cover })), p.groups.length > 6 ? 'dos' : '')}
</section>` : ''}
${fotos.length ? `<section class="pantalla c-fotos">
${fotos.map((m, i) => `  <figure>${ctx.pieza(m, `${nombre}, ${i + 1}`, i > 1)}<figcaption>${i + 1} / ${fotos.length}</figcaption></figure>`).join('\n')}
</section>` : ''}
${webms.map((m, i) => `<section class="pantalla c-video">
  ${astro(ctx, [m], { n: 18, cls: 'c-fondo', rect: true })}
  ${ctx.pieza(m, `${nombre}, vídeo ${i + 1}`)}
  <p class="c-rotulo">${ctx.esc(nombre)}${webms.length > 1 ? ` · vídeo ${i + 1} de ${webms.length}` : ''}</p>
</section>`).join('\n')}
${yts.map((l) => `<section class="pantalla c-yt">
  ${ctx.embed(l, nombre)}
</section>`).join('\n')}
<section class="pantalla c-inicio c-final">
  <div class="c-texto">
    <p class="c-nombre">${ctx.esc(nombre)}${yo.year ? ` · ${yo.year}` : ''}</p>
${ctx.parrafos(texto2)}
${ctx.enlaces((yo.links || []).filter((l) => !ctx.youtube(l)))}
    <p class="c-vuelta">${vuelta}</p>
  </div>
  ${marca}
  <a class="c-siguiente" href="${ctx.link(sig.href)}"><span>siguiente</span>${titulo(ctx, sig.title, 'span')}</a>
</section>
</main>`;
  },

  tattoo(ctx) {
    const ig = ctx.instagram;
    return `${cabecera(ctx, 'tattoo', ctx.tattoo.slice(0, 12), ig ? `  <p class="c-citas"><span>citas abiertas</span> por instagram: <a href="${ctx.esc(ig)}" target="_blank" rel="noopener">@${ctx.esc(ctx.site.instagram)}</a></p>\n` : '')}
<main class="c-flash">
${ctx.tattoo.map((m, i) => `  <a href="${ctx.src(m.src)}">${ctx.miniatura(m, `tattoo ${i + 1}`)}<span>nº ${String(i + 1).padStart(2, '0')}</span></a>`).join('\n')}
</main>`;
  },

  about(ctx) {
    const { site, about, aboutPhoto: foto, instagram: ig } = ctx;
    return `<main class="c-sobre">
  ${astro(ctx, [foto], { cls: 'neon', n: 18, alt: site.title })}
  <div class="c-texto">
    <p class="c-lema">${ctx.esc(site.lema)}</p>
${ctx.parrafos(about.text)}
    <p class="c-contacto">${[
      ig && `<a href="${ctx.esc(ig)}" target="_blank" rel="noopener">instagram @${ctx.esc(site.instagram)}</a>`,
      site.email && `<a href="mailto:${ctx.esc(site.email)}">${ctx.esc(site.email)}</a>`,
    ].filter(Boolean).join('<br>')}</p>
    <p class="c-firma">web: <a href="https://meowrhino.studio" target="_blank" rel="noopener">meowrhino.studio</a></p>
  </div>
  ${titulo(ctx, site.title)}
</main>`;
  },
};
