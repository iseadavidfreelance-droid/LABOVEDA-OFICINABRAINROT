import React, { useEffect, useState } from 'react';
// 1. CAMBIO: Importamos la interfaz oficial y el servicio, NO la base de datos cruda
import { BusinessAsset } from '../../types/database';
import { tacticalService } from '../../lib/supabase';
import { Search, Filter, Box, Plus, Hexagon, RefreshCw } from 'lucide-react';
import { AssetDetailView } from './AssetDetailView';
import RarityBadge from '../ui/RarityBadge'; 
import AssetCreationWizard from './AssetCreationWizard'; 
import TechButton from '../ui/TechButton';
import { cn } from '../../lib/utils';

export const AssetManager: React.FC = () => {
  // Estado de Vista y Modal
  const [selectedAsset, setSelectedAsset] = useState<BusinessAsset | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Datos
  const [assets, setAssets] = useState<BusinessAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAssets = async () => {
    setLoading(true);
    try {
      // 2. CAMBIO CRÍTICO: Usamos el servicio que tiene el "Trojan Fix" (Hidratación)
      // En lugar de pedir datos crudos, pedimos datos "enriquecidos" con los nombres reales.
      const data = await tacticalService.getTacticalSilos();
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets via Tactical Service:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Función para actualizar la lista localmente al crear un activo
  const handleAssetCreated = (newAsset: any) => {
      // Nota: Al crear, es posible que primero veas el ID hasta que recargues.
      // Para 0 incertidumbre, forzamos una recarga de datos.
      fetchAssets(); 
  };

  const filteredAssets = assets.filter(a => 
    (a.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (a.tier?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    // Ahora matrix_id contiene el NOMBRE REAL ("PROYECTO ALFA"), así que el buscador encontrará nombres.
    (a.matrix_id && a.matrix_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- RENDER LOGIC ---

  // 1. VISTA DE DETALLE (Drill-down)
  if (selectedAsset) {
    return (
        <AssetDetailView 
            asset={selectedAsset} 
            onBack={() => setSelectedAsset(null)} 
        />
    );
  }

  // 2. DASHBOARD GENERAL (Tabla)
  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300 relative">
      
      {/* Header */}
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
            <button 
                onClick={fetchAssets} 
                className="p-2 border border-gray-800 text-gray-500 hover:text-white hover:border-gray-600 transition-colors"
                title="Forzar Sincronización"
            >
                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            {/* BOTÓN FUNCIONAL - Activa el Modal */}
            <TechButton 
                variant="primary" 
                label="NEW SILO PROTOCOL" 
                icon={Plus} 
                onClick={() => setShowWizard(true)} 
            />
        </div>
      </div>

      {/* Controles de Filtro */}
      <div className="flex gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por SKU, Rango o Matriz..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 text-gray-200 pl-10 pr-4 py-2 font-mono text-sm focus:border-tech-green focus:outline-none transition-colors"
          />
        </div>
        <button className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-tech-green hover:border-tech-green transition-colors">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Tabla Principal */}
      <div className="flex-1 overflow-hidden border border-gray-800 bg-void-gray/5 flex flex-col">
        {/* Header Tabla - 12 Columnas */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-black border-b border-gray-800 text-[10px] font-mono text-gray-500 uppercase tracking-wider sticky top-0 z-0">
            <div className="col-span-3">SKU / Identificador</div>
            <div className="col-span-2">Matriz</div>
            <div className="col-span-2">Rango</div>
            <div className="col-span-1 text-right">Score</div>
            <div className="col-span-2 text-right">Tráfico</div>
            <div className="col-span-1 text-right">Ingresos</div>
            <div className="col-span-1 text-center">Info</div>
        </div>

        {/* Body Tabla */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
            {loading && assets.length === 0 ? (
              <div className="p-8 text-center text-tech-green font-mono animate-pulse">CARGANDO DATOS TÁCTICOS...</div>
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

                {/* MATRIZ (AHORA SÍ VERÁS EL NOMBRE) */}
                <div className="col-span-2 font-mono text-gray-400 flex items-center gap-2 truncate">
                    <Hexagon className="w-3 h-3 text-gray-600 group-hover:text-tech-green shrink-0" />
                    {/* El Trojan Fix en 'tacticalService' ya puso el nombre aquí */}
                    <span className="truncate text-tech-green/80 font-bold">
                        {asset.matrix_id || 'N/A'}
                    </span>
                </div>

                {/* RANGO */}
                <div className="col-span-2">
                  <RarityBadge tier={asset.tier || 'DUST'} className="scale-90 origin-left" />
                </div>

                {/* SCORE */}
                <div className="col-span-1 text-right font-mono text-tech-green">
                  {asset.score?.toFixed(0) || '0'}
                </div>

                {/* TRÁFICO (Asumimos traffic_score mapeado o 0) */}
                <div className="col-span-2 text-right font-mono text-gray-400">
                  {/* Nota: BusinessAsset interface usa 'score', traffic puede no estar en la interfaz base, ajusta si es necesario */}
                  {(asset as any).traffic_score?.toFixed(0) || '0'}
                </div>

                {/* INGRESOS */}
                <div className="col-span-1 text-right font-mono text-yellow-500/80 truncate">
                  ${(asset as any).revenue_score?.toFixed(0) || '0'}
                </div>

                {/* INFO */}
                <div className="col-span-1 text-center flex justify-center gap-1">
                  {!asset.monetization_link && (
                     <span className="text-[9px] text-red-500 border border-red-900 px-1 rounded cursor-help" title="Sin Monetización">$</span>
                  )}
                  {!asset.description && (
                     <span className="text-[9px] text-yellow-500 border border-yellow-900 px-1 rounded cursor-help" title="Sin Archivos">D</span>
                  )}
                  {asset.monetization_link && asset.description && (
                    <span className="text-[9px] text-gray-600">OK</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      <AssetCreationWizard 
         isOpen={showWizard} 
         onClose={() => setShowWizard(false)} 
         onSuccess={handleAssetCreated}
      />
    </div>
  );
};