/* AndiWorks · Formulario de productos (uso interno)
 * Genera el objeto de producto listo para pegar en catalogo/data/productos.js.
 * No sube ni renombra archivos: solo sugiere nombres/carpeta para que el
 * renombrado real de fotos, videos y el .glb se haga a mano en el computador. */

const $ = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

function slugify(str) {
  return String(str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // saca tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'producto';
}

/* Número de producto -> siempre al menos 2 dígitos (01, 02... 10, 11...),
   para que carpetas y archivos ordenen bien en cualquier explorador. Si el
   usuario ya escribe 3+ dígitos se respeta tal cual. */
function padNumber(n) {
  n = String(n || '').trim().replace(/[^0-9]/g, '');
  if (!n) return '';
  return n.length < 2 ? n.padStart(2, '0') : n;
}

/* ── ESTADO ──────────────────────────────────────────────────── */
const state = {
  productNumber: '',
  title: '',
  category: '',
  year: '',
  idOverride: '',
  dims: [
    { label: 'Largo', value: '', enabled: false },
    { label: 'Ancho', value: '', enabled: false },
    { label: 'Alto', value: '', enabled: false },
  ],
  description: '',
  mediaCount: 1,
  media: [{ type: 'image' }],
  has3d: false,
  use3dCover: false,
  wa: '56953706307',
  ig: 'https://www.instagram.com/andiworks.cl/',
};

function currentSlug() {
  const base = slugify(state.idOverride || state.title);
  const num = padNumber(state.productNumber);
  return num ? `${num}-${base}` : base;
}

/* ── REFERENCIAS ─────────────────────────────────────────────── */
const el = {
  productNumber: $('#f-product-number'),
  title: $('#f-title'),
  category: $('#f-category'),
  year: $('#f-year'),
  id: $('#f-id'),
  dims: $('#f-dims'),
  description: $('#f-description'),
  folder: $('#f-folder'),
  mediaCount: $('#f-media-count'),
  mediaMinus: $('#f-media-minus'),
  mediaPlus: $('#f-media-plus'),
  mediaList: $('#f-media-list'),
  has3d: $('#f-has3d'),
  extra3d: $('#f-3d-extra'),
  modelName: $('#f-model-name'),
  cover3d: $('#f-3d-cover'),
  wa: $('#f-wa'),
  ig: $('#f-ig'),
  warnings: $('#pf-warnings'),
  generateBtn: $('#pf-generate-btn'),
  output: $('#pf-output'),
  code: $('#pf-code'),
  copyCodeBtn: $('#pf-copy-code'),
  cardPreview: $('#pf-card-preview'),
  cardMedia: $('#pf-card-media'),
  cardTag: $('#pf-card-tag'),
};

el.wa.value = state.wa;
el.ig.value = state.ig;
el.mediaCount.value = state.mediaCount;

/* ── PASO 2 · MEDIDAS ────────────────────────────────────────── */
/* Cada medida se activa de forma independiente con su propio toggle — no
   hace falta completar las 3 para que una aparezca en el producto final. */
function renderDims() {
  el.dims.innerHTML = '';
  state.dims.forEach((d, i) => {
    const row = document.createElement('div');
    row.className = 'pf-dim-row';

    const toggle = document.createElement('label');
    toggle.className = 'pf-toggle';
    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.checked = d.enabled;
    toggleInput.setAttribute('aria-label', `Activar medida ${i + 1}`);
    const toggleTrack = document.createElement('span');
    toggleTrack.className = 'pf-toggle-track';
    toggle.appendChild(toggleInput);
    toggle.appendChild(toggleTrack);

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = d.label;
    labelInput.setAttribute('aria-label', `Título de medida ${i + 1}`);
    labelInput.addEventListener('input', () => { d.label = labelInput.value; });

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = 'ej: 64 cm';
    valueInput.value = d.value;
    valueInput.disabled = !d.enabled;
    valueInput.setAttribute('aria-label', `Valor de medida ${i + 1}`);
    valueInput.addEventListener('input', () => { d.value = valueInput.value; onChange(); });

    toggleInput.addEventListener('change', () => {
      d.enabled = toggleInput.checked;
      valueInput.disabled = !d.enabled;
      if (d.enabled) valueInput.focus();
      onChange();
    });

    row.appendChild(toggle);
    row.appendChild(labelInput);
    row.appendChild(valueInput);
    el.dims.appendChild(row);
  });
}
renderDims();

/* ── PASO 4 · FOTOS Y VIDEOS ─────────────────────────────────── */
function mediaFileName(item, index) {
  const slug = currentSlug();
  const n = index + 1;
  return item.type === 'video' ? `${slug}_video${n}.mp4` : `${slug}_imagen${n}.jpg`;
}

function syncMediaArrayLength() {
  const n = state.mediaCount;
  while (state.media.length < n) state.media.push({ type: 'image' });
  while (state.media.length > n) state.media.pop();
}

function renderMediaList() {
  el.mediaList.innerHTML = '';
  state.media.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'pf-media-row';

    const num = document.createElement('span');
    num.className = 'pf-media-num';
    num.textContent = `#${i + 1}`;

    const select = document.createElement('select');
    select.innerHTML = '<option value="image">Foto</option><option value="video">Video</option>';
    select.value = item.type;
    select.addEventListener('change', () => { item.type = select.value; renderMediaList(); onChange(); });

    const copyline = document.createElement('div');
    copyline.className = 'pf-copyline';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.readOnly = true;
    nameInput.value = mediaFileName(item, i);
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'pf-copy-btn';
    copyBtn.textContent = 'Copiar';
    copyBtn.addEventListener('click', () => copyToClipboard(nameInput.value, copyBtn));
    copyline.appendChild(nameInput);
    copyline.appendChild(copyBtn);

    row.appendChild(num);
    row.appendChild(select);
    row.appendChild(copyline);
    el.mediaList.appendChild(row);
  });
}

