// ═══════════════════════════════════════════════════════════════
// CATÁLOGO DE PRODUCTOS
// ═══════════════════════════════════════════════════════════════

// 🏷️ PRODUCTOS REALES
// Agrega aquí tus productos con imágenes reales
const realProducts = [
    {
        id: 'comoda-01',
        name: 'Cómoda',
        title: 'Cómoda',
        category: 'Mueble',
        priority: 2,  // 🔥 1=normal, 2=destacado, 3=muy importante
        specs: {
            dimensions: {
                ancho: '80cm',
                alto: '120cm',
                largo: '45cm'
            },
            description: 'Cómoda de diseño moderno con acabados premium.'
        },
        images: [
            'catalog/1_comoda/comoda_1.webp',
            'catalog/1_comoda/comoda_2.webp',
            'catalog/1_comoda/comoda_3.webp',
            'catalog/1_comoda/comoda_4.webp',
            'catalog/1_comoda/comoda_5.webp'
        ],
        size: 'small',
        contact: {
            instagram: 'https://instagram.com/tuusuario',
            whatsapp: 'https://wa.me/1234567890'
        }
    }
    // 📌 Agrega más productos reales aquí siguiendo el mismo formato
];

// 🖼️ PRODUCTOS PLACEHOLDER
// Se generan automáticamente para rellenar el mosaico
const placeholderCount = 20 - realProducts.length; // Ajusta el total deseado
const placeholderProducts = Array.from({ length: placeholderCount }, (_, i) => ({
    id: `placeholder-${i + 1}`,
    name: `Producto ${i + 1}`,
    title: `Título Producto ${i + 1}`,
    category: ['StandQR', 'Letrero', 'Trofeo'][i % 3],
    priority: 1,
    specs: {
        dimensions: {
            ancho: `${10 + (i % 5) * 2}cm`,
            alto: `${15 + (i % 4) * 3}cm`,
            largo: `${5 + (i % 3) * 2}cm`
        },
        description: `Producto de alta calidad elaborado con materiales premium. Ideal para uso comercial y residencial.`
    },
    images: [
        `https://picsum.photos/seed/${i}a/1200/1600`,
        `https://picsum.photos/seed/${i}b/1200/1600`,
        `https://picsum.photos/seed/${i}c/1200/1600`,
        `https://picsum.photos/seed/${i}d/1200/1600`,
        `https://picsum.photos/seed/${i}e/1200/1600`
    ],
    size: Math.random() < 0.75 ? 'small' : 'medium',
    contact: {
        instagram: 'https://instagram.com/tuusuario',
        whatsapp: 'https://wa.me/1234567890'
    }
}));

// 📦 COMBINAR TODOS LOS PRODUCTOS
const products = [...realProducts, ...placeholderProducts];