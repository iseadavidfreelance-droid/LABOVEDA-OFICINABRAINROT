import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SystemPulse {
  isOnline: boolean;
  progress: number; // 0 a 100
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'WARNING' | 'FAILED';
  lastSync: Date | null;
  itemsProcessed: number;
}

const SystemPulseContext = createContext<SystemPulse>({
  isOnline: false,
  progress: 0,
  status: 'IDLE',
  lastSync: null,
  itemsProcessed: 0
});

export const SystemPulseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pulse, setPulse] = useState<SystemPulse>({
    isOnline: false,
    progress: 0,
    status: 'IDLE',
    lastSync: null,
    itemsProcessed: 0
  });

  // Función para calcular el progreso real basado en el ciclo activo
  const fetchHeartbeat = async () => {
    try {
      // 1. Buscamos el último ciclo activo
      const { data: cycle, error } = await supabase
        .from('ingestion_cycles')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !cycle) {
        setPulse(prev => ({ ...prev, isOnline: false, status: 'IDLE', progress: 0 }));
        return;
      }

      // 2. Calculamos el progreso estimado
      // Como no sabemos el "total" exacto de pines a priori en el ciclo, usamos una heurística
      // o comparamos contra el total de nodos si lo tenemos.
      // ESTRATEGIA VISUAL: Si está 'PROCESSING', calculamos basado en el tiempo o items.
      
      let calculatedProgress = 0;
      
      if (cycle.status === 'COMPLETED') {
        calculatedProgress = 100;
      } else if (cycle.status === 'PROCESSING') {
        // Truco visual: Mapeamos los items procesados a un % (ej. 50 items = 1 batch = 20% avance visual)
        // O simplemente hacemos un "latido" que sube y baja.
        // MEJOR OPCIÓN: Usar el conteo real de nodos vs procesados si es posible, 
        // pero para rapidez usaremos un incremento basado en `items_processed`.
        
        // Asumimos ciclos de 100 items aprox para visualización
        const estimatedTotal = 100; 
        calculatedProgress = Math.min(Math.round((cycle.items_processed / estimatedTotal) * 100), 95);
      }

      setPulse({
        isOnline: true,
        status: cycle.status,
        progress: calculatedProgress,
        lastSync: new Date(cycle.updated_at || cycle.started_at),
        itemsProcessed: cycle.items_processed
      });

    } catch (e) {
      console.error("Pulse Error", e);
    }
  };

  useEffect(() => {
    // Primera carga
    fetchHeartbeat();

    // Suscripción Realtime a la tabla ingestion_cycles
    const subscription = supabase
      .channel('system_pulse')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingestion_cycles' }, (payload) => {
          // Cuando hay cambios, recargamos el estado
          fetchHeartbeat();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SystemPulseContext.Provider value={pulse}>
      {children}
    </SystemPulseContext.Provider>
  );
};

export const useSystemPulse = () => useContext(SystemPulseContext);