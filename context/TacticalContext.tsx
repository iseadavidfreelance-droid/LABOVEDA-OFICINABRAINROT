
import React, { createContext, useContext, useState } from 'react';

interface TacticalContextType {
  activeSku: string | null;
  openTacticalSheet: (sku: string) => void;
  closeTacticalSheet: () => void;
}

const TacticalContext = createContext<TacticalContextType | undefined>(undefined);

export const TacticalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSku, setActiveSku] = useState<string | null>(null);

  const openTacticalSheet = (sku: string) => {
    setActiveSku(sku);
  };

  const closeTacticalSheet = () => {
    setActiveSku(null);
  };

  return (
    <TacticalContext.Provider value={{ activeSku, openTacticalSheet, closeTacticalSheet }}>
      {children}
    </TacticalContext.Provider>
  );
};

export const useTactical = () => {
  const context = useContext(TacticalContext);
  if (!context) {
    throw new Error('useTactical must be used within a TacticalProvider');
  }
  return context;
};
