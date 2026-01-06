
import React from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemErrorProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

const SystemError: React.FC<SystemErrorProps> = ({ error, resetErrorBoundary }) => {
  const MotionDiv = motion.div as any;

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center p-8 font-mono overflow-hidden relative">
      {/* Background Noise / Scanlines */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10"
           style={{
             backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #ff0000 1px, #ff0000 2px)',
             backgroundSize: '100% 4px'
           }}
      />
      
      <MotionDiv 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 max-w-2xl w-full border-2 border-red-600 bg-black/90 p-8 shadow-[0_0_50px_rgba(220,38,38,0.2)]"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
        
        <div className="flex items-start gap-6 mb-8">
          <div className="bg-red-600/20 p-4 border border-red-600">
            <AlertTriangle className="w-12 h-12 text-red-600 animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-red-600 tracking-widest uppercase mb-2">SYSTEM FAILURE</h1>
            <p className="text-red-400 text-sm">FATAL EXCEPTION AT MEMORY BLOCK 0x000000</p>
          </div>
        </div>

        <div className="border border-red-900/50 bg-red-950/10 p-4 mb-8 font-mono text-xs text-red-300 h-48 overflow-y-auto custom-scrollbar">
            <p className="mb-2">{'>'} DIAGNOSTIC_TOOL --RUN</p>
            <p className="mb-2">{'>'} ANALYZING CORE DUMP...</p>
            <p className="mb-2 text-red-500">[ERROR] CRITICAL PROCESS TERMINATED UNEXPECTEDLY</p>
            <p className="mb-4 text-red-500">[ERROR] {error?.message || "UNKNOWN_CONNECTION_REFUSED"}</p>
            
            {error?.stack && (
              <pre className="opacity-50 text-[10px] whitespace-pre-wrap">{error.stack.slice(0, 300)}...</pre>
            )}
            
            <p className="mt-4 animate-pulse">_CURSOR_LOCK_ACTIVE</p>
        </div>

        <div className="flex justify-end gap-4">
             <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 border border-red-600 text-red-600 hover:bg-red-600 hover:text-black font-bold uppercase tracking-wider transition-colors"
             >
                <RefreshCw className="w-4 h-4" />
                REBOOT SYSTEM
             </button>
        </div>

        {/* Decorative Hex Codes */}
        <div className="absolute bottom-4 left-4 text-[10px] text-red-900 font-mono">
            0F 2A 4C 99 <br/>
            E1 00 B3 11
        </div>
      </MotionDiv>
    </div>
  );
};

export default SystemError;