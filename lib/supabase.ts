import { createClient } from '@supabase/supabase-js';
import { PinterestNode, BusinessAsset, RarityTier, RadarMonetizationReady, RadarInfrastructureGap, ViewEliteAnalytics, RadarConversionAlert, AssetStatus, MatrixRegistry, RadarGhostAssets, RadarDustCleaner, RadarTheVoid } from '../types/database';

// ENVIRONMENT VARIABLES
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("SUPABASE CREDENTIALS MISSING. CHECK .ENV FILE.");
}

// REAL CLIENT
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * SERVICIO TÁCTICO UNIFICADO (0 INCERTIDUMBRE)
 */
export const tacticalService = {

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
        matrix_code,
        asset_count,
        total_score
      `)
      .order('matrix_code', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map((m: any) => ({
      ...m,
      matrix_code: m.code || m.matrix_code,
      total_score: m.efficiency_score || m.total_score,
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
      });
    
    if (error) throw error;
  },

  // --- CEREBRO: GENERADOR DE IDENTIDAD (CORRELACIÓN ESTRICTA) ---
  async generateNextAssetIdentity(matrixId: string): Promise<{ sku: string; name: string }> {
    // 1. Obtener datos de la matriz
    const { data: matrix, error: matrixError } = await supabase
      .from('matrix_registry')
      .select('matrix_code, visual_name')
      .eq('matrix_code', matrixId)
      .single();

    if (matrixError || !matrix) throw new Error("MATRIX_NOT_FOUND");

    // 2. Contar assets existentes para calcular secuencia
    const { count, error: countError } = await supabase
      .from('business_assets')
      .select('*', { count: 'exact', head: true })
      .eq('primary_matrix_id', matrixId);

    if (countError) throw new Error("CALCULATION_ERROR");

    // 3. Generar Identidad Militar Estándar
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
        .limit(50);

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
         score: d.total_score,
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
        .select('*')
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
        score: d.total_score,
        status: AssetStatus.ACTIVE,
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
        score: asset.total_score,
        monetization_link: asset.payhip_link,
        drive_link: asset.drive_link,
        description: asset.drive_link, // Mapeo correcto: usamos drive_link como descripción técnica si description no existe
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
        score: asset.total_score,
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
          // Eliminamos 'name' si no existe en tu tabla, pero asumo que usas 'sku' como ID principal.
          // Si tu tabla no tiene columna 'name', elimina esta línea. 
          // Según el manifiesto, business_assets tiene 'sku' (PK).
      })
      .select().single();
    if (error) throw error;
    return data;
  },

  updateAssetInfra: async (sku: string, updates: any) => {
    const { error } = await supabase.from('business_assets').update(updates).eq('sku', sku);
    if (error) throw error;
  },

  deleteAsset: async (sku: string): Promise<void> => {
    const { error } = await supabase.from('business_assets').delete().eq('sku', sku);
    if (error) throw error;
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

  async getOrphanNodes(limit: number = 100): Promise<PinterestNode[]> {
    const { data, error } = await supabase
        .from('pinterest_nodes')
        .select(`
          pin_id, title, description, image_url, 
          cached_impressions, cached_pin_clicks, cached_outbound_clicks, created_at
        `)
        .is('asset_sku', null)
        .limit(limit)
        .order('created_at', { ascending: false }); 

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
      clicks: n.cached_pin_clicks || 0,
      outbound_clicks: n.cached_outbound_clicks || 0, 
      saves: n.cached_pin_clicks || 0,
      created_at: n.created_at || new Date().toISOString(), 
    })) as PinterestNode[];
  },

  async assignNodesToAsset(nodeIds: string[], assetSku: string): Promise<boolean> {
      const { error } = await supabase
        .from('pinterest_nodes')
        .update({ asset_sku: assetSku })
        .in('pin_id', nodeIds); 

      if (error) throw error;
      return true;
  },

  // --- FIELD PROMOTION (CORREGIDO Y SIN ERRORES 400) ---
  async promoteSignalToAsset(
    pin: { pin_id: string; title: string; image_url: string }, 
    matrixId: string, 
    newSku: string, 
    // newName: string -> Eliminado porque no lo vamos a insertar en columnas fantasma
  ) {
    // 1. Crear el Asset respetando el esquema EXACTO de 'business_assets'
    // Columnas válidas: sku, primary_matrix_id, rarity_tier, total_score, traffic_score, revenue_score
    const { error: assetError } = await supabase
      .from('business_assets')
      .insert({
        sku: newSku,
        primary_matrix_id: matrixId,
        rarity_tier: 'DUST',
        total_score: 0,
        traffic_score: 0,
        revenue_score: 0,
        // drive_link: Usamos este campo para guardar la referencia del origen si es necesario
        drive_link: `Auto-generated from Pin: ${pin.pin_id}` 
      });

    if (assetError) throw assetError;

    // 2. Asignar el Pin al nuevo Asset
    const { data, error: nodeError } = await supabase
      .from('pinterest_nodes')
      .update({ asset_sku: newSku })
      .eq('pin_id', pin.pin_id)
      .select();

    if (nodeError) throw nodeError;

    return data;
  },

  async incinerateNodes(nodeIds: string[]): Promise<boolean> {
      const { error } = await supabase
        .from('pinterest_nodes')
        .delete()
        .in('pin_id', nodeIds);
      
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

// Mantenemos mockService como alias para compatibilidad
export const mockService = tacticalService;