export interface Client {
    id: string;
    fullName: string;
    ci: string; // Carnet de Identidad
    phones: string[]; // Array de números (Ej: ["77001234", "60005678"])
    email?: string;
    isVip: boolean; // El switch que pediste
    totalRepairs: number; // Histórico: cuántas veces ha venido
    totalSpent: number; // Histórico: cuánto dinero ha dejado
    lastVisit: string; // Fecha ISO
    notes?: string;
}
