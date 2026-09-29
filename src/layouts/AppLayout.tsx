import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  ChartColumn,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { peopleRepository } from '../services/peopleRepository';
import { useAuth } from '../contexts/auth';
import { getDashboardSummary } from '../services/dashboardRepository';
import type { Employee } from '../types';

const roleLabels = { master: 'Administrador master', admin: 'Administrador', hr: 'RH', payroll: 'Departamento pessoal', manager: 'Gestor', viewer: 'Consulta' } as const;

const menuItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Funcionários', path: '/funcionarios', icon: Users },
  { label: 'RH', path: '/rh', icon: BriefcaseBusiness },
  { label: 'EPI', path: '/epi', icon: Package },
  { label: 'Diárias', path: '/diarias', icon: ReceiptText },
  { label: 'Crachás', path: '/crachas', icon: BadgeCheck },
  { label: 'Relatórios', path: '/relatorios', icon: ChartColumn },
  { label: 'Notificações', path: '/notificacoes', icon: Bell },
  { label: 'Configurações', path: '/configuracoes', icon: Settings },
];

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { profile, session, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = menuItems.find((item) => item.path === location.pathname)?.label ?? 'Dashboard';
  const query = search.trim().toLocaleLowerCase('pt-BR');
  useEffect(() => {
    if (query.length < 2) return;
    let active = true;
    void peopleRepository.listEmployees().then((records) => {
      if (active) setSearchResults(records.filter((employee) =>
        [employee.nome, employee.cpf, employee.matricula, employee.empresa, employee.unidade, employee.cargo, employee.departamento]
          .some((value) => value.toLocaleLowerCase('pt-BR').includes(query)),
      ).slice(0, 5));
    }).catch(() => { if (active) setSearchResults([]); });
    return () => { active = false; };
  }, [query]);
  useEffect(() => {
    let active = true;
    const end = new Date();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 30);
    void getDashboardSummary({ periodStart: start.toISOString().slice(0, 10), periodEnd: end.toISOString().slice(0, 10) }).then((summary) => {
      if (active) setUnreadNotifications(summary.aso_overdue + summary.aso_due_15 + summary.ppe_low_stock + summary.checklist_pending + summary.admissions_open + summary.terminations_open);
    }).catch(() => { if (active) setUnreadNotifications(0); });
    return () => { active = false; };
  }, []);
  const results = query.length > 1 ? searchResults : [];

  const sidebarContent = (
    <>
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-emerald-950"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">Dusnei Distribuidora</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-200/70">Pessoas & gestão</p>
          </div>
        </div>
        <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu" className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"><X className="h-4 w-4" /></button>
      </div>
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
      <nav className="space-y-1" aria-label="Navegação principal">
        {menuItems.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? 'bg-emerald-300/15 font-medium text-emerald-100' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'}`
          }>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {label === 'Notificações' && unreadNotifications > 0 && <span className="rounded-full bg-amber-300 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950">{unreadNotifications}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d6a36c] text-xs font-semibold text-[#33271c]">HB</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{profile?.display_name || session?.user.email}</p><p className="text-xs text-slate-400">{profile ? roleLabels[profile.role] : ''}</p></div>
        </div>
        <button type="button" onClick={() => void signOut()} className="mt-4 inline-flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-400 hover:bg-white/[0.06] hover:text-white"><LogOut className="h-3.5 w-3.5" />Sair</button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#101917] text-slate-100 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#14201d] px-4 py-6 lg:fixed lg:inset-y-0 lg:flex">{sidebarContent}</aside>
      {mobileMenuOpen && <button type="button" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(19rem,88vw)] flex-col border-r border-white/10 bg-[#14201d] px-4 py-6 transition-transform lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebarContent}</aside>

      <div className="min-h-screen min-w-0 flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#101917]/95 px-4 py-3 backdrop-blur-md md:px-7">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu" className="rounded-lg border border-white/10 p-2 text-slate-200 hover:bg-white/[0.06] lg:hidden"><Menu className="h-4 w-4" /></button>
            <div className="hidden min-w-0 items-center gap-2 text-sm text-slate-400 sm:flex lg:min-w-[9rem]"><span>Dusnei</span><span className="text-slate-600">/</span><span className="font-medium text-white">{activePage}</span></div>
            <div className="relative ml-auto w-full max-w-lg">
              <div className="hidden sm:block"><SearchBar value={search} onChange={setSearch} placeholder="Buscar pessoa, CPF, matrícula ou área..." /></div>
              <div className="relative sm:hidden"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busca global..." className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none" /></div>
              {search && <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                {results.length ? results.map((employee) => <button key={employee.id} type="button" onClick={() => { setSearch(''); navigate(`/funcionarios?registro=${employee.id}`); }} className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 text-left last:border-0 hover:bg-slate-800"><span><span className="block text-sm font-medium text-white">{employee.nome}</span><span className="mt-0.5 block text-xs text-slate-400">{employee.cargo} · {employee.matricula} · {employee.unidade}</span></span><span className="text-xs text-emerald-300">Abrir cadastro</span></button>) : <p className="px-4 py-3 text-sm text-slate-400">{query.length < 2 ? 'Digite ao menos 2 caracteres.' : 'Nenhum funcionário encontrado.'}</p>}
              </div>}
            </div>
            <Button variant="ghost" className="relative h-10 w-10 shrink-0 p-0" aria-label="Ver notificações" onClick={() => navigate('/notificacoes')}><Bell className="h-4 w-4" />{unreadNotifications > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-300" />}</Button>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[1600px] px-4 py-6 md:px-7 md:py-8"><Outlet /></main>
        <footer className="border-t border-white/[0.08] px-4 py-4 text-center text-xs text-slate-500 md:px-7 lg:text-left">Dusnei Distribuidora <span className="mx-1.5 text-slate-700">·</span> Developed by Higor Biela Fernandes</footer>
      </div>
    </div>
  );
}