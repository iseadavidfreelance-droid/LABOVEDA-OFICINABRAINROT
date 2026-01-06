
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MatrixRegistry } from '../types/database';
import { mockService } from '../lib/supabase';

interface MatrixContextType {
  matrices: MatrixRegistry[];
  selectedMatrix: MatrixRegistry | null; // null = ALL
  selectMatrix: (matrixId: string | null) => void;
  loading: boolean;
}

const MatrixContext = createContext<MatrixContextType | undefined>(undefined);

export const MatrixProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [matrices, setMatrices] = useState<MatrixRegistry[]>([]);
  const [selectedMatrix, setSelectedMatrix] = useState<MatrixRegistry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatrices = async () => {
      try {
        const data = await mockService.getMatrices();
        setMatrices(data);
      } catch (e) {
        console.error("Failed to load ontology", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMatrices();
  }, []);

  const selectMatrix = (matrixId: string | null) => {
    if (matrixId === null) {
        setSelectedMatrix(null);
    } else {
        const found = matrices.find(m => m.id === matrixId);
        if (found) setSelectedMatrix(found);
    }
  };

  return (
    <MatrixContext.Provider value={{ matrices, selectedMatrix, selectMatrix, loading }}>
      {children}
    </MatrixContext.Provider>
  );
};

export const useMatrix = () => {
  const context = useContext(MatrixContext);
  if (!context) {
    throw new Error('useMatrix must be used within a MatrixProvider');
  }
  return context;
};
