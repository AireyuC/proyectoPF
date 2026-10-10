import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = 'max-w-4xl'
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-all">
      <div className={`bg-[#0D121F] border border-[#1E293B] rounded-2xl md:rounded-3xl shadow-2xl w-full ${maxWidth} max-h-[90vh] max-h-[90dvh] flex flex-col overflow-hidden glow-cyan-subtle`}>

        {/* Header Cyber */}
        <div className="px-5 py-4 border-b border-[#1E293B] flex justify-between items-center bg-[#0A0E18] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-[#00E5FF] rounded-full shadow-[0_0_8px_#00E5FF]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 min-h-0 text-white">
          {children}
        </div>
      </div>
    </div>
  );
};