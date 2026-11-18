# sepulcrito

Web de Sepulcrito: [meowrhino.github.io/sepulcrito](https://meowrhino.github.io/sepulcrito/).

```
npm ci
npm run dev        # build a dist/ y la sirve en localhost:8765
```

- `data/site.json`: título, descripción, dominio (`url`), lema y menú.
- `data/obra.json`: las obras, una por bloque (`slug`, `title`, `year`, `cover`, `text`, `photos`).
  Fotos en `assets/img/obra/<slug>-1.webp`… (imgToWeb).
- `build/build.mjs`: valida y escribe `dist/` (home, `/obra/`, una página por obra, 404, sitemap,
  og 1200×630 y miniaturas con sharp en `.cache/`). Si algo está mal, para y dice qué.
- `.github/workflows/deploy.yml`: cada push a main publica `dist/` en GitHub Pages (sin indexar);
  si el build falla, abre un issue con el error.
- `assets/img/home.webp`: foto de la home (L0rna, `PS5A7405`). `star.webp`: la estrella, recortada
  del mockup con `tools/estrella.py`.
- `fonts/`: Anton, Pinyon Script e Italianno (OFL), woff2 propias.

Cada sección con su aspecto: la home rosa con la foto; obra en rosa #ff69b4, estrella blanca del
Figma y títulos en Italianno.

El [Figma](https://www.figma.com/design/UzpXb67tEoMRwDicfpqLYy/sepulcrito) es la idea de partida
(octubre): una landing y botones a secciones que son cada una distinta. La landing sale de
`landing refes ideas` (noviembre).

Pendiente: textos de obra (los .txt estaban vacíos), about, dirección creativa, tattoo, `GUIA.md`.
