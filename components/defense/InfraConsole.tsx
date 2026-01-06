
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarInfrastructureGap } from '../../types/database';
import { mockService } from '../../lib/supabase';
import EditableCell from '../ui/EditableCell';
import GlitchToast from '../ui/GlitchToast';
import { Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMatrix } from '../../context/MatrixContext';
import { useTactical } from '../../context/TacticalContext';
import { useLog } from '../../context/LogContext';

const InfraConsole: React.FC = () => {
  const { selectedMatrix } = useMatrix();
  const { openTacticalSheet } = useTactical();
  const { addLog } = useLog();
  const [items, setItems] = useState<RadarInfrastructureGap[]>([]);
  const [error, setError] = useState<string | null>(null);
  const MotionDiv = motion.div as any;

  useEffect(() => {
    mockService.getInfrastructureGaps(selectedMatrix?.id).then(setItems);
  }, [selectedMatrix]);

  const handleFix = async (sku: string, value: string) => {
    // Validation: Google Drive or Docs
    if (!value || !/google\.com/.test(value)) {
      setError("ERROR DE SINTAXIS: URL DE GOOGLE INVÁLIDA");
      addLog("VALIDATION FAILURE: INVALID GOOGLE DOMAIN", 'error');
      throw new Error("Invalid URL");
    }

    try {
      await mockService.patchAsset(sku, 'drive', value);
      // Remove from list on success
      setItems(prev => prev.filter(i => i.sku !== sku));
      addLog(`INFRASTRUCTURE GAP REPAIRED FOR ${sku}`, 'success');
    } catch (e) {
      setError("ERROR DE ESCRITURA EN SECTOR DE DISCO.");
      addLog(`DRIVE WRITE FAILURE FOR ${sku}`, 'error');
      throw e;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <GlitchToast message={error} onClose={() => setError(null)} />
      
      <div className="flex items-end justify-between border-b border-void-border pb-4 mb-6">
        <div className="flex items-center gap-3">
             <Database className="w-6 h-6 text-yellow-500" />
             <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Brechas de Infraestructura</h2>
                <div className="flex gap-2 items-center">
                    <p className="font-mono text-[10px] text-yellow-500/70">MANTENIMIENTO ESTRUCTURAL REQUERIDO</p>
                    {selectedMatrix && <span className="text-[10px] font-mono text-tech-green">[{selectedMatrix.code}]</span>}
                </div>
             </div>
        </div>
        <div className="font-mono text-xs text-gray-500">
            PENDIENTES: <span className="text-white">{items.length}</span>
        </div>
      </div>

      <div className="border border-void-border bg-void-gray/10">
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-void-border text-[10px] font-mono text-gray-500 uppercase tracking-wider bg-black">
            <div className="col-span-4">Activo / SKU</div>
            <div className="col-span-2">Tipo de Error</div>
            <div className="col-span-1">Antigüedad</div>
            <div className="col-span-5">Consola de Reparación</div>
        </div>

        <div className="divide-y divide-void-border">
          <AnimatePresence>
            {items.map((item) => (
              <MotionDiv
                key={item.sku}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-void-gray/20 transition-colors group"
              >
                <div 
                    className="col-span-4 cursor-pointer"
                    onClick={() => openTacticalSheet(item.sku)}
                >
                    <div className="font-bold text-sm text-gray-300 group-hover:text-tech-green transition-colors">{item.asset_name}</div>
                    <div className="font-mono text-[10px] text-gray-600 group-hover:text-gray-400">{item.sku}</div>
                </div>
                
                <div className="col-span-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-900/20 text-yellow-500 text-[10px] border border-yellow-900/50">
                        <AlertTriangle className="w-3 h-3" />
                        {item.issue_type}
                    </span>
                </div>
                
                <div className="col-span-1 font-mono text-xs text-gray-400">
                    {item.days_open} DÍAS
                </div>
                
                <div className="col-span-5">
                    <EditableCell 
                        value="" 
                        placeholder=">: INGRESAR LINK GOOGLE DRIVE" 
                        onSave={(val) => handleFix(item.sku, val)}
                        type="url"
                    />
                </div>
              </MotionDiv>
            ))}
          </AnimatePresence>
        </div>
        
        {items.length === 0 && (
            <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-tech-green mx-auto mb-3 opacity-50" />
                <p className="font-mono text-sm text-gray-500">INTEGRIDAD ESTRUCTURAL AL 100%</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default InfraConsole;
