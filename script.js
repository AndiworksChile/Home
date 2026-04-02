// Script loaded

// Datos placeholder para 20 productos (expandible)
// Importados desde products.js

// Función para shuffle array (aleatoriedad)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Generar mosaico
function generateMosaic() {
    console.log('Generando mosaico...');
    const container = document.getElementById('mosaic-container');
    console.log('Container:', container);
    shuffledProducts = shuffleArray([...products]); // Asignar global
    console.log('Productos shuffled:', shuffledProducts.length);

    shuffledProducts.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = `card ${product.size}`;
        card.setAttribute('data-index', index);
        card.setAttribute('data-product-name', product.name);
        card.innerHTML = `
            <img src="${product.images[0]}" alt="${product.name}">
            <div class="quick-quote-btn" data-product="${product.name}">
                <img src="icons/whatsapp-icon.svg" alt="Cotizar">
                <span class="quote-tooltip">cotiza aquí</span>
            </div>
        `;
        container.appendChild(card);
        console.log(`Card ${index} creada: ${product.name}, size: ${product.size}, category: ${product.category}`);
    });

    // Animación de entrada con Anime.js: Emerger desde centroide (sincronizada con imágenes, más lenta para apreciar cascada)
    anime({
        targets: '.card > img', // Solo la imagen principal, no el ícono
        scale: [0, 1],
        opacity: [0, 1],
        duration: 1000, // Más lenta para apreciar
        delay: anime.stagger(125, {start: 500}), // Stagger mayor (300ms) con delay inicial 500ms para cascada visible
        easing: 'easeOutElastic(1, .8)' // Rebote sutil
    }).finished.then(() => {
        // Después de la animación inicial, añadir hover effects
        addHoverEffects();
    });
}

// Función para añadir efectos hover (emergencia de la card hovered)
function addHoverEffects() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
        const quoteBtn = card.querySelector('.quick-quote-btn');
        
        // 📱 CLICK EN ÍCONO DE COTIZACIÓN RÁPIDA
        if (quoteBtn) {
            quoteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita abrir el lightbox
                const productName = quoteBtn.getAttribute('data-product');
                const message = encodeURIComponent(`Hola, me interesa el producto: ${productName}`);
                const whatsappUrl = `https://wa.me/56953706307?text=${message}`;
                window.open(whatsappUrl, '_blank');
            });
        }
        
        card.addEventListener('mouseenter', () => {
            // Hacer emerger la card: elevar y escalar ligeramente
            anime({
                targets: card,
                scale: 1.04,
                duration: 300,
                easing: 'easeOutQuad'
            });
        });

        card.addEventListener('mouseleave', () => {
            // Volver a posición original
            anime({
                targets: card,
                scale: 1,
                duration: 300,
                easing: 'easeOutQuad'
            });
        });

        card.addEventListener('click', () => {
            // Animación de saltos ligeros para sensación de selección
            anime.timeline({
                targets: card,
                easing: 'easeOutQuad'
            })
            .add({ translateY: -10, duration: 100 })
            .add({ translateY: 0, duration: 100 })
            .add({ translateY: -5, duration: 100 })
            .add({ translateY: 0, duration: 100 })
            .finished.then(() => {
                // Después de saltos, abrir vista ampliada
                const index = parseInt(card.getAttribute('data-index'));
                openOverlay(index);
            });
        });
    });
}

// Función para navegación con teclado
function handleKeydown(e) {
    if (isAnimating) return; // Prevenir cambios durante animación
    if (e.key === 'ArrowRight') changeImage(currentImageIndex + 1);
    else if (e.key === 'ArrowLeft') changeImage(currentImageIndex - 1);
    else if (e.key === 'Escape') closeOverlay({ target: { id: 'overlay' } });
}

// 🎯 Funciones para flechas de navegación
function handleNavPrev(e) {
    e.stopPropagation(); // Evita que cierre el overlay
    if (!isAnimating) changeImage(currentImageIndex - 1);
}

function handleNavNext(e) {
    e.stopPropagation(); // Evita que cierre el overlay
    if (!isAnimating) changeImage(currentImageIndex + 1);
}

// Variable para controlar animaciones
let isAnimating = false;

