/* AndiWorks · Catálogo — interacción del mosaico, overlay e idiomas.
 * Los productos llegan por window.PRODUCTS (data/productos.js). */

const PRODUCTS = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];

const track = document.querySelector('#mosaic-track');
const viewport = document.querySelector('.mosaic-viewport');
const prevBtn = document.querySelector('#mosaic-prev');
const nextBtn = document.querySelector('#mosaic-next');
const countEl = document.querySelector('#mosaic-count');
const langButtons = [...document.querySelectorAll('.lang-btn')];

const overlay = document.querySelector('#overlay');
const ovBackdrop = document.querySelector('#overlay-backdrop');
const ovClose = document.querySelector('#overlay-close');
const ovStage = document.querySelector('#ov-stage');
const ovMedia = document.querySelector('#ov-media');
const ovModeLabel = document.querySelector('#ov-mode-label');
const ovDots = document.querySelector('#ov-dots');
const ovInfo = document.querySelector('#ov-info');
const ovInfoTitle = document.querySelector('#ov-info-title');
const ovInfoMeasures = document.querySelector('#ov-info-measures');
const ovInfoText = document.querySelector('#ov-info-text');
const ovDock = document.querySelector('#ov-dock');
const dockInfoBtn = ovDock.querySelector('[data-act="info"]');
const dockMediaBtn = ovDock.querySelector('[data-act="media"]');
const dock3dBtn = ovDock.querySelector('[data-act="3d"]');
const backHome = document.querySelector('#back-home');
/* Switch "Catálogo de Productos | Catálogo Láser" bajo el título: en cada
   página, el catálogo activo es un <span> (no clickeable) y el otro un <a>
   real hacia la otra página — ver leaveToHome() más abajo, mismo mecanismo
   que ya usa el título "AndiWorks" para volver al Home. */
const catSwitchProductos = document.querySelector('#cat-switch-productos');
const catSwitchLaser = document.querySelector('#cat-switch-laser');

const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canAnimate = !prefersReduce && typeof document.createElement('div').animate === 'function';
const IS_TOUCH = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
if (IS_TOUCH) document.body.classList.add('is-touch');

/* Envoltorio de analítica (ver assets/js/analytics.js en la raíz): nunca
   debe poder romper la página si el script de analítica no cargó. */
function trackEvent(name, params) {
  if (window.AW && typeof window.AW.trackEvent === 'function') window.AW.trackEvent(name, params);
}

/* Retraso base de las cards: entran DESPUÉS de que terminan los textos. */
const CARD_ENTER_BASE = 620;
const CARD_ENTER_STEP = 60;

const I18N = {
  es: {
    catSwitch: { productos: 'Catálogo de Productos', laser: 'Catálogo Láser' },
    back: 'Volver al Home',
    dock: { info: 'Descripción', media: 'Fotos y videos', '3d': 'Ver en 3D', whatsapp: 'Consultar por WhatsApp', instagram: 'Ver en Instagram' },
    measures: 'Medidas',
    modeLabel: { media: 'Imágenes del producto', '3d': 'Modelo 3D' },
    empty: 'Catálogo en desarrollo…',
  },
  en: {
    catSwitch: { productos: 'Product Catalogue', laser: 'Laser Catalogue' },
    back: 'Back to Home',
    dock: { info: 'Description', media: 'Photos & videos', '3d': 'View in 3D', whatsapp: 'Ask on WhatsApp', instagram: 'View on Instagram' },
    measures: 'Dimensions',
    modeLabel: { media: 'Product images', '3d': '3D model' },
    empty: 'Catalogue in progress…',
  },
  zh: {
    catSwitch: { productos: '产品目录', laser: '激光产品目录' },
    back: '返回首页',
    dock: { info: '产品说明', media: '照片和视频', '3d': '查看 3D', whatsapp: '通过 WhatsApp 咨询', instagram: '在 Instagram 查看' },
    measures: '尺寸',
    modeLabel: { media: '产品图片', '3d': '3D 模型' },
    empty: '目录建设中…',
  },
};
/* Cada página de catálogo puede pisar textos puntuales (hoy: "sub" y
   "measures") definiendo window.CATALOG_I18N_OVERRIDES ANTES de cargar este
   script — así este archivo es el único con la lógica, sin copias. */
if (window.CATALOG_I18N_OVERRIDES) {
  Object.keys(window.CATALOG_I18N_OVERRIDES).forEach((lang) => {
    if (I18N[lang]) Object.assign(I18N[lang], window.CATALOG_I18N_OVERRIDES[lang]);
  });
}
let currentLang = 'es';

/* ── MOSAICO ─────────────────────────────────────────────────── */
let page = 0;
let perPage = 12;
let firstRender = true;
const CARD_GAP = 8;   /* aprox. de --card-gap, solo para el cálculo de la grilla */

