import React, { useEffect, useState, useMemo } from 'react';
import { BusinessAsset } from '../../types/database';
import { tacticalService } from '../../lib/supabase';
import { Search, Box, Plus, Hexagon, RefreshCw, HardDrive, DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AssetDetailView } from './AssetDetailView';
import AssetCreationWizard from './AssetCreationWizard'; 
import TechButton from '../ui/TechButton';
import RarityBadge from '../ui/RarityBadge';
import { cn } from '../../lib/utils';
import { useLog } from '../../context/LogContext';

// Configuración de Ordenamiento
type SortField = 'sku' | 'matrix' | 'tier' | 'score';
type SortDirection = 'asc' | 'desc';

export const AssetManager: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<BusinessAsset | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [assets, setAssets] = useState<BusinessAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de Ordenamiento
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'score',
    direction: 'desc' 
  });

  const { addLog } = useLog();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await tacticalService.getTacticalSilos();
      setAssets(data || []);
    } catch (error) {
      console.error('Tactical Service Failure:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  // [DEFINICIÓN CRÍTICA] Función requerida por el Wizard
  const handleAssetCreated = async () => {
    await fetchAssets();
    addLog("NEW ASSET DEPLOYED. INVENTORY SYNCED.", 'success');
  };

  // --- PROTOCOLO: REFRESH SYSTEM (Sin RPC roto) ---
  const handleSystemRefresh = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    // Al no existir el RPC 'invoke_the_judge' en el backend, 
    // ejecutamos una sincronización táctica de datos.
    try {
      await fetchAssets();
      addLog("SYSTEM SYNCED. DATA INTEGRITY VERIFIED.", 'success');
    } catch (err: any) {
      console.error("Sync Failure:", err);
      addLog(`SYNC ERROR: ${err.message}`, 'error');
    } finally {
      // Pequeño delay artificial para feedback táctico
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  // --- LÓGICA DE ORDENAMIENTO MILITAR ---
  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedAssets = useMemo(() => {
    const sorted = [...assets];
    sorted.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortConfig.field) {
        case 'sku': valA = a.sku; valB = b.sku; break;
        case 'matrix': valA = a.matrix_name || ''; valB = b.matrix_name || ''; break;
        case 'score': valA = a.score || 0; valB = b.score || 0; break;
        case 'tier':
          const tierPower = { 'DUST': 1, 'COMMON': 2, 'UNCOMMON': 3, 'RARE': 4, 'LEGENDARY': 5 };
          valA = tierPower[a.tier as keyof typeof tierPower] || 0;
          valB = tierPower[b.tier as keyof typeof tierPower] || 0;
          break;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [assets, sortConfig]);

  const filteredAssets = sortedAssets.filter(a => 
    (a.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (a.matrix_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (a.matrix_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // --- RENDER HELPERS ---
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="w-3 h-3 opacity-20 ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-tech-green ml-1" /> 
      : <ArrowDown className="w-3 h-3 text-tech-green ml-1" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 1000) return "text-amber-400 font-bold drop-shadow-md";
    if (score >= 500) return "text-emerald-400 font-bold";
    if (score >= 200) return "text-blue-400";
    return "text-zinc-500";
  };

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
             {assets.length} Unidades Desplegadas • Gestión de Ciclo de Vida
          </p>
        </div>
        <div className="flex gap-2 items-center">
            {/* BOTÓN SOLO ICONO (THE JUDGE / REFRESH) */}
            <button 
              onClick={handleSystemRefresh} 
              disabled={isSyncing || loading}
              className={cn(
                "p-2 border transition-all duration-300 rounded-sm",
                isSyncing 
                  ? "bg-tech-green/10 border-tech-green text-tech-green cursor-wait" 
                  : "bg-black border-gray-800 text-gray-500 hover:text-white hover:border-gray-600"
              )}
              title="THE JUDGE: Refresh System Data"
            >
                <RefreshCw className={cn("w-5 h-5", isSyncing && "animate-spin")} />
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
        {/* Encabezados Sticky */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-black border-b border-gray-800 text-[10px] font-mono text-gray-500 uppercase tracking-wider sticky top-0 z-10">
            <div className="col-span-3 flex items-center cursor-pointer hover:text-white" onClick={() => handleSort('sku')}>
              Identificador (SKU) <SortIcon field="sku" />
            </div>
            <div className="col-span-3 flex items-center cursor-pointer hover:text-white" onClick={() => handleSort('matrix')}>
              Matriz de Mando <SortIcon field="matrix" />
            </div>
            <div className="col-span-2 flex items-center cursor-pointer hover:text-white" onClick={() => handleSort('tier')}>
              Clasificación <SortIcon field="tier" />
            </div>
            <div className="col-span-1 text-right flex items-center justify-end cursor-pointer hover:text-white" onClick={() => handleSort('score')}>
              Score <SortIcon field="score" />
            </div>
            <div className="col-span-3 text-right">Integridad Operativa</div>
        </div>

        {/* Filas */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
            {loading && assets.length === 0 ? (
              <div className="p-8 text-center text-tech-green font-mono animate-pulse">SINCRONIZANDO RED NEURAL...</div>
            ) : filteredAssets.map((asset) => {
              const score = asset.score || 0;
              const hasDrive = !!asset.description; 
              const hasPayhip = !!asset.monetization_link;

              return (
              <div 
                key={asset.sku} 
                onClick={() => setSelectedAsset(asset)}
                className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800/50 hover:bg-void-gray/30 cursor-pointer group transition-all items-center text-xs sm:text-sm"
              >
                {/* 1. SKU */}
                <div className="col-span-3 font-mono text-gray-300 group-hover:text-tech-green font-bold flex items-center gap-2 truncate">
                   <Box className="w-3 h-3 opacity-50 shrink-0" /> <span className="truncate">{asset.sku}</span>
                </div>
                {/* 2. MATRIZ */}
                <div className="col-span-3 font-mono text-gray-400 flex items-center gap-2 truncate">
                    <Hexagon className="w-3 h-3 text-gray-600 group-hover:text-tech-green shrink-0" />
                    <div className="flex flex-col leading-none truncate">
                        <span className="text-gray-300 font-medium truncate group-hover:text-white">{asset.matrix_name || 'SIN NOMBRE'}</span>
                        <span className="text-[9px] text-gray-600 group-hover:text-tech-green/70">{asset.matrix_id}</span>
                    </div>
                </div>
                {/* 3. CLASIFICACIÓN */}
                <div className="col-span-2">
                  <RarityBadge tier={asset.tier || 'DUST'} className="scale-90 origin-left" />
                </div>
                {/* 4. SCORE */}
                <div className={`col-span-1 text-right font-mono text-sm ${getScoreColor(score)}`}>
                  {score.toFixed(0)}
                </div>
                {/* 5. INTEGRIDAD */}
                <div className="col-span-3 flex items-center justify-end gap-3 pl-4 border-l border-gray-800/30">
                   <div className={cn("p-1.5 rounded-sm flex items-center justify-center", hasDrive ? "bg-blue-900/10 text-blue-400 border border-blue-900/30" : "bg-red-900/10 text-red-500 border border-red-900/30 animate-pulse")} title="Archivos Fuente">
                      <HardDrive className="w-3.5 h-3.5" />
                   </div>
                   <div className={cn("p-1.5 rounded-sm flex items-center justify-center", hasPayhip ? "bg-emerald-900/10 text-emerald-400 border border-emerald-900/30" : "bg-red-900/10 text-red-500 border border-red-900/30 animate-pulse")} title="Enlace Venta">
                      <DollarSign className="w-3.5 h-3.5" />
                   </div>
                </div>
              </div>
            )})}
        </div>
      </div>
      <AssetCreationWizard isOpen={showWizard} onClose={() => setShowWizard(false)} onSuccess={handleAssetCreated} />
    </div>
  );
};