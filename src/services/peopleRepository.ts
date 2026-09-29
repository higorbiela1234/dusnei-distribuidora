import type { DailyAllowanceRow, EmployeeRow } from '../types/database';
import type { DailyRecord, Employee } from '../types';
import { requireSupabase } from './supabase';

export type NewEmployee = Omit<Employee, 'id'>;
export type NewDailyRecord = Omit<DailyRecord, 'id'>;

export interface PeopleRepository {
  listEmployees(): Promise<Employee[]>;
  createEmployee(employee: NewEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: NewEmployee): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  listDailyRecords(): Promise<DailyRecord[]>;
  createDailyRecord(record: NewDailyRecord): Promise<DailyRecord>;
  updateDailyRecord(id: string, record: NewDailyRecord): Promise<DailyRecord>;
  deleteDailyRecord(id: string): Promise<void>;
}

type References = {
  companies: Map<string, { id: string; name: string }>;
  units: Map<string, { id: string; name: string; companyId: string }>;
  departments: Map<string, { id: string; name: string }>;
  positions: Map<string, { id: string; name: string; departmentId: string }>;
};

async function loadReferences(): Promise<References> {
  const client = requireSupabase();
  const [companies, units, departments, positions] = await Promise.all([
    client.from('companies').select('id, trade_name'),
    client.from('units').select('id, name, company_id'),
    client.from('departments').select('id, name'),
    client.from('positions').select('id, name, department_id'),
  ]);
  for (const result of [companies, units, departments, positions]) if (result.error) throw result.error;
  return {
    companies: new Map((companies.data ?? []).map((row) => [row.trade_name, { id: row.id, name: row.trade_name }])),
    units: new Map((units.data ?? []).map((row) => [row.name, { id: row.id, name: row.name, companyId: row.company_id }])),
    departments: new Map((departments.data ?? []).map((row) => [row.name, { id: row.id, name: row.name }])),
    positions: new Map((positions.data ?? []).map((row) => [row.name, { id: row.id, name: row.name, departmentId: row.department_id }])),
  };
}

function mapEmployee(row: EmployeeRow, refs: References): Employee {
  return {
    id: row.id,
    nome: row.full_name,
    cpf: row.cpf,
    dataNascimento: row.birth_date ?? '',
    matricula: row.employee_number,
    cargo: refs.positions.get(row.position_id ?? '')?.name ?? '',
    departamento: refs.departments.get(row.department_id ?? '')?.name ?? '',
    dataAdmissao: row.admission_date,
    empresa: refs.companies.get(row.company_id)?.name ?? '',
    unidade: refs.units.get(row.unit_id)?.name ?? '',
    status: row.status === 'active' ? 'Ativo' : 'Inativo',
    dataDesligamento: row.termination_date ?? undefined,
    foto: row.photo_path ?? undefined,
    observacoes: row.notes ?? undefined,
  };
}

async function employeePayload(employee: NewEmployee, refs: References) {
  const company = refs.companies.get(employee.empresa);
  if (!company) throw new Error(`Empresa "${employee.empresa}" não encontrada. Cadastre-a em Configurações antes do funcionário.`);
  const unit = refs.units.get(employee.unidade);
  if (!unit || unit.companyId !== company.id) throw new Error(`Unidade "${employee.unidade}" não encontrada ou vinculada a outra empresa.`);
  const department = refs.departments.get(employee.departamento);
  if (!department) throw new Error(`Departamento "${employee.departamento}" não encontrado. Cadastre-o em Configurações.`);
  const position = refs.positions.get(employee.cargo);
  if (!position || position.departmentId !== department.id) throw new Error(`Cargo "${employee.cargo}" não encontrado neste departamento.`);
  return {
    full_name: employee.nome.trim(),
    cpf: employee.cpf.replace(/\D/g, ''),
    birth_date: employee.dataNascimento || null,
    employee_number: employee.matricula.trim(),
    position_id: position.id,
    department_id: department.id,
    company_id: company.id,
    unit_id: unit.id,
    admission_date: employee.dataAdmissao,
    termination_date: employee.dataDesligamento || null,
    status: employee.status === 'Inativo' ? 'inactive' as const : 'active' as const,
    photo_path: employee.foto ?? null,
    notes: employee.observacoes ?? null,
  };
}

