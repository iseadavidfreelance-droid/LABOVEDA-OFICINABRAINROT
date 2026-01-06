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
 * DATA SERVICE (REAL PRODUCTION)
 * Strictly mapped to Alfa_OS_Brain Schema with ADAPTER PATTERN
 */
export const mockService = {
  
  // --- ONTOLOGY CONTEXT ---

  async getMatrices(): Promise<MatrixRegistry[]> {
    const { data, error } = await supabase
      .from('matrix_registry')
      .select(`
        id:matrix_code,
        code:matrix_code,
        name:matrix_code,
        type,
        total_assets_count:asset_count,
        efficiency_score:total_score
      `)
      .order('matrix_code', { ascending: true });
    
    if (error) throw error;
    return data as unknown as MatrixRegistry[];
  },

  async createMatrix(matrix: Partial<MatrixRegistry>): Promise<void> {
    const { error } = await supabase
      .from('matrix_registry')
      .insert({
        matrix_code: matrix.code,
        type: matrix.type,
      });
    
    if (error) throw error;
  },

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
    } catch (e) {
      console.warn("View access error", e);
      return { radar_monetization_ready: 0, radar_infrastructure_gap: 0, radar_ghost_assets: 0, radar_the_void: 0, radar_dust_cleaner: 0 };
    }
  },

  async getSystemHeartbeat() {
    const { data, error } = await supabase
      .from('ingestion_cycles')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
       console.error("Heartbeat Error", error);
       return { status: 'OFFLINE', started_at: new Date().toISOString(), records_processed: 0 };
    }

    return {
      status: data?.status || 'STANDBY',
      started_at: data?.started_at,
      records_processed: data?.items_processed || 0
    };
  },

  async getGlobalKPIs() {
    const [assets, nodes] = await Promise.all([
        supabase.from('business_assets').select('*', { count: 'exact', head: true }),
        supabase.from('pinterest_nodes').select('*', { count: 'exact', head: true })
    ]);

    return {
      total_assets: assets.count || 0,
      total_nodes: nodes.count || 0,
      efficiency_avg: 0 
    };
  },

  // --- TACTICAL SECTOR (VOID) ---

  async getOrphanedNodes(): Promise<PinterestNode[]> {
    // CORRECCIÓN 0 INCERTIDUMBRE: 
    // 1. Pedimos SOLO columnas reales (pin_id, title, etc) para evitar Error 400
    // 2. NO pedimos 'url' ni 'created_at' a la BD
    const { data, error } = await supabase
        .from('pinterest_nodes')
        .select(`
          pin_id,
          title,
          description,
          image_url,
          cached_impressions,
          cached_pin_clicks,
          cached_outbound_clicks
        `)
        .is('asset_sku', null)
        .limit(100); 

    if (error) throw error;

    // ADAPTADOR DE DATOS: Rellenamos lo que falta y mapeamos ID
    return (data || []).map((n: any) => ({
      id: n.pin_id,  // <--- LA CLAVE: Mapeamos pin_id a id para que React lo vea
      pin_id: n.pin_id,
      asset_sku: null,
      title: n.title,
      description: n.description,
      image_url: n.image_url,
      // Construimos URL falsa funcional
      url: `https://pinterest.com/pin/${n.pin_id}`, 
      // Métricas mapeadas de cached_ a nombres cortos
      impressions: n.cached_impressions || 0,
      saves: 0,
      outbound_clicks: n.cached_outbound_clicks || 0,
      // Fechas simuladas para evitar crash
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString()
    })) as PinterestNode[];
  },

  async getTacticalSilos(): Promise<BusinessAsset[]> {
     const { data, error } = await supabase
        .from('business_assets')
        .select(`
          sku,
          matrix_id:primary_matrix_id,
          name:sku, 
          tier:rarity_tier,
          score:total_score,
          monetization_link:payhip_link,
          description:drive_link,
          updated_at:last_audit_at
        `)
        .limit(50);
    
     if (error) throw error;
     // Forzamos status ACTIVE
     return (data || []).map(d => ({ ...d, status: AssetStatus.ACTIVE })) as unknown as BusinessAsset[];
  },

  async createAsset(asset: BusinessAsset): Promise<void> {
      const { error } = await supabase
          .from('business_assets')
          .insert({
             sku: asset.sku,
             primary_matrix_id: asset.matrix_id,
             rarity_tier: asset.tier,
          });
      if (error) throw error;
  },

  async searchAssets(query: string): Promise<BusinessAsset[]> {
    if (!query) return [];
    
    const { data, error } = await supabase
        .from('business_assets')
        .select(`
          sku,
          matrix_id:primary_matrix_id,
          name:sku,
          tier:rarity_tier,
          score:total_score
        `)
        .ilike('sku', `%${query}%`)
        .limit(20);

    if (error) throw error;
    return (data || []).map(d => ({ ...d, status: AssetStatus.ACTIVE })) as unknown as BusinessAsset[];
  },

  async getAssetDetails(sku: string): Promise<BusinessAsset | null> {
    const { data, error } = await supabase
        .from('business_assets')
        .select(`
          sku,
          matrix_id:primary_matrix_id,
          name:sku,
          tier:rarity_tier,
          score:total_score,
          monetization_link:payhip_link,
          updated_at:last_audit_at
        `)
        .eq('sku', sku)
        .single();
    
    if (error) return null;
    return { ...data, status: AssetStatus.ACTIVE } as unknown as BusinessAsset;
  },

  async assignNodesToAsset(nodeIds: string[], assetSku: string): Promise<boolean> {
      // Usamos 'pin_id' para el match en DB
      const { error } = await supabase
        .from('pinterest_nodes')
        .update({ asset_sku: assetSku })
        .in('pin_id', nodeIds); 

      if (error) throw error;
      return true;
  },

  async incinerateNodes(nodeIds: string[]): Promise<boolean> {
      // Usamos 'pin_id' para el borrado
      const { error } = await supabase
        .from('pinterest_nodes')
        .delete()
        .in('pin_id', nodeIds);
      
      if (error) throw error;
      return true;
  },

  async deleteAsset(sku: string): Promise<void> {
    const { error } = await supabase
        .from('business_assets')
        .delete()
        .eq('sku', sku);
    if (error) throw error;
  },

  // --- DEFENSE SECTOR (RADAR) ---

  async getMonetizationGaps(matrixId?: string | null): Promise<RadarMonetizationReady[]> {
    let query = supabase.from('radar_monetization_ready').select('*');
    if (matrixId) query = query.eq('matrix_id', matrixId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data as RadarMonetizationReady[];
  },

  async getInfrastructureGaps(matrixId?: string | null): Promise<RadarInfrastructureGap[]> {
    let query = supabase.from('radar_infrastructure_gap').select('*');
    if (matrixId) query = query.eq('matrix_id', matrixId);

    const { data, error } = await query;
    if (error) throw error;
    return data as RadarInfrastructureGap[];
  },

  async getGhostAssets(matrixId?: string | null): Promise<RadarGhostAssets[]> {
    let query = supabase.from('radar_ghost_assets').select('*');
    if (matrixId) query = query.eq('matrix_id', matrixId);

    const { data, error } = await query;
    if (error) throw error;
    return data as RadarGhostAssets[];
  },

  async patchAsset(sku: string, field: 'payhip' | 'drive', value: string): Promise<boolean> {
    const updatePayload: any = {};
    if (field === 'payhip') updatePayload.payhip_link = value;
    if (field === 'drive') updatePayload.drive_link = value;

    const { error } = await supabase
        .from('business_assets')
        .update(updatePayload)
        .eq('sku', sku);

    if (error) throw error;
    return true;
  },

  // --- STRATEGY SECTOR ---

  async getEliteAnalytics(orderBy: string = 'efficiency_index', ascending: boolean = false, matrixId?: string | null): Promise<ViewEliteAnalytics[]> {
    let query = supabase
        .from('view_elite_analytics')
        .select('*')
        .order(orderBy, { ascending });
    
    if (matrixId) query = query.eq('matrix_id', matrixId);

    const { data, error } = await query;
    if (error) throw error;
    return data as ViewEliteAnalytics[];
  },

  async getConversionAlerts(): Promise<RadarConversionAlert[]> {
      const { data, error } = await supabase.from('radar_conversion_alert').select('*'); 
      if (error) return [];
      return data as RadarConversionAlert[];
  }
};