function setMediaCount(n) {
  n = Math.max(1, Math.min(10, n | 0 || 1));
  state.mediaCount = n;
  el.mediaCount.value = n;
  syncMediaArrayLength();
  renderMediaList();
  onChange();
}

el.mediaCount.addEventListener('input', () => setMediaCount(parseInt(el.mediaCount.value, 10)));
el.mediaMinus.addEventListener('click', () => setMediaCount(state.mediaCount - 1));
el.mediaPlus.addEventListener('click', () => setMediaCount(state.mediaCount + 1));
renderMediaList();

/* ── PASO 5 · MODELO 3D ──────────────────────────────────────── */
el.has3d.addEventListener('change', () => {
  state.has3d = el.has3d.checked;
  el.extra3d.hidden = !state.has3d;
  if (!state.has3d) { el.cover3d.checked = false; state.use3dCover = false; }
  onChange();
});
el.cover3d.addEventListener('change', () => { state.use3dCover = el.cover3d.checked; onChange(); });

/* ── CAMPOS SIMPLES ──────────────────────────────────────────── */
el.productNumber.addEventListener('input', () => { state.productNumber = el.productNumber.value; onChange(); });
el.title.addEventListener('input', () => { state.title = el.title.value; onChange(); });
el.category.addEventListener('input', () => { state.category = el.category.value; onChange(); });
el.year.addEventListener('input', () => { state.year = el.year.value; onChange(); });
el.id.addEventListener('input', () => { state.idOverride = el.id.value; onChange(); });
el.description.addEventListener('input', () => { state.description = el.description.value; onChange(); });
el.wa.addEventListener('input', () => { state.wa = el.wa.value; onChange(); });
el.ig.addEventListener('input', () => { state.ig = el.ig.value; onChange(); });

/* ── CADENA DE PASOS ─────────────────────────────────────────── */
const steps = $$('.pf-step').map((section) => ({
  section,
  n: parseInt(section.dataset.step, 10),
  required: section.querySelector('.pf-flag-req') != null,
  inputs: $$('input, textarea, select', section),
}));

