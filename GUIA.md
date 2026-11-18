# Cómo actualizar tu web

Hola. Esta guía es para que puedas cambiar tu web tú: añadir una obra o un
proyecto, cambiar fotos, textos o el orden… Todo se hace desde **Visual Studio
Code** (VS Code), un programa gratuito: abres el archivo, lo cambias, y con dos
clics sale en la web.

> **La regla de oro**: solo tocas **tus carpetas**: `data/` (los textos y el
> orden), `assets/img/` (las fotos de cada sección) y `tattoo/` (las fotos de
> tattoo). Lo demás es el código: mejor no tocarlo.

Cuando guardas un cambio, la web se actualiza sola en **2 o 3 minutos**. Si te
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
   con tu cuenta → elige tu web → elige una carpeta de tu ordenador →
   **Open**. Si te pide instalar Git, acepta.

A partir de aquí, la web es esa carpeta: cada vez que abras VS Code, se abre
ahí.

Para preparar las fotos, **imgToWeb**: https://meowrhino.github.io/imgToWeb/
(las convierte al formato de la web, `.webp`, del tamaño justo, y las numera).
Para los vídeos, **videoToWeb**: https://meowrhino.github.io/videoToWeb/.
**Ábrelos en Chrome o Firefox**, no en Safari: Safari no sabe hacer `.webp`.

---

## 1. Cómo está organizado

```
data/
  site.json                  ← lo general: título, lema, instagram, email, el menú
  obra.json                  ← las obras, una por bloque, en el orden en que salen
  direccion-creativa.json    ← los proyectos de dirección creativa, uno por bloque
  about.json                 ← el texto del about y cuál es su foto
assets/img/
  obra/                      ← las fotos de las obras: sweet-wrecker-1.webp, sweet-wrecker-2.webp…
  direccion-creativa/        ← las de dirección creativa: tattoox-1.webp, tattoox-2.webm…
  about/                     ← la foto del about: 1.webp
tattoo/                      ← las fotos de tattoo: 1.webp, 2.webp, 3.webp…
```

Cada obra y cada proyecto tiene un **slug**: su nombre corto, en minúsculas,
sin tildes ni espacios (con guiones: `sweet-wrecker`). Es su dirección en la
web (`/obra/sweet-wrecker/`) y el principio del nombre de sus fotos
(`sweet-wrecker-1.webp`, `sweet-wrecker-2.webp`…).

---

## 2. Cómo se hace un cambio con VS Code

1. **Antes de nada, baja la última versión**: en la barra de abajo del todo,
   pulsa las flechas ⟳ (**Sync**).
2. En la columna de la izquierda, abre el archivo (por ejemplo
   `data/obra.json`) y cambia lo que quieras. Guarda con **Cmd+S** (o
   **Ctrl+S**). Si algo sale **subrayado en rojo**, hay una coma o unas
   comillas mal: arréglalo antes de seguir (punto 6).
3. A la izquierda, el icono de las ramas (**Source Control**): escribe en una
   línea qué has cambiado ("texto de sweet wrecker") y pulsa **Commit**.
4. Pulsa **Sync Changes** (el mismo botón azul).

Ya está: en 2-3 minutos sale en la web.

**Para añadir fotos**: arrastra los archivos a su carpeta (por ejemplo
`assets/img/obra/`) en la columna de la izquierda de VS Code, y luego los pasos
3 y 4.

---

## 3. Lo que más vas a hacer

### Cambiar el texto de una obra o de un proyecto

En su bloque de `data/obra.json` o `data/direccion-creativa.json`, en `text`.
Es una **lista de párrafos**, cada uno entre comillas y separados por comas:

```json
"text": ["Primer párrafo.", "Segundo párrafo."],
```

Si está vacío (`"text": []`), la página sale sin texto.

### Cambiar la portada, el orden de las fotos o quitar una

Las fotos van por su **número**: `"5"` es la `sweet-wrecker-5.webp`.

```json
"cover": "3",
"photos": ["1", "2", "4", "3", "5"]
```

- `cover` (portada): la foto que sale en la lista de la sección y cuando
  alguien comparte el enlace. Tiene que ser una foto, no un vídeo.
- `photos`: las que salen en la página, en ese orden. Para cambiar el orden,
  mueve los números; para quitar una, bórrala de la lista (el archivo puede
  quedarse en la carpeta, no pasa nada).

### Añadir fotos a una obra o a un proyecto

1. Pásalas por imgToWeb. **Ojo**: imgToWeb las llama `1.webp`, `2.webp`…
   Cámbiales el nombre al de la obra y al número siguiente: si sweet wrecker
   ya tiene 12, las nuevas son `sweet-wrecker-13.webp`, `sweet-wrecker-14.webp`…
2. Súbelas a su carpeta (`assets/img/obra/`).
3. Añade sus números a `photos`.

### Un vídeo

Un vídeo va como una foto más, por su número. Se prepara con **videoToWeb**,
con la opción **fotograma** activada: de cada vídeo salen dos archivos, el
vídeo (`.webm`) y su fotograma (`.poster.webp`), que es lo que se ve mientras
llega. Los dos van a la carpeta con el mismo nombre: `tattoox-5.webm` y
`tattoox-5.poster.webp`, y en el JSON se pone `"5"` como con una foto. En la
web se pone solo, sin sonido, cuando se ve; con los mandos se le da sonido.

