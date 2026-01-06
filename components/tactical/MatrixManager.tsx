import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MatrixRegistry, BusinessAsset } from '../../types/database';
import { mockService } from '../../lib/supabase';
import { useLog } from '../../context/LogContext';
import TechButton from '../ui/TechButton';
import TechInput from '../ui/TechInput';
import { Hexagon, Plus, ArrowLeft, X, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import MatrixDetailView from './MatrixDetailView';
import { AssetDetailView } from './AssetDetailView';

const MatrixManager: React.FC = () => {
  // Navigation State
  const [viewState, setViewState] = useState<'ROOT' | 'MATRIX_DETAIL' | 'ASSET_DETAIL'>('ROOT');
  const [selectedMatrix, setSelectedMatrix] = useState<MatrixRegistry | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<BusinessAsset | null>(null);

  // Data State
  const [matrices, setMatrices] = useState<MatrixRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State & Form Data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ 
    code: '', 
    name: '', 
    type: 'PRIMARY' as 'PRIMARY' | 'SECONDARY' 
  });

  // Hook de Auditoría
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
     // Validación simple
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
         
         // [CORRECCIÓN] Firma de función correcta: (mensaje, tipo)
         // Antes enviabas un objeto, eso rompía el KillLog
         addLog(
            `MATRIX INITIALIZED: ${formData.code.toUpperCase()} [${formData.type}]`,
            'success' // 'success' en minúscula coincide con LogEntry['type']
         );
         
         await fetchMatrices();
         setIsModalOpen(false);
     } catch (error) {
         console.error("Error creating matrix", error);
         
         // [CORRECCIÓN] Firma correcta para error
         addLog(
            `MATRIX INIT FAILED: ${formData.code.toUpperCase()}`,
            'error'
         );
         
         alert("Error crítico al inicializar matriz. Revisa la consola.");
     } finally {
         setSaving(false);
     }
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
    <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
      <div className="flex items-end justify-between border-b border-void-border pb-6 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-widest uppercase mb-2 flex items-center gap-3">
            <Hexagon className="w-8 h-8 text-tech-green" />Gestor de Matrices
          </h2>
          <p className="font-mono text-gray-500 text-sm">ONTOLOGÍA DEL SISTEMA // ROOT ACCESS</p>
        </div>
        <TechButton variant="primary" icon={Plus} label="NUEVA MATRIZ" onClick={handleOpenModal} />
      </div>

      <div className="border border-void-border bg-void-gray/10 flex-1 overflow-hidden flex flex-col relative">
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-void-border text-[10px] font-mono text-gray-500 uppercase tracking-wider bg-black">
          <div className="col-span-2">Código</div>
          <div className="col-span-4">Nombre Visual</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2 text-right">Eficiencia</div>
          <div className="col-span-2 text-right">Activos</div>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-tech-green animate-pulse font-mono flex flex-col items-center gap-4">
                <Activity className="w-6 h-6 animate-spin" />
                LOADING ONTOLOGY...
            </div>
          ) : (
             matrices.map((matrix) => (
                <div 
                    key={matrix.id} 
                    onClick={() => handleMatrixClick(matrix)}
                    className="grid grid-cols-12 gap-4 p-4 border-b border-void-border hover:bg-void-gray/20 transition-colors cursor-pointer group"
                >
                   <div className="col-span-2 font-mono font-bold text-white group-hover:text-tech-green">{matrix.code}</div>
                   <div className="col-span-4 font-sans text-sm text-gray-300">{matrix.name}</div>
                   <div className="col-span-2"><span className={cn("px-2 py-0.5 text-[10px] border", matrix.type === 'PRIMARY' ? "border-tech-green text-tech-green bg-tech-green/10" : "border-gray-600 text-gray-500")}>{matrix.type}</span></div>
                   <div className="col-span-2 text-right font-mono text-tech-green">{matrix.efficiency_score}%</div>
                   <div className="col-span-2 text-right font-mono text-gray-500 group-hover:text-white flex items-center justify-end gap-2">
                       {matrix.total_assets_count}
                       <ArrowLeft className="w-3 h-3 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity text-tech-green" />
                   </div>
                </div>
             ))
          )}
        </div>
      </div>
      
      {/* MODAL DE CREACIÓN */}
      <AnimatePresence>
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <div className="bg-gray-950 bg-void-black border border-gray-700 border-void-border p-6 max-w-md w-full relative animate-in zoom-in-95 duration-200 shadow-2xl shadow-tech-green/10">
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                  >
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
                                        formData.type === type 
                                            ? "border-tech-green bg-tech-green/10 text-tech-green" 
                                            : "border-gray-800 text-gray-500 hover:border-gray-600"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800 border-void-border">
                          <TechButton 
                            variant="ghost" 
                            label="CANCELAR" 
                            onClick={() => setIsModalOpen(false)} 
                          />
                          <TechButton 
                            variant="primary" 
                            label={saving ? "INICIALIZANDO..." : "CREAR MATRIZ"} 
                            onClick={handleSubmit} 
                            disabled={saving} 
                          />
                      </div>
                  </div>
               </div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatrixManager;