# sepulcrito

Web de Sepulcrito: [meowrhino.github.io/sepulcrito](https://meowrhino.github.io/sepulcrito/).
Lo que edita la clienta, en [GUIA.md](GUIA.md).

```
npm ci
npm run dev        # build a dist/ y la sirve en localhost:8765
```

La vista previa, sin build: `index.html` con Live Server (Go Live) → `index.html?p=/obra/sweet-wrecker/`.

| | |
|---|---|
| `data/site.json` | título, descripción, dominio (`url`), lema, instagram, email, `lists` (obra y dirección creativa: qué proyectos y en qué orden) y `menu` |
| `data/about.json` | `photo` y `text` del about |
| `data/config.json` | los colores y las letras de cada sección (obra, direccion-creativa, tattoo, about); el build los pone en un `<style>` de cada página como las variables de `css/style.css` |
| `projects/<slug>/project.json` + `img/N.webp` | cada obra o proyecto (imgToWeb); un vídeo, `img/N.webm` + `img/N.poster.webp` (videoToWeb). `groups`: un proyecto por partes, cada una con su página (Tattoox) |
| `tattoo/N.webp`, `about/1.webp` | las fotos de tattoo (sin JSON, por número) y la del about |
| `schema/` | un esquema por tipo; VS Code lo lee por el `$schema` de cada JSON, y el build y la vista previa validan con él |
| `build/paginas.mjs` | las plantillas (datos → HTML, sin tocar el disco), para el build y la vista previa |
| `build/home.mjs`, `css/home.css` | la home (intro y landing), aparte |
| `build/proyectos.mjs` | lee y valida los proyectos (de almarbra) |
| `build/build.mjs` | escribe `dist/`: miniaturas, og 1200×630 y la portada pixelada de cada estrella con sharp en `.cache/`, los fotogramas de YouTube, 404, sitemap |
| `js/transicion.js`, `css/transicion.css` | la transición de la casa, tal cual de almarbra (fundido, sin dibujo) |
| `js/site.js` | los vídeos se ponen al verse; la rueda mueve de lado la tira de un proyecto; un vídeo de YouTube se pone al darle |
| `.github/workflows/deploy.yml` | cada push a main publica `dist/` en Pages (sin indexar); si el build falla, un issue (`CLAUDE.md`) |
| `wrangler.jsonc` | para la copia de la clienta en Workers Builds |

Cada sección con su aspecto (sus colores y letras en `data/config.json`; lo demás, por la clase del `<body>` en `css/style.css`), sacado del
[Figma](https://www.figma.com/design/UzpXb67tEoMRwDicfpqLYy/sepulcrito), que es la idea de partida,
y de los mockups de la landing:

- **home**: intro y landing rosa con la foto de L0rna; el menú abajo; «Sepulcrito» lleva al about.
- **obra**: rosa `#ff69b4`, Italianno, collage.
- **dirección creativa**: blanco, Instrument Serif.
- **una obra o un proyecto** (manu, 2026-11-19): del color de su sección, de lado (en el
  móvil, hacia abajo) y en **cuatro partes**, sin nada entre ellas: 1. el inicio (el fondo,
  la estrella grande a la derecha con el logo o el título encima, y `text` a la izquierda);
  2. las fotos con aire; 3. los vídeos (los `.webm` y los de YouTube a pantalla entera; si no
  hay, no sale); 4. el final, como el inicio, con `text2` (o `text` otra vez), los enlaces y
  el siguiente. El texto, en la letra de la sección, pequeña y en minúscula. La estrella es
  un hueco con la portada **siempre pixelada y de un color** (`star` en `config.json`), con
  su halo; al pasar se despixela. El menú, sin fondo y a la derecha, con el volver delante.
- **tattoo**: rojo, Irish Grover, columnas.
- **about**: negro, con la firma.

El menú es texto suelto abajo (en un proyecto, a la derecha y sin fondo); la estrella lleva a la home. Fuentes: Anton, Pinyon Script,
Italianno, Instrument Serif e Irish Grover, woff2 propias (OFL / Apache).

Los textos de la clienta (2026-11-19) están en los JSON; las dudas, a confirmar con ella.
Pendiente: el efecto de la estrella en la home
(entrar en la estrella y despixelar; estrellas como huecos sin filtro) y el traspaso (`TRASPASO.md`).
