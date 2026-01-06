
import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Monitor, Shield, Zap, Layers, Activity } from 'lucide-react';
import { mockService } from '../../lib/supabase';
import { BusinessAsset } from '../../types/database';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandPaletteProps {
  onNavigate: (view: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<BusinessAsset[]>([]);
  const MotionDiv = motion.div as any;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    
    // Index Assets on mount (simulated)
    mockService.searchAssets('a').then(setAssets); // Simplified fetch for "Index"

    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <MotionDiv 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl"
          >
            <Command 
                label="Global Command" 
                className="w-full bg-void-black border border-void-border shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-mono"
            >
              <div className="flex items-center px-4 py-3 border-b border-void-border">
                <Search className="w-4 h-4 text-tech-green mr-3 animate-pulse" />
                <Command.Input 
                    placeholder="Escriba un comando o busque un activo..." 
                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600 uppercase tracking-wider"
                />
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                <Command.Empty className="p-4 text-xs text-gray-500 text-center uppercase">
                    NO RESULTADO.
                </Command.Empty>

                <Command.Group heading="NAVEGACIÓN DE SISTEMA" className="text-[10px] text-gray-500 font-bold px-2 py-1 mb-1">
                  <Command.Item 
                    onSelect={() => handleSelect(() => onNavigate('dashboard'))}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-void-gray hover:text-white cursor-pointer transition-colors group border-l-2 border-transparent aria-selected:border-tech-green aria-selected:bg-void-gray aria-selected:text-white"
                  >
                    <Activity className="w-4 h-4 text-gray-500 group-hover:text-tech-green" />
                    <span>COMANDO CENTRAL (DASHBOARD)</span>
                    <span className="ml-auto text-[9px] text-gray-600">ALT+3</span>
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => handleSelect(() => onNavigate('hemorragia'))}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-void-gray hover:text-white cursor-pointer transition-colors group border-l-2 border-transparent aria-selected:border-tech-green aria-selected:bg-void-gray aria-selected:text-white"
                  >
                    <Shield className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
                    <span>SECTOR DEFENSA (RADAR)</span>
                    <span className="ml-auto text-[9px] text-gray-600">ALT+1</span>
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => handleSelect(() => onNavigate('elite'))}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-void-gray hover:text-white cursor-pointer transition-colors group border-l-2 border-transparent aria-selected:border-tech-green aria-selected:bg-void-gray aria-selected:text-white"
                  >
                    <Layers className="w-4 h-4 text-gray-500 group-hover:text-yellow-500" />
                    <span>ESTRATEGIA (ELITE VAULT)</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="ACCIONES DE SISTEMA" className="text-[10px] text-gray-500 font-bold px-2 py-1 mt-2 mb-1">
                   <Command.Item 
                        onSelect={() => handleSelect(() => console.log("TRIGGER SYNC"))}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-void-gray hover:text-white cursor-pointer transition-colors group border-l-2 border-transparent aria-selected:border-tech-green aria-selected:bg-void-gray aria-selected:text-white"
                    >
                        <Zap className="w-4 h-4 text-yellow-600" />
                        <span>FORZAR SINCRONIZACIÓN (SYNC)</span>
                    </Command.Item>
                </Command.Group>

                <Command.Group heading="INDEXADO DE ACTIVOS" className="text-[10px] text-gray-500 font-bold px-2 py-1 mt-2 mb-1">
                  {assets.map((asset) => (
                    <Command.Item 
                        key={asset.sku} 
                        value={asset.name + asset.sku}
                        onSelect={() => handleSelect(() => console.log("GOTO ASSET", asset.sku))}
                        className="flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-void-gray hover:text-white cursor-pointer transition-colors border-l-2 border-transparent aria-selected:border-tech-green aria-selected:bg-void-gray aria-selected:text-white"
                    >
                        <div className="flex flex-col">
                            <span className="font-sans font-bold">{asset.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{asset.sku}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 border border-gray-800 px-1 rounded bg-black">{asset.tier}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

              </Command.List>
            </Command>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;