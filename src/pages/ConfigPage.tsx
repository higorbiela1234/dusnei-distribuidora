import { Building2, ClipboardList, FileCog, Pencil, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../contexts/auth';
import { referenceRepository, type AuditSummary, type CatalogSection, type OrganizationInput, type OrganizationRecord, type ProfileSummary } from '../services/referenceRepository';

type Section = CatalogSection | 'Usuários' | 'Auditoria';
const sections: { label: Section; icon: typeof Building2 }[] = [
  { label: 'Empresas', icon: Building2 }, { label: 'Unidades', icon: Building2 }, { label: 'Departamentos', icon: Users },
  { label: 'Cargos', icon: FileCog }, { label: 'Usuários', icon: ShieldCheck }, { label: 'Auditoria', icon: ClipboardList },
];
const catalogSections: CatalogSection[] = ['Empresas', 'Unidades', 'Departamentos', 'Cargos'];
const singular: Record<CatalogSection, string> = { Empresas: 'empresa', Unidades: 'unidade', Departamentos: 'departamento', Cargos: 'cargo' };
const blank: OrganizationInput = { name: '', code: '', company: '', department: '', city: '', state: '', detail: '' };
const emptyCatalogs: Record<CatalogSection, OrganizationRecord[]> = { Empresas: [], Unidades: [], Departamentos: [], Cargos: [] };

export function ConfigPage() {
  const { profile } = useAuth();
  const [section, setSection] = useState<Section>('Empresas');
  const [catalogs, setCatalogs] = useState(emptyCatalogs);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditSummary[]>([]);
  const [loadedSection, setLoadedSection] = useState<Section | null>(null);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrganizationRecord | null>(null);
  const [form, setForm] = useState<OrganizationInput>(blank);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (catalogSections.includes(section as CatalogSection)) {
          const data = await referenceRepository.list();
          if (active) setCatalogs(data);
        } else if (section === 'Usuários') {
          const data = await referenceRepository.listProfiles();
          if (active) setProfiles(data);
        } else if (section === 'Auditoria' && profile?.role === 'master') {
          const data = await referenceRepository.listAuditLogs();
          if (active) setAuditLogs(data);
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Falha ao consultar o banco.');
      } finally {
        if (active) setLoadedSection(section);
      }
    };
    void load();
    return () => { active = false; };
  }, [section, profile?.role]);

  const catalogSection = catalogSections.includes(section as CatalogSection) ? section as CatalogSection : null;
  const currentRecords = catalogSection ? catalogs[catalogSection] : [];
  const loading = loadedSection !== section;
  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!catalogSection) return;
    setError('');
    try {
      if (editing) await referenceRepository.update(catalogSection, { ...form, id: editing.id, status: editing.status });
      else await referenceRepository.create(catalogSection, form);
      setCatalogs(await referenceRepository.list());
      setFormOpen(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao salvar o cadastro.'); }
  };
  const startEdit = (record: OrganizationRecord) => {
    setEditing(record);
    setForm({ name: record.name, code: record.code, company: record.company, department: record.department, city: record.city, state: record.state, detail: record.detail });
    setFormOpen(true);
  };
  const toggleActive = async (record: OrganizationRecord) => {
    if (!catalogSection) return;
    try {
      await referenceRepository.update(catalogSection, { ...record, status: record.status === 'Ativo' ? 'Inativo' : 'Ativo' });
      setCatalogs(await referenceRepository.list());
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao atualizar status.'); }
  };
  const deleteRecord = async (record: OrganizationRecord) => {
    if (!catalogSection || !window.confirm(`Excluir ${record.name}?`)) return;
    try {
      await referenceRepository.delete(catalogSection, record.id);
      setCatalogs(await referenceRepository.list());
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao excluir. Registros relacionados podem impedir a exclusão.'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administração" title="Configurações" description="Estrutura organizacional, perfis de acesso e trilha de auditoria." />
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-800" aria-label="Seções de configurações">{sections.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setSection(label); setError(''); }} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm ${section === label ? 'border-emerald-300 text-emerald-200' : 'border-transparent text-slate-400 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
      {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
      {catalogSection && <><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-400">{loadedSection !== section ? 'Consultando banco…' : `${currentRecords.length} registros no banco`}</p><Button onClick={() => { setEditing(null); setForm(blank); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nova {singular[catalogSection]}</Button></div><section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80"><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-950/70 text-xs text-slate-400"><tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Código / vínculo</th><th className="px-4 py-3">Local / setor</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead><tbody>{currentRecords.map((record) => <tr key={record.id} className="border-t border-slate-800 text-slate-300"><td className="px-4 py-3"><span className="font-medium text-white">{record.name}</span><span className="block text-xs text-slate-500">{record.detail}</span></td><td className="px-4 py-3">{record.code || '—'}{record.company && <span className="block text-xs text-slate-500">{record.company}</span>}</td><td className="px-4 py-3">{record.city ? `${record.city} / ${record.state}` : record.department || '—'}</td><td className="px-4 py-3"><Badge tone={record.status === 'Ativo' ? 'success' : 'neutral'}>{record.status}</Badge></td><td className="px-4 py-3"><div className="flex gap-1"><button title="Editar" onClick={() => startEdit(record)} className="rounded-md p-2 text-slate-400 hover:bg-slate-800"><Pencil className="h-4 w-4" /></button><button title={record.status === 'Ativo' ? 'Inativar' : 'Ativar'} onClick={() => void toggleActive(record)} className="rounded-md px-2 py-1 text-xs text-amber-200 hover:bg-amber-300/10">{record.status === 'Ativo' ? 'Inativar' : 'Ativar'}</button><button title="Excluir" onClick={() => void deleteRecord(record)} className="rounded-md p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>{loadedSection === section && currentRecords.length === 0 && <p className="p-8 text-center text-sm text-slate-400">Cadastre primeiro uma empresa e depois vincule suas unidades.</p>}</section></>}
      {section === 'Usuários' && <section className="space-y-4"><div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100"><ShieldCheck className="mr-2 inline h-4 w-4" />Usuários autenticados pelo Supabase. Alterações de perfil privilegiado não são permitidas pelo cliente público.</div><div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80"><table className="min-w-[600px] w-full text-left text-sm"><thead className="bg-slate-950/70 text-xs text-slate-400"><tr>{['ID de autenticação', 'Nome', 'Perfil', 'Situação'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{profiles.map((item) => <tr key={item.id} className="border-t border-slate-800 text-slate-300"><td className="px-4 py-3 font-mono text-xs">{item.id}</td><td className="px-4 py-3 text-white">{item.displayName || 'Sem nome'}</td><td className="px-4 py-3">{item.role}</td><td className="px-4 py-3"><Badge tone={item.active ? 'success' : 'danger'}>{item.active ? 'Ativo' : 'Inativo'}</Badge></td></tr>)}</tbody></table></div></section>}
      {section === 'Auditoria' && <section className="space-y-4">{profile?.role !== 'master' ? <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100"><ShieldCheck className="mr-2 inline h-4 w-4" />A auditoria completa é restrita ao perfil MASTER.</div> : <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-slate-950/70 text-xs text-slate-400"><tr>{['Ator', 'Data e hora', 'Ação', 'Módulo', 'Registro', 'Dados anteriores', 'Dados novos'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{auditLogs.map((log) => <tr key={log.id} className="border-t border-slate-800 text-slate-300"><td className="px-4 py-3 font-mono text-xs">{log.actorId ?? 'Sistema'}</td><td className="px-4 py-3">{new Date(log.occurredAt).toLocaleString('pt-BR')}</td><td className="px-4 py-3">{log.action}</td><td className="px-4 py-3">{log.module}</td><td className="px-4 py-3">{log.recordId}</td><td className="max-w-56 truncate px-4 py-3">{JSON.stringify(log.previousData)}</td><td className="max-w-56 truncate px-4 py-3">{JSON.stringify(log.newData)}</td></tr>)}</tbody></table>{!loading && !auditLogs.length && <p className="p-8 text-center text-sm text-slate-400">Nenhum evento registrado.</p>}</div>}</section>}

      {formOpen && catalogSection && <Modal title={`${editing ? 'Editar' : 'Nova'} ${singular[catalogSection]}`} onClose={() => setFormOpen(false)}><form onSubmit={saveRecord} className="space-y-4"><Input label={catalogSection === 'Empresas' ? 'Nome fantasia' : catalogSection === 'Unidades' ? 'Nome da unidade' : catalogSection === 'Cargos' ? 'Nome do cargo' : 'Nome'} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />{catalogSection === 'Empresas' && <Input label="Razão social" required value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} />}{<Input label={catalogSection === 'Empresas' ? 'CNPJ' : 'Código'} required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />}{catalogSection === 'Unidades' && <><label className="block text-xs text-slate-400">Empresa<select required value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">Selecione</option>{catalogs.Empresas.filter((company) => company.status === 'Ativo').map((company) => <option key={company.id}>{company.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><Input label="Cidade" required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /><Input label="Estado" required maxLength={2} value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value.toUpperCase() })} /></div></>}{catalogSection === 'Cargos' && <label className="block text-xs text-slate-400">Departamento<select required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">Selecione</option>{catalogs.Departamentos.filter((department) => department.status === 'Ativo').map((department) => <option key={department.id}>{department.name}</option>)}</select></label>}{catalogSection === 'Empresas' && <><Input label="Cidade" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /><Input label="Estado" maxLength={2} value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value.toUpperCase() })} /></>}{catalogSection === 'Departamentos' && <Input label="Observações" value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} />}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button><Button type="submit">Salvar no banco</Button></div></form></Modal>}
    </div>
  );
}