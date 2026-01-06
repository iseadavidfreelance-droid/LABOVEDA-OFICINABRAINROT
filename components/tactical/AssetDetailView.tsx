import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Database, Server, Image as ImageIcon } from 'lucide-react';
import { BusinessAsset, PinterestNode } from '../../types/database';
import { tacticalService } from '../../lib/supabase';
import TechButton from '../ui/TechButton';
import RarityBadge from '../ui/RarityBadge';

interface AssetDetailViewProps {
  asset: BusinessAsset;
  onBack: () => void;
}

const AssetDetailView: React.FC<AssetDetailViewProps> = ({ asset, onBack }) => {
  const [nodes, setNodes] = useState<PinterestNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNodes = async () => {
      setLoading(true);
      try {
        const realNodes = await tacticalService.getNodesByAsset(asset.sku);
        setNodes(realNodes);
      } catch (e) {
        console.error("Node fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    loadNodes();
  }, [asset.sku]);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-10 duration-200">
      {/* HEADER DE COMANDO DEL ASSET */}
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
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono text-gray-500">
                    <div>SKU: <span className="text-gray-300">{asset.sku}</span></div>
                    <div>MATRIX ID: <span className="text-gray-300">{asset.matrix_id}</span></div>
                    <div>SCORE: <span className="text-tech-green">{asset.score}</span></div>
                    <div>STATUS: <span className="text-white">{asset.status}</span></div>
                </div>
            </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
                <TechButton variant="ghost" label="DRIVE" icon={Database} onClick={() => window.open(asset.drive_link || '', '_blank')} disabled={!asset.drive_link} />
                <TechButton variant="ghost" label="PAYHIP" icon={ExternalLink} onClick={() => window.open(asset.monetization_link || '', '_blank')} disabled={!asset.monetization_link} />
            </div>
            {(!asset.drive_link || !asset.monetization_link) && (
                <div className="text-[10px] text-red-500 font-mono animate-pulse">⚠️ INFRASTRUCTURE INCOMPLETE</div>
            )}
        </div>
      </div>

      {/* RED DE NODOS (GRID DE IMÁGENES) */}
      <div className="flex-1 bg-void-gray/5 border border-void-border p-4 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-mono text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                <ImageIcon className="w-4 h-4 text-tech-green" /> Red de Nodos Pinterest ({nodes.length})
            </h4>
            <span className="text-[10px] text-gray-600 font-mono">LIVE DATA FROM PINTEREST API</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="text-center py-20 font-mono text-tech-green animate-pulse">SCANNING NODE NETWORK...</div>
            ) : nodes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-gray-800 rounded bg-void-black/50">
                    <p className="text-gray-500 font-mono mb-2">GHOST ASSET DETECTED</p>
                    <p className="text-xs text-gray-600 max-w-xs text-center">Este activo existe en la base de datos pero no tiene pines asignados en Pinterest.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {nodes.map((node) => (
                        <div key={node.id} className="relative group aspect-[2/3] bg-gray-900 border border-gray-800 overflow-hidden hover:border-tech-green transition-colors">
                            <img src={node.image_url} alt="Pin" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/80 p-2 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                                <div className="text-[10px] text-gray-400 font-mono">IMP: <span className="text-white">{node.impressions}</span></div>
                                <div className="text-[10px] text-gray-400 font-mono">SAVE: <span className="text-white">{node.saves}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetailView;