import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MatrixRegistry, BusinessAsset } from '../../types/database';
import { mockService } from '../../lib/supabase'; // Mantengo mockService para fetchMatrices si aún lo usas así, o cámbialo a tacticalService
import { useLog } from '../../context/LogContext';
import TechButton from '../ui/TechButton';
import TechInput from '../ui/TechInput';
import { Hexagon, Plus, X, Server, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

// Importamos las nuevas vistas separadas
import MatrixDetailView from './MatrixDetailView';
import AssetDetailView from './AssetDetailView';

const MatrixManager: React.FC = () => {
  // Navigation State
  const [viewState, setViewState] = useState<'ROOT' | 'MATRIX_DETAIL' | 'ASSET_DETAIL'>('ROOT');
  const [selectedMatrix, setSelectedMatrix] = useState<MatrixRegistry | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<BusinessAsset | null>(null);

  // Data State
  const [matrices, setMatrices] = useState<MatrixRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'PRIMARY' as const });
  
  const { addLog } = useLog();
  const MotionDiv = motion.div as any;

  useEffect(() => {
    fetchMatrices();
  }, []);

  const fetchMatrices = async () => {
    setLoading(true);
    // Asumo que esto ya conecta a Supabase en tu versión actual
    const data = await mockService.getMatrices(); 
    setMatrices(data);
    setLoading(false);
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

  // --- MODAL HANDLERS (Create Matrix) ---
  const handleOpenModal = () => {
    setFormData({ code: '', name: '', type: 'PRIMARY' });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
     // ... (Tu lógica de submit existente se mantiene igual)
     // ...
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
            <div className="p-8 text-center text-tech-green animate-pulse font-mono">LOADING ONTOLOGY...</div>
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
      
      {/* Mantén tu Modal de Creación existente aquí */}
      <AnimatePresence>
        {isModalOpen && (
            // ... Tu código de modal existente
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               {/* ... */}
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatrixManager;