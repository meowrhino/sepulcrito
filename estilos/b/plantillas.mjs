/* El estilo b · cam: la web como una de cams. Lo más pocho y maximalista.

   - arriba, la barra de «● en directo» (latiendo), el volver como un botón y el lema;
     abajo, el menú en pestañas rectas (la de la sección, encendida en neón);
   - las listas (obra, dirección creativa) son parrillas de cams: cada portada en mosaico,
     que se destapa al pasar; delante, la estrella con todas las portadas pasando;
   - una obra o un proyecto es una sala: la estrella censurada con neón como la ventana
     de la cam, el título enorme encima, el logo abajo sobre la estrella y el texto como
     un chat (`sepulcrito: …`, un mensaje por párrafo o línea de `text`); luego las fotos,
     los vídeos en reproductores de cam con «rec» y el final («fin del directo»: el texto
     corriendo, los enlaces, la siguiente sala);
   - Tattoox es «tattoox tv»: sus partes, canales;
   - tattoo, el muro de cams: todas censuradas, se destapan al pasar, una cam al azar y
     una privada al darle;
   - about, el perfil.

   Su CSS, estilo.css; su JS (el rec, la cam al azar, la privada, destapar en el móvil),
   estilo.js. La estrella la pinta js/astro.js. */

const ANCHO = (m) => `aspect-ratio: ${m.w} / ${m.h}`;
const plural = (n, uno, varios = `${uno}s`) => `${n} ${n === 1 ? uno : varios}`;

/** La estrella (o un rectángulo, `rect`) con la foto en mosaico que pinta js/astro.js.
    Sin JS, la foto tal cual en su forma (el <img> de dentro). */
function astro(ctx, fotos, { cls = '', n = 22, rect = false, cada } = {}) {
  const srcs = fotos.map((m) => ctx.mini(m));
  return `<div class="astro${rect ? ' rect' : ''}${cls ? ` ${cls}` : ''}"${rect ? ' data-forma="rect"' : ''} data-n="${n}" data-src="${srcs[0]}"${srcs.length > 1 ? ` data-fotos="${srcs.join(' ')}"` : ''}${cada ? ` data-cada="${cada}"` : ''} aria-hidden="true"><img src="${srcs[0]}" alt="" loading="lazy"></div>`;
}

const vivo = (texto = 'en directo', cls = '') => `<span class="vivo${cls ? ` ${cls}` : ''}">${texto}</span>`;

/** Lo que trae una sala: «12 fotos · 2 vídeos». */
function cuenta(ctx, yo) {
  const f = yo.images.filter((m) => !m.video).length;
  const v = yo.images.filter((m) => m.video).length + (yo.links || []).filter(ctx.youtube).length;
  return [f && plural(f, 'foto'), v && plural(v, 'vídeo')].filter(Boolean).join(' · ');
}

/** Una cam de una parrilla: la portada en mosaico, «live», el nombre y un dato. */
const cam = (ctx, { href, foto, nombre, dato, n = 18, cls = '' }) => `<a class="cam${cls ? ` ${cls}` : ''}" href="${href}">
    ${astro(ctx, [foto], { rect: true, n })}
    ${vivo('live')}
    <span class="cam-nombre">${ctx.esc(nombre)}</span>${dato ? `\n    <span class="cam-dato">${ctx.esc(dato)}</span>` : ''}
  </a>`;

/** Un texto corriendo (dos copias, la segunda escondida a los lectores de pantalla). */
const ticker = (html, cls = '', segundos = 30) => `<div class="ticker${cls ? ` ${cls}` : ''}" style="--dur: ${segundos}s"><div class="ticker-pista"><span>${html}</span><span aria-hidden="true">${html}</span></div></div>`;

/* ── las listas: obra y dirección creativa ── */

