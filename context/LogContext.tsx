
import React, { createContext, useContext, useState, useCallback } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (message: string, type?: LogEntry['type']) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const newLog: LogEntry = { id, timestamp, message, type };

    setLogs((prev) => [newLog, ...prev].slice(0, 20)); // Keep max 20 logs in DOM

    // Auto fade-out logic (Remove from state after 5s)
    setTimeout(() => {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }, 5000);
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLog = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
};