/* Calcula columnas y filas para que las cards llenen SIEMPRE el área visible,
   sea cual sea la forma de la ventana (evita el gran vacío blanco en ventanas
   cuadradas). Mantiene las cards cerca de 3:4 eligiendo un ancho objetivo. */
function computeGrid() {
  const W = viewport.clientWidth || window.innerWidth;
  const H = viewport.clientHeight || window.innerHeight * 0.6;
  const ratio = 3 / 4;                                   // ancho / alto
  const target = W < 600 ? (IS_TOUCH ? 165 : 150) : W < 1000 ? 185 : 215;   // ancho de card deseado (algo más ancho en táctil: menos riesgo de toque fantasma)

  let cols = Math.max(2, Math.min(8, Math.round((W + CARD_GAP) / (target + CARD_GAP))));
  let cardW = (W - CARD_GAP * (cols - 1)) / cols;
  let cardH = cardW / ratio;

  let rows = Math.max(1, Math.min(6, Math.round((H + CARD_GAP) / (cardH + CARD_GAP))));

  let guard = 0;
  while (cardH > H && cols < 10 && guard < 6) {
    cols += 1;
    cardW = (W - CARD_GAP * (cols - 1)) / cols;
    cardH = cardW / ratio;
    rows = 1;
    guard += 1;
  }
  return { cols, rows };
}

function applyGrid() {
  const { cols, rows } = computeGrid();
  document.documentElement.style.setProperty('--cols', cols);
  document.documentElement.style.setProperty('--rows', rows);
  perPage = cols * rows;
}

function pageCount() {
  return Math.max(1, Math.ceil(PRODUCTS.length / perPage));
}

/* <img> que se revela con un fundido cuando termina de cargar (o al toque si
   ya estaba en caché), para que nunca se vea "en negro" mientras carga. */
function fadeImage(src, alt) {
  const img = document.createElement('img');
  img.alt = alt || '';
  img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
  img.src = src;
  if (img.complete) img.classList.add('is-loaded');   /* ya estaba en caché */
  return img;
}

/* Precarga toda la galería de un producto (fotos + posters) apenas se le
   pasa el cursor a su card, para que al abrir el overlay o cambiar de foto
   ya esté en caché y no haya espera. Se llama también al abrir el overlay,
   por si no hubo hover previo (teclado, táctil). */
const preloadedProducts = new Set();
function preloadGallery(product) {
  if (!product || preloadedProducts.has(product.id)) return;
  preloadedProducts.add(product.id);
  (product.media || []).forEach((m) => {
    const src = m.type === 'image' ? m.src : m.poster;
    if (src) new Image().src = src;
  });
}

/* Resuelve la portada de una card: modelo 3D (auto-rotando, sin poder
   interactuar), video (loop) o imagen — según lo que declare el producto.
   El video y el modelo 3D NO se cargan aquí: solo se les reserva el `src`
   en `data-src`. `syncPageMedia()` los activa recién cuando su página entra
   en pantalla, para no descargar de golpe todo el mosaico (ver más abajo). */
function buildCoverEl(product) {
  if (product.coverType === '3d' && product.model3d) {
    const mv = document.createElement('model-viewer');
    mv.dataset.src = product.model3d.src;
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('rotation-per-second', '22deg');
    /* Iluminación por entorno neutro + sombra de contacto suave: da volumen
       y contraste real al modelo aunque la card sea chica, en vez del look
       plano de "sin sombra" (shadow-intensity 0) que tenía antes. */
    mv.setAttribute('environment-image', 'neutral');
    mv.setAttribute('exposure', '1');
    mv.setAttribute('tone-mapping', 'neutral');
    mv.setAttribute('shadow-intensity', '0.9');
    mv.setAttribute('shadow-softness', '0.8');
    if (product.model3d.poster) mv.setAttribute('poster', product.model3d.poster);
    mv.style.pointerEvents = 'none';   /* el click lo captura la card, no el visor */
    return mv;
  }
  const cover = product.media && product.media[0];
  if (cover && cover.type === 'video') {
    const v = document.createElement('video');
    v.dataset.src = cover.src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'none';
    if (cover.poster) v.poster = cover.poster;
    return v;
  }
  if (cover) {
    const img = fadeImage(cover.src, product.name);
    img.loading = 'lazy';
    return img;
  }
  return null;
}

