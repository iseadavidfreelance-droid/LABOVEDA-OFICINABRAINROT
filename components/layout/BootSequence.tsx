
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootSequenceProps {
  onComplete: () => void;
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const MotionDiv = motion.div as any;

  const sequence = [
    "INITIALIZING KERNEL...",
    "LOADING MEMORY BLOCKS...",
    "MOUNTING VOID FILE SYSTEM...",
    "CHECKING PERMISSIONS: [ADMIN]",
    "CONNECTING TO MATRIX NODES...",
    "SYNCING ONTOLOGY...",
    "SYSTEM READY."
  ];

  useEffect(() => {
    let delay = 0;
    sequence.forEach((line, index) => {
      delay += Math.random() * 300 + 100;
      setTimeout(() => {
        setLogs(prev => [...prev, line]);
        if (index === sequence.length - 1) {
          setTimeout(onComplete, 800);
        }
      }, delay);
    });
  }, []);

  return (
    <MotionDiv 
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono text-xs md:text-sm text-tech-green selection:bg-tech-green selection:text-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="w-full max-w-md p-8 border border-void-border bg-void-gray/20">
        <div className="mb-4 border-b border-void-border pb-2 flex justify-between items-center">
          <span className="font-bold tracking-widest text-white">LABOVEDA BIOS v1.2</span>
          <span className="animate-pulse">_</span>
        </div>
        <div className="flex flex-col space-y-1 h-48 overflow-hidden justify-end">
          {logs.map((log, i) => (
            <MotionDiv 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2"
            >
              <span className="text-gray-600">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
              <span>{log}</span>
            </MotionDiv>
          ))}
        </div>
        <MotionDiv 
          className="mt-4 h-1 bg-void-border w-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <MotionDiv 
            className="h-full bg-tech-green"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
        </MotionDiv>
      </div>
    </MotionDiv>
  );
};

export default BootSequence;