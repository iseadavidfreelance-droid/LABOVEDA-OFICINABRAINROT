import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MatrixRegistry, BusinessAsset } from '../../types/database';
import { mockService } from '../../lib/supabase';
import { useLog } from '../../context/LogContext';
import TechButton from '../ui/TechButton';
import TechInput from '../ui/TechInput';
import { Hexagon, Plus, ArrowLeft, X, Activity, ArrowUpDown, ArrowUp, ArrowDown, Box, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import MatrixDetailView from './MatrixDetailView';
import { AssetDetailView } from './AssetDetailView';

// --- TYPES & HELPERS ---
type SortField = 'code' | 'name' | 'type' | 'efficiency' | 'assets';
type SortDirection = 'asc' | 'desc';

export default function MatrixManager() {
  // Navigation State
  const [viewState, setViewState] = useState<'ROOT' | 'MATRIX_DETAIL' | 'ASSET_DETAIL'>('ROOT');
  const [selectedMatrix, setSelectedMatrix] = useState<MatrixRegistry | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<BusinessAsset | null>(null);

  // Data State
  const [matrices, setMatrices] = useState<MatrixRegistry[]>([]);
  const [loading, setLoading] = useState(true);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('efficiency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Modal State & Form Data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ 
    code: '', 
    name: '', 
    type: 'PRIMARY' as 'PRIMARY' | 'SECONDARY' 
  });

  const { addLog } = useLog();

  useEffect(() => {
    fetchMatrices();
  }, []);

  const fetchMatrices = async () => {
    setLoading(true);
    try {
        const data = await mockService.getMatrices(); 
        setMatrices(data);
    } catch (e) {
        console.error("Error loading matrices", e);
    } finally {
        setLoading(false);
    }
  };

  // --- LOGIC: SORTING & EFFICIENCY ---

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to desc for metrics
    }
  };

  const getPPA = (matrix: MatrixRegistry) => {
    if (!matrix.total_assets_count || matrix.total_assets_count === 0) return 0;
    return Math.round(matrix.efficiency_score / matrix.total_assets_count);
  };

  const sortedMatrices = useMemo(() => {
    return [...matrices].sort((a, b) => {
      let valA: any = a[fieldToKey(sortField)];
      let valB: any = b[fieldToKey(sortField)];

      if (sortField === 'efficiency') {
        valA = getPPA(a);
        valB = getPPA(b);
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [matrices, sortField, sortDirection]);

  function fieldToKey(field: SortField): keyof MatrixRegistry {
    switch (field) {
      case 'code': return 'code';
      case 'name': return 'name';
      case 'type': return 'type';
      case 'assets': return 'total_assets_count';
      default: return 'efficiency_score';
    }
  }

  // --- NAVIGATION HANDLERS ---
  
  const handleMatrixClick = (matrix: MatrixRegistry) => {
    setSelectedMatrix(matrix);
    setViewState('MATRIX_DETAIL');
  };

  const handleAssetClick = (asset: BusinessAsset) => {
    setSelectedAsset(asset);
    setViewState('ASSET_DETAIL');
  };

  const goBackToRoot = () => {
    setViewState('ROOT');
    setSelectedMatrix(null);
  };

  const goBackToMatrix = () => {
    setViewState('MATRIX_DETAIL');
    setSelectedAsset(null);
  };

  // --- MODAL HANDLERS ---
  const handleOpenModal = () => {
    setFormData({ code: '', name: '', type: 'PRIMARY' }); 
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
     if (!formData.code || !formData.name) {
         alert("Por favor completa el Código y el Nombre.");
         return;
     }
     setSaving(true);
     try {
         await mockService.createMatrix({
             code: formData.code.toUpperCase(),
             name: formData.name,
             type: formData.type
         });
         addLog(`MATRIX INITIALIZED: ${formData.code.toUpperCase()}`, 'success');
         await fetchMatrices();
         setIsModalOpen(false);
     } catch (error) {
         console.error("Error creating matrix", error);
         addLog(`MATRIX INIT FAILED: ${formData.code.toUpperCase()}`, 'error');
     } finally {
         setSaving(false);
     }
  };

  // --- RENDER HELPERS ---
  
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-20 ml-1" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-tech-green ml-1" /> 
      : <ArrowDown className="w-3 h-3 text-tech-green ml-1" />;
  };

  const getEfficiencyColor = (ppa: number) => {
    if (ppa >= 1000) return "text-amber-400";
    if (ppa >= 500) return "text-emerald-400";
    if (ppa >= 200) return "text-blue-400";
    return "text-gray-500";
  };

  // --- RENDER ROUTER ---

  if (viewState === 'ASSET_DETAIL' && selectedAsset) {
    return <AssetDetailView asset={selectedAsset} onBack={goBackToMatrix} />;
  }

  if (viewState === 'MATRIX_DETAIL' && selectedMatrix) {
    return (
        <MatrixDetailView 
            matrix={selectedMatrix} 
            onBack={goBackToRoot} 
            onSelectAsset={handleAssetClick} 
        />
    );
  }

  // VISTA ROOT: LISTA DE MATRICES
  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300 relative">
      
      {/* 1. HEADER (Estilo Homogeneizado con AssetManager) */}
      <div className="flex justify-between items-end border-b border-gray-800 pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-3">
            <Hexagon className="w-6 h-6 text-tech-green" /> Gestor de Matrices
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">
            Ontología del Sistema • {matrices.length} Estructuras Activas
          </p>
        </div>
        <div className="flex gap-2">
            <button onClick={fetchMatrices} className="p-2 border border-gray-800 text-gray-500 hover:text-white transition-colors">
                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            <TechButton variant="primary" icon={Plus} label="NUEVA MATRIZ" onClick={handleOpenModal} />
        </div>
      </div>

      {/* 2. TABLA DE DATOS (Estilo Homogeneizado) */}
      <div className="flex-1 overflow-hidden border border-gray-800 bg-void-gray/5 flex flex-col">
        {/* Encabezados Sticky */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-black border-b border-gray-800 text-[10px] font-mono text-gray-500 uppercase tracking-wider sticky top-0 z-10">
          <div 
            className="col-span-2 flex items-center cursor-pointer hover:text-white transition-colors"
            onClick={() => handleSort('code')}
          >
            Código <SortIcon field="code" />
          </div>
          <div 
            className="col-span-4 flex items-center cursor-pointer hover:text-white transition-colors"
            onClick={() => handleSort('name')}
          >
            Nombre Visual <SortIcon field="name" />
          </div>
          <div 
            className="col-span-2 flex items-center cursor-pointer hover:text-white transition-colors"
            onClick={() => handleSort('type')}
          >
            Tipo <SortIcon field="type" />
          </div>
          <div 
            className="col-span-2 text-right flex items-center justify-end cursor-pointer hover:text-white transition-colors"
            onClick={() => handleSort('efficiency')}
          >
            Eficiencia (PPA) <SortIcon field="efficiency" />
          </div>
          <div 
            className="col-span-2 text-right flex items-center justify-end cursor-pointer hover:text-white transition-colors"
            onClick={() => handleSort('assets')}
          >
            Carga (Assets) <SortIcon field="assets" />
          </div>
        </div>

        {/* Filas */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
             <div className="p-8 text-center text-tech-green font-mono animate-pulse flex flex-col items-center gap-4">
                <Activity className="w-6 h-6 animate-spin" />
                LOADING ONTOLOGY...
             </div>
          ) : (
             sortedMatrices.map((matrix) => {
                const ppa = getPPA(matrix);
                const efficiencyColor = getEfficiencyColor(ppa);

                return (
                  <div 
                      key={matrix.id} 
                      onClick={() => handleMatrixClick(matrix)}
                      className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800/50 hover:bg-void-gray/30 cursor-pointer group transition-all items-center text-xs sm:text-sm"
                  >
                     {/* CODIGO */}
                     <div className="col-span-2 font-mono font-bold text-gray-300 group-hover:text-tech-green truncate flex items-center gap-2">
                        <Hexagon className="w-3 h-3 opacity-50 shrink-0" />
                        {matrix.code}
                     </div>

                     {/* NOMBRE */}
                     <div className="col-span-4 font-sans font-medium text-gray-400 group-hover:text-white truncate">
                        {matrix.name}
                     </div>

                     {/* TIPO */}
                     <div className="col-span-2">
                        <span className={cn(
                            "px-2 py-0.5 text-[10px] border rounded-sm font-mono", 
                            matrix.type === 'PRIMARY' 
                                ? "border-tech-green/30 text-tech-green bg-tech-green/5" 
                                : "border-gray-700 text-gray-500"
                        )}>
                          {matrix.type}
                        </span>
                     </div>

                     {/* EFICIENCIA (PPA) */}
                     <div className={`col-span-2 text-right font-mono font-bold ${efficiencyColor}`}>
                        {ppa} <span className="text-[9px] opacity-50 font-normal text-gray-500">PPA</span>
                     </div>

                     {/* ACTIVOS */}
                     <div className="col-span-2 text-right font-mono text-gray-500 group-hover:text-white flex items-center justify-end gap-2">
                         {matrix.total_assets_count}
                         <ArrowLeft className="w-3 h-3 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity text-tech-green" />
                     </div>
                  </div>
                );
             })
          )}
        </div>
      </div>
      
      {/* MODAL DE CREACIÓN (Mantenido funcional y oscuro) */}
      <AnimatePresence>
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <div className="bg-gray-950 bg-void-black border border-gray-700 border-void-border p-6 max-w-md w-full relative animate-in zoom-in-95 duration-200 shadow-2xl shadow-tech-green/10">
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <X className="w-4 h-4"/>
                  </button>
                  <h3 className="text-white mb-6 text-xl font-bold tracking-wider flex items-center gap-2">
                      <Hexagon className="w-5 h-5 text-tech-green" /> NUEVA MATRIZ
                  </h3>
                  <div className="space-y-4">
                      <TechInput 
                        label="CÓDIGO (ID)" 
                        value={formData.code} 
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        placeholder="EJ: ALFA"
                      />
                      <TechInput 
                        label="NOMBRE VISUAL" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="EJ: PROYECTO ALFA"
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">TIPO DE ESTRUCTURA</label>
                        <div className="flex gap-2">
                            {['PRIMARY', 'SECONDARY'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFormData({...formData, type: type as any})}
                                    className={cn(
                                        "flex-1 py-2 text-xs font-mono border transition-all",
                                        formData.type === type ? "border-tech-green bg-tech-green/10 text-tech-green" : "border-gray-800 text-gray-500 hover:border-gray-600"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800 border-void-border">
                          <TechButton variant="ghost" label="CANCELAR" onClick={() => setIsModalOpen(false)} />
                          <TechButton variant="primary" label={saving ? "INICIALIZANDO..." : "CREAR MATRIZ"} onClick={handleSubmit} disabled={saving} />
                      </div>
                  </div>
               </div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}