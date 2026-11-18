/* Los proyectos, como los usan build.mjs y preview.mjs.

     projects/<slug>/project.json       título, año, texto, enlaces, fotos…
     projects/<slug>/img/1.webp …       sus fotos (imgToWeb); un vídeo, N.webm + N.poster.webp (videoToWeb)

   Las dos listas de data/site.json («lists»: obra y direccion-creativa) dicen
   qué proyectos salen, en qué orden y en qué sección (su dirección:
   /obra/sweet-wrecker/). Uno que está en projects/ y no en una lista no sale.

   Como paginas.mjs, no toca el disco (lo usa también el navegador): lo que
   hay en él se lo pasa quien lo llama. Aquí está también cómo se lee un JSON
   (leerJSON) y se comprueba con su esquema de schema/ (validar), copiados de
   almarbra: lo mismo para el build y la vista previa. */

/** Ancho y alto de un .webp, de su cabecera (los primeros 30 bytes, un
    Uint8Array); null si no es un WebP de verdad (un .jpg renombrado,
    por ejemplo). */
export function webpSize(b) {
  const ascii = (at, n) => String.fromCharCode(...b.subarray(at, at + n));
  if (b.length < 30 || ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WEBP') return null;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const u24 = (at) => v.getUint16(at, true) | (v.getUint8(at + 2) << 16);
  const chunk = ascii(12, 4);
  if (chunk === 'VP8X') return { w: 1 + u24(24), h: 1 + u24(27) };
  if (chunk === 'VP8L') {
    const bits = v.getUint32(21, true);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  return { w: v.getUint16(26, true) & 0x3fff, h: v.getUint16(28, true) & 0x3fff };   // VP8
}

/** Lee un JSON y, si está mal, dice dónde (línea y columna). */
export function leerJSON(texto, nombre) {
  try { return JSON.parse(texto); }
  catch (e) {
    let donde = '';
    const lc = /line (\d+) column (\d+)/.exec(e.message);
    const pos = /position (\d+)/.exec(e.message);
    if (lc) donde = ` (línea ${lc[1]}, columna ${lc[2]})`;
    else if (pos) {
      const antes = texto.slice(0, +pos[1]).split('\n');
      donde = ` (línea ${antes.length}, columna ${antes.at(-1).length + 1})`;
    } else {
      // una coma de más ("Unexpected token ']'") no trae posición: se busca la coma
      const coma = /,\s*[\]}]/.exec(texto);
      if (coma) donde = ` (línea ${texto.slice(0, coma.index).split('\n').length}: sobra la coma del final)`;
    }
    const err = new Error(`${nombre} no es un JSON válido${donde}. Suele ser una coma de más `
      + `o de menos, o unas comillas sin cerrar. Detalle: ${e.message}`);
    err.json = true;
    throw err;
  }
}

/** Lo que dice schema/<tipo>.json, comprobado también aquí (copiado de
    oriol, con patternProperties para las notas «_…»): lo que VS Code
    subraya en rojo, el build lo para y la vista previa lo enseña. */
