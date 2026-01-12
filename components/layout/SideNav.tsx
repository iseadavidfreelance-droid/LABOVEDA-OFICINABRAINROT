import React, { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  Radar, 
  Zap, 
  Layers, 
  Skull, 
  Trash2, 
  Database, 
  Activity, 
  Hexagon, 
  Box,
  Globe // <--- NUEVO ICONO
} from "lucide-react";
import { cn } from "../../lib/utils";
import { mockService } from "../../lib/supabase";

interface NavItemProps {
  label: string;
  icon: React.ElementType;
  count?: number;
  alertLevel?: 'none' | 'low' | 'high';
  active?: boolean;
  shortcut?: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon: Icon, count, alertLevel = 'none', active, shortcut, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "group w-full flex items-center justify-between px-3 py-2 mb-1 text-xs font-mono uppercase tracking-wider transition-all duration-200 border-l-2",
      active 
        ? "border-tech-green bg-void-gray text-white" 
        : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-void-gray/30"
    )}
  >
    <div className="flex items-center gap-3">
      <Icon className={cn("w-4 h-4", active ? "text-tech-green" : "text-gray-600 group-hover:text-gray-400")} />
      <span>{label}</span>
    </div>
    
    <div className="flex items-center gap-2">
      {count !== undefined && count > 0 && (
        <span className={cn(
          "px-1.5 py-0.5 text-[10px] font-bold rounded-sm min-w-[20px] text-center",
          alertLevel === 'high' ? "bg-red-900/50 text-red-500 border border-red-900" :
          alertLevel === 'low' ? "bg-tech-green/10 text-tech-green border border-tech-green/30" :
          "bg-gray-800 text-gray-400"
        )}>
          {count}
        </span>
      )}
      {shortcut && <span className="hidden group-hover:block text-[9px] text-gray-700">[{shortcut}]</span>}
    </div>
  </button>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 mt-6 mb-2 text-[10px] font-bold text-gray-700 uppercase tracking-[0.2em]">
    {children}
  </div>
);

interface SideNavProps {
    currentView: string;
    onNavigate: (view: string) => void;
}

const SideNav: React.FC<SideNavProps> = ({ currentView, onNavigate }) => {
  const [counts, setCounts] = useState({
    hemorragia: 0,
    infra: 0,
    ghosts: 0,
    void: 0,
    dust: 0
  });

  useEffect(() => {
    // Si mockService falla, esto no romperá la app
    mockService.getViewCounts().then(data => {
      if (data) {
        setCounts({
          hemorragia: data.radar_monetization_ready || 0,
          infra: data.radar_infrastructure_gap || 0,
          ghosts: data.radar_ghost_assets || 0,
          void: data.radar_the_void || 0,
          dust: data.radar_dust_cleaner || 0
        });
      }
    }).catch(e => console.error("Nav Error", e));
  }, []);

  return (
    <aside className="w-64 h-full border-r border-void-border bg-black flex flex-col">
      <div className="p-4 border-b border-void-border">
        <h1 className="text-2xl font-sans font-bold text-white tracking-wider flex items-center gap-2">
          <Activity className="w-5 h-5 text-tech-green" />
          LABOVEDA
        </h1>
        <p className="text-[10px] font-mono text-gray-600 mt-1">OPERATING SYSTEM v1.2</p>
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        
        {/* SECTOR DEFENSA (ALT+1) */}
        <SectionTitle>01 // Defensa (Radar)</SectionTitle>
        <NavItem 
          label="Hemorragia" 
          icon={ShieldAlert} 
          count={counts.hemorragia} 
          alertLevel="high"
          shortcut="ALT+1"
          active={currentView === 'hemorragia'}
          onClick={() => onNavigate('hemorragia')}
        />
        <NavItem 
          label="Infraestructura" 
          icon={Database} 
          count={counts.infra} 
          alertLevel="low"
          active={currentView === 'infrastructure'}
          onClick={() => onNavigate('infrastructure')}
        />
        <NavItem 
          label="Fantasmas" 
          icon={Skull} 
          count={counts.ghosts} 
          alertLevel="low" 
          active={currentView === 'ghosts'}
          onClick={() => onNavigate('ghosts')}
        />

        {/* SECTOR TÁCTICO (ALT+2) */}
        <SectionTitle>02 // Táctico (Ops)</SectionTitle>
        <NavItem 
          label="Inventario" 
          icon={Box} 
          active={currentView === 'assets'}
          onClick={() => onNavigate('assets')}
        />
        <NavItem 
          label="Matrices" 
          icon={Hexagon} 
          active={currentView === 'matrices'}
          onClick={() => onNavigate('matrices')}
        />
        <NavItem 
          label="El Vacío" 
          icon={Radar} 
          count={counts.void} 
          alertLevel="none" 
          shortcut="ALT+2"
          active={currentView === 'void'}
          onClick={() => onNavigate('void')}
        />
        <NavItem 
          label="Incinerador" 
          icon={Trash2} 
          count={counts.dust} 
          alertLevel="none" 
          active={currentView === 'incinerator'}
          onClick={() => onNavigate('incinerator')}
        />

        {/* SECTOR ESTRATÉGICO (ALT+3) */}
        <SectionTitle>03 // Estratégico (Command)</SectionTitle>
        <NavItem 
          label="Comando Central" 
          icon={Globe} 
          shortcut="ALT+3"
          active={currentView === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <NavItem 
          label="Bóveda Élite" 
          icon={Layers} 
          active={currentView === 'elite'}
          onClick={() => onNavigate('elite')}
        />
         <NavItem 
          label="Ingestion Logs" 
          icon={Zap} 
          active={currentView === 'logs'}
          onClick={() => onNavigate('logs')}
        />
      </div>

      <div className="p-4 border-t border-void-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-void-gray border border-void-border flex items-center justify-center text-xs font-bold text-tech-green">
            OP
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-white font-bold">OPERATOR_01</span>
            <span className="text-[10px] text-gray-500">ACCESS LEVEL: 5</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;