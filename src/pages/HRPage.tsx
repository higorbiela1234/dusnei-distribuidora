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
  Sparkles,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function HRPage() {
  const [activeTab, setActiveTab] = useState<"admissoes" | "demissoes" | "aso" | "atestados" | "advertencias">("advertencias");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados do formulário disciplinar
  const [motivo, setMotivo] = useState("");
  const [descricao, setDescricao] = useState("");

  // Função de IA para gerar o texto disciplinar formal
  const handleGerarComIA = () => {
    if (!motivo.trim()) {
      alert("Por favor, preencha o campo 'Motivo' primeiro para que a IA possa redigir o documento.");
      return;
    }

    const textoGerado = `Vimos por meio deste aplicar advertência formal em decorrência de: ${motivo}. Salientamos que a reiteração de procedimentos em desconformidade com as diretrizes e normas internas da Dusnei Distribuidora poderá acarretar medidas disciplinares mais severas, em conformidade com a legislação trabalhista vigente. Contamos com a sua colaboração para o pleno cumprimento das diretrizes da empresa.`;
    
    setDescricao(textoGerado);
  };

  const handleSaveRegistro = (e: FormEvent) => {
    e.preventDefault();
    // Lógica de salvamento do registo disciplinar
    setIsModalOpen(false);
    setMotivo("");
    setDescricao("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Recursos Humanos</h1>
          <p className="text-sm text-slate-400">Admissões, desligamentos, saúde ocupacional e registos disciplinares.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold">
          <Plus className="h-4 w-4" /> Novo registo
        </Button>
      </div>

      {/* Abas de navegação do RH */}
      <div className="flex border-b border-white/10 gap-6 text-sm">
        <button
          onClick={() => setActiveTab("admissoes")}
          className={`pb-3 border-b-2 font-medium transition ${activeTab === "admissoes" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Admissões
        </button>
        <button
          onClick={() => setActiveTab("demissoes")}
          className={`pb-3 border-b-2 font-medium transition ${activeTab === "demissoes" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Demissões
        </button>
        <button
          onClick={() => setActiveTab("aso")}
          className={`pb-3 border-b-2 font-medium transition ${activeTab === "aso" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          ASO
        </button>
        <button
          onClick={() => setActiveTab("atestados")}
          className={`pb-3 border-b-2 font-medium transition ${activeTab === "atestados" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Atestados
        </button>
        <button
          onClick={() => setActiveTab("advertencias")}
          className={`pb-3 border-b-2 font-medium transition ${activeTab === "advertencias" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Advertências
        </button>
      </div>

      {/* Conteúdo da aba ativa */}
      {activeTab === "advertencias" && (
        <div className="rounded-xl border border-white/10 bg-[#14201d]/50 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Funcionário</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Motivo</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4 text-right">Documento</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhum registo disciplinar encontrado. Clique em "Novo registo" para adicionar.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Novo Registo Disciplinar com Botão de IA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#14201d] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h2 className="text-lg font-semibold text-white">Novo registo disciplinar</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRegistro} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">FUNCIONÁRIO</label>
                <select className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none">
                  <option value="">Selecione o funcionário</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">TIPO</label>
                <select className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none">
                  <option>Advertência verbal</option>
                  <option>Advertência escrita</option>
                  <option>Suspensão</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">MOTIVO PRINCIPAL</label>
                <Input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Atraso injustificado ou conduta inadequada..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">DESCRIÇÃO DETALHADA</label>
                  <button
                    type="button"
                    onClick={handleGerarComIA}
                    className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Gerar com IA
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Clique em 'Gerar com IA' após preencher o motivo ou redija manualmente..."
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold">Guardar Registo</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}