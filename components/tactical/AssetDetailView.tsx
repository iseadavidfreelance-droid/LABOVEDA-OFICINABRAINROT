import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Database as DbIcon, Image as ImageIcon, BarChart3, Heart, MousePointer, Eye, X, Activity, ScanLine, Share2, Calendar, Copy } from 'lucide-react';
import { BusinessAsset, PinterestNode } from '../../types/database';
import { tacticalService } from '../../lib/supabase';
import TechButton from '../ui/TechButton';
import RarityBadge from '../ui/RarityBadge'; 
import { cn } from '../../lib/utils';

interface AssetDetailViewProps {
  asset: BusinessAsset;
  onBack: () => void;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({ asset, onBack }) => {
  const [nodes, setNodes] = useState<PinterestNode[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drill-down State: Pin seleccionado
  const [selectedNode, setSelectedNode] = useState<PinterestNode | null>(null);

  useEffect(() => {
    const loadNodes = async () => {
      setLoading(true);
      try {
        const realNodes = await tacticalService.getNodesByAsset(asset.sku);
        setNodes(realNodes || []);
      } catch (e) {
        console.error("Node fetch error", e);
        setNodes([]);
      } finally {
        setLoading(false);
      }
    };
    loadNodes();
  }, [asset.sku]);

  // Cálculos en vivo (Frontend Aggregation)
  const stats = {
    totalImpressions: nodes.reduce((acc, node) => acc + (node.impressions || 0), 0),
    totalClicks: nodes.reduce((acc, node) => acc + (node.outbound_clicks || 0), 0),
    totalSaves: nodes.reduce((acc, node) => acc + (node.saves || 0), 0),
    nodeCount: nodes.length
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-10 duration-200 relative">
      
      {/* 1. HEADER TÁCTICO */}
      <div className="flex items-start justify-between border-b border-void-border pb-6 mb-6">
        <div className="flex gap-4">
            <button onClick={onBack} className="mt-1 p-2 hover:bg-void-gray text-gray-400 hover:text-white transition-colors h-fit rounded-sm border border-transparent hover:border-void-border">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white tracking-wider">{asset.name}</h3>
                    <RarityBadge tier={asset.tier} />
                </div>
                <div className="font-mono text-xs text-gray-500 flex gap-4">
                    <span>SKU: <span className="text-gray-300">{asset.sku}</span></span>
                    <span>MATRIX: <span className="text-tech-green font-bold">
                        {asset.matrix_name || asset.matrix_id}
                    </span></span>
                    <span>STATUS: <span className="text-white">{asset.status || 'ACTIVE'}</span></span>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <TechButton variant="ghost" label="DRIVE" icon={DbIcon} onClick={() => window.open(asset.description || asset.drive_link || '', '_blank')} disabled={!asset.drive_link} />
            <TechButton variant="ghost" label="PAYHIP" icon={ExternalLink} onClick={() => window.open(asset.monetization_link || '', '_blank')} disabled={!asset.monetization_link} />
        </div>
      </div>

      {/* 2. DASHBOARD DE INTELIGENCIA (KPIs) */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="SCORE SISTEMA" value={asset.score} icon={BarChart3} color="text-tech-green" />
        <StatCard label="IMPRESIONES (RED)" value={stats.totalImpressions} icon={Eye} color="text-purple-400" />
        <StatCard label="CLICKS (TRÁFICO)" value={stats.totalClicks} icon={MousePointer} color="text-[#00f0ff]" />
        <StatCard label="INGRESOS (EST)" value={`$${(asset as any).revenue_score || '0.00'}`} icon={Activity} color="text-yellow-400" />
      </div>

      {/* 3. GRID DE NODOS (PINTEREST) */}
      <div className="flex-1 bg-void-gray/5 border border-void-border p-4 overflow-hidden flex flex-col relative group/grid">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />

        <div className="flex justify-between items-center mb-4 relative z-10">
            <h4 className="text-sm font-mono text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                <ImageIcon className="w-4 h-4 text-tech-green" /> Red de Nodos Pinterest ({stats.nodeCount})
            </h4>
            <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
               <ScanLine className="w-3 h-3" /> CLICK PARA INSPECCIONAR
            </span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-2">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-2 border-tech-green border-t-transparent rounded-full animate-spin" />
                    <div className="font-mono text-tech-green animate-pulse text-xs">SCANNING NODE NETWORK...</div>
                </div>
            ) : nodes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-gray-800 rounded bg-void-black/50 p-8 text-center">
                    <p className="text-gray-500 font-mono mb-2">GHOST ASSET DETECTED</p>
                    <p className="text-xs text-gray-600 max-w-xs">Este activo existe en la base de datos pero no tiene pines asignados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {nodes.map((node) => (
                        <div 
                            key={node.id || node.pin_id} 
                            onClick={() => setSelectedNode(node)}
                            className={cn(
                                "relative group aspect-[2/3] bg-gray-900 border border-gray-800 cursor-pointer transition-all overflow-hidden",
                                selectedNode?.pin_id === node.pin_id ? "border-tech-green ring-1 ring-tech-green opacity-50 grayscale" : "hover:border-tech-green hover:scale-[1.02]"
                            )}
                        >
                            <img src={node.image_url || ''} alt="Pin" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                            {selectedNode?.pin_id === node.pin_id && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className="bg-tech-green text-black text-[10px] font-bold px-2 py-1 font-mono">EN ANÁLISIS</div>
                                </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-black/90 p-2 border-t border-gray-800 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                                    <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> {formatNumber(node.impressions)}</span>
                                    <span className="flex items-center gap-1 text-white"><MousePointer className="w-3 h-3"/> {node.outbound_clicks}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* 4. SIDE PANEL OPTIMIZADO: "VERTICAL FIRST" */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex justify-end">
            
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-300"
                onClick={() => setSelectedNode(null)}
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-[450px] h-full bg-[#0c0c0c] border-l border-void-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                
                {/* A. HEADER MINIMALISTA DE CONTROL */}
                <div className="flex items-center justify-between p-4 border-b border-void-border bg-black">
                     <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-tech-green animate-pulse" />
                         <span className="text-[10px] font-mono text-tech-green tracking-widest uppercase">Node Telemetry System</span>
                     </div>
                     <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
                     >
                        <X className="w-5 h-5" />
                     </button>
                </div>

                {/* B. CUERPO SCROLLABLE */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    
                    {/* 1. VISOR DE IMAGEN (Full Width / Vertical Friendly) */}
                    <div className="w-full bg-black relative border-b border-void-border group">
                        {/* El aspect-ratio auto permite que la imagen defina su altura, hasta un límite visual */}
                        <div className="w-full flex justify-center bg-[url('/grid-pattern.svg')] py-4">
                            <img 
                                src={selectedNode.image_url} 
                                className="max-w-full max-h-[50vh] object-contain shadow-2xl border border-gray-800"
                                alt="Node Asset"
                            />
                        </div>
                        {/* Overlay ID */}
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 border border-gray-800 text-[9px] font-mono text-gray-500">
                            ID: {selectedNode.pin_id}
                        </div>
                    </div>

                    {/* 2. CABECERA DE DATOS (Título Completo) */}
                    <div className="p-6 pb-2">
                        <h3 className="text-xl font-bold text-white leading-snug break-words mb-2">
                            {selectedNode.title || 'SIN TÍTULO ASIGNADO'}
                        </h3>
                         {/* 3. FECHA Y METADATA */}
                         <div className="flex gap-4 text-[10px] font-mono text-gray-500 mb-6">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(selectedNode.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1 text-tech-green"><Activity className="w-3 h-3" /> SYNC_OK</span>
                        </div>

                        {/* 4. MATRIZ DE MÉTRICAS (Compacta) */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <SidePanelMetric label="IMPRESIONES" value={selectedNode.impressions} icon={Eye} />
                            <SidePanelMetric label="TRÁFICO (CLICKS)" value={selectedNode.outbound_clicks} icon={MousePointer} highlight />
                            <SidePanelMetric label="GUARDADOS" value={selectedNode.saves} icon={Heart} />
                            <SidePanelMetric label="TASA CLICK (CTR)" value={`${((selectedNode.outbound_clicks / (selectedNode.impressions || 1)) * 100).toFixed(1)}%`} icon={BarChart3} />
                        </div>

                        {/* 5. TARGET LINK (Accionable) */}
                        <div className="space-y-2 mb-6">
                            <label className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-2">
                                <Share2 className="w-3 h-3" /> Vector de Destino (Target URL)
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-void-gray/10 border border-void-border p-2.5 rounded-sm text-xs font-mono text-gray-300 truncate select-all">
                                    {selectedNode.url || 'N/A'}
                                </div>
                                <button 
                                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-sm transition-colors"
                                    onClick={() => {
                                        if(selectedNode.url) navigator.clipboard.writeText(selectedNode.url);
                                    }}
                                    title="Copiar Link"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* C. FOOTER DE ACCIÓN (Fixed Bottom) */}
                <div className="p-4 border-t border-void-border bg-[#0a0a0a] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <TechButton 
                        variant="primary" 
                        label="ABRIR EN PINTEREST" 
                        fullWidth
                        icon={ExternalLink} 
                        onClick={() => window.open(`https://pinterest.com/pin/${selectedNode.pin_id}`, '_blank')} 
                    />
                </div>

            </div>
        </div>
      )}
    </div>
  );
};

// Componentes Auxiliares
const formatNumber = (num: number) => {
    if(num >= 1000) return (num/1000).toFixed(1) + 'k';
    return num;
}

const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-void-gray/10 border border-void-border p-4 flex flex-col gap-2 hover:bg-void-gray/20 transition-colors group">
        <div className="flex items-center justify-between text-gray-500 group-hover:text-gray-400">
            <span className="text-[10px] font-mono tracking-wider">{label}</span>
            <Icon className={`w-4 h-4 ${color} opacity-70 group-hover:opacity-100 transition-opacity`} />
        </div>
        <div className="text-2xl font-bold text-white font-mono group-hover:scale-105 transition-transform origin-left">
            {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
    </div>
);

const SidePanelMetric = ({ label, value, icon: Icon, highlight }: any) => (
    <div className={cn(
        "p-3 border rounded-sm flex flex-col justify-between h-20 transition-colors",
        highlight 
            ? "bg-tech-green/5 border-tech-green/30" 
            : "bg-void-gray/5 border-void-border hover:border-gray-700"
    )}>
        <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-tight">{label}</span>
            <Icon className={cn("w-3.5 h-3.5", highlight ? "text-tech-green" : "text-gray-600")} />
        </div>
        <div className={cn(
            "text-xl font-bold font-mono tracking-tight",
            highlight ? "text-tech-green" : "text-white"
        )}>
             {value}
        </div>
    </div>
);