
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarMonetizationReady } from '../../types/database';
import { mockService } from '../../lib/supabase';
import TechButton from '../ui/TechButton';
import RarityBadge from '../ui/RarityBadge';
import EditableCell from '../ui/EditableCell';
import GlitchToast from '../ui/GlitchToast';
import { AlertOctagon, Search } from 'lucide-react';
import { useMatrix } from '../../context/MatrixContext';
import { useTactical } from '../../context/TacticalContext';
import { useLog } from '../../context/LogContext';

const HemorrhageConsole: React.FC = () => {
  const { selectedMatrix } = useMatrix();
  const { openTacticalSheet } = useTactical();
  const { addLog } = useLog();
  const [items, setItems] = useState<RadarMonetizationReady[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const MotionDiv = motion.div as any;

  useEffect(() => {
    setLoading(true);
    mockService.getMonetizationGaps(selectedMatrix?.id).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, [selectedMatrix]);

  const handleHunterSearch = (assetName: string) => {
    addLog(`INITIATING EXTERNAL SEARCH PROTOCOL FOR: ${assetName}`, 'info');
    const query = encodeURIComponent(assetName);
    window.open(`https://payhip.com/dashboard/products?q=${query}`, '_blank');
  };

  const handlePatch = async (sku: string, value: string) => {
    if (!value) return;
    
    try {
      await mockService.patchAsset(sku, 'payhip', value);
      setItems(prev => prev.filter(i => i.sku !== sku));
      addLog(`ASSET ${sku} PATCHED SUCCESSFULLY. REVENUE STREAM SECURED.`, 'success');
    } catch (e) {
      setError("FALLO EN INYECCIÓN DE CÓDIGO.");
      addLog(`PATCH FAILED FOR ${sku}`, 'error');
    }
  };

  if (loading) return <div className="p-8 font-mono text-tech-green animate-pulse">ESCANEANDO FUGAS DE CAPITAL [MATRIX: {selectedMatrix?.code || 'ALL'}]...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <GlitchToast message={error} onClose={() => setError(null)} />
      
      <div className="flex items-center gap-4 border-b border-red-900/50 pb-4 mb-8">
        <div className="bg-red-900/20 p-3 border border-red-600 animate-pulse">
          <AlertOctagon className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-red-500 tracking-widest uppercase">Protocolo Hemorragia</h2>
          <div className="flex gap-2">
             <span className="font-mono text-xs text-red-400/70">DETECTADOS ACTIVOS DE ALTO VALOR SIN MONETIZACIÓN.</span>
             {selectedMatrix && <span className="font-mono text-xs text-white bg-red-900/50 px-1">FILTER: {selectedMatrix.code}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {items.map((item) => (
            <MotionDiv
              key={item.sku}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className="relative bg-black border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.2)] p-6 flex flex-col justify-between group"
            >
              {/* Interactive SKU Header */}
              <div 
                onClick={() => openTacticalSheet(item.sku)}
                className="cursor-pointer space-y-4 mb-6 hover:bg-white/5 -m-6 p-6 transition-colors border-b border-transparent hover:border-red-900"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{item.matrix_name}</span>
                  <RarityBadge tier={item.tier} />
                </div>
                
                <h3 className="text-xl font-bold text-white font-sans group-hover:text-tech-green transition-colors">{item.asset_name}</h3>
                
                <div className="flex items-center gap-4 font-mono text-xs">
                  <div className="text-red-400">IMPACTO: {item.potential_revenue_impact}</div>
                  <div className="text-gray-500">SCORE: {item.current_score}</div>
                </div>
                 <div className="text-[10px] font-mono text-gray-600">ID: {item.sku}</div>
              </div>

              <div className="space-y-3 relative z-10">
                 <div className="flex gap-2">
                    <TechButton 
                      variant="ghost" 
                      icon={Search} 
                      onClick={() => handleHunterSearch(item.asset_name)}
                      className="flex-1 text-[10px]"
                      label="HUNTER SEARCH"
                    />
                 </div>
                 
                 {/* Hot Trigger Editable Cell */}
                 <div className="bg-void-gray/20 border border-void-border p-2">
                    <label className="text-[9px] font-mono text-red-500 uppercase block mb-1">INYECCIÓN PAYHIP LINK</label>
                    <EditableCell 
                        value="" 
                        placeholder=">: PEGAR ENLACE AQUÍ" 
                        onSave={(val) => handlePatch(item.sku, val)}
                        type="url"
                        className="text-red-100 border-red-500"
                    />
                 </div>
              </div>

              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-500"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-500"></div>
            </MotionDiv>
          ))}
        </AnimatePresence>
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-800 text-gray-600 font-mono">
          <p className="text-xl text-tech-green">SISTEMA ESTABILIZADO</p>
          <p className="text-sm">NO SE DETECTAN FUGAS DE CAPITAL CRÍTICAS EN ESTE SECTOR</p>
        </div>
      )}
    </div>
  );
};

export default HemorrhageConsole;
