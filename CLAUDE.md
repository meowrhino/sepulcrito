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
3. **Arréglalo donde dice**, casi siempre en `data/*.json`:
   - "el JSON está roto, hacia la línea 12": una coma de más o de menos, o
     unas comillas sin cerrar, cerca de esa línea.
   - "no encuentro assets/img/obra/<slug>-9.webp": una foto de `photos` que no
     está. Pregunta si falta subirla; si no, quítala de `photos` (y de `cover`)
     y dilo.
   - "«cover» tiene que ser una foto": `cover` nombra un número que no está o
     que es un vídeo.
   - "«slug» va en minúsculas…" o "ya lo tiene otro bloque": el slug es la
     dirección y el nombre de las fotos; si se cambia, hay que renombrar sus
     fotos igual.
4. **Comprueba**: `node build/build.mjs` sin ✗ (los ⚠ no paran nada).

No cambies el build ni las plantillas para que pase: si el dato está bien y el
build se queja, es un fallo del build, y hay que decírselo a manu. No borres
fotos ni bloques.

Commit y push solo cuando te lo pidan: mensaje en castellano diciendo qué se
arregla. Al publicarse, la Action cierra el issue sola.
