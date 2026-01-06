import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { MatrixRegistry, BusinessAsset } from '../../types/database';
import { tacticalService } from '../../lib/supabase'; // Usamos el servicio REAL
import TechButton from '../ui/TechButton';
import RarityBadge from '../ui/RarityBadge';
import { cn } from '../../lib/utils';

interface MatrixDetailViewProps {
  matrix: MatrixRegistry;
  onBack: () => void;
  onSelectAsset: (asset: BusinessAsset) => void;
}

const MatrixDetailView: React.FC<MatrixDetailViewProps> = ({ matrix, onBack, onSelectAsset }) => {
  const [assets, setAssets] = useState<BusinessAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH REAL AL MONTAR EL COMPONENTE
  useEffect(() => {
    const loadRealData = async () => {
      setLoading(true);
      try {
        const realAssets = await tacticalService.getAssetsByMatrix(matrix.id);
        setAssets(realAssets);
      } catch (error) {
        console.error("System Error: Could not hydrate matrix assets", error);
        // Aquí podrías disparar un toast de error
      } finally {
        setLoading(false);
      }
    };
    loadRealData();
  }, [matrix.id]);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-10 duration-200">
      {/* HEADER TÁCTICO */}
      <div className="flex items-end justify-between border-b border-void-border pb-6 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-void-gray text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-widest uppercase mb-1">
              {matrix.name}
            </h2>
            <div className="font-mono text-gray-500 text-xs flex gap-4 uppercase tracking-wider">
              <span>ID: <span className="text-gray-300">{matrix.code}</span></span>
              <span>EFICIENCIA: <span className="text-tech-green">{matrix.efficiency_score}%</span></span>
              <span>ACTIVOS TOTALES: <span className="text-white">{matrix.total_assets_count}</span></span>
            </div>
          </div>
        </div>
        <TechButton variant="primary" icon={Plus} label="CREAR ASSET EN MATRIZ" />
      </div>

      {/* DATA GRID REAL */}
      <div className="border border-void-border bg-void-gray/10 flex-1 overflow-hidden flex flex-col relative">
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-void-border text-[10px] font-mono text-gray-500 uppercase tracking-wider bg-black/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="col-span-2">SKU (PK)</div>
          <div className="col-span-4">Producto</div>
          <div className="col-span-2">Rango</div>
          <div className="col-span-2 text-right">Valor (Score)</div>
          <div className="col-span-2 text-right">Estado</div>
        </div>
        
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
             <div className="h-full flex items-center justify-center">
                <div className="text-tech-green font-mono animate-pulse text-sm">SYNCING WITH SUPABASE...</div>
             </div>
          ) : assets.length === 0 ? (
             <div className="p-8 text-center text-gray-600 font-mono text-sm border-t border-dashed border-gray-800 mt-10">
                0 ASSETS DETECTED IN SECTOR {matrix.code}
             </div>
          ) : (
            assets.map((asset) => (
              <div 
                key={asset.sku} 
                onClick={() => onSelectAsset(asset)}
                className="grid grid-cols-12 gap-4 p-4 border-b border-void-border/50 hover:bg-void-gray/30 transition-all cursor-pointer group items-center"
              >
                <div className="col-span-2 font-mono font-bold text-white group-hover:text-tech-green text-xs">{asset.sku}</div>
                <div className="col-span-4 font-sans text-sm text-gray-300 truncate pr-2">{asset.name}</div>
                <div className="col-span-2"><RarityBadge tier={asset.tier} className="scale-75 origin-left"/></div>
                <div className="col-span-2 text-right font-mono text-tech-green text-sm">{asset.score}</div>
                <div className="col-span-2 text-right">
                  <span className={cn("text-[10px] font-mono px-2 py-0.5 border", 
                    asset.status === 'ACTIVE' ? "border-tech-green/30 text-tech-green" : "border-gray-700 text-gray-500"
                  )}>
                    {asset.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MatrixDetailView;