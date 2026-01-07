import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Activity, 
  Database, 
  DollarSign, 
  BarChart3, 
  Layers,
  Terminal,
  Cpu
} from 'lucide-react';

// Estética Cyberpunk/Militar definida en tus variables globales
const STATUS_STYLES = {
  PROCESSING: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse',
  COMPLETED: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]',
  FAILED: 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]',
  OFFLINE: 'text-zinc-600'
};

const GlobalHeader = () => {
  const [stats, setStats] = useState({
    pinCount: 0,
    assetCount: 0,
    totalRevenue: 0,
    totalTraffic: 0,
    ingestionStatus: 'OFFLINE',
    processedItems: 0,
    loading: true
  });

  useEffect(() => {
    const fetchHardData = async () => {
      try {
        // 1. CONTEO DE PINES (Head count para velocidad)
        const { count: pinCount } = await supabase
          .from('pinterest_nodes')
          .select('*', { count: 'exact', head: true });

        // 2. ACTIVOS Y FINANZAS
        const { data: assets, count: assetCount } = await supabase
          .from('business_assets')
          .select('revenue_score, traffic_score', { count: 'exact' });

        // 3. ESTADO DEL ROBOT (CORRECCIÓN TÉCNICA AQUÍ)
        // Usamos 'cycle_id' para ordenar porque 'created_at' daba error 400
        const { data: cycle } = await supabase
          .from('ingestion_cycles')
          .select('status, items_processed') 
          .order('cycle_id', { ascending: false }) // 👈 CAMBIO CRÍTICO
          .limit(1)
          .single();

        // CÁLCULOS
        const totalRevenue = assets?.reduce((sum, item) => sum + (Number(item.revenue_score) || 0), 0) || 0;
        const totalTraffic = assets?.reduce((sum, item) => sum + (Number(item.traffic_score) || 0), 0) || 0;

        setStats({
          pinCount: pinCount || 0,
          assetCount: assetCount || 0,
          totalRevenue,
          totalTraffic,
          ingestionStatus: cycle?.status || 'UNKNOWN',
          processedItems: cycle?.items_processed || 0,
          loading: false
        });

      } catch (err) {
        console.error("GlobalHeader Telemetry Error:", err);
      }
    };

    fetchHardData();
    
    // Suscripción Realtime
    const channel = supabase.channel('global_telemetry')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingestion_cycles' }, () => fetchHardData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fmtNum = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const fmtMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <header className="h-16 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 z-50 sticky top-0">
      
      {/* SECCIÓN 1: IDENTIDAD TÁCTICA */}
      <div className="flex items-center gap-4 w-64">
        <div className="p-2 bg-emerald-500/10 rounded-sm border border-emerald-500/20">
          <Terminal className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex flex-col justify-center h-full">
          <h1 className="font-mono font-bold text-lg text-emerald-100 leading-none tracking-widest">
            LABOVEDA
          </h1>
          <span className="text-[9px] font-mono text-emerald-500/50 uppercase tracking-[0.2em] mt-1">
            v0.1 Authority Node
          </span>
        </div>
      </div>

      {/* SECCIÓN 2: TELEMETRÍA CENTRAL (ESTILO HUD) */}
      <div className="hidden md:flex flex-1 justify-center items-center gap-12">
        <StatModule 
          icon={Layers} 
          label="TOTAL PINS" 
          value={fmtNum(stats.pinCount)} 
        />
        
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        
        <StatModule 
          icon={Database} 
          label="ASSETS" 
          value={fmtNum(stats.assetCount)} 
        />
        
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        
        <StatModule 
          icon={BarChart3} 
          label="TRAFFIC" 
          value={fmtNum(stats.totalTraffic)} 
        />
        
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        
        <StatModule 
          icon={DollarSign} 
          label="REVENUE" 
          value={fmtMoney(stats.totalRevenue)} 
          highlight 
        />
      </div>

      {/* SECCIÓN 3: SYSTEM STATUS (ESTILO CYBERPUNK) */}
      <div className="w-64 flex justify-end items-center">
        <div className="flex items-center gap-3 pl-6 border-l border-white/5">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">
              INGESTION CYCLE
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-400">
                [{stats.processedItems} RECS]
              </span>
              <span className={`font-mono text-xs font-bold ${STATUS_STYLES[stats.ingestionStatus as keyof typeof STATUS_STYLES] || STATUS_STYLES.OFFLINE}`}>
                {stats.ingestionStatus}
              </span>
            </div>
          </div>
          <Cpu className={`w-5 h-5 ${stats.ingestionStatus === 'PROCESSING' ? 'text-amber-400 animate-spin' : 'text-zinc-700'}`} />
        </div>
      </div>

    </header>
  );
};

// Subcomponente de estilo HUD
const StatModule = ({ icon: Icon, label, value, highlight = false }: any) => (
  <div className="flex items-center gap-3 group cursor-default">
    <Icon className={`w-4 h-4 transition-colors ${highlight ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
    <div className="flex flex-col">
      <span className="text-[9px] font-mono text-zinc-600 tracking-widest uppercase mb-0.5">{label}</span>
      <span className={`font-mono font-bold text-sm tracking-tight ${highlight ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]' : 'text-zinc-300'}`}>
        {value}
      </span>
    </div>
  </div>
);

export default GlobalHeader;