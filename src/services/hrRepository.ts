import { peopleRepository } from './peopleRepository';
import { requireSupabase } from './supabase';
import { uploadPrivateDocument } from './documentStorage';

export interface PpeItemRecord { id: string; nome: string; codigo: string; categoria: string; ca: string; tamanho: string; quantidade: number; minimo: number; fornecedor: string }
export interface PpeMovementRecord { id: string; tipo: 'Entrada' | 'Entrega' | 'Devolução'; epi: string; quantidade: number; data: string; funcionario: string; detalhe: string }
export interface AsoRecord { id: string; employeeId: string; funcionario: string; cpf: string; tipo: string; exame: string; meses: number; observacoes: string; documentoPath: string | null }
export interface CertificateRecord { id: string; employeeId: string; funcionario: string; data: string; inicio: string; fim: string; retorno: string; dias: number; cid: string; medico: string; crm: string; observacoes: string; documentoPath: string | null }
export interface DisciplinaryRecord { id: string; employeeId: string; funcionario: string; cpf: string; data: string; tipo: string; motivo: string; descricao: string; observacoes: string; responsavel: string; documentoPath: string | null }
export interface HrProcessRecord { id: string; employeeId: string; funcionario: string; tipo: 'admission' | 'termination'; status: string; data: string }
export interface ChecklistTask { id: string; processoId: string; nome: string; status: 'Pendente' | 'Em andamento' | 'Concluído' | 'Não aplicável'; ordem: number }

const movementToDb = { Entrada: 'entry', Entrega: 'delivery', Devolução: 'return' } as const;
const movementFromDb = { entry: 'Entrada', delivery: 'Entrega', return: 'Devolução' } as const;
const examToDb: Record<string, 'admission' | 'periodic' | 'return_to_work' | 'role_change' | 'termination' | 'other'> = {
  Admissional: 'admission', Periódico: 'periodic', 'Retorno ao trabalho': 'return_to_work', 'Mudança de risco/função': 'role_change', Demissional: 'termination', Outros: 'other',
};
const examFromDb: Record<string, string> = { admission: 'Admissional', periodic: 'Periódico', return_to_work: 'Retorno ao trabalho', role_change: 'Mudança de risco/função', termination: 'Demissional', other: 'Outros' };
const recordToDb: Record<string, 'verbal_warning' | 'written_warning' | 'suspension' | 'disciplinary_note' | 'other'> = {
  'Advertência verbal': 'verbal_warning', 'Advertência escrita': 'written_warning', Suspensão: 'suspension', 'Registro disciplinar': 'disciplinary_note', Outros: 'other',
};
const recordFromDb: Record<string, string> = { verbal_warning: 'Advertência verbal', written_warning: 'Advertência escrita', suspension: 'Suspensão', disciplinary_note: 'Registro disciplinar', other: 'Outros' };

function throwIfError(error: { message: string } | null) { if (error) throw new Error(error.message); }