function lista(ctx, seccion) {
  const { esc, link } = ctx;
  const { name, projects } = ctx.lista(seccion);
  const años = projects.map((p) => p.year).filter(Boolean);
  /* la última cam lleva a la sección siguiente */
  const dc = ctx.lista('direccion-creativa').projects;
  const mas = seccion === 'obra'
    ? { href: link('direccion-creativa/'), foto: dc[0].cover, nombre: `${ctx.site.lists['direccion-creativa'].name} ▶`, dato: 'más cams', cls: 'mas' }
    : { href: link('tattoo/'), foto: ctx.tattoo[0], nombre: 'tattoo ▶', dato: 'más cams', cls: 'mas' };
  const dato = [plural(projects.length, 'sala'), años.length && `${Math.min(...años)}–${Math.max(...años)}`].filter(Boolean).join(' · ');
  return `<main class="parrilla">
<header class="portada">
  <div class="portada-texto">
    ${vivo(`${projects.length} cams en directo`, 'grande')}
    <h1>${esc(name).replace(' ', '<br>')}</h1>
    <p class="portada-dato">${esc(dato)}</p>
    <a class="boton grande" href="#cams">ver las ${projects.length} cams ▼</a>
  </div>
  <div class="portada-cam">
    ${astro(ctx, projects.map((p) => p.cover), { cls: 'neon', n: 20, cada: 1100 })}
    ${vivo('live', 'flota')}
  </div>
</header>
${ticker(projects.map((p) => `<b>●</b> ${esc(p.title)}`).join(' '), '', projects.length * 5)}
<section class="cams" id="cams" aria-label="${esc(name)}">
${projects.map((p) => `  ${cam(ctx, {
    href: link(p.path), foto: p.cover, nombre: p.title,
    dato: p.groups.length ? `tv · ${plural(p.groups.length, 'canal', 'canales')}` : (p.year || cuenta(ctx, p)),
  })}`).join('\n')}
  ${cam(ctx, mas)}
</section>
</main>`;
}

/* ── una obra, un proyecto o una parte: la sala ── */

