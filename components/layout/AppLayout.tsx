import React, { useState, useEffect } from "react";
import  SideNav  from "./SideNav";
import { GlobalHeader } from "./GlobalHeader";
import BootSequence from "./BootSequence";
import { AnimatePresence } from "framer-motion";

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, currentView, onNavigate }) => {
  const [booted, setBooted] = useState(false);

  // GLOBAL HOTKEYS (Atajos de teclado Alt+1, Alt+2...)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case '1': e.preventDefault(); onNavigate('hemorragia'); break;
          case '2': e.preventDefault(); onNavigate('void'); break;
          case '3': e.preventDefault(); onNavigate('dashboard'); break;
          default: break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  return (
    <>
      {/* SECUENCIA DE ARRANQUE (BIOS) */}
      <AnimatePresence>
        {!booted && <BootSequence onComplete={() => setBooted(true)} />}
      </AnimatePresence>

      {/* SISTEMA OPERATIVO (Solo visible tras el boot) */}
      <div className={`flex h-screen w-screen bg-void-black overflow-hidden transition-opacity duration-1000 ${booted ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* SIDEBAR - Navegación Lateral */}
        <div className="flex-none z-50">
          <SideNav currentView={currentView} onNavigate={onNavigate} />
        </div>

        {/* ÁREA PRINCIPAL */}
        <div className="flex-1 flex flex-col min-w-0 bg-black relative">
          
          {/* HEADER - Contextual & Telemetría */}
          <div className="flex-none z-40">
             <GlobalHeader 
                sectionTitle={currentView.toUpperCase()} 
             />
          </div>

          {/* CONTENIDO SCROLLABLE */}
          <main className="flex-1 overflow-auto p-0 relative bg-black custom-scrollbar">
            {/* Decoración de Fondo (Grid Sutil) */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" 
                 style={{ 
                   backgroundImage: 'linear-gradient(#1f1f1f 1px, transparent 1px), linear-gradient(90deg, #1f1f1f 1px, transparent 1px)', 
                   backgroundSize: '40px 40px' 
                 }} 
            />
            
            {/* Ruido Estático (Efecto Cine) */}
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] fixed z-0 mix-blend-overlay"></div>
            
            {/* El contenido real inyectado aquí */}
            <div className="relative z-10 h-full p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AppLayout;