// Función para abrir vista ampliada
function openOverlay(index) {
    const overlay = document.getElementById('overlay');
    // Cerrar overlay inmediatamente si está abierto
    if (overlay.style.display === 'flex') {
        overlay.style.display = 'none';
        // Remover listeners acumulados
        document.removeEventListener('keydown', handleKeydown);
        overlay.removeEventListener('click', closeOverlay);
        document.getElementById('close-btn').removeEventListener('click', closeOverlay);
        document.getElementById('large-image').removeEventListener('click', advanceImage);
        // 🎯 Limpiar listeners de flechas
        document.getElementById('nav-prev').removeEventListener('click', handleNavPrev);
        document.getElementById('nav-next').removeEventListener('click', handleNavNext);
    }
    const largeImage = document.getElementById('large-image');
    const indicators = document.getElementById('indicators');
    const productTitle = document.getElementById('product-title');
    const instagramBtn = document.getElementById('instagram-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const specsPanel = document.getElementById('specs-panel');
    const specsDimensions = document.getElementById('specs-dimensions');
    const specsDescription = document.getElementById('specs-description');
    const product = shuffledProducts[index];
    currentProductIndex = index;

    // Mostrar título
    productTitle.textContent = product.title;

    // Mostrar primera imagen
    largeImage.src = product.images[0];
    currentImageIndex = 0;

    // Crear indicadores
    indicators.innerHTML = '';
    product.images.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `indicator ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            if (!isAnimating) { // Solo permitir click si no hay animación activa
                changeImage(i);
            }
        });
        indicators.appendChild(dot);
    });

    // Configurar botones de contacto
    instagramBtn.href = product.contact.instagram;
    whatsappBtn.href = product.contact.whatsapp;

    // � PRECARGAR TODAS LAS IMÁGENES DEL PRODUCTO
    // Esto hace que las transiciones sean instantáneas
    product.images.forEach((img, i) => {
        if (i > 0) { // La primera ya se muestra
            const preload = new Image();
            preload.src = img.src || img;
        }
    });

    // �📋 CONFIGURAR PANEL DE ESPECIFICACIONES
    // Resetear estado del panel (oculto inicialmente)
    specsPanel.classList.remove('visible');
    
    // Poblar contenido de especificaciones
    if (product.specs) {
        const dims = product.specs.dimensions;
        specsDimensions.innerHTML = `<strong>Dimensiones:</strong>Ancho: ${dims.ancho}\nAlto: ${dims.alto}\nLargo: ${dims.largo}`;
        specsDescription.innerHTML = `<strong>Descripción:</strong>${product.specs.description}`;
        
        // 🎬 ANIMAR ENTRADA del panel con delay
        setTimeout(() => {
            specsPanel.classList.add('visible');
        }, 400); // ⏱️ DELAY antes de que aparezca (en ms)
    }

    // Mostrar overlay con animación
    overlay.style.display = 'flex';
    anime({
        targets: overlay,
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
    });

    // Función para avanzar imagen
    const advanceImage = () => changeImage(currentImageIndex + 1);

    // Listeners para navegación
    document.addEventListener('keydown', handleKeydown);
    overlay.addEventListener('click', closeOverlay);
    document.getElementById('close-btn').addEventListener('click', closeOverlay);
    
    // 🎯 FLECHAS DE NAVEGACIÓN
    document.getElementById('nav-prev').addEventListener('click', handleNavPrev);
    document.getElementById('nav-next').addEventListener('click', handleNavNext);
}

// Función para cambiar imagen
function changeImage(newIndex) {
    // Prevenir cambios múltiples durante animación
    if (isAnimating) return;
    
    const product = shuffledProducts[currentProductIndex];
    if (newIndex >= product.images.length) newIndex = 0; // Loop a primera
    if (newIndex < 0) newIndex = product.images.length - 1; // Loop a última

    // Si es la misma imagen, no hacer nada
    if (newIndex === currentImageIndex) return;

    isAnimating = true;
    const largeImage = document.getElementById('large-image');
    const imageData = product.images[newIndex];
    const newSrc = imageData.src || imageData;
    
    // 🔄 PRECARGAR IMAGEN antes de mostrarla
    const preloadImg = new Image();
    preloadImg.src = newSrc;
    
    // 🎬 FADE OUT mientras carga
    anime({
        targets: largeImage,
        opacity: [1, 0],
        duration: 150,              // ⏱️ DURACIÓN FADE OUT (ms)
        easing: 'easeOutQuad',
        complete: () => {
            // Función para mostrar imagen
            const showImage = () => {
                currentImageIndex = newIndex;
                largeImage.src = newSrc;
                
                // Fade in
                anime({
                    targets: largeImage,
                    opacity: [0, 1],
                    duration: 350,  // ⏱️ DURACIÓN FADE IN (ms) - Más lento para suavidad
                    easing: 'easeInOutQuad',
                    complete: () => {
                        isAnimating = false;
                    }
                });
            };
            
            // Si la imagen ya cargó, mostrar inmediatamente
            if (preloadImg.complete) {
                showImage();
            } else {
                // Esperar a que cargue
                preloadImg.onload = showImage;
                preloadImg.onerror = showImage; // Mostrar aunque falle (evitar bloqueo)
            }
        }
    });

    // Actualizar indicadores inmediatamente
    document.querySelectorAll('.indicator').forEach((dot, i) => {
        dot.classList.toggle('active', i === newIndex);
    });
}

// Función para cerrar overlay
function closeOverlay(e) {
    if (e.target.id === 'overlay' || e.target.id === 'close-btn') {
        const overlay = document.getElementById('overlay');
        const largeImage = document.getElementById('large-image');
        const specsPanel = document.getElementById('specs-panel');
        
        // 🎬 OCULTAR PANEL DE ESPECIFICACIONES primero
        specsPanel.classList.remove('visible');
        
        anime({
            targets: overlay,
            opacity: [1, 0],
            duration: 300,
            easing: 'easeOutQuad',
            complete: () => {
                overlay.style.display = 'none';
            }
        });
        document.removeEventListener('keydown', handleKeydown);
        overlay.removeEventListener('click', closeOverlay);
        document.getElementById('close-btn').removeEventListener('click', closeOverlay);
        // 🎯 Limpiar listeners de flechas
        document.getElementById('nav-prev').removeEventListener('click', handleNavPrev);
        document.getElementById('nav-next').removeEventListener('click', handleNavNext);
    }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', generateMosaic);

// ═══════════════════════════════════════════════════════════════
// CONTROL DE ROTACIÓN DEL LOGO 3D EN HOVER
// ═══════════════════════════════════════════════════════════════

const logo3D = document.querySelector('model-viewer');
const logo3DContainer = document.querySelector('.logo-3d-container');

if (logo3D && logo3DContainer) {
  // Detener rotación al hacer hover
  logo3DContainer.addEventListener('mouseenter', () => {
    logo3D.autoRotate = false;
  });

  // Reanudar rotación al salir
  logo3DContainer.addEventListener('mouseleave', () => {
    logo3D.autoRotate = true;
  });
}