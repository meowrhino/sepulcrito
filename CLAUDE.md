# sepulcrito, para Claude

La web de Sepulcrito, hecha por meowrhino con la receta del estudio
([meowrhino/JAMstack](https://github.com/meowrhino/JAMstack)). Se habla en
castellano. Cómo está hecha: [README.md](README.md); lo que edita la clienta:
[GUIA.md](GUIA.md).

## Si el build falla (la web no se ha publicado)

Cuando falla, la web se queda como estaba. Para arreglarlo:

1. **El error**: la Action abre un issue con la etiqueta `build` y el mensaje
   dentro (`gh issue list --label build`, `gh issue view <n>`). El registro
   entero: `gh run list -L 3` y `gh run view <id> --log-failed`.
2. **Reprodúcelo aquí**: `npm ci && node build/build.mjs`. Dice lo mismo: cada
   línea con ✗ trae el fichero y qué pasa.
3. **Arréglalo donde dice**, casi siempre en `data/*.json` o en
   `projects/<slug>/project.json`:
   - "no es un JSON válido (línea 12…)": una coma de más o de menos, o unas
     comillas sin cerrar, cerca de esa línea.
   - "no es un campo de aquí", "falta…", "no tiene la forma que toca": lo dice
     el esquema (`schema/<tipo>.json`); el mensaje lleva cómo va el campo.
   - "no encuentro img/9.webp (ni un vídeo img/9.webm)": un número de `photos`
     que no está en `img/`. Pregunta si falta subirla; si no, quítala de
     `photos` (y de `cover`) y dilo.
   - "no tiene su fotograma img/N.poster.webp": un vídeo sin su póster; los
     dos los saca videoToWeb.
   - "no es un WebP de verdad": no ha pasado por imgToWeb
     (https://meowrhino.github.io/imgToWeb/); hay que pasarla, no renombrarla.
   - "la lista … nombra …, y no hay projects/…/project.json": el nombre en
     `data/site.json` → `lists` y el de la carpeta en `projects/` no son iguales.
   - "pesa N MB, y el máximo es 25": un vídeo largo; videoToWeb, más corto.
4. **Comprueba**: `node build/build.mjs` sin ✗ (los ⚠ no paran nada).

No cambies el build, las plantillas ni el esquema para que pase: si el dato
está bien y el build se queja, es un fallo del build, y hay que decírselo a
manu. No borres fotos ni proyectos.

Commit y push solo cuando te lo pidan: mensaje en castellano diciendo qué se
arregla. Al publicarse, la Action cierra el issue sola.
