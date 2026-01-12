import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Activity, 
  AlertTriangle, 
  Server, 
  DollarSign, 
  Target, 
  Globe,
  RefreshCw 
} from 'lucide-react';

interface MatrixData {
  matrix_code: string;
  total_score: number;
  asset_count: number;
  total_revenue: number; // Lo mantendremos en 0 internamente
}

interface ThreatData {
  sku: string;
  asset_name: string;
  total_score: number;
}

export default function CentralCommand() {
  const [matrices, setMatrices] = useState<MatrixData[]>([]);
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Totales calculados
  const totalScore = matrices.reduce((acc, m) => acc + (m.total_score || 0), 0);
  const totalRevenue = matrices.reduce((acc, m) => acc + (m.total_revenue || 0), 0);
  const totalAssets = matrices.reduce((acc, m) => acc + (m.asset_count || 0), 0);

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        setLoading(true);
        setError(null);
        
        // 1. LEER MATRICES (CORREGIDO: Quitamos 'total_revenue' que no existe)
        const { data: matrixData, error: matrixError } = await supabase
          .from('matrix_registry')
          .select('matrix_code, total_score, asset_count') // <--- SOLO COLUMNAS EXISTENTES
          .order('total_score', { ascending: false });

        if (matrixError) throw matrixError;

        // 2. LEER AMENAZAS
        // Usamos try/catch interno para que si falla una tabla no rompa todo
        let cleanThreats: ThreatData[] = [];
        try {
            const { data: threatData, error: threatError } = await supabase
            .from('radar_monetization_ready')
            .select('sku, asset_name, current_score')
            .limit(10);

            if (!threatError && threatData) {
                cleanThreats = threatData.map((t: any) => ({
                    sku: t.sku,
                    asset_name: t.asset_name || t.sku,
                    total_score: t.current_score || 0
                }));
            }
        } catch (e) {
            console.warn("Radar Monetization no disponible, ignorando...");
        }

        // Mapeo seguro (Asignamos revenue = 0 porque la DB no lo tiene)
        const cleanMatrices = (matrixData || []).map((m: any) => ({
            matrix_code: m.matrix_code || 'UNKNOWN',
            total_score: m.total_score || 0,
            asset_count: m.asset_count || 0,
            total_revenue: 0 // <--- DATO NO DISPONIBLE EN DB ACTUAL
        }));

        setMatrices(cleanMatrices);
        setThreats(cleanThreats);

      } catch (err: any) {
        console.error("Fallo de Inteligencia:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchIntelligence();
  }, []);

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-black text-tech-green gap-4">
        <RefreshCw className="w-8 h-8 animate-spin"/>
        <span className="text-xs font-mono tracking-widest">ESTABLECIENDO ENLACE SATELITAL...</span>
    </div>
  );

  return (
    <div className="h-full w-full bg-black text-emerald-500 font-mono p-6 overflow-hidden flex flex-col animate-in fade-in duration-500">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center border-b border-emerald-900/50 pb-4 mb-6">
        <div>
            <h1 className="text-xl font-bold tracking-wider flex items-center gap-3 text-white">
            <Globe className="w-6 h-6 text-emerald-500" /> COMANDO CENTRAL
            </h1>
            <p className="text-[10px] text-emerald-600 mt-1">VISTA ESTRATÉGICA GLOBAL // NIVEL 0</p>
        </div>
        <div className="text-xs bg-emerald-900/20 px-3 py-1 rounded border border-emerald-900/50 text-emerald-400">
          {error ? <span className="text-red-500">ALERTA DE CONEXIÓN</span> : 'SISTEMA NOMINAL'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* COLUMNA 1: HEGEMONÍA (RANKING) */}
        <div className="lg:col-span-4 border border-emerald-900/30 bg-emerald-950/5 p-4 flex flex-col rounded-sm">
          <h3 className="text-xs font-bold text-emerald-700 uppercase mb-4 flex items-center gap-2">
            <Server className="w-3 h-3" /> Hegemonía de Matriz
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {matrices.length === 0 ? (
              <p className="text-xs opacity-50 italic py-4 text-center">Sin datos de matrices registrados.</p>
            ) : matrices.map((m) => (
              <div key={m.matrix_code} className="flex justify-between items-center text-xs p-3 border-b border-emerald-900/10 hover:bg-emerald-900/20 hover:pl-4 transition-all cursor-default group">
                <div className="flex flex-col">
                    <span className="font-bold text-white group-hover:text-emerald-400">{m.matrix_code}</span>
                    <span className="text-[9px] opacity-60">{m.asset_count} Activos</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-300">{m.total_score.toLocaleString()}</div>
                  {/* Revenue oculto o en cero porque no existe en DB */}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: SITUATION ROOM (KPIs) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* BIG NUMBERS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-900/10 border border-emerald-500/20 p-6 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20"><Target className="w-12 h-12"/></div>
                <div className="text-xs text-emerald-600 uppercase font-bold mb-2">Valor Total</div>
                <div className="text-3xl lg:text-4xl font-black text-white tracking-tighter relative z-10 group-hover:text-emerald-400 transition-colors">
                {totalScore.toLocaleString()}
                </div>
            </div>

            <div className="bg-emerald-900/10 border border-emerald-500/20 p-6 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20"><DollarSign className="w-12 h-12"/></div>
                <div className="text-xs text-emerald-600 uppercase font-bold mb-2">Ingresos (Est)</div>
                <div className="text-3xl lg:text-4xl font-black text-white tracking-tighter relative z-10 group-hover:text-emerald-400 transition-colors">
                ${totalRevenue.toLocaleString()}
                </div>
                <div className="text-[9px] text-emerald-800 mt-2">DATO NO DISPONIBLE</div>
            </div>
          </div>

          {/* ASSET STATUS */}
          <div className="flex-1 bg-black border border-emerald-900/30 p-6 flex flex-col justify-center items-center relative">
             <Activity className="w-16 h-16 text-emerald-900 mb-4 animate-pulse" />
             <div className="text-center space-y-1">
                 <div className="text-2xl font-bold text-white">{totalAssets}</div>
                 <div className="text-xs text-emerald-700 tracking-[0.2em] uppercase">Activos Desplegados</div>
             </div>
             
             <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-emerald-600"></div>
             <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-emerald-600"></div>
          </div>
        </div>

        {/* COLUMNA 3: RADAR DE AMENAZAS */}
        <div className="lg:col-span-3 border-l border-emerald-900/30 pl-6 flex flex-col">
          <h3 className="text-xs font-bold text-red-400 uppercase mb-4 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Fugas de Capital
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {threats.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-emerald-800 border border-dashed border-emerald-900/50 p-4 text-center">
                  <span className="text-xs">SIN ALERTAS ACTIVAS</span>
                  <span className="text-[9px] mt-1">El perímetro monetario es seguro o no hay datos.</span>
               </div>
            ) : threats.map((t, idx) => (
              <div key={idx} className="bg-red-950/10 border border-red-900/30 p-3 hover:border-red-500 transition-colors cursor-pointer group relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] bg-red-900/50 text-white px-1.5 py-0.5 rounded">CRÍTICO</span>
                        <span className="text-[9px] text-red-700 font-mono">{t.sku}</span>
                    </div>
                    <p className="text-xs text-red-200 font-bold truncate">{t.asset_name}</p>
                    <p className="text-[10px] text-red-400 mt-1">Pérdida potencial: {t.total_score} pts</p>
                </div>
                <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-emerald-900/30">
             <div className="text-[9px] text-emerald-800 font-mono text-center">
                SYNC_ID: {new Date().getTime().toString().slice(-6)}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}