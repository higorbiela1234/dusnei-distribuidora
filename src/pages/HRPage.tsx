import {
  AlertTriangle,
  CalendarClock,
  Check,
  FilePlus2,
  FileText,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { peopleRepository } from "../services/peopleRepository";
import { createPrivateDocumentUrl } from "../services/documentStorage";
import {
  hrRepository,
  type AsoRecord,
  type CertificateRecord,
  type ChecklistTask,
  type DisciplinaryRecord,
  type HrProcessRecord,
} from "../services/hrRepository";
import type { Employee } from "../types";

type ChecklistStatus =
  | "Pendente"
  | "Em andamento"
  | "Concluído"
  | "Não aplicável";
type ChecklistItem = ChecklistTask;
type AsoEntry = AsoRecord;
type LeaveEntry = CertificateRecord;
type WarningEntry = DisciplinaryRecord;

const admissionDefaults = [
  "Cadastro do funcionário",
  "Documentos pessoais",
  "CPF e identificação",
  "Comprovante de residência",
  "Carteira de Trabalho",
  "Dados bancários",
  "Dependentes",
  "Certificados",
  "Documentos específicos",
  "Exame admissional",
  "ASO",
  "Contrato de trabalho",
  "Ficha de registro",
  "Benefícios",
  "Uniforme",
  "EPI",
  "Integração",
  "Treinamentos",
  "Assinaturas",
  "Conferência final",
];
const terminationDefaults = [
  "Solicitação",
  "Tipo de desligamento",
  "Data de desligamento",
  "Aviso-prévio",
  "Exame demissional",
  "ASO demissional",
  "Documentos",
  "Devolução de uniforme",
  "Devolução de EPI",
  "Devolução de equipamentos",
  "Baixa de acessos",
  "Verbas rescisórias",
  "Termos",
  "Assinaturas",
  "Pagamento",
  "Arquivamento",
  "Conclusão",
];
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
const addMonths = (value: string, months: number) => {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return dateOnly(date);
};
const addDays = (value: string, days: number) => {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateOnly(date);
};
const formatDate = (value: string) => value.split("-").reverse().join("/");
const differenceInDays = (value: string) =>
  Math.ceil(
    (new Date(`${value}T12:00:00Z`).getTime() -
      new Date(`${dateOnly(new Date())}T12:00:00Z`).getTime()) /
      86400000,
  );
const tabs = [
  "Admissões",
  "Demissões",
  "ASO",
  "Atestados",
  "Advertências",
] as const;

export function HRPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Admissões");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [admissionProcesses, setAdmissionProcesses] = useState<
    HrProcessRecord[]
  >([]);
  const [terminationProcesses, setTerminationProcesses] = useState<
    HrProcessRecord[]
  >([]);
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [asoRecords, setAsoRecords] = useState<AsoEntry[]>([]);
  const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
  const [warnings, setWarnings] = useState<WarningEntry[]>([]);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState<
    "checklist" | "aso" | "leave" | "warning" | "process" | null
  >(null);
  const [editingChecklist, setEditingChecklist] = useState<string | null>(null);
  const [checklistName, setChecklistName] = useState("");
  const [checklistTarget, setChecklistTarget] = useState<
    "admission" | "termination"
  >("admission");
  const [processEmployeeId, setProcessEmployeeId] = useState("");
  const [asoDocument, setAsoDocument] = useState<File | null>(null);
  const [certificateDocument, setCertificateDocument] = useState<File | null>(null);
  const [disciplinaryDocument, setDisciplinaryDocument] = useState<File | null>(null);
  const [asoForm, setAsoForm] = useState({
    employeeId: "",
    tipo: "Periódico",
    exame: dateOnly(new Date()),
    meses: 12,
    observacoes: "",
  });
  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    data: dateOnly(new Date()),
    inicio: dateOnly(new Date()),
    fim: dateOnly(new Date()),
    cid: "",
    medico: "",
    crm: "",
    observacoes: "",
  });
  const [warningForm, setWarningForm] = useState({
    employeeId: "",
    data: dateOnly(new Date()),
    tipo: "Advertência verbal",
    motivo: "",
    descricao: "",
    observacoes: "",
  });
  const activeProcesses =
    tab === "Demissões" ? terminationProcesses : admissionProcesses;
  const activeProcess =
    activeProcesses.find((process) => process.id === selectedProcessId) ??
    activeProcesses[0];
  const currentProcessId = activeProcess?.id ?? "";
  const completed = checklist.filter(
    (item) => item.status === "Concluído" || item.status === "Não aplicável",
  ).length;
  useEffect(() => {
    let active = true;
    void Promise.all([
      peopleRepository.listEmployees(),
      hrRepository.listAso(),
      hrRepository.listCertificates(),
      hrRepository.listDisciplinaryRecords(),
      hrRepository.listProcesses("admission"),
      hrRepository.listProcesses("termination"),
    ])
      .then(
        ([
          people,
          exams,
          certificates,
          disciplinary,
          admissions,
          terminations,
        ]) => {
          if (active) {
            setEmployees(people);
            setAsoRecords(exams);
            setLeaves(certificates);
            setWarnings(disciplinary);
            setAdmissionProcesses(admissions);
            setTerminationProcesses(terminations);
          }
        },
      )
      .catch((reason: unknown) => {
        if (active)
          setLoadError(
            reason instanceof Error
              ? reason.message
              : "Falha ao carregar dados de RH.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    if (!currentProcessId) {
      void Promise.resolve().then(() => {
        if (active) setChecklist([]);
      });
      return () => {
        active = false;
      };
    }
    void hrRepository
      .listChecklist(currentProcessId)
      .then((items) => {
        if (active) setChecklist(items);
      })
      .catch((reason: unknown) => {
        if (active)
          setLoadError(
            reason instanceof Error
              ? reason.message
              : "Falha ao carregar checklist.",
          );
      });
    return () => {
      active = false;
    };
  }, [currentProcessId]);

  const openChecklistEdit = (
    target: "admission" | "termination",
    item?: ChecklistItem,
  ) => {
    setChecklistTarget(target);
    setEditingChecklist(item?.id ?? null);
    setChecklistName(item?.nome ?? "");
    setModal("checklist");
  };
  const saveChecklistItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentProcessId) {
      setLoadError(
        "Crie ou selecione um processo antes de editar seu checklist.",
      );
      return;
    }
    try {
      if (editingChecklist) {
        const task = checklist.find((item) => item.id === editingChecklist);
        if (task)
          await hrRepository.updateChecklistItem({
            ...task,
            nome: checklistName,
          });
      } else
        await hrRepository.createChecklistItem(
          currentProcessId,
          checklistName,
          checklist.length,
        );
      setChecklist(await hrRepository.listChecklist(currentProcessId));
      setModal(null);
    } catch (reason) {
      setLoadError(
        reason instanceof Error ? reason.message : "Falha ao salvar item.",
      );
    }
  };
  const changeChecklistStatus = async (
    task: ChecklistItem,
    status: ChecklistStatus,
  ) => {
    try {
      await hrRepository.updateChecklistItem({ ...task, status });
      setChecklist(await hrRepository.listChecklist(currentProcessId));
    } catch (reason) {
      setLoadError(
        reason instanceof Error
          ? reason.message
          : "Falha ao atualizar checklist.",
      );
    }
  };
  const deleteChecklistItem = async (id: string) => {
    try {
      await hrRepository.deleteChecklistItem(id);
      setChecklist(await hrRepository.listChecklist(currentProcessId));
    } catch (reason) {
      setLoadError(
        reason instanceof Error ? reason.message : "Falha ao excluir item.",
      );
    }
  };
  const startProcess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const kind = checklistTarget;
    try {
      const id = await hrRepository.startProcess(
        processEmployeeId,
        kind,
        kind === "admission" ? admissionDefaults : terminationDefaults,
      );
      const processes = await hrRepository.listProcesses(kind);
      if (kind === "admission") setAdmissionProcesses(processes);
      else setTerminationProcesses(processes);
      if (id) setSelectedProcessId(id);
      setModal(null);
    } catch (reason) {
      setLoadError(
        reason instanceof Error ? reason.message : "Falha ao iniciar processo.",
      );
    }
  };
  const addAso = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await hrRepository.createAso(asoForm, asoDocument);
      setAsoRecords(await hrRepository.listAso());
      setAsoDocument(null);
      setModal(null);
    } catch (reason) {
      setLoadError(
        reason instanceof Error ? reason.message : "Falha ao salvar exame.",
      );
    }
  };
  const addLeave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await hrRepository.createCertificate(leaveForm, certificateDocument);
      setLeaves(await hrRepository.listCertificates());
      setCertificateDocument(null);
      setModal(null);
    } catch (reason) {
      setLoadError(
        reason instanceof Error ? reason.message : "Falha ao salvar atestado.",
      );
    }
  };
  const addWarning = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await hrRepository.createDisciplinaryRecord(warningForm, disciplinaryDocument);
      setWarnings(await hrRepository.listDisciplinaryRecords());
      setDisciplinaryDocument(null);
      setModal(null);
    } catch (reason) {
      setLoadError(
        reason instanceof Error ? reason.message : "Falha ao salvar registro.",
      );
    }
  };
  const openDocument = async (path: string | null) => {
    if (!path) return;
    try { window.open(await createPrivateDocumentUrl(path), '_blank', 'noopener,noreferrer'); }
    catch (reason) { setLoadError(reason instanceof Error ? reason.message : 'Falha ao abrir documento privado.'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pessoas · Processos"
        title="Recursos Humanos"
        description="Admissões, desligamentos, saúde ocupacional e registros."
        action={
          tab === "Admissões" || tab === "Demissões" ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setChecklistTarget(tab === "Admissões" ? "admission" : "termination");
                  setProcessEmployeeId("");
                  setModal("process");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo processo
              </Button>
              <Button
                disabled={!currentProcessId}
                onClick={() => openChecklistEdit(tab === "Admissões" ? "admission" : "termination")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo item
              </Button>
            </>
          ) : (
            <Button
              onClick={() =>
                setModal(
                  tab === "ASO"
                    ? "aso"
                    : tab === "Atestados"
                      ? "leave"
                      : "warning",
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo registro
            </Button>
          )
        }
      />
      <nav
        className="flex gap-1 overflow-x-auto border-b border-slate-800"
        aria-label="Módulos de RH"
      >
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm ${tab === item ? "border-emerald-300 text-emerald-200" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            {item}
          </button>
        ))}
      </nav>
      {loadError && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{loadError}</p>}

      {(tab === "Admissões" || tab === "Demissões") && (
        <section className="space-y-4">
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <label className="block text-xs text-slate-400">Processo de {tab.toLocaleLowerCase("pt-BR")}
              <select value={activeProcess?.id ?? ""} onChange={(event) => setSelectedProcessId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white sm:max-w-xl">
                <option value="">Selecione um processo</option>
                {activeProcesses.map((process) => <option key={process.id} value={process.id}>{process.funcionario} · {formatDate(process.data)} · {process.status}</option>)}
              </select>
            </label>
          </section>
          {!activeProcess && <p className="rounded-lg border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-400">Nenhum processo nesta seção. Crie um processo para gerar seu checklist persistente.</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div>
              <h2 className="font-semibold text-white">
                Checklist de {tab.toLocaleLowerCase("pt-BR")}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Itens configuráveis · clique no status para avançar
              </p>
            </div>
            <div className="min-w-40">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Conclusão</span>
                <span>
                  {completed}/{checklist.length}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-300"
                  style={{
                    width: `${checklist.length ? (completed / checklist.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-4 py-3 last:border-0"
              >
                <button
                  aria-label={`Alterar status: ${item.nome}`}
                  onClick={() => void changeChecklistStatus(item, item.status === "Pendente" ? "Em andamento" : item.status === "Em andamento" ? "Concluído" : "Pendente")}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${item.status === "Concluído" ? "border-emerald-300 bg-emerald-300 text-emerald-950" : "border-slate-600 text-slate-500"}`}
                >
                  {item.status === "Concluído" && <Check className="h-4 w-4" />}
                </button>
                <span className="min-w-40 flex-1 text-sm text-slate-200">
                  {item.nome}
                </span>
                <select
                  aria-label={`Status ${item.nome}`}
                  value={item.status}
                  onChange={(event) => void changeChecklistStatus(item, event.target.value as ChecklistStatus)}
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-300"
                >
                  {[
                    "Pendente",
                    "Em andamento",
                    "Concluído",
                    "Não aplicável",
                  ].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <button
                  title="Editar item"
                  onClick={() =>
                    openChecklistEdit(
                      tab === "Admissões" ? "admission" : "termination",
                      item,
                    )
                  }
                  className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800"
                >
                  Editar
                </button>
                <button
                  title="Excluir item"
                  onClick={() => void deleteChecklistItem(item.id)}
                  className="rounded-md p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "ASO" && (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs text-slate-400">Exames registrados</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {asoRecords.length}
              </p>
            </div>
            {["Vencido", "Até 15 dias", "Até 45 dias"].map((alert) => (
              <div
                key={alert}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <p className="text-xs text-slate-400">{alert}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {
                    asoRecords.filter((record) => {
                      const days = differenceInDays(
                        addMonths(record.exame, record.meses),
                      );
                      return alert === "Vencido"
                        ? days < 0
                        : alert === "Até 15 dias"
                          ? days >= 0 && days <= 15
                          : days > 15 && days <= 45;
                    }).length
                  }
                </p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-xs text-slate-400">
                <tr>
                  {[
                    "Funcionário",
                    "Tipo",
                    "Exame",
                    "Periodicidade",
                    "Próximo exame",
                    "Situação",
                    "Documento",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {asoRecords.map((record) => {
                  const nextExam = addMonths(record.exame, record.meses);
                  const days = differenceInDays(nextExam);
                  const situation =
                    days < 0
                      ? "Vencido"
                      : days <= 15
                        ? "Até 15 dias"
                        : days <= 45
                          ? "Até 45 dias"
                          : "Em dia";
                  return (
                    <tr
                      key={record.id}
                      className="border-t border-slate-800 text-slate-300"
                    >
                      <td className="px-4 py-3">
                        <span className="text-white">{record.funcionario}</span>
                        <span className="block text-xs text-slate-500">
                          {record.cpf}
                        </span>
                      </td>
                      <td className="px-4 py-3">{record.tipo}</td>
                      <td className="px-4 py-3">{formatDate(record.exame)}</td>
                      <td className="px-4 py-3">{record.meses} meses</td>
                      <td className="px-4 py-3">{formatDate(nextExam)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            days < 0
                              ? "danger"
                              : days <= 45
                                ? "warning"
                                : "success"
                          }
                        >
                          {situation}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{record.documentoPath ? <button onClick={() => void openDocument(record.documentoPath)} className="text-emerald-200 hover:text-emerald-100" aria-label="Abrir ASO"><FileText className="h-4 w-4" /></button> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Atestados" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Afastamentos registrados</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {leaves.length}
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <table className="min-w-[700px] w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-xs text-slate-400">
                <tr>
                  {[
                    "Funcionário",
                    "Data",
                    "Período",
                    "Dias",
                    "CID",
                    "Médico",
                    "Retorno estimado",
                    "Documento",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.map((record) => {
                  const days =
                    Math.floor(
                      (new Date(`${record.fim}T12:00:00Z`).getTime() -
                        new Date(`${record.inicio}T12:00:00Z`).getTime()) /
                        86400000,
                    ) + 1;
                  return (
                    <tr
                      key={record.id}
                      className="border-t border-slate-800 text-slate-300"
                    >
                      <td className="px-4 py-3 text-white">
                        {record.funcionario}
                      </td>
                      <td className="px-4 py-3">{formatDate(record.data)}</td>
                      <td className="px-4 py-3">
                        {formatDate(record.inicio)} – {formatDate(record.fim)}
                      </td>
                      <td className="px-4 py-3">{days}</td>
                      <td className="px-4 py-3">{record.cid || "—"}</td>
                      <td className="px-4 py-3">{record.medico || "—"}</td>
                      <td className="px-4 py-3">
                        {formatDate(addDays(record.fim, 1))}
                      </td>
                      <td className="px-4 py-3">{record.documentoPath ? <button onClick={() => void openDocument(record.documentoPath)} className="text-emerald-200 hover:text-emerald-100" aria-label="Abrir atestado"><FileText className="h-4 w-4" /></button> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Advertências" && (
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-xs text-slate-400">
                <tr>
                  {[
                    "Funcionário",
                    "Data",
                    "Tipo",
                    "Motivo",
                    "Responsável",
                    "Documento",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {warnings.map((record) => (
                  <tr
                    key={record.id}
                    className="border-t border-slate-800 text-slate-300"
                  >
                    <td className="px-4 py-3 text-white">
                      {record.funcionario}
                    </td>
                    <td className="px-4 py-3">{formatDate(record.data)}</td>
                    <td className="px-4 py-3">{record.tipo}</td>
                    <td className="px-4 py-3">{record.motivo}</td>
                      <td className="px-4 py-3">Usuário autenticado</td>
                    <td className="px-4 py-3">
                        {record.documentoPath ? <button onClick={() => void openDocument(record.documentoPath)} className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100"><FileText className="h-4 w-4" />Abrir</button> : <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer className="mr-1 h-3 w-3" />Imprimir</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-500">
        <CalendarClock className="mr-2 inline h-4 w-4" />
        Alertas e cadastros apresentados nesta tela são demonstrativos e devem
        ser conferidos antes do uso operacional.
      </div>

      {modal === "process" && (
        <Modal title={checklistTarget === "admission" ? "Nova admissão" : "Novo desligamento"} onClose={() => setModal(null)}>
          <form onSubmit={startProcess} className="space-y-4">
            <label className="block text-xs text-slate-400">Funcionário
              <select required value={processEmployeeId} onChange={(event) => setProcessEmployeeId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
                <option value="">Selecione</option>
                {employees.map((person) => <option key={person.id} value={person.id}>{person.nome} · {person.matricula}</option>)}
              </select>
            </label>
            <p className="text-xs text-slate-500">O processo e os itens iniciais serão gravados em uma transação no banco.</p>
            <div className="flex justify-end"><Button type="submit">Criar processo</Button></div>
          </form>
        </Modal>
      )}
      {modal === "checklist" && (
        <Modal
          title={
            editingChecklist
              ? "Editar item do checklist"
              : "Adicionar item ao checklist"
          }
          onClose={() => setModal(null)}
        >
          <form onSubmit={saveChecklistItem} className="space-y-4">
            <Input
              label="Descrição do item"
              required
              autoFocus
              value={checklistName}
              onChange={(event) => setChecklistName(event.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit">
                {editingChecklist ? "Salvar item" : "Adicionar item"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "aso" && (
        <Modal
          title="Registrar exame ocupacional"
          onClose={() => setModal(null)}
        >
          <form onSubmit={addAso} className="space-y-4">
            <label className="block text-xs text-slate-400">
              Funcionário
              <select
                required
                value={asoForm.employeeId}
                onChange={(event) =>
                  setAsoForm({ ...asoForm, employeeId: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                <option value="">Selecione</option>
                {employees.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-slate-400">
              Tipo do exame
              <select
                value={asoForm.tipo}
                onChange={(event) =>
                  setAsoForm({ ...asoForm, tipo: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                {[
                  "Admissional",
                  "Periódico",
                  "Retorno ao trabalho",
                  "Mudança de risco/função",
                  "Demissional",
                  "Outros",
                ].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Data do exame"
                type="date"
                required
                value={asoForm.exame}
                onChange={(event) =>
                  setAsoForm({ ...asoForm, exame: event.target.value })
                }
              />
              <Input
                label="Periodicidade (meses)"
                type="number"
                min="1"
                required
                value={asoForm.meses}
                onChange={(event) =>
                  setAsoForm({ ...asoForm, meses: Number(event.target.value) })
                }
              />
            </div>
            <Input
              label="Observações"
              value={asoForm.observacoes}
              onChange={(event) =>
                setAsoForm({ ...asoForm, observacoes: event.target.value })
              }
            />
            <label className="block text-xs text-slate-400">Documento ASO (PDF, JPG ou PNG)<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setAsoDocument(event.target.files?.[0] ?? null)} className="mt-1.5 block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:text-white" /></label>
            <p className="text-xs text-emerald-200">
              Próximo exame calculado:{" "}
              {asoForm.exame
                ? formatDate(addMonths(asoForm.exame, asoForm.meses))
                : "—"}
            </p>
            <div className="flex justify-end">
              <Button type="submit">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Salvar exame
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "leave" && (
        <Modal title="Registrar atestado" onClose={() => setModal(null)}>
          <form onSubmit={addLeave} className="space-y-4">
            <label className="block text-xs text-slate-400">
              Funcionário
              <select
                required
                value={leaveForm.employeeId}
                onChange={(event) =>
                  setLeaveForm({ ...leaveForm, employeeId: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                <option value="">Selecione</option>
                {employees.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.nome}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Data do atestado"
                type="date"
                value={leaveForm.data}
                onChange={(event) =>
                  setLeaveForm({ ...leaveForm, data: event.target.value })
                }
              />
              <Input
                label="CID"
                value={leaveForm.cid}
                onChange={(event) =>
                  setLeaveForm({ ...leaveForm, cid: event.target.value })
                }
              />
              <Input
                label="Data inicial"
                type="date"
                value={leaveForm.inicio}
                onChange={(event) =>
                  setLeaveForm({ ...leaveForm, inicio: event.target.value })
                }
              />
              <Input
                label="Data final"
                type="date"
                value={leaveForm.fim}
                onChange={(event) =>
                  setLeaveForm({ ...leaveForm, fim: event.target.value })
                }
              />
              <Input
                label="Médico"
                value={leaveForm.medico}
                onChange={(event) =>
                  setLeaveForm({ ...leaveForm, medico: event.target.value })
                }
              />
              <Input label="CRM" value={leaveForm.crm} onChange={(event) => setLeaveForm({ ...leaveForm, crm: event.target.value })} />
            </div>
            <Input label="Observações" value={leaveForm.observacoes} onChange={(event) => setLeaveForm({ ...leaveForm, observacoes: event.target.value })} />
            <label className="block text-xs text-slate-400">Atestado (PDF, JPG ou PNG)<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setCertificateDocument(event.target.files?.[0] ?? null)} className="mt-1.5 block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:text-white" /></label>
            <p className="text-xs text-emerald-200">
              Dias:{" "}
              {Math.max(
                0,
                Math.floor(
                  (new Date(`${leaveForm.fim}T12:00:00Z`).getTime() -
                    new Date(`${leaveForm.inicio}T12:00:00Z`).getTime()) /
                    86400000,
                ) + 1,
              )}{" "}
              · retorno: {formatDate(addDays(leaveForm.fim, 1))}
            </p>
            <div className="flex justify-end">
              <Button type="submit">
                <FilePlus2 className="mr-2 h-4 w-4" />
                Salvar atestado
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "warning" && (
        <Modal title="Novo registro disciplinar" onClose={() => setModal(null)}>
          <form onSubmit={addWarning} className="space-y-4">
            <label className="block text-xs text-slate-400">
              Funcionário
              <select
                required
                value={warningForm.employeeId}
                onChange={(event) =>
                  setWarningForm({
                    ...warningForm,
                    employeeId: event.target.value,
                  })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                <option value="">Selecione</option>
                {employees.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-slate-400">
              Tipo
              <select
                value={warningForm.tipo}
                onChange={(event) =>
                  setWarningForm({ ...warningForm, tipo: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                {[
                  "Advertência verbal",
                  "Advertência escrita",
                  "Suspensão",
                  "Registro disciplinar",
                  "Outros",
                ].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <Input
              label="Data"
              type="date"
              value={warningForm.data}
              onChange={(event) =>
                setWarningForm({ ...warningForm, data: event.target.value })
              }
            />
            <Input
              label="Motivo"
              required
              value={warningForm.motivo}
              onChange={(event) =>
                setWarningForm({ ...warningForm, motivo: event.target.value })
              }
            />
            <Input label="Descrição" value={warningForm.descricao} onChange={(event) => setWarningForm({ ...warningForm, descricao: event.target.value })} />
            <Input label="Observações" value={warningForm.observacoes} onChange={(event) => setWarningForm({ ...warningForm, observacoes: event.target.value })} />
            <label className="block text-xs text-slate-400">Documento (PDF, JPG ou PNG)<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setDisciplinaryDocument(event.target.files?.[0] ?? null)} className="mt-1.5 block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:text-white" /></label>
            <div className="flex justify-end">
              <Button type="submit">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Salvar registro
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
