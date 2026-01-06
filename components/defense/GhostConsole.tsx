
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarGhostAssets } from '../../types/database';
import { mockService } from '../../lib/supabase';
import { useMatrix } from '../../context/MatrixContext';
import { useLog } from '../../context/LogContext';
import { Skull, Trash2, Link, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import GlitchToast from '../ui/GlitchToast';

interface GhostConsoleProps {
  onNavigate: (view: string) => void;
}

const GhostConsole: React.FC<GhostConsoleProps> = ({ onNavigate }) => {
  const { selectedMatrix } = useMatrix();
  const { addLog } = useLog();
  const [ghosts, setGhosts] = useState<RadarGhostAssets[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const MotionDiv = motion.div as any;

  useEffect(() => {
    fetchGhosts();
  }, [selectedMatrix]);

  const fetchGhosts = async () => {
    setLoading(true);
    try {
      const data = await mockService.getGhostAssets(selectedMatrix?.id);
      setGhosts(data);
    } catch (e) {
      setError("FAILED TO SCAN SPECTRAL LAYER");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sku: string) => {
    try {
      await mockService.deleteAsset(sku);
      setGhosts(prev => prev.filter(g => g.sku !== sku));
      addLog(`GHOST PROTOCOL: ASSET ${sku} PERMANENTLY ERASED`, 'warning');
    } catch (e) {
      setError(`FAILED TO EXORCISE ${sku}`);
      addLog(`DELETE FAILED FOR ${sku}`, 'error');
    }
  };

  const handleAssign = (sku: string) => {
    addLog(`INITIATING LINK PROTOCOL FOR ${sku}. REDIRECTING TO TACTICAL...`, 'info');
    onNavigate('void');
    // In a real app, we would pass the SKU via URL query params or Context to auto-filter the Void list.
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <GlitchToast message={error} onClose={() => setError(null)} />

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-800 pb-4 mb-8">
        <div className="bg-void-gray p-3 border border-gray-700">
          <Skull className="w-8 h-8 text-gray-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-400 tracking-widest uppercase">Sector Fantasmas</h2>
          <div className="flex gap-2">
             <span className="font-mono text-xs text-gray-600">ACTIVOS INACTIVOS (SIN NODOS VINCULADOS).</span>
             {selectedMatrix && <span className="font-mono text-xs text-tech-green bg-void-gray px-1">FILTER: {selectedMatrix.code}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
         <div className="border border-void-border bg-void-gray/10 p-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Ghosts</div>
            <div className="text-2xl font-mono text-white">{ghosts.length}</div>
         </div>
         <div className="border border-void-border bg-void-gray/10 p-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Avg Dormancy</div>
            <div className="text-2xl font-mono text-gray-400">
                {ghosts.length > 0 ? Math.round(ghosts.reduce((acc, curr) => acc + curr.days_since_creation, 0) / ghosts.length) : 0} DAYS
            </div>
         </div>
         <div className="border border-void-border bg-void-gray/10 p-4 flex items-center justify-center">
             <span className="text-xs font-mono text-gray-600 animate-pulse">SPECTRAL SCAN ACTIVE</span>
         </div>
      </div>

      {/* List */}
      <div className="border border-void-border bg-void-gray/5">
         <div className="grid grid-cols-12 gap-4 p-3 border-b border-void-border text-[10px] font-mono text-gray-500 uppercase tracking-wider bg-black">
            <div className="col-span-3">SKU ID</div>
            <div className="col-span-4">Asset Name</div>
            <div className="col-span-2">Created At</div>
            <div className="col-span-1">Age</div>
            <div className="col-span-2 text-right">Actions</div>
         </div>

         <div className="divide-y divide-void-border">
            <AnimatePresence>
               {loading ? (
                   <div className="p-8 text-center text-gray-600 font-mono">SCANNING...</div>
               ) : ghosts.length === 0 ? (
                   <div className="p-12 text-center">
                       <p className="text-tech-green font-mono">SECTOR CLEAN. NO GHOSTS DETECTED.</p>
                   </div>
               ) : (
                   ghosts.map(ghost => (
                       <MotionDiv
                          key={ghost.sku}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -50, backgroundColor: "#330000" }}
                          className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-void-gray/20 transition-colors group"
                       >
                          <div className="col-span-3 font-mono text-xs text-gray-400 group-hover:text-white transition-colors">
                              {ghost.sku}
                          </div>
                          <div className="col-span-4 font-sans text-sm text-gray-300 font-bold">
                              {ghost.asset_name}
                          </div>
                          <div className="col-span-2 font-mono text-xs text-gray-600">
                              {new Date(ghost.created_at).toLocaleDateString()}
                          </div>
                          <div className="col-span-1 font-mono text-xs text-red-400">
                              {ghost.days_since_creation}d
                          </div>
                          <div className="col-span-2 flex justify-end gap-2">
                              <button 
                                onClick={() => handleAssign(ghost.sku)}
                                className="p-2 border border-void-border text-tech-green hover:bg-tech-green hover:text-black transition-all"
                                title="ASSIGN TO VOID"
                              >
                                  <Link className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDelete(ghost.sku)}
                                className="p-2 border border-void-border text-gray-600 hover:text-red-500 hover:border-red-500 transition-all active:scale-95"
                                title="DELETE PERMANENTLY"
                              >
                                  <Trash2 className="w-3 h-3" />
                              </button>
                          </div>
                       </MotionDiv>
                   ))
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};

export default GhostConsole;
