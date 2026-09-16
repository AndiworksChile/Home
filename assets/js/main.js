/* Solo los botones de navegación principal (hijos directos de #choice-list)
   tienen video/tema propio y entran en la coreografía de I18N.buttons por
   índice. Los botones que aparecen DENTRO de una subsección (ej. las dos
   opciones de "Corte y grabado láser") usan la misma clase .choice-btn por
   estilo, pero se consultan aparte para no romper ese mapeo por índice. */
const buttons = [...document.querySelectorAll('#choice-list > .choice-btn')];
const langButtons = [...document.querySelectorAll('.lang-btn')];
const leftArrow = document.querySelector('#choice-list .hover-arrow-left');
const rightArrow = document.querySelector('#choice-list .hover-arrow-right');
const choiceList = document.querySelector('#choice-list');
const homeCard = document.querySelector('.home-card');
const bioPanel = document.querySelector('#bio-panel');
const bioBackBtn = document.querySelector('#bio-back');
const laserOptions = document.querySelector('#laser-options');
const laserBackBtn = document.querySelector('#laser-back');
/* Igual que #choice-list: las flechas también siguen al botón que se está
   tocando/enfocando DENTRO de la subsección "Corte y grabado láser" — ver
   positionArrowsIn() más abajo, la misma lógica generalizada a cualquier
   contenedor de botones. */
const laserArrowLeft = document.querySelector('#laser-arrow-left');
const laserArrowRight = document.querySelector('#laser-arrow-right');
const laserButtons = [...document.querySelectorAll('#laser-options .choice-btn, #laser-options .panel-back')];
let lastLaserButton = null;
const socialLinks = [...document.querySelectorAll('.social-link')];
/* #choice-list y #laser-options tienen distinto alto (5 botones vs 2): al
   intercambiar uno por otro, .home-card cambia de alto y —al estar
   centrado por el grid (place-items:center)— TODOS sus hijos se corren
   (los de arriba también, no solo los de abajo). Por eso el FLIP se aplica
   a todos los hijos directos de .home-card, EXCEPTO los dos contenedores
   que se están intercambiando: uno de los dos siempre está oculto
   (display:none) en el momento de medir, así que su rect da 0 y ensuciaría
   el cálculo — además cada uno ya tiene su propia animación de
   entrada/salida (.choices-hiding / #laser-options.laser-ready). */
function reflowEls() {
  return [...homeCard.children].filter((el) => el.id !== 'choice-list' && el.id !== 'laser-options');
}

/* Envoltorio de analítica: nunca debe poder romper la página (por eso el
   try/catch adentro de AW.trackEvent, en assets/js/analytics.js). Si ese
   script no cargó (bloqueador de anuncios, etc.) esto simplemente no hace nada. */
function trackEvent(name, params) {
  if (window.AW && typeof window.AW.trackEvent === 'function') window.AW.trackEvent(name, params);
}
const themes = ['theme-gray', 'theme-green', 'theme-blue', 'theme-orange', 'theme-purple', 'theme-teal'];
let bioActive = false;     /* mientras es true, el fondo (color+video) del botón "Historia" queda fijo */
let laserActive = false;   /* ídem, para "Corte y grabado láser" */
const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canAnimate = !prefersReduce && typeof document.createElement('div').animate === 'function';
const IS_TOUCH = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
if (IS_TOUCH) document.body.classList.add('is-touch');
let lastIndex = 0;

const I18N = {
  es: {
    eyebrow: '¡Hola, bienvenido!',
    title: '¿Qué quieres hacer?',
    subtitle: 'AndiWorks + Mueblería y diseño personalizado',
    open: 'Abierto ahora',
    closed: 'Cerrado ahora',
    buttons: [
      { default: 'Quiero un espejo paramétrico', hover: '¡Próximamente!' },
      { default: 'Ver el catálogo', hover: 'Catálogo de productos' },
      { default: 'Diseñar una idea', hover: 'Hablemos :)' },
      { default: 'Corte y grabado láser', hover: 'Catálogo Láser' },
      { default: 'Quién soy / Cómo trabajo', hover: 'Conoce mi historia' },
    ],
    bio: {
      title: 'Historia',
      back: 'Volver al menú',
      text: [
        'Somos una gran empresa... compuesta por una persona. Soy Andrés Baeza Jordán, tengo 31 años. Arquitecto de profesión, y apasionado por la mueblería y el diseño.',
        'Hace 8 años dejé mi trabajo tradicional para emprender por mi cuenta. Empecé fabricando letreros, stands y exhibidores para marcas y otros emprendimientos.',
        'Hoy quiero llevar AndiWorks al siguiente nivel: fabricar Muebles Paramétricos Asistidos por WebApp. Una interfaz sencilla para crear, diseñar y enviar a fabricar tu mueble a medida, todo desde el navegador, sin instalar nada y con despacho a tu domicilio.',
        'Justo ahora cuento con un nuevo espacio para trabajar, ubicado en el sector Sur de Barrio Matta en Santiago de Chile. Lo estoy ordenando y preparando para recibir nuevos pedidos.',
        'Me encantaría que formes parte de esta historia. Sígueme en Instagram para ver el día a día, o escríbeme si tienes algo en mente. ¡Sería genial trabajar juntos!',
      ],
    },
  },
  en: {
    eyebrow: 'Hi, welcome!',
    title: 'What would you like to do?',
    subtitle: 'AndiWorks + Custom furniture and design',
    open: 'Open now',
    closed: 'Closed now',
    buttons: [
      { default: 'I want a parametric mirror', hover: 'Coming soon!' },
      { default: 'See the catalogue', hover: 'Product catalogue' },
      { default: 'Design an idea', hover: "Let's talk :)" },
      { default: 'Laser cutting & engraving', hover: 'Laser Catalogue' },
      { default: 'Who I am / How I work', hover: 'Get to know my story' },
    ],
    bio: {
      title: 'Story',
      back: 'Back to menu',
      text: [
        "We're a big company... made up of one person. I'm Andrés Baeza Jordán, 31 years old. An architect by training, passionate about furniture-making and design.",
        '8 years ago I left my traditional job to start my own venture. I began by making signs, stands and displays for brands and other businesses.',
        'Today I want to take AndiWorks to the next level: manufacturing Parametric Furniture Assisted by a WebApp. A simple interface to create, design and send your custom furniture to be made — all from the browser, no installs, with delivery to your door.',
        "Right now I have a new workspace, located in the South sector of Barrio Matta in Santiago, Chile. I'm setting it up and getting it ready to take on new orders.",
        "I'd love for you to be part of this story. Follow me on Instagram to see the day-to-day, or write to me if you have something in mind. It'd be great to work together!",
      ],
    },
  },
  zh: {
    eyebrow: '你好，欢迎！',
    title: '你想做什么？',
    subtitle: 'AndiWorks + 定制家具与设计',
    open: '现在营业',
    closed: '现在休息',
    buttons: [
      { default: '我想要参数化镜子', hover: '敬请期待！' },
      { default: '查看目录', hover: '产品目录' },
      { default: '设计一个想法', hover: '聊一聊 :)' },
      { default: '激光切割与雕刻', hover: '激光产品目录' },
      { default: '关于我 / 我的工作方式', hover: '了解我的故事' },
    ],
    bio: {
      title: '故事',
      back: '返回菜单',
      text: [
        '我们是一家"大公司"……其实只有我一个人。我是安德烈斯·巴埃萨·霍尔丹（Andrés Baeza Jordán），31岁。建筑师出身，热爱家具制造与设计。',
        '8年前，我辞去了传统工作，开始自己创业。最初是为品牌和其他企业制作招牌、展台和展示架。',
        '如今，我想让 AndiWorks 迈上新台阶：通过网页应用（WebApp）辅助制造参数化家具。一个简单的界面，让你可以直接在浏览器里创建、设计并下单定制家具，无需安装任何软件，还能送货上门。',
        '目前我有一个新的工作空间，位于智利圣地亚哥 Barrio Matta 南区。我正在整理和准备，以便接收新的订单。',
        '我很希望你能成为这个故事的一部分。欢迎在 Instagram 上关注我，了解日常动态，或者写信告诉我你的想法。一起合作会很棒！',
      ],
    },
  },
};
let currentLang = 'es';
let langGen = 0;

const FADE_OUT = [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(2.5px)' }];
const FADE_IN = [{ opacity: 0, filter: 'blur(2.5px)' }, { opacity: 1, filter: 'blur(0)' }];
let swapAnims = [];
function killSwap() {
  swapAnims.forEach((a) => a.cancel());
  swapAnims = [];
}

function setTheme(name) {
  document.body.classList.remove(...themes);
  document.body.classList.add(themes.includes(`theme-${name}`) ? `theme-${name}` : 'theme-gray');
}

/* Posiciona un par de flechas junto a un botón cualquiera dentro de
   `container` — misma lógica para #choice-list (por índice, hover) y para
   #laser-options (por botón, ver positionLaserArrowsAt). */
function positionArrowsIn(container, left, right, button) {
  if (!button || !container || !left || !right) return;
  const list = container.getBoundingClientRect();
  const rect = button.getBoundingClientRect();
  const arrowH = left.offsetHeight || 24;
  const y = Math.max(0, rect.top - list.top + (rect.height - arrowH) / 2);
  left.style.transform = `translateY(${y}px)`;
  right.style.transform = `translateY(${y}px)`;
}
function positionArrowsAt(button) {
  positionArrowsIn(choiceList, leftArrow, rightArrow, button);
}
function moveArrows(index) {
  positionArrowsAt(buttons[index]);
}
function positionLaserArrowsAt(button) {
  if (!button) return;
  lastLaserButton = button;
  positionArrowsIn(laserOptions, laserArrowLeft, laserArrowRight, button);
}

/* FLIP genérico: mide la posición de `elements` antes de `mutate()` (el
   cambio que reacomoda el layout — ej. ocultar #choice-list y mostrar
   #laser-options, de distinto alto), y si se movieron los desliza desde su
   posición anterior hasta la nueva en vez de dejarlos saltar de golpe.
   Mismo criterio que ya usa applyLang() para el cambio de idioma. */
function flipShift(elements, mutate) {
  if (!canAnimate) { mutate(); return; }
  const first = elements.map((el) => el.getBoundingClientRect().top);
  mutate();
  const last = elements.map((el) => el.getBoundingClientRect().top);
  elements.forEach((el, i) => {
    const delta = first[i] - last[i];
    el.style.transition = 'none';
    el.style.transform = Math.abs(delta) < 0.5 ? '' : `translateY(${delta}px)`;
  });
  void document.body.offsetHeight;   // fuerza reflow antes de animar al destino
  requestAnimationFrame(() => {
    elements.forEach((el) => {
      if (!el.style.transform) return;
      el.style.transition = 'transform 260ms cubic-bezier(.2,.9,.2,1)';
      el.style.transform = 'translateY(0)';
      const done = (e) => {
        if (e.propertyName !== 'transform') return;
        el.style.transition = '';
        el.style.transform = '';
        el.removeEventListener('transitionend', done);
      };
      el.addEventListener('transitionend', done);
    });
  });
}

function setLabel(button, label) {
  const el = button.querySelector('.choice-label');
  if (el) el.textContent = label;
}

/* El efecto blur sobre el video de fondo (en reproducción todo el tiempo)
   es la única reacción que queda ligada al hover/tap de los botones — antes
   cada botón tenía su propio video, ahora es uno solo por dispositivo. */
function setVideoBlur(active) {
  document.body.classList.toggle('video-blurred', active);
}

function texts() {
  return I18N[currentLang] || I18N.es;
}

function updateOpenStatus() {
  const line = document.querySelector('#status-line');
  const text = document.querySelector('#status-text-home');
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay();
  const open = (day >= 1 && day <= 5 && minutes >= 540 && minutes < 1080) || (day === 6 && minutes >= 600 && minutes < 840);
  line.classList.toggle('is-open', open);
  line.classList.toggle('is-closed', !open);
  text.textContent = open ? texts().open : texts().closed;
}

function applyLang(lang, animate) {
  currentLang = I18N[lang] ? lang : 'es';
  const t = texts();
  langGen += 1;
  const gen = langGen;
  document.documentElement.lang = currentLang;
  langButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.lang === currentLang));
  try { localStorage.setItem('aw-lang', currentLang); } catch (e) {}

  const eyebrow = document.querySelector('#home-eyebrow');
  const title = document.querySelector('#home-title');
  const subtitle = document.querySelector('#home-subtitle');
  const statusText = document.querySelector('#status-text-home');
  const bioTitleEl = document.querySelector('.bio-title');
  const bioTextEls = [...document.querySelectorAll('.bio-text')];
  const textEls = [eyebrow, title, subtitle, statusText, ...buttons.map((b) => b.querySelector('.choice-label'))].filter(Boolean);

  const applyAll = () => {
    eyebrow.textContent = t.eyebrow;
    title.textContent = t.title;
    subtitle.textContent = t.subtitle;
    buttons.forEach((button, i) => {
      const bt = t.buttons[i];
      if (!bt) return;
      button.dataset.labelDefault = bt.default;
      button.dataset.labelHover = bt.hover;
      if (!button.matches(':hover, :focus')) setLabel(button, bt.default);
    });
    /* Sección "Historia": no entra en la coreografía de fade/FLIP de arriba
       (solo se ve si esa sección está abierta) — basta con cambiar el texto. */
    if (bioTitleEl) bioTitleEl.textContent = t.bio.title;
    bioTextEls.forEach((el, i) => { if (t.bio.text[i] != null) el.textContent = t.bio.text[i]; });
    if (bioBackBtn) bioBackBtn.textContent = t.bio.back;
    updateOpenStatus();
  };

  if (!animate || !canAnimate) {
    applyAll();
    moveArrows(lastIndex);
    return;
  }

  killSwap();
  const flipEls = [...homeCard.children];
  flipEls.forEach((el) => { el.style.transition = ''; el.style.transform = ''; });

  // 1. Fade every text out (opacity + blur only — position is handled by the FLIP below).
  swapAnims = textEls.map((el) => el.animate(FADE_OUT, { duration: 140, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }));
  Promise.allSettled(swapAnims.map((a) => a.finished)).then(() => {
    if (gen !== langGen) return;

    // 2. FLIP: with everything faded out, swap the text (one reflow), then invert
    //    the position change so elements can glide to their new spot instead of jumping.
    const first = flipEls.map((el) => el.getBoundingClientRect().top);
    applyAll();
    const last = flipEls.map((el) => el.getBoundingClientRect().top);
    const moved = flipEls.map((el, i) => first[i] - last[i]);
    flipEls.forEach((el, i) => {
      if (Math.abs(moved[i]) < 0.5) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${moved[i]}px)`;
    });
    void homeCard.offsetHeight;

    // 3. Glide to the final layout and fade the text back in.
    requestAnimationFrame(() => {
      if (gen !== langGen) return;
      flipEls.forEach((el, i) => {
        if (Math.abs(moved[i]) < 0.5) return;
        el.style.transition = 'transform 240ms cubic-bezier(.2,.9,.2,1)';
        el.style.transform = 'translateY(0)';
        const done = (e) => {
          if (e.propertyName !== 'transform') return;
          el.style.transition = '';
          el.style.transform = '';
          el.removeEventListener('transitionend', done);
        };
        el.addEventListener('transitionend', done);
      });
      const ins = textEls.map((el) => el.animate(FADE_IN, { duration: 240, easing: 'cubic-bezier(.2,.9,.2,1)' }));
      killSwap();
      swapAnims = ins;
      Promise.allSettled(ins.map((a) => a.finished)).then(() => { if (gen === langGen) killSwap(); });
      moveArrows(lastIndex);
    });
  });
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

socialLinks.forEach((a) => a.addEventListener('click', () => {
  trackEvent('social_click', { network: a.dataset.brand, from: 'home' });
}));

function shakeOnce(button) {
  if (button.classList.contains('is-shaking')) return;
  button.classList.add('is-shaking');
  button.addEventListener('animationend', () => button.classList.remove('is-shaking'), { once: true });
}

/* Salida hacia el catálogo: los textos/botones se desvanecen (mismo criterio
   que ya usa el catálogo para "Volver al Home") antes de navegar. */
function leaveHome(href) {
  document.body.classList.add('leaving');
  if (!canAnimate) { window.location.href = href; return; }
  setTimeout(() => { window.location.href = href; }, 260);
}

/* `.leaving` nunca se saca por su cuenta (se agrega justo antes de navegar).
   Si el usuario vuelve con el botón "atrás" del navegador, algunos
   navegadores restauran la página desde caché (bfcache) sin volver a
   ejecutar este script — y la dejarían con todo en opacity:0 (pantalla
   negra) para siempre. `pageshow` con `persisted` detecta ese caso y
   deshace la clase. */
window.addEventListener('pageshow', (event) => {
  if (event.persisted) document.body.classList.remove('leaving');
});

/* Sección "Historia": el texto/botones del menú se desvanecen (igual que al
   ir al catálogo) pero el color y el video de fondo del botón se MANTIENEN
   fijos durante toda la sección — por eso usa su propia clase ".menu-hiding"
   en vez de ".leaving" (esa sí apaga video-stage, pensada para
   cuando de verdad se navega a otra página). "Volver al menú" hace el
   camino inverso y recién ahí vuelve el fondo gris por defecto. */
let bioTimer;
function openBio(button) {
  clearTimeout(bioTimer);
  bioActive = true;
  trackEvent('bio_open');
  /* El fondo temático (video + oscurecido) es cosa del hover de escritorio;
     en táctil el fondo de video va por su cuenta (autoplay nativo), así que acá
     no se toca. */
  if (button && !IS_TOUCH) { setTheme(button.dataset.theme); positionArrowsAt(button); }
  if (IS_TOUCH) setVideoBlur(true);   /* en táctil no hay hover: el tap en "Historia" es el disparador del blur */
  document.body.classList.add('menu-hiding');
  const after = () => {
    document.body.classList.remove('menu-hiding');
    document.body.classList.add('bio-open');
    bioPanel.hidden = false;
    void bioPanel.offsetWidth;   // fuerza reflow para poder re-disparar la animación si se reabre
    requestAnimationFrame(() => document.body.classList.add('bio-ready'));
  };
  if (!canAnimate) { after(); return; }
  bioTimer = setTimeout(after, 260);
}
function closeBio() {
  clearTimeout(bioTimer);
  trackEvent('bio_close');
  /* Si se cierra apenas se abrió, la animación de entrada (riseIn, disparada
     por .bio-ready) puede seguir corriendo — y una animación activa siempre
     gana sobre una transición nueva, así que la salida no se vería. Sacar
     .bio-ready de inmediato la corta ahí mismo. */
  document.body.classList.remove('bio-ready');
  document.body.classList.add('bio-leaving');
  const after = () => {
    document.body.classList.remove('bio-open', 'bio-ready', 'bio-leaving');
    bioPanel.hidden = true;
    bioActive = false;
    setTheme('gray');
    setVideoBlur(false);
  };
  if (!canAnimate) { after(); return; }
  bioTimer = setTimeout(after, 220);
}
bioBackBtn.addEventListener('click', closeBio);

/* Sección "Corte y grabado láser": a diferencia de "Historia", acá SOLO se
   desvanecen los botones de navegación (".choices-hiding" — eyebrow, título,
   subtítulo y horario quedan visibles todo el tiempo) y en su lugar entran
   dos botones nuevos (#laser-options). El color/video del botón sí se
   mantienen fijos mientras se ve esta subsección, igual que en "Historia". */
let laserTimer;
function openLaser(button) {
  clearTimeout(laserTimer);
  laserActive = true;
  trackEvent('laser_open');
  if (button && !IS_TOUCH) { setTheme(button.dataset.theme); positionArrowsAt(button); }
  document.body.classList.add('choices-hiding');
  const after = () => {
    document.body.classList.remove('choices-hiding');
    flipShift(reflowEls(), () => {
      document.body.classList.add('laser-open');
      laserOptions.hidden = false;
      positionLaserArrowsAt(laserButtons[0]);   /* posición inicial: primer botón de la subsección */
    });
    void laserOptions.offsetWidth;   // fuerza reflow para poder re-disparar la animación si se reabre
    requestAnimationFrame(() => document.body.classList.add('laser-ready'));
  };
  if (!canAnimate) { after(); return; }
  laserTimer = setTimeout(after, 260);
}
function closeLaser() {
  clearTimeout(laserTimer);
  trackEvent('laser_close');
  /* Mismo motivo que en closeBio(): si se cierra apenas se abrió, la
     animación de entrada (.laser-ready) puede seguir corriendo y taparía
     la de salida — se corta sacando la clase de inmediato. */
  document.body.classList.remove('laser-ready');
  document.body.classList.add('laser-leaving');
  const after = () => {
    flipShift(reflowEls(), () => {
      document.body.classList.remove('laser-open', 'laser-ready');
      laserOptions.hidden = true;
    });
    document.body.classList.remove('laser-leaving');
    laserActive = false;
    setTheme('gray');
    setVideoBlur(false);
  };
  if (!canAnimate) { after(); return; }
  laserTimer = setTimeout(after, 220);
}
laserBackBtn.addEventListener('click', closeLaser);

/* "Catálogo láser" navega a una página real (catalogo-laser/), con la misma
   salida animada que el resto de los links que dejan el Home. "Cotizador"
   todavía no tiene destino definido. */
const laserCatalogBtn = document.querySelector('#laser-catalogo-btn');
if (laserCatalogBtn) {
  laserCatalogBtn.addEventListener('click', (event) => {
    trackEvent('home_button_click', { button: 'laser-catalogo' });
    if (!canAnimate) return;
    event.preventDefault();
    leaveHome(laserCatalogBtn.getAttribute('href'));
  });
}

/* "Servicio de corte y grabado láser" abre WhatsApp en una pestaña nueva con
   un mensaje precargado (mismo criterio que "Diseñar una idea" del menú
   principal) — no navega dentro del Home, así que no necesita leaveHome(). */
const laserCotizadorBtn = document.querySelector('#laser-cotizador-btn');
if (laserCotizadorBtn) {
  laserCotizadorBtn.addEventListener('click', () => {
    trackEvent('home_button_click', { button: 'laser-cotizador' });
  });
}

buttons.forEach((button, index) => {
  const show = () => {
    lastIndex = index;
    setTheme(button.dataset.theme);
    positionArrowsAt(button);   /* las flechas siguen a CUALQUIER botón */
    setLabel(button, button.dataset.labelHover || button.dataset.labelDefault);
    setVideoBlur(true);
  };
  const hide = () => {
    setLabel(button, button.dataset.labelDefault);
    setVideoBlur(false);
  };

  if (!IS_TOUCH) {
    button.addEventListener('pointerenter', show);
    button.addEventListener('pointerleave', hide);
    button.addEventListener('focus', show);
    button.addEventListener('blur', hide);
  }

  button.addEventListener('click', (event) => {
    const locked = button.classList.contains('is-locked');
    const isBio = button.dataset.action === 'bio';
    const isLaser = button.dataset.action === 'laser';
    const opensBlank = button.target === '_blank';

    if (locked) {
      event.preventDefault();
      setLabel(button, button.dataset.labelHover || button.dataset.labelDefault);
      shakeOnce(button);
      /* En escritorio el hover ya deja el texto en "¡Próximamente!" y
         pointerleave lo revierte al soltar el mouse. En táctil no hay ese
         paso, así que se revierte solo, apenas termina el sacudido. */
      if (IS_TOUCH) button.addEventListener('animationend', () => setLabel(button, button.dataset.labelDefault), { once: true });
      return;
    }

    if (!isBio && !isLaser && button.dataset.trackId) trackEvent('home_button_click', { button: button.dataset.trackId });

    /* En escritorio el hover ya sincronizó el fondo con este botón. En
       táctil no existe ese paso — el fondo va por su cuenta (autoplay
       nativo) y el tap solo dispara la animación de
       salida/entrada correspondiente, sin espera artificial de por medio. */
    if (isBio) { event.preventDefault(); openBio(button); return; }
    if (isLaser) { event.preventDefault(); openLaser(button); return; }
    if (opensBlank) return;   // WhatsApp, etc.: sigue su click normal (nueva pestaña)
    event.preventDefault();
    leaveHome(button.getAttribute('href'));
  });
});

if (!IS_TOUCH) {
  choiceList.addEventListener('mouseleave', () => {
    if (bioActive || laserActive) return;   /* su fondo se mantiene fijo mientras esa sección está abierta */
    setTheme('gray');
    setVideoBlur(false);
    buttons.forEach((button) => setLabel(button, button.dataset.labelDefault));
  });

  /* Mismo criterio que los botones de #choice-list: las flechas de
     #laser-options siguen a cualquiera de sus 3 botones al pasar el mouse o
     enfocarlo (no cambian tema/video — esta subsección ya tiene el suyo fijo). */
  laserButtons.forEach((button) => {
    button.addEventListener('pointerenter', () => positionLaserArrowsAt(button));
    button.addEventListener('focus', () => positionLaserArrowsAt(button));
  });
}

/* ── FONDO DE VIDEO ──
   No hay JS de reproducción a propósito. El <video> del index se reproduce
   solo (autoplay + muted + loop + playsinline) y el navegador elige entre la
   fuente vertical y la horizontal con el `media` de cada <source>. Cualquier
   play()/pause() desde acá solo podría interrumpir ese autoplay nativo, que
   es exactamente lo que rompía la reproducción en móvil. */

window.addEventListener('resize', () => {
  moveArrows(lastIndex);
  if (laserActive) positionLaserArrowsAt(lastLaserButton || laserButtons[0]);
});

setInterval(updateOpenStatus, 60000);
setTheme('gray');
applyLang(detectLang());
requestAnimationFrame(() => document.body.classList.add('page-ready'));
document.fonts?.ready.then(() => moveArrows(lastIndex));
