
import React, { useState, useEffect } from "react";
import SideNav from "./SideNav";
import GlobalHeader from "./GlobalHeader";
import BootSequence from "./BootSequence";
import { AnimatePresence } from "framer-motion";

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, currentView, onNavigate }) => {
  const [booted, setBooted] = useState(false);

  // GLOBAL HOTKEYS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt key + Number
      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            onNavigate('hemorragia'); // Defense Sector
            break;
          case '2':
            e.preventDefault();
            onNavigate('void'); // Tactical Sector
            break;
          case '3':
            e.preventDefault();
            onNavigate('dashboard'); // Strategy Sector
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  return (
    <>
      <AnimatePresence>
        {!booted && <BootSequence onComplete={() => setBooted(true)} />}
      </AnimatePresence>

      <div className="flex h-screen w-screen bg-void-black overflow-hidden">
        {/* SIDEBAR - Fixed Width */}
        <div className="flex-none">
          <SideNav currentView={currentView} onNavigate={onNavigate} />
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* HEADER - Fixed Height */}
          <div className="flex-none">
             <GlobalHeader />
          </div>

          {/* CONTENT - Scrollable */}
          <main className="flex-1 overflow-auto p-6 relative">
            {/* Background Grid Decoration */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-20" 
                 style={{ 
                    backgroundImage: 'linear-gradient(#1f1f1f 1px, transparent 1px), linear-gradient(90deg, #1f1f1f 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                 }} 
            />
            
            <div className="relative z-10 h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AppLayout;
