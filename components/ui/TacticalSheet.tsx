
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Activity, Globe, Database, Share2 } from 'lucide-react';
import { useTactical } from '../../context/TacticalContext';
import { mockService } from '../../lib/supabase';
import { BusinessAsset } from '../../types/database';
import RarityBadge from './RarityBadge';
import TechButton from './TechButton';

const TacticalSheet: React.FC = () => {
  const { activeSku, closeTacticalSheet } = useTactical();
  const [asset, setAsset] = useState<BusinessAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const MotionDiv = motion.div as any;

  useEffect(() => {
    if (activeSku) {
      setLoading(true);
      mockService.getAssetDetails(activeSku).then(data => {
        setAsset(data);
        setLoading(false);
      });
    } else {
        setAsset(null);
    }
  }, [activeSku]);

  // Handle ESC key to close
  useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape') closeTacticalSheet();
      }
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <AnimatePresence>
      {activeSku && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeTacticalSheet}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <MotionDiv
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-void-black border-l border-void-border z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-void-border bg-void-gray/10">
               <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                     <Cpu className="w-5 h-5 text-tech-green" />
                     TACTICAL DATA LINK
                  </h2>
                  <p className="font-mono text-xs text-gray-500 mt-1">ASSET_ID: {activeSku}</p>
               </div>
               <button onClick={closeTacticalSheet} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
               {loading ? (
                   <div className="flex flex-col items-center justify-center h-64 space-y-4">
                       <div className="w-8 h-8 border-2 border-tech-green border-t-transparent rounded-full animate-spin"></div>
                       <p className="font-mono text-xs text-tech-green animate-pulse">DECRYPTING SECURE DATA...</p>
                   </div>
               ) : asset ? (
                   <div className="space-y-8">
                       {/* Main Status Card */}
                       <div className="bg-void-gray/20 border border-void-border p-4 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-tech-green/10 to-transparent pointer-events-none"></div>
                           <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white font-sans">{asset.name}</h3>
                                <RarityBadge tier={asset.tier} />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                               <div>
                                   <span className="text-gray-500 block mb-1">SCORE</span>
                                   <span className="text-tech-green font-bold text-lg">{asset.score}</span>
                               </div>
                               <div>
                                   <span className="text-gray-500 block mb-1">STATUS</span>
                                   <span className="text-white border border-gray-700 px-2 py-0.5 inline-block">{asset.status}</span>
                               </div>
                           </div>
                       </div>

                       {/* Details Grid */}
                       <div className="space-y-2">
                           <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-void-border pb-1">Technical Specifications</h4>
                           <div className="grid grid-cols-1 gap-2 text-sm font-mono text-gray-400">
                               <div className="flex justify-between py-2 border-b border-void-border/50">
                                   <span className="flex items-center gap-2"><Database className="w-3 h-3" /> MATRIX ID</span>
                                   <span className="text-white">{asset.matrix_id}</span>
                               </div>
                               <div className="flex justify-between py-2 border-b border-void-border/50">
                                   <span className="flex items-center gap-2"><Activity className="w-3 h-3" /> CREATED AT</span>
                                   <span className="text-white">{new Date(asset.created_at).toLocaleDateString()}</span>
                               </div>
                           </div>
                       </div>

                       {/* Actions */}
                       <div className="grid grid-cols-2 gap-4 pt-4">
                           <TechButton variant="primary" icon={Share2} label="Share Node" />
                           <TechButton variant="ghost" icon={Globe} label="Open Public" />
                       </div>
                       
                       <div className="bg-red-900/10 border border-red-900/30 p-4 text-xs font-mono text-red-400">
                           <p className="mb-2 uppercase font-bold">Purge Protocol</p>
                           <p>Authorizing permanent deletion requires Level 5 Clearance.</p>
                       </div>
                   </div>
               ) : (
                   <div className="text-red-500 font-mono text-center">ASSET NOT FOUND IN LOCAL REGISTRY.</div>
               )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-void-border bg-black text-[10px] font-mono text-gray-600 flex justify-between">
                <span>SECURE CONNECTION</span>
                <span>LATENCY: 12ms</span>
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};

export default TacticalSheet;
