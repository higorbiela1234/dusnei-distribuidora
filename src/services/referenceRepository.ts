import { requireSupabase } from './supabase';

export type CatalogSection = 'Empresas' | 'Unidades' | 'Departamentos' | 'Cargos';
export interface OrganizationRecord {
  id: string;
  name: string;
  code: string;
  company: string;
  department: string;
  city: string;
  state: string;
  detail: string;
  status: 'Ativo' | 'Inativo';
}
export type OrganizationInput = Omit<OrganizationRecord, 'id' | 'status'>;
export interface ProfileSummary { id: string; displayName: string; role: string; active: boolean }
export interface AuditSummary { id: string; actorId: string | null; occurredAt: string; action: string; module: string; recordId: string; previousData: unknown; newData: unknown }

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const referenceRepository = {
  async listProfiles(): Promise<ProfileSummary[]> {
    const { data, error } = await requireSupabase().from('profiles').select('id, display_name, role, active').order('display_name');
    throwIfError(error);
    return (data ?? []).map((row) => ({ id: row.id, displayName: row.display_name, role: row.role, active: row.active }));
  },

  async listAuditLogs(): Promise<AuditSummary[]> {
    const { data, error } = await requireSupabase().from('audit_logs').select('*').order('occurred_at', { ascending: false }).limit(200);
    throwIfError(error);
    return (data ?? []).map((row) => ({ id: row.id, actorId: row.actor_id, occurredAt: row.occurred_at, action: row.action, module: row.module, recordId: row.record_id, previousData: row.previous_data, newData: row.new_data }));
  },

  async list(): Promise<Record<CatalogSection, OrganizationRecord[]>> {
    const client = requireSupabase();
    const [companies, units, departments, positions] = await Promise.all([
      client.from('companies').select('*').order('trade_name'),
      client.from('units').select('*').order('name'),
      client.from('departments').select('*').order('name'),
      client.from('positions').select('*').order('name'),
    ]);
    for (const result of [companies, units, departments, positions]) throwIfError(result.error);
    const companyNames = new Map((companies.data ?? []).map((company) => [company.id, company.trade_name]));
    const departmentNames = new Map((departments.data ?? []).map((department) => [department.id, department.name]));
    return {
      Empresas: (companies.data ?? []).map((row) => ({ id: row.id, name: row.trade_name, code: row.tax_id, company: '', department: '', city: row.city, state: row.state, detail: row.legal_name, status: row.active ? 'Ativo' : 'Inativo' })),
      Unidades: (units.data ?? []).map((row) => ({ id: row.id, name: row.name, code: row.code, company: companyNames.get(row.company_id) ?? '', department: '', city: row.city, state: row.state, detail: '', status: row.active ? 'Ativo' : 'Inativo' })),
      Departamentos: (departments.data ?? []).map((row) => ({ id: row.id, name: row.name, code: row.code, company: '', department: '', city: '', state: '', detail: row.notes ?? '', status: row.active ? 'Ativo' : 'Inativo' })),
      Cargos: (positions.data ?? []).map((row) => ({ id: row.id, name: row.name, code: row.code, company: '', department: departmentNames.get(row.department_id) ?? '', city: '', state: '', detail: row.notes ?? '', status: row.active ? 'Ativo' : 'Inativo' })),
    };
  },

  async create(section: CatalogSection, input: OrganizationInput) {
    const client = requireSupabase();
    if (section === 'Empresas') {
      const { error } = await client.from('companies').insert({ legal_name: input.detail || input.name, trade_name: input.name, tax_id: input.code, city: input.city, state: input.state });
      throwIfError(error);
      return;
    }
    if (section === 'Unidades') {
      const { data: company, error: lookupError } = await client.from('companies').select('id').eq('trade_name', input.company).single();
      throwIfError(lookupError);
      if (!company) throw new Error(`Empresa "${input.company}" não encontrada.`);
      const { error } = await client.from('units').insert({ company_id: company.id, code: input.code, name: input.name, city: input.city, state: input.state });
      throwIfError(error);
      return;
    }
    if (section === 'Departamentos') {
      const { error } = await client.from('departments').insert({ code: input.code, name: input.name, notes: input.detail || null });
      throwIfError(error);
      return;
    }
    const { data: department, error: lookupError } = await client.from('departments').select('id').eq('name', input.department).single();
    throwIfError(lookupError);
    if (!department) throw new Error(`Departamento "${input.department}" não encontrado.`);
    const { error } = await client.from('positions').insert({ department_id: department.id, code: input.code, name: input.name, notes: input.detail || null });
    throwIfError(error);
  },

  async update(section: CatalogSection, record: OrganizationRecord) {
    const client = requireSupabase();
    const active = record.status === 'Ativo';
    if (section === 'Empresas') {
      const { error } = await client.from('companies').update({ legal_name: record.detail || record.name, trade_name: record.name, tax_id: record.code, city: record.city, state: record.state, active }).eq('id', record.id);
      throwIfError(error);
      return;
    }
    if (section === 'Unidades') {
      const { data: company, error: lookupError } = await client.from('companies').select('id').eq('trade_name', record.company).single();
      throwIfError(lookupError);
      if (!company) throw new Error(`Empresa "${record.company}" não encontrada.`);
      const { error } = await client.from('units').update({ company_id: company.id, code: record.code, name: record.name, city: record.city, state: record.state, active }).eq('id', record.id);
      throwIfError(error);
      return;
    }
    if (section === 'Departamentos') {
      const { error } = await client.from('departments').update({ code: record.code, name: record.name, notes: record.detail || null, active }).eq('id', record.id);
      throwIfError(error);
      return;
    }
    const { data: department, error: lookupError } = await client.from('departments').select('id').eq('name', record.department).single();
    throwIfError(lookupError);
    if (!department) throw new Error(`Departamento "${record.department}" não encontrado.`);
    const { error } = await client.from('positions').update({ department_id: department.id, code: record.code, name: record.name, notes: record.detail || null, active }).eq('id', record.id);
    throwIfError(error);
  },

  async delete(section: CatalogSection, id: string) {
    const client = requireSupabase();
    const table = section === 'Empresas' ? 'companies' : section === 'Unidades' ? 'units' : section === 'Departamentos' ? 'departments' : 'positions';
    const { error } = await client.from(table).delete().eq('id', id);
    throwIfError(error);
  },
};