Cuanto más corto, mejor. Un archivo no puede pasar de **25 MB**.

### Enlaces (YouTube, Instagram…)

En `links`, la lista de direcciones. En la web sale "ver en youtube ↗":

```json
"links": ["https://www.youtube.com/watch?v=fl59GkEZqWg"]
```

### Cambiar el orden de las obras o de los proyectos

Salen en el orden de los bloques en su JSON. Para cambiarlo, mueve el bloque
entero (desde su `{` hasta su `}`, con la coma de después). Para quitar uno,
bórralo entero.

### Tattoo: añadir o quitar fotos

En tattoo salen **todas** las fotos de la carpeta `tattoo/`, por orden de
número. No hay JSON: solo las fotos.

- **Añadir**: pásalas por imgToWeb y súbelas a `tattoo/`. Como imgToWeb
  numera desde el 1, si ya hay 29, cámbiales el nombre a 30, 31… antes de
  subirlas.
- **Quitar**: borra la foto de `tattoo/`.
- **Que una salga antes**: cámbiale el número.

### El about, tu Instagram o tu email

- El texto del about, en `data/about.json` → `text` (lista de párrafos).
- La foto, en `assets/img/about/1.webp`. Para cambiarla, pásala por imgToWeb y
  sustitúyela (con el mismo nombre).
- El Instagram y el email, en `data/site.json`: `"instagram"` (solo el usuario,
  sin la @: `"sepulcrito"`) y `"email"`. Salen en el about, y el Instagram
  también en tattoo, para pedir cita.

---

## 4. Añadir una obra o un proyecto nuevo

1. **Las fotos**: pásalas por imgToWeb en el orden en que quieras que salgan, y
   cámbiales el nombre con el slug: `nueva-obra-1.webp`, `nueva-obra-2.webp`…
   Súbelas a `assets/img/obra/` (o a `assets/img/direccion-creativa/`).
2. **El bloque**: en `data/obra.json`, **copia el bloque de otra obra** (desde
   su `{` hasta su `}`), pégalo donde quieras que salga, con una coma entre
   bloques, y cámbialo:

```json
{
  "slug": "nueva-obra",
  "title": "Nueva obra",
  "year": 2026,
  "cover": "1",
  "text": ["Texto."],
  "photos": ["1", "2", "3"]
},
```

3. **Commit** y **Sync Changes** (punto 2).

La imagen que sale al compartir el enlace y las fotos pequeñas de las listas
**se hacen solas**.

---

## 5. Qué va en cada campo

| campo | qué es | ejemplo |
|---|---|---|
| `slug` | el nombre corto: la dirección y el nombre de las fotos | `"sweet-wrecker"` |
| `title` | el título, tal cual se ve | `"Sweet Wrecker"` |
| `year` | *(obra)* el año, sin comillas | `2025` |
| `cover` | la portada: la foto de la lista y de compartir | `"3"` |
| `text` | el texto, lista de párrafos | `["Uno.", "Dos."]` |
| `photos` | las fotos y vídeos, en orden | `["1", "2", "3"]` |
| `links` | *(opcional)* enlaces de fuera | `["https://youtube.com/…"]` |
| `logo` | *(dirección creativa, opcional)* el número de la foto del logo, que sale en grande al principio | `"1"` |
| `groups` | *(dirección creativa, opcional)* el proyecto por partes, cada una con su `title`, `text`, `photos` y `links`, como en Tattoox | ver `tattoox` |

### Qué sale en Google y al compartir

| dónde | de qué campo |
|---|---|
| el título | `title` de la obra o el proyecto; en la home, el de `data/site.json` |
| la frase de debajo | el primer párrafo de `text`; si no hay, una frase con el título |
| la imagen al compartir | la `cover` (la recorta la web al publicar) |

---

## 6. Si algo va mal

**Casi siempre es una coma o unas comillas.** En un `.json`:

- cada texto va entre comillas dobles: `"así"`;
- entre dos cosas de una lista va una coma: `["1", "2", "3"]`;
- **después de la última, no**: `["1", "2", "3",]` ✗.

Si un JSON se te descoloca, **Format Document** en VS Code (clic derecho dentro
del archivo) lo ordena.

**Cómo saber si ha ido bien**: en github.com, en tu web, al lado del último
cambio (encima de la lista de archivos) sale un círculo:

- 🟢 verde: publicado.
- 🟡 amarillo: publicándose (2-3 minutos).
- 🔴 rojo: no se ha publicado, y **la web sigue como estaba**. Pulsa en él →
  **Details**, y verás una línea con ✗ que dice qué pasa y dónde. Por ejemplo:

  ```
  ✗ data/obra.json, hacia la línea 12: el JSON está roto. Casi siempre es una coma…
  ✗ data/obra.json, bloque 2 («La fúria del silenci»): no encuentro assets/img/obra/la-furia-del-silenci-12.webp
  ✗ data/obra.json, bloque 1 («Sweet Wrecker»): «cover» («13») tiene que ser una foto que esté
  ```

  Arréglalo en VS Code (el número de línea te dice dónde mirar), y otra vez
  **Commit** y **Sync Changes**.

Si no ves qué es, escríbenos con el mensaje en rojo y lo miramos.
