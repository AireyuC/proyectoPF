// src/features/workshop/types/index.ts

export type RepairStatus =
    | 'RECIBIDO'
    | 'DIAGNOSTICO'
    | 'ESPERA_CLIENTE'
    | 'EN_PROCESO'
    | 'TERMINADO'
    | 'ENTREGADO';

export interface Client {
    fullName: string;
    phone: string; // El número principal para WhatsApp
    ci?: string;
}

export interface Device {
    brand: string;   // Ej: Samsung
    model: string;   // Ej: A50
    color: string;
    imei?: string;
    passcode?: string; // Patrón o PIN
    condition: string[]; // ['Pantalla rota', 'Rayado', 'Sin botón']
}

export interface RepairOrder {
    id: string;
    ticketNumber: string; // Código corto para buscar rápido
    client: Client;
    device: Device;
    issueDescription: string; // Lo que dice el cliente
    technicianNotes: string;  // Diagnóstico real
    estimatedCost: number;
    status: RepairStatus;
    entryDate: Date;
}