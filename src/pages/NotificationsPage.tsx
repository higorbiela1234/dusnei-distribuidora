import { AlertTriangle, ArrowRight, BellRing, CalendarClock, FileWarning, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { getDashboardSummary, type DashboardSummary } from '../services/dashboardRepository';

const datePart = (date: Date) => date.toISOString().slice(0, 10);
const period = () => {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 30);
  return { periodStart: datePart(start), periodEnd: datePart(end) };
};

export function NotificationsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    void getDashboardSummary(period()).then((data) => { if (active) setSummary(data); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Falha ao carregar alertas.'); });
    return () => { active = false; };
  }, []);

  const alerts = summary ? [
    { key: 'aso-expired', title: 'ASO vencido', count: summary.aso_overdue, detail: 'Exames ocupacionais que precisam ser atualizados.', type: 'Urgente', path: '/rh', tone: 'danger' as const },
    { key: 'aso-due', title: 'ASO vencendo', count: summary.aso_due_15, detail: 'Exames com vencimento nos próximos 15 dias.', type: 'Saúde ocupacional', path: '/rh', tone: 'warning' as const },
    { key: 'ppe-low', title: 'Estoque de EPI baixo', count: summary.ppe_low_stock, detail: 'Itens no nível mínimo ou abaixo dele.', type: 'Estoque', path: '/epi', tone: 'warning' as const },
    { key: 'checklist', title: 'Checklist pendente', count: summary.checklist_pending, detail: 'Etapas de admissão ou desligamento aguardando conclusão.', type: 'Processos', path: '/rh', tone: 'primary' as const },
    { key: 'admission', title: 'Admissões em andamento', count: summary.admissions_open, detail: 'Processos de admissão ainda não concluídos.', type: 'Admissão', path: '/rh', tone: 'primary' as const },
    { key: 'termination', title: 'Demissões em andamento', count: summary.terminations_open, detail: 'Processos de desligamento ainda não concluídos.', type: 'Desligamento', path: '/rh', tone: 'neutral' as const },
  ].filter((alert) => alert.count > 0) : [];
  const asoCount = (summary?.aso_overdue ?? 0) + (summary?.aso_due_15 ?? 0);
  const pendingCount = (summary?.checklist_pending ?? 0) + (summary?.admissions_open ?? 0) + (summary?.terminations_open ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Central de alertas" title="Notificações" description="Alertas calculados a partir dos registros atuais do banco." />
      {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {[{ label: 'Alertas ativos', value: alerts.length, icon: BellRing }, { label: 'ASO', value: asoCount, icon: ShieldAlert }, { label: 'Processos pendentes', value: pendingCount, icon: FileWarning }].map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4"><Icon className="h-4 w-4 text-emerald-200" /><p className="mt-3 text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</p></article>)}
      </div>
      <section className="space-y-2">
        {alerts.map((alert) => <article key={alert.key} className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="mt-0.5 rounded-lg bg-slate-800 p-2 text-amber-200"><CalendarClock className="h-4 w-4" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-medium text-white">{alert.title}</h2><Badge tone={alert.tone}>{alert.count}</Badge><Badge tone="neutral">{alert.type}</Badge></div><p className="mt-1 text-sm text-slate-400">{alert.detail}</p></div></div><button type="button" onClick={() => navigate(alert.path)} className="inline-flex items-center gap-2 self-end text-xs text-emerald-200 hover:text-emerald-100 sm:self-auto">Abrir módulo<ArrowRight className="h-3.5 w-3.5" /></button></article>)}
        {summary && alerts.length === 0 && <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center"><AlertTriangle className="mx-auto h-5 w-5 text-emerald-200" /><p className="mt-3 text-sm text-slate-300">Nenhum alerta ativo nos dados disponíveis.</p></div>}
      </section>
      <p className="text-xs text-slate-500">Os alertas são agregados e não exibem dados pessoais nesta central.</p>
    </div>
  );
}