import { createClient } from '@supabase/supabase-js';
import { PinterestNode, BusinessAsset, AssetStatus, MatrixRegistry, RadarConversionAlert } from '../types/database';

// ENVIRONMENT VARIABLES
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("SUPABASE CREDENTIALS MISSING. CHECK .ENV FILE.");
}

// REAL CLIENT
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * --- PROTOCOLO MERCENARIO (V2.0) ---
 * Filosofía: "Ventas o Muerte".
 * Se prioriza el tráfico saliente (Outbound) sobre la vanidad (Saves).
 */
export const SCORING_WEIGHTS = {
    IMPRESSION: 0.001,   // Ruido de fondo. Casi irrelevante.
    CLICK: 5.0,          // EL REY. Intención de compra clara.
    SAVE: 0.5,           // Vanidad. Interés pasivo. (Castigado)
    REVENUE_DOLLAR: 20.0 // La verdad absoluta.
};

/**
 * CÁLCULO DE SCORE
 * Aplica el Protocolo Mercenario.
 */
export const calculateTacticalScore = (impressions: number, clicks: number, saves: number, revenue: number = 0): number => {
    const score = (impressions * SCORING_WEIGHTS.IMPRESSION) + 
                  (clicks * SCORING_WEIGHTS.CLICK) + 
                  (saves * SCORING_WEIGHTS.SAVE) +
                  (revenue * SCORING_WEIGHTS.REVENUE_DOLLAR);
    return Math.round(score * 100) / 100;
};

/**
 * CURVA DE DIFICULTAD LOGARÍTMICA
 * Se acabaron los "Legendarios de Papel".
 * Nueva Escala:
 * - DUST: < 100
 * - COMMON: 100 - 499
 * - UNCOMMON: 500 - 1499
 * - RARE: 1500 - 4999
 * - LEGENDARY: >= 5000 (Solo élite real)
 */
export const determineRarityTier = (score: number): 'DUST' | 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' => {
    if (score >= 5000) return 'LEGENDARY';
    if (score >= 1500) return 'RARE';
    if (score >= 500) return 'UNCOMMON';
    if (score >= 100) return 'COMMON';
    return 'DUST';
};

/**
 * SERVICIO TÁCTICO UNIFICADO
 */
