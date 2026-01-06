
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLog, LogEntry } from '../../context/LogContext';
import { cn } from '../../lib/utils';

const KillLog: React.FC = () => {
  const { logs } = useLog();
  const MotionDiv = motion.div as any;
  const MotionLi = motion.li as any;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 pointer-events-none font-mono text-[10px] md:text-xs">
      <ul className="flex flex-col-reverse items-start gap-1">
        <AnimatePresence>
          {logs.map((log) => (
            <MotionLi
              key={log.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: -10 }} // Simple fade out
              transition={{ duration: 0.2 }}
              className={cn(
                "px-2 py-1 bg-black/80 backdrop-blur-sm border-l-2 shadow-sm flex items-center gap-2 max-w-full break-words",
                log.type === 'success' ? "border-tech-green text-tech-green" :
                log.type === 'error' ? "border-red-500 text-red-500" :
                log.type === 'warning' ? "border-yellow-500 text-yellow-500" :
                "border-gray-500 text-gray-400"
              )}
            >
              <span className="opacity-50 select-none">[{log.timestamp}]</span>
              <span className="font-bold">{log.message}</span>
            </MotionLi>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default KillLog;
