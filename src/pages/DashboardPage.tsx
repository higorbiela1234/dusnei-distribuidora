import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BadgeAlert, BriefcaseBusiness,
  CalendarDays, Clock3, FilePlus2, FileWarning, Package, PackageCheck, ReceiptText, ShieldCheck,
  UserCheck, UserMinus, Users, UserX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { dashboardMetrics } from '../data/mockData';
import { getDashboardSummary, type DashboardSummary } from '../services/dashboardRepository';
import { referenceRepository } from '../services/referenceRepository';

const icons: Record<string, LucideIcon> = {
  Users, UserCheck, UserX, FilePlus: FilePlus2, UserMinus, ShieldCheck, Clock3, ClipboardPlus: Activity,
  BriefcaseBusiness, FileWarning, PackageCheck, Package, ReceiptText, TriangleAlert: BadgeAlert,
};
const valueKeys: Record<string, keyof DashboardSummary> = {
  'Total de funcionários': 'employee_total', 'Funcionários ativos': 'employee_active', 'Funcionários inativos': 'employee_inactive',
  'Admissões recentes': 'admissions_recent', 'Demissões recentes': 'terminations_recent', 'ASOs em dia': 'aso_current',
  'ASOs vencendo': 'aso_due_45', 'ASOs vencidos': 'aso_overdue', 'Atestados recentes': 'certificates_recent',
  'Admissões em andamento': 'admissions_open', 'Demissões em andamento': 'terminations_open', 'EPI em estoque': 'ppe_stock_total',
  'EPI entregues': 'ppe_delivered_total', 'Diárias no período': 'daily_period_count', 'Advertências recentes': 'warnings_recent',
};
const periods = ['Últimos 30 dias', 'Este trimestre', 'Este ano'];
const datePart = (date: Date) => date.toISOString().slice(0, 10);
const periodRange = (period: string) => {
  const end = new Date();
  const start = new Date();
  if (period === 'Este ano') start.setUTCMonth(0, 1);
  else if (period === 'Este trimestre') start.setUTCMonth(Math.floor(start.getUTCMonth() / 3) * 3, 1);
  else start.setUTCDate(start.getUTCDate() - 30);
  return { periodStart: datePart(start), periodEnd: datePart(end) };
};

