
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface GlitchToastProps {
  message: string | null;
  onClose: () => void;
}

const GlitchToast: React.FC<GlitchToastProps> = ({ message, onClose }) => {
  const MotionDiv = motion.div as any;

  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <MotionDiv
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          className="fixed bottom-10 left-1/2 z-50 pointer-events-none"
        >
          <div className="relative bg-black border border-red-500 p-4 min-w-[300px] shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            {/* Glitch Overlay */}
            <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay animate-pulse pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-red-500/20 p-2 rounded-sm border border-red-500/50">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase">SYSTEM ERROR</span>
                <span className="text-sm font-mono text-white">{message}</span>
              </div>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-red-500"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-red-500"></div>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default GlitchToast;