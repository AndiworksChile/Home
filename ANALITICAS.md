# Analíticas de AndiWorks — cómo funcionan y qué mirar

Instaladas en el **Home** (`index.html`) y el **catálogo** (`catalogo/index.html`). **No están en `catalogo/admin/`** (la herramienta interna) a propósito, para no ensuciar los datos con tu propio uso.

Todo el código vive en un solo archivo: **`assets/js/analytics.js`**. Ahí están los IDs de GA4 y Clarity, y la función `trackEvent()` que usan `assets/js/main.js` (Home) y `catalogo/assets/js/main.js` (catálogo) para avisar cuando pasa algo relevante. Si en algún momento cambias un ID, solo hay que tocarlo en ese archivo. Cloudflare Web Analytics NO está en este archivo — ver sección 2.

---

## 1. Google Analytics 4 (GA4)

**Qué es:** la analítica "completa" — de dónde viene la gente (Instagram, Google, directo), qué páginas ve, cuánto se queda, y ahora además los eventos personalizados que configuramos (ver más abajo).

**Dónde mirar:** [analytics.google.com](https://analytics.google.com) → tu propiedad → **Informes**.

- **Informes → Adquisición de tráfico**: de dónde llega la gente. Esto responde "¿me sirve más publicar en Instagram o compartir el link por WhatsApp?".
- **Informes → Interacción → Eventos**: acá van a aparecer los eventos personalizados que configuramos (lista abajo). Es la parte más útil para decisiones de catálogo.
- **Informes en tiempo real**: para confirmar que algo que acabas de hacer (ej. compartir el link) sí está generando visitas, al momento.
- **Explorar** (menú izquierdo): para cruzar datos, ej. "de los que vieron el producto X, cuántos hicieron click a WhatsApp" — más avanzado, pero es donde realmente se sacan conclusiones de conversión.

**Eventos que configuramos y qué significan:**

| Evento | Cuándo se dispara | Para qué sirve |
|---|---|---|
| `home_button_click` | Click en "Ver el catálogo", "Diseñar una idea" o el botón bloqueado del espejo | Ver qué opción del menú principal elige más la gente |
| `bio_open` / `bio_close` | Abrir / cerrar la sección "Historia" | Saber si a la gente le interesa leer sobre la marca |
| `lang_change` | Cambio de idioma (ES/EN/中) | Saber si vale la pena invertir en traducir más contenido |
| `social_click` | Click en los íconos de WhatsApp/Instagram/Facebook del header | Distingue entre el contacto "directo" del header y el que sale desde un producto específico |
| `product_view` | Se abre el overlay de un producto (con `product_id`, `product_name`, `category`) | **El más importante**: qué productos generan más interés real |
| `product_view_mode` | Cambia entre "Fotos y videos" y "Modelo 3D" dentro de un producto | Si la gente realmente usa el visor 3D o lo ignora — dato clave para decidir en qué productos vale la pena invertir tiempo en modelar |
| `whatsapp_click` / `instagram_click` | Click en esos botones **dentro del overlay de un producto** (con `product_id`) | **El dato que más importa para vender**: qué producto específico hizo que alguien te escribiera |
| `catalog_back_home` | Click en "Volver al Home" desde el catálogo | Qué tan seguido la gente entra al catálogo y se devuelve sin actuar |

**Cómo leerlo en la práctica:** en Eventos, filtra por `whatsapp_click` y mira el parámetro `product_name` — ese es literalmente el ranking de "qué producto vende más consultas". Compáralo con `product_view` del mismo producto para sacar una tasa de conversión (de cuántos lo miran, cuántos escriben).

---

## 2. Cloudflare Web Analytics

**Qué es:** una analítica mínima y muy liviana, pensada solo para números generales — no tiene eventos personalizados ni details de comportamiento. Su valor es que no depende de cookies ni de que el navegador del visitante no bloquee el script (es más difícil de bloquear que Google Analytics).

**Dónde mirar:** dashboard de Cloudflare → **Analytics & Logs → Web Analytics** → tu sitio.

- **Visitas y páginas vistas**: el número "de verdad", casi sin distorsión de bloqueadores de anuncios — sirve como contraste si GA4 te muestra números que parecen bajos (algunos visitantes bloquean GA pero no esto).
- **Core Web Vitals** (LCP, CLS, INP): qué tan rápido carga el sitio para visitantes reales. Como el catálogo tiene modelos 3D, vale la pena revisar esto cada tanto — si empieza a empeorar, es señal de que algún modelo quedó muy pesado.
- **Países / referrers**: de dónde llega el tráfico, a nivel más básico que GA4.

**Cómo se activa:** como `andiworks.cl` está proxiado por Cloudflare (nube naranja), no hace falta ningún snippet en el código — se activa **inyección automática** desde el dashboard (Web Analytics → agregar el sitio → setup automático) y Cloudflare mismo inserta el beacon en cada página, reportando a `andiworks.cl/cdn-cgi/rum` (mismo origen, sin errores de CORS). Antes había además un snippet manual pegado en `analytics.js` apuntando a `cloudflareinsights.com/cdn-cgi/rum` — se sacó porque duplicaba el conteo y, al no estar el sitio dado de alta para setup manual, tiraba 404 + CORS en consola.

---

## 3. Microsoft Clarity

**Qué es:** la única de las 3 que te deja **ver** cómo usa la gente el sitio, no solo contar qué hizo. Dos herramientas dentro de Clarity:

- **Grabaciones de sesión**: literalmente ves el mouse/dedo de un visitante moverse por el sitio, como un video. Sirve para detectar fricción que ningún número te va a mostrar (ej. alguien intentando hacer click en algo que no es clickeable, o dudando mucho antes de cerrar el catálogo).
- **Mapas de calor (heatmaps)**: dónde hace click y hasta dónde hace scroll la gente, agregado de muchas sesiones. En el catálogo esto es oro: te muestra si la gente scrollea hasta el final del mosaico o se queda solo en la primera página.

**Dónde mirar:** [clarity.microsoft.com](https://clarity.microsoft.com) → tu proyecto.

- **Recordings**: filtra por "Rage clicks" o "Dead clicks" (Clarity los detecta solo) — son la señal más directa de "algo en la interfaz confundió a alguien".
- **Heatmaps → Scroll**: para saber si el mosaico necesita menos productos por página o si la gente sí explora todo.
- **Dashboard principal**: también manda los eventos custom (`bio_open`, `product_view`, etc.) como "Custom Tags" — puedes filtrar grabaciones por "vio tal producto" y mirar exactamente qué hizo esa persona antes y después.

**Diferencia clave con GA4:** GA4 te da los números ("100 personas vieron la Mesa Delta"); Clarity te deja *ver* a 5 de esas 100 personas navegando, para entender el "por qué" detrás del número.

---

## Cómo se complementan (flujo de diagnóstico sugerido)

1. **GA4 → Eventos**: detectas *qué* está pasando (ej. "el producto X tiene muchas vistas pero pocos `whatsapp_click`").
2. **Clarity → Recordings filtradas por ese producto**: ves grabaciones reales de gente mirando ese producto, para entender *por qué* no escriben (¿no encuentran el botón de WhatsApp? ¿se van apenas ven que no hay precio?).
3. **Cloudflare Web Analytics**: lo revisas de vez en cuando como chequeo de salud general (visitas totales, velocidad) — no para decisiones de contenido, sino de rendimiento técnico.

Con las 3 juntas puedes pasar de "no sé qué funciona" a "el producto X genera interés pero algo en el overlay no convierte" — que es exactamente el tipo de decisión que pediste poder tomar.
