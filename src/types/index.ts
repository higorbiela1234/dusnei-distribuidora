export type Status = 'Ativo' | 'Inativo' | 'Pendente' | 'Em andamento' | 'Concluído' | 'Não aplicável';

export interface Employee {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  matricula: string;
  cargo: string;
  departamento: string;
  dataAdmissao: string;
  empresa: string;
  unidade: string;
  status: Status;
  dataDesligamento?: string;
  foto?: string;
  observacoes?: string;
}

export interface Company {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  cidade: string;
  estado: string;
  status: 'Ativo' | 'Inativo';
  observacoes?: string;
}

export interface Unit {
  id: number;
  codigo: string;
  empresa: string;
  nome: string;
  cidade: string;
  estado: string;
  status: 'Ativo' | 'Inativo';
}

export interface Department {
  id: number;
  nome: string;
  codigo: string;
  status: 'Ativo' | 'Inativo';
  observacoes?: string;
}

export interface Role {
  id: number;
  nome: string;
  codigo: string;
  departamento: string;
  status: 'Ativo' | 'Inativo';
  observacoes?: string;
}

export interface DashboardMetric {
  label: string;
  value: number;
  trend?: string;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  icon: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  detail: string;
  type: 'aso' | 'document' | 'admission' | 'termination' | 'stock' | 'checklist';
  createdAt: string;
}

export interface AuditLog {
  id: number;
  user: string;
  date: string;
  time: string;
  action: string;
  module: string;
  record: string;
  previousData: string;
  newData: string;
}

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

export interface DailyRecord {
  id: string;
  employeeId?: string;
  funcionario: string;
  cpf: string;
  empresa: string;
  unidade: string;
  setor: string;
  data: string;
  valor: number;
  codigoTransacao: string;
  observacoes?: string;
}

export type UserRole = 'Administrador Master' | 'Administrador' | 'RH' | 'Departamento Pessoal' | 'Gestor' | 'Consulta';
export type Permission = 'visualizar' | 'criar' | 'editar' | 'excluir' | 'importar' | 'exportar' | 'imprimir' | 'aprovar' | 'usuarios' | 'configuracoes' | 'documentos';

export interface UserAccount {
  id: string;
  nome: string;
  email: string;
  perfil: UserRole;
  permissoes: Permission[];
  ativo: boolean;
}

export interface DocumentReference {
  id: string;
  nome: string;
  mimeType: string;
  storageKey: string;
  uploadedAt: string;
}

export interface OccupationalExam {
  id: string;
  employeeId: string;
  dataExame: string;
  tipo: 'Admissional' | 'Periódico' | 'Retorno ao trabalho' | 'Mudança de risco/função' | 'Demissional' | 'Outros';
  periodicidadeMeses: number;
  proximoExame: string;
  observacoes?: string;
  documento?: DocumentReference;
}

export interface ChecklistStep {
  id: string;
  processoId: string;
  nome: string;
  status: Extract<Status, 'Pendente' | 'Em andamento' | 'Concluído' | 'Não aplicável'>;
  concluidoEm?: string;
  responsavelId?: string;
}

export interface PpeItem {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  ca: string;
  tamanho: string;
  quantidade: number;
  estoqueMinimo: number;
  fornecedor: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  occurredAt: string;
  action: string;
  module: string;
  recordId: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}