function buildCard(product, indexInPage, pageIndex) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card';
  card.setAttribute('aria-label', product.name);
  card._product = product;   /* el click delegado en .mosaic-track lo lee de aquí */

  if (firstRender && pageIndex === 0) {
    card.style.animationDelay = `${CARD_ENTER_BASE + indexInPage * CARD_ENTER_STEP}ms`;
  } else {
    card.style.animation = 'none';
  }

  const media = document.createElement('div');
  media.className = 'card-media';
  const coverEl = buildCoverEl(product);
  if (coverEl) media.appendChild(coverEl);
  card.appendChild(media);

  const tag = document.createElement('span');
  tag.className = 'card-tag';
  tag.textContent = product.name;
  card.appendChild(tag);

  return card;
}

/* Un solo listener delegado en vez de uno por card (igual criterio que el
   marco naranja): evita crear y recolectar 20+ funciones/listeners cada vez
   que el mosaico se reconstruye (resize, fuentes). */
track.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (card && card._product) openOverlay(card._product, card);
});

/* Solo carga y reproduce el video/modelo 3D de portada de la página VISIBLE;
   el resto queda con su `data-src` sin pedir, y los videos que se dejan de
   ver se pausan. Menos ancho de banda, CPU y batería con mosaicos grandes. */
function syncPageMedia() {
  [...track.children].forEach((pageEl, i) => {
    const active = i === page;
    pageEl.querySelectorAll('video').forEach((v) => {
      if (!active) { if (!v.paused) v.pause(); return; }
      if (v.dataset.src) { v.src = v.dataset.src; delete v.dataset.src; }
      v.play().catch(() => {});
    });
    if (active) {
      pageEl.querySelectorAll('model-viewer[data-src]').forEach((mv) => {
        mv.setAttribute('src', mv.dataset.src);
        delete mv.dataset.src;
      });
    }
  });
}

/* Placeholder mostrado cuando window.PRODUCTS todavía no tiene productos
   reales — evita que el catálogo se vea "roto" (mosaico vacío) mientras se
   completa la ficha del primero. Usa la clase .card (mismo tamaño de celda,
   misma animación de entrada/salida que una card real) más el modificador
   .mosaic-empty para el texto centrado — pero sin `_product`, así el marco
   naranja que sigue al cursor y el click delegado que abre el overlay lo
   ignoran (ver los `if (!card._product) return` más abajo). */
function buildEmptyStateCard(animate) {
  const el = document.createElement('div');
  el.className = 'card mosaic-empty';
  el.textContent = (I18N[currentLang] || I18N.es).empty;
  if (animate) el.style.animationDelay = `${CARD_ENTER_BASE}ms`;
  else el.style.animation = 'none';
  return el;
}

function renderMosaic() {
  const animatedEntrance = firstRender && canAnimate;
  applyGrid();
  page = Math.min(page, pageCount() - 1);

  track.innerHTML = '';

  if (PRODUCTS.length === 0) {
    const pageEl = document.createElement('div');
    pageEl.className = 'mosaic-page mosaic-page--empty';
    pageEl.appendChild(buildEmptyStateCard(animatedEntrance));
    track.appendChild(pageEl);
    firstRender = false;
    updateNav();
    syncScrollToPage();
    if (frame) frame.style.opacity = '0';
    return;
  }

  for (let p = 0; p < pageCount(); p += 1) {
    const pageEl = document.createElement('div');
    pageEl.className = 'mosaic-page';
    PRODUCTS.slice(p * perPage, p * perPage + perPage).forEach((product, i) => {
      pageEl.appendChild(buildCard(product, i, p));
    });
    track.appendChild(pageEl);
  }
  firstRender = false;
  updateNav();
  syncScrollToPage();

  if (animatedEntrance) {
    // El marco aparece recién cuando terminan de entrar las cards.
    frameReady = false;
    if (frame) frame.style.opacity = '0';
    const total = CARD_ENTER_BASE + Math.min(perPage, PRODUCTS.length) * CARD_ENTER_STEP + 560;
    setTimeout(revealFrame, total);
  } else {
    revealFrame();
  }
}

function updateNav() {
  const total = pageCount();
  if (!IS_TOUCH) track.style.transform = `translateX(${-page * 100}%)`;
  const pad = (n) => String(n).padStart(2, '0');
  countEl.textContent = `${pad(page + 1)} / ${pad(total)}`;
  prevBtn.disabled = page <= 0;
  nextBtn.disabled = page >= total - 1;
  syncPageMedia();
}

/* Lleva instantáneamente el scroll táctil a la página actual (sin animar):
   se usa tras un cambio estructural — resize/rechunk — no como navegación. */
function syncScrollToPage() {
  if (!IS_TOUCH) return;
  const pageEl = track.children[page];
  if (pageEl) pageEl.scrollIntoView({ behavior: 'auto', inline: 'start', block: 'nearest' });
}