function stepSatisfied(n) {
  if (n === 1) return state.title.trim() !== '' && state.productNumber.trim() !== '';
  if (n === 3) return state.description.trim() !== '';
  if (n === 6) return state.wa.trim() !== '';
  if (n === 7) return state.ig.trim() !== '';
  return true;   // pasos opcionales (2 medidas, 4 fotos con mínimo ya garantizado, 5 modelo 3d) nunca bloquean
}

function updateChain() {
  let unlocked = true;
  let currentAssigned = false;
  steps.forEach(({ section, n, inputs }) => {
    section.classList.toggle('is-locked', !unlocked);
    inputs.forEach((input) => { input.disabled = !unlocked; });
    const satisfied = stepSatisfied(n);
    section.classList.toggle('is-done', unlocked && satisfied);
    if (unlocked && !satisfied && !currentAssigned) {
      section.classList.add('is-current');
      currentAssigned = true;
    } else {
      section.classList.remove('is-current');
    }
    if (unlocked && !satisfied) unlocked = false;   // el siguiente paso queda bloqueado
  });
  // Los inputs de medidas dependen también de su propio toggle, no solo de la cadena.
  if (!steps.find((s) => s.n === 2).section.classList.contains('is-locked')) {
    $$('.pf-dim-row', el.dims).forEach((row, i) => {
      const valueInput = row.querySelectorAll('input[type="text"]')[1];
      if (valueInput) valueInput.disabled = !state.dims[i].enabled;
    });
  }
}

/* ── CARPETA / NOMBRES SUGERIDOS ─────────────────────────────── */
function updateSuggestions() {
  const slug = currentSlug();
  el.folder.value = `assets/products/${slug}/`;
  el.modelName.value = `${slug}_modelo3d.glb`;
  if (!state.idOverride) el.id.setAttribute('placeholder', slug);
  $$('.pf-media-row', el.mediaList).forEach((row, i) => {
    const input = row.querySelector('.pf-copyline input');
    if (input) input.value = mediaFileName(state.media[i], i);
  });
}

/* ── ARMADO DEL PRODUCTO ─────────────────────────────────────── */
function normalizeDim(v) {
  v = v.trim();
  if (!v) return '';
  return /^[\d.,]+$/.test(v) ? `${v} cm` : v;
}

function waLink(raw) {
  raw = raw.trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://wa.me/${raw.replace(/[^\d]/g, '')}`;
}
function igLink(raw) {
  raw = raw.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://www.instagram.com/${raw.replace(/^@/, '')}/`;
}

function buildProduct() {
  const slug = currentSlug();
  const folder = `assets/products/${slug}`;
  const dimensions = state.dims
    .filter((d) => d.enabled)
    .map((d) => normalizeDim(d.value))
    .filter(Boolean);

  const media = state.media.map((item, i) => {
    const name = mediaFileName(item, i);
    return { type: item.type, src: `${folder}/${name}` };
  });

  const firstImage = media.find((m) => m.type === 'image');
  const model3d = state.has3d ? {
    src: `${folder}/${slug}_modelo3d.glb`,
    poster: firstImage ? firstImage.src : '',
  } : null;

  return {
    id: slug,
    name: state.title.trim(),
    category: state.category.trim(),
    year: state.year.trim(),
    description: state.description.trim(),
    dimensions,
    media,
    model3d,
    coverType: (state.has3d && state.use3dCover) ? '3d' : 'media',
    links: { whatsapp: waLink(state.wa), instagram: igLink(state.ig) },
  };
}

