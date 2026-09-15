# AndiWorks Home

Landing principal de AndiWorks, mueblería y diseño personalizado. Es un sitio estático (sin build ni backend) apto para GitHub Pages, Netlify, Vercel o hosting tradicional.

**Importante:** desde que el catálogo usa un modelo 3D real (`.glb`), el proyecto necesita servirse por **http(s)** — ya no funciona abriendo `index.html` directo como archivo (`file://`), porque los navegadores bloquean el `fetch()` de un `.glb` local. Para probar en local:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Estructura

```text
HomePage/
├── index.html                 Home — punto de entrada
├── assets/css/styles.css      Diseño y responsividad del Home
├── assets/js/main.js          Interacciones del Home (videos, idiomas, horario)
├── assets/js/analytics.js     GA4 + Cloudflare + Clarity (Home y ambos catálogos)
├── assets/css/catalog-app.css Diseño COMPARTIDO por catalogo/ y catalogo-laser/
├── assets/js/catalog-app.js   Lógica COMPARTIDA por catalogo/ y catalogo-laser/
├── catalogo/                   Catálogo de productos (ver detalle abajo)
├── catalogo-laser/              Catálogo de Corte y Grabado Láser (misma
│                                 lógica que catalogo/, ver detalle abajo)
├── products/                    Archivos fuente (.glb/.3dm) — NO debería
│                                 publicarse tal cual, ver "Antes de publicar"
└── README.md
```

## Home (`index.html`)

Las acciones principales usan `data-theme` y `data-video-index` para mostrar su color y video. La primera acción está bloqueada hasta crear el flujo del espejo paramétrico: al pulsarla ejecuta una animación de "bloqueado" (sacudida horizontal) mediante la clase `is-shaking`, que se retira al terminar la animación. La segunda acción dirige a `catalogo/index.html` (con una animación de salida: textos y video de fondo se desvanecen antes de navegar — clase `.leaving`). La tercera abre WhatsApp.

Al cargar, los textos entran con una animación escalonada (opacidad + desplazamiento vertical), activada con la clase `page-ready` en el `body`. Respeta `prefers-reduced-motion`.

Selector de idioma **ES / EN / 中** sobre el bloque central. Las traducciones viven en el objeto `I18N` de `assets/js/main.js`. La preferencia se guarda en `localStorage` (`aw-lang`) y, en la primera visita, se detecta desde el idioma del navegador.

El horario se calcula en el navegador: lunes a viernes 09:00-18:00, sábado 10:00-14:00 y domingo cerrado. Las tipografías (Google Fonts) y los videos de fondo se cargan desde servicios externos de muestra — **reemplazar por recursos propios optimizados antes de publicar** (ver más abajo).

## Catálogo (`catalogo/` y `catalogo-laser/`)

Dos catálogos independientes que **comparten toda la lógica y el diseño base** — `assets/css/catalog-app.css` y `assets/js/catalog-app.js`, en la raíz del proyecto. Cada catálogo es solo su `index.html`, sus datos, y (si corresponde) un pequeño override de color:

```text
catalogo/
├── index.html
├── data/productos.js         Productos reales (window.PRODUCTS)
├── assets/models/            Modelos 3D reales (.glb) usados por productos.js
├── assets/products/           Fotos por producto — carpeta "NN-nombre-producto"
└── admin/                     Formulario interno para generar el código
                                de nuevos productos (ver detalle abajo)

catalogo-laser/
├── index.html                 Carga catalog-app.css/.js + su propio theme.css
├── assets/css/theme.css       Único override real: --accent teal en vez de naranja
├── data/productos.js          Productos reales (sin modelos 3D ni video)
└── assets/products/            Fotos por producto, misma convención NN-nombre
```

