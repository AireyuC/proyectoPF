export type ProductCategory = 'REPUESTO' | 'ACCESORIO' | 'HERRAMIENTA' | 'OTRO';

export interface Product {
    id: string;
    name: string;        // Ej: "Pantalla Samsung A50 Incell"
    category: ProductCategory;
    stock: number;       // Cantidad actual
    minStock: number;    // Alerta: "¡Quedan pocos!"
    costPrice: number;   // Cuánto me costó (Privado)
    salePrice: number;   // A cuánto lo vendo (Público)
    location?: string;   // Ej: "Estante 2, Caja B" (Opcional pero útil)
}
