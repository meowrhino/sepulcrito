# sepulcrito

Web de Sepulcrito: [meowrhino.github.io/sepulcrito](https://meowrhino.github.io/sepulcrito/).
Lo que edita la clienta, en [GUIA.md](GUIA.md); si el build falla, [CLAUDE.md](CLAUDE.md).

```
npm ci
npm run dev        # build a dist/ y la sirve en localhost:8765
```

| | |
|---|---|
| `data/site.json` | título, descripción, dominio (`url`), lema, instagram, email y menú |
| `data/obra.json` | las obras, una por bloque (`slug`, `title`, `year`, `cover`, `text`, `photos`, `links`) |
| `data/direccion-creativa.json` | los proyectos, uno por bloque (además `logo` y `groups`: Tattoox va por partes) |
| `data/about.json` | `photo` y `text` del about |
| `assets/img/<sección>/<slug>-N.webp` | las fotos de cada bloque (imgToWeb); un vídeo, `<slug>-N.webm` + `<slug>-N.poster.webp` (videoToWeb) |
| `tattoo/N.webp` | las fotos de tattoo, sin JSON, por orden de número |
| `build/build.mjs` | valida y escribe `dist/`: home, `/obra/`, `/direccion-creativa/`, `/tattoo/`, `/about/`, una página por obra y por proyecto, 404, sitemap; miniaturas y og 1200×630 con sharp en `.cache/` |
| `js/site.js` | los vídeos se ponen al verse; la rueda mueve de lado la tira de dirección creativa |
| `.github/workflows/deploy.yml` | cada push a main publica `dist/` en Pages (sin indexar); si el build falla, un issue |

Cada sección con su aspecto, sacado del [Figma](https://www.figma.com/design/UzpXb67tEoMRwDicfpqLYy/sepulcrito)
(la idea de partida: una landing y secciones que son cada una distinta) y de los mockups de la landing:

- **home**: intro (blanco → estrella → foto → zoom) y landing rosa con la foto de L0rna
  (`assets/img/home.webp`) y la estrella (`star.webp`, recortada del mockup con `tools/estrella.py`).
- **obra**: rosa `#ff69b4`, Italianno, collage.
- **dirección creativa**: blanco, Instrument Serif; cada proyecto, una tira horizontal con una raya
  entre partes.
- **tattoo**: rojo, Irish Grover, columnas de fotos.
- **about**: negro.

La estrella de las cabeceras es la del Figma, en línea, de un color por sección, y gira al bajar.
Fuentes: Anton, Pinyon Script, Italianno, Instrument Serif e Irish Grover, woff2 propias (OFL / Apache).

Pendiente: los textos (los `.txt` de la clienta estaban vacíos), la vista previa con Live Server y los
esquemas JSON de la receta, y el traspaso (`TRASPASO.md`, `wrangler.jsonc`).