function proyecto(ctx, p, g) {
  const { esc, link, pieza, embed, youtube } = ctx;
  const yo = g || p;
  const titulo = g ? `${p.title} · ${g.title}` : p.title;
  const tv = !g && p.groups.length > 0;
  const fotos = yo.images.filter((m) => !m.video);
  const webms = yo.images.filter((m) => m.video);
  const yts = (yo.links || []).filter(youtube);
  const otros = (yo.links || []).filter((l) => !youtube(l));
  const sig = ctx.sigDe(p, g);
  const sigFoto = (() => {
    for (const q of ctx.projects) {
      if (q.path === sig.href) return q.cover;
      for (const x of q.groups) if (`${q.path}${x.slug}/` === sig.href) return x.cover;
    }
    return null;
  })();
  const partePath = (x) => link(`${p.path}${x.slug}/`);
  const total = webms.length + yts.length;
  const botones = [
    tv && `<a class="boton" href="#cams">canales ▶</a>`,
    fotos.length && `<a class="boton" href="#fotos">fotos ▶</a>`,
    total && `<a class="boton" href="#videos">${total > 1 ? 'vídeos' : 'vídeo'} ▶</a>`,
    `<a class="boton" href="${link(sig.href)}">siguiente ▶</a>`,
  ].filter(Boolean).join('');
  const lineas = yo.text || [];
  const final = yo.text2?.length ? yo.text2 : yo.text || [];

  /* el chat: un mensaje de sepulcrito por párrafo o línea; en tattoox tv, los canales */
  const chat = tv ? `<aside class="chat" aria-label="canales">
    <p class="chat-cabeza">${esc(p.title)} tv · ${plural(p.groups.length, 'canal', 'canales')}</p>
    <ol class="canales">
${p.groups.map((x, i) => `      <li><a href="${partePath(x)}"><span>${String(i + 1).padStart(2, '0')}</span> ${esc(x.title)}</a></li>`).join('\n')}
    </ol>
    <div class="chat-botones">${botones}</div>
  </aside>` : `<aside class="chat" aria-label="el texto">
    <p class="chat-cabeza">chat en directo</p>
    <div class="chat-mensajes">
      <p class="sistema">★ entras en la sala: ${esc(titulo.toLowerCase())}</p>
${lineas.map((l, i) => `      <p style="--i: ${i}"><b>${esc(ctx.site.title.toLowerCase())}:</b> ${esc(l)}</p>`).join('\n')}
    </div>
    <div class="chat-botones">${botones}</div>
  </aside>`;

  const logo = p.logo ? `<img class="sala-logo" src="${ctx.src(p.logo.src)}" width="${p.logo.w}" height="${p.logo.h}" alt="${esc(p.title)}">` : '';

  return `<main class="sala-pagina${tv ? ' tv' : ''}">
<section class="sala" id="directo">
  <div class="sala-cam${logo ? ' con-logo' : ''}">
    ${astro(ctx, [yo.cover], { cls: 'neon', n: 22 })}
    ${vivo('en directo', 'flota')}
    ${logo}
  </div>
  <h1 class="sala-titulo">${g ? `<small>${esc(p.title)}</small>` : ''}${esc(tv ? `${p.title} tv` : yo.title)}${yo.year ? ` <span>${yo.year}</span>` : ''}</h1>
  ${chat}
</section>
${tv ? `<section class="bloque" id="cams">
  <h2 class="pestana">${vivo('live')} ${plural(p.groups.length, 'canal', 'canales')}</h2>
  <div class="cams">
${p.groups.map((x) => `  ${cam(ctx, { href: partePath(x), foto: x.cover, nombre: x.title, dato: cuenta(ctx, x) })}`).join('\n')}
  </div>
</section>` : ''}
${fotos.length ? `<section class="bloque galeria" id="fotos">
  <h2 class="pestana">${vivo('fotos')} ${plural(fotos.length, 'foto')}</h2>
  <div class="fotos${fotos.length <= 3 ? ' pocas' : ''}">
${fotos.map((m, i) => `    <figure>${pieza(m, `${titulo}, ${i + 1}`, i > 1)}<figcaption>● ${String(i + 1).padStart(2, '0')}/${String(fotos.length).padStart(2, '0')}</figcaption></figure>`).join('\n')}
  </div>
</section>` : ''}
${total ? `<section class="bloque emision" id="videos">
  <h2 class="pestana">${vivo('rec')} ${plural(total, 'vídeo')}</h2>
  <div class="players${total === 1 ? ' solo' : ''}">
${[...webms.map((m, i) => ['vertical', pieza(m, `${titulo}, vídeo ${i + 1}`), m]), ...yts.map((l) => ['ancho', embed(l, titulo)])].map(([forma, x, m], i) => `    <div class="player ${m && m.w > m.h ? 'ancho' : forma}"${m ? ` style="${ANCHO(m)}"` : ''}>
      ${x}
      ${vivo('live')}<span class="rec">● rec <time>00:00</time></span>
      <span class="player-pie">${esc(titulo)} · ${i + 1}/${total}</span>
    </div>`).join('\n')}
  </div>
</section>` : ''}
<section class="fin">
  <p class="pestana">${vivo('fin del directo')} ${esc(titulo)}</p>
  ${final.length ? ticker(final.map((l) => `<b>★</b> ${esc(l)}`).join(' '), 'fin-texto', Math.max(25, Math.round(final.join(' ').length / 9))) : ''}
  <div class="fin-cosas">
    <div class="fin-cam">
      ${astro(ctx, (tv ? p.groups.map((x) => x.cover) : (fotos.length ? fotos : [yo.cover])).slice(0, 14), { cls: 'neon', n: 16, cada: 900 })}
      ${logo}
    </div>
    <div class="fin-botones">
${otros.length ? otros.map((l, i) => `      <a class="boton" href="${esc(l)}" target="_blank" rel="noopener">ver en ${esc(new URL(l).hostname.replace(/^www\./, '').replace(/\.com$/, ''))}${otros.length > 1 ? ` ${i + 1}` : ''} ↗</a>`).join('\n') : ''}
      ${sigFoto ? cam(ctx, { href: link(sig.href), foto: sigFoto, nombre: `${sig.title} ▶`, dato: 'siguiente sala', n: 14, cls: 'siguiente-sala' }) : `<a class="boton" href="${link(sig.href)}">siguiente: ${esc(sig.title)} ▶</a>`}
    </div>
  </div>
${g ? `  <nav class="mas-cams" aria-label="más canales de ${esc(p.title)}">
    <p class="pestana">${vivo('live')} más canales de ${esc(p.title)} tv</p>
    <div class="mas-cams-fila">
${p.groups.map((x) => `      <a href="${partePath(x)}"${x === g ? ' aria-current="page"' : ''}>${ctx.miniatura(x.cover)}<span>${esc(x.title)}</span></a>`).join('\n')}
    </div>
  </nav>` : ''}
</section>
</main>`;
}

/* ── tattoo: el muro de cams ── */

