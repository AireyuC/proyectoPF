import React, { useState } from 'react';

interface PatternLockProps {
    onChange?: (pattern: number[]) => void;
}

export const PatternLock: React.FC<PatternLockProps> = ({ onChange }) => {
    const [path, setPath] = useState<number[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    const handleStart = (index: number) => {
        setPath([index]);
        setIsDrawing(true);
    };

    const handleMove = (index: number) => {
        if (isDrawing && !path.includes(index)) {
            setPath((prev) => [...prev, index]);
        }
    };

    const handleEnd = () => {
        setIsDrawing(false);
        if (onChange) {
            onChange(path);
        }
    };

    // Reset pattern (optional, for demo)
    const handleReset = () => {
        setPath([]);
        if (onChange) onChange([]);
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className="grid grid-cols-3 gap-4 p-4 bg-slate-100 rounded-xl relative select-none touch-none"
                onMouseLeave={handleEnd}
                onMouseUp={handleEnd}
            >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dot) => (
                    <div
                        key={dot}
                        className={`w-4 h-4 rounded-full transition-colors duration-200 cursor-pointer ${path.includes(dot) ? 'bg-blue-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'
                            }`}
                        onMouseDown={() => handleStart(dot)}
                        onMouseEnter={() => handleMove(dot)}
                    />
                ))}

                {/* SVG Line Overlay would go here for a real implementation */}
            </div>

            <div className="flex gap-2 text-xs">
                <button
                    type="button"
                    onClick={handleReset}
                    className="text-slate-500 hover:text-slate-700 underline"
                >
                    Borrar
                </button>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600 font-mono">
                    {path.join('-')}
                </span>
            </div>
        </div>
    );
};
