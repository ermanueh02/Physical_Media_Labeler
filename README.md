# Norelco Studio 1970–1989 — Generador de J-Cards y Etiquetas de Cassette Vintage (PWA)

Aplicación web reactiva e instalable (**Progressive Web App / PWA para Chrome y Edge**) diseñada para maquetar e imprimir encartes de cassette (**J-Cards**, **J+1**, **J+2**) y **etiquetas adhesivas de cartucho (Cara A / Cara B)** con precisión física milimétrica (**Escala 1:1 a 300 DPI**) e inspiración minimalista en ediciones de los años 70 y 80.

🔗 **Aplicación Web / PWA en vivo (GitHub Pages):**  
👉 **[https://ermanueh02.github.io/Physical_Media_Labeler/](https://ermanueh02.github.io/Physical_Media_Labeler/)**

---

## Instalación como Aplicación en Google Chrome (PWA)

1. Abre **[https://ermanueh02.github.io/Physical_Media_Labeler/](https://ermanueh02.github.io/Physical_Media_Labeler/)** en Google Chrome o Microsoft Edge.
2. Pulsa el botón **"Instalar App"** en la barra superior derecha de la aplicación (o el icono de instalación situado en la barra de direcciones de Chrome).
3. La aplicación se instalará como programa independiente de escritorio con soporte offline gracias a su `manifest.webmanifest` y Service Worker (`sw.js`).

---

## Especificaciones Físicas Reales (Escala 1:1 @ 300 DPI)

- **J-Card Desplegada:**
  - **Portada Frontal (Front Cover):** `65.0 mm` × `102.0 mm`
  - **Lomo (Spine):** `12.5 mm` × `102.0 mm`
  - **Solapa Trasera (Back Flap):** `19.0 mm` × `102.0 mm`
  - **Paneles Interiores Desplegables (J+1 / J+2):** `65.0 mm` × `102.0 mm` cada uno (`96.5 mm` en J-Card estándar, `161.5 mm` en J+1, `226.5 mm` en J+2).
- **Etiquetas Adhesivas para Cartucho (Cara A y Cara B):**
  - **Dimensiones exteriores:** `89.0 mm` × `42.0 mm` con esquinas superiores achaflanadas.
  - **Ventana central troquelada:** `59.0 mm` × `17.5 mm` con guías de ejes de bobinas precalculadas (`Ø 12.8 mm` a `42.5 mm` entre centros).

## Desarrollo Local

```bash
npm install
npm run dev
```