function tattoo(ctx) {
  const { esc, tattoo: fotos, instagram, site } = ctx;
  const cita = instagram ? `<a class="boton grande" href="${esc(instagram)}" target="_blank" rel="noopener">pedir cita ▶ @${esc(site.instagram)}</a>` : '';
  return `<main class="muro-pagina">
<header class="portada">
  <div class="portada-texto">
    ${vivo(`${fotos.length} cams en directo`, 'grande')}
    <h1>tattoo</h1>
    ${instagram ? `<p class="portada-dato">citas por instagram</p>\n    ${cita}` : ''}
  </div>
  <div class="portada-cam">
    ${astro(ctx, fotos, { cls: 'neon', n: 18, cada: 350 })}
    ${vivo('live', 'flota')}
  </div>
</header>
${instagram ? ticker(`<b>★</b> citas por instagram <b>★</b> @${esc(site.instagram)} `.repeat(4), 'ticker-tattoo', 26) : ''}
<div class="mando">
  <button class="boton" type="button" data-azar hidden>▶ cam al azar</button>
  <p>${plural(fotos.length, 'cam')} · se destapan al pasar</p>
</div>
<section class="muro" aria-label="tattoo">
${fotos.map((m, i) => `  <a class="cam" href="${ctx.src(m.src)}" style="${ANCHO(m)}" data-privada>
    ${astro(ctx, [m], { rect: true, n: 12 })}
    ${vivo('live')}
    <span class="cam-dato">#${String(i + 1).padStart(2, '0')}</span>
    <span class="oculto">tattoo ${i + 1}</span>
  </a>`).join('\n')}
</section>
</main>`;
}

/* ── about: el perfil ── */

function about(ctx) {
  const { esc, site, aboutPhoto, instagram } = ctx;
  return `<main class="perfil">
<div class="perfil-cam">
  ${astro(ctx, [aboutPhoto], { cls: 'neon', n: 24 })}
  ${vivo('en directo', 'flota')}
</div>
<div class="perfil-info">
  <h1>${esc(site.title)}</h1>
  <p class="perfil-lema">${esc(site.lema)}</p>
  <h2 class="pestana">${vivo('perfil')} sobre ${esc(site.title.toLowerCase())}</h2>
  <div class="perfil-texto">
${ctx.parrafos(ctx.about.text, 'perfil-p')}
  </div>
  <p class="perfil-botones">${[
    instagram && `<a class="boton grande" href="${esc(instagram)}" target="_blank" rel="noopener">seguir ★ @${esc(site.instagram)}</a>`,
    site.email && `<a class="boton" href="mailto:${esc(site.email)}">${esc(site.email)}</a>`,
  ].filter(Boolean).join('\n')}</p>
  <p class="firma">web: <a href="https://meowrhino.studio" target="_blank" rel="noopener">meowrhino.studio</a></p>
</div>
</main>`;
}

/* ── la barra de arriba y las pestañas de abajo ── */

function menu(ctx, { path, actual, volver }) {
  const { esc, link, site } = ctx;
  let dato = '';
  for (const p of ctx.projects) {
    if (p.path === path) dato = `${p.title}${p.year ? ` · ${p.year}` : ''}`;
    for (const g of p.groups) if (`${p.path}${g.slug}/` === path) dato = `${p.title} tv · ${g.title}`;
  }
  if (path === 'tattoo/') dato = plural(ctx.tattoo.length, 'tattoo');
  if (path === 'about/') dato = 'perfil';
  if (site.lists[actual] && path === `${actual}/`) dato = site.lists[actual].name;
  return `<header class="barra">
  ${vivo()}
  ${volver ? `<a class="boton volver-b" href="${link(volver.href)}">◀ <span>${esc(volver.text)}</span></a>` : ''}
  <span class="barra-dato">${esc(dato)}</span>
  <a class="barra-lema" href="${link('')}">${esc(site.lema)}</a>
</header>
<nav class="pestanas" aria-label="menú">
  <a class="pestanas-casa" href="${link('')}" aria-label="home">${ctx.estrella('')}</a>
${site.menu.map((m) => `  <a href="${link(m.href)}"${m.href.split('/')[0] === actual ? ' aria-current="page"' : ''}>${esc(m.text)}</a>`).join('\n')}
</nav>`;
}

export default {
  obra: (ctx) => lista(ctx, 'obra'),
  dc: (ctx) => lista(ctx, 'direccion-creativa'),
  proyecto,
  tattoo,
  about,
  menu,
};
