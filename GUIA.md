# Cómo actualizar tu web

Hola. Esta guía es para que puedas cambiar tu web tú: añadir una obra o un
proyecto, cambiar fotos, textos o el orden… Todo se hace desde **Visual Studio
Code** (VS Code), un programa gratuito: abres el archivo, lo cambias, lo miras
con **Go Live**, y con dos clics sale en la web.

> **La regla de oro**: solo tocas **tus carpetas**: `projects/` (tus obras y
> proyectos), `tattoo/` (las fotos de tattoo), `about/` (la foto del about) y
> `data/` (lo general de la web). Lo demás es el código: mejor no tocarlo.

Cuando subes un cambio, la web se actualiza sola en **2 o 3 minutos**. Si te
equivocas en algo, la web **no se rompe**: se queda como estaba hasta que lo
arregles (abajo, en *Si algo va mal*).

---

## 0. Antes de empezar (solo la primera vez)

1. Hazte una cuenta en [github.com](https://github.com) y pásanos tu nombre de
   usuario.
2. Te pasamos **una copia de la web a tu cuenta**: desde ese momento es tuya.
3. Instala **Visual Studio Code**: https://code.visualstudio.com
4. Ábrelo y trae la web a tu ordenador: a la izquierda, el icono de las ramas
   (**Source Control**) → **Clone Repository** → **Clone from GitHub** → entra
   con tu cuenta → elige tu web → elige una carpeta de tu ordenador
   (**fuera de Google Drive o iCloud**, que se pelean con git) → **Open**. Si
   te pide instalar Git, acepta.
5. Instala **Live Server**, para ver los cambios antes de subirlos: a la
   izquierda, el icono de los cuadraditos (**Extensions**) → busca
   `Live Server` (el de Ritwick Dey) → **Install**. Abajo a la derecha sale un
   botón **Go Live**.

Para preparar las fotos, **imgToWeb**: https://meowrhino.github.io/imgToWeb/
(las convierte al formato de la web, `.webp`, del tamaño justo, y las numera).
Para los vídeos, **videoToWeb**: https://meowrhino.github.io/videoToWeb/.
**Ábrelos en Chrome o Firefox**, no en Safari: Safari no sabe hacer `.webp`.

---

## 1. Cómo está organizado

```
projects/                     ← todas las obras y proyectos, uno por carpeta
  sweet-wrecker/
    project.json              ← sus textos
    img/                      ← sus fotos: 1.webp, 2.webp, 3.webp…
  tattoox/
    project.json
    img/
  …
tattoo/                       ← las fotos de tattoo: 1.webp, 2.webp…
about/                        ← la foto del about: 1.webp
data/
  site.json                   ← qué sale en obra y en dirección creativa, y en qué orden;
                                 tu Instagram, tu email, el menú…
  about.json                  ← el texto del about
```

El **nombre de la carpeta** de un proyecto es su dirección en la web: la
carpeta `projects/sweet-wrecker/`, en la lista `obra`, sale en
`tuweb.com/obra/sweet-wrecker/`. Va en minúsculas, sin tildes ni espacios
(con guiones: `nueva-obra`).

---

## 2. Cómo se hace un cambio con VS Code

1. **Antes de nada, baja la última versión**: en la barra de abajo del todo,
   pulsa las flechas ⟳ (**Sync**).
2. En la columna de la izquierda, abre el archivo (por ejemplo
   `projects/sweet-wrecker/project.json`) y cambia lo que quieras. Guarda con
   **Cmd+S** (o **Ctrl+S**). Si algo sale **subrayado en rojo**, hay una coma o
   unas comillas mal: arréglalo antes de seguir (punto 6).
3. **Míralo**: pulsa **Go Live** (abajo a la derecha). Se abre tu web en el
   navegador, tal como quedará, y cada vez que guardas se recarga sola. Si
   algo está mal, en vez de la web sale un aviso en rojo que dice qué y dónde.
   Esta vista es solo para ti: no se publica nada hasta el paso 5.
4. A la izquierda, el icono de las ramas (**Source Control**): escribe en una
   línea qué has cambiado ("texto de sweet wrecker") y pulsa **Commit**.
5. Pulsa **Sync Changes** (el mismo botón azul).

Ya está: en 2-3 minutos sale en la web.

**Para añadir fotos**: arrastra los archivos a su carpeta `img/` (por ejemplo
`projects/sweet-wrecker/img/`) en la columna de la izquierda de VS Code, y
luego los pasos 3 a 5.

---

## 3. Lo que más vas a hacer

### Cambiar el texto de una obra o de un proyecto

En su `project.json`, en `text`. Es una **lista de párrafos**, cada uno entre
comillas y separados por comas:

```json
"text": [
  "Primer párrafo.",
  "Segundo párrafo."
],
```

Si está vacío (`"text": []`), la página sale sin texto.

### Cambiar la portada, el orden de las fotos o quitar una

Las fotos van por su **número**: `"5"` es la `5.webp` de su carpeta `img/`.

- `cover` (portada): la foto de la lista de la sección, la destacada de la
  primera vista y la que sale al compartir el enlace. Tiene que ser una foto,
  no un vídeo: `"cover": "3"`.
- `photos`: las que salen en la página, en ese orden. Para cambiar el orden,
  mueve los números; para quitar una, bórrala de la lista (el archivo puede
  quedarse en `img/`, no pasa nada).

### Añadir fotos a una obra o a un proyecto

1. Pásalas por imgToWeb. **Ojo**: imgToWeb las numera desde el 1. Si el
   proyecto ya tiene 12 fotos, cámbiales el nombre a 13, 14… antes de subirlas.
2. Súbelas a su carpeta `img/`.
3. Añade sus números a `photos` en el `project.json`.

### Un vídeo

Un vídeo va como una foto más, por su número. Se prepara con **videoToWeb**,
con la opción **fotograma** activada: de cada vídeo salen dos archivos, el
vídeo (`.webm`) y su fotograma (`.poster.webp`), que es lo que se ve mientras
llega. Los dos van a `img/` con el mismo número: `img/5.webm` y
`img/5.poster.webp`, y en el JSON se pone `"5"` como con una foto. En la web
se pone solo, sin sonido, cuando se ve; con los mandos se le da sonido.

Cuanto más corto, mejor. Un archivo no puede pasar de **25 MB**.

### Enlaces (YouTube, Instagram…)

En `links`, la lista de direcciones. En la web sale "ver en youtube ↗":

```json
"links": [
  "https://www.youtube.com/watch?v=fl59GkEZqWg"
],
```

### Cambiar el orden de las obras o de los proyectos, o esconder uno

En `data/site.json`, en `lists`. Hay dos, **obra** y **direccion-creativa**,
cada una con su nombre (`name`) y los nombres de las carpetas de sus proyectos
(`projects`), en el orden en que salen:

```json
"lists": {
  "obra": {
    "name": "obra",
    "projects": [
      "sweet-wrecker",
      "la-furia-del-silenci",
      …
    ]
  },
```

- Para **cambiar el orden**, mueve los nombres.
- Para **esconder** uno sin borrarlo, cambia su nombre por
  `{ "project": "sweet-wrecker", "visible": false }`: sigue teniendo su página
  (puedes mandar el enlace a quien quieras), pero no sale en la lista ni en
  Google.
- Para **quitarlo del todo**, bórralo de la lista (la carpeta se puede quedar).

### Tattoo: añadir o quitar fotos

En tattoo salen **todas** las fotos de la carpeta `tattoo/`, por orden de
número. No hay JSON: solo las fotos.

- **Añadir**: pásalas por imgToWeb y súbelas a `tattoo/`. Como imgToWeb
  numera desde el 1, si ya hay 29, cámbiales el nombre a 30, 31… antes de
  subirlas.
- **Quitar**: borra la foto de `tattoo/` y cambia el nombre de la última al
  número que ha quedado libre (si borras la 12 y hay 29, la 29 pasa a ser la
  12). Si queda un hueco, la web sale bien, pero la vista previa se para ahí.

### El about, tu Instagram o tu email

- El texto, en `data/about.json` → `text` (lista de párrafos).
- La foto, `about/1.webp`. Para cambiarla, pásala por imgToWeb y sustitúyela
  con el mismo nombre.
- El Instagram y el email, en `data/site.json`: `"instagram"` (solo el usuario,
  sin la @: `"sepulcrito"`) y `"email"`. Salen en el about, y el Instagram
  también en tattoo, para pedir cita.

---

## 4. Añadir una obra o un proyecto nuevo

1. **Las fotos**: pásalas por imgToWeb en el orden en que quieras que salgan
   y descarga el zip.
2. **La carpeta**: en VS Code, **copia la carpeta de otro** (por ejemplo
   `projects/sweet-wrecker/`: clic derecho → Copy, y Paste sobre `projects/`)
   y cámbiale el nombre a `nueva-obra`.
3. **Las fotos**: borra las de su `img/` y arrastra ahí las del zip.
4. **Los textos**: abre su `project.json` y cámbialo (abajo, uno mínimo).
5. **Que salga**: en `data/site.json`, añade `"nueva-obra"` a los `projects`
   de su lista (`obra` o `direccion-creativa`), donde quieras que salga.
6. Míralo con **Go Live**, y **Commit** y **Sync Changes** (punto 2).

Un `project.json` mínimo:

```json
{
  "$schema": "../../schema/project.json",
  "title": "Nueva obra",
  "year": 2026,
  "cover": "1",
  "text": [
    "Texto."
  ],
  "photos": [
    "1",
    "2",
    "3"
  ]
}
```

La imagen que sale al compartir el enlace y las fotos pequeñas de las listas
**se hacen solas** al publicar.

---

## 5. Qué va en cada campo de un `project.json`

| campo | qué es | ejemplo |
|---|---|---|
| `title` | el título, tal cual se ve | `"Sweet Wrecker"` |
| `year` | *(opcional)* el año, sin comillas | `2025` |
| `cover` | la portada: la foto de la lista, la destacada y la de compartir | `"3"` |
| `text` | el texto, lista de párrafos | `["Uno.", "Dos."]` |
| `photos` | las fotos y vídeos, en orden | `["1", "2", "3"]` |
| `links` | *(opcional)* enlaces de fuera | `["https://youtube.com/…"]` |
| `logo` | *(opcional)* el número de la foto del logo, que sale en grande al principio y al final | `"1"` |
| `groups` | *(opcional)* el proyecto por partes, cada una con su página, como Tattoox: `slug`, `title`, `text`, `links`, `photos` | ver `tattoox` |

**VS Code te ayuda**: al pasar el ratón por un campo te dice qué es, al empezar
a escribir uno nuevo te propone los que hay, y uno mal escrito (`"covr"`) sale
**subrayado en rojo**. Lo sabe por la primera línea de cada `.json`
(`"$schema": …`): no la borres.

### Qué sale en Google y al compartir

| dónde | de qué campo |
|---|---|
| el título | el `title` de la obra o el proyecto; en la home, el de `data/site.json` |
| la frase de debajo | el primer párrafo de `text`; en la home, `description` de `data/site.json` |
| la imagen al compartir | la `cover` (la recorta la web al publicar) |

---

## 6. Si algo va mal

**Casi siempre es una coma o unas comillas.** Lo ves antes de subirlo: con
**Go Live**, en vez de la web sale el aviso en rojo. En un `.json`:

- cada texto va entre comillas dobles: `"así"`;
- entre dos cosas de una lista va una coma: `["1", "2", "3"]`;
- **después de la última, no**: `["1", "2", "3",]` ✗.

Si un JSON se te descoloca, **Format Document** (clic derecho dentro del
archivo) lo ordena.

**Cómo saber si ha ido bien**: en github.com, en tu web, al lado del último
cambio (encima de la lista de archivos) sale un círculo:

- 🟢 verde: publicado.
- 🟡 amarillo: publicándose (2-3 minutos).
- 🔴 rojo: no se ha publicado, y **la web sigue como estaba**. Pulsa en él →
  **Details**, y verás una línea con ✗ que dice qué pasa y dónde. Por ejemplo:

  ```
  ✗ projects/sweet-wrecker/project.json no es un JSON válido (línea 12, columna 5). …
  ✗ projects/sweet-wrecker: en «photos», no encuentro img/13.webp (ni un vídeo img/13.webm)
  ✗ la lista «obra» de data/site.json nombra «sweet-wreker», y no hay projects/sweet-wreker/project.json
  ```

  Arréglalo en VS Code (con **Go Live** verás que vuelve a salir la web), y
  otra vez **Commit** y **Sync Changes**.

Si no ves qué es, escríbenos con el mensaje en rojo y lo miramos.
