import React, { useState, useRef, useCallback } from 'react';

interface PatternLockProps {
  onChange?: (pattern: number[]) => void;
  size?: number; // Tamaño en píxeles (default: 240)
}

interface Point {
  id: number;
  x: number;
  y: number;
}

// 9 Puntos en una cuadrícula de 240x240
const DOTS: Point[] = [
  { id: 1, x: 40, y: 40 },
  { id: 2, x: 120, y: 40 },
  { id: 3, x: 200, y: 40 },
  { id: 4, x: 40, y: 120 },
  { id: 5, x: 120, y: 120 },
  { id: 6, x: 200, y: 120 },
  { id: 7, x: 40, y: 200 },
  { id: 8, x: 120, y: 200 },
  { id: 9, x: 200, y: 200 },
];

const HIT_RADIUS = 26; // Radio de colisión para enganchar el punto

export const PatternLock: React.FC<PatternLockProps> = ({ onChange, size = 240 }) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Convierte coordenadas de pantalla a espacio local SVG (0-240)
  const getSvgCoordinates = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = 240 / rect.width;
    return {
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top) * scale,
    };
  }, []);

  // Detecta si el puntero está cerca de un punto aún no seleccionado
  const detectHit = useCallback((coords: { x: number; y: number }, currentSelected: number[]): number | null => {
    for (const dot of DOTS) {
      if (!currentSelected.includes(dot.id)) {
        const dist = Math.hypot(coords.x - dot.x, coords.y - dot.y);
        if (dist <= HIT_RADIUS) {
          return dot.id;
        }
      }
    }
    return null;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Captura el puntero para arrastre suave incluso si sale del canvas
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const coords = getSvgCoordinates(e);
    if (!coords) return;

    const hit = detectHit(coords, []);
    if (hit) {
      const newPath = [hit];
      setSelected(newPath);
      setIsDrawing(true);
      setPointer(coords);
    } else {
      setSelected([]);
      setIsDrawing(false);
      setPointer(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const coords = getSvgCoordinates(e);
    if (!coords) return;

    setPointer(coords);

    const hit = detectHit(coords, selected);
    if (hit) {
      const nextPath = [...selected, hit];
      setSelected(nextPath);
      if (navigator.vibrate) {
        try { navigator.vibrate(15); } catch {}
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setPointer(null);
    if (onChange) {
      onChange(selected);
    }
  };

  const handleReset = () => {
    setSelected([]);
    setIsDrawing(false);
    setPointer(null);
    if (onChange) {
      onChange([]);
    }
  };

  const lastDot = selected.length > 0 ? DOTS.find(d => d.id === selected[selected.length - 1]) : null;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      
      {/* Contenedor del Patrón con Canvas SVG */}
      <div 
        className="relative bg-[#0D121F] border border-[#1E293B] rounded-3xl p-2 glow-cyan-subtle shadow-xl overflow-hidden touch-none"
        style={{ width: size, height: size }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 240 240"
          className="w-full h-full cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            {/* Filtro de Resplandor Neón Cyan */}
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00E5FF" floodOpacity="0.8" />
            </filter>
            <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00E5FF" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* 1. LÍNEAS FIJAS ENTRE PUNTOS CONECTADOS (El Hilo Principal) */}
          {selected.map((dotId, index) => {
            if (index === 0) return null;
            const prevDot = DOTS.find(d => d.id === selected[index - 1])!;
            const currDot = DOTS.find(d => d.id === dotId)!;
            return (
              <line
                key={`line-${index}`}
                x1={prevDot.x}
                y1={prevDot.y}
                x2={currDot.x}
                y2={currDot.y}
                stroke="#00E5FF"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#neon-glow)"
              />
            );
          })}

          {/* 2. LÍNEA ELÁSTICA EN VIVO QUE SIGUE EL DEDO / CURSOR (El Hilo Flotante) */}
          {isDrawing && pointer && lastDot && (
            <line
              x1={lastDot.x}
              y1={lastDot.y}
              x2={pointer.x}
              y2={pointer.y}
              stroke="#00E5FF"
              strokeWidth="3.5"
              strokeDasharray="4 3"
              strokeLinecap="round"
              opacity="0.85"
              filter="url(#neon-glow)"
            />
          )}

          {/* 3. LOS 9 PUNTOS TÁCTILES */}
          {DOTS.map((dot) => {
            const isConnected = selected.includes(dot.id);
            const isHead = lastDot?.id === dot.id;

            return (
              <g key={dot.id} className="transition-transform duration-100">
                
                {/* Halo exterior al activarse */}
                {isConnected && (
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={isHead ? "18" : "15"}
                    fill="none"
                    stroke="#00E5FF"
                    strokeWidth="2"
                    strokeOpacity={isHead ? "0.9" : "0.5"}
                    filter="url(#dot-glow)"
                  />
                )}

                {/* Base del punto */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isConnected ? "8" : "7"}
                  fill={isConnected ? "#00E5FF" : "#1E293B"}
                  stroke={isConnected ? "#FFFFFF" : "#334155"}
                  strokeWidth={isConnected ? "2" : "1.5"}
                  className="transition-colors duration-150"
                />

                {/* Centro del punto cuando está activo */}
                {isConnected && (
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r="3.5"
                    fill="#080B11"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controles y Secuencia */}
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={handleReset}
          className="text-[#64748B] hover:text-[#00E5FF] transition-colors cursor-pointer font-medium"
        >
          Borrar Patrón
        </button>
        <span className="text-[#334155]">•</span>
        <span className="text-[#00E5FF] font-mono tracking-wider font-semibold">
          {selected.length > 0 ? selected.join(' → ') : 'Dibuja uniendo los puntos'}
        </span>
      </div>

    </div>
  );
};