function goTo(target) {
  const clamped = Math.max(0, Math.min(target, pageCount() - 1));
  if (clamped === page) return;
  page = clamped;
  if (IS_TOUCH) {
    const pageEl = track.children[page];
    if (pageEl) pageEl.scrollIntoView({ behavior: canAnimate ? 'smooth' : 'auto', inline: 'start', block: 'nearest' });
    updateNav();
  } else {
    updateNav();
    resetFrame();
  }
}

prevBtn.addEventListener('click', () => goTo(page - 1));
nextBtn.addEventListener('click', () => goTo(page + 1));

/* Flechas del teclado para cambiar de página del mosaico — solo cuando el
   overlay está cerrado (adentro, ArrowLeft/ArrowRight ya cambian de foto,
   ver onOverlayKey más abajo). */
document.addEventListener('keydown', (e) => {
  if (!overlay.hidden) return;
  if (e.key === 'ArrowRight') goTo(page + 1);
  else if (e.key === 'ArrowLeft') goTo(page - 1);
});

if (IS_TOUCH) {
  /* En táctil el mosaico se desplaza con scroll nativo (momentum + snap);
     esto solo mantiene sincronizados el contador y las flechas con el swipe. */
  let scrollTimer;
  viewport.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const idx = Math.round(viewport.scrollLeft / (viewport.clientWidth || 1));
      const clamped = Math.max(0, Math.min(idx, pageCount() - 1));
      if (clamped !== page) { page = clamped; updateNav(); }
    }, 100);
  }, { passive: true });
}

/* Reparte las cards YA EXISTENTES entre las páginas necesarias (sin recrearlas,
   para conservar su identidad y poder animarlas con FLIP). */
function rechunk() {
  const cards = [...track.querySelectorAll('.card')];
  const total = pageCount();
  while (track.children.length < total) {
    const pg = document.createElement('div');
    pg.className = 'mosaic-page';
    track.appendChild(pg);
  }
  cards.forEach((card, i) => {
    const pg = track.children[Math.floor(i / perPage)];
    if (card.parentElement !== pg) pg.appendChild(card);
  });
  while (track.children.length > total) track.lastElementChild.remove();
}

/* FLIP: mide, aplica el cambio de grilla, y desliza+escala cada card desde
   donde estaba hasta su nueva celda en vez de saltar "de golpe". */
let flipGen = 0;
function flipCards(mutate) {
  if (!canAnimate) { mutate(); resetFrame(); return; }
  const gen = ++flipGen;
  const cards = [...track.querySelectorAll('.card')];
  const first = cards.map((c) => c.getBoundingClientRect());
  cards.forEach((c) => { c.style.transition = 'none'; c.style.transform = ''; });
  mutate();
  const vw = window.innerWidth;
  const last = cards.map((c) => c.getBoundingClientRect());

  let any = false;
  cards.forEach((c, i) => {
    const f = first[i];
    const l = last[i];
    const dx = f.left - l.left;
    const dy = f.top - l.top;
    const sx = l.width ? f.width / l.width : 1;
    const sy = l.height ? f.height / l.height : 1;
    const moved = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01;
    if (!moved || Math.abs(dx) > vw * 0.85) { c.style.transform = ''; return; }   // quieta o en otra página
    any = true;
    c.style.transformOrigin = 'top left';
    c.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  });

  if (!any) { resetFrame(); return; }

  requestAnimationFrame(() => {
    if (gen !== flipGen) return;
    cards.forEach((c) => {
      if (!c.style.transform) return;
      c.style.transition = 'transform .3s cubic-bezier(.2, .9, .2, 1)';
      c.style.transform = 'translate(0, 0) scale(1, 1)';
    });
    setTimeout(() => {
      if (gen !== flipGen) return;
      cards.forEach((c) => { c.style.transition = ''; c.style.transform = ''; c.style.transformOrigin = ''; });
      resetFrame();
    }, 340);
  });
}

/* En táctil, mostrar/ocultar la barra de direcciones del navegador dispara
   "resize" con el ancho igual y el alto cambiando un poco — no es un cambio
   de forma real de la ventana, así que se ignora para no reflipar el mosaico
   por eso (ver Fase F del plan móvil). */
let lastResizeW = window.innerWidth;
let lastResizeH = window.innerHeight;
let resizeTimer;
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (IS_TOUCH && Math.abs(w - lastResizeW) < 2 && Math.abs(h - lastResizeH) < 120) {
    lastResizeW = w; lastResizeH = h;
    return;
  }
  lastResizeW = w; lastResizeH = h;

  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const before = perPage;
    flipCards(() => {
      applyGrid();
      if (perPage !== before) {
        rechunk();
        page = Math.min(page, pageCount() - 1);
      }
      if (IS_TOUCH) {
        syncScrollToPage();
        updateNav();
      } else {
        track.style.transition = 'none';
        updateNav();
        void track.offsetWidth;
        track.style.transition = '';
      }
    });
  }, 140);
});

