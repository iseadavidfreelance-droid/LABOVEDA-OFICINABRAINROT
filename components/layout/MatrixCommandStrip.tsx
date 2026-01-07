import React from 'react';
import { useMatrix } from '../../context/MatrixContext';
import { Layers, AlertCircle, Loader2 } from 'lucide-react';

export const MatrixCommandStrip = () => {
  // Usamos el Contexto que ya tienes creado en tu proyecto
  const { matrices, selectedMatrixId, setSelectedMatrixId, isLoading, error } = useMatrix();

  // Estado de Carga (Loading Skeleton)
  if (isLoading) {
    return (
      <div className="h-12 w-full bg-black/40 border-b border-white/10 flex items-center px-4 gap-2 overflow-hidden">
        <Loader2 className="w-4 h-4 text-zinc-600 animate-spin mr-2" />
        <div className="h-8 w-32 bg-white/5 animate-pulse rounded-sm skew-x-[-12deg]" />
        <div className="h-8 w-32 bg-white/5 animate-pulse rounded-sm skew-x-[-12deg]" />
      </div>
    );
  }

  // Estado de Error
  if (error) {
    return (
      <div className="h-12 w-full bg-rose-950/20 border-b border-rose-500/20 flex items-center px-4 gap-2 text-rose-500 text-xs font-mono">
        <AlertCircle className="w-4 h-4" />
        CONNECTION SEVERED: UNABLE TO LOAD MATRIX REGISTRY.
      </div>
    );
  }

  return (
    <div className="h-12 w-full bg-[#050505] border-b border-white/10 flex items-center px-2 overflow-x-auto no-scrollbar shadow-inner">
      <div className="flex items-center gap-1">
        {/* Renderizamos las matrices reales de la BD */}
        {matrices.map((matrix) => {
          const isActive = selectedMatrixId === matrix.matrix_code;
          
          return (
            <button
              key={matrix.matrix_code}
              onClick={() => setSelectedMatrixId(matrix.matrix_code)}
              className={`
                group relative h-9 min-w-[140px] px-4 flex items-center justify-between
                transform skew-x-[-12deg] transition-all duration-200 border cursor-pointer
                ${isActive 
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400 z-10' 
                  : 'bg-zinc-900/50 border-white/5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 hover:border-white/10 z-0'
                }
              `}
            >
              {/* Contenido (Deshacemos el skew para que el texto se lea bien) */}
              <div className="flex items-center gap-3 w-full skew-x-[12deg]">
                <div className="flex flex-col items-start">
                  <span className={`text-[10px] font-mono font-bold leading-none ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`}>
                    MATRIX
                  </span>
                  <span className="text-sm font-black tracking-widest leading-none">
                    {matrix.matrix_code}
                  </span>
                </div>
                
                {/* Contador de Assets */}
                <div className={`
                  ml-auto px-1.5 py-0.5 text-[9px] font-mono rounded-sm border
                  ${isActive 
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' 
                    : 'bg-black/20 border-transparent text-zinc-700'
                  }
                `}>
                  {matrix.asset_count || 0}
                </div>
              </div>

              {/* Línea brillante inferior si está activo */}
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Decoración estética a la derecha */}
      <div className="ml-auto px-4 flex items-center gap-2 opacity-30 hidden md:flex">
        <Layers className="w-4 h-4 text-white" />
        <span className="text-[10px] font-mono text-white">SYSTEM GRID</span>
      </div>
    </div>
  );
};