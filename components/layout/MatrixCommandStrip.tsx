
import React from 'react';
import { useMatrix } from '../../context/MatrixContext';
import { cn } from '../../lib/utils';
import { Hexagon } from 'lucide-react';

const MatrixCommandStrip: React.FC = () => {
  const { matrices, selectedMatrix, selectMatrix } = useMatrix();

  return (
    <div className="flex items-center h-full border-r border-void-border px-4 gap-2">
      <button
        onClick={() => selectMatrix(null)}
        className={cn(
          "flex items-center gap-2 px-3 py-1 text-[10px] font-mono font-bold tracking-widest uppercase border transition-all duration-200",
          selectedMatrix === null 
            ? "border-tech-green bg-tech-green/10 text-tech-green shadow-[0_0_10px_rgba(0,255,65,0.2)]" 
            : "border-void-border text-gray-600 hover:text-gray-300 hover:border-gray-600"
        )}
      >
        <Hexagon className="w-3 h-3" />
        ALL_NET
      </button>

      {matrices.map((matrix) => (
        <button
          key={matrix.id}
          onClick={() => selectMatrix(matrix.id)}
          className={cn(
            "px-3 py-1 text-[10px] font-mono font-bold tracking-widest uppercase border transition-all duration-200",
            selectedMatrix?.id === matrix.id
              ? "border-tech-green bg-tech-green/10 text-tech-green shadow-[0_0_10px_rgba(0,255,65,0.2)]" 
              : "border-void-border text-gray-600 hover:text-gray-300 hover:border-gray-600"
          )}
        >
          {matrix.code}
        </button>
      ))}
    </div>
  );
};

export default MatrixCommandStrip;