/* ── MARCO QUE VIAJA (solo con cursor: en táctil no hay hover que seguir) ── */
const frame = IS_TOUCH ? null : document.createElement('div');
if (frame) { frame.className = 'mosaic-frame'; viewport.appendChild(frame); }
let frameReady = false;

function placeFrame(cardEl) {
  if (!frame || !cardEl) return;
  const vp = viewport.getBoundingClientRect();
  const r = cardEl.getBoundingClientRect();
  frame.style.width = `${r.width}px`;
  frame.style.height = `${r.height}px`;
  frame.style.transform = `translate(${r.left - vp.left}px, ${r.top - vp.top}px)`;
}

function resetFrame() {
  if (!frame) return;
  const pageEl = track.children[page];
  placeFrame(pageEl && pageEl.querySelector('.card'));
}

function revealFrame() {
  frameReady = true;
  if (!frame) return;
  resetFrame();
  frame.style.opacity = '1';
}

/* Un solo listener delegado en vez de uno por card. En táctil se dispara con
   el primer toque (no hay "pasar el cursor"); en escritorio, con el mouse. */
let framedCard = null;
viewport.addEventListener(IS_TOUCH ? 'touchstart' : 'pointermove', (e) => {
  const card = e.target.closest && e.target.closest('.card');
  if (!card || !card._product) return;   /* el placeholder "Catálogo en desarrollo" comparte .card pero no es clickeable */
  preloadGallery(card._product);   /* así ya está en caché si hace click/tap */
  if (!IS_TOUCH && card !== framedCard) { framedCard = card; placeFrame(card); }
}, { passive: true });
if (!IS_TOUCH) {
  /* Al salir de la franja del mosaico, el marco vuelve a la primera card. */
  viewport.addEventListener('pointerleave', () => { framedCard = null; resetFrame(); });
  /* Tras deslizar de página, recolocar sobre la primera card ya asentada. */
  track.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'transform') resetFrame();
  });
}

/* ── OVERLAY ─────────────────────────────────────────────────── */
let ovProduct = null;
let ovIndex = 0;
let ovMode = 'media';   /* 'media' (fotos/videos) | '3d' */
let ovOpener = null;

function stopStageVideo() {
  const v = ovMedia.querySelector('video');
  if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
}

function syncDockMode() {
  dockMediaBtn.classList.toggle('is-on', ovMode === 'media');
  dock3dBtn.classList.toggle('is-on', ovMode === '3d');
}

/* Rótulo en la esquina superior izquierda del stage: aclara si lo que se ve
   son las fotos del producto o el modelo 3D, sin depender solo del ícono
   resaltado en el dock (útil también en táctil, donde el dock puede no
   estar a la vista). Se muestra siempre que el overlay esté abierto. */
function updateModeLabel() {
  const t = (I18N[currentLang] || I18N.es).modeLabel;
  ovModeLabel.textContent = t[ovMode] || '';
  ovModeLabel.classList.toggle('is-visible', !!ovProduct);
}

function renderStage() {
  stopStageVideo();
  ovMedia.innerHTML = '';
  ovStage.classList.toggle('is-3d', ovMode === '3d');
  updateModeLabel();

  if (ovMode === '3d' && ovProduct.model3d) {
    const mv = document.createElement('model-viewer');
    mv.className = 'is-floating';   /* fondo transparente: el modelo "flota" en el marco */
    mv.setAttribute('src', ovProduct.model3d.src);
    mv.setAttribute('camera-controls', '');   /* orbit / zoom / pan con inercia propia del visor */
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('rotation-per-second', '45deg');   /* un poco más rápida que la de las cards (22deg) */
    mv.setAttribute('interaction-prompt', 'none');
    /* Mismo perfil de iluminación realista que la card (entorno neutro +
       tone-mapping neutro), con sombra algo más marcada porque acá el
       modelo se ve grande y a pantalla completa. */
    mv.setAttribute('environment-image', 'neutral');
    mv.setAttribute('exposure', '1');
    mv.setAttribute('tone-mapping', 'neutral');
    mv.setAttribute('shadow-intensity', '1');
    mv.setAttribute('shadow-softness', '0.7');
    ovMedia.appendChild(mv);
    ovDots.innerHTML = '';   /* fila vacía: mismo min-height reservado, el dock no se mueve */
    return;
  }

  const m = ovProduct.media[ovIndex];
  if (!m) return;
  if (m.type === 'video') {
    const v = document.createElement('video');
    v.src = m.src;
    v.controls = true;
    v.autoplay = true;
    v.loop = true;
    v.playsInline = true;
    if (m.poster) v.poster = m.poster;
    ovMedia.appendChild(v);
    v.play().catch(() => {});
  } else {
    ovMedia.appendChild(fadeImage(m.src, ovProduct.name));
  }
  ovDots.innerHTML = '';
  ovProduct.media.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'ov-dot' + (i === ovIndex ? ' is-active' : '');
    dot.setAttribute('aria-label', `Medio ${i + 1}`);
    dot.addEventListener('click', () => { if (i === ovIndex) return; ovIndex = i; renderStageAnimated(); });
    ovDots.appendChild(dot);
  });
}

