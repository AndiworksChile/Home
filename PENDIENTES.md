# AndiWorks — Pendientes y hoja de ruta

Checklist viva del proyecto. La vamos marcando a medida que avanzamos para no perder de vista qué falta. Orden = prioridad de ejecución (no estricta: podemos saltar entre fases si tiene sentido).

## Fase 0 — Fundaciones técnicas

- [x] Modelo 3D real cargando con iluminación/sombras realistas (card + overlay)
- [x] Rótulo de modo en el overlay ("Imágenes del producto" / "Modelo 3D")
- [x] Animación de cambio de foto/video en el overlay unificada (antes solo animaba a veces)
- [x] Animación de salida del video de fondo del Home al ir al catálogo
- [x] Formulario interno de productos (`catalogo/admin/`)
- [x] `productos.js` optimizado (7.4 MB → 6 KB; el modelo 3D se referencia por ruta, no embebido)
- [x] README actualizado al estado real del proyecto
- [x] Meta tags básicas (description, Open Graph, theme-color) en Home y catálogo
- [x] Analíticas: Google Analytics + Cloudflare Web Analytics + Microsoft Clarity (con eventos de negocio: vistas de producto, clicks a WhatsApp/Instagram, uso del 3D, idioma, etc.)
- [x] Documento explicando qué mide cada herramienta de analítica y qué mirar (`ANALITICAS.md`)
- [ ] Inicializar repositorio Git (con `.gitignore` para `products/` y decidir qué hacer con `catalogo/admin/`)
- [ ] Decidir visibilidad del repo (público/privado) — condiciona si `admin/` puede ir versionado
- [x] Favicon SVG (`assets/logo-web.svg`) y apple-touch-icon (`assets/logo-ios.png`, 750×750 sin transparencia) enlazados en las 4 páginas (Home, catálogo, catálogo láser, admin)
- [x] Íconos Android (`assets/logo-android192.png`, `assets/logo-android512.png`) + `manifest.json` (raíz) para "Agregar a pantalla de inicio" en Android/Chrome — enlazado en Home y ambos catálogos
- [x] Imagen Open Graph (`assets/logo-opengraph1200x600.png`, proporción 1200×630 real) + `og:image`/`twitter:image` (`summary_large_image`) en Home y ambos catálogos
- [x] `CNAME` (`andiworks.cl`), `sitemap.xml`, `robots.txt` (bloquea `/catalogo/admin/` de buscadores) y `.well-known/security.txt` agregados en la raíz, listos para cuando se publique el repo

## Fase 1 — Contenido real

- [x] Sección "Historia" (botón "Quién soy / Cómo trabajo" en el Home, con transición propia y texto real)
- [x] Sección "Corte y Grabado Láser" en el Home (color/video propio, dos sub-opciones: Catálogo láser y Cotizador)
- [x] Catálogo exclusivo de Corte y Grabado Láser (`catalogo-laser/`, misma estructura/lógica que `catalogo/`, acento teal)
- [x] 38 productos reales cargados en `catalogo-laser/data/productos.js`, adaptados desde el catálogo comercial de un proyecto anterior (`Proyectos antiguos/menupage/catalogo-comercial/`) — 162 fotos copiadas a `catalogo-laser/assets/products/<slug>/`
- [x] Rótulo "Medidas" → "Año" en el catálogo láser (solo ahí; el catálogo de productos sigue igual)
- [x] Convención de carpetas por número (`NN-nombre-producto`) — aplicada al único producto real del catálogo de productos y al Formulario de productos (nuevo campo "Número de producto" que arma automáticamente carpeta/nombres/id)
- [x] Catálogo de productos reducido a un solo producto real ("Mesa de trabajo de título", con su carpeta `catalogo/assets/products/01-mesa-de-trabajo-de-titulo/` vacía) — los demás se agregan manualmente desde el código
- [x] Decisión tomada: la carpeta fuente original (`Proyectos antiguos/menupage/catalogo-comercial/` y su gemela `productos-fabricados/`) se conserva sin tocar — no se elimina
- [ ] Comprimir las fotos de `catalogo-laser/assets/products/parrilleros-con-camisa-02/` (~7 MB, el resto de productos pesa 0.5 MB o menos en total)
- [x] Función del botón "Cotizador" definida: ahora se llama "Servicio de corte y grabado láser" y abre WhatsApp en pestaña nueva con un mensaje precargado pidiendo el archivo vectorial (.dxf/.dwg/.ai) con líneas de corte y grabado diferenciadas
- [ ] Fotos reales del producto "Mesa de trabajo de título" (reemplazar Lorem Picsum, van en su carpeta ya creada)
- [x] Modelo 3D real para "Mesa de trabajo de título" (`assets/models/mesa-trabajo-completa.glb`) — tarea abierta y continua: cada producto nuevo que use portada 3D necesita su propio `.glb` (comprimido, ideal 1–3 MB) al incorporarlo
- [ ] Definir política de precios (rango visible / "desde $X" / solo cotización — pero como decisión consciente)

## Fase 1.5 — Adaptación móvil (en curso)

