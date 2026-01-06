import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { MatrixRegistry, BusinessAsset } from '../../types/database';
import TechButton from '../ui/TechButton';
import { Server, Database, Hexagon } from 'lucide-react';
import { useLog } from '../../context/LogContext';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (asset: BusinessAsset) => void; 
  preselectedMatrixId?: string; 
}

const AssetCreationWizard: React.FC<WizardProps> = ({ isOpen, onClose, onSuccess, preselectedMatrixId }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [matrices, setMatrices] = useState<MatrixRegistry[]>([]);
  const [selectedMatrix, setSelectedMatrix] = useState<MatrixRegistry | null>(null);
  const [generatedData, setGeneratedData] = useState<{ sku: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { addLog } = useLog();

  useEffect(() => {
    if (isOpen) {
      if (preselectedMatrixId) {
        handlePreselectedLoad(preselectedMatrixId);
      } else {
        setStep(1);
        loadMatrices();
      }
    }
  }, [isOpen, preselectedMatrixId]);

  const loadMatrices = async () => {
    // TRADUCCIÓN SQL PARA EL DROPDOWN
    const { data } = await supabase
      .from('matrix_registry')
      .select(`*, id:matrix_code, code:matrix_code, name:matrix_code`);
    if (data) setMatrices(data as any);
  };

  const handlePreselectedLoad = async (matrixId: string) => {
      setLoading(true);
      const { data } = await supabase
        .from('matrix_registry')
        .select(`*, id:matrix_code, code:matrix_code, name:matrix_code`)
        .eq('matrix_code', matrixId) // Ojo: en DB la columna es matrix_code
        .single();
      
      if (data) {
          await handleMatrixSelect(data as any);
      }
      setLoading(false);
  };

  const handleMatrixSelect = async (matrix: MatrixRegistry) => {
    setSelectedMatrix(matrix);
    setLoading(true);
    try {
      const { count } = await supabase
        .from('business_assets')
        .select('*', { count: 'exact', head: true })
        .eq('primary_matrix_id', matrix.id);
      
      const nextNum = (count || 0) + 1;
      const sku = `${matrix.code}-ASSET-${String(nextNum).padStart(3, '0')}`;
      
      setGeneratedData({ sku, name: '' });
      setStep(2);
    } catch (e) {
      addLog("ERROR CALCULATING IDENTITY", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedMatrix || !generatedData || !generatedData.name) {
        addLog("NAME REQUIRED", "error");
        return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_assets')
        .insert({
            sku: generatedData.sku,
            name: generatedData.name, // Asegúrate de tener esta columna en DB o quítala si usas SKU
            primary_matrix_id: selectedMatrix.id,
            rarity_tier: 'DUST',
            total_score: 0
        })
        .select()
        .single();

      if (error) throw error;
      if (onSuccess && data) onSuccess(data as any);
      onClose();
    } catch (e) {
      console.error(e);
      addLog("DB WRITE ERROR", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-void-black border border-void-border shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-4 border-b border-void-border bg-void-gray/20 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Server className="w-4 h-4 text-tech-green" /> NEW SILO PROTOCOL
              </h3>
              <button onClick={onClose} className="text-gray-500 hover:text-white text-xs">ABORT</button>
            </div>

            <div className="p-6">
              {step === 1 ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400 font-mono">SELECT PARENT MATRIX:</p>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                    {matrices.map(m => (
                      <button key={m.id} onClick={() => handleMatrixSelect(m)} className="w-full text-left p-3 border border-void-border hover:border-tech-green hover:bg-tech-green/10 transition-all group flex items-center gap-3">
                        <Hexagon className="w-4 h-4 text-gray-600 group-hover:text-tech-green" />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-bold text-white font-sans">{m.name}</span>
                          <span className="text-xs font-mono text-gray-500 group-hover:text-tech-green">{m.code}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-tech-green/5 border border-tech-green/20 p-4 rounded relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Database className="w-12 h-12 text-tech-green" /></div>
                    <div className="space-y-3 relative z-10">
                      <div><label className="text-[10px] text-tech-green uppercase tracking-widest">ASSIGNED SKU</label><div className="text-xl font-mono text-white font-bold">{generatedData?.sku}</div></div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase tracking-widest">VISUAL NAME</label>
                          <input 
                            autoFocus
                            className="w-full bg-transparent border-b border-gray-700 text-white font-sans text-lg focus:outline-none focus:border-tech-green placeholder-gray-600"
                            placeholder="Type Asset Name..."
                            value={generatedData?.name}
                            onChange={(e) => setGeneratedData(prev => prev ? {...prev, name: e.target.value} : null)}
                          />
                      </div>
                      <div className="text-xs font-mono text-gray-400 pt-2 border-t border-dashed border-gray-800">PARENT: {selectedMatrix?.name}</div>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    {!preselectedMatrixId && <TechButton variant="ghost" label="BACK" onClick={() => setStep(1)} />}
                    <div className="flex-1"></div>
                    <TechButton variant="primary" label={loading ? "DEPLOYING..." : "CONFIRM & DEPLOY"} onClick={handleConfirm} disabled={loading || !generatedData?.name} />
                  </div>
                </div>
              )}
            </div>
            {loading && (<div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"><div className="text-tech-green text-xs font-mono animate-pulse">CALCULATING IDENTITY...</div></div>)}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default AssetCreationWizard;