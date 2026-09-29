import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  HardHat,
  Plus,
  Printer,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { peopleRepository } from "../services/peopleRepository";
import {
  hrRepository,
  type PpeItemRecord,
  type PpeMovementRecord,
} from "../services/hrRepository";
import type { Employee } from "../types";
import { exportCsv } from "../utils/csv";

type EpiItem = PpeItemRecord;
type Movement = PpeMovementRecord;
type MovementKind = Movement["tipo"];
const tabs = [
  "Estoque",
  "Entradas",
  "Entregas",
  "Devoluções",
  "Termos",
] as const;
const blankItem = {
  nome: "",
  codigo: "",
  categoria: "",
  ca: "",
  tamanho: "",
  quantidade: 0,
  minimo: 0,
  fornecedor: "",
};

export function EpiPage() {
  const [items, setItems] = useState<EpiItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Estoque");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"item" | "movement" | null>(null);
  const [kind, setKind] = useState<MovementKind>("Entrada");
  const [itemForm, setItemForm] = useState(blankItem);
  const [movementForm, setMovementForm] = useState({
    epiId: "",
    quantidade: 1,
    funcionario: "",
    data: new Date().toISOString().slice(0, 10),
    detalhe: "",
  });
  const [termEmployee, setTermEmployee] = useState("");
  const [termOpen, setTermOpen] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    void Promise.all([
      hrRepository.listPpeItems(),
      hrRepository.listPpeMovements(),
      peopleRepository.listEmployees(),
    ])
      .then(([ppeItems, ppeMovements, people]) => {
        if (active) {
          setItems(ppeItems);
          setMovements(ppeMovements);
          setEmployees(people);
        }
      })
      .catch((reason: unknown) => {
        if (active)
          setLoadError(
            reason instanceof Error
              ? reason.message
              : "Falha ao carregar estoque.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const lowStock = items.filter(
    (item) => item.quantidade <= item.minimo,
  ).length;
  const visibleItems = items.filter((item) =>
    [item.nome, item.codigo, item.categoria, item.ca].some((value) =>
      value
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")),
    ),
  );
  const movementTabs: MovementKind[] =
    tab === "Entradas"
      ? ["Entrada"]
      : tab === "Entregas"
        ? ["Entrega"]
        : tab === "Devoluções"
          ? ["Devolução"]
          : [];
  const selectedMovement: MovementKind | undefined =
    tab === "Entradas"
      ? "Entrada"
      : tab === "Entregas"
        ? "Entrega"
        : tab === "Devoluções"
          ? "Devolução"
          : undefined;

  const openMovement = (movementKind: MovementKind) => {
    setKind(movementKind);
    setMovementForm({
      epiId: "",
      quantidade: 1,
      funcionario: "",
      data: new Date().toISOString().slice(0, 10),
      detalhe: "",
    });
    setModal("movement");
  };
  const saveItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await hrRepository.createPpeItem(itemForm);
      setItems(await hrRepository.listPpeItems());
      setModal(null);
      setNotice("EPI adicionado ao catálogo.");
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Falha ao cadastrar EPI.",
      );
    }
  };
  const saveMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const item = items.find((candidate) => candidate.id === movementForm.epiId);
    if (!item) return;
    try {
      await hrRepository.createPpeMovement({
        itemId: item.id,
        employeeId: movementForm.funcionario,
        kind,
        quantity: movementForm.quantidade,
        date: movementForm.data,
        detail: movementForm.detalhe,
      });
      const [updatedItems, updatedMovements] = await Promise.all([
        hrRepository.listPpeItems(),
        hrRepository.listPpeMovements(),
      ]);
      setItems(updatedItems);
      setMovements(updatedMovements);
      setModal(null);
      setNotice(
        `Movimentação de ${kind.toLocaleLowerCase("pt-BR")} registrada; estoque atualizado pelo banco.`,
      );
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Falha ao registrar movimentação.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Segurança do trabalho"
        title="Equipamentos de proteção"
        description="Estoque, movimentações e termos de entrega."
        action={
          <>
            <Button variant="secondary" onClick={() => openMovement("Entrada")}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Registrar entrada
            </Button>
            <Button
              onClick={() => {
                setItemForm(blankItem);
                setModal("item");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo EPI
            </Button>
          </>
        }
      />
      {loadError && (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200"
        >
          Falha ao carregar dados do banco: {loadError}
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
          <p className="text-xs text-slate-400">Itens cadastrados</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {items.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Unidades em estoque</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {items.reduce((sum, item) => sum + item.quantidade, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-300/[0.06] p-4">
          <p className="text-xs text-amber-100/70">Abaixo do estoque mínimo</p>
          <p className="mt-2 text-2xl font-semibold text-amber-100">
            {lowStock}
          </p>
        </div>
      </section>
      <section className="border-b border-slate-800">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm ${tab === item ? "border-emerald-300 text-emerald-200" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar item, código ou CA"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white"
          />
        </label>
        <div className="flex gap-2">
          {movementTabs.map((movementKind) => (
            <Button
              key={movementKind}
              variant="secondary"
              onClick={() => openMovement(movementKind)}
            >
              {movementKind === "Entrega" ? (
                <ArrowUpFromLine className="mr-2 h-4 w-4" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              {movementKind}
            </Button>
          ))}
        </div>
      </section>

      {tab === "Estoque" ? (
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-xs text-slate-400">
                <tr>
                  {[
                    "Equipamento",
                    "Categoria / CA",
                    "Tamanho",
                    "Quantidade",
                    "Estoque mínimo",
                    "Fornecedor",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-800 text-slate-300"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-medium text-white">
                        <HardHat className="h-4 w-4 text-emerald-200" />
                        {item.nome}
                      </span>
                      <span className="ml-6 text-xs text-slate-500">
                        {item.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.categoria}
                      <span className="block text-xs text-slate-500">
                        {item.ca}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.tamanho}</td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          item.quantidade <= item.minimo ? "warning" : "success"
                        }
                      >
                        {item.quantidade} un.
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{item.minimo} un.</td>
                    <td className="px-4 py-3">{item.fornecedor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!visibleItems.length && (
            <p className="p-8 text-center text-sm text-slate-400">
              Nenhum EPI cadastrado no banco.
            </p>
          )}
        </section>
      ) : null}
      {["Entradas", "Entregas", "Devoluções"].includes(tab) && (
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-xs text-slate-400">
                <tr>
                  {[
                    "Movimentação",
                    "EPI",
                    "Quantidade",
                    "Funcionário",
                    "Data",
                    "Observação",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements
                  .filter((movement) => movement.tipo === selectedMovement)
                  .map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-t border-slate-800 text-slate-300"
                    >
                      <td className="px-4 py-3">{movement.tipo}</td>
                      <td className="px-4 py-3 text-white">{movement.epi}</td>
                      <td className="px-4 py-3">{movement.quantidade}</td>
                      <td className="px-4 py-3">
                        {movement.funcionario || "Estoque"}
                      </td>
                      <td className="px-4 py-3">
                        {movement.data.split("-").reverse().join("/")}
                      </td>
                      <td className="px-4 py-3">{movement.detalhe}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!movements.some(
            (movement) => movement.tipo === selectedMovement,
          ) && (
            <p className="p-8 text-center text-sm text-slate-400">
              Sem movimentações nesta categoria.
            </p>
          )}
        </section>
      )}
      {(tab === "Termos" || tab === "Estoque") && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="text-xs text-slate-400 sm:min-w-72">
              Funcionário para o termo
              <select
                value={termEmployee}
                onChange={(event) => setTermEmployee(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                <option value="">Selecione um funcionário</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nome}
                  </option>
                ))}
              </select>
            </label>
            <Button
              variant="secondary"
              disabled={!termEmployee}
              onClick={() => setTermOpen(true)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir termo
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                exportCsv(
                  [
                    { label: "Item", value: (item: EpiItem) => item.nome },
                    { label: "Código", value: (item: EpiItem) => item.codigo },
                    {
                      label: "Categoria",
                      value: (item: EpiItem) => item.categoria,
                    },
                    { label: "CA", value: (item: EpiItem) => item.ca },
                    {
                      label: "Tamanho",
                      value: (item: EpiItem) => item.tamanho,
                    },
                    {
                      label: "Quantidade",
                      value: (item: EpiItem) => item.quantidade,
                    },
                    { label: "Mínimo", value: (item: EpiItem) => item.minimo },
                    {
                      label: "Fornecedor",
                      value: (item: EpiItem) => item.fornecedor,
                    },
                  ],
                  items,
                  "estoque-epi.csv",
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar estoque
            </Button>
          </div>
        </section>
      )}

      {termOpen && (
        <Modal
          title="Termo de entrega de EPI"
          onClose={() => setTermOpen(false)}
        >
          <div className="printable print-receipt space-y-4 rounded-lg border border-slate-700 bg-white p-6 text-slate-900">
            <h2 className="border-b border-slate-300 pb-3 text-center text-lg font-bold">
              DUSNEI DISTRIBUIDORA
            </h2>
            <p className="text-sm">
              Termo de responsabilidade de entrega de equipamentos de proteção
              individual
            </p>
            <p className="text-sm">
              <strong>Funcionário:</strong> {employees.find((employee) => employee.id === termEmployee)?.nome ?? ""}
            </p>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="py-2">Equipamento</th>
                  <th>CA</th>
                  <th>Qtd.</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {movements
                  .filter(
                    (movement) =>
                      movement.tipo === "Entrega" &&
                      movement.funcionario === employees.find((employee) => employee.id === termEmployee)?.nome,
                  )
                  .map((movement) => (
                    <tr key={movement.id} className="border-b border-slate-200">
                      <td className="py-2">{movement.epi}</td>
                      <td>{movement.detalhe}</td>
                      <td>{movement.quantidade}</td>
                      <td>{movement.data.split("-").reverse().join("/")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="text-xs leading-relaxed">
              Declaro o recebimento dos itens listados e comprometo-me a
              utilizá-los conforme orientações de segurança e a comunicar danos
              ou necessidade de substituição.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-500 pt-2">
                Assinatura do funcionário
              </div>
              <div className="border-t border-slate-500 pt-2">
                Responsável pela entrega
              </div>
            </div>
          </div>
          <div className="no-print mt-4 flex justify-end">
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir termo
            </Button>
          </div>
        </Modal>
      )}
      {modal === "item" && (
        <Modal title="Cadastrar EPI" onClose={() => setModal(null)}>
          <form onSubmit={saveItem} className="space-y-4">
            <Input
              label="Nome do equipamento"
              required
              value={itemForm.nome}
              onChange={(event) =>
                setItemForm({ ...itemForm, nome: event.target.value })
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Código"
                required
                value={itemForm.codigo}
                onChange={(event) =>
                  setItemForm({ ...itemForm, codigo: event.target.value })
                }
              />
              <Input
                label="Categoria"
                value={itemForm.categoria}
                onChange={(event) =>
                  setItemForm({ ...itemForm, categoria: event.target.value })
                }
              />
              <Input
                label="Certificado de aprovação (CA)"
                value={itemForm.ca}
                onChange={(event) =>
                  setItemForm({ ...itemForm, ca: event.target.value })
                }
              />
              <Input
                label="Tamanho"
                value={itemForm.tamanho}
                onChange={(event) =>
                  setItemForm({ ...itemForm, tamanho: event.target.value })
                }
              />
              <Input
                label="Quantidade inicial"
                type="number"
                min="0"
                value={itemForm.quantidade}
                onChange={(event) =>
                  setItemForm({
                    ...itemForm,
                    quantidade: Number(event.target.value),
                  })
                }
              />
              <Input
                label="Estoque mínimo"
                type="number"
                min="0"
                value={itemForm.minimo}
                onChange={(event) =>
                  setItemForm({
                    ...itemForm,
                    minimo: Number(event.target.value),
                  })
                }
              />
            </div>
            <Input
              label="Fornecedor"
              value={itemForm.fornecedor}
              onChange={(event) =>
                setItemForm({ ...itemForm, fornecedor: event.target.value })
              }
            />
            <div className="flex justify-end">
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar item
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "movement" && (
        <Modal
          title={`Registrar ${kind.toLocaleLowerCase("pt-BR")}`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={saveMovement} className="space-y-4">
            <label className="block text-xs text-slate-400">
              Equipamento
              <select
                required
                value={movementForm.epiId}
                onChange={(event) =>
                  setMovementForm({
                    ...movementForm,
                    epiId: event.target.value,
                  })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                <option value="">Selecione</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} · saldo {item.quantidade}
                  </option>
                ))}
              </select>
            </label>
            {kind !== "Entrada" && (
              <label className="block text-xs text-slate-400">
                Funcionário
                <select
                  required
                  value={movementForm.funcionario}
                  onChange={(event) =>
                    setMovementForm({
                      ...movementForm,
                      funcionario: event.target.value,
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                >
                  <option value="">Selecione</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Quantidade"
                type="number"
                min="1"
                required
                value={movementForm.quantidade}
                onChange={(event) =>
                  setMovementForm({
                    ...movementForm,
                    quantidade: Number(event.target.value),
                  })
                }
              />
              <Input
                label="Data"
                type="date"
                required
                value={movementForm.data}
                onChange={(event) =>
                  setMovementForm({ ...movementForm, data: event.target.value })
                }
              />
            </div>
            <Input
              label={
                kind === "Entrada"
                  ? "Nota fiscal / fornecedor"
                  : "Motivo / condição"
              }
              value={movementForm.detalhe}
              onChange={(event) =>
                setMovementForm({
                  ...movementForm,
                  detalhe: event.target.value,
                })
              }
            />
            <div className="flex justify-end">
              <Button type="submit">Confirmar movimentação</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