function mapDaily(row: DailyAllowanceRow, person: Employee | undefined): DailyRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    funcionario: person?.nome ?? 'Funcionário indisponível',
    cpf: person?.cpf ?? '',
    empresa: person?.empresa ?? '',
    unidade: person?.unidade ?? '',
    setor: person?.departamento ?? '',
    data: row.allowance_date,
    valor: Number(row.amount),
    codigoTransacao: row.transaction_code,
    observacoes: row.notes ?? undefined,
  };
}

async function dailyPayload(record: NewDailyRecord, refs: References) {
  const client = requireSupabase();
  const [employeeResult, company] = await Promise.all([
    (record.employeeId
      ? client.from('employees').select('id, department_id, unit_id, company_id').eq('id', record.employeeId).maybeSingle()
      : client.from('employees').select('id, department_id, unit_id, company_id').eq('cpf', record.cpf.replace(/\D/g, '')).maybeSingle()),
    Promise.resolve(refs.companies.get(record.empresa)),
  ]);
  if (employeeResult.error) throw employeeResult.error;
  if (!employeeResult.data) throw new Error(`Funcionário "${record.funcionario}" não encontrado.`);
  if (!company) throw new Error(`Empresa "${record.empresa}" não encontrada.`);
  const unit = refs.units.get(record.unidade);
  if (!unit || unit.companyId !== company.id) throw new Error(`Unidade "${record.unidade}" não encontrada para esta empresa.`);
  const department = refs.departments.get(record.setor);
  if (!department) throw new Error(`Departamento "${record.setor}" não encontrado.`);
  return {
    employeeId: employeeResult.data.id,
    employee_id: employeeResult.data.id,
    company_id: company.id,
    unit_id: unit.id,
    department_id: department.id,
    allowance_date: record.data,
    amount: record.valor,
    transaction_code: record.codigoTransacao.trim(),
    notes: record.observacoes ?? null,
  };
}

class SupabasePeopleRepository implements PeopleRepository {
  async listEmployees() {
    const client = requireSupabase();
    const [employees, refs] = await Promise.all([
      client.from('employees').select('*').order('full_name'),
      loadReferences(),
    ]);
    if (employees.error) throw employees.error;
    return (employees.data ?? []).map((row) => mapEmployee(row, refs));
  }

  async createEmployee(employee: NewEmployee) {
    const client = requireSupabase();
    const refs = await loadReferences();
    const { data, error } = await client.from('employees').insert(await employeePayload(employee, refs)).select('*').single();
    if (error) throw error;
    return mapEmployee(data, refs);
  }

  async updateEmployee(id: string, employee: NewEmployee) {
    const client = requireSupabase();
    const refs = await loadReferences();
    const { data, error } = await client.from('employees').update(await employeePayload(employee, refs)).eq('id', id).select('*').single();
    if (error) throw error;
    return mapEmployee(data, refs);
  }

  async deleteEmployee(id: string) {
    const { error } = await requireSupabase().from('employees').delete().eq('id', id);
    if (error) throw error;
  }

  async listDailyRecords() {
    const client = requireSupabase();
    const [allowances, people] = await Promise.all([
      client.from('daily_allowances').select('*').order('allowance_date', { ascending: false }),
      this.listEmployees(),
    ]);
    if (allowances.error) throw allowances.error;
    const byId = new Map(people.map((person) => [person.id, person]));
    return (allowances.data ?? []).map((row) => mapDaily(row, byId.get(row.employee_id)));
  }

  async createDailyRecord(record: NewDailyRecord) {
    const client = requireSupabase();
    const [refs, people] = await Promise.all([loadReferences(), this.listEmployees()]);
    const payload = await dailyPayload(record, refs);
    const { data, error } = await client.from('daily_allowances').insert(payload).select('*').single();
    if (error) throw error;
    return mapDaily(data, people.find((person) => person.id === payload.employee_id));
  }

  async updateDailyRecord(id: string, record: NewDailyRecord) {
    const client = requireSupabase();
    const [refs, people] = await Promise.all([loadReferences(), this.listEmployees()]);
    const payload = await dailyPayload(record, refs);
    const { data, error } = await client.from('daily_allowances').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return mapDaily(data, people.find((person) => person.id === payload.employee_id));
  }

  async deleteDailyRecord(id: string) {
    const { error } = await requireSupabase().from('daily_allowances').delete().eq('id', id);
    if (error) throw error;
  }
}

export const peopleRepository: PeopleRepository = new SupabasePeopleRepository();