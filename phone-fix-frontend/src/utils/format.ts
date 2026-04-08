// src/utils/format.ts

// Formatea dinero: 150 -> "Bs. 150.00"
export const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2
    }).format(amount);
};

// Genera enlace de WhatsApp: wa.me/591...?text=...
export const createWhatsAppLink = (phone: string, message: string): string => {
    // Limpiamos el número (quitamos espacios, guiones, +)
    const cleanPhone = phone.replace(/\D/g, '');
    // Asumimos código de país Bolivia (591) si no lo tiene
    const fullPhone = cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
};