export interface Commission {
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  pin_code?: string;
  color?: string;
  icon?: string;
}

export interface CommissionMember {
  user_id?: string;
  commission_code: string;
  member_role: 'membre' | 'chef';
  member_name?: string;
  member_phone?: string;
  email?: string;
}

export interface CommissionIndicator {
  id: string;
  commission_code: string;
  indicator_key: string;
  label: string;
  unit?: string;
  sort_order: number;
  is_active: boolean;
}

export interface DailyReport {
  id: string;
  commission_code: string;
  report_date: string; // YYYY-MM-DD
  done?: string;
  remaining?: string;
  perspectives?: string;
  difficulties?: string;
  status: 'brouillon' | 'soumis';
  submitted_at?: string;
  submitted_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReportMetric {
  report_id: string;
  indicator_id: string;
  value: number;
}

export interface ReportItem {
  id: string;
  report_id: string;
  kind: 'consommation' | 'manque' | 'depense';
  label: string;
  quantity?: number;
  unit?: string;
  amount_fcfa?: number;
  created_at?: string;
}

export interface CommissionNeed {
  id: string;
  commission_code: string;
  target_commission?: string | null; // null = coordination
  title: string;
  details?: string;
  quantity?: number;
  unit?: string;
  urgency: 'normale' | 'haute' | 'critique';
  needed_by?: string; // YYYY-MM-DD
  status: 'ouvert' | 'pris_en_charge' | 'satisfait' | 'annule';
  status_note?: string;
  created_by_name?: string;
  resolved_at?: string;
  resolved_by_name?: string;
  created_at: string;
  updated_at?: string;
}
