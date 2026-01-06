import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { Search, Filter, Box } from 'lucide-react';
import { AssetDetailView } from './AssetDetailView';
import RarityBadge from '../ui/RarityBadge'; // [CORREGIDO: Sin llaves]
import AssetCreationWizard from './AssetCreationWizard'; // [CORREGIDO: Sin llaves si es default]

type BusinessAsset = Database['public']['Tables']['business_assets']['Row'];

export const AssetManager: React.FC = () => {
  const [assets, setAssets] = useState<BusinessAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<BusinessAsset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  // Carga inicial basada en "0 Incertidumbre"
  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('business_assets')
      .select('*')
      .order('total_score', { ascending: false });

    if (error) console.error('Error fetching assets:', error);
    else setAssets(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredAssets = assets.filter(a => 
    a.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.rarity_tier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Si hay un activo seleccionado, mostramos su "Hoja de Mando"
  if (selectedAsset) {
    return (
      <div className="animate-in fade-in slide-in-from-right duration-300">
        <button 
          onClick={() => setSelectedAsset(null)}
          className="mb-4 text-[#00f0ff] hover:text-white flex items-center gap-2 font-mono text-sm uppercase tracking-wider"
        >
          ← Volver al Inventario
        </button>
        <AssetDetailView asset={selectedAsset} onBack={() => setSelectedAsset(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Táctico */}
      <div className="flex justify-between items-end border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#00f0ff] tracking-wider uppercase glitch-text">
            Inventario de Activos (SKUs)
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">
            Gobernanza de Activos Digitales • {assets.length} Unidades Desplegadas
          </p>
        </div>
        <button
          onClick={() => setShowWizard(!showWizard)}
          className="bg-green-900/20 text-green-400 border border-green-800 hover:bg-green-900/40 px-4 py-2 text-xs font-mono tracking-widest uppercase transition-all"
        >
          {showWizard ? 'Cancelar Despliegue' : '+ Nuevo Activo'}
        </button>
      </div>

      {showWizard && (
        <div className="bg-black/50 border border-gray-800 p-4 mb-6">
          <AssetCreationWizard />
        </div>
      )}

      {/* Barra de Comandos */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por SKU o Rarity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 text-gray-200 pl-10 pr-4 py-2 font-mono text-sm focus:border-[#00f0ff] focus:outline-none transition-colors"
          />
        </div>
        <button className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-[#00f0ff] hover:border-[#00f0ff] transition-colors">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Tabla de Activos */}
      <div className="overflow-hidden border border-gray-800 bg-black/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 text-gray-500 text-xs font-mono uppercase tracking-wider border-b border-gray-800">
              <th className="p-4">SKU (Identificador)</th>
              <th className="p-4">Rango</th>
              <th className="p-4 text-right">Score Total</th>
              <th className="p-4 text-right">Tráfico</th>
              <th className="p-4 text-right">Ingresos</th>
              <th className="p-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-mono animate-pulse">Cargando Datos Tácticos...</td></tr>
            ) : filteredAssets.map((asset) => (
              <tr 
                key={asset.sku} 
                onClick={() => setSelectedAsset(asset)}
                className="hover:bg-[#00f0ff]/5 cursor-pointer group transition-colors"
              >
                <td className="p-4 font-mono text-gray-300 group-hover:text-white font-bold">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-gray-600 group-hover:text-[#00f0ff]" />
                    {asset.sku}
                  </div>
                </td>
                <td className="p-4">
                  <RarityBadge tier={asset.rarity_tier} />
                </td>
                <td className="p-4 text-right font-mono text-[#00f0ff]">
                  {asset.total_score?.toFixed(0) || '0'}
                </td>
                <td className="p-4 text-right font-mono text-gray-400">
                  {asset.traffic_score?.toFixed(0) || '0'}
                </td>
                <td className="p-4 text-right font-mono text-green-500">
                  ${asset.revenue_score?.toFixed(2) || '0.00'}
                </td>
                <td className="p-4 text-center">
                  {!asset.payhip_link && asset.rarity_tier !== 'DUST' && (
                     <span className="text-red-500 text-xs font-bold px-2 py-1 bg-red-900/20 border border-red-900 rounded">NO MONETIZED</span>
                  )}
                  {!asset.drive_link && (
                     <span className="text-yellow-500 text-xs ml-2" title="No Drive Link">⚠️</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};