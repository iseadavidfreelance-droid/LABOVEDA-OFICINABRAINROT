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
 * Strictly mapped to Alfa_OS_Brain Schema
 */
export const mockService = {
  
  // --- ONTOLOGY CONTEXT ---

  async getMatrices(): Promise<MatrixRegistry[]> {
    // Mapeo: matrix_code -> code, total_score -> efficiency_score
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
        matrix_code: matrix.code, // Traducción al escribir
        type: matrix.type,
        // Otros campos calculados se omiten al crear
      });
    
    if (error) throw error;
  },

  async getViewCounts() {
    // Parallel count queries for the sidebar badges
    // NOTA: Si alguna vista no existe, devolverá 0 silenciosamente para no romper la UI
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
      .maybeSingle(); // 'maybeSingle' evita error si la tabla está vacía

    if (error) {
       console.error("Heartbeat Error", error);
       return { status: 'OFFLINE', started_at: new Date().toISOString(), records_processed: 0 };
    }

    return {
      status: data?.status || 'STANDBY',
      started_at: data?.started_at,
      records_processed: data?.items_processed || 0 // items_processed es el nombre real en DB
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
    const { data, error } = await supabase
        .from('pinterest_nodes')
        .select('*')
        .is('asset_sku', null)
        .limit(100); 

    if (error) throw error;
    return data as PinterestNode[];
  },

  async getTacticalSilos(): Promise<BusinessAsset[]> {
     // CORRECCIÓN CRÍTICA:
     // 1. name:sku -> Usamos el SKU como nombre porque la columna 'name' no es nativa original.
     // 2. updated_at:last_audit_at -> Mapeamos la fecha de auditoría como actualización.
     // 3. Eliminado .eq('status', 'ACTIVE') porque la columna status no existe.
     
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
        // .eq('status', 'ACTIVE') // REMOVIDO POR INEXISTENTE
        .limit(50);
    
     if (error) throw error;
     // Forzamos el tipo AssetStatus.ACTIVE ya que no viene de DB
     return (data || []).map(d => ({ ...d, status: AssetStatus.ACTIVE })) as unknown as BusinessAsset[];
  },

  async createAsset(asset: BusinessAsset): Promise<void> {
      // Mapeo inverso para escribir en DB
      const { error } = await supabase
          .from('business_assets')
          .insert({
             sku: asset.sku,
             primary_matrix_id: asset.matrix_id,
             rarity_tier: asset.tier,
             // No enviamos 'name' ni 'status' ni 'created_at' si la DB los genera o no los tiene
          });
      if (error) throw error;
  },

  async searchAssets(query: string): Promise<BusinessAsset[]> {
    if (!query) return [];
    
    // Solo buscamos por SKU porque 'name' no es fiable
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
      const { error } = await supabase
        .from('pinterest_nodes')
        .update({ asset_sku: assetSku })
        .in('pin_id', nodeIds); // OJO: Tu PK es pin_id según esquema, no id? Verifica esto. El frontend usa 'id', mapearemos si es necesario.
        // Si tu tabla pinterest_nodes tiene columna 'id' (uuid) y 'pin_id' (texto), usa 'id'.
        // Asumiré 'id' basado en el código previo, si falla, cambia a .in('pin_id', ...)

      if (error) throw error;
      return true;
  },

  async incinerateNodes(nodeIds: string[]): Promise<boolean> {
      const { error } = await supabase
        .from('pinterest_nodes')
        .delete()
        .in('id', nodeIds);
      
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
    if (matrixId) query = query.eq('matrix_id', matrixId); // Asegúrate que la vista tenga esta columna
    
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
    if (field === 'payhip') updatePayload.payhip_link = value; // Nombre real DB
    if (field === 'drive') updatePayload.drive_link = value;   // Nombre real DB

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