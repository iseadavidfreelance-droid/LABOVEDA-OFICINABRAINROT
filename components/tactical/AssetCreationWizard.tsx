import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, tacticalService } from '../../lib/supabase';
import { MatrixRegistry, BusinessAsset, PinterestNode } from '../../types/database';
import TechButton from '../ui/TechButton';
import TechInput from '../ui/TechInput';
import { Server, Database, Hexagon, HardDrive, DollarSign, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { useLog } from '../../context/LogContext';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (asset: BusinessAsset) => void; 
  preselectedMatrixId?: string; 
  sourcePin?: PinterestNode | null; // CRÍTICO: Para promover desde el Vacío
}

const AssetCreationWizard: React.FC<WizardProps> = ({ isOpen, onClose, onSuccess, preselectedMatrixId, sourcePin }) => {
  // FASES: 1 (Matriz), 2 (Identidad), 3 (Infraestructura - RECUPERADO)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [matrices, setMatrices] = useState<MatrixRegistry[]>([]);
  const [selectedMatrix, setSelectedMatrix] = useState<MatrixRegistry | null>(null);
  
  // Datos del Activo
  const [generatedData, setGeneratedData] = useState<{ sku: string; name: string; drive?: string; payhip?: string } | null>(null);
  
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
  }, [isOpen, preselectedMatrixId, sourcePin]);

  const loadMatrices = async () => {
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
        .eq('matrix_code', matrixId)
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
      
      // Si viene de un Pin, usamos su título. Si no, vacío.
      setGeneratedData({ 
          sku, 
          name: sourcePin ? (sourcePin.title || 'Untitled Pin') : '',
          drive: '',
          payhip: ''
      });
      setStep(2);
    } catch (e) {
      addLog("ERROR CALCULATING IDENTITY", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGICA CENTRAL: Crear o Promover ---
  const handleConfirmIdentity = async () => {
    if (!selectedMatrix || !generatedData || !generatedData.name) {
        addLog("NAME REQUIRED", "error");
        return;
    }
    setLoading(true);
    try {
        if (sourcePin) {
            // MODO PROMOCIÓN (Usando tacticalService para atomicidad)
            await tacticalService.promoteSignalToAsset(
                {
                    pin_id: sourcePin.pin_id,
                    title: generatedData.name,
                    image_url: sourcePin.image_url,
                    impressions: sourcePin.impressions,
                    outbound_clicks: sourcePin.outbound_clicks,
                    clicks: sourcePin.saves 
                },
                selectedMatrix.id,
                generatedData.sku
            );
            addLog(`SIGNAL PROMOTED: ${generatedData.sku}`, "success");
        } else {
            // MODO CREACIÓN STANDARD
            await supabase.from('business_assets').insert({
                sku: generatedData.sku,
                name: generatedData.name,
                primary_matrix_id: selectedMatrix.id,
                rarity_tier: 'DUST',
                total_score: 0
            });
            addLog(`ASSET CREATED: ${generatedData.sku}`, "success");
        }
        
        // NO CERRAMOS. AVANZAMOS A FASE 3 (INFRAESTRUCTURA)
        setStep(3);

    } catch (e) {
        console.error(e);
        addLog("DB WRITE ERROR", "error");
    } finally {
        setLoading(false);
    }
  };

  // --- NUEVA FASE: Inyección de Links ---
  const handleFinalize = async () => {
      setLoading(true);
      try {
          if (generatedData?.drive) await tacticalService.patchAsset(generatedData.sku, 'drive', generatedData.drive);
          if (generatedData?.payhip) await tacticalService.patchAsset(generatedData.sku, 'payhip', generatedData.payhip);
          
          if (onSuccess) onSuccess({} as any); // Trigger refresh
          onClose();
      } catch (e) {
          addLog("INFRA ERROR", "error");
      } finally {
          setLoading(false);
      }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
          
          {/* CORRECCIÓN VISUAL: Fondo Negro Sólido */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }} 
            className="relative w-full max-w-md bg-black border border-zinc-800 shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden"
          >
            {/* HEADER */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Server className="w-4 h-4 text-tech-green" /> 
                {sourcePin ? 'SIGNAL PROMOTION PROTOCOL' : 'NEW SILO PROTOCOL'}
              </h3>
              <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4"/></button>
            </div>

            <div className="p-6">
              {/* STEP 1: MATRIX SELECTION */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400 font-mono">SELECT PARENT MATRIX:</p>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                    {matrices.map(m => (
                      <button key={m.id} onClick={() => handleMatrixSelect(m)} className="w-full text-left p-3 border border-zinc-800 hover:border-tech-green hover:bg-tech-green/10 transition-all group flex items-center gap-3">
                        <Hexagon className="w-4 h-4 text-gray-600 group-hover:text-tech-green" />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-bold text-white font-sans">{m.name}</span>
                          <span className="text-xs font-mono text-gray-500 group-hover:text-tech-green">{m.code}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: IDENTITY (Adaptado con Pin) */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Contexto del Pin si existe */}
                  {sourcePin && (
                      <div className="flex gap-3 p-3 bg-zinc-900/50 border border-zinc-800">
                          <img src={sourcePin.image_url} className="w-12 h-12 object-cover opacity-80 border border-zinc-700" />
                          <div>
                              <div className="text-[10px] text-tech-green uppercase tracking-widest">INCOMING SIGNAL</div>
                              <div className="text-xs text-white truncate w-48 font-sans">{sourcePin.title}</div>
                          </div>
                      </div>
                  )}

                  <div className="bg-tech-green/5 border border-tech-green/20 p-4 rounded relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Database className="w-12 h-12 text-tech-green" /></div>
                    <div className="space-y-4 relative z-10">
                      <div>
                          <label className="text-[10px] text-tech-green uppercase tracking-widest">ASSIGNED SKU</label>
                          <div className="text-xl font-mono text-white font-bold">{generatedData?.sku}</div>
                      </div>
                      
                      <TechInput 
                        label="VISUAL NAME"
                        autoFocus
                        value={generatedData?.name}
                        onChange={(e) => setGeneratedData(prev => prev ? {...prev, name: e.target.value} : null)}
                        placeholder="Type Asset Name..."
                      />
                      
                      <div className="text-xs font-mono text-gray-400 pt-2 border-t border-dashed border-gray-800">PARENT: {selectedMatrix?.name}</div>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    {!preselectedMatrixId && <TechButton variant="ghost" label="BACK" onClick={() => setStep(1)} />}
                    <div className="flex-1"></div>
                    <TechButton variant="primary" label={loading ? "DEPLOYING..." : "CONFIRM & DEPLOY"} onClick={handleConfirmIdentity} disabled={loading || !generatedData?.name} />
                  </div>
                </div>
              )}

              {/* STEP 3: INFRASTRUCTURE (LA PARTE QUE HABÍA PERDIDO) */}
              {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                      <div className="p-4 bg-tech-green/10 border border-tech-green/30 flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-tech-green" />
                          <div>
                              <h4 className="text-white font-bold text-sm uppercase tracking-wide">ASSET DEPLOYED</h4>
                              <p className="text-[10px] text-gray-400 font-mono">{generatedData?.sku}</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <TechInput 
                            label="GOOGLE DRIVE FOLDER"
                            autoFocus
                            placeholder="https://drive.google.com/..."
                            value={generatedData?.drive}
                            onChange={(e) => setGeneratedData(prev => prev ? {...prev, drive: e.target.value} : null)}
                          />
                          <TechInput 
                            label="PAYHIP PRODUCT LINK"
                            placeholder="https://payhip.com/b/..."
                            value={generatedData?.payhip}
                            onChange={(e) => setGeneratedData(prev => prev ? {...prev, payhip: e.target.value} : null)}
                          />
                      </div>

                      <div className="flex justify-end pt-2">
                          <TechButton 
                            variant="primary" 
                            label={loading ? "SAVING..." : "FINALIZE & CLOSE"} 
                            icon={ArrowRight} 
                            onClick={handleFinalize} 
                            disabled={loading} 
                          />
                      </div>
                  </div>
              )}
            </div>
            
            {loading && step !== 3 && (<div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"><div className="text-tech-green text-xs font-mono animate-pulse">PROCESSING DATA...</div></div>)}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default AssetCreationWizard;