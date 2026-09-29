import { BadgeCheck, ImagePlus, Pencil, Printer, UserRound } from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { badgeRepository, type BadgeRecord } from '../services/badgeRepository';
import { peopleRepository } from '../services/peopleRepository';
import type { Employee } from '../types';

export function BadgesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [nameOverride, setNameOverride] = useState('');
  const [departmentOverride, setDepartmentOverride] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([peopleRepository.listEmployees(), badgeRepository.list()]).then(([people, records]) => {
      if (active) { setEmployees(people); setBadges(records); }
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Falha ao carregar crachás.'); });
    return () => { active = false; };
  }, []);
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  const employee = employees.find((item) => item.id === employeeId);
  const badge = badges.find((item) => item.employeeId === employeeId);
  const displayName = nameOverride || badge?.name || employee?.nome || '';
  const department = departmentOverride || badge?.department || employee?.departamento || '';
  const imageUrl = photoPreview || badge?.photoUrl || '';

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : '');
    setError('');
  };
  const saveBadge = async () => {
    if (!employee) return;
    setSaving(true);
    setError('');
    try {
      await badgeRepository.save({ employeeId, name: displayName, department, photo: photoFile, previousPhotoPath: badge?.photoPath });
      setBadges(await badgeRepository.list());
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao salvar o crachá.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Identificação" title="Crachás" description="Pré-visualização física e impressão para funcionários." action={<Button disabled={!employee} onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir crachá</Button>} />
      {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <label className="block text-xs text-slate-400">Selecionar funcionário<select value={employeeId} onChange={(event) => { setEmployeeId(event.target.value); setNameOverride(''); setDepartmentOverride(''); setPhotoFile(null); setPhotoPreview(''); setEditing(false); }} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">Selecione</option>{employees.map((person) => <option key={person.id} value={person.id}>{person.nome} · {person.matricula}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2"><Input label="Nome no crachá" readOnly={!editing} value={displayName} onChange={(event) => setNameOverride(event.target.value)} /><Input label="Setor" readOnly={!editing} value={department} onChange={(event) => setDepartmentOverride(event.target.value)} /></div>
          <label className={`flex items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-sm ${editing ? 'cursor-pointer border-slate-700 text-slate-300 hover:border-emerald-400' : 'cursor-not-allowed border-slate-800 text-slate-500'}`}><ImagePlus className="h-5 w-5 text-emerald-200" /><span>{badge?.photoPath || photoFile ? 'Alterar foto' : 'Adicionar foto'}<span className="mt-1 block text-xs text-slate-500">JPEG ou PNG até 10 MB · armazenamento privado</span></span><input type="file" accept="image/jpeg,image/png" disabled={!editing} className="sr-only" onChange={selectPhoto} /></label>
          <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={!employee} onClick={() => setEditing((current) => !current)}><Pencil className="mr-2 h-4 w-4" />{editing ? 'Cancelar edição' : 'Editar informações'}</Button>{editing && <Button disabled={saving} onClick={() => void saveBadge()}>{saving ? 'Salvando…' : 'Salvar crachá'}</Button>}</div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#0c1311] p-6">
          <p className="mb-4 self-start text-xs font-medium uppercase tracking-wide text-slate-500">Prévia · 86 × 54 mm</p>
          {employee ? <article className="printable print-badge relative flex aspect-[86/54] w-full max-w-[440px] overflow-hidden rounded-xl border border-white/10 bg-[#172824] text-white shadow-2xl">
            <div className="absolute inset-y-0 left-0 w-2 bg-emerald-300" />
            <div className="flex w-[36%] items-center justify-center bg-[#1d3931] p-4">{imageUrl ? <img src={imageUrl} alt={`Foto de ${displayName}`} className="aspect-[3/4] h-full max-h-36 rounded-md object-cover" /> : <span className="flex aspect-[3/4] h-full max-h-36 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]"><UserRound className="h-10 w-10 text-slate-500" /></span>}</div>
            <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-4"><div className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200"><BadgeCheck className="h-4 w-4" />Dusnei Distribuidora</div><h2 className="break-words text-xl font-bold leading-tight">{displayName}</h2><p className="mt-1 text-sm text-slate-300">{department}</p><div className="mt-5 border-t border-white/10 pt-3 text-[11px] text-slate-400">MATRÍCULA <span className="ml-1 font-semibold text-white">{employee.matricula}</span></div></div>
          </article> : <p className="text-sm text-slate-400">Selecione um funcionário para visualizar o crachá.</p>}
          <p className="no-print mt-4 text-xs text-slate-500">A foto só será armazenada depois de salvar. O bucket é privado e protegido por RLS.</p>
        </div>
      </section>
    </div>
  );
}