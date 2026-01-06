
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MatrixRegistry } from '../../types/database';
import { mockService } from '../../lib/supabase';
import { useLog } from '../../context/LogContext';
import TechButton from '../ui/TechButton';
import TechInput from '../ui/TechInput';
import { Hexagon, Plus, X, Server } from 'lucide-react';
import { cn } from '../../lib/utils';

const MatrixManager: React.FC = () => {
  const [matrices, setMatrices] = useState<MatrixRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addLog } = useLog();
  const MotionDiv = motion.div as any;

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'PRIMARY' as 'PRIMARY' | 'SECONDARY'
  });

  useEffect(() => {
    fetchMatrices();
  }, []);

  const fetchMatrices = async () => {
    setLoading(true);
    const data = await mockService.getMatrices();
    setMatrices(data);
    setLoading(false);
  };

  const handleOpenModal = () => {
    setFormData({ code: '', name: '', type: 'PRIMARY' });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      addLog("VALIDATION ERROR: CODE AND NAME REQUIRED", "error");
      return;
    }

    setSaving(true);
    try {
      await mockService.createMatrix(formData);
      addLog(`NEW MATRIX [${formData.code}] INITIALIZED SUCCESSFULLY`, "success");
      
      // Optimistic update
      const newMatrix: MatrixRegistry = {
        id: Math.random().toString(36),
        ...formData,
        description: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_assets_count: 0,
        efficiency_score: 0
      };
      setMatrices(prev => [...prev, newMatrix]);
      setIsModalOpen(false);
    } catch (e) {
      addLog("FATAL ERROR: COULD NOT WRITE TO REGISTRY", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-void-border pb-6 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-widest uppercase mb-2 flex items-center gap-3">
            <Hexagon className="w-8 h-8 text-tech-green" />
            Gestor de Matrices
          </h2>
          <p className="font-mono text-gray-500 text-sm">ONTOLOGÍA DEL SISTEMA // ROOT ACCESS</p>
        </div>
        <TechButton variant="primary" icon={Plus} label="NUEVA MATRIZ" onClick={handleOpenModal} />
      </div>

      {/* Table */}
      <div className="border border-void-border bg-void-gray/10 flex-1 overflow-hidden flex flex-col relative">
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-void-border text-[10px] font-mono text-gray-500 uppercase tracking-wider bg-black">
          <div className="col-span-2">Código (PK)</div>
          <div className="col-span-4">Nombre de Matriz</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2 text-right">Eficiencia</div>
          <div className="col-span-2 text-right">Activos</div>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
             <div className="p-8 text-center text-tech-green animate-pulse font-mono">LOADING ONTOLOGY...</div>
          ) : (
             matrices.map((matrix) => (
                <div key={matrix.id} className="grid grid-cols-12 gap-4 p-4 border-b border-void-border hover:bg-void-gray/20 transition-colors group">
                   <div className="col-span-2 font-mono font-bold text-white">{matrix.code}</div>
                   <div className="col-span-4 font-sans text-sm text-gray-300">{matrix.name}</div>
                   <div className="col-span-2">
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] border",
                        matrix.type === 'PRIMARY' ? "border-tech-green text-tech-green bg-tech-green/10" : "border-gray-600 text-gray-500"
                      )}>
                        {matrix.type}
                      </span>
                   </div>
                   <div className="col-span-2 text-right font-mono text-tech-green">{matrix.efficiency_score}%</div>
                   <div className="col-span-2 text-right font-mono text-gray-500">{matrix.total_assets_count}</div>
                </div>
             ))
          )}
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <MotionDiv
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
               onClick={() => setIsModalOpen(false)}
             />
             
             <MotionDiv
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-void-black border border-void-border w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8"
             >
                <div className="flex justify-between items-start mb-6">
                   <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Server className="w-5 h-5 text-tech-green" />
                      Crear Nueva Entidad
                   </h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="space-y-6">
                   <TechInput 
                      label="CÓDIGO DE MATRIZ (ID)"
                      placeholder="EJ: ALFA, BETA..."
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      maxLength={10}
                   />
                   
                   <TechInput 
                      label="NOMBRE VISUAL"
                      placeholder="EJ: CYBER ARMORY"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                   />

                   <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">TIPO DE MATRIZ</label>
                      <div className="grid grid-cols-2 gap-4">
                         {['PRIMARY', 'SECONDARY'].map((type) => (
                            <button
                               key={type}
                               onClick={() => setFormData({...formData, type: type as any})}
                               className={cn(
                                  "py-2 border text-xs font-mono transition-all duration-200",
                                  formData.type === type 
                                    ? "border-tech-green bg-tech-green/20 text-white shadow-[0_0_10px_rgba(0,255,65,0.2)]" 
                                    : "border-void-border text-gray-600 hover:bg-void-gray"
                               )}
                            >
                               {type}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="pt-4 flex justify-end gap-4">
                      <TechButton variant="ghost" label="CANCELAR" onClick={() => setIsModalOpen(false)} />
                      <TechButton 
                        variant="primary" 
                        label={saving ? "INICIALIZANDO..." : "CONFIRMAR CREACIÓN"} 
                        onClick={handleSubmit} 
                        disabled={saving}
                      />
                   </div>
                </div>

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white"></div>
             </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatrixManager;