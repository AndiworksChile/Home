/* AndiWorks · Product builder (uso interno)
 * Arma la ficha de un producto para catalogo/ o catalogo-laser/:
 *   - lee los productos ya publicados para sugerir el próximo número y
 *     avisar si un número ya está ocupado,
 *   - toma los archivos reales (arrastrados o elegidos), respeta su formato
 *     y propone el nombre final de cada uno,
 *   - toma el modelo 3D (.glb) opcional, con vista previa y opción de
 *     usarlo como portada de la card,
 *   - descarga un .zip con la carpeta y los archivos ya renombrados,
 *   - genera el objeto listo para pegar en data/productos.js.
 * No hay backend: nada se sube a ningún lado, todo ocurre en el navegador. */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const CATALOGS = {
  laser: {
    label: 'Láser',
    data: '../../catalogo-laser/data/productos.js',
    file: 'catalogo-laser/data/productos.js',
    dest: 'catalogo-laser/assets/products/',
    descHint: '(Tipo | material, detalle, …)',
    descPh: 'Letrero de mesón | Acrílico blanco, Espejo dorado, Corte láser.',
  },
  muebles: {
    label: 'Muebles',
    data: '../data/productos.js',
    file: 'catalogo/data/productos.js',
    dest: 'catalogo/assets/products/',
    descHint: '(texto corto del botón ⓘ)',
    descPh: 'Descripción del producto…',
  },
};
const DEFAULT_WA = '56953706307';
const BADGE_LABELS = { top: 'El más visto', new: 'Nuevo', wip: 'En fabricación' };
const DEFAULT_IG = 'https://www.instagram.com/andiworks.cl/';

/* ── ESTADO ──────────────────────────────────────────────────── */
const state = {
  cat: 'laser',
  num: '',
  numTouched: false,   // si el usuario escribió el número, no se pisa con la sugerencia
  name: '',
  year: String(new Date().getFullYear()),
  desc: '',
  category: '',
  dims: ['', '', ''],
  badges: [],          // 'top' ("El más visto"), 'new' ("Nuevo"), 'wip' ("En fabricación") — etiquetas de la card
  files: [],           // [{ file, url, kind: 'image'|'video', ext }] — el orden es el final
  model: null,         // { file, url } — modelo 3D (.glb) opcional
  cover3d: false,
  wa: DEFAULT_WA,
  ig: DEFAULT_IG,
};
const existing = { laser: [], muebles: [] };   // productos ya publicados, por catálogo

/* ── UTILIDADES ──────────────────────────────────────────────── */
function slugify(str) {
  return String(str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // saca tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function pad(n) {
  n = String(n || '').replace(/\D/g, '');
  return n ? n.padStart(2, '0') : '';
}
function numOf(id) { const m = /^(\d+)-/.exec(id || ''); return m ? parseInt(m[1], 10) : null; }

function slug() {
  const base = slugify(state.name) || 'producto';
  const n = pad(state.num);
  return n ? `${n}-${base}` : base;
}

/* Extensión real del archivo (minúsculas). Si no trae, se deduce del tipo. */
function extOf(file) {
  const m = /\.([a-z0-9]+)$/i.exec(file.name);
  let ext = m ? m[1].toLowerCase() : (file.type.split('/')[1] || '');
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'quicktime') ext = 'mov';
  return ext;
}
function kindOf(file) {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return /^(webm|mp4|mov|m4v)$/.test(extOf(file)) ? 'video' : 'image';
}

/* Nombre final: <slug>_imagenN.ext / <slug>_videoN.ext — N = posición final
   (la portada siempre es la 1). */
function fileName(item, i) {
  return `${slug()}_${item.kind === 'video' ? 'video' : 'imagen'}${i + 1}.${item.ext}`;
}

function waLink(raw) {
  raw = raw.trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://wa.me/${raw.replace(/\D/g, '')}`;
}
function igLink(raw) {
  raw = raw.trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://www.instagram.com/${raw.replace(/^@/, '')}/`;
}
function normalizeDim(v) {
  v = v.trim();
  return /^[\d.,]+$/.test(v) ? `${v} cm` : v;
}

/* ── PRODUCTOS EXISTENTES ────────────────────────────────────── */
/* Ambos productos.js asignan window.PRODUCTS: se cargan de a uno como
   <script> clásico (funciona también desde file://, sin fetch) y se copia
   el array antes de cargar el siguiente. */
function loadExisting(cat) {
  return new Promise((resolve) => {
    window.PRODUCTS = undefined;
    const s = document.createElement('script');
    s.src = `${CATALOGS[cat].data}?t=${Date.now()}`;
    s.onload = () => { existing[cat] = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : []; s.remove(); resolve(); };
    s.onerror = () => { s.remove(); resolve(); };
    document.head.appendChild(s);
  });
}
function nextNumber(cat) {
  const nums = existing[cat].map((p) => numOf(p.id)).filter((n) => n != null);
  return pad((nums.length ? Math.max(...nums) : 0) + 1);
}

/* ── REFERENCIAS ─────────────────────────────────────────────── */
const el = {
  seg: $$('.pb-seg button'),
  num: $('#f-num'),
  numNote: $('#num-note'),
  name: $('#f-name'),
  year: $('#f-year'),
  desc: $('#f-desc'),
  descHint: $('#desc-hint'),
  cat: $('#f-cat'),
  dims: $$('[data-dim]'),
  badges: $$('[data-badge]'),
  cardBadges: $('#card-badges'),
  drop: $('#drop'),
  files: $('#f-files'),
  tiles: $('#tiles'),
  drop3d: $('#drop-3d'),
  glb: $('#f-glb'),
  modelRow: $('#model-row'),
  modelView: $('#model-view'),
  modelName: $('#model-name'),
  modelSize: $('#model-size'),
  modelRemove: $('#model-remove'),
  cover3d: $('#f-3d-cover'),
  wa: $('#f-wa'),
  ig: $('#f-ig'),
  linksSummary: $('#links-summary'),
  cardMedia: $('#card-media'),
  cardTag: $('#card-tag'),
  chips: $('#chips'),
  zipBtn: $('#zip-btn'),
  destPath: $('#dest-path'),
  codeTarget: $('#code-target'),
  codeMissing: $('#code-missing'),
  code: $('#code'),
  copyCode: $('#copy-code'),
};

/* ── CATÁLOGO DE DESTINO ─────────────────────────────────────── */
function setCatalog(cat) {
  state.cat = cat;
  try { localStorage.setItem('aw-builder-cat', cat); } catch (e) {}
  document.body.dataset.cat = cat;
  el.seg.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.cat === cat)));
  el.descHint.textContent = CATALOGS[cat].descHint;
  el.desc.placeholder = CATALOGS[cat].descPh;
  if (!state.numTouched) { state.num = nextNumber(cat); el.num.value = state.num; }
  render();
}
el.seg.forEach((b) => b.addEventListener('click', () => setCatalog(b.dataset.cat)));

/* ── CAMPOS ──────────────────────────────────────────────────── */
el.year.value = state.year;
el.wa.value = state.wa;
el.ig.value = state.ig;

el.num.addEventListener('input', () => { state.num = el.num.value; state.numTouched = el.num.value !== ''; render(); });
el.num.addEventListener('blur', () => { if (state.num) { state.num = pad(state.num); el.num.value = state.num; render(); } });
el.name.addEventListener('input', () => { state.name = el.name.value; render(); });
el.year.addEventListener('input', () => { state.year = el.year.value; render(); });
el.desc.addEventListener('input', () => { state.desc = el.desc.value; render(); });
el.cat.addEventListener('input', () => { state.category = el.cat.value; render(); });
el.dims.forEach((input) => input.addEventListener('input', () => { state.dims[+input.dataset.dim] = input.value; render(); }));
/* Una sola etiqueta por card: marcar una desmarca las demás (se puede
   dejar ninguna, por eso checkbox y no radio). */
el.badges.forEach((input) => input.addEventListener('change', () => {
  if (input.checked) el.badges.forEach((b) => { if (b !== input) b.checked = false; });
  state.badges = el.badges.filter((b) => b.checked).map((b) => b.dataset.badge);
  render();
}));
el.wa.addEventListener('input', () => { state.wa = el.wa.value; render(); });
el.ig.addEventListener('input', () => { state.ig = el.ig.value; render(); });
el.cover3d.addEventListener('change', () => { state.cover3d = el.cover3d.checked; render(); });

/* ── ARCHIVOS ────────────────────────────────────────────────── */
/* Orden inicial: el del nombre original (imagen1, imagen2…), con los videos
   al final — igual que se suelen exportar. Después se reordena a mano. */
