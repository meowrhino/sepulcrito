# estilos: las versiones de prueba del diseño

Tres caminos para el diseño, enteros, para elegir con la clienta (manu, 2026-11-19). Salen
de las maquetas (`maquetas/a.html`, `b.html`, `c.html` y sus PNG):

- **a · censura**: la estrella como el mosaico de una web porno, en color y con neón; títulos
  enormes; «Content Destroyer.» corriendo; botones de chicle (rectos).
- **b · cam**: la web como una de cams: «● en directo», parrillas de cams en mosaico, el texto
  como un chat, el vídeo en un reproductor con «rec». Lo más pocho.
- **c · mínima**: lo de ahora, ordenado: una estrella censurada y el título enorme; lo demás,
  letra pequeña.

El build publica cada carpeta de aquí con un `plantillas.mjs` en `/<carpeta>/`
(`meowrhino.github.io/sepulcrito/a/`), sin indexar, con la home de siempre. La web de la raíz
no cambia. La vista previa: `index.html?p=/a/obra/`.

## Qué hay en cada carpeta

| archivo | qué es |
|---|---|
| `plantillas.mjs` | `export default { obra, dc, proyecto, tattoo, about, menu }`: cada una, una función que devuelve el HTML del cuerpo de esa página (lo que va dentro de `<body>`). La que falte sale como en la web de siempre |
| `estilo.css` | su CSS. Se carga **después** de `css/style.css` (las fuentes, las variables de `data/config.json`, el menú de siempre y la transición) |
| `estilo.js` | su JS, con `defer`. También se carga `js/astro.js` (la estrella) |

Las funciones (todas reciben `ctx`):

- `obra(ctx)`, `dc(ctx)`: la lista de la sección. `ctx.lista('obra')` → `{ name, projects }`.
- `proyecto(ctx, p, g)`: una obra o un proyecto (`p`) o una parte suya (`g`, como Tattoox →
  Riverland). Las **cuatro partes** (inicio con la estrella y `text`, fotos, vídeos, final con
  `text2` o `text`) se mantienen; cómo se ven, cada estilo.
- `tattoo(ctx)`, `about(ctx)`.
- `menu(ctx, { path, actual, volver })`: opcional, el menú (y lo que vaya fijo en todas las
  páginas). Si no está, el de siempre.

`ctx`: `site`, `config`, `about`, `aboutPhoto`, `tattoo` (las fotos), `projects`, `instagram`,
`esc(texto)`, `link(path)` (un enlace dentro de la versión: `link('obra/')`), `src(ruta)` (un
archivo desde la raíz: fotos, vídeos), `mini(foto)` (su miniatura de 900 px), `pieza(foto,
alt, lazy, clase)` (`<img>` o `<video>` con su ancho y alto), `miniatura(foto, alt)`,
`parrafos(text)`, `enlaces(links)`, `embed(link, título)` (YouTube, su fotograma y el
reproductor tras el clic, con `js/site.js`), `youtube(link)`, `estrella(clase)` (el SVG),
`siguiente(p)`, `sigDe(p, g)` (`{ href, title }` del «siguiente»), `lista(sección)`.

Un proyecto `p`: `title`, `year`, `text`, `text2`, `links`, `images` (cada una `{ name, src, w,
h }`, y `video` si es un vídeo: `src` es entonces su fotograma), `groups` (`slug`, `title`,
`text`, `text2`, `links`, `images`, `cover`), `logo`, `cover`, `path`, `section`.

**La estrella** (`js/astro.js`): `<div class="astro" data-src="…">` la pinta con la foto en
color y en mosaico (`data-n`: bloques a lo ancho, 22 por defecto), y al pasar se despixela;
`data-fotos="a b c"` va cambiando de foto; `data-forma="rect"`, sin forma de estrella. Su
tamaño lo da el CSS (`aspect-ratio: 522.13 / 496.575`). Mejor con `mini(foto)`.

## Reglas

- Cada estilo toca **solo su carpeta**. Lo común (`build/`, `css/style.css`, `js/`) no.
- El estilo de la casa (JAMstack, `patrones.md` §6e), con lo que pidió manu para esta web:
  **nada de `border-radius` ni degradados** (huelen a IA); el **neón rosa sí** (está en las
  referencias de la clienta): es lo único que brilla. Letra de los textos pequeña y en
  minúscula; los títulos, grandes y con la letra de su sección (`--titular`).
- Los colores y las letras salen de las variables (`--fondo`, `--tinta`, `--activa`, `--astro`,
  `--titular`, `--letra`), que vienen de `data/config.json`.
- Que se lea sin JS (el contenido, en el HTML) y que funcione en el móvil y en Safari.