/* ── VALIDACIÓN ──────────────────────────────────────────────── */
function validate(p) {
  const errors = [];
  if (!state.productNumber.trim()) errors.push('Falta el número de producto (paso 1).');
  if (!p.name) errors.push('Falta el título del producto (paso 1).');
  if (!p.description) errors.push('Falta la descripción del producto (paso 3).');
  if (!p.media.length) errors.push('Agrega al menos 1 foto o video (paso 4).');
  if (!p.links.whatsapp) errors.push('Falta el número de WhatsApp (paso 6).');
  if (!p.links.instagram) errors.push('Falta el Instagram (paso 7).');
  return errors;
}

/* ── VISTA PREVIA: CARD ──────────────────────────────────────── */
function placeholderEl(text) {
  const d = document.createElement('div');
  d.className = 'pf-media-placeholder';
  d.textContent = text;
  return d;
}

function renderCardPreview(p) {
  el.cardMedia.innerHTML = '';
  el.cardTag.textContent = p.name || 'Nombre del producto';

  if (p.coverType === '3d' && p.model3d) {
    el.cardMedia.appendChild(placeholderEl(`Portada 3D\n(${p.model3d.src.split('/').pop()})`));
    return;
  }
  const cover = p.media[0];
  if (!cover) { el.cardMedia.appendChild(placeholderEl('Sin foto todavía')); return; }
  el.cardMedia.appendChild(placeholderEl(`${cover.type === 'video' ? 'Video' : 'Foto'} #1\n(${cover.src.split('/').pop()})`));
}

/* ── VISTA PREVIA: OVERLAY ───────────────────────────────────── */
const pfov = {
  stage: $('#pfov-stage'),
  media: $('#pfov-media'),
  modeLabel: $('#pfov-mode-label'),
  title: $('#pfov-title'),
  measures: $('#pfov-measures'),
  text: $('#pfov-text'),
  dock: $('#pfov-dock'),
  dots: $('#pfov-dots'),
};
const PFOV_MODE_LABEL = { media: 'Imágenes del producto', '3d': 'Modelo 3D' };
let pfovMode = 'media';
let pfovIndex = 0;
let lastProduct = null;

function pfovRenderStage() {
  pfov.media.innerHTML = '';
  pfov.stage.classList.toggle('is-3d', pfovMode === '3d');
  const p = lastProduct;
  if (!p) return;

  pfov.modeLabel.classList.add('is-visible');
  pfov.modeLabel.textContent = PFOV_MODE_LABEL[pfovMode];

  if (pfovMode === '3d' && p.model3d) {
    pfov.media.appendChild(placeholderEl(`Modelo 3D\n(${p.model3d.src.split('/').pop()})`));
    pfov.dots.innerHTML = '';
    return;
  }

  const m = p.media[pfovIndex];
  if (!m) { pfov.media.appendChild(placeholderEl('Sin fotos/videos todavía')); pfov.dots.innerHTML = ''; return; }
  pfov.media.appendChild(placeholderEl(`${m.type === 'video' ? 'Video' : 'Foto'} #${pfovIndex + 1}\n(${m.src.split('/').pop()})`));

  pfov.dots.innerHTML = '';
  p.media.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'ov-dot' + (i === pfovIndex ? ' is-active' : '');
    dot.addEventListener('click', () => { pfovIndex = i; pfovRenderStage(); });
    pfov.dots.appendChild(dot);
  });
}

pfov.dock.addEventListener('click', (e) => {
  const btn = e.target.closest('.dock-btn');
  if (!btn || btn.classList.contains('pf-dock-static')) return;
  const act = btn.dataset.act;
  if (act === 'info') {
    $('#pfov-info').classList.toggle('is-visible');
  } else if (act === 'media' && pfovMode !== 'media') {
    pfovMode = 'media'; pfovIndex = 0; pfovRenderStage();
  } else if (act === '3d' && pfovMode !== '3d' && lastProduct && lastProduct.model3d) {
    pfovMode = '3d'; pfovRenderStage();
  }
});

