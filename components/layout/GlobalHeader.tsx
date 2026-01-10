import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Database,     
  Layers,       
  Eye,          
  MousePointer2, 
  Percent,       
  DollarSign,   
  Gem,          
  AlertOctagon, 
  Ghost,        
  Sparkles,     
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

const STATUS_COLORS = {
  OPTIMAL: 'text-tech-green drop-shadow-[0_0_8px_rgba(0,255,65,0.4)]',
  WORKING: 'text-rank-legendary drop-shadow-[0_0_8px_rgba(255,215,0,0.4)] animate-pulse',
  LAGGING: 'text-orange-500',
  CRITICAL: 'text-red-500'
};

export const GlobalHeader: React.FC = () => {
  
  const [telemetry, setTelemetry] = useState({
    assetCount: 0, nodeCount: 0, totalImpressions: 0, totalClicks: 0, ctr: 0, totalRevenue: 0,
    rareCount: 0, legendaryCount: 0, hemorrhageCount: 0, ghostCount: 0,
    minerProgress: 0, minerStatus: 'WORKING' as keyof typeof STATUS_COLORS, nodesFresh: 0
  });

  useEffect(() => {
    let mounted = true;
    const fetchTacticalData = async () => {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const [assetsRes, nodesTotalRes, nodesFreshRes, nodesStatsRes, ghostsRes] = await Promise.all([
          supabase.from('business_assets').select('rarity_tier, revenue_score, traffic_score, payhip_link'),
          supabase.from('pinterest_nodes').select('*', { count: 'exact', head: true }),
          supabase.from('pinterest_nodes').select('*', { count: 'exact', head: true }).gt('updated_at', oneHourAgo),
          supabase.from('pinterest_nodes').select('cached_impressions, cached_pin_clicks, cached_outbound_clicks'),
          supabase.from('pinterest_nodes').select('*', { count: 'exact', head: true }).is('asset_sku', null)
        ]);

        if (!mounted) return;
        
        const assets = assetsRes.data || [];
        const nodesStats = nodesStatsRes.data || [];
        const totalNodes = nodesTotalRes.count || 0;
        const freshNodes = nodesFreshRes.count || 0;
        const minerProgress = totalNodes > 0 ? (freshNodes / totalNodes) * 100 : 0;
        
        let minerStatus: keyof typeof STATUS_COLORS = 'WORKING';
        if (minerProgress > 95) minerStatus = 'OPTIMAL';
        else if (minerProgress < 5) minerStatus = 'CRITICAL';

        const totalImpressions = nodesStats.reduce((acc, curr) => acc + (Number(curr.cached_impressions) || 0), 0);
        const totalOutbound = nodesStats.reduce((acc, curr) => acc + (Number(curr.cached_outbound_clicks) || 0), 0);
        const ctr = totalImpressions > 0 ? (totalOutbound / totalImpressions) * 100 : 0;
        const totalRevenue = assets.reduce((acc, curr) => acc + (Number(curr.revenue_score) || 0), 0);

        setTelemetry({
          assetCount: assets.length,
          nodeCount: totalNodes,
          totalImpressions,
          totalClicks: totalOutbound,
          ctr,
          totalRevenue,
          minerProgress,
          minerStatus,
          nodesFresh: freshNodes,
          hemorrhageCount: assets.filter(a => (a.traffic_score || 0) > 0 && !a.payhip_link).length,
          ghostCount: ghostsRes.count || 0,
          rareCount: assets.filter(a => a.rarity_tier === 'RARE').length,
          legendaryCount: assets.filter(a => a.rarity_tier === 'LEGENDARY').length
        });
      } catch (err) { console.error("Header Error", err); }
    };
    fetchTacticalData();
    const interval = setInterval(fetchTacticalData, 30000); 
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(n);
  const fmtMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const fmtDec = (n: number) => n.toFixed(1);

  return (
    <header className="h-14 w-full bg-void-black/95 backdrop-blur-md border-b border-void-border flex items-center justify-between px-0 sticky top-0 z-40 shadow-2xl overflow-hidden text-xs">
      
      {/* BARRA DE PROGRESO SUPERIOR */}
      <div 
        className={cn("absolute top-0 left-0 h-[2px] transition-all duration-1000 shadow-[0_0_10px_currentColor]", 
          telemetry.minerStatus === 'OPTIMAL' ? "bg-tech-green text-tech-green" : "bg-rank-legendary text-rank-legendary"
        )}
        style={{ width: `${telemetry.minerProgress}%` }} 
      />

      {/* =====================================================================================
          SECCIÓN 1: MINER CYCLE (IZQUIERDA) - COMPACTADO
         ===================================================================================== */}
      <div className="flex items-center gap-3 px-4 h-full border-r border-void-border/50 bg-void-black shrink-0">
        <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="16" cy="16" r="14" stroke="#1f1f1f" strokeWidth="2" fill="transparent" />
                <circle cx="16" cy="16" r="14" 
                        stroke={telemetry.minerStatus === 'OPTIMAL' ? "#00FF41" : "#FFD700"} 
                        strokeWidth="2" fill="transparent" 
                        strokeDasharray={88} 
                        strokeDashoffset={88 - (88 * telemetry.minerProgress) / 100} 
                        className="transition-all duration-1000" />
            </svg>
            <span className="absolute text-[8px] font-mono font-bold text-white">{Math.round(telemetry.minerProgress)}%</span>
        </div>
        <div className="flex flex-col justify-center leading-none">
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-0.5">CYCLE</span>
            <div className="flex items-center gap-1.5">
                {telemetry.minerStatus === 'OPTIMAL' ? <Zap className="w-3 h-3 text-tech-green" /> : <Activity className="w-3 h-3 text-rank-legendary animate-pulse" />}
                <span className={cn("text-[10px] font-mono font-bold tracking-wider", STATUS_COLORS[telemetry.minerStatus])}>
                    {telemetry.minerStatus}
                </span>
            </div>
        </div>
      </div>

      {/* =====================================================================================
          SECCIÓN 2: UNIFIED STRIP (CENTRO) - ULTRA COMPACTO
         ===================================================================================== */}
      <div className="flex-1 flex items-center justify-center px-2 h-full overflow-hidden">
        {/* Cambiado gap-10 por gap-4/gap-6 y justificación */}
        <div className="flex items-center justify-around w-full max-w-5xl">
          
          <StatItem icon={Database} value={fmt(telemetry.assetCount)} label="SILOS" />
          <StatItem icon={Layers} value={fmt(telemetry.nodeCount)} label="NODES" />

          <Divider />

          <StatItem icon={Eye} value={fmt(telemetry.totalImpressions)} label="VIEWS" color="text-rank-uncommon" />
          <StatItem icon={MousePointer2} value={fmt(telemetry.totalClicks)} label="CLICKS" color="text-white" />

          <Divider />

          <StatItem icon={Percent} value={`${fmtDec(telemetry.ctr)}%`} label="CTR" color={telemetry.ctr > 2 ? "text-tech-green" : "text-gray-400"} />
          <StatItem icon={DollarSign} value={fmtMoney(telemetry.totalRevenue)} label="REVENUE" color="text-rank-legendary" glow />

          <Divider />

          <StatItem icon={AlertOctagon} value={telemetry.hemorrhageCount} label="HEMORR." color={telemetry.hemorrhageCount > 0 ? "text-red-500 animate-pulse" : "text-gray-500"} alert={telemetry.hemorrhageCount > 0} />
          <StatItem icon={Ghost} value={telemetry.ghostCount} label="GHOSTS" color={telemetry.ghostCount > 0 ? "text-orange-400" : "text-gray-500"} alert={telemetry.ghostCount > 0} />

          <Divider />

          <StatItem icon={Gem} value={telemetry.legendaryCount} label="LEGND." color="text-rank-legendary" />
          <StatItem icon={Sparkles} value={telemetry.rareCount} label="RARE" color="text-rank-uncommon" />

        </div>
      </div>

    </header>
  );
};

// --- COMPONENTES ATÓMICOS DE ALTA DENSIDAD ---

const Divider = () => <div className="h-5 w-px bg-void-border/60 mx-1" />;

const StatItem = ({ icon: Icon, value, label, color = "text-gray-400", glow = false, alert = false }: any) => (
  // Reducido gap-2.5 a gap-2 para pegar más el icono al texto
  <div className="flex items-center gap-2">
    <Icon className={cn(
        "w-3.5 h-3.5 transition-colors duration-300", 
        color, 
        glow && "animate-pulse",
        alert && "text-red-500"
    )} />
    <div className="flex flex-col leading-none">
       {/* Ajuste de leading-none y sizes para que no haya aire vertical */}
       <span className={cn(
           "font-mono font-bold text-xs md:text-sm leading-none", 
           alert ? "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "text-gray-200", 
           color !== "text-gray-400" && !alert && color, 
           glow && "drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]"
       )}>
          {value}
       </span>
       {/* Margin top reducido a 0.5 (2px) */}
       <span className={cn(
           "text-[8px] font-mono uppercase tracking-wider mt-[2px]",
           alert ? "text-red-400" : "text-gray-600"
       )}>
           {label}
       </span>
    </div>
  </div>
);