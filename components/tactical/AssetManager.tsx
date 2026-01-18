import React, { useEffect, useState, useMemo } from 'react';
import { BusinessAsset } from '../../types/database';
// SERVICIO OFICIAL
import { tacticalService } from '../../lib/supabase';
import { Search, Box, Plus, Hexagon, RefreshCw, HardDrive, DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AssetDetailView } from './AssetDetailView';
import RarityBadge from '../ui/RarityBadge'; 
import AssetCreationWizard from './AssetCreationWizard'; 
import TechButton from '../ui/TechButton';
import { cn } from '../../lib/utils';
import { useLog } from '../../context/LogContext';

// --- QUICK INJECTOR CELL (Para editar links rápido) ---
const QuickInjectCell = ({ initialValue, type, onSave }: { initialValue?: string, type: 'drive' | 'payhip', onSave: (val: string) => Promise<void> }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue || '');
  const [saving, setSaving] = useState(false);
  const hasValue = !!initialValue;
  const Icon = type === 'drive' ? HardDrive : DollarSign;
  
  // Colores Tácticos
  const activeColor = type === 'drive' ? "text-blue-400 bg-blue-900/10 border-blue-900/30" : "text-tech-green bg-tech-green/10 border-tech-green/30";
  const emptyColor = "text-red-500 bg-red-900/10 border-red-900/30 animate-pulse cursor-pointer hover:bg-red-900/20";

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { 
        e.stopPropagation(); 
        setSaving(true); 
        await onSave(value); 
        setSaving(false); 
        setIsEditing(false); 
    }
    if (e.key === 'Escape') { 
        e.stopPropagation(); 
        setIsEditing(false); 
        setValue(initialValue || ''); 
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input 
          autoFocus 
          autoComplete="off" 
          type="text" 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          onKeyDown={handleKeyDown} 
          onBlur={() => setIsEditing(false)} 
          placeholder={type === 'drive' ? "Drive Link..." : "Payhip Link..."}
          // ESTILO FORZADO: NEGRO/BLANCO
          className="w-32 h-6 text-[10px] font-mono bg-black border border-tech-green text-white px-1 focus:outline-none"
        />
        {saving && <RefreshCw className="w-3 h-3 animate-spin text-tech-green" />}
      </div>
    );
  }

  return (
    <div 
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
        className={cn("p-1.5 rounded-sm flex items-center justify-center border transition-all cursor-pointer hover:scale-110", hasValue ? activeColor : emptyColor)} 
        title={hasValue ? "Editar Enlace" : "ALERTA: Falta Enlace"}
    >
       <Icon className="w-3.5 h-3.5" />
    </div>
  );
};

