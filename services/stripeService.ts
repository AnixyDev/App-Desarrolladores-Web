// ========================== ACCIÓN REQUERIDA ==========================
// Este archivo está preparado para una integración real con Stripe.
//
// 1. OBTÉN Y REEMPLAZA LOS IDs DE PRECIO:
//    - Ve a tu Dashboard de Stripe > Productos.
//    - Para cada producto, busca su sección de "Precios".
//    - Copia el "ID de Precio" (empieza con `price_...`) para cada plan.
//    - Pega los IDs en los placeholders correspondientes en el objeto `STRIPE_ITEMS` de abajo.
//
// 2. DESPLIEGA EL BACKEND EN VERCEL:
//    Asegúrate de haber creado el archivo `/api/create-checkout-session.js`
//    y haber configurado tu `STRIPE_SECRET_KEY` en las variables de entorno de Vercel.
//
// ¡NUNCA expongas tu CLAVE SECRETA de Stripe en el código del frontend!
// ========================================================================

// Paso 1: Reemplaza esta clave con tu propia Clave Publicable de Stripe (Live o Test).
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SDWPB8oC5awQy1545zGz4ujNU8tnMm7YDT8FME95jWrGHttn8cHN7koOrcVOGqz7jXxODYmKslH1aqSaYULJPgn00WD4Bq8SD';

declare const Stripe: any; // Declara la variable global de Stripe

let stripePromise: any;
const getStripe = () => {
    if (!stripePromise) {
        if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
            console.error('La clave publicable de Stripe no está configurada en services/stripeService.ts');
            return null;
        }
        stripePromise = Stripe(STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};

// Paso 2: Reemplaza los placeholders con tus IDs de Precio reales de Stripe.
export const STRIPE_ITEMS = {
    proPlan: {
        priceId: 'price_1SOgUF8oC5awQy15dOEM5jGS', // Producto: prod_TLNEUCgXpmygfC
        mode: 'subscription',
    },
    teamsPlanMonthly: {
        priceId: 'price_1SOggV8oC5awQy15YW1wAgcg', // Producto: prod_TLNRqLNFURfkXo
        mode: 'subscription',
    },
    teamsPlanYearly: {
        priceId: 'price_1SOggV8oC5awQy15Ppz7bUj0', // Producto: prod_TLNRqLNFURfkXo
        mode: 'subscription',
    },
    credits100: {
        priceId: 'price_1SOgpy8oC5awQy15TW22fBot', // Producto: prod_TLNbwg5mtQ8stj
        mode: 'payment',
        credits: 100,
    },
    credits500: {
        priceId: 'price_1SOgr18oC5awQy15o1gTM2VM', // Producto: prod_TLNcsiKdJrGSfr
        mode: 'payment',
        credits: 500
    },
    credits1000: {
        priceId: 'price_1SOguC8oC5awQy15LGchpkVG', // Producto: prod_TLNfeYcDhzRqU7
        mode: 'payment',
        credits: 1000
    },
    featuredJobPost: {
        priceId: 'price_1SOlOv8oC5awQy15Q2aXoEg7',
        mode: 'payment',
    }
};

/**
 * Inicia una sesión de checkout contactando con la Serverless Function y redirige al usuario.
 * @param itemKey La clave del producto a comprar (ej. 'proPlan')
 */
export const redirectToCheckout = async (itemKey: keyof typeof STRIPE_ITEMS) => {
    const item = STRIPE_ITEMS[itemKey];
    
    if (!item) {
        throw new Error('Producto no encontrado.');
    }
    
    if (item.priceId.includes('REEMPLAZAR')) {
        throw new Error(`El ID de Precio para '${itemKey}' no ha sido configurado. Por favor, actualiza 'services/stripeService.ts'.`);
    }

    // El frontend llama a la Serverless Function que creaste en /api/create-checkout-session.js
    const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            priceId: item.priceId, 
            mode: item.mode,
            itemKey: itemKey // Se añade la clave del producto para el seguimiento
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error('Error desde el backend:', errorBody);
        throw new Error(errorBody.error?.message || 'Error en el servidor al crear la sesión de pago.');
    }

    const { sessionId } = await response.json();
    
    // Redirige al usuario al Checkout de Stripe usando el ID de sesión.
    const stripe = getStripe();
    if (!stripe) {
        throw new Error('Stripe.js no se ha cargado correctamente.');
    }

    const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
    });

    if (error) {
        console.warn('Error al redirigir a Stripe Checkout:', error);
        throw new Error('No se pudo iniciar el proceso de pago.');
    }
};