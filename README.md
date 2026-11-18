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
| `projects/<slug>/project.json` + `img/N.webp` | cada obra o proyecto (imgToWeb); un vídeo, `img/N.webm` + `img/N.poster.webp` (videoToWeb). `groups`: un proyecto por partes, cada una con su página (Tattoox) |
| `tattoo/N.webp`, `about/1.webp` | las fotos de tattoo (sin JSON, por número) y la del about |
| `schema/` | un esquema por tipo; VS Code lo lee por el `$schema` de cada JSON, y el build y la vista previa validan con él |
| `build/paginas.mjs` | las plantillas (datos → HTML, sin tocar el disco), para el build y la vista previa |
| `build/home.mjs`, `css/home.css` | la home (intro y landing), aparte |
| `build/proyectos.mjs` | lee y valida los proyectos (de almarbra) |
| `build/build.mjs` | escribe `dist/`: miniaturas y og 1200×630 con sharp en `.cache/`, 404, sitemap |
| `js/transicion.js`, `css/transicion.css` | la transición de la casa, tal cual de almarbra (fundido, sin dibujo) |
| `js/site.js` | los vídeos se ponen al verse; la rueda mueve de lado la tira de dirección creativa |
| `.github/workflows/deploy.yml` | cada push a main publica `dist/` en Pages (sin indexar); si el build falla, un issue (`CLAUDE.md`) |
| `wrangler.jsonc` | para la copia de la clienta en Workers Builds |

Cada sección con su aspecto (la clase del `<body>` en `css/style.css`), sacado del
[Figma](https://www.figma.com/design/UzpXb67tEoMRwDicfpqLYy/sepulcrito), que es la idea de partida,
y de los mockups de la landing:

- **home**: intro y landing rosa con la foto de L0rna; el menú abajo; «Sepulcrito» lleva al about.
- **obra**: rosa `#ff69b4`, Italianno, collage; cada obra hacia abajo.
- **dirección creativa**: blanco, Instrument Serif. Cada proyecto, como en el Figma: de lado y por
  pantallas con una raya entre ellas (la primera vista con el índice de partes, la foto destacada y
  el logo con la estrella detrás; las fotos; los vídeos; el texto y el logo al final).
- **tattoo**: rojo, Irish Grover, columnas.
- **about**: negro, con la firma.

El menú es texto suelto abajo; la estrella lleva a la home. Fuentes: Anton, Pinyon Script,
Italianno, Instrument Serif e Irish Grover, woff2 propias (OFL / Apache).

Pendiente: los textos (los `.txt` de la clienta venían vacíos), el efecto de la estrella en la home
(entrar en la estrella y despixelar; estrellas como huecos sin filtro) y el traspaso (`TRASPASO.md`).
