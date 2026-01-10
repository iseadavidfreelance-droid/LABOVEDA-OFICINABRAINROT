import React, { useEffect, useState } from 'react';
import { BusinessAsset } from '../../types/database';
// ✅ IMPORTACIÓN DEL SERVICIO OFICIAL
import { tacticalService } from '../../lib/supabase';
import { Search, Filter, Box, Plus, Hexagon, RefreshCw } from 'lucide-react';
import { AssetDetailView } from './AssetDetailView';
import RarityBadge from '../ui/RarityBadge'; 
import AssetCreationWizard from './AssetCreationWizard'; 
import TechButton from '../ui/TechButton';
import { cn } from '../../lib/utils';

export const AssetManager: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<BusinessAsset | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [assets, setAssets] = useState<BusinessAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAssets = async () => {
    setLoading(true);
    try {
      // ✅ USO DEL SERVICIO CORRECTO
      const data = await tacticalService.getTacticalSilos();
      setAssets(data || []);
    } catch (error) {
      console.error('Tactical Service Failure:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAssetCreated = () => fetchAssets();

  const filteredAssets = assets.filter(a => 
    (a.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (a.matrix_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || // Busca nombre real
    (a.matrix_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())      // Busca código técnico
  );

  if (selectedAsset) {
    return <AssetDetailView asset={selectedAsset} onBack={() => setSelectedAsset(null)} />;
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300 relative">
      {/* HEADER TÁCTICO */}
      <div className="flex justify-between items-end border-b border-gray-800 pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-3">
            <Box className="w-6 h-6 text-tech-green" /> Inventario de Activos
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">
            Gobernanza de Activos Digitales • {assets.length} Unidades Desplegadas
          </p>
        </div>
        <div className="flex gap-2">
            <button onClick={fetchAssets} className="p-2 border border-gray-800 text-gray-500 hover:text-white transition-colors">
                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            <TechButton variant="primary" label="NEW SILO PROTOCOL" icon={Plus} onClick={() => setShowWizard(true)} />
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="flex gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Identificar activo (SKU, Matriz)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 text-gray-200 pl-10 pr-4 py-2 font-mono text-sm focus:border-tech-green focus:outline-none"
          />
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="flex-1 overflow-hidden border border-gray-800 bg-void-gray/5 flex flex-col">
        {/* Encabezados */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-black border-b border-gray-800 text-[10px] font-mono text-gray-500 uppercase tracking-wider sticky top-0 z-10">
            <div className="col-span-3">Identificador (SKU)</div>
            <div className="col-span-3">Matriz de Mando</div>
            <div className="col-span-2">Clasificación</div>
            <div className="col-span-1 text-right">Score</div>
            <div className="col-span-3 text-right">Telemetría (Tráfico/$$)</div>
        </div>

        {/* Filas */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
            {loading && assets.length === 0 ? (
              <div className="p-8 text-center text-tech-green font-mono animate-pulse">SINCRONIZANDO RED NEURAL...</div>
            ) : filteredAssets.map((asset) => (
              <div 
                key={asset.sku} 
                onClick={() => setSelectedAsset(asset)}
                className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800/50 hover:bg-void-gray/30 cursor-pointer group transition-all items-center text-xs sm:text-sm"
              >
                {/* SKU */}
                <div className="col-span-3 font-mono text-gray-300 group-hover:text-tech-green font-bold flex items-center gap-2 truncate">
                   <Box className="w-3 h-3 opacity-50 shrink-0" /> <span className="truncate">{asset.sku}</span>
                </div>

                {/* MATRIZ: La Verdad Visual */}
                <div className="col-span-3 font-mono text-gray-400 flex items-center gap-2 truncate">
                    <Hexagon className="w-3 h-3 text-gray-600 group-hover:text-tech-green shrink-0" />
                    <div className="flex flex-col leading-none truncate">
                        {/* ✅ NOMBRE REAL (Visual) */}
                        <span className="text-tech-green/90 font-bold truncate">{asset.matrix_name || 'SIN NOMBRE'}</span>
                        {/* ✅ ID TÉCNICO (Referencia) */}
                        <span className="text-[9px] text-gray-600">{asset.matrix_id}</span>
                    </div>
                </div>

                {/* TIER */}
                <div className="col-span-2">
                  <RarityBadge tier={asset.tier || 'DUST'} className="scale-90 origin-left" />
                </div>

                {/* SCORE */}
                <div className="col-span-1 text-right font-mono text-tech-green">
                  {asset.score?.toFixed(0) || '0'}
                </div>

                {/* KPI COMPACTO */}
                <div className="col-span-3 text-right font-mono text-gray-500 flex justify-end gap-3">
                   <span title="Tráfico" className="text-gray-400">{(asset as any).traffic_score || 0}</span>
                   <span className="text-gray-700">|</span>
                   <span title="Ingresos" className="text-yellow-600">${(asset as any).revenue_score || 0}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <AssetCreationWizard isOpen={showWizard} onClose={() => setShowWizard(false)} onSuccess={handleAssetCreated} />
    </div>
  );
};