export const hrRepository = {
  async listProcesses(kind: 'admission' | 'termination'): Promise<HrProcessRecord[]> {
    const client = requireSupabase();
    const [processes, people] = await Promise.all([client.from('hr_processes').select('*').eq('process_type', kind).order('created_at', { ascending: false }), peopleRepository.listEmployees()]);
    throwIfError(processes.error);
    const employeeNames = new Map(people.map((person) => [person.id, person.nome]));
    return (processes.data ?? []).map((row) => ({ id: row.id, employeeId: row.employee_id, funcionario: employeeNames.get(row.employee_id) ?? 'Funcionário removido', tipo: row.process_type, status: row.process_status, data: row.requested_at }));
  },

  async startProcess(employeeId: string, kind: 'admission' | 'termination', items: string[]) {
    const { data, error } = await requireSupabase().rpc('start_hr_process', { p_employee_id: employeeId, p_process_type: kind, p_default_items: items });
    throwIfError(error);
    return data;
  },

  async listChecklist(processId: string): Promise<ChecklistTask[]> {
    const { data, error } = await requireSupabase().from('hr_checklist_items').select('*').eq('process_id', processId).order('sort_order');
    throwIfError(error);
    const statusMap = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluído', not_applicable: 'Não aplicável' } as const;
    return (data ?? []).map((row) => ({ id: row.id, processoId: row.process_id, nome: row.label, status: statusMap[row.status], ordem: row.sort_order }));
  },

  async createChecklistItem(processId: string, label: string, sortOrder: number) {
    const { error } = await requireSupabase().from('hr_checklist_items').insert({ process_id: processId, label, sort_order: sortOrder });
    throwIfError(error);
  },

  async updateChecklistItem(task: ChecklistTask) {
    const statusMap = { Pendente: 'pending', 'Em andamento': 'in_progress', Concluído: 'completed', 'Não aplicável': 'not_applicable' } as const;
    const { error } = await requireSupabase().from('hr_checklist_items').update({ label: task.nome, sort_order: task.ordem, status: statusMap[task.status], completed_at: task.status === 'Concluído' ? new Date().toISOString() : null }).eq('id', task.id);
    throwIfError(error);
  },

  async deleteChecklistItem(id: string) {
    const { error } = await requireSupabase().from('hr_checklist_items').delete().eq('id', id);
    throwIfError(error);
  },

  async listPpeItems(): Promise<PpeItemRecord[]> {
    const { data, error } = await requireSupabase().from('ppe_items').select('*').order('name');
    throwIfError(error);
    return (data ?? []).map((row) => ({ id: row.id, nome: row.name, codigo: row.code, categoria: row.category, ca: row.certificate_number ?? '', tamanho: row.size ?? '', quantidade: row.quantity, minimo: row.minimum_stock, fornecedor: row.supplier ?? '' }));
  },

  async createPpeItem(item: Omit<PpeItemRecord, 'id'>) {
    const { error } = await requireSupabase().from('ppe_items').insert({ name: item.nome, code: item.codigo, category: item.categoria, certificate_number: item.ca || null, size: item.tamanho || null, quantity: item.quantidade, minimum_stock: item.minimo, supplier: item.fornecedor || null });
    throwIfError(error);
  },

  async listPpeMovements(): Promise<PpeMovementRecord[]> {
    const client = requireSupabase();
    const [movements, items, people] = await Promise.all([
      client.from('ppe_movements').select('*').order('movement_date', { ascending: false }),
      client.from('ppe_items').select('id, name'),
      peopleRepository.listEmployees(),
    ]);
    throwIfError(movements.error);
    throwIfError(items.error);
    const itemNames = new Map((items.data ?? []).map((item) => [item.id, item.name]));
    const peopleById = new Map(people.map((person) => [person.id, person.nome]));
    return (movements.data ?? []).map((row) => ({ id: row.id, tipo: movementFromDb[row.kind], epi: itemNames.get(row.item_id) ?? 'EPI removido', quantidade: row.quantity, data: row.movement_date, funcionario: row.employee_id ? peopleById.get(row.employee_id) ?? '' : '', detalhe: row.invoice_number ?? row.reason ?? row.supplier ?? row.certificate_number ?? '' }));
  },

  async createPpeMovement(input: { itemId: string; employeeId: string; kind: 'Entrada' | 'Entrega' | 'Devolução'; quantity: number; date: string; detail: string }) {
    const client = requireSupabase();
    const employeeId = input.kind === 'Entrada' ? null : input.employeeId;
    if (input.kind !== 'Entrada' && !employeeId) throw new Error('Selecione o funcionário da movimentação.');
    const { error } = await client.from('ppe_movements').insert({ item_id: input.itemId, employee_id: employeeId, kind: movementToDb[input.kind], quantity: input.quantity, movement_date: input.date, reason: input.kind === 'Entrada' ? null : input.detail || null, invoice_number: input.kind === 'Entrada' ? input.detail || null : null });
    throwIfError(error);
  },

  async listAso(): Promise<AsoRecord[]> {
    const client = requireSupabase();
    const [exams, people] = await Promise.all([client.from('occupational_exams').select('*').order('next_exam_date'), peopleRepository.listEmployees()]);
    throwIfError(exams.error);
    const byId = new Map(people.map((person) => [person.id, person]));
    return (exams.data ?? []).map((row) => ({ id: row.id, employeeId: row.employee_id, funcionario: byId.get(row.employee_id)?.nome ?? '', cpf: byId.get(row.employee_id)?.cpf ?? '', tipo: examFromDb[row.exam_type], exame: row.exam_date, meses: row.periodicity_months, observacoes: row.notes ?? '', documentoPath: row.document_path }));
  },

  async createAso(input: { employeeId: string; tipo: string; exame: string; meses: number; observacoes: string }, document?: File | null) {
    const client = requireSupabase();
    const { data, error } = await client.from('occupational_exams').insert({ employee_id: input.employeeId, exam_type: examToDb[input.tipo] ?? 'other', exam_date: input.exame, periodicity_months: input.meses, next_exam_date: nextExamDate(input.exame, input.meses), notes: input.observacoes || null }).select('id').single();
    throwIfError(error);
    if (!data) throw new Error('O banco não retornou o exame criado.');
    if (document) {
      const documentPath = await uploadPrivateDocument('aso', data.id, document);
      const { error: updateError } = await client.from('occupational_exams').update({ document_path: documentPath }).eq('id', data.id);
      throwIfError(updateError);
    }
  },

  async listCertificates(): Promise<CertificateRecord[]> {
    const client = requireSupabase();
    const [certificates, people] = await Promise.all([client.from('medical_certificates').select('*').order('start_date', { ascending: false }), peopleRepository.listEmployees()]);
    throwIfError(certificates.error);
    const byId = new Map(people.map((person) => [person.id, person.nome]));
    return (certificates.data ?? []).map((row) => ({ id: row.id, employeeId: row.employee_id, funcionario: byId.get(row.employee_id) ?? '', data: row.issued_at, inicio: row.start_date, fim: row.end_date, retorno: row.return_date, dias: row.day_count, cid: row.cid_code ?? '', medico: row.physician_name ?? '', crm: row.crm ?? '', observacoes: row.notes ?? '', documentoPath: row.document_path }));
  },

  async createCertificate(input: { employeeId: string; data: string; inicio: string; fim: string; cid: string; medico: string; crm: string; observacoes: string }, document?: File | null) {
    const client = requireSupabase();
    const { data, error } = await client.from('medical_certificates').insert({ employee_id: input.employeeId, issued_at: input.data, start_date: input.inicio, end_date: input.fim, cid_code: input.cid || null, physician_name: input.medico || null, crm: input.crm || null, notes: input.observacoes || null }).select('id').single();
    throwIfError(error);
    if (!data) throw new Error('O banco não retornou o atestado criado.');
    if (document) {
      const documentPath = await uploadPrivateDocument('medical-certificates', data.id, document);
      const { error: updateError } = await client.from('medical_certificates').update({ document_path: documentPath }).eq('id', data.id);
      throwIfError(updateError);
    }
  },

  async listDisciplinaryRecords(): Promise<DisciplinaryRecord[]> {
    const client = requireSupabase();
    const [records, people] = await Promise.all([client.from('disciplinary_records').select('*').order('record_date', { ascending: false }), peopleRepository.listEmployees()]);
    throwIfError(records.error);
    const byId = new Map(people.map((person) => [person.id, person]));
    return (records.data ?? []).map((row) => ({ id: row.id, employeeId: row.employee_id, funcionario: byId.get(row.employee_id)?.nome ?? '', cpf: byId.get(row.employee_id)?.cpf ?? '', data: row.record_date, tipo: recordFromDb[row.record_type], motivo: row.reason, descricao: row.description ?? '', observacoes: row.notes ?? '', responsavel: row.responsible_id, documentoPath: row.document_path }));
  },

  async createDisciplinaryRecord(input: { employeeId: string; data: string; tipo: string; motivo: string; descricao: string; observacoes: string }, document?: File | null) {
    const client = requireSupabase();
    const { data: auth, error: authError } = await client.auth.getUser();
    throwIfError(authError);
    if (!auth.user) throw new Error('Sessão expirada. Entre novamente.');
    const { data: record, error } = await client.from('disciplinary_records').insert({ employee_id: input.employeeId, record_date: input.data, record_type: recordToDb[input.tipo] ?? 'other', reason: input.motivo, description: input.descricao || null, notes: input.observacoes || null, responsible_id: auth.user.id }).select('id').single();
    throwIfError(error);
    if (!record) throw new Error('O banco não retornou o registro criado.');
    if (document) {
      const documentPath = await uploadPrivateDocument('disciplinary-records', record.id, document);
      const { error: updateError } = await client.from('disciplinary_records').update({ document_path: documentPath }).eq('id', record.id);
      throwIfError(updateError);
    }
  },
};

function nextExamDate(examDate: string, months: number) {
  const next = new Date(`${examDate}T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
}