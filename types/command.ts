// types/command.ts

// Mapeo exacto de 'view_matrix_leaderboard'
export interface MatrixMetric {
  matrix_code: string;
  total_score: number;
  efficiency_index: number; // o efficiency_rate según tu DB
  asset_count: number;
  revenue: number;
}

// Mapeo exacto de 'system_hyperparameters' y contadores globales
export interface SystemVitals {
  global_score: number;
  active_nodes: number;
  total_revenue: number;
  last_sync: string;
}

// Mapeo de cualquier item de radar (The Void, Monetization Gap, etc)
export interface TacticalThreat {
  id: string; // sku o pin_id
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  source_view: string;
  timestamp: string;
}

// Estado de la carga de datos
export interface CommandState {
  matrices: MatrixMetric[];
  vitals: SystemVitals;
  threats: TacticalThreat[];
  loading: boolean;
  error: string | null;
}