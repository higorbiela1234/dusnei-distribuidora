import type { AuditLog, Company, DashboardMetric, Department, DailyRecord, Employee, NotificationItem, Role, Unit } from '../types';

export const companies: Company[] = [
  { id: 1, razaoSocial: 'Dusnei Distribuidora Ltda', nomeFantasia: 'Dusnei Distribuidora', cnpj: '12.345.678/0001-90', cidade: 'Maringá', estado: 'PR', status: 'Ativo', observacoes: 'Matriz' },
  { id: 2, razaoSocial: 'Dusnei Distribuidora Unidade Osvaldo Cruz', nomeFantasia: 'Dusnei Osvaldo Cruz', cnpj: '12.345.678/0002-71', cidade: 'Osvaldo Cruz', estado: 'SP', status: 'Ativo', observacoes: 'Filial regional' },
  { id: 3, razaoSocial: 'Dusnei Distribuidora Unidade Cambé', nomeFantasia: 'Dusnei Cambé', cnpj: '12.345.678/0003-52', cidade: 'Cambé', estado: 'PR', status: 'Ativo' },
];

export const units: Unit[] = [
  { id: 1, codigo: '01', empresa: 'Dusnei Distribuidora', nome: 'Dusnei / Maringá', cidade: 'Maringá', estado: 'PR', status: 'Ativo' },
  { id: 2, codigo: '02', empresa: 'Dusnei Distribuidora', nome: 'Dusnei / Osvaldo Cruz', cidade: 'Osvaldo Cruz', estado: 'SP', status: 'Ativo' },
  { id: 3, codigo: '03', empresa: 'Dusnei Distribuidora', nome: 'Dusnei / Cambé', cidade: 'Cambé', estado: 'PR', status: 'Ativo' },
  { id: 4, codigo: '04', empresa: 'Dusnei Distribuidora', nome: 'Dusnei / Curitiba', cidade: 'Curitiba', estado: 'PR', status: 'Ativo' },
  { id: 5, codigo: '05', empresa: 'Dusnei Distribuidora', nome: 'Dusnei / Cascavel', cidade: 'Cascavel', estado: 'PR', status: 'Ativo' },
];

export const departments: Department[] = [
  { id: 1, nome: 'Recursos Humanos', codigo: 'RH', status: 'Ativo', observacoes: 'Gestão de pessoas' },
  { id: 2, nome: 'Expedição', codigo: 'EXP', status: 'Ativo', observacoes: 'Movimentação de cargas' },
  { id: 3, nome: 'Transportes', codigo: 'TRN', status: 'Ativo' },
  { id: 4, nome: 'Financeiro', codigo: 'FIN', status: 'Ativo' },
  { id: 5, nome: 'Operações', codigo: 'OPS', status: 'Ativo' },
];

export const roles: Role[] = [
  { id: 1, nome: 'Analista de RH', codigo: 'RH-01', departamento: 'Recursos Humanos', status: 'Ativo' },
  { id: 2, nome: 'Operador de Logística', codigo: 'LOG-01', departamento: 'Expedição', status: 'Ativo' },
  { id: 3, nome: 'Motorista Entregador', codigo: 'TRN-01', departamento: 'Transportes', status: 'Ativo' },
  { id: 4, nome: 'Supervisor de Operações', codigo: 'OPS-01', departamento: 'Operações', status: 'Ativo' },
];

export const employees: Employee[] = [
  { id: 'demo-employee-1', nome: 'Carlos Silva', cpf: '123.456.789-01', dataNascimento: '1990-05-18', matricula: '00101', cargo: 'Operador de Logística', departamento: 'Expedição', dataAdmissao: '2023-02-01', empresa: 'Dusnei Distribuidora', unidade: 'Maringá', status: 'Ativo', observacoes: 'Sem pendências' },
  { id: 'demo-employee-2', nome: 'Ana Souza', cpf: '234.567.890-02', dataNascimento: '1994-11-10', matricula: '00102', cargo: 'Analista de RH', departamento: 'Recursos Humanos', dataAdmissao: '2022-07-15', empresa: 'Dusnei Distribuidora', unidade: 'Maringá', status: 'Ativo', observacoes: 'ASO em dia' },
  { id: 'demo-employee-3', nome: 'Marcos Oliveira', cpf: '345.678.901-03', dataNascimento: '1988-09-24', matricula: '00201', cargo: 'Motorista Entregador', departamento: 'Transportes', dataAdmissao: '2021-03-12', empresa: 'Dusnei Distribuidora', unidade: 'Osvaldo Cruz', status: 'Ativo', observacoes: 'Viagens regionais' },
  { id: 'demo-employee-4', nome: 'Laura Mendes', cpf: '456.789.012-04', dataNascimento: '1992-02-08', matricula: '00310', cargo: 'Supervisor de Operações', departamento: 'Operações', dataAdmissao: '2020-11-05', empresa: 'Dusnei Distribuidora', unidade: 'Cambé', status: 'Inativo', dataDesligamento: '2025-05-17', observacoes: 'Registro encerrado' },
];