export function validar(dato, esquema, fichero) {
  const TIPO = { string: 'un texto entre comillas', number: 'un número', boolean: 'true o false',
                 array: 'una lista [ … ]', object: 'un bloque { … }', null: 'null' };
  const tipo = v => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  // un $ref lleva a su $defs; lo de al lado (la description) manda
  const def = s => (s.$ref ? { ...esquema.$defs[s.$ref.split('/').pop()], ...s, $ref: undefined } : s);
  const tipoOk = (v, s) => !s.type || [].concat(s.type).includes(tipo(v));
  function mirar(v, s, camino) {
    s = def(s);
    const donde = camino.length ? `"${camino.join(' → ')}"` : 'el fichero';
    const pista = s.description ? ` (${s.description})` : '';
    if (s.anyOf) {
      const opciones = s.anyOf.map(def);
      if (opciones.some(o => !mirar(v, o, camino).length)) return [];
      const suya = opciones.find(o => tipoOk(v, o));
      return suya ? mirar(v, suya, camino) : [`${donde} no vale así${pista}`];
    }
    if (!tipoOk(v, s)) return [`${donde} tiene que ser ${[].concat(s.type).map(t => TIPO[t]).join(' o ')}${pista}`];
    const e = [];
    if (s.enum && !s.enum.includes(v)) e.push(`${donde}: "${v}" no vale; tiene que ser ${s.enum.map(x => `"${x}"`).join(', ')}`);
    if (s.pattern && typeof v === 'string' && !new RegExp(s.pattern).test(v)) e.push(`${donde}: "${v}" no tiene la forma que toca${pista}`);
    if (s.minimum != null && typeof v === 'number' && v < s.minimum) e.push(`${donde} tiene que ser ${s.minimum} o más`);
    if (Array.isArray(v)) {
      if (s.maxItems != null && v.length > s.maxItems) e.push(`${donde}: como mucho ${s.maxItems}`);
      if (s.items) v.forEach((x, i) => e.push(...mirar(x, s.items, [...camino, String(i + 1)])));
    } else if (tipo(v) === 'object') {
      for (const r of s.required || []) if (!(r in v)) e.push(`falta "${r}"${camino.length ? ` en ${donde}` : ''}`);
      for (const [k, x] of Object.entries(v)) {
        const patron = Object.entries(s.patternProperties || {}).find(([p]) => new RegExp(p).test(k));
        if (s.properties?.[k]) e.push(...mirar(x, s.properties[k], [...camino, k]));
        else if (patron) e.push(...mirar(x, patron[1], [...camino, k]));
        else if (typeof s.additionalProperties === 'object') e.push(...mirar(x, s.additionalProperties, [...camino, k]));
        else if (s.additionalProperties === false) {
          const hay = Object.keys(s.properties || {}).filter(p => p !== '$schema' && p !== '_');
          e.push(`"${[...camino, k].join(' → ')}" no es un campo de aquí (¿mal escrito?). Los que hay: ${hay.join(', ')}`);
        }
      }
    }
    return e;
  }
  return mirar(dato, esquema, []).map(m => `${fichero}: ${m}`);
}

/** El slug de una entrada de una lista: "roma" o { "project": "roma", "visible": false }. */
export const slugOf = (entry) => (typeof entry === 'string' ? entry : entry?.project);

/** Lo que puede haber detrás de un número: la foto, o el vídeo con su fotograma
    (la vista previa los pide antes de leer los proyectos). */
export const mediaSrcs = (folder, data) => [...new Set([data.logo, data.cover, ...(data.photos || []), ...(data.groups || []).flatMap((g) => [g?.cover, ...(g?.photos || [])])]
  .filter((n) => typeof n === 'string')
  .flatMap((n) => [`${folder}/img/${n}.webp`, `${folder}/img/${n}.webm`, `${folder}/img/${n}.poster.webp`]))];

/** Las fotos de tattoo/ (1.webp, 2.webp…), por su número; sin JSON. */
export function loadTattoo(numbers, size) {
  const errors = [];
  const images = numbers.map((n) => {
    const src = `tattoo/${n}.webp`;
    const wh = size(src);
    if (!wh) { errors.push(`${src} no es un WebP de verdad (pásala por imgToWeb)`); return null; }
    return { name: String(n), src, ...wh };
  }).filter(Boolean);
  if (!images.length) errors.push('tattoo/: no hay ninguna foto (1.webp, 2.webp…)');
  return { images, errors };
}

/**
 * Lee los proyectos en el orden de site.lists. Lo del disco, de quien llama:
 *
 *   json(at)     el JSON de `at` ya leído, o undefined si no está
 *   size(src)    el ancho y alto de una foto (webpSize), null si no es un
 *                WebP, o undefined si no está (un .webm: {} si está)
 *   folders      las carpetas que hay en projects/, para avisar de las que no
 *                salen; o null si no se sabe (la vista previa)
 */