function stepMedia(dir) {
  const n = ovProduct.media.length;
  ovIndex = (ovIndex + dir + n) % n;
  renderStageAnimated();
}

/* Swipe (izq/der) o tap sobre la foto para cambiar de imagen (solo en modo
   "Fotos y videos" — en 3D el gesto lo usa el propio <model-viewer>). Se
   ignora sobre <video>: ahí manda el control nativo (play/pausa).
   Usa Pointer Events con umbrales propios en vez de 'click': un 'click'
   sintetizado desde touch se cancela en Chrome/Android apenas hay un
   pequeño desplazamiento del dedo entre touchstart y touchend (a diferencia
   de Safari/iOS, más tolerante), lo que hacía que el tap pareciera no
   funcionar en Android. Calculando nosotros mismos distancia y tiempo entre
   pointerdown/pointerup no dependemos de esa heurística del navegador. */
if (IS_TOUCH) {
  const SWIPE_MIN_DIST = 40;   // px horizontales mínimos para contar como swipe
  const TAP_MAX_DIST = 10;     // px de tolerancia para que cuente como tap
  const TAP_MAX_TIME = 500;    // ms
  let dragId = null;
  let startX = 0;
  let startY = 0;
  let startT = 0;

  ovMedia.addEventListener('pointerdown', (e) => {
    if (ovMode !== 'media' || !ovProduct || ovProduct.media.length < 2) return;
    if (e.target.tagName === 'VIDEO') return;
    dragId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startT = Date.now();
  });

  ovMedia.addEventListener('pointerup', (e) => {
    if (dragId === null || e.pointerId !== dragId) return;
    dragId = null;
    if (ovMode !== 'media' || !ovProduct || ovProduct.media.length < 2) return;
    if (e.target.tagName === 'VIDEO') return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) >= SWIPE_MIN_DIST && Math.abs(dx) > Math.abs(dy)) {
      stepMedia(dx < 0 ? 1 : -1);   // desliza a la izquierda -> siguiente
    } else if (Math.abs(dx) <= TAP_MAX_DIST && Math.abs(dy) <= TAP_MAX_DIST
      && Date.now() - startT <= TAP_MAX_TIME) {
      stepMedia(1);
    }
  });

  ovMedia.addEventListener('pointercancel', (e) => {
    if (e.pointerId === dragId) dragId = null;
  });
}

/* Cruce rápido (fundido + leve escala) entre "Fotos y videos" y "3D", para que
   el cambio de contenido del stage no sea abrupto.
   OJO: la animación de salida usa fill:'forwards' para mantener el elemento
   invisible durante el intervalo. Si se pierde su referencia (p. ej. al
   reemplazar el array en vez de acumular), nunca se cancela y sigue
   "reteniendo" opacity:0 por debajo para siempre — el stage queda invisible
   en cuanto la de entrada termina y se libera (se veía negro / el 3D
   desaparecía), y como #ov-media es un único elemento reutilizado por TODAS
   las cards, esa fuga contamina también la próxima card que se abra, aunque
   no tenga 3D. Por eso: se acumulan (push, no reemplazo) y se cancelan
   TODAS al terminar el ciclo, y también al abrir o cerrar el overlay. */
