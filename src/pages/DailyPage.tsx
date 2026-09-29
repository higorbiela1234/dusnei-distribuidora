import {
  Download,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import {
  peopleRepository,
  type NewDailyRecord,
} from "../services/peopleRepository";
import type { DailyRecord, Employee } from "../types";
import { exportCsv } from "../utils/csv";

const blankRecord: NewDailyRecord = {
  employeeId: "",
  funcionario: "",
  cpf: "",
  empresa: "Dusnei Distribuidora",
  unidade: "",
  setor: "",
  data: new Date().toISOString().slice(0, 10),
  valor: 0,
  codigoTransacao: "",
  observacoes: "",
};
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const formatDate = (value: string) =>
  value ? value.split("-").reverse().join("/") : "—";

export function DailyPage() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [people, setPeople] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewDailyRecord>(blankRecord);
  const [formOpen, setFormOpen] = useState(false);
  const [receipt, setReceipt] = useState<DailyRecord | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    void Promise.all([
      peopleRepository.listDailyRecords(),
      peopleRepository.listEmployees(),
    ])
      .then(([daily, employees]) => {
        if (active) {
          setRecords(daily);
          setPeople(employees);
        }
      })
      .catch((reason: unknown) => {
        if (active)
          setLoadError(
            reason instanceof Error
              ? reason.message
              : "Falha ao carregar diárias.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const filtered = records.filter((record) => {
    const matches = [
      record.funcionario,
      record.cpf,
      record.empresa,
      record.unidade,
      record.setor,
      record.codigoTransacao,
    ].some((field) =>
      field
        .toLocaleLowerCase("pt-BR")
        .includes(query.trim().toLocaleLowerCase("pt-BR")),
    );
    return (
      matches &&
      (!startDate || record.data >= startDate) &&
      (!endDate || record.data <= endDate)
    );
  });
  const total = filtered.reduce((sum, record) => sum + record.valor, 0);
  const employees = people;

  const startCreate = () => {
    setEditingId(null);
    setForm(blankRecord);
    setFormOpen(true);
  };
  const startEdit = (record: DailyRecord) => {
    setEditingId(record.id);
    setForm({
      employeeId: record.employeeId,
      funcionario: record.funcionario,
      cpf: record.cpf,
      empresa: record.empresa,
      unidade: record.unidade,
      setor: record.setor,
      data: record.data,
      valor: record.valor,
      codigoTransacao: record.codigoTransacao,
      observacoes: record.observacoes,
    });
    setFormOpen(true);
  };
  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (editingId) await peopleRepository.updateDailyRecord(editingId, form);
      else await peopleRepository.createDailyRecord(form);
      setRecords(await peopleRepository.listDailyRecords());
      setFormOpen(false);
      setNotice(editingId ? "Diária atualizada." : "Diária registrada.");
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar a diária.",
      );
    }
  };
  const deleteRecord = async (record: DailyRecord) => {
    if (!window.confirm("Excluir este lançamento?")) return;
    try {
      await peopleRepository.deleteDailyRecord(record.id);
      setRecords(await peopleRepository.listDailyRecords());
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Não foi possível excluir.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Departamento pessoal · Pagamentos"
        title="Diárias"
        description="Lançamentos, conferência e recibos para impressão."
        action={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                exportCsv(
                  [
                    {
                      label: "Funcionário",
                      value: (record: DailyRecord) => record.funcionario,
                    },
                    {
                      label: "CPF",
                      value: (record: DailyRecord) => record.cpf,
                    },
                    {
                      label: "Empresa",
                      value: (record: DailyRecord) => record.empresa,
                    },
                    {
                      label: "Unidade",
                      value: (record: DailyRecord) => record.unidade,
                    },
                    {
                      label: "Setor",
                      value: (record: DailyRecord) => record.setor,
                    },
                    {
                      label: "Data",
                      value: (record: DailyRecord) => record.data,
                    },
                    {
                      label: "Valor",
                      value: (record: DailyRecord) => record.valor,
                    },
                    {
                      label: "Código",
                      value: (record: DailyRecord) => record.codigoTransacao,
                    },
                  ],
                  filtered,
                  "diarias-dusnei.csv",
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={startCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nova diária
            </Button>
          </>
        }
      />
      {loadError && (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200"
        >
          Falha ao carregar registros do banco: {loadError}
        </p>
      )}
      {notice && (
        <button
          type="button"
          onClick={() => setNotice("")}
          className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-left text-xs text-emerald-200"
        >
          {notice}
          <span className="float-right">Fechar</span>
        </button>
      )}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Lançamentos</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {filtered.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Valor no filtro</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {currency.format(total)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Funcionários no período</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {new Set(filtered.map((record) => record.funcionario)).size}
          </p>
        </div>
      </section>
      <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-slate-400 md:col-span-2">
          Funcionário, CPF, setor ou transação
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar lançamentos"
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
          />
        </label>
        <Input
          label="De"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <Input
          label="Até"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">
            Carregando do banco…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[850px] w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-xs text-slate-400">
                <tr>
                  {[
                    "Funcionário",
                    "Unidade / setor",
                    "Data",
                    "Código da transação",
                    "Valor",
                    "Ações",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr
                    key={record.id}
                    className="border-t border-slate-800 text-slate-300"
                  >
                    <td className="px-4 py-3">
                      <span className="block font-medium text-white">
                        {record.funcionario}
                      </span>
                      <span className="text-xs text-slate-500">
                        {record.cpf}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {record.unidade} · {record.setor}
                    </td>
                    <td className="px-4 py-3">{formatDate(record.data)}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {record.codigoTransacao}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {currency.format(record.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          title="Emitir recibo"
                          aria-label={`Emitir recibo de ${record.funcionario}`}
                          onClick={() => setReceipt(record)}
                          className="rounded-md p-2 text-emerald-200 hover:bg-emerald-400/10"
                        >
                          <ReceiptText className="h-4 w-4" />
                        </button>
                        <button
                          title="Editar"
                          aria-label="Editar diária"
                          onClick={() => startEdit(record)}
                          className="rounded-md p-2 text-slate-400 hover:bg-slate-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Excluir"
                          aria-label="Excluir diária"
                          onClick={() => void deleteRecord(record)}
                          className="rounded-md p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !filtered.length && (
          <p className="p-8 text-center text-sm text-slate-400">
            Nenhum lançamento para os filtros selecionados.
          </p>
        )}
      </section>

      {formOpen && (
        <Modal
          title={editingId ? "Editar diária" : "Registrar diária"}
          onClose={() => setFormOpen(false)}
        >
          <form className="space-y-4" onSubmit={saveRecord}>
            <label className="block text-xs text-slate-400">
              Funcionário
              <select
                required
                value={form.employeeId ?? ""}
                onChange={(event) => {
                  const person = employees.find((employee) => employee.id === event.target.value);
                  setForm({
                    ...form,
                    employeeId: event.target.value,
                    funcionario: person?.nome ?? "",
                    cpf: person?.cpf ?? "",
                    empresa: person?.empresa ?? form.empresa,
                    unidade: person?.unidade ?? form.unidade,
                    setor: person?.departamento ?? form.setor,
                  });
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                <option value="">Selecione</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.nome}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Data"
                type="date"
                required
                value={form.data}
                onChange={(event) =>
                  setForm({ ...form, data: event.target.value })
                }
              />
              <Input
                label="Valor (R$)"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.valor || ""}
                onChange={(event) =>
                  setForm({ ...form, valor: Number(event.target.value) })
                }
              />
              <Input
                label="Empresa"
                required
                value={form.empresa}
                onChange={(event) =>
                  setForm({ ...form, empresa: event.target.value })
                }
              />
              <Input
                label="Unidade"
                required
                value={form.unidade}
                onChange={(event) =>
                  setForm({ ...form, unidade: event.target.value })
                }
              />
              <Input
                label="Setor"
                required
                value={form.setor}
                onChange={(event) =>
                  setForm({ ...form, setor: event.target.value })
                }
              />
              <Input
                label="Código da transação"
                required
                value={form.codigoTransacao}
                onChange={(event) =>
                  setForm({ ...form, codigoTransacao: event.target.value })
                }
              />
            </div>
            <Input
              label="Observações"
              value={form.observacoes}
              onChange={(event) =>
                setForm({ ...form, observacoes: event.target.value })
              }
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar lançamento</Button>
            </div>
          </form>
        </Modal>
      )}

      {receipt && (
        <Modal title="Recibo de diária" onClose={() => setReceipt(null)}>
          <div className="printable print-receipt rounded-lg border border-slate-700 bg-white p-6 text-slate-900">
            <div className="border-b border-slate-300 pb-4 text-center">
              <p className="text-lg font-bold">DUSNEI DISTRIBUIDORA</p>
              <p className="mt-1 text-sm">Recibo de pagamento de diária</p>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                ["Nome", receipt.funcionario],
                ["CPF", receipt.cpf],
                ["Empresa", receipt.empresa],
                ["Unidade", receipt.unidade],
                ["Setor", receipt.setor],
                ["Data", formatDate(receipt.data)],
                ["Valor", currency.format(receipt.valor)],
                ["Código da transação", receipt.codigoTransacao],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-slate-200 pb-2"
                >
                  <dt>{label}:</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-500 pt-2">Assinatura</div>
              <div className="border-t border-slate-500 pt-2">
                Emissão: {new Date().toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>
          <div className="no-print mt-4 flex justify-end">
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir recibo
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