// TIPOS DE ORDENAMIENTO
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
    field: 'score', direction: 'desc' 
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

  const handleAssetCreated = async () => {
      await fetchAssets();
      addLog("NEW ASSET DEPLOYED. INVENTORY SYNCED.", 'success');
  };

  // PROTOCOLO: THE JUDGE (Manual Refresh)
  const handleSystemRefresh = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await fetchAssets();
      addLog("SYSTEM SYNCED. DATA INTEGRITY VERIFIED.", 'success');
    } catch (err: any) {
      addLog(`SYNC ERROR: ${err.message}`, 'error');
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleQuickUpdate = async (sku: string, field: 'drive' | 'payhip', value: string) => {
    try {
      // Optimistic Update
      setAssets(prev => prev.map(a => { 
          if (a.sku === sku) { 
              return { 
                  ...a, 
                  description: field === 'drive' ? value : a.description, 
                  monetization_link: field === 'payhip' ? value : a.monetization_link 
              }; 
          } 
          return a; 
      }));
      
      await tacticalService.patchAsset(sku, field, value);
      addLog(`INFRA INJECTED: ${sku} [${field.toUpperCase()}]`, "success");
    } catch (e) {
      addLog("UPDATE FAILED", "error");
      fetchAssets(); // Revert
    }
  };

  // Lógica de Ordenamiento
  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedAssets = useMemo(() => {
    const sorted = [...assets];
    sorted.sort((a, b) => {
      let valA: any = ''; let valB: any = '';
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
    (a.matrix_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="w-3 h-3 opacity-20 ml-1" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-tech-green ml-1" /> : <ArrowDown className="w-3 h-3 text-tech-green ml-1" />;
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
             {assets.length} Unidades Desplegadas • Modo Edición Rápida Activo
          </p>
        </div>
        <div className="flex gap-2 items-center">
            {/* Botón Refresh (THE JUDGE) */}
            <button 
              onClick={handleSystemRefresh} 
              disabled={isSyncing || loading}
              className={cn("p-2 border transition-all duration-300 rounded-sm", isSyncing ? "bg-tech-green/10 border-tech-green text-tech-green" : "bg-black border-gray-800 text-gray-500 hover:text-white")}
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
        {/* Encabezados */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-black border-b border-gray-800 text-[10px] font-mono text-gray-500 uppercase tracking-wider sticky top-0 z-10">
            <div className="col-span-3 cursor-pointer hover:text-white flex items-center" onClick={() => handleSort('sku')}>Identificador <SortIcon field="sku"/></div>
            <div className="col-span-3 cursor-pointer hover:text-white flex items-center" onClick={() => handleSort('matrix')}>Matriz <SortIcon field="matrix"/></div>
            <div className="col-span-2 cursor-pointer hover:text-white flex items-center" onClick={() => handleSort('tier')}>Clase <SortIcon field="tier"/></div>
            <div className="col-span-1 text-right cursor-pointer hover:text-white flex items-center justify-end" onClick={() => handleSort('score')}>Score <SortIcon field="score"/></div>
            <div className="col-span-3 text-right">Inyección Rápida</div>
        </div>

        {/* Filas */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
            {loading && assets.length === 0 ? (
              <div className="p-8 text-center text-tech-green font-mono animate-pulse">SINCRONIZANDO RED NEURAL...</div>
            ) : filteredAssets.map((asset) => {
              // Mapeo defensivo
              const driveVal = asset.description || asset.drive_link; 
              const payhipVal = asset.monetization_link;

              return (
              <div 
                key={asset.sku} 
                onClick={() => setSelectedAsset(asset)}
                className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800/50 hover:bg-void-gray/30 cursor-pointer group transition-all items-center text-xs sm:text-sm"
              >
                {/* SKU */}
                <div className="col-span-3 font-mono text-gray-300 group-hover:text-tech-green font-bold flex items-center gap-2 truncate">
                   <Box className="w-3 h-3 opacity-50 shrink-0" /> <span className="truncate">{asset.sku}</span>
                </div>

                {/* MATRIZ */}
                <div className="col-span-3 font-mono text-gray-400 flex items-center gap-2 truncate">
                    <Hexagon className="w-3 h-3 text-gray-600 group-hover:text-tech-green shrink-0" />
                    <div className="flex flex-col leading-none truncate">
                        <span className="text-tech-green/90 font-bold truncate">{asset.matrix_name || 'SIN NOMBRE'}</span>
                        <span className="text-[9px] text-gray-600">{asset.matrix_id}</span>
                    </div>
                </div>

                {/* TIER */}
                <div className="col-span-2">
                  <RarityBadge tier={asset.tier || 'DUST'} className="scale-90 origin-left" />
                </div>

                {/* SCORE */}
                <div className={`col-span-1 text-right font-mono text-sm ${getScoreColor(asset.score || 0)}`}>
                  {(asset.score || 0).toFixed(0)}
                </div>

                {/* COLUMNA DE ACCIÓN: QUICK INJECT */}
                <div className="col-span-3 flex items-center justify-end gap-3 pl-4 border-l border-gray-800/30">
                   
                   {/* Drive Injector */}
                   <QuickInjectCell 
                      type="drive" 
                      initialValue={driveVal} 
                      onSave={(val) => handleQuickUpdate(asset.sku, 'drive', val)} 
                   />

                   {/* Payhip Injector */}
                   <QuickInjectCell 
                      type="payhip" 
                      initialValue={payhipVal} 
                      onSave={(val) => handleQuickUpdate(asset.sku, 'payhip', val)} 
                   />
                </div>
              </div>
            )})}
        </div>
      </div>

      <AssetCreationWizard isOpen={showWizard} onClose={() => setShowWizard(false)} onSuccess={handleAssetCreated} />
    </div>
  );
};