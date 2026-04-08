import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    // Cerrar con la tecla ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header Turquesa Minimalista */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-6 bg-teal-500 rounded-full block"></span>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Contenido Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};