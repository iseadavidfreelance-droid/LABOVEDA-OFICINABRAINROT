import React, { useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import TechButton from './components/ui/TechButton';
import RarityBadge from './components/ui/RarityBadge';
import { Play } from 'lucide-react';
import VoidTerminal from './components/tactical/VoidTerminal';
import HemorrhageConsole from './components/defense/HemorrhageConsole';
import InfraConsole from './components/defense/InfraConsole';
import GhostConsole from './components/defense/GhostConsole';
import EliteVault from './components/strategy/EliteVault';
import MatrixManager from './components/tactical/MatrixManager';
import { AssetManager } from './components/tactical/AssetManager';
import { MatrixProvider } from './context/MatrixContext';
import { TacticalProvider } from './context/TacticalContext';
import { LogProvider } from './context/LogContext';
import CommandPalette from './components/ui/CommandPalette';
import TacticalSheet from './components/ui/TacticalSheet';
import KillLog from './components/ui/KillLog';

// CORRECCIÓN: Ruta correcta desde la raíz
import { supabase } from './lib/supabase'; 

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <LogProvider>
      <MatrixProvider>
        <TacticalProvider>
          <CommandPalette onNavigate={setCurrentView} />
          <TacticalSheet />
          <KillLog />
          <AppLayout currentView={currentView} onNavigate={setCurrentView}>
            
            {currentView === 'hemorragia' && <HemorrhageConsole />}
            {currentView === 'infrastructure' && <InfraConsole />}
            {currentView === 'ghosts' && <GhostConsole onNavigate={setCurrentView} />}
            {currentView === 'matrices' && <MatrixManager />}
            {currentView === 'assets' && <AssetManager />}
            {currentView === 'void' && <VoidTerminal />}
            {currentView === 'elite' && <EliteVault />}

            {currentView === 'dashboard' && (
              <div className="space-y-8 max-w-7xl mx-auto">
                <div className="flex items-end justify-between border-b border-void-border pb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-widest uppercase mb-2">Comando Central</h2>
                    <p className="font-mono text-gray-500 text-sm">RESUMEN ESTRATÉGICO // MATRIZ GLOBAL</p>
                  </div>
                  <div className="flex gap-4">
                    <TechButton variant="ghost" label="Exportar Reporte" />
                    <TechButton variant="primary" icon={Play} label="Iniciar Ingesta" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-void-gray/20 border border-void-border p-6 relative group">
                      <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 bg-tech-green"></div>
                      </div>
                      <h3 className="text-gray-500 font-mono text-xs uppercase mb-2">Eficiencia de Red</h3>
                      <div className="text-4xl font-mono text-white font-bold">87.5%</div>
                      <div className="mt-4 h-1 bg-gray-800 w-full">
                        <div className="h-full bg-tech-green w-[87%]"></div>
                      </div>
                  </div>

                  <div className="bg-void-gray/20 border border-void-border p-6">
                      <h3 className="text-gray-500 font-mono text-xs uppercase mb-2">Alertas Criticas</h3>
                      <div className="text-4xl font-mono text-red-500 font-bold">12</div>
                      <p className="text-xs text-gray-600 mt-2">REQUIERE ATENCIÓN INMEDIATA</p>
                  </div>

                  <div className="bg-void-gray/20 border border-void-border p-6">
                      <h3 className="text-gray-500 font-mono text-xs uppercase mb-2">Próxima Sincronización</h3>
                      <div className="text-4xl font-mono text-rank-uncommon font-bold">04:30:00</div>
                      <p className="text-xs text-gray-600 mt-2">TIEMPO RESTANTE</p>
                  </div>
                </div>

                <div className="border border-void-border bg-void-gray/10 p-6">
                  <h3 className="text-tech-green font-mono text-sm uppercase mb-4 border-b border-void-border/50 pb-2">Activos Destacados (Top Performers)</h3>
                  <div className="space-y-2">
                      {[
                        { name: "Alpha Protocol Node", tier: 'LEGENDARY', score: 1250 },
                        { name: "Void Runner Asset", tier: 'RARE', score: 850 },
                        { name: "Neon Flux Capacitor", tier: 'UNCOMMON', score: 320 },
                        { name: "Dust Particle #402", tier: 'DUST', score: 12 },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-void-border bg-black hover:bg-void-gray/30 transition-colors cursor-pointer">
                          <span className="font-mono text-sm text-gray-300">{item.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-tech-green text-xs">{item.score} SCR</span>
                            <RarityBadge tier={item.tier as any} />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {!['dashboard', 'void', 'matrices', 'hemorragia', 'infrastructure', 'elite', 'ghosts', 'assets'].includes(currentView) && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 font-mono">
                  <p className="text-xl">MÓDULO EN CONSTRUCCIÓN</p>
                  <p className="text-xs mt-2">ACCESO RESTRINGIDO A FASES FUTURAS</p>
              </div>
            )}

          </AppLayout>
        </TacticalProvider>
      </MatrixProvider>
    </LogProvider>
  );
};

export default App;