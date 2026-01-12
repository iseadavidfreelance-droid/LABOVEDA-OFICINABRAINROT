import React, { useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import TechButton from './components/ui/TechButton';
import RarityBadge from './components/ui/RarityBadge';
import { Play } from 'lucide-react';

// Components
import VoidTerminal from './components/tactical/VoidTerminal';
import HemorrhageConsole from './components/defense/HemorrhageConsole';
import InfraConsole from './components/defense/InfraConsole';
import GhostConsole from './components/defense/GhostConsole';
import EliteVault from './components/strategy/EliteVault';
import MatrixManager from './components/tactical/MatrixManager';
import { AssetManager } from './components/tactical/AssetManager';
import CentralCommand from './components/command/CentralCommand'; // <--- NUEVO COMPONENTE

// Context
import { MatrixProvider } from './context/MatrixContext';
import { TacticalProvider } from './context/TacticalContext';
import { LogProvider } from './context/LogContext';

// UI
import CommandPalette from './components/ui/CommandPalette';
import TacticalSheet from './components/ui/TacticalSheet';
import KillLog from './components/ui/KillLog';

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
            
            {/* VISTAS DE DEFENSA */}
            {currentView === 'hemorragia' && <HemorrhageConsole />}
            {currentView === 'infrastructure' && <InfraConsole />}
            {currentView === 'ghosts' && <GhostConsole onNavigate={setCurrentView} />}
            
            {/* VISTAS TÁCTICAS */}
            {currentView === 'matrices' && <MatrixManager />}
            {currentView === 'assets' && <AssetManager />}
            {currentView === 'void' && <VoidTerminal />}
            
            {/* VISTAS ESTRATÉGICAS */}
            {currentView === 'elite' && <EliteVault />}
            
            {/* COMANDO CENTRAL (NUEVO DASHBOARD) */}
            {currentView === 'dashboard' && <CentralCommand />}

            {/* VISTA POR DEFECTO PARA PAGINAS NO IMPLEMENTADAS */}
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