let stageSwapGen = 0;
let stageAnims = [];
function killStageAnims() {
  stageAnims.forEach((a) => a.cancel());
  stageAnims = [];
}
function resetStageAnims() {
  stageSwapGen += 1;   /* invalida cualquier onfinish pendiente de un ciclo anterior */
  killStageAnims();
}
function renderStageAnimated() {
  if (!canAnimate) { renderStage(); return; }
  const gen = ++stageSwapGen;
  killStageAnims();
  const out = ovMedia.animate(
    [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.96)' }],
    { duration: 130, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' },
  );
  stageAnims.push(out);
  out.onfinish = () => {
    if (gen !== stageSwapGen) return;
    renderStage();
    const back = ovMedia.animate(
      [{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 210, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'backwards' },
    );
    stageAnims.push(back);
    back.onfinish = () => { if (gen === stageSwapGen) killStageAnims(); };
  };
}

function setMode(mode) {
  if (mode === ovMode || (mode === '3d' && !ovProduct.model3d)) return;
  ovMode = mode;
  ovIndex = 0;
  syncDockMode();
  renderStageAnimated();
  trackEvent('product_view_mode', { product_id: ovProduct.id, mode: mode });
}

function setInfoVisible(show) {
  ovInfo.classList.toggle('is-visible', show);
  dockInfoBtn.classList.toggle('is-on', show);
}

/* Título / medidas / descripción del producto abierto, en el idioma actual.
   La usan tanto la apertura del overlay como el cambio de idioma en caliente. */
function renderInfoText() {
  if (!ovProduct) return;
  const t = I18N[currentLang] || I18N.es;
  ovInfoTitle.textContent = ovProduct.name;
  const dims = ovProduct.dimensions || [];
  ovInfoMeasures.textContent = dims.length ? `${t.measures}: ${dims.join(' | ')}` : '';
  ovInfoMeasures.hidden = !dims.length;
  ovInfoText.textContent = ovProduct.description || '';
}

function openOverlay(product, opener) {
  clearTimeout(closeTimer);
  overlay.classList.remove('is-closing');
  resetStageAnims();   /* corta cualquier animación de swap que hubiera quedado colgando */
  preloadGallery(product);   /* por si se abrió sin pasar antes el cursor por la card (táctil/teclado) */
  ovProduct = product;
  ovIndex = 0;
  ovOpener = opener || null;
  ovMode = (product.coverType === '3d' && product.model3d) ? '3d' : 'media';
  trackEvent('product_view', { product_id: product.id, product_name: product.name, category: product.category || '' });

  renderInfoText();
  setInfoVisible(true);   /* la descripción va activada por defecto, en escritorio y en táctil */

  dock3dBtn.hidden = !product.model3d;

  const wa = ovDock.querySelector('[data-act="whatsapp"]');
  wa.href = `${product.links.whatsapp}?text=${encodeURIComponent('Hola AndiWorks, me interesa: ' + product.name)}`;
  ovDock.querySelector('[data-act="instagram"]').href = product.links.instagram;

  renderStage();
  syncDockMode();
  overlay.hidden = false;
  document.addEventListener('keydown', onOverlayKey);
  ovClose.focus();
}

function finishClose() {
  stopStageVideo();
  resetStageAnims();   /* si se cerró a media animación, no dejar nada colgando */
  overlay.hidden = true;
  overlay.classList.remove('is-closing');
  document.removeEventListener('keydown', onOverlayKey);
  if (ovOpener) ovOpener.focus();
  ovProduct = null;
}

let closeTimer;
function closeOverlay() {
  if (overlay.hidden || overlay.classList.contains('is-closing')) return;
  document.removeEventListener('keydown', onOverlayKey);
  if (!canAnimate) { finishClose(); return; }
  overlay.classList.add('is-closing');
  clearTimeout(closeTimer);
  closeTimer = setTimeout(finishClose, 140);
}

function onOverlayKey(e) {
  if (e.key === 'Escape') closeOverlay();
  else if (ovMode === 'media' && e.key === 'ArrowRight') stepMedia(1);
  else if (ovMode === 'media' && e.key === 'ArrowLeft') stepMedia(-1);
}

ovDock.addEventListener('click', (e) => {
  const btn = e.target.closest('.dock-btn');
  if (!btn || btn.hidden) return;
  const act = btn.dataset.act;
  if (act === 'info') {
    setInfoVisible(!ovInfo.classList.contains('is-visible'));
  } else if (act === 'media') {
    setMode('media');
  } else if (act === '3d') {
    setMode('3d');
  } else if (act === 'whatsapp') {
    trackEvent('whatsapp_click', { product_id: ovProduct.id, product_name: ovProduct.name });
  } else if (act === 'instagram') {
    trackEvent('instagram_click', { product_id: ovProduct.id, product_name: ovProduct.name });
  }
  /* whatsapp / instagram: son <a>, siguen su href — solo se registra el click */
});

ovBackdrop.addEventListener('click', closeOverlay);
ovClose.addEventListener('click', closeOverlay);

/* ── SALIDA: "Volver al Home" (desde el botón de abajo o el título AndiWorks) ── */
function leaveToHome(href, eventName) {
  return (e) => {
    trackEvent(eventName);
    if (!canAnimate) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    if (frame) frame.style.opacity = '0';   /* el marco se va con los textos (gana al inline opacity:1) */
    const pageEl = track.children[page];
    const cards = pageEl ? [...pageEl.querySelectorAll('.card')] : [];
    cards.forEach((c, i) => { c.style.transitionDelay = `${140 + i * 40}ms`; });
    const wait = Math.min(140 + cards.length * 40 + 320, 1300);
    setTimeout(() => { window.location.href = href; }, wait);
  };
}

/* `.leaving` nunca se saca por su cuenta (se agrega justo antes de navegar
   al Home). Si el usuario vuelve con "atrás" del navegador y este entra
   desde bfcache (sin re-ejecutar el script), la página quedaría con todo en
   opacity:0 — mismo fix que en assets/js/main.js. */
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  document.body.classList.remove('leaving');
  if (frame && frameReady) frame.style.opacity = '1';
});
backHome.addEventListener('click', leaveToHome(backHome.getAttribute('href'), 'catalog_back_home'));
const brandHome = document.querySelector('#brand-home');
if (brandHome) brandHome.addEventListener('click', leaveToHome(brandHome.getAttribute('href'), 'catalog_brand_click'));