Cada `index.html` puede además definir `window.CATALOG_I18N_OVERRIDES` (antes de cargar `catalog-app.js`) para pisar textos puntuales por idioma — hoy solo el subtítulo de marca y la etiqueta "Medidas"/"Año". Toda la lógica de mosaico, overlay, 3D e idiomas vive en un solo lugar (`catalog-app.js`); un fix ahí aplica a los dos catálogos a la vez.

- **Mosaico**: la grilla (columnas × filas) se calcula en JS (`computeGrid()`) según el tamaño de ventana, para llenar siempre el área visible sin dejar vacíos. Cada card decide sola si su portada es imagen, video o modelo 3D (`product.coverType` / `media[0].type`).
- **Overlay**: media ampliada + dock estilo macOS con acciones (i) descripción · fotos/videos · 3D · WhatsApp · Instagram. La descripción va visible por defecto. El cambio entre fotos/videos/3D siempre anima con un fundido+escala rápido, y un rótulo en la esquina superior izquierda indica si se están mostrando "Imágenes del producto" o el "Modelo 3D". En táctil, tocar la foto avanza a la siguiente (no hace falta swipe).
- **Modelo 3D**: vía `<model-viewer>` (Google), con entorno de luz neutro y sombra de contacto (`environment-image="neutral"`, `shadow-intensity`, `shadow-softness`) para un look realista tanto en la card como en el overlay. Solo `catalogo/` lo usa por ahora.
- **i18n**: mismo patrón que el Home (`I18N` en `catalog-app.js`, ES/EN/中).

Datos: cada `data/productos.js` expone `window.PRODUCTS` como script clásico (sin `fetch()`, para simplicidad). Cuando haya backend, considerar migrar a `data/productos.json` + `fetch()`.

### Formulario de productos (`catalogo/admin/`)

Herramienta de **uso interno** (no pensada para visitantes) que ayuda a preparar un producto nuevo sin tocar código a mano:

- Pasos en cadena (Título → Medidas → Descripción → Fotos/videos → Modelo 3D → WhatsApp → Instagram): cada paso se habilita cuando el anterior obligatorio está completo.
- Sugiere nombres de archivo consistentes (`slug_imagen1.jpg`, `slug_modelo3d.glb`, etc.) y la carpeta de destino — el renombrado real del archivo en el computador es manual.
- Vista previa en vivo de la card y del overlay, reutilizando el CSS real del catálogo.
- Botón "Generar código" que arma el objeto de producto listo para pegar en `productos.js`, con copiado a un click.

**Esta página no tiene autenticación** — cualquiera que conozca la URL puede abrirla (no expone datos sensibles ni escribe en ningún lado, solo genera texto), pero antes de publicar conviene no enlazarla públicamente y/o protegerla a nivel de hosting (ver "Antes de publicar").

## Antes de publicar en un dominio real

- [ ] Reemplazar los videos de fondo del Home y las fotos/videos de prueba del catálogo (picsum.photos, test-videos.co.uk, MDN) por contenido propio.
- [ ] Revisar que cada producto real tenga sus assets en `catalogo/assets/products/<slug>/` (o la carpeta que se defina) con los nombres sugeridos por el formulario interno.
- [ ] Excluir `catalogo/admin/` del sitio público, o protegerlo con autenticación básica del hosting (Netlify/Vercel password protection, `.htaccess`, etc.).
- [ ] No publicar la carpeta `products/` (archivos fuente .glb/.3dm) en el hosting — son insumos de trabajo, no assets del sitio; los archivos que sí usa el catálogo viven en `catalogo/assets/models/`.
- [ ] Agregar favicon, meta Open Graph (título/descripción/imagen) y una descripción de página más específica para SEO.
- [ ] Inicializar un repositorio Git (con un `.gitignore` que excluya `products/`) para tener historial y poder revertir cambios.
- [ ] Probar en móvil y escritorio: enlaces, videos, WhatsApp, horario y el catálogo completo (mosaico + overlay + 3D).

No requiere instalación ni compilación: es HTML/CSS/JS plano.
