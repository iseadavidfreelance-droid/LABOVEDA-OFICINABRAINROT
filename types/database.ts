/**
 * LABOVEDA DATABASE TYPES
 * Based on Manifesto Sensory v1.2 & Hierarchy: Matrix -> Asset -> Node
 * STRICT MODE: SKU IS PRIMARY KEY.
 */

// ------------------------------------------------------------------
// ENUMS
// ------------------------------------------------------------------

export type RarityTier = 'DUST' | 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  PURGED = 'PURGED',
  PENDING = 'PENDING'
}

// ------------------------------------------------------------------
// TABLES
// ------------------------------------------------------------------

/**
 * Matrix (Marca) - The top-level hierarchy entity.
 */
export interface MatrixRegistry {
  id: string;   // Mapeado desde 'matrix_code'
  name: string; // Mapeado desde 'matrix_code' (si no hay nombre explícito)
  code: string; // Mapeado desde 'matrix_code'
  type: 'PRIMARY' | 'SECONDARY';
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  total_assets_count: number; // Mapeado desde 'asset_count'
  efficiency_score: number;   // Mapeado desde 'total_score'
}

// ... (imports existentes)

// ... (Enums existentes: RarityTier, AssetStatus...)

// ... (Interface MatrixRegistry existente...)

/**
 * Business Asset (Producto) - The core unit of value.
 * PK: SKU (String)
 */
export interface BusinessAsset {
  sku: string; // PK
  matrix_id: string; // Mapeado desde 'primary_matrix_id'
  name: string;      // Mapeado desde 'sku' (si no hay columna name)
  description?: string; // Mapeado desde 'drive_link' o columna description
  main_image_url?: string;
  tier: RarityTier;   // Mapeado desde 'rarity_tier'
  score: number;      // Mapeado desde 'total_score'
  status: AssetStatus;
  created_at: string;
  updated_at: string;
  last_ingested_at?: string;
  monetization_link?: string; // Mapeado desde 'payhip_link'

  // ✅ INYECCIÓN QUIRÚRGICA 1: Propiedades para la Identidad de Matriz
  matrix_registry?: {
      visual_name: string;
  };
  matrix_name?: string; // Campo aplanado para la UI
}

/**
 * Pinterest Node (Pin) - The tactical endpoint/traffic source.
 * FK: asset_sku
 */
export interface PinterestNode {
  id: string; 
  asset_sku: string | null; 
  pin_id: string; 
  url: string;
  image_url: string;
  impressions: number;
  saves: number;
  outbound_clicks: number;
  created_at: string;
  updated_at: string;
}

/**
 * Ingestion Cycle - Logs of data synchronization.
 */
export interface IngestionCycle {
  id: string;
  started_at: string;
  ended_at?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  records_processed: number;
  log_summary?: string;
}

// ------------------------------------------------------------------
// VIEWS
// ------------------------------------------------------------------

export interface RadarMonetizationReady {
  sku: string;
  matrix_id: string;
  asset_name: string;
  matrix_name: string;
  current_score: number;
  tier: RarityTier;
  missing_field: 'LINK' | 'PRICE' | 'AVAILABILITY';
  potential_revenue_impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RadarInfrastructureGap {
  sku: string;
  matrix_id: string;
  asset_name: string;
  issue_type: 'MISSING_SKU' | 'NO_DESCRIPTION' | 'BROKEN_IMAGE';
  detected_at: string;
  days_open: number;
}

export interface RadarGhostAssets {
  sku: string;
  matrix_id: string;
  asset_name: string;
  created_at: string;
  days_since_creation: number;
  last_known_activity?: string;
}

export interface RadarTheVoid {
  sku: string;
  matrix_id: string;
  asset_name: string;
  node_count: number;
  total_impressions: number;
  total_clicks: number;
  dormant_days: number;
}

export interface RadarDustCleaner {
  sku: string;
  matrix_id: string;
  asset_name: string;
  score: number;
  tier: 'DUST';
  node_count: number;
  recommendation: 'PURGE' | 'ARCHIVE';
}

export interface ViewEliteAnalytics {
  sku: string;
  matrix_id: string;
  asset_name: string;
  tier: 'LEGENDARY' | 'RARE';
  traffic_score: number;
  revenue_score: number;
  efficiency_index: number;
  traffic_trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface RadarConversionAlert {
    sku: string;
}