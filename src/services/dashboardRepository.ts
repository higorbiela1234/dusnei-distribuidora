import { requireSupabase } from './supabase';

export type DashboardSummary = {
  employee_total: number;
  employee_active: number;
  employee_inactive: number;
  admissions_recent: number;
  terminations_recent: number;
  aso_current: number;
  aso_due_45: number;
  aso_due_15: number;
  aso_overdue: number;
  certificates_recent: number;
  admissions_open: number;
  terminations_open: number;
  ppe_stock_total: number;
  ppe_delivered_total: number;
  daily_period_count: number;
  daily_period_amount: number;
  warnings_recent: number;
  ppe_low_stock: number;
  checklist_pending: number;
};

export interface DashboardFilters {
  companyId?: string;
  unitId?: string;
  departmentId?: string;
  positionId?: string;
  periodStart: string;
  periodEnd: string;
}

export async function getDashboardSummary(filters: DashboardFilters): Promise<DashboardSummary> {
  const { data, error } = await requireSupabase().rpc('dashboard_summary', {
    p_company_id: filters.companyId || null,
    p_unit_id: filters.unitId || null,
    p_department_id: filters.departmentId || null,
    p_position_id: filters.positionId || null,
    p_period_start: filters.periodStart,
    p_period_end: filters.periodEnd,
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('O banco retornou um resumo inválido.');
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, Number(value)])) as DashboardSummary;
}