/* El catálogo activo es un <span> (no navega); el otro es un <a> real —
   solo ese recibe el click con la misma animación de salida. */
[catSwitchProductos, catSwitchLaser].forEach((el) => {
  if (el && el.tagName === 'A') el.addEventListener('click', leaveToHome(el.getAttribute('href'), 'catalog_switch_click'));
});

/* ── IDIOMAS ─────────────────────────────────────────────────── */
/* Mismo defecto que ya se corrigió en el swap del stage: la animación de
   salida usa fill:'forwards' para retener opacity:0 durante el corte; si no
   se cancela explícitamente queda "reteniendo" ese opacity:0 para siempre en
   cuanto la de entrada termine y se libere (el texto desaparecía tras el
   cambio de idioma). Se rastrea por elemento (un WeakMap, porque fadeSwap se
   usa en más de un elemento a la vez) y se cancelan ambas al cerrar el ciclo. */
const fadeAnims = new WeakMap();
function killFade(el) {
  const anims = fadeAnims.get(el);
  if (!anims) return;
  anims.forEach((a) => a.cancel());
  fadeAnims.delete(el);
}
function fadeSwap(el, apply) {
  if (!canAnimate) { apply(); return; }
  killFade(el);
  const anims = [];
  fadeAnims.set(el, anims);
  const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 130, easing: 'ease', fill: 'forwards' });
  anims.push(out);
  out.onfinish = () => {
    apply();
    const back = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease', fill: 'backwards' });
    anims.push(back);
    back.onfinish = () => killFade(el);
  };
}

function applyLang(lang, animate) {
  currentLang = I18N[lang] ? lang : 'es';
  const t = I18N[currentLang];
  document.documentElement.lang = currentLang;
  langButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.lang === currentLang));
  try { localStorage.setItem('aw-lang', currentLang); } catch (e) {}

  ovDock.querySelectorAll('.dock-btn').forEach((btn) => {
    const label = t.dock[btn.dataset.act];
    if (label) { btn.setAttribute('aria-label', label); btn.title = label; }
  });
  if (ovProduct && !overlay.hidden) { renderInfoText(); updateModeLabel(); }

  const emptyEl = track.querySelector('.mosaic-empty');
  if (emptyEl) emptyEl.textContent = t.empty;

  if (animate) {
    if (catSwitchProductos) fadeSwap(catSwitchProductos, () => { catSwitchProductos.textContent = t.catSwitch.productos; });
    if (catSwitchLaser) fadeSwap(catSwitchLaser, () => { catSwitchLaser.textContent = t.catSwitch.laser; });
    fadeSwap(backHome, () => { backHome.innerHTML = `${t.back}&nbsp;&rarr;`; });
  } else {
    if (catSwitchProductos) catSwitchProductos.textContent = t.catSwitch.productos;
    if (catSwitchLaser) catSwitchLaser.textContent = t.catSwitch.laser;
    backHome.innerHTML = `${t.back}&nbsp;&rarr;`;
  }
}

function detectLang() {
  try {
    const saved = localStorage.getItem('aw-lang');
    if (saved && I18N[saved]) return saved;
  } catch (e) {}
  const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'es'];
  for (const raw of list) {
    const code = String(raw || '').toLowerCase();
    if (code.startsWith('zh')) return 'zh';
    if (code.startsWith('en')) return 'en';
    if (code.startsWith('es')) return 'es';
  }
  return 'es';
}

langButtons.forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.lang !== currentLang) { trackEvent('lang_change', { lang: b.dataset.lang }); applyLang(b.dataset.lang, true); }
}));

[...document.querySelectorAll('.top-bar .social-link')].forEach((a) => a.addEventListener('click', () => {
  trackEvent('social_click', { network: a.dataset.brand, from: 'catalog' });
}));

/* ── INIT ────────────────────────────────────────────────────── */
renderMosaic();
applyLang(detectLang());
/* Al cargar las fuentes cambian las alturas de las barras: recalcula la grilla. */
document.fonts?.ready.then(() => {
  const before = perPage;
  applyGrid();
  if (perPage !== before) renderMosaic();
  else if (frameReady) resetFrame();
});