- [x] Carpetas de `catalogo-laser` renombradas a `NN-nombre-producto` (número primero)
- [x] Bug real: "Volver al menú" (Historia/Láser) no se desvanecía si se cerraba justo después de abrir — una animación de entrada aún activa le ganaba a la transición de salida
- [x] Bug real: al navegar a "Catálogo láser" desde dentro de la subsección, "Volver al menú" no estaba en la lista de elementos que se desvanecen (`.leaving`) y quedaba visible hasta cargar la página siguiente
- [x] Quitado el tinte de color sobre el video de fondo (`.color-wash`) — el color ahora vive solo en los botones (`--btn-rgb`, vía `data-theme`), independiente del fondo
- [x] Quitada la espera artificial de 750ms en táctil: el tap ahora dispara la animación de salida/entrada de inmediato
- [x] Fondo en modo reel ambiental para táctil: los 5 videos se van mostrando uno tras otro en loop, sin relación con lo que se toque — se pausa si la pestaña queda en segundo plano y no se activa con "reducir movimiento"
- [x] Probado en dispositivo real vía servidor local en red — "funciona bastante bien"
- [x] Descripción del overlay activada por defecto en ambos catálogos (antes solo en escritorio)
- [x] Cambio de foto en el overlay táctil: de swipe (impreciso) a tap simple, en cualquier lado de la imagen
- [x] Ícono del dock "Fotos y videos" cambiado de uno tipo video (rectángulo + play) a uno tipo imagen (rectángulo + paisaje) — en catálogo, catálogo láser y el formulario interno
- [x] El botón bloqueado ("espejo paramétrico") ahora muestra "¡Próximamente!" también al tocarlo en táctil, no solo al pasar el mouse
- [x] Contraste del nombre en la card cuando la portada es clara (ej. poster gris de un modelo 3D): degradé más fuerte en táctil + sombra de texto siempre presente, independiente de qué haya detrás
- [x] **Refactor: `catalogo/` y `catalogo-laser/` ya no duplican CSS/JS.** Ambos main.js eran casi idénticos (solo 6 líneas de texto distintas) y las hojas de estilo solo diferían en el color de acento — eso es exactamente el tipo de duplicación que hace que un fix se aplique a uno y se olvide en el otro. Ahora comparten `assets/css/catalog-app.css` y `assets/js/catalog-app.js` (en la raíz); cada catálogo solo define su `index.html`, sus datos, y (catalogo-laser) un `theme.css` de 5 líneas con el acento teal + un pequeño `window.CATALOG_I18N_OVERRIDES` para los 2 textos que cambian por idioma. Un fix futuro en la lógica compartida aplica a los dos catálogos a la vez, sin volver a pasar esto.
- [ ] Confirmar en el teléfono que el tap para cambiar de foto funciona también en el producto con modelo 3D después de este refactor (el código ya estaba unificado antes del cambio — probable causante real: caché del navegador en esa página específica)
- [ ] `.laser-options` y `.menu-footer` en pantallas angostas (no se ha probado su quiebre en anchos chicos)
- [ ] Repasar catálogo, catálogo láser y formulario interno en anchos móviles (se construyeron mirando principalmente escritorio)
- [x] Subsección "Corte y grabado láser": "Volver al menú" ahora es una caja igual a los demás botones (antes un link delgado sin borde), con flechas de hover propias que siguen a los 3 botones, y entrada escalonada corregida (usaba `:nth-of-type`, que cuenta por etiqueta y no por clase — dos botones entraban a la vez por error)
- [x] Switch "Catálogo de Productos | Catálogo Láser" bajo el título en ambos catálogos — el activo en negrita, el inactivo en gris claro y clickeable (navega al otro catálogo con la misma animación de salida que "Volver al Home")
- [x] Flechas de teclado (← →) para cambiar de página del mosaico en ambos catálogos, sin interferir con las flechas dentro del overlay (que cambian de foto)
- [x] Bug real: los botones del dock del overlay y la (X) de cerrar quedaban con pinta de "apretados" en móvil después de soltar el dedo — el navegador simula `:hover` al tocar y no lo suelta hasta el próximo toque; se separó `:hover` (solo mouse, `@media (hover: hover)`) de `:active`/`:focus-visible`
- [x] Descripciones del catálogo láser: se quitaron palabras duplicadas entre el subtítulo y la lista de materiales de la misma descripción (ej. "Personalizado" apareciendo dos veces), y se sacó "personalizado" del subtítulo en general (ya se entiende que todo el catálogo es a medida)

## Fase 2 — Descubribilidad (a medida que crece el catálogo)

- [ ] Enlaces compartibles por producto (ej. `#producto=mesa-delta` abre el overlay directo)
- [ ] Filtros por categoría en el mosaico (el dato `category` ya existe, falta la UI)

## Fase 3 — SEO estructural y escalamiento (no urgente hoy)

- [ ] Páginas indexables por producto (título/descripción/imagen propios + datos estructurados) — cuando se invierta en SEO/Ads o el catálogo crezca mucho
- [ ] Migrar de "pegar código a mano" a algo más robusto (JSON editable o CMS liviano) — cuando el catálogo supere ~30-40 productos

## Notas sueltas / decisiones pendientes

- El botón "Quiero un espejo paramétrico" queda bloqueado ("¡Próximamente!") — definir plazo: o se termina pronto, o se oculta mientras tanto (un CTA bloqueado por mucho tiempo se lee como sitio inconcluso).
- `products/` (10.8 MB de `.glb`/`.3dm` fuente) no debería publicarse en el hosting final — son insumos de trabajo, no assets del sitio.