function addFiles(list) {
  const added = [...list]
    .filter((f) => /^(image|video)\//.test(f.type) || /\.(webp|webm|jpe?g|png|gif|avif|mp4|mov|m4v)$/i.test(f.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((file) => ({ file, url: URL.createObjectURL(file), kind: kindOf(file), ext: extOf(file) }));
  state.files.push(...added);
  render();
}
el.files.addEventListener('change', () => { addFiles(el.files.files); el.files.value = ''; });
['dragenter', 'dragover'].forEach((t) => el.drop.addEventListener(t, (e) => { e.preventDefault(); el.drop.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((t) => el.drop.addEventListener(t, (e) => { e.preventDefault(); el.drop.classList.remove('is-over'); }));
el.drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

/* ── MODELO 3D ───────────────────────────────────────────────── */
/* Un solo .glb por producto: soltar otro reemplaza al anterior. */
function setModel(file) {
  if (state.model) URL.revokeObjectURL(state.model.url);
  state.model = file ? { file, url: URL.createObjectURL(file) } : null;
  if (!state.model) { state.cover3d = false; el.cover3d.checked = false; }
  render();
}
function pickModel(list) {
  const file = [...list].find((f) => /\.glb$/i.test(f.name));
  if (file) setModel(file);
}
el.glb.addEventListener('change', () => { pickModel(el.glb.files); el.glb.value = ''; });
['dragenter', 'dragover'].forEach((t) => el.drop3d.addEventListener(t, (e) => { e.preventDefault(); el.drop3d.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((t) => el.drop3d.addEventListener(t, (e) => { e.preventDefault(); el.drop3d.classList.remove('is-over'); }));
el.drop3d.addEventListener('drop', (e) => pickModel(e.dataTransfer.files));
el.modelRemove.addEventListener('click', () => setModel(null));

function modelFileName() { return `${slug()}_modelo3d.glb`; }

function move(from, to) {
  if (to < 0 || to >= state.files.length) return;
  const [item] = state.files.splice(from, 1);
  state.files.splice(to, 0, item);
  render();
}
el.tiles.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const i = +btn.closest('li').dataset.i;
  const act = btn.dataset.act;
  if (act === 'cover') move(i, 0);
  else if (act === 'left') move(i, i - 1);
  else if (act === 'right') move(i, i + 1);
  else if (act === 'remove') { URL.revokeObjectURL(state.files[i].url); state.files.splice(i, 1); render(); }
});

function thumbEl(item) {
  if (item.kind === 'video') {
    const v = document.createElement('video');
    v.src = item.url;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.autoplay = true;
    return v;
  }
  const img = document.createElement('img');
  img.src = item.url;
  img.alt = '';
  return img;
}

function renderTiles() {
  el.tiles.innerHTML = '';
  state.files.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'pb-tile' + (i === 0 ? ' is-cover' : '');
    li.dataset.i = i;
    li.appendChild(thumbEl(item));
    const bar = document.createElement('div');
    bar.className = 'pb-tile-bar';
    bar.innerHTML =
      `<button type="button" data-act="cover" title="Usar como portada" aria-label="Usar como portada">★</button>` +
      `<button type="button" data-act="left" title="Mover antes" aria-label="Mover antes"${i === 0 ? ' disabled' : ''}>‹</button>` +
      `<button type="button" data-act="right" title="Mover después" aria-label="Mover después"${i === state.files.length - 1 ? ' disabled' : ''}>›</button>` +
      `<button type="button" data-act="remove" title="Quitar" aria-label="Quitar">✕</button>`;
    li.appendChild(bar);
    const badge = document.createElement('span');
    badge.className = 'pb-tile-badge';
    badge.textContent = `${i + 1} · ${item.ext}`;
    li.appendChild(badge);
    el.tiles.appendChild(li);
  });
}

/* ── PRODUCTO ────────────────────────────────────────────────── */
function buildProduct() {
  const s = slug();
  const folder = `assets/products/${s}`;
  const media = state.files.map((item, i) => ({ type: item.kind, src: `${folder}/${fileName(item, i)}` }));
  /* Los videos llevan de poster la primera foto: se ve mientras cargan y en
     navegadores que no reproducen su códec (ej. AV1 en varios iPhone). */
  const firstImage = media.find((m) => m.type === 'image');
  media.forEach((m) => { if (m.type === 'video') m.poster = firstImage ? firstImage.src : ''; });

  const isLaser = state.cat === 'laser';
  const year = state.year.trim();
  const model3d = state.model
    ? { src: `${folder}/${modelFileName()}`, poster: firstImage ? firstImage.src : '' }
    : null;
  return {
    id: s,
    name: state.name.trim(),
    category: isLaser ? '' : state.category.trim(),
    year,
    description: state.desc.trim(),
    /* Ambos catálogos: medidas reales (vacías = no se muestran). En el láser
       el año sale de `year` (ver CATALOG_OPTIONS en catalogo-laser/index.html). */
    dimensions: state.dims.map(normalizeDim).filter(Boolean),
    media,
    model3d,
    coverType: (model3d && state.cover3d) ? '3d' : 'media',
    badges: state.badges.slice(),
    links: { whatsapp: waLink(state.wa), instagram: igLink(state.ig) },
  };
}

function missing(p) {
  const m = [];
  if (!state.num) m.push('número');
  if (!p.name) m.push('nombre');
  if (!p.description) m.push('descripción');
  if (!p.media.length) m.push('fotos');
  if (!p.links.whatsapp || !p.links.instagram) m.push('contacto');
  return m;
}

/* ── CÓDIGO ──────────────────────────────────────────────────── */
/* Sangría igual a la de productos.js: listo para pegar antes del `];`. */
function jsStr(s) { return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`; }

function generateCode(p) {
  const L = [];
  L.push('  {');
  L.push(`    id: ${jsStr(p.id)},`);
  L.push(`    name: ${jsStr(p.name)},`);
  if (p.category) L.push(`    category: ${jsStr(p.category)},`);
  if (p.year) L.push(`    year: ${jsStr(p.year)},`);
  L.push(`    description: ${jsStr(p.description)},`);
  L.push(`    dimensions: [${p.dimensions.map(jsStr).join(', ')}],`);
  L.push('    media: [');
  p.media.forEach((m) => {
    L.push(m.type === 'video'
      ? `      { type: 'video', src: ${jsStr(m.src)}, poster: ${jsStr(m.poster)} },`
      : `      { type: 'image', src: ${jsStr(m.src)} },`);
  });
  L.push('    ],');
  L.push(p.model3d
    ? `    model3d: { src: ${jsStr(p.model3d.src)}, poster: ${jsStr(p.model3d.poster)} },`
    : '    model3d: null,');
  L.push(`    coverType: ${jsStr(p.coverType)},`);
  if (p.badges.length) L.push(`    badges: [${p.badges.map(jsStr).join(', ')}],`);
  L.push(`    links: { whatsapp: ${jsStr(p.links.whatsapp)}, instagram: ${jsStr(p.links.instagram)} },`);
  L.push('  },');
  return L.join('\n');
}

/* ── VISTAS ──────────────────────────────────────────────────── */
function renderNumNote() {
  const list = existing[state.cat];
  const n = parseInt(state.num, 10);
  const taken = !isNaN(n) && list.find((p) => numOf(p.id) === n);
  el.numNote.classList.toggle('is-warn', !!taken);
  if (taken) {
    el.numNote.textContent = `⚠ El Nº ${pad(n)} ya lo usa «${taken.name}». Próximo libre: ${nextNumber(state.cat)}.`;
  } else {
    el.numNote.textContent = list.length
      ? `${list.length} productos en ${CATALOGS[state.cat].label} · próximo Nº sugerido: ${nextNumber(state.cat)}`
      : `Sin productos publicados en ${CATALOGS[state.cat].label} todavía.`;
  }
}

let lastCoverUrl = null;
function renderCard(p) {
  el.cardTag.textContent = p.name || 'Nombre del producto';
  el.cardBadges.innerHTML = p.badges.map((b) =>
    `<span class="pb-badge pb-badge--${b}">${BADGE_LABELS[b]}</span>`).join('');
  const cover = state.files[0];
  const key = p.coverType === '3d' ? `3d${state.model.url}` : (cover ? cover.url : '');
  if (key === lastCoverUrl) return;   // no reiniciar el video en cada tecla
  lastCoverUrl = key;
  el.cardMedia.innerHTML = '';
  if (p.coverType === '3d') {
    /* Mismos atributos que la portada 3D del catálogo (buildCoverEl() en
       assets/js/catalog-app.js): auto-rotando y sin interacción. */
    const mv = document.createElement('model-viewer');
    mv.setAttribute('src', state.model.url);
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('rotation-per-second', '22deg');
    mv.setAttribute('environment-image', 'neutral');
    mv.setAttribute('exposure', '1');
    mv.setAttribute('tone-mapping', 'neutral');
    mv.setAttribute('shadow-intensity', '0.9');
    mv.setAttribute('shadow-softness', '0.8');
    mv.style.pointerEvents = 'none';
    el.cardMedia.appendChild(mv);
  } else if (cover) {
    el.cardMedia.appendChild(thumbEl(cover));
  } else {
    el.cardMedia.innerHTML = '<p class="pb-card-empty">Portada</p>';
  }
}

function chip(text, title) {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pb-chip';
  b.textContent = text;
  if (title) b.title = title;
  b.addEventListener('click', () => copy(text, b));
  li.appendChild(b);
  return li;
}
function renderChips(p) {
  el.chips.innerHTML = '';
  el.chips.appendChild(chip(p.id, 'Nombre de la carpeta')).firstChild.classList.add('pb-chip-folder');
  state.files.forEach((item, i) => el.chips.appendChild(chip(fileName(item, i))));
  if (p.model3d) el.chips.appendChild(chip(modelFileName()));
  el.zipBtn.disabled = !state.files.length && !state.model;
  el.destPath.textContent = CATALOGS[state.cat].dest;
}

function renderModel() {
  const m = state.model;
  el.drop3d.hidden = !!m;
  el.modelRow.hidden = !m;
  el.modelRow.classList.toggle('is-cover', !!m && state.cover3d);
  if (!m) { el.modelView.removeAttribute('src'); return; }
  if (el.modelView.getAttribute('src') !== m.url) el.modelView.setAttribute('src', m.url);
  el.modelName.textContent = modelFileName();
  el.modelSize.textContent = `${m.file.name} · ${(m.file.size / 1048576).toFixed(1)} MB`;
}

function render() {
  const p = buildProduct();
  renderModel();
  renderNumNote();
  renderTiles();
  renderCard(p);
  renderChips(p);
  el.linksSummary.textContent = (state.wa === DEFAULT_WA && state.ig === DEFAULT_IG) ? '· los de siempre' : '· personalizado';
  el.codeTarget.textContent = CATALOGS[state.cat].file;
  const m = missing(p);
  el.codeMissing.textContent = m.length ? `· falta: ${m.join(', ')}` : '';
  el.code.classList.toggle('is-incomplete', m.length > 0);
  el.code.textContent = generateCode(p);
}

/* ── COPIAR ──────────────────────────────────────────────────── */
function copy(text, btn) {
  const done = () => {
    btn.classList.add('is-copied');
    setTimeout(() => btn.classList.remove('is-copied'), 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) {}
  ta.remove();
}
el.copyCode.addEventListener('click', () => copy(el.code.textContent, el.copyCode));

/* ── ZIP ─────────────────────────────────────────────────────── */
/* ZIP mínimo sin compresión ("store"): fotos y videos ya vienen comprimidos,
   así que no se pierde nada y no hace falta ninguna librería. */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function makeZip(entries) {   // entries: [{ name, data: Uint8Array }]
  const enc = new TextEncoder();
  const d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const parts = [];
  const central = [];
  let offset = 0;
  entries.forEach(({ name, data }) => {
    const nameBytes = enc.encode(name);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);   // nombres en UTF-8
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    parts.push(local, nameBytes, data);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(12, time, true);
    cen.setUint16(14, date, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, nameBytes.length, true);
    cen.setUint32(42, offset, true);
    central.push(cen, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  });
  const centralSize = central.reduce((s, b) => s + b.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

el.zipBtn.addEventListener('click', async () => {
  if (!state.files.length && !state.model) return;
  const s = slug();
  el.zipBtn.disabled = true;
  const prev = el.zipBtn.textContent;
  el.zipBtn.textContent = 'Armando…';
  try {
    const entries = await Promise.all(state.files.map(async (item, i) => ({
      name: `${s}/${fileName(item, i)}`,
      data: new Uint8Array(await item.file.arrayBuffer()),
    })));
    if (state.model) {
      entries.push({ name: `${s}/${modelFileName()}`, data: new Uint8Array(await state.model.file.arrayBuffer()) });
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(makeZip(entries));
    a.download = `${s}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } finally {
    el.zipBtn.textContent = prev;
    el.zipBtn.disabled = false;
  }
});

/* ── INICIO ──────────────────────────────────────────────────── */
(async () => {
  await loadExisting('laser');
  await loadExisting('muebles');
  let cat = 'laser';
  try { cat = localStorage.getItem('aw-builder-cat') || cat; } catch (e) {}
  setCatalog(CATALOGS[cat] ? cat : 'laser');
})();
