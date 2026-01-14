import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, AlertTriangle, PlusCircle, Database, LayoutGrid, Fingerprint, Type, Save, Grid, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { PinterestNode, Matrix, BusinessAsset } from '../../types/database';
import { tacticalService } from '../../lib/supabase';
import TechButton from '../ui/TechButton';
import { cn } from '../../lib/utils';
import StatusIndicator from '../ui/StatusIndicator';

// --- MODOS DE OPERACIÓN DEL TERMINAL ---
type TerminalMode = 'SCAN' | 'PROMOTE_NEW' | 'LINK_EXISTING';

export default function VoidTerminal() {
  // Datos
  const [orphans, setOrphans] = useState<PinterestNode[]>([]);
  const [matrices, setMatrices] = useState<Matrix[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interfaz Principal
  const [isScanning, setIsScanning] = useState(false);
  const [localSearch, setLocalSearch] = useState(''); // Filtro visual local

  // --- ESTADO DE OPERACIÓN ACTIVA ---
  const [activeNode, setActiveNode] = useState<PinterestNode | null>(null);
  const [mode, setMode] = useState<TerminalMode>('SCAN');

  // SUB-ESTADO: CREACIÓN (FIELD PROMOTION)
  const [promoMatrixId, setPromoMatrixId] = useState('');
  const [promoSku, setPromoSku] = useState('');
  const [promoName, setPromoName] = useState('');
  const [showMatrixCreator, setShowMatrixCreator] = useState(false);
  const [newMatrixCode, setNewMatrixCode] = useState('');
  const [newMatrixName, setNewMatrixName] = useState('');
  const [loadingIdentity, setLoadingIdentity] = useState(false);
  
  // SUB-ESTADO: VINCULACIÓN (LINK EXISTING)
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetSearchResults, setAssetSearchResults] = useState<BusinessAsset[]>([]);
  const [selectedAssetSku, setSelectedAssetSku] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. SCANNER (Ordenado alfabéticamente por Backend)
  const scanVoid = async () => {
    setIsScanning(true);
    try {
      // Pedimos 200 señales para tener un mejor panorama alfabético
      const data = await tacticalService.getOrphanNodes(200); 
      setOrphans(data || []);
      // Recargar matrices para asegurar que los scores estén actualizados en el dropdown
      const matrixData = await tacticalService.getMatrices();
      setMatrices(matrixData || []);
    } catch (e) {
      console.error("Void scan error", e);
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  useEffect(() => { scanVoid(); }, []);

  // 2. BUSCADOR DE ASSETS
  useEffect(() => {
    const searchAssets = async () => {
        if(assetSearchQuery.length < 2) {
            setAssetSearchResults([]);
            return;
        }
        try {
            const results = await tacticalService.searchAssets(assetSearchQuery);
            setAssetSearchResults(results);
        } catch(e) { console.error(e); }
    };
    const debounce = setTimeout(searchAssets, 300);
    return () => clearTimeout(debounce);
  }, [assetSearchQuery]);


  // --- HANDLERS DE ACCIÓN ---

  // A. ABRIR CREACIÓN
  const openPromotion = (node: PinterestNode) => {
      setActiveNode(node);
      setMode('PROMOTE_NEW');
      setPromoMatrixId('');
      setPromoSku('PENDING...');
      setPromoName(node.title || 'New Asset');
      setShowMatrixCreator(false);
  };

  // B. ABRIR VINCULACIÓN
  const openLinker = (node: PinterestNode) => {
      setActiveNode(node);
      setMode('LINK_EXISTING');
      setAssetSearchQuery('');
      setAssetSearchResults([]);
      setSelectedAssetSku('');
  };

  // C. EJECUTAR VINCULACIÓN A EXISTENTE
  const executeLinkToExisting = async () => {
      if(!activeNode || !selectedAssetSku) return;
      setIsProcessing(true);
      try {
          await tacticalService.assignNodesToAsset([activeNode.pin_id], selectedAssetSku);
          closeModal();
          await scanVoid(); // Refresh completo (actualiza matrices y grid)
      } catch(e) {
          alert("ERROR AL VINCULAR");
      } finally {
          setIsProcessing(false);
      }
  };

  // D. EJECUTAR CREACIÓN NUEVA (FIELD PROMOTION)
  const executePromotion = async () => {
      if (!activeNode || !promoMatrixId || !promoSku) return;
      setIsProcessing(true);
      try {
          // IMPORTANTE: Pasamos activeNode completo, que tiene las métricas (impressions, clicks, etc)
          await tacticalService.promoteSignalToAsset(activeNode, promoMatrixId, promoSku);
          closeModal();
          await scanVoid(); // Recarga matrices para ver el puntaje sumado
      } catch (e) {
          alert("ERROR AL CREAR ASSET");
      } finally {
          setIsProcessing(false);
      }
  };

  // E. HELPERS
  const closeModal = () => {
      setActiveNode(null);
      setMode('SCAN');
      setShowMatrixCreator(false);
  };

  const handleMatrixSelect = async (matrixId: string) => {
    setPromoMatrixId(matrixId);
    if(!matrixId) return;

    setLoadingIdentity(true);
    try {
        const identity = await tacticalService.generateNextAssetIdentity(matrixId);
        setPromoSku(identity.sku);
        setPromoName(identity.name);
    } catch(e) { 
        setPromoSku("ERROR-GEN");
    } finally {
        setLoadingIdentity(false);
    }
  };

  // Filtro local visual
  const filteredOrphans = orphans.filter(n => 
    (n.title?.toLowerCase().includes(localSearch.toLowerCase()) || 
    n.pin_id.includes(localSearch))
  );

  return (
    <div className="h-full flex flex-col p-6 relative animate-in fade-in">
      
      {/* HEADER TÁCTICO */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-void-red" />
            THE VOID <span className="text-sm font-normal text-gray-500 font-mono self-end mb-1">v0.1 ALPHA</span>
          </h2>
          <div className="text-gray-500 font-mono mt-2 flex items-center gap-2">
             <StatusIndicator status="active" />
             <div>SEÑALES PENDIENTES: <span className="text-white font-bold">{orphans.length}</span> (A-Z)</div>
          </div>
        </div>
        
        {/* BUSCADOR LOCAL DEL GRID */}
        <div className="flex gap-4">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="FILTRAR VISTA ACTUAL..." 
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="bg-black/50 border border-void-border pl-10 pr-4 py-2 text-sm font-mono text-white focus:border-tech-green w-64"
                />
            </div>
            <TechButton label="REFRESH FEED" icon={RefreshCw} onClick={scanVoid} variant="ghost" />
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
             <div className="h-full flex items-center justify-center text-tech-green font-mono animate-pulse">
                INITIALIZING SENSORS...
            </div>
        ) : filteredOrphans.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-void-border bg-void-gray/5 rounded-lg">
                <p className="text-gray-500 font-mono">SECTOR LIMPIO.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredOrphans.map((node) => (
                    <div key={node.pin_id} className="bg-black border border-void-border flex flex-col group hover:border-tech-green/50 transition-colors">
                        
                        {/* Header Card */}
                        <div className="p-2 border-b border-void-border bg-void-gray/5 flex justify-between text-[10px] font-mono">
                            <span className="text-gray-500 truncate max-w-[150px]">{node.pin_id}</span>
                            <span className="text-void-red">UNLINKED</span>
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 p-3 gap-3">
                            <div className="w-20 h-28 bg-gray-900 shrink-0 border border-gray-800">
                                <img src={node.image_url} className="w-full h-full object-cover opacity-80" />
                            </div>
                            <div className="flex flex-col justify-between flex-1 min-w-0">
                                <h4 className="text-white text-xs font-bold leading-tight line-clamp-2" title={node.title || ''}>
                                    {node.title || 'NO TITLE'}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="bg-void-gray/10 p-1 text-center">
                                        <div className="text-[9px] text-gray-500">IMP</div>
                                        <div className="text-xs font-mono text-white">{node.impressions}</div>
                                    </div>
                                    <div className="bg-void-gray/10 p-1 text-center">
                                        <div className="text-[9px] text-gray-500">CLK</div>
                                        <div className="text-xs font-mono text-tech-green">{node.outbound_clicks}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ACTION FOOTER: BOTONES DUALES */}
                        <div className="grid grid-cols-2 border-t border-void-border divide-x divide-void-border">
                            <button 
                                onClick={() => openLinker(node)}
                                className="p-2 hover:bg-blue-900/20 text-blue-400 hover:text-blue-300 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors"
                            >
                                <LinkIcon className="w-3 h-3" /> EXISTENTE
                            </button>
                            <button 
                                onClick={() => openPromotion(node)}
                                className="p-2 hover:bg-void-red/10 text-void-red hover:text-white text-[10px] font-mono flex items-center justify-center gap-1 transition-colors"
                            >
                                <PlusCircle className="w-3 h-3" /> NUEVO
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- MODAL UNIFICADO --- */}
      {activeNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-3xl bg-[#0a0a0a] border border-void-border shadow-2xl flex flex-col h-[600px]">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-void-border bg-void-gray/5 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                        {mode === 'PROMOTE_NEW' ? <PlusCircle className="w-5 h-5 text-void-red"/> : <LinkIcon className="w-5 h-5 text-blue-400"/>}
                        {mode === 'PROMOTE_NEW' ? 'CREAR NUEVO ASSET' : 'VINCULAR A EXISTENTE'}
                    </h3>
                    <div className="text-xs font-mono text-gray-500">TARGET: {activeNode.pin_id}</div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Panel Izquierdo: Contexto Visual */}
                    <div className="w-1/3 p-6 border-r border-void-border bg-black flex flex-col items-center">
                        <img src={activeNode.image_url} className="w-full h-auto max-h-[300px] object-contain border border-gray-800 mb-4" />
                        <div className="text-center w-full">
                            <div className="text-white font-bold text-sm mb-1 line-clamp-2">{activeNode.title}</div>
                            <div className="text-gray-500 text-xs font-mono">{activeNode.impressions} IMP / {activeNode.outbound_clicks} CLK</div>
                        </div>
                    </div>

                    {/* Panel Derecho: Formularios Lógicos */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#0c0c0c]">
                        
                        {/* ---------------- MODO: VINCULAR A EXISTENTE ---------------- */}
                        {mode === 'LINK_EXISTING' && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-blue-400">BUSCAR EN INVENTARIO (SKU O NOMBRE)</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                        <input 
                                            autoFocus
                                            type="text" 
                                            placeholder="Ej: TSHIRT, RETRO, SKU-001..." 
                                            value={assetSearchQuery}
                                            onChange={(e) => setAssetSearchQuery(e.target.value)}
                                            className="w-full bg-void-gray/10 border border-void-border p-2 pl-9 text-white font-mono focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Resultados de Búsqueda */}
                                <div className="space-y-2 h-[300px] overflow-y-auto custom-scrollbar border border-void-border/50 bg-black/20 p-2">
                                    {assetSearchResults.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-600 text-xs font-mono">
                                            {assetSearchQuery.length < 2 ? 'ESPERANDO INPUT...' : 'SIN RESULTADOS'}
                                        </div>
                                    ) : (
                                        assetSearchResults.map(asset => (
                                            <div 
                                                key={asset.sku}
                                                onClick={() => setSelectedAssetSku(asset.sku)}
                                                className={cn(
                                                    "p-3 border cursor-pointer flex justify-between items-center transition-all",
                                                    selectedAssetSku === asset.sku 
                                                        ? "bg-blue-900/20 border-blue-500" 
                                                        : "border-gray-800 hover:border-gray-600 hover:bg-gray-900"
                                                )}
                                            >
                                                <div>
                                                    <div className="text-white font-bold text-sm">{asset.name}</div>
                                                    <div className="text-gray-500 text-[10px] font-mono">{asset.sku} | {asset.matrix_id}</div>
                                                </div>
                                                {selectedAssetSku === asset.sku && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ---------------- MODO: CREAR NUEVO (FIELD PROMOTION) ---------------- */}
                        {mode === 'PROMOTE_NEW' && (
                            <div className="space-y-6">
                                {/* Selector de Matriz / Creador */}
                                {!showMatrixCreator ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-mono text-void-red">ASIGNAR A MATRIZ</label>
                                            <button onClick={() => setShowMatrixCreator(true)} className="text-[10px] text-gray-400 hover:text-white underline">
                                                + NUEVA MATRIZ
                                            </button>
                                        </div>
                                        <select 
                                            value={promoMatrixId}
                                            onChange={(e) => handleMatrixSelect(e.target.value)}
                                            className="w-full bg-void-gray/10 border border-void-border text-white p-3 text-sm font-mono focus:border-void-red focus:outline-none"
                                        >
                                            <option value="">-- SELECCIONAR --</option>
                                            {matrices.map(m => <option key={m.matrix_code} value={m.matrix_code}>{m.name} [{m.matrix_code}]</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="bg-void-red/10 p-4 border border-void-red/30 space-y-3">
                                        <div className="text-void-red font-bold text-xs">CREAR MATRIZ RÁPIDA</div>
                                        <input placeholder="CÓDIGO (EJ: NEW)" className="w-full bg-black border border-gray-700 p-2 text-white text-xs" 
                                            value={newMatrixCode} onChange={e => setNewMatrixCode(e.target.value.toUpperCase())} />
                                        <input placeholder="NOMBRE" className="w-full bg-black border border-gray-700 p-2 text-white text-xs"
                                            value={newMatrixName} onChange={e => setNewMatrixName(e.target.value)} />
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowMatrixCreator(false)} className="flex-1 bg-gray-800 text-xs py-2 text-gray-400">CANCELAR</button>
                                            <button 
                                                onClick={async () => {
                                                    await tacticalService.createMatrix({ code: newMatrixCode, name: newMatrixName, type: 'PRIMARY' });
                                                    const m = await tacticalService.getMatrices(); setMatrices(m);
                                                    setShowMatrixCreator(false);
                                                    handleMatrixSelect(newMatrixCode);
                                                }} 
                                                className="flex-1 bg-void-red text-black font-bold text-xs py-2"
                                            >CREAR</button>
                                        </div>
                                    </div>
                                )}

                                {/* Preview Identidad */}
                                <div className="p-4 bg-black border border-gray-800">
                                    <div className="text-[10px] text-gray-500 uppercase mb-2">IDENTIDAD ASIGNADA</div>
                                    {loadingIdentity ? (
                                        <div className="text-tech-green text-xs font-mono animate-pulse">GENERANDO IDENTIDAD...</div>
                                    ) : (
                                        <>
                                            <div className="text-tech-green font-mono text-xl font-bold">{promoSku}</div>
                                            <div className="text-gray-400 font-mono text-sm">{promoName}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-void-border bg-void-gray/5 flex justify-end gap-3">
                    <TechButton label="CANCELAR" onClick={closeModal} variant="ghost" />
                    
                    {mode === 'LINK_EXISTING' ? (
                        <TechButton 
                            label={isProcessing ? "VINCULANDO..." : "CONFIRMAR VINCULACIÓN"} 
                            variant="primary" 
                            disabled={!selectedAssetSku || isProcessing}
                            onClick={executeLinkToExisting}
                            className="bg-blue-600 hover:bg-blue-500 border-blue-400 text-white"
                        />
                    ) : (
                        <TechButton 
                            label={isProcessing ? "CREANDO..." : "CONFIRMAR CREACIÓN"} 
                            variant="primary" 
                            disabled={!promoMatrixId || !promoSku || isProcessing || loadingIdentity}
                            onClick={executePromotion}
                        />
                    )}
                </div>

            </div>
        </div>
      )}

    </div>
  );
}