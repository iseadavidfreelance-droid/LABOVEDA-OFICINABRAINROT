import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, AlertTriangle, PlusCircle, Database, LayoutGrid, Fingerprint, Type, Save, Grid } from 'lucide-react';
import { PinterestNode, Matrix } from '../../types/database';
import { tacticalService } from '../../lib/supabase';
import TechButton from '../ui/TechButton';
import { cn } from '../../lib/utils';
import StatusIndicator from '../ui/StatusIndicator';

export default function VoidTerminal() {
  // Estados de Datos
  const [orphans, setOrphans] = useState<PinterestNode[]>([]);
  const [matrices, setMatrices] = useState<Matrix[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // Estados de Interfaz
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- ESTADOS DEL MODAL DE ASCENSO ---
  const [promotionTarget, setPromotionTarget] = useState<PinterestNode | null>(null);
  const [promoMatrixId, setPromoMatrixId] = useState('');
  const [promoSku, setPromoSku] = useState('');
  const [promoName, setPromoName] = useState(''); // Visual only
  const [isPromoting, setIsPromoting] = useState(false);
  const [loadingIdentity, setLoadingIdentity] = useState(false);

  // --- NUEVO: ESTADOS PARA CREACIÓN DE MATRIZ IN-SITU ---
  const [showMatrixCreator, setShowMatrixCreator] = useState(false);
  const [newMatrixCode, setNewMatrixCode] = useState('');
  const [newMatrixName, setNewMatrixName] = useState('');
  const [newMatrixType, setNewMatrixType] = useState('PRIMARY');

  // 1. Carga Inicial de Inteligencia
  const scanVoid = async () => {
    setIsScanning(true);
    try {
      const data = await tacticalService.getOrphanNodes(50);
      setOrphans(data || []);
      const matrixData = await tacticalService.getMatrices();
      setMatrices(matrixData || []);
    } catch (e) {
      console.error("Void scan failed", e);
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    scanVoid();
  }, []);

  // 2. Preparar el Ascenso (Abrir Modal)
  const handleOpenPromotion = (node: PinterestNode) => {
    setPromotionTarget(node);
    setPromoMatrixId('');
    setPromoSku('PENDING_MATRIX_SELECTION');
    setPromoName('PENDING_MATRIX_SELECTION');
    setShowMatrixCreator(false); // Resetear estado de creador
  };

  // 3. Generar Identidad Automática al seleccionar Matriz
  const handleMatrixSelect = async (matrixId: string) => {
      setPromoMatrixId(matrixId);
      if(!matrixId) return;

      setLoadingIdentity(true);
      try {
          // LLAMADA AL CEREBRO CENTRAL PARA OBTENER SKU OFICIAL
          const identity = await tacticalService.generateNextAssetIdentity(matrixId);
          setPromoSku(identity.sku);
          setPromoName(identity.name);
      } catch (e) {
          console.error("Identity generation error", e);
          setPromoSku("ERROR-GEN-SKU");
      } finally {
          setLoadingIdentity(false);
      }
  };

  // 4. Crear Nueva Matriz (Field Commission)
  const handleCreateMatrix = async () => {
      if (!newMatrixCode || !newMatrixName) return;
      try {
          await tacticalService.createMatrix({
              code: newMatrixCode.toUpperCase(),
              name: newMatrixName,
              type: newMatrixType
          });
          // Recargar matrices y auto-seleccionar la nueva
          const matrixData = await tacticalService.getMatrices();
          setMatrices(matrixData || []);
          
          // Switch back to asset creation
          setShowMatrixCreator(false);
          handleMatrixSelect(newMatrixCode.toUpperCase());
          
      } catch (e) {
          console.error("Matrix creation failed", e);
          alert("ERROR: MATRIZ DUPLICADA O INVÁLIDA");
      }
  };

  // 5. Ejecutar el Ascenso (Guardar en BD)
  const executePromotion = async () => {
    if (!promotionTarget || !promoMatrixId || !promoSku) return;

    setIsPromoting(true);
    try {
        await tacticalService.promoteSignalToAsset(
            promotionTarget,
            promoMatrixId,
            promoSku
        );
        
        setPromotionTarget(null);
        await scanVoid(); 
    } catch (e) {
        console.error("Promotion failed", e);
        alert("FALLO EN CREACIÓN DE ASSET. REVISAR CONSOLA.");
    } finally {
        setIsPromoting(false);
    }
  };

  const filteredOrphans = orphans.filter(n => 
    (n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.pin_id.includes(searchQuery))
  );

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-500 relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-void-red animate-pulse" />
            THE VOID
          </h2>
          {/* CORRECCIÓN DE DOM NESTING: div en lugar de p */}
          <div className="text-gray-500 font-mono mt-2 flex items-center gap-2">
             <StatusIndicator status="active" />
             <p>SEÑALES NO IDENTIFICADAS: <span className="text-white font-bold">{orphans.length}</span></p>
          </div>
        </div>
        <div className="flex gap-4">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-tech-green transition-colors" />
                <input 
                    type="text" 
                    placeholder="BUSCAR SEÑAL ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/50 border border-void-border pl-10 pr-4 py-2 text-sm font-mono text-white focus:border-tech-green focus:outline-none w-64 transition-all"
                />
            </div>
            <TechButton 
                label={isScanning ? "SCANNING..." : "RE-SCAN SECTOR"} 
                icon={RefreshCw} 
                onClick={scanVoid} 
                variant="ghost"
            />
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
           <div className="h-full flex items-center justify-center text-tech-green font-mono animate-pulse">
               INITIALIZING VOID SENSORS...
           </div>
        ) : filteredOrphans.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-void-border bg-void-gray/5 rounded-lg">
                <p className="text-gray-500 font-mono">SECTOR LIMPIO. NO HAY SEÑALES HUÉRFANAS.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredOrphans.map((node) => (
                    <div key={node.pin_id} className="group relative bg-black border border-void-border hover:border-void-red transition-all duration-300 flex flex-col">
                        <div className="p-3 border-b border-void-border bg-void-gray/5 flex justify-between items-center">
                            <span className="font-mono text-[10px] text-void-red font-bold">UNIDENTIFIED</span>
                            <span className="font-mono text-[10px] text-gray-600">{node.pin_id}</span>
                        </div>
                        <div className="flex-1 flex row p-4 gap-4">
                             <div className="w-1/3 aspect-[2/3] bg-gray-900 relative overflow-hidden border border-gray-800">
                                <img src={node.image_url} className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" />
                             </div>
                             <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <h4 className="text-white text-sm font-bold leading-tight line-clamp-2 mb-2" title={node.title || ''}>
                                        {node.title || 'NO TITLE DATA'}
                                    </h4>
                                    <div className="flex flex-col gap-1">
                                        <MetricRow label="IMP" value={node.impressions} />
                                        <MetricRow label="CLK" value={node.outbound_clicks} highlight />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleOpenPromotion(node)}
                                    className="mt-3 w-full py-2 bg-void-red/10 border border-void-red/30 text-void-red hover:bg-void-red hover:text-black hover:font-bold transition-all text-[10px] font-mono flex items-center justify-center gap-2"
                                >
                                    <PlusCircle className="w-3 h-3" />
                                    CREAR ASSET
                                </button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- MODAL: FIELD PROMOTION --- */}
      {promotionTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#0a0a0a] border border-void-red/50 shadow-[0_0_50px_rgba(255,0,0,0.1)] relative flex flex-col overflow-hidden animate-in zoom-in-95">
                
                <div className="p-6 border-b border-void-border bg-void-red/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Database className="w-5 h-5 text-void-red" />
                            FIELD PROMOTION PROTOCOL
                        </h3>
                        <p className="text-xs font-mono text-void-red/70 mt-1">CONVIRTIENDO SEÑAL EN ACTIVO DE NEGOCIO</p>
                    </div>
                </div>

                <div className="p-8 flex gap-8">
                    {/* Fuente */}
                    <div className="w-1/3 flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-gray-500 uppercase">SIGNAL SOURCE</label>
                        <div className="aspect-[2/3] w-full border border-gray-800 relative">
                            <img src={promotionTarget.image_url} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 inset-x-0 bg-black/80 p-2 text-center">
                                <span className="text-[10px] font-mono text-gray-400">{promotionTarget.pin_id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="flex-1 space-y-6">
                        
                        {/* SWITCH DE MODO: SELECCIONAR vs CREAR MATRIZ */}
                        {!showMatrixCreator ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-mono text-tech-green flex items-center gap-2">
                                            <LayoutGrid className="w-3 h-3" /> ASIGNAR A MATRIZ
                                        </label>
                                        <button 
                                            onClick={() => setShowMatrixCreator(true)}
                                            className="text-[10px] text-void-red hover:underline font-mono flex items-center gap-1"
                                        >
                                            <PlusCircle className="w-3 h-3" /> NUEVA MATRIZ
                                        </button>
                                    </div>
                                    <select 
                                        value={promoMatrixId}
                                        onChange={(e) => handleMatrixSelect(e.target.value)}
                                        className="w-full bg-black border border-gray-700 text-white p-3 text-sm font-mono focus:border-tech-green focus:outline-none transition-colors"
                                    >
                                        <option value="">-- SELECCIONAR MATRIZ --</option>
                                        {matrices.map(m => (
                                            <option key={m.matrix_code} value={m.matrix_code}>
                                                [{m.matrix_code}] {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* PREVIEW DE IDENTIDAD GENERADA */}
                                <div className="p-4 bg-void-gray/10 border border-void-border rounded space-y-3">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase">IDENTIDAD GENERADA (AUTO)</label>
                                    
                                    {loadingIdentity ? (
                                        <div className="text-tech-green font-mono text-xs animate-pulse">CALCULATING SEQUENCE...</div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Fingerprint className="w-4 h-4 text-gray-600" />
                                                <span className="text-xl font-bold font-mono text-tech-green">{promoSku}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Type className="w-4 h-4 text-gray-600" />
                                                <span className="text-sm font-mono text-gray-300">{promoName}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            // MODO CREACIÓN DE MATRIZ
                            <div className="bg-void-red/5 border border-void-red/30 p-4 space-y-4 animate-in fade-in slide-in-from-right">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-void-red font-bold font-mono text-sm flex items-center gap-2">
                                        <Grid className="w-4 h-4" /> CREAR MATRIZ
                                    </h4>
                                    <button onClick={() => setShowMatrixCreator(false)} className="text-[10px] text-gray-500 hover:text-white">CANCELAR</button>
                                </div>
                                <input 
                                    type="text" placeholder="CÓDIGO (EJ: CYBER)" 
                                    value={newMatrixCode} onChange={e => setNewMatrixCode(e.target.value.toUpperCase())}
                                    className="w-full bg-black border border-void-red/30 text-white p-2 text-xs font-mono focus:border-void-red"
                                />
                                <input 
                                    type="text" placeholder="NOMBRE VISUAL (EJ: Cyber Goth)" 
                                    value={newMatrixName} onChange={e => setNewMatrixName(e.target.value)}
                                    className="w-full bg-black border border-void-red/30 text-white p-2 text-xs font-mono focus:border-void-red"
                                />
                                <TechButton 
                                    label="INICIALIZAR MATRIZ" 
                                    onClick={handleCreateMatrix} 
                                    variant="primary" 
                                    fullWidth
                                    disabled={!newMatrixCode || !newMatrixName}
                                />
                            </div>
                        )}

                    </div>
                </div>

                <div className="p-6 border-t border-void-border bg-black/50 flex justify-end gap-4">
                    <TechButton 
                        variant="ghost" 
                        label="ABORTAR" 
                        onClick={() => setPromotionTarget(null)} 
                    />
                    {!showMatrixCreator && (
                        <TechButton 
                            variant="primary" 
                            label={isPromoting ? "PROCESANDO..." : "CONFIRMAR ASCENSO"} 
                            icon={Save}
                            disabled={!promoMatrixId || !promoSku || isPromoting || loadingIdentity}
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

const MetricRow = ({ label, value, highlight }: { label: string, value: number, highlight?: boolean }) => (
    <div className="flex justify-between items-center text-[10px] font-mono border-b border-gray-900 pb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className={cn(highlight ? "text-tech-green" : "text-gray-400")}>
            {value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}
        </span>
    </div>
);