export function loadProjects(site, { json, size, folders = null }) {
  const errors = [];
  const warnings = [];
  const projects = [];
  for (const [section, { projects: entries = [] } = {}] of Object.entries(site.lists || {})) {
    for (const entry of entries) {
      const slug = slugOf(entry);
      if (typeof slug !== 'string') continue;   // lo dice el esquema
      if (projects.some((p) => p.slug === slug)) { errors.push(`«${slug}» está dos veces en las listas de data/site.json`); continue; }
      const folder = `projects/${slug}`;
      const at = `${folder}/project.json`;
      const data = json(at);
      if (data === undefined) {
        errors.push(`la lista «${section}» de data/site.json nombra «${slug}», y no hay ${at} (la carpeta se llama igual que lo que pone en la lista)`);
        continue;
      }

      /* Una foto es img/N.webp; un vídeo, img/N.webm con su fotograma img/N.poster.webp. */
      const media = (n, campo) => {
        const src = `${folder}/img/${n}.webp`;
        const wh = size(src);
        if (wh === undefined) {
          const video = `${folder}/img/${n}.webm`;
          if (size(video) === undefined) { errors.push(`${folder}: en «${campo}», no encuentro img/${n}.webp (ni un vídeo img/${n}.webm)`); return null; }
          const poster = `${folder}/img/${n}.poster.webp`;
          const pwh = size(poster);
          if (pwh === undefined) { errors.push(`${folder}: img/${n}.webm no tiene su fotograma img/${n}.poster.webp al lado (los dos los saca videoToWeb)`); return null; }
          if (!pwh) { errors.push(`${folder}: img/${n}.poster.webp no es un WebP de verdad`); return null; }
          return { name: n, src: poster, video, ...pwh };
        }
        if (!wh) { errors.push(`${folder}: img/${n}.webp no es un WebP de verdad (pásala por imgToWeb)`); return null; }
        if (size(`${folder}/img/${n}.webm`) !== undefined) { errors.push(`${folder}: hay img/${n}.webp y img/${n}.webm; si es un vídeo, su fotograma se llama img/${n}.poster.webp`); return null; }
        return { name: n, src, ...wh };
      };
      const lista = (l, campo) => (l || []).map((n) => media(n, campo)).filter(Boolean);
      /* una portada tiene que ser una foto (o el fotograma de un vídeo) */
      const una = (n, campo) => (n ? media(n, campo) : null);

      const images = lista(data.photos, 'photos');
      const groups = (data.groups || []).map((g) => {
        const gi = lista(g.photos, `groups → ${g.title} → photos`);
        if (!gi.length) errors.push(`${folder}: el grupo «${g.title}» no tiene fotos`);
        return { ...g, images: gi, cover: una(g.cover, `groups → ${g.title} → cover`) || gi.find((i) => !i.video) || gi[0] };
      });
      const slugs = groups.map((g) => g.slug);
      for (const s of slugs.filter((s, i) => slugs.indexOf(s) !== i)) errors.push(`${folder}: hay dos grupos con el slug «${s}»`);
      const todas = [...images, ...groups.flatMap((g) => g.images)];
      if (!todas.length) errors.push(`${folder}: no tiene fotos`);

      projects.push({
        ...data,
        slug,
        section,
        folder,
        path: `${section}/${slug}/`,
        hidden: entry.visible === false,
        images,
        groups,
        logo: una(data.logo, 'logo'),
        cover: una(data.cover, 'cover') || todas.find((i) => !i.video) || todas[0],
      });
    }
  }
  for (const folder of folders || []) {
    if (!projects.some((p) => p.folder === folder)) warnings.push(`${folder} no está en ninguna lista de data/site.json: no sale en la web`);
  }
  for (const section of Object.keys(site.lists || {})) {
    if (!projects.some((p) => p.section === section && !p.hidden)) errors.push(`data/site.json: la lista «${section}» no tiene ningún proyecto a la vista`);
  }
  return { projects, errors, warnings };
}
