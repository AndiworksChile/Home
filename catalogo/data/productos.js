/* AndiWorks · Catálogo — datos de productos.
 *
 * Se dejó un único producto real de referencia ("Mesa de trabajo de
 * título") — los demás productos de prueba se quitaron a propósito. Los
 * productos nuevos se agregan manualmente desde el código, pegando un
 * objeto con esta misma forma dentro del array `window.PRODUCTS` (es
 * exactamente el formato que genera el formulario interno en
 * catalogo/admin/, botón "Generar código del producto").
 *
 * Convención de carpetas: cada producto tiene su propia carpeta en
 * catalogo/assets/products/, nombrada "NN-nombre-del-producto" (NN = número
 * de dos dígitos, en el orden en que se van incorporando) — así el
 * Finder/Explorador los ordena por número y no alfabéticamente. El
 * formulario interno ahora pide ese número al principio de la ficha y arma
 * el nombre de carpeta y de archivos solo.
 *
 * Este producto usa ese mismo esquema: catalogo/assets/products/01-mesa-de-trabajo-de-titulo/
 * (todavía vacía — las fotos reales se agregan ahí a mano). Las 4 fotos de
 * abajo son de relleno (Lorem Picsum) hasta que se reemplacen por las
 * reales; el modelo 3D SÍ es real (assets/models/mesa-trabajo-completa.glb).
 *
 * Forma de cada producto:
 *   id, name, category, year
 *   description   texto corto (se usa en el botón (i) del overlay)
 *   dimensions    medidas ya formateadas — solo las que estén activas (0 a 3)
 *   media[]       galería para "Fotos y videos". { type:'image'|'video', src, poster? }
 *   model3d       { src, poster } | null — modelo para el botón "3D" (si existe)
 *   coverType     'media' (por defecto) | '3d' — qué usa la CARD como portada
 *   links         { whatsapp, instagram }
 *
 * Se expone como `window.PRODUCTS` (script clásico) para que el catálogo
 * funcione también abriendo el archivo directo, sin servidor. Cuando haya
 * backend/servidor, migrar a `data/productos.json` + fetch().
 */

/* Catálogo vacío a propósito por ahora: sin fichas reales listas para
   mostrar, window.PRODUCTS queda en [] y el mosaico cae solo en su estado
   "Catálogo en desarrollo…" (ver assets/js/catalog-app.js, renderMosaic()).
   El producto de referencia queda comentado abajo — descomentarlo (y
   quitarle el "// " a cada línea) apenas haya fotos reales para reemplazar
   las de relleno (Lorem Picsum). */
window.PRODUCTS = [
  // {
  //   id: '01-mesa-de-trabajo-de-titulo',
  //   name: 'Mesa de trabajo de título',
  //   category: 'Mobiliario',
  //   year: '2026',
  //   description: 'Descripción pendiente — completar con el detalle real del producto.',
  //   dimensions: [],
  //   media: [
  //     { type: 'image', src: 'https://picsum.photos/seed/mesa-trabajo-1/600/800' },
  //     { type: 'image', src: 'https://picsum.photos/seed/mesa-trabajo-2/600/800' },
  //     { type: 'image', src: 'https://picsum.photos/seed/mesa-trabajo-3/600/800' },
  //     { type: 'image', src: 'https://picsum.photos/seed/mesa-trabajo-4/600/800' },
  //   ],
  //   model3d: {
  //     src: 'assets/models/mesa-trabajo-completa.glb',
  //     poster: 'https://picsum.photos/seed/mesa-trabajo-m/600/800',
  //   },
  //   coverType: '3d',
  //   links: { whatsapp: 'https://wa.me/56953706307', instagram: 'https://www.instagram.com/andiworks.cl/' },
  // },
];
