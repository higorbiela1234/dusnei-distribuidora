export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row extends object, Insert extends object = Partial<Row>, Update extends object = Partial<Insert>> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Update & Record<string, unknown>;
  Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[];
};

type Timestamped = { created_at: string; updated_at: string };
type IdRow = { id: string };

export interface EmployeeRow extends IdRow, Timestamped {
  full_name: string;
  cpf: string;
  birth_date: string | null;
  employee_number: string;
  position_id: string | null;
  department_id: string | null;
  company_id: string;
  unit_id: string;
  admission_date: string;
  termination_date: string | null;
  status: 'active' | 'inactive';
  photo_path: string | null;
  notes: string | null;
  created_by: string | null;
}

export interface DailyAllowanceRow extends IdRow, Timestamped {
  employee_id: string;
  company_id: string;
  unit_id: string;
  department_id: string | null;
  allowance_date: string;
  amount: number;
  transaction_code: string;
  notes: string | null;
  created_by: string | null;
}

export interface PpeItemRow extends IdRow, Timestamped {
  name: string;
  code: string;
  category: string;
  certificate_number: string | null;
  size: string | null;
  quantity: number;
  minimum_stock: number;
  supplier: string | null;
  notes: string | null;
}

export interface ProfileRow extends IdRow, Timestamped {
  display_name: string;
  role: 'master' | 'admin' | 'hr' | 'payroll' | 'manager' | 'viewer';
  permissions: string[];
  active: boolean;
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Pick<ProfileRow, 'id' | 'display_name'>>;
      companies: Table<IdRow & Timestamped & { legal_name: string; trade_name: string; tax_id: string; city: string; state: string; active: boolean; notes: string | null }>;
      units: Table<IdRow & Timestamped & { company_id: string; code: string; name: string; city: string; state: string; active: boolean }>;
      departments: Table<IdRow & Timestamped & { code: string; name: string; active: boolean; notes: string | null }>;
      positions: Table<IdRow & Timestamped & { department_id: string; code: string; name: string; active: boolean; notes: string | null }>;
      employees: Table<EmployeeRow>;
      daily_allowances: Table<DailyAllowanceRow>;
      ppe_items: Table<PpeItemRow>;
      ppe_movements: Table<IdRow & { item_id: string; employee_id: string | null; kind: 'entry' | 'delivery' | 'return'; quantity: number; movement_date: string; certificate_number: string | null; size: string | null; reason: string | null; supplier: string | null; invoice_number: string | null; notes: string | null; created_by: string | null; created_at: string }>;
      badges: Table<IdRow & Timestamped & { employee_id: string; display_name: string; department_name: string; photo_path: string | null; active: boolean }>;
      occupational_exams: Table<IdRow & Timestamped & { employee_id: string; exam_date: string; exam_type: 'admission' | 'periodic' | 'return_to_work' | 'role_change' | 'termination' | 'other'; periodicity_months: number; next_exam_date: string; notes: string | null; document_path: string | null; created_by: string | null }>;
      medical_certificates: Table<IdRow & Timestamped & { employee_id: string; issued_at: string; start_date: string; end_date: string; return_date: string; day_count: number; cid_code: string | null; physician_name: string | null; crm: string | null; notes: string | null; document_path: string | null; created_by: string | null }>;
      disciplinary_records: Table<IdRow & Timestamped & { employee_id: string; record_date: string; record_type: 'verbal_warning' | 'written_warning' | 'suspension' | 'disciplinary_note' | 'other'; reason: string; description: string | null; notes: string | null; document_path: string | null; responsible_id: string; created_by: string | null }>;
      hr_processes: Table<IdRow & Timestamped & { employee_id: string; process_type: 'admission' | 'termination'; process_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'; requested_at: string; effective_date: string | null; notes: string | null; created_by: string | null }>;
      hr_checklist_items: Table<IdRow & Timestamped & { process_id: string; label: string; status: 'pending' | 'in_progress' | 'completed' | 'not_applicable'; sort_order: number; completed_at: string | null; responsible_id: string | null }>;
      audit_logs: Table<IdRow & { actor_id: string | null; occurred_at: string; action: string; module: string; record_id: string; previous_data: Json | null; new_data: Json | null }>;
    };
    Views: Record<string, never>;
    Functions: {
      current_app_role: { Args: Record<string, never>; Returns: string | null };
      has_any_role: { Args: { allowed_roles: string[] }; Returns: boolean };
      start_hr_process: { Args: { p_employee_id: string; p_process_type: 'admission' | 'termination'; p_default_items: string[] }; Returns: string };
      dashboard_summary: { Args: { p_company_id?: string | null; p_unit_id?: string | null; p_department_id?: string | null; p_position_id?: string | null; p_period_start?: string; p_period_end?: string }; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};