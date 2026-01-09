import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Database as DbIcon, Image as ImageIcon, BarChart3, Heart, MousePointer, Eye, X, Activity } from 'lucide-react';
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
            <button onClick={onBack} className="mt-1 p-2 hover:bg-void-gray text-gray-400 hover:text-white transition-colors h-fit">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white tracking-wider">{asset.name}</h3>
                    <RarityBadge tier={asset.tier} />
                </div>
                <div className="font-mono text-xs text-gray-500 flex gap-4">
    <span>SKU: <span className="text-gray-300">{asset.sku}</span></span>
    
    {/* ✅ ACTUALIZACIÓN QUIRÚRGICA: Mostramos matrix_name si existe, fallback a matrix_id */}
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
        {/* Usamos revenue_score si existe, si no mostramos N/A */}
        <StatCard label="INGRESOS (EST)" value={`$${(asset as any).revenue_score || '0.00'}`} icon={Activity} color="text-yellow-400" />
      </div>

      {/* 3. GRID DE NODOS (PINTEREST) */}
      <div className="flex-1 bg-void-gray/5 border border-void-border p-4 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-mono text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                <ImageIcon className="w-4 h-4 text-tech-green" /> Red de Nodos Pinterest ({stats.nodeCount})
            </h4>
            <span className="text-[10px] text-gray-600 font-mono">CLICK PARA ANÁLISIS INDIVIDUAL</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="text-center py-20 font-mono text-tech-green animate-pulse">SCANNING NODE NETWORK...</div>
            ) : nodes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-gray-800 rounded bg-void-black/50">
                    <p className="text-gray-500 font-mono mb-2">GHOST ASSET DETECTED</p>
                    <p className="text-xs text-gray-600 max-w-xs text-center">Este activo existe en la base de datos pero no tiene pines asignados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {nodes.map((node) => (
                        <div 
                            key={node.id || node.pin_id} 
                            onClick={() => setSelectedNode(node)}
                            className="relative group aspect-[2/3] bg-gray-900 border border-gray-800 hover:border-tech-green cursor-pointer transition-all hover:scale-[1.02] overflow-hidden"
                        >
                            <img src={node.image_url || ''} alt="Pin" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            {/* Overlay informativo rápido */}
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

      {/* 4. MODAL DETALLE DE NODO (DRILL-DOWN) */}
      {selectedNode && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-void-border w-full max-w-4xl h-[600px] flex shadow-2xl shadow-tech-green/10 relative">
                <button 
                    onClick={() => setSelectedNode(null)} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-white z-10 p-2 hover:bg-gray-900 rounded-full"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Columna Izquierda: Imagen */}
                <div className="w-1/3 bg-black border-r border-void-border p-4 flex items-center justify-center relative">
                    <div className="absolute top-4 left-4 font-mono text-[10px] bg-tech-green text-black px-2 py-1 font-bold">PIN ACTIVO</div>
                    <img src={selectedNode.image_url} className="max-h-full max-w-full object-contain border border-gray-800 shadow-lg" />
                </div>

                {/* Columna Derecha: Data */}
                <div className="w-2/3 p-8 overflow-y-auto custom-scrollbar">
                    <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-tech-green" /> TELEMETRÍA DE NODO
                    </h3>
                    <p className="font-mono text-xs text-gray-500 mb-6 border-b border-gray-800 pb-4">
                        ID: <span className="text-gray-300">{selectedNode.pin_id}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <DetailRow label="IMPRESIONES TOTALES" value={selectedNode.impressions} icon={Eye} />
                        <DetailRow label="CLICKS SALIENTES" value={selectedNode.outbound_clicks} icon={MousePointer} highlight />
                        <DetailRow label="GUARDADOS (SAVES)" value={selectedNode.saves} icon={Heart} />
                        <DetailRow label="FECHA CREACIÓN" value={new Date(selectedNode.created_at).toLocaleDateString()} icon={Database} />
                    </div>

                    <div className="space-y-4 bg-void-gray/10 p-4 border border-void-border mb-6">
                        <div>
                            <label className="text-[10px] text-gray-500 font-mono uppercase">URL de Destino (Target)</label>
                            <div className="text-xs text-tech-green font-mono truncate mt-1">
                                {selectedNode.url || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <TechButton 
                            variant="primary" 
                            label="ABRIR EN PINTEREST" 
                            icon={ExternalLink} 
                            onClick={() => window.open(`https://pinterest.com/pin/${selectedNode.pin_id}`, '_blank')} 
                        />
                    </div>
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
    <div className="bg-void-gray/10 border border-void-border p-4 flex flex-col gap-2 hover:bg-void-gray/20 transition-colors">
        <div className="flex items-center justify-between text-gray-500">
            <span className="text-[10px] font-mono tracking-wider">{label}</span>
            <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="text-2xl font-bold text-white font-mono">
            {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
    </div>
);

const DetailRow = ({ label, value, icon: Icon, highlight }: any) => (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-900 flex items-center justify-center border border-gray-800">
            <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div>
            <div className="text-[10px] text-gray-500 font-mono uppercase">{label}</div>
            <div className={cn("text-lg font-bold font-mono", highlight ? "text-tech-green" : "text-white")}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
        </div>
    </div>
);