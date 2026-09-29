import { Download, Eye, FileUp, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { peopleRepository, type NewEmployee } from '../services/peopleRepository';
import { referenceRepository, type CatalogSection, type OrganizationRecord } from '../services/referenceRepository';
import type { Employee } from '../types';
import { exportCsv, parseCsv } from '../utils/csv';

const blankEmployee: NewEmployee = {
  nome: '', cpf: '', dataNascimento: '', matricula: '', cargo: '', departamento: '', dataAdmissao: '',
  empresa: 'Dusnei Distribuidora', unidade: 'Maringá', status: 'Ativo', observacoes: '',
};
const emptyCatalogs: Record<CatalogSection, OrganizationRecord[]> = { Empresas: [], Unidades: [], Departamentos: [], Cargos: [] };
const detailTabs = ['Dados cadastrais', 'Admissão', 'Demissão', 'ASO', 'Atestados', 'EPI', 'Diárias', 'Advertências', 'Documentos', 'Crachá', 'Histórico'];

export function EmployeesPage() {
  const [records, setRecords] = useState<Employee[]>([]);
  const [catalogs, setCatalogs] = useState(emptyCatalogs);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('Todas');
  const [departmentFilter, setDepartmentFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewEmployee>(blankEmployee);
  const [viewedId, setViewedId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState(detailTabs[0]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([peopleRepository.listEmployees(), referenceRepository.list()]).then(([data, references]) => {
      if (active) { setRecords(data); setCatalogs(references); }
    }).catch((reason: unknown) => { if (active) setLoadError(reason instanceof Error ? reason.message : 'Falha ao carregar funcionários e vínculos.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const query = search.trim().toLocaleLowerCase('pt-BR');
  const visibleRecords = records.filter((employee) => {
    const matchesSearch = [employee.nome, employee.cpf, employee.matricula, employee.cargo, employee.departamento].some((value) => value.toLocaleLowerCase('pt-BR').includes(query));
    return matchesSearch && (unitFilter === 'Todas' || employee.unidade === unitFilter) && (departmentFilter === 'Todos' || employee.departamento === departmentFilter) && (statusFilter === 'Todos' || employee.status === statusFilter);
  });
  const requestedId = searchParams.get('registro');
  const viewedEmployee = records.find((record) => record.id === (viewedId ?? requestedId));
  const departments = catalogs.Departamentos.map((item) => ({ id: item.id, nome: item.name }));
  const roles = catalogs.Cargos.map((item) => ({ id: item.id, nome: item.name }));
  const units = catalogs.Unidades.map((item) => ({ id: item.id, nome: item.name }));

  const openCreate = () => { setEditingId(null); setForm(blankEmployee); setFormOpen(true); };
  const openEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setForm({ nome: employee.nome, cpf: employee.cpf, dataNascimento: employee.dataNascimento, matricula: employee.matricula, cargo: employee.cargo, departamento: employee.departamento, dataAdmissao: employee.dataAdmissao, empresa: employee.empresa, unidade: employee.unidade, status: employee.status, dataDesligamento: employee.dataDesligamento, foto: employee.foto, observacoes: employee.observacoes });
    setFormOpen(true);
  };
  const saveEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (editingId) await peopleRepository.updateEmployee(editingId, form);
      else await peopleRepository.createEmployee(form);
      setRecords(await peopleRepository.listEmployees());
      setFormOpen(false);
      setNotice(editingId ? 'Cadastro atualizado.' : 'Funcionário incluído.');
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : 'Não foi possível salvar o cadastro.'); }
  };
  const deleteEmployee = async (employee: Employee) => {
    if (!window.confirm(`Excluir o cadastro demonstrativo de ${employee.nome}?`)) return;
    try {
      await peopleRepository.deleteEmployee(employee.id);
      setRecords(await peopleRepository.listEmployees());
      setNotice('Cadastro removido.');
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : 'Não foi possível excluir o cadastro.'); }
  };
  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const importedRows = parseCsv(await file.text());
    let imported = 0;
    for (const row of importedRows) {
      const nome = row.nome;
      if (!nome) continue;
      try {
        await peopleRepository.createEmployee({ ...blankEmployee, nome, cpf: row.cpf ?? '', matricula: row.matrícula ?? row.matricula ?? '', cargo: row.cargo ?? '', departamento: row.departamento ?? '', dataAdmissao: row.admissão ?? row.admissao ?? '', empresa: row.empresa || blankEmployee.empresa, unidade: row.unidade || blankEmployee.unidade });
      } catch (reason) {
        setNotice(reason instanceof Error ? `Importação interrompida: ${reason.message}` : 'Falha ao importar os registros.');
        return;
      }
      imported += 1;
    }
    setRecords(await peopleRepository.listEmployees());
    setNotice(`${imported} cadastro(s) importado(s). Colunas: nome, cpf, matricula, cargo, departamento, dataAdmissao, empresa e unidade.`);
    event.target.value = '';
  };
  const closeDetails = () => { setViewedId(null); if (searchParams.has('registro')) setSearchParams({}); };

  const exportEmployees = () => exportCsv([
    { label: 'Nome', value: (employee: Employee) => employee.nome },
    { label: 'CPF', value: (employee: Employee) => employee.cpf },
    { label: 'Matrícula', value: (employee: Employee) => employee.matricula },
    { label: 'Cargo', value: (employee: Employee) => employee.cargo },
    { label: 'Departamento', value: (employee: Employee) => employee.departamento },
    { label: 'Empresa', value: (employee: Employee) => employee.empresa },
    { label: 'Unidade', value: (employee: Employee) => employee.unidade },
    { label: 'Status', value: (employee: Employee) => employee.status },
  ], visibleRecords, 'funcionarios-dusnei.csv');

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Cadastros · Pessoas" title="Funcionários" description="Cadastro centralizado e acompanhamento da equipe." action={<>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800"><FileUp className="h-4 w-4" />Importar CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={importCsv} /></label>
        <Button variant="secondary" onClick={exportEmployees}><Download className="mr-2 h-4 w-4" />Exportar</Button>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Novo funcionário</Button>
      </>} />
      {notice && <button type="button" onClick={() => setNotice('')} className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-left text-xs text-emerald-200">{notice}<span className="float-right">Fechar</span></button>}

      <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-slate-400 sm:col-span-2">Pesquisar<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, CPF, matrícula ou cargo" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none" /></label>
        <label className="text-xs text-slate-400">Unidade<select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option>Todas</option>{catalogs.Unidades.map((unit) => <option key={unit.id}>{unit.name}</option>)}</select></label>
        <label className="text-xs text-slate-400">Departamento<select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option>Todos</option>{catalogs.Departamentos.map((department) => <option key={department.id}>{department.name}</option>)}</select></label>
        <label className="text-xs text-slate-400 sm:col-span-2 xl:col-span-1">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option>Todos</option><option>Ativo</option><option>Inativo</option></select></label>
      </section>

      {loadError && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">Falha ao carregar funcionários do banco: {loadError}</p>}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><p className="text-sm font-medium text-white">Equipe cadastrada</p><span className="text-xs text-slate-400">{visibleRecords.length} de {records.length} registros</span></div>
        {loading ? <p className="p-8 text-center text-sm text-slate-400">Carregando do banco…</p> : <div className="overflow-x-auto"><table className="min-w-[880px] w-full text-left text-sm"><thead className="bg-slate-950/70 text-xs text-slate-400"><tr>{['Funcionário', 'CPF', 'Departamento', 'Cargo', 'Unidade', 'Status', 'Ações'].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{visibleRecords.map((employee) => <tr key={employee.id} className="border-t border-slate-800 text-slate-300 hover:bg-white/[0.02]"><td className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-semibold text-emerald-200">{employee.nome.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><span className="block font-medium text-white">{employee.nome}</span><span className="text-xs text-slate-500">Matrícula {employee.matricula}</span></span></div></td><td className="px-4 py-3 tabular-nums">{employee.cpf}</td><td className="px-4 py-3">{employee.departamento}</td><td className="px-4 py-3">{employee.cargo}</td><td className="px-4 py-3">{employee.unidade}</td><td className="px-4 py-3"><Badge tone={employee.status === 'Ativo' ? 'success' : 'neutral'}>{employee.status}</Badge></td><td className="px-4 py-3"><div className="flex gap-1"><button title="Visualizar cadastro" aria-label={`Visualizar ${employee.nome}`} onClick={() => { setViewedId(employee.id); setViewTab(detailTabs[0]); }} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><Eye className="h-4 w-4" /></button><button title="Editar cadastro" aria-label={`Editar ${employee.nome}`} onClick={() => openEdit(employee)} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><Pencil className="h-4 w-4" /></button><button title="Excluir cadastro" aria-label={`Excluir ${employee.nome}`} onClick={() => void deleteEmployee(employee)} className="rounded-md p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}
        {!visibleRecords.length && <div className="p-10 text-center text-sm text-slate-400"><Users className="mx-auto mb-3 h-5 w-5" />Nenhum cadastro corresponde aos filtros.</div>}
      </section>

      {formOpen && <Modal title={editingId ? 'Editar funcionário' : 'Novo funcionário'} wide onClose={() => setFormOpen(false)}><form onSubmit={saveEmployee} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Input label="Nome completo" required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /><Input label="CPF" placeholder="000.000.000-00" value={form.cpf} onChange={(event) => setForm({ ...form, cpf: event.target.value })} /><Input label="Data de nascimento" type="date" value={form.dataNascimento} onChange={(event) => setForm({ ...form, dataNascimento: event.target.value })} /><Input label="Matrícula" required value={form.matricula} onChange={(event) => setForm({ ...form, matricula: event.target.value })} /><label className="text-xs text-slate-400">Cargo<select required value={form.cargo} onChange={(event) => setForm({ ...form, cargo: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">Selecione</option>{roles.map((role) => <option key={role.id}>{role.nome}</option>)}</select></label><label className="text-xs text-slate-400">Departamento<select required value={form.departamento} onChange={(event) => setForm({ ...form, departamento: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">Selecione</option>{departments.map((department) => <option key={department.id}>{department.nome}</option>)}</select></label><Input label="Data de admissão" type="date" required value={form.dataAdmissao} onChange={(event) => setForm({ ...form, dataAdmissao: event.target.value })} /><Input label="Empresa" required value={form.empresa} onChange={(event) => setForm({ ...form, empresa: event.target.value })} /><label className="text-xs text-slate-400">Unidade<select value={form.unidade} onChange={(event) => setForm({ ...form, unidade: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">{units.map((unit) => <option key={unit.id} value={unit.nome.replace('Dusnei / ', '')}>{unit.nome}</option>)}</select></label><label className="text-xs text-slate-400">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as NewEmployee['status'] })} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option>Ativo</option><option>Inativo</option></select></label></div><Input label="Observações" value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} /><div className="flex justify-end gap-2 border-t border-slate-800 pt-4"><Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button><Button type="submit">{editingId ? 'Salvar alterações' : 'Criar cadastro'}</Button></div></form></Modal>}

      {viewedEmployee && <Modal title={viewedEmployee.nome} wide onClose={closeDetails}><div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-800 pb-2">{detailTabs.map((tab) => <button key={tab} onClick={() => setViewTab(tab)} className={`shrink-0 rounded-md px-3 py-2 text-xs ${viewTab === tab ? 'bg-emerald-300/10 text-emerald-200' : 'text-slate-400 hover:bg-slate-800'}`}>{tab}</button>)}</div>{viewTab === 'Dados cadastrais' ? <dl className="grid gap-4 sm:grid-cols-2">{[['CPF', viewedEmployee.cpf], ['Matrícula', viewedEmployee.matricula], ['Cargo', viewedEmployee.cargo], ['Departamento', viewedEmployee.departamento], ['Empresa', viewedEmployee.empresa], ['Unidade', viewedEmployee.unidade], ['Admissão', viewedEmployee.dataAdmissao], ['Status', viewedEmployee.status], ['Nascimento', viewedEmployee.dataNascimento], ['Observações', viewedEmployee.observacoes || 'Sem observações']].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm text-white">{value}</dd></div>)}</dl> : <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-5"><p className="text-sm font-medium text-white">{viewTab}</p><p className="mt-2 text-sm text-slate-400">Ainda não há registros demonstrativos nesta seção para este funcionário.</p></div>}</Modal>}
    </div>
  );
}