# AndiWorks

**Mueblería y diseño personalizado.** Diseño y fabricación de mobiliario paramétrico a medida: espejos, muebles y objetos con corte digital, grabado láser y modelado 3D.

🌐 **[andiworks.cl](https://andiworks.cl)**

---

## Qué es este sitio

La casa digital de AndiWorks. En vez de un menú tradicional, la página recibe con una pregunta —**¿Qué quieres hacer?**— y deja que cada visitante elija su propio camino:

- **Ver el catálogo** — proyectos de mobiliario a medida, con fotos y modelos 3D que se pueden rotar y explorar.
- **Diseñar una idea** — conversación directa por WhatsApp para proyectos nuevos.
- **Corte y grabado láser** — proyectos personalizados y cotización en línea.
- **Quién soy / Cómo trabajo** — el proceso y la historia detrás del taller.

Todo sobre un fondo en video a pantalla completa, que se adapta según estés en un teléfono o en un computador.

## Detalles que vale la pena mirar

**Trilingüe.** Español, inglés y chino (ES / EN / 中). Detecta el idioma del navegador en la primera visita y recuerda la preferencia.

**Catálogo con 3D real.** Los productos no son solo fotos: varios incluyen el modelo tridimensional que se usó para fabricarlos, visualizable directamente en el navegador con iluminación y sombras realistas.

**Sabe si el taller está abierto.** La página calcula el horario en vivo (lunes a viernes 09:00–18:00, sábado 10:00–14:00) y lo muestra al pie.

**Pensado para el teléfono.** El fondo, los textos y la navegación cambian según el formato de pantalla, incluyendo un video vertical propio para móviles.

**Liviano de verdad.** HTML, CSS y JavaScript puro. Sin frameworks, sin compilación, sin dependencias que instalar.

## Estructura

```text
├── index.html          Home
├── catalogo/           Catálogo de mobiliario (con modelos 3D)
├── catalogo-laser/     Catálogo de corte y grabado láser
└── assets/             Estilos, scripts, video y logos
```

Ambos catálogos comparten el mismo motor (`assets/js/catalog-app.js` y `assets/css/catalog-app.css`): una sola base de código, dos vitrinas distintas.

## Ver el proyecto en local

Necesita servirse por HTTP para que carguen los modelos 3D:

```bash
python3 -m http.server 8000
```

Después, abrir `http://localhost:8000`.

## Contacto

📱 WhatsApp: [+56 9 5370 6307](https://wa.me/56953706307)
🌐 Web: [andiworks.cl](https://andiworks.cl)

---

<sub>Hecho en Chile 🇨🇱</sub>
