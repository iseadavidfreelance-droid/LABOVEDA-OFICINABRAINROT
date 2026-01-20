import React, { useEffect, useState, useRef } from 'react';
import { 
  RefreshCw, Search, AlertTriangle, PlusCircle, Link as LinkIcon, 
  CheckCircle2, ChevronDown, Image as ImageIcon, Crosshair, ArrowRight, 
  Zap, BarChart2, Shield, Activity, Calculator, Fingerprint, Plus, Target, Share2, MousePointer2, DatabaseZap 
} from 'lucide-react';
import { PinterestNode, Matrix, BusinessAsset } from '../../types/database';
import { tacticalService, SCORING_WEIGHTS, determineRarityTier } from '../../lib/supabase'; // IMPORTANTE: Importamos los pesos reales
import TechButton from '../ui/TechButton';
import { cn } from '../../lib/utils';
import StatusIndicator from '../ui/StatusIndicator';

// --- MODOS DE OPERACIÓN DEL TERMINAL ---
type TerminalMode = 'SCAN' | 'PROMOTE_NEW' | 'LINK_EXISTING';

// CLAVE DE MEMORIA LOCAL
const MEMORY_KEY_LAST_MATRIX = 'TACTICAL_LAST_MATRIX_ID';

export default function VoidTerminal() {
  // Datos
  const [orphans, setOrphans] = useState<PinterestNode[]>([]);
  const [matrices, setMatrices] = useState<Matrix[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interfaz Principal
  const [isScanning, setIsScanning] = useState(false);
  const [isPurging, setIsPurging] = useState(false); // Estado para la recalibración
  const [localSearch, setLocalSearch] = useState('');

  // --- ESTADO DE OPERACIÓN ACTIVA ---
  const [activeNode, setActiveNode] = useState<PinterestNode | null>(null);
  const [mode, setMode] = useState<TerminalMode>('SCAN');

  // SUB-ESTADO: CREACIÓN (FIELD PROMOTION)
  const [promoMatrixId, setPromoMatrixId] = useState('');
  const [promoSku, setPromoSku] = useState('');
  const [promoName, setPromoName] = useState('');
  
  // CREADOR DE MATRIZ (RECUPERADO)
  const [showMatrixCreator, setShowMatrixCreator] = useState(false);
  const [newMatrixCode, setNewMatrixCode] = useState('');
  const [newMatrixName, setNewMatrixName] = useState('');

  const [loadingIdentity, setLoadingIdentity] = useState(false);
  
  // SELECTOR HÍBRIDO
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [showMatrixDropdown, setShowMatrixDropdown] = useState(false);
  const matrixDropdownRef = useRef<HTMLDivElement>(null);
  
  // SUB-ESTADO: VINCULACIÓN
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetSearchResults, setAssetSearchResults] = useState<BusinessAsset[]>([]);
  const [selectedAssetSku, setSelectedAssetSku] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. SCANNER (ALCANCE MÁXIMO)
  const scanVoid = async () => {
    setIsScanning(true);
    try {
      // SOLICITUD DE 5000 NODOS PARA MOSTRAR MAXIMO POSIBLE
      const data = await tacticalService.getOrphanNodes(5000); 
      setOrphans(data || []);
      const matrixData = await tacticalService.getMatrices();
      setMatrices(matrixData || []);
    } catch (e) {
      console.error("Void scan error", e);
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  // 2. PROTOCOLO DE RECALIBRACIÓN (PURGA GLOBAL)
  const executeSystemRecalibration = async () => {
      if (!confirm("⚠️ WARNING: SYSTEM RECALIBRATION\n\nThis will re-calculate scores for ALL assets using the new Mercenary Protocol (V2).\nLegacy 'Legendary' assets may be downgraded.\n\nProceed?")) return;
      
      setIsPurging(true);
      try {
          const result = await tacticalService.executeGlobalPurge();
          alert(result); // Feedback del resultado
          await scanVoid(); // Refrescar la vista
      } catch (e) {
          alert("SYSTEM FAILURE DURING RECALIBRATION");
          console.error(e);
      } finally {
          setIsPurging(false);
      }
  };

  useEffect(() => { scanVoid(); }, []);

  // 3. BUSCADOR DE ASSETS
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

  // Click Outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (matrixDropdownRef.current && !matrixDropdownRef.current.contains(event.target as Node)) {
        setShowMatrixDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LÓGICA DE MEMORIA DE COMBATE ---
  const loadLastMatrix = () => {
      const lastId = localStorage.getItem(MEMORY_KEY_LAST_MATRIX);
      if (lastId && matrices.length > 0) {
          const matrix = matrices.find(m => m.matrix_code === lastId);
          if (matrix) {
              return { id: lastId, name: matrix.name };
          }
      }
      return null;
  };

  // --- CÁLCULO PREDICTIVO ENRIQUECIDO (USANDO PESOS IMPORTADOS) ---
  const calculateProjection = (node: PinterestNode | null) => {
      if (!node) return { score: 0, tier: 'DUST', ctr: 0, viral: 0, engagement: 0 };
      
      // 1. Score Base (Usando SCORING_WEIGHTS importados para consistencia)
      const score = (node.impressions * SCORING_WEIGHTS.IMPRESSION) + 
                    (node.outbound_clicks * SCORING_WEIGHTS.CLICK) + 
                    (node.saves * SCORING_WEIGHTS.SAVE); 
      
      // 2. Tier Base (Usando lógica centralizada)
      const tier = determineRarityTier(score);

      // 3. Métricas Avanzadas
      const impressions = node.impressions || 1; 
      const clicks = node.outbound_clicks || 0;
      const saves = node.saves || 0;

      // CTR (Click Through Rate)
      const ctr = (clicks / impressions) * 100;
      
      // Viral Ratio (Saves vs Clicks)
      const viral = clicks > 0 ? (saves / clicks) : (saves > 0 ? 2.0 : 0);

      // Engagement Rate Global
      const engagement = ((clicks + saves) / impressions) * 100;

      return { 
          score: Math.round(score * 100) / 100, 
          tier,
          ctr: Math.round(ctr * 100) / 100,
          viral: Math.round(viral * 100) / 100,
          engagement: Math.round(engagement * 100) / 100
      };
  };

  // --- HANDLERS ---

  const openPromotion = async (node: PinterestNode) => {
      setActiveNode(node);
      setMode('PROMOTE_NEW');
      setShowMatrixCreator(false);
      setNewMatrixCode('');
      setNewMatrixName('');
      
      setPromoMatrixId('');
      setMatrixSearchQuery('');
      setPromoSku('INITIALIZING...');
      setPromoName('WAITING MATRIX...');

      const lastMatrix = loadLastMatrix();
      if (lastMatrix) {
          handleMatrixSelect(lastMatrix.id, lastMatrix.name);
      }
  };

  const openLinker = (node: PinterestNode) => {
      setActiveNode(node);
      setMode('LINK_EXISTING');
      setAssetSearchQuery('');
      setAssetSearchResults([]);
      setSelectedAssetSku('');
  };

  const executeLinkToExisting = async () => {
      if(!activeNode || !selectedAssetSku) return;
      setIsProcessing(true);
      try {
          await tacticalService.assignNodesToAsset([activeNode.pin_id], selectedAssetSku);
          closeModal();
          await scanVoid(); 
      } catch(e) { alert("ERROR AL VINCULAR"); } finally { setIsProcessing(false); }
  };

  const executePromotion = async () => {
      if (!activeNode || !promoMatrixId || !promoSku) return;
      setIsProcessing(true);
      try {
          localStorage.setItem(MEMORY_KEY_LAST_MATRIX, promoMatrixId);
          await tacticalService.promoteSignalToAsset(activeNode, promoMatrixId, promoSku);
          closeModal();
          await scanVoid();
      } catch (e) { alert("ERROR AL CREAR ASSET"); } finally { setIsProcessing(false); }
  };

  const createAndSelectMatrix = async () => {
      if(!newMatrixCode || !newMatrixName) return;
      setIsProcessing(true);
      try {
        await tacticalService.createMatrix({ code: newMatrixCode, name: newMatrixName, type: 'PRIMARY' });
        // Recargar matrices
        const m = await tacticalService.getMatrices();
        setMatrices(m);
        // Seleccionar la nueva
        handleMatrixSelect(newMatrixCode, newMatrixName);
        setShowMatrixCreator(false);
      } catch(e) {
          alert("ERROR CREANDO MATRIZ");
      } finally {
          setIsProcessing(false);
      }
  };

  const closeModal = () => {
      setActiveNode(null);
      setMode('SCAN');
      setShowMatrixCreator(false);
  };

  const handleMatrixSelect = async (matrixId: string, matrixName?: string) => {
    setPromoMatrixId(matrixId);
    if(matrixName) setMatrixSearchQuery(matrixName);
    setShowMatrixDropdown(false);
    
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

  const filteredOrphans = orphans.filter(n => 
    (n.title?.toLowerCase().includes(localSearch.toLowerCase()) || 
    n.pin_id.includes(localSearch))
  );

  const filteredMatrices = matrices
    .filter(m => m.name.toLowerCase().includes(matrixSearchQuery.toLowerCase()) || m.matrix_code.toLowerCase().includes(matrixSearchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const projection = calculateProjection(activeNode);
  const selectedMatrixStats = matrices.find(m => m.matrix_code === promoMatrixId);

  return (
    <div className="h-full flex flex-col p-6 relative animate-in fade-in bg-black">
      
      {/* HEADER */}
      <div className={cn("flex justify-between items-end mb-6 transition-opacity duration-300", activeNode ? "opacity-20 pointer-events-none" : "opacity-100")}>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-void-red" />
            THE VOID <span className="text-sm font-normal text-gray-500 font-mono self-end mb-1">OPERATOR MODE</span>
          </h2>
          <div className="text-gray-500 font-mono mt-2 flex items-center gap-2">
             <StatusIndicator status="active" />
             <div>TARGETS: <span className="text-white font-bold">{orphans.length}</span></div>
          </div>
        </div>
        <div className="flex gap-4">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="FILTER GRID..." 
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="bg-black/50 border border-void-border pl-10 pr-4 py-2 text-sm font-mono text-white focus:border-tech-green w-64"
                />
            </div>
            
            {/* BOTÓN DE RECALIBRACIÓN / PURGA */}
            <TechButton 
                label={isPurging ? "RECALIBRATING..." : "RECALIBRATE SYSTEM"} 
                icon={DatabaseZap} 
                onClick={executeSystemRecalibration} 
                variant="ghost" 
                className={cn("border-void-red/50 text-void-red hover:bg-void-red/10", isPurging && "animate-pulse")}
                disabled={isPurging}
            />

            <TechButton label="REFRESH" icon={RefreshCw} onClick={scanVoid} variant="ghost" />
        </div>
      </div>

      {/* GRID */}
      <div className={cn("flex-1 overflow-y-auto custom-scrollbar pr-2 transition-all duration-300", activeNode ? "blur-sm brightness-50 pointer-events-none" : "")}>
        {loading ? (
             <div className="h-full flex items-center justify-center text-tech-green font-mono animate-pulse">SYSTEM STARTUP...</div>
        ) : filteredOrphans.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-void-border bg-void-gray/5 rounded-lg">
                <p className="text-gray-500 font-mono">NO TARGETS FOUND.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredOrphans.map((node) => (
                    <div key={node.pin_id} className="bg-black border border-void-border flex flex-col group hover:border-tech-green/50 transition-colors">
                        <div className="p-2 border-b border-void-border bg-void-gray/5 flex justify-between text-[10px] font-mono">
                            <span className="text-gray-500 truncate max-w-[150px]">{node.pin_id}</span>
                            <span className="text-void-red">HOSTILE</span>
                        </div>
                        <div className="flex flex-1 p-3 gap-3">
                            <div className="w-20 h-28 bg-gray-900 shrink-0 border border-gray-800">
                                <img src={node.image_url} className="w-full h-full object-cover opacity-80" />
                            </div>
                            <div className="flex flex-col justify-between flex-1 min-w-0">
                                <h4 className="text-white text-xs font-bold leading-tight line-clamp-2">{node.title || 'NO SIGNATURE'}</h4>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="bg-void-gray/10 p-1 text-center"><div className="text-[9px] text-gray-500">IMP</div><div className="text-xs font-mono text-white">{node.impressions}</div></div>
                                    <div className="bg-void-gray/10 p-1 text-center"><div className="text-[9px] text-gray-500">CLK</div><div className="text-xs font-mono text-tech-green">{node.outbound_clicks}</div></div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 border-t border-void-border divide-x divide-void-border">
                            <button onClick={() => openLinker(node)} className="p-2 hover:bg-blue-900/20 text-blue-400 hover:text-blue-300 text-[10px] font-mono flex items-center justify-center gap-1"><LinkIcon className="w-3 h-3" /> LINK</button>
                            <button onClick={() => openPromotion(node)} className="p-2 hover:bg-void-red/10 text-void-red hover:text-white text-[10px] font-mono flex items-center justify-center gap-1"><PlusCircle className="w-3 h-3" /> CREATE</button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- HUD TÁCTICO --- */}
      {activeNode && (
        <div className="absolute inset-x-0 bottom-0 z-50 h-[520px] bg-black/95 border-t-2 border-void-red shadow-[0_-10px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-10 duration-200 flex flex-col">
            
            {/* HUD HEADER */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-void-border bg-void-red/5">
                <div className="flex items-center gap-3">
                    <Crosshair className="w-5 h-5 text-void-red animate-pulse" />
                    <span className="text-sm font-bold text-white font-mono uppercase tracking-widest">
                        {mode === 'PROMOTE_NEW' ? 'ASSET FABRICATION PROTOCOL' : 'NEURAL LINK PROTOCOL'}
                    </span>
                </div>
                <button onClick={closeModal} className="text-xs font-mono text-gray-500 hover:text-white">[ ESCAPE ] CANCEL</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* ZONA 1: TARGET (IZQUIERDA) */}
                <div className="w-[280px] border-r border-void-border p-6 flex flex-col items-center justify-center bg-void-gray/5 relative">
                    <img src={activeNode.image_url} className="max-h-[220px] border-2 border-void-border object-contain" />
                    <div className="absolute top-4 left-4 text-[10px] text-void-red font-mono bg-black px-1 border border-void-red">TARGET LOCKED</div>
                    <div className="mt-4 text-center w-full">
                        <div className="text-xs text-white font-bold line-clamp-2 mb-2">{activeNode.title}</div>
                        <div className="grid grid-cols-3 gap-1 w-full border-t border-void-border pt-2">
                            <div className="text-center"><div className="text-[9px] text-gray-500">IMP</div><div className="text-xs font-mono text-white">{activeNode.impressions}</div></div>
                            <div className="text-center border-l border-void-border"><div className="text-[9px] text-gray-500">CLK</div><div className="text-xs font-mono text-tech-green">{activeNode.outbound_clicks}</div></div>
                            <div className="text-center border-l border-void-border"><div className="text-[9px] text-gray-500">SAV</div><div className="text-xs font-mono text-blue-400">{activeNode.saves}</div></div>
                        </div>
                    </div>
                </div>

                {/* ZONA 2: CONTROL (CENTRO-DERECHA) */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-black">
                    
                    {mode === 'PROMOTE_NEW' && (
                        <div className="max-w-4xl mx-auto h-full flex flex-col">
                            
                            <div className="grid grid-cols-12 gap-8 flex-1">
                                
                                {/* COLUMNA IZQUIERDA: INPUTS */}
                                <div className="col-span-7 space-y-6">
                                    {/* 1. SELECCIÓN DE MATRIZ (AHORA CON MODO CREACIÓN) */}
                                    <div>
                                        <label className="text-[10px] text-void-red font-mono uppercase mb-2 block flex justify-between">
                                            <span>1. MATRIX ASSIGNMENT</span>
                                            {promoMatrixId && !showMatrixCreator && <span className="text-tech-green">{selectedMatrixStats?.name} SELECTED</span>}
                                        </label>

                                        {!showMatrixCreator ? (
                                            <div className="flex gap-2">
                                                <div className="relative flex-1" ref={matrixDropdownRef}>
                                                    <div 
                                                        className={cn("flex items-center justify-between p-4 border transition-colors cursor-pointer", 
                                                            promoMatrixId ? "border-tech-green bg-tech-green/5" : "border-void-border bg-void-gray/10 hover:border-gray-500")}
                                                        onClick={() => setShowMatrixDropdown(!showMatrixDropdown)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-500 font-mono">DESTINATION SILO</span>
                                                            <span className="text-lg font-bold text-white font-mono">{promoMatrixId || 'SELECT MATRIX...'}</span>
                                                        </div>
                                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                                    </div>
                                                    
                                                    {/* DROPDOWN */}
                                                    {showMatrixDropdown && (
                                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto border border-void-border bg-[#0a0a0a] shadow-2xl">
                                                            <input 
                                                                autoFocus
                                                                placeholder="SEARCH..." 
                                                                className="w-full bg-black p-3 text-xs text-white border-b border-void-border font-mono focus:outline-none"
                                                                value={matrixSearchQuery}
                                                                onChange={e => setMatrixSearchQuery(e.target.value)}
                                                            />
                                                            {filteredMatrices.map(m => (
                                                                <div key={m.matrix_code} 
                                                                    onClick={() => handleMatrixSelect(m.matrix_code, m.name)}
                                                                    className="p-3 hover:bg-void-red/20 cursor-pointer flex justify-between group"
                                                                >
                                                                    <span className="text-sm text-gray-300 group-hover:text-white font-mono">{m.name}</span>
                                                                    <div className="text-right">
                                                                        <span className="text-xs text-gray-600 font-mono block">{m.matrix_code}</span>
                                                                        <span className="text-[9px] text-tech-green font-mono">{m.total_assets_count || 0} ASSETS</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* EL TERCER BOTÓN CENTRAL SOLICITADO PARA CREAR MATRIZ */}
                                                <button 
                                                    onClick={() => setShowMatrixCreator(true)}
                                                    className="w-16 bg-void-gray/10 border border-void-border hover:border-void-red hover:bg-void-red/10 flex flex-col items-center justify-center transition-all group"
                                                    title="CREATE NEW MATRIX"
                                                >
                                                    <Plus className="w-6 h-6 text-gray-500 group-hover:text-void-red mb-1" />
                                                    <span className="text-[9px] text-gray-500 font-mono">NEW</span>
                                                </button>
                                            </div>
                                        ) : (
                                            // FORMULARIO DE CREACIÓN RÁPIDA
                                            <div className="bg-void-red/5 border border-void-red/30 p-4 animate-in fade-in slide-in-from-left-2">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-bold text-void-red font-mono">NEW MATRIX PROTOCOL</span>
                                                    <button onClick={() => setShowMatrixCreator(false)} className="text-[10px] text-gray-500 hover:text-white">CANCEL</button>
                                                </div>
                                                <div className="space-y-3">
                                                    <input 
                                                        autoFocus
                                                        placeholder="MATRIX CODE (EJ: ALFA, BETA)" 
                                                        className="w-full bg-black border border-gray-700 p-2 text-white text-xs font-mono focus:border-void-red focus:outline-none" 
                                                        value={newMatrixCode} 
                                                        onChange={e => setNewMatrixCode(e.target.value.toUpperCase())} 
                                                    />
                                                    <input 
                                                        placeholder="VISUAL NAME (EJ: Alpha Industries)" 
                                                        className="w-full bg-black border border-gray-700 p-2 text-white text-xs font-mono focus:border-void-red focus:outline-none"
                                                        value={newMatrixName} 
                                                        onChange={e => setNewMatrixName(e.target.value)} 
                                                    />
                                                    <TechButton 
                                                        label={isProcessing ? "CREATING..." : "INITIALIZE MATRIX"}
                                                        variant="primary"
                                                        className="w-full"
                                                        disabled={!newMatrixCode || !newMatrixName || isProcessing}
                                                        onClick={createAndSelectMatrix}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. IDENTIDAD GENERADA */}
                                    <div>
                                        <label className="text-[10px] text-tech-green font-mono uppercase mb-2 block">2. ASSET IDENTITY</label>
                                        <div className="p-4 border border-void-border bg-black relative overflow-hidden flex items-center justify-between">
                                            {loadingIdentity && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-xs text-tech-green font-mono z-10">CALCULATING...</div>}
                                            
                                            <div>
                                                <div className="text-2xl font-black text-white font-mono tracking-tight">{promoSku || '---'}</div>
                                                <div className="text-xs text-gray-500 font-mono mt-1">{promoName || 'Waiting for Matrix...'}</div>
                                            </div>

                                            <div className="h-8 w-8 rounded-full border border-void-border flex items-center justify-center">
                                                <Fingerprint className="w-4 h-4 text-gray-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: PROYECCIÓN TÁCTICA ENRIQUECIDA */}
                                <div className="col-span-5 bg-void-gray/5 border border-void-border p-5 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><Calculator className="w-24 h-24 text-white" /></div>
                                    
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="w-4 h-4 text-tech-green" />
                                        <span className="text-xs font-bold text-white uppercase tracking-widest">TACTICAL PROJECTION</span>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        {/* SCORE & TIER */}
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <div className="text-[10px] text-gray-500 font-mono mb-1">SCORE</div>
                                                <div className="text-2xl font-black text-white font-mono">{projection.score}<span className="text-xs text-gray-600 ml-1">PTS</span></div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] text-gray-500 font-mono mb-1">CLASS</div>
                                                <div className={cn("inline-flex items-center gap-1 px-2 py-1 border text-xs font-bold font-mono",
                                                    projection.tier === 'LEGENDARY' ? "border-yellow-500 text-yellow-500 bg-yellow-500/10" :
                                                    projection.tier === 'RARE' ? "border-purple-500 text-purple-500 bg-purple-500/10" :
                                                    projection.tier === 'UNCOMMON' ? "border-blue-500 text-blue-500 bg-blue-500/10" :
                                                    "border-gray-500 text-gray-500 bg-gray-500/10"
                                                )}>
                                                    <Shield className="w-3 h-3" /> {projection.tier}
                                                </div>
                                            </div>
                                        </div>

                                        {/* METRICAS ENRIQUECIDAS (NUEVO) */}
                                        <div className="space-y-2 pt-2 border-t border-dashed border-gray-800">
                                            {/* CTR */}
                                            <div>
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span className="text-gray-500 font-mono flex items-center gap-1"><MousePointer2 className="w-3 h-3" /> CTR (HOOK)</span>
                                                    <span className={cn("font-bold font-mono", projection.ctr > 2 ? "text-tech-green" : "text-gray-400")}>{projection.ctr}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(projection.ctr * 10, 100)}%` }} />
                                                </div>
                                            </div>

                                            {/* VIRAL RATIO */}
                                            <div>
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span className="text-gray-500 font-mono flex items-center gap-1"><Share2 className="w-3 h-3" /> VIRAL RATIO</span>
                                                    <span className={cn("font-bold font-mono", projection.viral > 1 ? "text-purple-400" : "text-gray-400")}>{projection.viral}x</span>
                                                </div>
                                                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500" style={{ width: `${Math.min(projection.viral * 20, 100)}%` }} />
                                                </div>
                                            </div>

                                            {/* ENGAGEMENT */}
                                            <div>
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span className="text-gray-500 font-mono flex items-center gap-1"><Target className="w-3 h-3" /> ENGAGEMENT</span>
                                                    <span className="text-white font-bold font-mono">{projection.engagement}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* MATRIX INTEL FOOTER */}
                                    {promoMatrixId && (
                                        <div className="mt-auto pt-3 border-t border-void-border">
                                            <div className="text-[9px] text-gray-500 font-mono uppercase mb-1">SILO INTEL</div>
                                            <div className="flex justify-between items-center text-xs font-mono">
                                                <span className="text-gray-400">EFF: <span className="text-white">{selectedMatrixStats?.efficiency_score || 0}</span></span>
                                                <span className="text-gray-400">REV: <span className="text-tech-green">${selectedMatrixStats?.total_revenue_score || 0}</span></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="flex justify-between items-center pt-6 mt-2 border-t border-dashed border-gray-800">
                                <div className="text-[10px] text-gray-600 font-mono flex gap-4">
                                    <span>STATUS: {isProcessing ? 'WRITING DB...' : 'READY'}</span>
                                    <span>MEM: {localStorage.getItem(MEMORY_KEY_LAST_MATRIX) || 'EMPTY'}</span>
                                </div>
                                <TechButton 
                                    label={isProcessing ? "FABRICATING..." : "CONFIRM & DEPLOY [ENTER]"} 
                                    variant="primary" 
                                    disabled={!promoMatrixId || !promoSku || isProcessing}
                                    onClick={executePromotion}
                                    className="w-64 h-12 text-lg"
                                    icon={CheckCircle2}
                                />
                            </div>

                        </div>
                    )}

                    {mode === 'LINK_EXISTING' && (
                        <div className="space-y-4 h-full flex flex-col">
                             <div className="flex gap-4 mb-4 shrink-0">
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="SEARCH INVENTORY (NAME OR SKU)..." 
                                    value={assetSearchQuery}
                                    onChange={(e) => setAssetSearchQuery(e.target.value)}
                                    className="flex-1 bg-void-gray/10 border border-void-border p-4 text-white font-mono focus:border-blue-500 focus:outline-none text-lg"
                                />
                                <TechButton 
                                    label={isProcessing ? "LINKING..." : "CONFIRM LINK"} 
                                    variant="primary" 
                                    disabled={!selectedAssetSku || isProcessing}
                                    onClick={executeLinkToExisting}
                                    className="w-48 bg-blue-600 hover:bg-blue-500 border-blue-400"
                                />
                             </div>

                             <div className="grid grid-cols-4 gap-4 pb-20 overflow-y-auto custom-scrollbar">
                                {assetSearchResults.map(asset => (
                                    <div 
                                        key={asset.sku}
                                        onClick={() => setSelectedAssetSku(asset.sku)}
                                        className={cn(
                                            "aspect-square border cursor-pointer relative group transition-all",
                                            selectedAssetSku === asset.sku ? "border-blue-500 ring-2 ring-blue-500/50" : "border-gray-800 hover:border-gray-600"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gray-900">
                                            {asset.main_image_url ? 
                                                <img src={asset.main_image_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" /> :
                                                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-700"/></div>
                                            }
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 bg-black/90 p-2 border-t border-gray-800">
                                            <div className="text-xs font-bold text-white truncate">{asset.name}</div>
                                            <div className="text-[10px] text-blue-400 font-mono truncate">{asset.sku}</div>
                                        </div>
                                        {selectedAssetSku === asset.sku && <div className="absolute top-2 right-2 bg-blue-600 text-white p-1"><CheckCircle2 className="w-4 h-4" /></div>}
                                    </div>
                                ))}
                                {assetSearchResults.length === 0 && assetSearchQuery.length > 2 && (
                                    <div className="col-span-4 text-center py-10 text-gray-500 font-mono">NO ASSETS FOUND</div>
                                )}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}