export function DashboardPage() {
  const [catalogs, setCatalogs] = useState<Awaited<ReturnType<typeof referenceRepository.list>> | null>(null);
  const [summaryResult, setSummaryResult] = useState<{ key: string; data: DashboardSummary } | null>(null);
  const [selected, setSelected] = useState({ company: '', unit: '', department: '', position: '', period: periods[0] });
  const [catalogError, setCatalogError] = useState('');
  const [summaryError, setSummaryError] = useState<{ key: string; message: string } | null>(null);
  const { periodStart, periodEnd } = periodRange(selected.period);
  const requestKey = [selected.company, selected.unit, selected.department, selected.position, selected.period].join('|');
  const summary = summaryResult?.key === requestKey ? summaryResult.data : null;
  const error = catalogError || (summaryError?.key === requestKey ? summaryError.message : '');
  const loading = !summary && !error;

  useEffect(() => {
    let active = true;
    void referenceRepository.list().then((data) => { if (active) setCatalogs(data); }).catch((reason: unknown) => { if (active) setCatalogError(reason instanceof Error ? reason.message : 'Falha ao carregar filtros.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void getDashboardSummary({ companyId: selected.company, unitId: selected.unit, departmentId: selected.department, positionId: selected.position, periodStart, periodEnd }).then((data) => {
      if (active) { setSummaryResult({ key: requestKey, data }); setSummaryError(null); }
    }).catch((reason: unknown) => { if (active) setSummaryError({ key: requestKey, message: reason instanceof Error ? reason.message : 'Falha ao consultar os indicadores.' }); });
    return () => { active = false; };
  }, [selected.company, selected.unit, selected.department, selected.position, selected.period, periodStart, periodEnd, requestKey]);

  const cards = dashboardMetrics.map((metric) => ({ ...metric, value: summary?.[valueKeys[metric.label]] ?? 0 }));
  const maxMovement = Math.max(summary?.admissions_recent ?? 0, summary?.terminations_recent ?? 0, 1);
  const alerts = [
    { label: 'ASOs vencidos', value: `${summary?.aso_overdue ?? 0} pessoas`, icon: ShieldCheck },
    { label: 'Estoque abaixo do mínimo', value: `${summary?.ppe_low_stock ?? 0} itens`, icon: Package },
    { label: 'Checklist pendente', value: `${summary?.checklist_pending ?? 0} etapas`, icon: BriefcaseBusiness },
  ];

  const renderSelect = (key: 'company' | 'unit' | 'department' | 'position', label: string, items: { id: string; name: string }[], allLabel: string) => (
    <label className="text-xs font-medium text-slate-400">{label}<select value={selected[key]} onChange={(event) => setSelected((current) => ({ ...current, [key]: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"><option value="">{allLabel}</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Visão geral · Departamento pessoal" title="Dashboard" description="Indicadores agregados do banco, respeitando os filtros e o perfil de acesso." action={<Badge tone={error ? 'warning' : 'success'}><span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${error ? 'bg-amber-300' : 'bg-emerald-300'}`} />{loading ? 'Consultando banco' : error ? 'Falha de conexão' : 'Banco conectado'}</Badge>} />
      {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
      <section aria-label="Filtros do painel" className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {renderSelect('company', 'Empresa', catalogs?.Empresas ?? [], 'Todas')}
        {renderSelect('unit', 'Unidade', catalogs?.Unidades ?? [], 'Todas')}
        {renderSelect('department', 'Departamento', catalogs?.Departamentos ?? [], 'Todos')}
        {renderSelect('position', 'Cargo', catalogs?.Cargos ?? [], 'Todos')}
        <label className="text-xs font-medium text-slate-400">Período<select value={selected.period} onChange={(event) => setSelected((current) => ({ ...current, period: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none">{periods.map((period) => <option key={period}>{period}</option>)}</select></label>
      </section>
      <section aria-label="Indicadores de RH" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {cards.map((metric, index) => { const Icon = icons[metric.icon] ?? Users; const isAlert = metric.tone === 'danger' || metric.tone === 'warning'; return <article key={metric.label} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="min-h-8 text-xs leading-4 text-slate-400">{metric.label}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-white">{(summary?.[valueKeys[metric.label]] ?? 0).toLocaleString('pt-BR')}</p></div><span className={`rounded-lg p-2 ${isAlert ? 'bg-amber-300/10 text-amber-200' : 'bg-emerald-300/10 text-emerald-200'}`}><Icon className="h-4 w-4" /></span></div><div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5 text-[11px]"><span className="text-slate-500">{selected.period}</span><span className={isAlert ? 'text-amber-200' : 'text-emerald-200'}>{index % 2 ? <ArrowUpRight className="mr-0.5 inline h-3 w-3" /> : <ArrowDownRight className="mr-0.5 inline h-3 w-3" />}Banco de dados</span></div></article>; })}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-white">Movimentação de pessoal</h2><p className="mt-1 text-xs text-slate-400">Admissões e desligamentos no período filtrado</p></div><Badge tone="neutral">{selected.period}</Badge></div><div className="mt-6 grid h-48 grid-cols-2 items-end gap-8 px-4 sm:px-12">{[{ label: 'Admissões', count: summary?.admissions_recent ?? 0, color: 'bg-emerald-400' }, { label: 'Desligamentos', count: summary?.terminations_recent ?? 0, color: 'bg-amber-300' }].map((item) => <div key={item.label} className="flex h-full flex-col items-center justify-end gap-2"><span className="text-sm font-semibold tabular-nums text-white">{item.count}</span><div className={`w-full max-w-24 rounded-t-sm ${item.color}`} style={{ height: `${Math.max(item.count ? 12 : 0, item.count / maxMovement * 100)}%` }} /><span className="text-xs text-slate-400">{item.label}</span></div>)}</div></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-white">Atenção necessária</h2><p className="mt-1 text-xs text-slate-400">Itens que pedem acompanhamento</p></div><AlertTriangle className="h-4 w-4 text-amber-200" /></div><div className="mt-5 space-y-3">{alerts.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 last:border-0 last:pb-0"><span className="flex items-center gap-2 text-sm text-slate-300"><Icon className="h-4 w-4 text-slate-500" />{label}</span><span className="text-xs text-amber-200">{value}</span></div>)}</div></article>
      </section>
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs leading-relaxed text-slate-400"><CalendarDays className="mr-2 inline h-4 w-4 text-emerald-300" />O painel recebe apenas contagens agregadas. Informações pessoais são consultadas separadamente pelas páginas autorizadas.</section>
    </div>
  );
}