export const tacticalService = {

  // --- 0. AUDITORÍA GLOBAL (THE PURGE) ---
  // Ejecuta esto para recalcular TODOS los activos existentes con la nueva fórmula.
  async executeGlobalPurge(): Promise<string> {
      // 1. Traer todos los Assets
      const { data: assets, error } = await supabase.from('business_assets').select('sku, primary_matrix_id');
      if (error || !assets) throw new Error("FALLO AL LEER ACTIVOS");

      let updatedCount = 0;

      // 2. Iterar (Esto debería hacerse en backend SQL para producción masiva, pero sirve para <1000 items)
      for (const asset of assets) {
          // Obtener métricas reales de sus nodos
          const { data: nodes } = await supabase
              .from('pinterest_nodes')
              .select('cached_impressions, cached_outbound_clicks, cached_pin_clicks')
              .eq('asset_sku', asset.sku);

          if (nodes) {
              let imp = 0, clk = 0, sav = 0;
              nodes.forEach(n => {
                  imp += n.cached_impressions || 0;
                  clk += n.cached_outbound_clicks || 0;
                  sav += n.cached_pin_clicks || 0; // saves
              });

              // Recalcular con Protocolo Mercenario
              const newScore = calculateTacticalScore(imp, clk, sav, 0); // Asumimos revenue 0 para recalculo base
              const newTier = determineRarityTier(newScore);

              // Impactar DB
              await supabase.from('business_assets').update({
                  total_score: newScore,
                  traffic_score: clk,
                  rarity_tier: newTier,
                  last_audit_at: new Date().toISOString()
              }).eq('sku', asset.sku);

              updatedCount++;
          }
      }

      // 3. Recalcular todas las Matrices afectadas
      const matrixIds = [...new Set(assets.map(a => a.primary_matrix_id))];
      for (const mId of matrixIds) {
          await this.forceMatrixRecalculation(mId);
      }

      return `PURGA COMPLETA. ${updatedCount} ACTIVOS RECALIBRADOS BAJO PROTOCOLO MERCENARIO.`;
  },

  // --- 1. GESTIÓN DE MATRICES (NIVEL 1) ---
  
  async getMatrices(): Promise<MatrixRegistry[]> {
    const { data, error } = await supabase
      .from('matrix_registry')
      .select(`
        id:matrix_code,
        code:matrix_code,
        visual_name,
        type,
        total_assets_count:asset_count,
        efficiency_score:total_score,
        total_traffic_score,
        total_revenue_score,
        matrix_code,
        asset_count,
        total_score
      `)
      .order('total_score', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map((m: any) => ({
      ...m,
      matrix_code: m.code || m.matrix_code,
      total_score: m.efficiency_score || m.total_score || 0,
      total_traffic_score: m.total_traffic_score || 0,
      total_revenue_score: m.total_revenue_score || 0,
      name: m.visual_name || m.code 
    })) as MatrixRegistry[];
  },

  async createMatrix(matrix: { code: string; name: string; type: string }): Promise<void> {
    const { error } = await supabase
      .from('matrix_registry')
      .insert({
        matrix_code: matrix.code,
        visual_name: matrix.name, 
        type: matrix.type,
        total_score: 0,
        total_traffic_score: 0,
        total_revenue_score: 0,
        asset_count: 0
      });
    
    if (error) throw error;
  },

  // --- CEREBRO: PROPAGACIÓN VERTICAL (AGREGACIÓN TOTAL) ---
  async forceMatrixRecalculation(matrixId: string) {
      if (!matrixId) return;

      const { data: assets } = await supabase
          .from('business_assets')
          .select('total_score, traffic_score, revenue_score')
          .eq('primary_matrix_id', matrixId);

      if (!assets) return;

      const totalAssets = assets.length;
      const totalScore = assets.reduce((sum, a) => sum + (Number(a.total_score) || 0), 0);
      const totalTraffic = assets.reduce((sum, a) => sum + (Number(a.traffic_score) || 0), 0);
      const totalRevenue = assets.reduce((sum, a) => sum + (Number(a.revenue_score) || 0), 0);

      await supabase
          .from('matrix_registry')
          .update({
              asset_count: totalAssets,
              total_score: Math.round(totalScore * 100) / 100,
              total_traffic_score: Math.round(totalTraffic * 100) / 100,
              total_revenue_score: Math.round(totalRevenue * 100) / 100,
              last_audit_at: new Date().toISOString()
          })
          .eq('matrix_code', matrixId);
  },

  // --- CEREBRO: GENERADOR DE IDENTIDAD ---
  async generateNextAssetIdentity(matrixId: string): Promise<{ sku: string; name: string }> {
    const { data: matrix, error: matrixError } = await supabase
      .from('matrix_registry')
      .select('matrix_code, visual_name')
      .eq('matrix_code', matrixId)
      .single();

    if (matrixError || !matrix) throw new Error("MATRIX_NOT_FOUND");

    const { count, error: countError } = await supabase
      .from('business_assets')
      .select('*', { count: 'exact', head: true })
      .eq('primary_matrix_id', matrixId);

    if (countError) throw new Error("CALCULATION_ERROR");

    const nextSequence = (count || 0) + 1;
    const paddedSequence = nextSequence.toString().padStart(3, '0');
    
    const generatedSku = `SKU-${matrix.matrix_code}-${paddedSequence}`;
    const visualPrefix = matrix.visual_name || matrix.matrix_code;
    const generatedName = `${visualPrefix} ${paddedSequence.slice(-2)}`; 

    return { sku: generatedSku, name: generatedName };
  },

  // --- 2. GESTIÓN DE ACTIVOS (NIVEL 2) ---

  getTacticalSilos: async (): Promise<BusinessAsset[]> => {
     const { data: assets, error } = await supabase
        .from('business_assets')
        .select('*')
        .limit(50)
        .order('last_audit_at', { ascending: false });

     if (error) throw error;

     const matrixIds = [...new Set((assets || []).map((a: any) => a.primary_matrix_id))];
     const { data: matrices } = await supabase
        .from('matrix_registry')
        .select('matrix_code, visual_name')
        .in('matrix_code', matrixIds);

     const matrixMap: Record<string, string> = {};
     matrices?.forEach((m: any) => {
         matrixMap[m.matrix_code] = m.visual_name;
     });

     return (assets || []).map((d: any) => ({
         ...d,
         matrix_id: d.primary_matrix_id, 
         primary_matrix_id: d.primary_matrix_id,
         matrix_name: matrixMap[d.primary_matrix_id] || d.primary_matrix_id,
         name: d.sku, 
         tier: d.rarity_tier,
         score: d.total_score || 0,
         monetization_link: d.payhip_link,
         description: d.drive_link,
         updated_at: d.last_audit_at,
         status: AssetStatus.ACTIVE,
     })) as unknown as BusinessAsset[];
  },

  searchAssets: async (query: string): Promise<BusinessAsset[]> => {
    if (!query) return [];
    
    const { data: assets, error } = await supabase
        .from('business_assets')
        .select('*, pinterest_nodes(image_url)') 
        .ilike('sku', `%${query}%`)
        .limit(20);

    if (error) throw error;

    const matrixIds = [...new Set((assets || []).map((a: any) => a.primary_matrix_id))];
    const { data: matrices } = await supabase
        .from('matrix_registry')
        .select('matrix_code, visual_name')
        .in('matrix_code', matrixIds);

    const matrixMap: Record<string, string> = {};
    matrices?.forEach((m: any) => { matrixMap[m.matrix_code] = m.visual_name; });
    
    return (assets || []).map((d: any) => ({
        ...d,
        matrix_id: d.primary_matrix_id,
        matrix_name: matrixMap[d.primary_matrix_id] || d.primary_matrix_id,
        name: d.sku,
        tier: d.rarity_tier,
        score: d.total_score || 0,
        status: AssetStatus.ACTIVE,
        main_image_url: d.pinterest_nodes && d.pinterest_nodes.length > 0 ? d.pinterest_nodes[0].image_url : null
    })) as unknown as BusinessAsset[];
  },

  getAssetDetails: async (sku: string): Promise<BusinessAsset | null> => {
    const { data: asset, error } = await supabase.from('business_assets').select('*').eq('sku', sku).single();
    if (error || !asset) return null;

    const { data: matrix } = await supabase.from('matrix_registry').select('visual_name').eq('matrix_code', asset.primary_matrix_id).single();
    
    return {
        ...asset,
        matrix_id: asset.primary_matrix_id,
        matrix_name: matrix?.visual_name || asset.primary_matrix_id,
        name: asset.sku,
        tier: asset.rarity_tier,
        score: asset.total_score || 0,
        monetization_link: asset.payhip_link,
        drive_link: asset.drive_link,
        description: asset.drive_link,
        updated_at: asset.last_audit_at,
        status: AssetStatus.ACTIVE,
    } as unknown as BusinessAsset;
  },

  getAssetsByMatrix: async (matrixId: string) => {
    const { data: assets, error } = await supabase
      .from('business_assets')
      .select('*')
      .eq('primary_matrix_id', matrixId)
      .order('total_score', { ascending: false });

    if (error) throw error;

    const { data: matrixData } = await supabase
        .from('matrix_registry')
        .select('visual_name')
        .eq('matrix_code', matrixId)
        .single();
    
    const realName = matrixData?.visual_name || matrixId;

    return assets.map((asset: any) => ({
        ...asset,
        matrix_id: asset.primary_matrix_id,
        primary_matrix_id: asset.primary_matrix_id,
        score: asset.total_score || 0,
        tier: asset.rarity_tier,
        monetization_link: asset.payhip_link,
        matrix_name: realName
    }));
  },

  createAsset: async (assetData: { name: string; sku: string; matrix_id: string }) => {
    const { data, error } = await supabase.from('business_assets')
      .insert({ 
          sku: assetData.sku, 
          primary_matrix_id: assetData.matrix_id, 
          rarity_tier: 'DUST', 
          total_score: 0, 
          traffic_score: 0, 
          revenue_score: 0,
      })
      .select().single();
    if (error) throw error;
    
    await tacticalService.forceMatrixRecalculation(assetData.matrix_id);
    return data;
  },

  updateAssetInfra: async (sku: string, updates: any) => {
    const { error } = await supabase.from('business_assets').update(updates).eq('sku', sku);
    if (error) throw error;
  },

  deleteAsset: async (sku: string): Promise<void> => {
    const { data: asset } = await supabase.from('business_assets').select('primary_matrix_id').eq('sku', sku).single();
    const { error } = await supabase.from('business_assets').delete().eq('sku', sku);
    if (error) throw error;

    if (asset?.primary_matrix_id) {
        await tacticalService.forceMatrixRecalculation(asset.primary_matrix_id);
    }
  },

  // --- 3. GESTIÓN DE NODOS (PINTEREST) Y EL VACÍO ---

  getNodesByAsset: async (sku: string) => {
    const { data, error } = await supabase
      .from('pinterest_nodes')
      .select('*, impressions:cached_impressions, saves:cached_pin_clicks, outbound_clicks:cached_outbound_clicks')
      .eq('asset_sku', sku)
      .order('cached_impressions', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getOrphanNodes(limit: number = 200): Promise<PinterestNode[]> {
    const { data, error } = await supabase
        .from('pinterest_nodes')
        .select(`
          pin_id, title, description, image_url, 
          cached_impressions, cached_pin_clicks, cached_outbound_clicks, created_at
        `)
        .is('asset_sku', null)
        .limit(limit)
        .order('title', { ascending: true });

    if (error) throw error;

    return (data || []).map((n: any) => ({
      id: n.pin_id,
      pin_id: n.pin_id,
      asset_sku: null,
      title: n.title,
      description: n.description,
      image_url: n.image_url,
      url: `https://pinterest.com/pin/${n.pin_id}`, 
      impressions: n.cached_impressions || 0,
      clicks: n.cached_pin_clicks || 0, // Saves
      outbound_clicks: n.cached_outbound_clicks || 0, 
      saves: n.cached_pin_clicks || 0,
      created_at: n.created_at || new Date().toISOString(), 
    })) as PinterestNode[];
  },

  async assignNodesToAsset(nodeIds: string[], assetSku: string): Promise<boolean> {
      // 1. Vincular
      const { error } = await supabase
        .from('pinterest_nodes')
        .update({ asset_sku: assetSku })
        .in('pin_id', nodeIds); 

      if (error) throw error;

      // 2. Recalcular Asset con Protocolo Mercenario
      const { data: allNodes } = await supabase
          .from('pinterest_nodes')
          .select('cached_impressions, cached_outbound_clicks, cached_pin_clicks')
          .eq('asset_sku', assetSku);
      
      let matrixIdToUpdate = null;

      if (allNodes && allNodes.length > 0) {
          let totalImp = 0, totalOut = 0, totalSaves = 0;
          
          allNodes.forEach(n => {
              totalImp += n.cached_impressions || 0;
              totalOut += n.cached_outbound_clicks || 0;
              totalSaves += n.cached_pin_clicks || 0;
          });

          // NEW SCORING
          const newScore = calculateTacticalScore(totalImp, totalOut, totalSaves);
          const newTier = determineRarityTier(newScore);

          const { data: updatedAsset } = await supabase.from('business_assets').update({
              total_score: newScore,
              traffic_score: totalOut, 
              rarity_tier: newTier,
              last_audit_at: new Date().toISOString()
          })
          .eq('sku', assetSku)
          .select('primary_matrix_id')
          .single();

          matrixIdToUpdate = updatedAsset?.primary_matrix_id;
      }

      if (matrixIdToUpdate) {
          await tacticalService.forceMatrixRecalculation(matrixIdToUpdate);
      }

      return true;
  },

  async promoteSignalToAsset(
    pin: { pin_id: string; title: string; image_url: string; impressions?: number; outbound_clicks?: number; clicks?: number }, 
    matrixId: string, 
    newSku: string, 
  ) {
    const rawImpressions = pin.impressions || 0;
    const rawClicks = pin.outbound_clicks || 0; // Tráfico real
    const rawSaves = pin.clicks || 0; // Saves (viene como clicks en tu mapping interno)

    // PROTOCOLO MERCENARIO APLICADO AL NACER
    const initialScore = calculateTacticalScore(rawImpressions, rawClicks, rawSaves);
    const initialTier = determineRarityTier(initialScore);

    const { error: assetError } = await supabase
      .from('business_assets')
      .insert({
        sku: newSku,
        primary_matrix_id: matrixId,
        rarity_tier: initialTier,
        total_score: initialScore,
        traffic_score: rawClicks, 
        revenue_score: 0,
        drive_link: `Auto-generated from Pin: ${pin.pin_id}`,
        last_audit_at: new Date().toISOString()
      });

    if (assetError) throw assetError;

    const { error: nodeError } = await supabase
      .from('pinterest_nodes')
      .update({ asset_sku: newSku })
      .eq('pin_id', pin.pin_id);

    if (nodeError) throw nodeError;

    await tacticalService.forceMatrixRecalculation(matrixId);

    return true;
  },

  async incinerateNodes(nodeIds: string[]): Promise<boolean> {
      const { error } = await supabase.from('pinterest_nodes').delete().in('pin_id', nodeIds);
      if (error) throw error;
      return true;
  },

  // --- 4. ANALÍTICA Y TABLEROS DE MANDO ---

  async getViewCounts() {
    try {
      const [hemorragia, infra, ghosts, void_radar, dust] = await Promise.all([
        supabase.from('radar_monetization_ready').select('*', { count: 'exact', head: true }),
        supabase.from('radar_infrastructure_gap').select('*', { count: 'exact', head: true }),
        supabase.from('radar_ghost_assets').select('*', { count: 'exact', head: true }),
        supabase.from('radar_the_void').select('*', { count: 'exact', head: true }),
        supabase.from('radar_dust_cleaner').select('*', { count: 'exact', head: true }),
      ]);
      return {
        radar_monetization_ready: hemorragia.count || 0,
        radar_infrastructure_gap: infra.count || 0,
        radar_ghost_assets: ghosts.count || 0,
        radar_the_void: void_radar.count || 0,
        radar_dust_cleaner: dust.count || 0,
      };
    } catch (e) { return { radar_monetization_ready: 0, radar_infrastructure_gap: 0, radar_ghost_assets: 0, radar_the_void: 0, radar_dust_cleaner: 0 }; }
  },

  async getSystemHeartbeat() {
    const { data, error } = await supabase.from('ingestion_cycles').select('*').order('started_at', { ascending: false }).limit(1).maybeSingle();
    if (error) return { status: 'OFFLINE', started_at: new Date().toISOString(), records_processed: 0 };
    return { status: data?.status || 'STANDBY', started_at: data?.started_at, records_processed: data?.items_processed || 0 };
  },

  async getGlobalKPIs() {
    const [assets, nodes] = await Promise.all([
        supabase.from('business_assets').select('*', { count: 'exact', head: true }),
        supabase.from('pinterest_nodes').select('*', { count: 'exact', head: true })
    ]);
    return { total_assets: assets.count || 0, total_nodes: nodes.count || 0, efficiency_avg: 0 };
  },

  async getMonetizationGaps(matrixId?: string | null) {
    let query = supabase.from('radar_monetization_ready').select('*');
    if (matrixId) query = query.eq('matrix_id', matrixId);
    const { data } = await query; return data || [];
  },
  async getInfrastructureGaps(matrixId?: string | null) {
    let query = supabase.from('radar_infrastructure_gap').select('*');
    if (matrixId) query = query.eq('matrix_id', matrixId);
    const { data } = await query; return data || [];
  },
  async getGhostAssets(matrixId?: string | null) {
    let query = supabase.from('radar_ghost_assets').select('*');
    if (matrixId) query = query.eq('matrix_id', matrixId);
    const { data } = await query; return data || [];
  },
  async patchAsset(sku: string, field: 'payhip' | 'drive', value: string): Promise<boolean> {
    const updatePayload: any = {};
    if (field === 'payhip') updatePayload.payhip_link = value;
    if (field === 'drive') updatePayload.drive_link = value;
    const { error } = await supabase.from('business_assets').update(updatePayload).eq('sku', sku);
    if (error) throw error;
    return true;
  },
  async getEliteAnalytics(orderBy = 'efficiency_index', ascending = false, matrixId?: string | null) {
    let query = supabase.from('view_elite_analytics').select('*').order(orderBy, { ascending });
    if (matrixId) query = query.eq('matrix_id', matrixId);
    const { data } = await query; return data || [];
  },
  async getConversionAlerts(): Promise<RadarConversionAlert[]> {
      const { data, error } = await supabase.from('radar_conversion_alert').select('*'); 
      if (error) return [];
      return data as RadarConversionAlert[];
  }
};

export const mockService = tacticalService;