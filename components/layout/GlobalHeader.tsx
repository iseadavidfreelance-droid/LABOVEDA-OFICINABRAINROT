import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSystemPulse } from '../../context/SystemPulseContext'; 
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
  Zap,
  CheckCircle2, 
  AlertTriangle, 
  Server
} from 'lucide-react';
import { cn } from '../../lib/utils';

const STATUS_COLORS = {
  OPTIMAL: 'text-tech-green drop-shadow-[0_0_8px_rgba(0,255,65,0.4)]',
  WORKING: 'text-rank-legendary drop-shadow-[0_0_8px_rgba(255,215,0,0.4)] animate-pulse',
  LAGGING: 'text-orange-500',
  CRITICAL: 'text-red-500',
  IDLE: 'text-gray-500'
};

const PULSE_TO_UI_STATUS: Record<string, keyof typeof STATUS_COLORS> = {
    'PROCESSING': 'WORKING',
    'COMPLETED': 'OPTIMAL',
    'WARNING': 'LAGGING',
    'FAILED': 'CRITICAL',
    'IDLE': 'IDLE'
};

export const GlobalHeader: React.FC = () => {
  
  const { status: realStatus, itemsProcessed } = useSystemPulse();

  const [telemetry, setTelemetry] = useState({
    assetCount: 0, nodeCount: 0, totalImpressions: 0, totalClicks: 0, ctr: 0, totalRevenue: 0,
    rareCount: 0, legendaryCount: 0, hemorrhageCount: 0, ghostCount: 0
  });

  useEffect(() => {
    let mounted = true;
    const fetchTacticalData = async () => {
      try {
        const [assetsRes, nodesTotalRes, nodesStatsRes, ghostsRes] = await Promise.all([
          supabase.from('business_assets').select('rarity_tier, revenue_score, traffic_score, payhip_link'),
          supabase.from('pinterest_nodes').select('*', { count: 'exact', head: true }),
          supabase.from('pinterest_nodes').select('cached_impressions, cached_pin_clicks, cached_outbound_clicks'),
          supabase.from('pinterest_nodes').select('*', { count: 'exact', head: true }).is('asset_sku', null)
        ]);

        if (!mounted) return;
        
        const assets = assetsRes.data || [];
        const nodesStats = nodesStatsRes.data || [];
        const totalNodes = nodesTotalRes.count || 0;

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

  const visualStatus = PULSE_TO_UI_STATUS[realStatus] || 'IDLE';
  const totalNodesBase = telemetry.nodeCount || 1; 
  
  // CORRECCIÓN "0 INCERTIDUMBRE":
  // Eliminado el "If COMPLETED -> 100".
  // Ahora muestra estrictamente la relación matemática. 
  // Si el ciclo termina incompleto, el % lo reflejará (ej. 98%).
  const rawPercentage = (itemsProcessed / totalNodesBase) * 100;
  const progressPercent = Math.min(rawPercentage, 100); 

  const StatusIcon = visualStatus === 'OPTIMAL' ? CheckCircle2 :
                     visualStatus === 'WORKING' ? Activity :
                     visualStatus === 'CRITICAL' ? AlertTriangle : Server;

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(n);
  const fmtMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const fmtDec = (n: number) => n.toFixed(1);

  return (
    <header className="h-14 w-full bg-void-black/95 backdrop-blur-md border-b border-void-border flex items-center justify-between px-0 sticky top-0 z-40 shadow-2xl overflow-hidden text-xs">
      
      {/* MONITOR DE CICLO: VISUALIZACIÓN DE LA VERDAD */}
      <div className="flex items-center gap-4 px-4 h-full border-r border-void-border/50 bg-void-black/50 shrink-0 min-w-[160px]">
        
        {/* INDICADOR MATEMÁTICO (ANILLO) */}
        <div className="relative w-9 h-9 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" stroke="#1f1f1f" strokeWidth="3" fill="transparent" />
                <circle cx="18" cy="18" r="16" 
                        stroke={visualStatus === 'OPTIMAL' ? "#00FF41" : visualStatus === 'WORKING' ? "#FFD700" : "#555"} 
                        strokeWidth="3" fill="transparent" 
                        strokeDasharray={100} 
                        strokeDashoffset={100 - progressPercent} 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out" />
            </svg>
            <span className={cn("absolute text-[9px] font-mono font-bold", STATUS_COLORS[visualStatus])}>
                {Math.round(progressPercent)}%
            </span>
        </div>
        
        {/* DATOS DE COBERTURA */}
        <div className="flex flex-col justify-center h-full space-y-0.5">
            <div className="flex items-center gap-1.5">
                <StatusIcon className={cn("w-3 h-3", STATUS_COLORS[visualStatus])} />
                <span className={cn("text-[10px] font-mono font-bold tracking-wider uppercase", STATUS_COLORS[visualStatus])}>
                    {realStatus || 'OFFLINE'}
                </span>
            </div>
            
            <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-gray-400">
                   <span className="text-white font-bold">{itemsProcessed}</span>
                   <span className="text-gray-600 mx-0.5">/</span>
                   {telemetry.nodeCount}
                </span>
                <span className="text-[8px] font-mono text-gray-600 uppercase tracking-wide ml-1">NODES</span>
            </div>
        </div>
      </div>

      {/* TELEMETRÍA DE NEGOCIO */}
      <div className="flex-1 flex items-center justify-center px-2 h-full overflow-hidden">
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

const Divider = () => <div className="h-5 w-px bg-void-border/60 mx-1" />;

const StatItem = ({ icon: Icon, value, label, color = "text-gray-400", glow = false, alert = false }: any) => (
  <div className="flex items-center gap-2">
    <Icon className={cn(
        "w-3.5 h-3.5 transition-colors duration-300", 
        color, 
        glow && "animate-pulse",
        alert && "text-red-500"
    )} />
    <div className="flex flex-col leading-none">
       <span className={cn(
           "font-mono font-bold text-xs md:text-sm leading-none", 
           alert ? "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "text-gray-200", 
           color !== "text-gray-400" && !alert && color, 
           glow && "drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]"
       )}>
          {value}
       </span>
       <span className={cn(
           "text-[8px] font-mono uppercase tracking-wider mt-[2px]",
           alert ? "text-red-400" : "text-gray-600"
       )}>
           {label}
       </span>
    </div>
  </div>
);