function renderOverlayPreview(p) {
  lastProduct = p;
  pfov.title.textContent = p.name || 'Nombre del producto';
  pfov.measures.textContent = p.dimensions.length ? `Medidas: ${p.dimensions.join(' | ')}` : '';
  pfov.measures.hidden = !p.dimensions.length;
  pfov.text.textContent = p.description || 'Descripción del producto...';
  $('[data-act="3d"]', pfov.dock).hidden = !p.model3d;
  if (pfovMode === '3d' && !p.model3d) { pfovMode = 'media'; pfovIndex = 0; }
  pfovIndex = Math.min(pfovIndex, Math.max(0, p.media.length - 1));
  pfovRenderStage();
}

/* ── GENERACIÓN DE CÓDIGO ────────────────────────────────────── */
function jsStr(s) { return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`; }

function generateCode(p) {
  const lines = [];
  lines.push('{');
  lines.push(`  id: ${jsStr(p.id)},`);
  lines.push(`  name: ${jsStr(p.name)},`);
  if (p.category) lines.push(`  category: ${jsStr(p.category)},`);
  if (p.year) lines.push(`  year: ${jsStr(p.year)},`);
  lines.push(`  description: ${jsStr(p.description)},`);
  if (p.dimensions.length) {
    lines.push(`  dimensions: [${p.dimensions.map(jsStr).join(', ')}],`);
  }
  lines.push('  media: [');
  p.media.forEach((m) => {
    if (m.type === 'video') {
      lines.push(`    { type: 'video', src: ${jsStr(m.src)}, poster: '' },`);
    } else {
      lines.push(`    { type: 'image', src: ${jsStr(m.src)} },`);
    }
  });
  lines.push('  ],');
  if (p.model3d) {
    lines.push(`  model3d: { src: ${jsStr(p.model3d.src)}, poster: ${jsStr(p.model3d.poster)} },`);
  } else {
    lines.push('  model3d: null,');
  }
  lines.push(`  coverType: ${jsStr(p.coverType)},`);
  lines.push(`  links: { whatsapp: ${jsStr(p.links.whatsapp)}, instagram: ${jsStr(p.links.instagram)} },`);
  lines.push('},');
  return lines.join('\n');
}

/* ── COPIAR AL PORTAPAPELES ──────────────────────────────────── */
function copyToClipboard(text, feedbackEl) {
  const done = () => {
    if (!feedbackEl) return;
    const isCode = feedbackEl.classList.contains('pf-code');
    feedbackEl.classList.add('is-copied');
    if (!isCode) {
      const prevLabel = feedbackEl.textContent;
      feedbackEl.textContent = '✓ Copiado';
      setTimeout(() => { feedbackEl.classList.remove('is-copied'); feedbackEl.textContent = prevLabel; }, 1400);
    } else {
      setTimeout(() => feedbackEl.classList.remove('is-copied'), 1400);
    }
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
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) {}
  document.body.removeChild(ta);
}

$$('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.copy);
    if (target) copyToClipboard(target.value, btn);
  });
});
el.code.addEventListener('click', () => copyToClipboard(el.code.textContent, el.code));
el.copyCodeBtn.addEventListener('click', () => copyToClipboard(el.code.textContent, el.copyCodeBtn));

/* ── GENERAR ─────────────────────────────────────────────────── */
el.generateBtn.addEventListener('click', () => {
  const p = buildProduct();
  const errors = validate(p);
  if (errors.length) {
    el.warnings.hidden = false;
    el.warnings.innerHTML = `<strong>Falta completar antes de generar:</strong><ul>${errors.map((e) => `<li>${e}</li>`).join('')}</ul>`;
    el.output.hidden = true;
    el.warnings.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  el.warnings.hidden = true;
  el.code.textContent = generateCode(p);
  el.output.hidden = false;
});

/* ── CICLO DE ACTUALIZACIÓN ──────────────────────────────────── */
function onChange() {
  updateChain();
  updateSuggestions();
  const p = buildProduct();
  renderCardPreview(p);
  renderOverlayPreview(p);
  el.output.hidden = true;   // cualquier cambio invalida el código ya generado
}

onChange();