export const dailyRecords: DailyRecord[] = [
  { id: 'demo-daily-1', funcionario: 'Marcos Oliveira', cpf: '345.678.901-03', empresa: 'Dusnei Distribuidora', unidade: 'Osvaldo Cruz', setor: 'Transportes', data: '2026-08-15', valor: 150.0, codigoTransacao: 'TRN-20260815-001', observacoes: 'Viagem de entrega regional' },
  { id: 'demo-daily-2', funcionario: 'Carlos Silva', cpf: '123.456.789-01', empresa: 'Dusnei Distribuidora', unidade: 'Maringá', setor: 'Expedição', data: '2026-08-18', valor: 220.0, codigoTransacao: 'EXP-20260818-002', observacoes: 'Apoio em logística interna' },
  { id: 'demo-daily-3', funcionario: 'Ana Souza', cpf: '234.567.890-02', empresa: 'Dusnei Distribuidora', unidade: 'Maringá', setor: 'Recursos Humanos', data: '2026-08-19', valor: 180.0, codigoTransacao: 'RH-20260819-003', observacoes: 'Atendimento interno' },
];

export const dashboardMetrics: DashboardMetric[] = [
  { label: 'Total de funcionários', value: 128, trend: '+8.2%', tone: 'primary', icon: 'Users' },
  { label: 'Funcionários ativos', value: 114, trend: '+5.1%', tone: 'success', icon: 'UserCheck' },
  { label: 'Funcionários inativos', value: 14, trend: '-1.4%', tone: 'warning', icon: 'UserX' },
  { label: 'Admissões recentes', value: 6, trend: '+2', tone: 'neutral', icon: 'FilePlus' },
  { label: 'Demissões recentes', value: 3, trend: '-1', tone: 'danger', icon: 'UserMinus' },
  { label: 'ASOs em dia', value: 98, trend: '94%', tone: 'success', icon: 'ShieldCheck' },
  { label: 'ASOs vencendo', value: 9, trend: '7 dias', tone: 'warning', icon: 'Clock3' },
  { label: 'ASOs vencidos', value: 5, trend: 'Urgente', tone: 'danger', icon: 'AlertTriangle' },
  { label: 'Atestados recentes', value: 11, trend: '2 novas', tone: 'neutral', icon: 'ClipboardPlus' },
  { label: 'Admissões em andamento', value: 4, trend: '2.5%', tone: 'primary', icon: 'BriefcaseBusiness' },
  { label: 'Demissões em andamento', value: 2, trend: '1 hoje', tone: 'warning', icon: 'FileWarning' },
  { label: 'EPI em estoque', value: 1240, trend: '82%', tone: 'success', icon: 'PackageCheck' },
  { label: 'EPI entregues', value: 968, trend: '76%', tone: 'primary', icon: 'Package' },
  { label: 'Diárias no período', value: 18, trend: 'R$ 3.420', tone: 'neutral', icon: 'ReceiptText' },
  { label: 'Advertências recentes', value: 7, trend: '+3', tone: 'danger', icon: 'TriangleAlert' },
];

export const notifications: NotificationItem[] = [
  { id: 1, title: 'ASO vencendo', detail: '5 colaboradores com exame em até 15 dias.', type: 'aso', createdAt: '2026-09-25T09:14:00' },
  { id: 2, title: 'Checklist pendente', detail: '2 admissões aguardando conferência final.', type: 'checklist', createdAt: '2026-09-26T10:25:00' },
  { id: 3, title: 'EPI com estoque baixo', detail: 'Capacete e luvas em nível crítico.', type: 'stock', createdAt: '2026-09-27T07:40:00' },
  { id: 4, title: 'Documento pendente', detail: '3 documentos de contratação não anexados.', type: 'document', createdAt: '2026-09-27T11:05:00' },
];

export const auditLogs: AuditLog[] = [
  { id: 1, user: 'Higor Biela', date: '2026-09-27', time: '08:00', action: 'Criação', module: 'Funcionários', record: 'Carlos Silva', previousData: 'N/A', newData: 'Cadastro inicial' },
  { id: 2, user: 'Maria Souza', date: '2026-09-27', time: '09:20', action: 'Edição', module: 'EPI', record: 'Luvas de Nitrila', previousData: 'Estoque 120', newData: 'Estoque 90' },
  { id: 3, user: 'João Costa', date: '2026-09-28', time: '13:45', action: 'Aprovação', module: 'Admissões', record: 'Checklist de integração', previousData: 'Pendente', newData: 'Concluído' },
];
