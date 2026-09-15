/* AndiWorks · Analítica (GA4 + Cloudflare Web Analytics + Microsoft Clarity)
 * Un solo lugar con los 3 IDs y con los eventos de negocio que se registran,
 * para no duplicar credenciales entre el Home y el catálogo. No se carga en
 * catalogo/admin/ (herramienta interna: no hay que medirla).
 *
 * Ver ANALITICAS.md en la raíz del proyecto para qué mide cada herramienta
 * y qué revisar en cada dashboard. */

(function () {
  var GA_ID = 'G-T3MKR9SY4T';
  var CLARITY_ID = 'wu67pyn8co';
  var CF_BEACON_TOKEN = '4230414b7e8c4d5199f5c71b5dead0c0';

  /* Google Analytics 4 */
  var gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(gaScript);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  /* Cloudflare Web Analytics — solo métricas automáticas (páginas vistas,
     rendimiento, países); no tiene API de eventos personalizados. */
  var cfScript = document.createElement('script');
  cfScript.type = 'module';
  cfScript.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  cfScript.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_BEACON_TOKEN }));
  document.head.appendChild(cfScript);

  /* Microsoft Clarity (grabación de sesiones + mapas de calor) */
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i + '?ref=bwt';
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);

  /* Eventos de negocio: helper único usado por assets/js/main.js (Home) y
     assets/js/catalog-app.js (compartido por ambos catálogos). Va a GA4 y a Clarity (soporta "custom
     events" propios); Cloudflare Web Analytics no recibe nada acá porque
     no tiene esa capacidad en su versión gratuita.
     Todo con try/catch: si un bloqueador de anuncios frena algún script,
     la analítica nunca debe poder romper el resto del sitio. */
  window.AW = window.AW || {};
  window.AW.trackEvent = function (name, params) {
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) {}
    try { if (typeof window.clarity === 'function') window.clarity('event', name); } catch (e) {}
  };
})();
