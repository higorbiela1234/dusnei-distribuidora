import { BarChart3, Download, FileText, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { peopleRepository } from '../services/peopleRepository';
import type { DailyRecord, Employee } from '../types';
import { exportCsv } from '../utils/csv';

const reportTypes = ['Funcionários', 'Admissões', 'Demissões', 'ASO', 'Atestados', 'EPI', 'Diárias', 'Advertências', 'Documentos'];
const details: Record<string, string> = {
  Funcionários: 'Cadastro, vínculo, cargo, unidade e situação atual.', Admissões: 'Acompanhamento de cadastros em integração.',
  Demissões: 'Processos de desligamento e etapas pendentes.', ASO: 'Exames ocupacionais e datas de vencimento.',
  Atestados: 'Períodos de afastamento e retorno ao trabalho.', EPI: 'Estoque atual e movimentações de equipamentos.',
  Diárias: 'Lançamentos, valores e códigos de transação.', Advertências: 'Registros disciplinares por funcionário.',
  Documentos: 'Conferência e pendências de documentação.',
};

export function ReportsPage() {
  const [period, setPeriod] = useState('');
  const [notice, setNotice] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void Promise.all([peopleRepository.listEmployees(), peopleRepository.listDailyRecords()]).then(([people, records]) => {
      if (active) { setEmployees(people); setDailyRecords(records); }
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Falha ao consultar os dados para o relatório.'); });
    return () => { active = false; };
  }, []);
  const exportEmployees = () => exportCsv([
    { label: 'Nome', value: (employee: Employee) => employee.nome }, { label: 'CPF', value: (employee: Employee) => employee.cpf },
    { label: 'Matrícula', value: (employee: Employee) => employee.matricula }, { label: 'Cargo', value: (employee: Employee) => employee.cargo },
    { label: 'Departamento', value: (employee: Employee) => employee.departamento }, { label: 'Empresa', value: (employee: Employee) => employee.empresa },
    { label: 'Unidade', value: (employee: Employee) => employee.unidade }, { label: 'Admissão', value: (employee: Employee) => employee.dataAdmissao },
    { label: 'Status', value: (employee: Employee) => employee.status },
  ], employees, 'relatorio-funcionarios.csv');
  const exportDailies = () => exportCsv([
    { label: 'Funcionário', value: (record: DailyRecord) => record.funcionario }, { label: 'CPF', value: (record: DailyRecord) => record.cpf },
    { label: 'Unidade', value: (record: DailyRecord) => record.unidade }, { label: 'Setor', value: (record: DailyRecord) => record.setor },
    { label: 'Data', value: (record: DailyRecord) => record.data }, { label: 'Valor', value: (record: DailyRecord) => record.valor },
    { label: 'Código', value: (record: DailyRecord) => record.codigoTransacao },
  ], dailyRecords.filter((record) => !period || record.data >= period), 'relatorio-diarias.csv');
  const generate = (report: string) => {
    if (report === 'Funcionários') exportEmployees();
    else if (report === 'Diárias') exportDailies();
    else setNotice(`O modelo de ${report} está preparado. Conecte-o aos registros do módulo para gerar dados reais.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Análise e exportação" title="Relatórios" description="Selecione um módulo para preparar a impressão ou exportar os dados disponíveis." action={<Button variant="secondary" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir página</Button>} />
      <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2"><Input label="A partir de" type="date" value={period} onChange={(event) => setPeriod(event.target.value)} /><label className="text-xs text-slate-400">Formato disponível<span className="mt-1.5 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300">CSV (compatível com Excel) · impressão do navegador (PDF)</span></label></section>
      {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3 text-sm text-amber-100">{notice}</div>}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{reportTypes.map((report) => <article key={report} className="rounded-xl border border-slate-800 bg-slate-900/80 p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-white"><BarChart3 className="h-4 w-4 text-emerald-200" /><h2 className="font-medium">{report}</h2></div><FileText className="h-4 w-4 text-slate-500" /></div><p className="mt-3 min-h-10 text-sm text-slate-400">{details[report]}</p><div className="mt-4"><Button variant="secondary" size="sm" onClick={() => generate(report)}><Download className="mr-2 h-3.5 w-3.5" />{report === 'Funcionários' || report === 'Diárias' ? 'Exportar CSV' : 'Preparar relatório'}</Button></div></article>)}</section>
      <p className="text-xs leading-relaxed text-slate-500">Nesta demonstração, a exportação CSV está ativa para funcionários e diárias. Os demais relatórios são modelos visuais e dependem dos respectivos registros operacionais.</p>
    </div>
  );
}