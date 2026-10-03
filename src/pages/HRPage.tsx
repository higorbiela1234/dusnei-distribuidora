import {
  Plus,
  Sparkles,
  Trash2,
  Eye,
  Printer,
  Circle,
  Upload,
  FileUp,
  Search,
} from "lucide-react";
import React, { useState, useEffect, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function HRPage() {
  const [activeTab, setActiveTab] = useState<"admissoes" | "demissoes" | "aso" | "atestados" | "advertencias">("aso");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [termoPesquisa, setTermoPesquisa] = useState("");

  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [processoSelecionadoId, setProcessoSelecionadoId] = useState<string | null>(null);
  const [tipoProcessoAtivo, setTipoProcessoAtivo] = useState<"admissao" | "demissao">("admissao");
  const [novaEtapaTitulo, setNovaEtapaTitulo] = useState("");

  const [funcionariosCadastrados, setFuncionariosCadastrados] = useState<Array<{ id: string; nome: string; cargo: string; cpf?: string; departamento?: string }>>([]);

  // Carregar funcionários cadastrados
  useEffect(() => {
    try {
      const dadosSalvos = localStorage.getItem("@dusnei_funcionarios");
      if (dadosSalvos) {
        const parsed = JSON.parse(dadosSalvos);
        const formatados = parsed.map((f: any, index: number) => ({
          id: f.id || String(index + 1),
          nome: f.nome || f.funcionario || "Colaborador",
          cargo: f.cargo || "Não especificado",
          cpf: f.cpf || "",
          departamento: f.departamento || ""
        }));
        setFuncionariosCadastrados(formatados);
      } else {
        setFuncionariosCadastrados([
          { id: "1", nome: "Lucas Almeida", cargo: "Faturista Noturno" },
          { id: "2", nome: "João da Silva", cargo: "Auxiliar de Expedição" }
        ]);
      }
    } catch (error) {
      console.error("Erro ao carregar funcionários do cadastro:", error);
    }
  }, []);

  // --- PERSISTÊNCIA NO LOCALSTORAGE PARA CADA ABA ---

  // 1. Admissões
  const [processosAdmissao, setProcessosAdmissao] = useState(() => {
    const salvo = localStorage.getItem("@dusnei_admissoes");
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "1",
        candidato: "Lucas Almeida",
        cargo: "Faturista Noturno",
        etapas: [
          { id: "e1", titulo: "Documentos Pessoais Entregues", concluido: true },
          { id: "e2", titulo: "Exame Admissional (ASO) Realizado", concluido: true },
          { id: "e3", titulo: "Integração de Segurança Realizada", concluido: false },
          { id: "e4", titulo: "Entrega de EPIs / Uniforme", concluido: false },
        ]
      },
      {
        id: "2",
        candidato: "João da Silva",
        cargo: "Auxiliar de Expedição",
        etapas: [
          { id: "e1", titulo: "Documentos Pessoais Entregues", concluido: false },
          { id: "e2", titulo: "Exame Admissional (ASO) Realizado", concluido: false },
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("@dusnei_admissoes", JSON.stringify(processosAdmissao));
  }, [processosAdmissao]);

  // 2. Demissões
  const [processosDemissao, setProcessosDemissao] = useState(() => {
    const salvo = localStorage.getItem("@dusnei_demissoes");
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "d1",
        candidato: "Carlos Eduardo",
        cargo: "Assistente de Logística",
        etapas: [
          { id: "ed1", titulo: "Aviso Prévio Comunicado / Formalizado", concluido: true },
          { id: "ed2", titulo: "Exame Demissional (ASO) Agendado", concluido: false },
          { id: "ed3", titulo: "Devolução de EPIs e Crachá", concluido: false },
          { id: "ed4", titulo: "Homologação e Acordo de Rescisão", concluido: false },
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("@dusnei_demissoes", JSON.stringify(processosDemissao));
  }, [processosDemissao]);

  // 3. ASO
  const [asoList, setAsoList] = useState(() => {
    const salvo = localStorage.getItem("@dusnei_aso");
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "1",
        colaboradorNome: "Lucas Almeida",
        tipoAso: "Admissional",
        aptidao: "Apto",
        dataRealizacao: "2026-09-01",
        validade: "2027-09-01",
        medico: "Dra. Juliana Souza (CRM 31284-PR)"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("@dusnei_aso", JSON.stringify(asoList));
  }, [asoList]);

  // 4. Atestados
  const [atestadosList, setAtestadosList] = useState(() => {
    const salvo = localStorage.getItem("@dusnei_atestados");
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "1",
        colaboradorNome: "João da Silva",
        dataEmissao: "2026-09-27",
        quantidadeDias: 3,
        cid: "J02.9",
        medico: "Dr. Carlos Alberto (CRM 12345-PR)",
        dataRetorno: "2026-09-30"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("@dusnei_atestados", JSON.stringify(atestadosList));
  }, [atestadosList]);

  // 5. Advertências / Outros
  const [registosGerais, setRegistosGerais] = useState(() => {
    const salvo = localStorage.getItem("@dusnei_registos_gerais");
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) { console.error(e); }
    }
    return { advertencias: [] };
  });

  useEffect(() => {
    localStorage.setItem("@dusnei_registos_gerais", JSON.stringify(registosGerais));
  }, [registosGerais]);

  // Estados do Formulário Principal
  const [formFuncionarioId, setFormFuncionarioId] = useState("");
  const [formTipoAdvertencia, setFormTipoAdvertencia] = useState("Advertência verbal");
  const [formMotivo, setFormMotivo] = useState("");
  const [formDescricao, setDescricao] = useState("");
  const [formObservacoes, setFormObservacoes] = useState("");
  
  const [formDiasAtestado, setFormDiasAtestado] = useState(3);
  const [formCid, setFormCid] = useState("");
  const [formMedico, setFormMedico] = useState("");
  const [formDatainicio, setFormDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [formDataFim, setFormDataFim] = useState("");
  const [formDataRetorno, setFormDataRetorno] = useState("");

  const [formTipoAso, setFormTipoAso] = useState("Admissional");
  const [formAptidaoAso, setFormAptidaoAso] = useState("Apto");
  const [formMedicoAso, setFormMedicoAso] = useState("");
  const [formCrmAso, setFormCrmAso] = useState("");
  const [formDataRealizacaoAso, setFormDataRealizacaoAso] = useState(new Date().toISOString().split("T")[0]);
  const [formValidadeAso, setFormValidadeAso] = useState("");

  const [nomeFicheiroAnexado, setNomeFicheiroAnexado] = useState("");
  const [lendoDocumentoIA, setLendoDocumentoIA] = useState(false);

  useEffect(() => {
    if (formDatainicio && formDiasAtestado) {
      const inicio = new Date(formDatainicio);
      const fim = new Date(inicio);
      fim.setDate(inicio.getDate() + (Number(formDiasAtestado) - 1));
      setFormDataFim(fim.toISOString().split("T")[0]);

      const retorno = new Date(inicio);
      retorno.setDate(inicio.getDate() + Number(formDiasAtestado));
      setFormDataRetorno(retorno.toISOString().split("T")[0]);
    }
  }, [formDatainicio, formDiasAtestado]);

  useEffect(() => {
    if (formDataRealizacaoAso) {
      const realizacao = new Date(formDataRealizacaoAso);
      const validade = new Date(realizacao);
      validade.setFullYear(realizacao.getFullYear() + 1);
      setFormValidadeAso(validade.toISOString().split("T")[0]);
    }
  }, [formDataRealizacaoAso]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNomeFicheiroAnexado(file.name);
    setLendoDocumentoIA(true);

    setTimeout(() => {
      if (activeTab === "atestados") {
        setFormDiasAtestado(3);
        setFormCid("J02.9");
        setFormMedico("Dr. Roberto Mendes (CRM 24192-PR)");
      } else if (activeTab === "aso") {
        setFormTipoAso("Periódico");
        setFormAptidaoAso("Apto");
        setFormMedicoAso("Dra. Juliana Souza");
        setFormCrmAso("CRM 31284-PR");
      }
      setLendoDocumentoIA(false);
    }, 1200);
  };

  const processosAdmissaoFiltrados = processosAdmissao.filter((proc: any) => 
    proc.candidato.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    proc.cargo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    proc.etapas.some((e: any) => e.titulo.toLowerCase().includes(termoPesquisa.toLowerCase()))
  );

  const processosDemissaoFiltrados = processosDemissao.filter((proc: any) => 
    proc.candidato.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    proc.cargo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    proc.etapas.some((e: any) => e.titulo.toLowerCase().includes(termoPesquisa.toLowerCase()))
  );

  const atestadosFiltrados = atestadosList.filter((item: any) =>
    item.colaboradorNome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    item.cid.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    item.medico.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  const asoFiltrados = asoList.filter((item: any) =>
    item.colaboradorNome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    item.tipoAso.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    item.medico.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  const registosGeraisFiltrados = (registosGerais[activeTab] || []).filter((reg: any) =>
    reg.funcionario.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    reg.detalhe.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    reg.status.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  const abrirModalNovaEtapa = (processoId: string, tipo: "admissao" | "demissao") => {
    setProcessoSelecionadoId(processoId);
    setTipoProcessoAtivo(tipo);
    setNovaEtapaTitulo("");
    setIsEtapaModalOpen(true);
  };

  const handleSalvarNovaEtapa = (e: FormEvent) => {
    e.preventDefault();
    if (!novaEtapaTitulo.trim() || !processoSelecionadoId) return;

    if (tipoProcessoAtivo === "admissao") {
      setProcessosAdmissao(processosAdmissao.map((proc: any) => {
        if (proc.id === processoSelecionadoId) {
          return {
            ...proc,
            etapas: [
              ...proc.etapas,
              { id: Date.now().toString(), titulo: novaEtapaTitulo.trim(), concluido: false }
            ]
          };
        }
        return proc;
      }));
    } else {
      setProcessosDemissao(processosDemissao.map((proc: any) => {
        if (proc.id === processoSelecionadoId) {
          return {
            ...proc,
            etapas: [
              ...proc.etapas,
              { id: Date.now().toString(), titulo: novaEtapaTitulo.trim(), concluido: false }
            ]
          };
        }
        return proc;
      }));
    }

    setIsEtapaModalOpen(false);
    setNovaEtapaTitulo("");
    setProcessoSelecionadoId(null);
  };

  const removerEtapa = (processoId: string, etapaId: string, tipo: "admissao" | "demissao") => {
    if (tipo === "admissao") {
      setProcessosAdmissao(processosAdmissao.map((proc: any) => {
        if (proc.id === processoId) {
          return {
            ...proc,
            etapas: proc.etapas.filter((e: any) => e.id !== etapaId)
          };
        }
        return proc;
      }));
    } else {
      setProcessosDemissao(processosDemissao.map((proc: any) => {
        if (proc.id === processoId) {
          return {
            ...proc,
            etapas: proc.etapas.filter((e: any) => e.id !== etapaId)
          };
        }
        return proc;
      }));
    }
  };

  const removerProcessoCompleto = (processoId: string, nomeCandidato: string, tipo: "admissao" | "demissao") => {
    if (confirm(`Tem certeza que deseja excluir o checklist de ${tipo === "admissao" ? "admissão" : "demissão"} de ${nomeCandidato}?`)) {
      if (tipo === "admissao") {
        setProcessosAdmissao(processosAdmissao.filter((proc: any) => proc.id !== processoId));
      } else {
        setProcessosDemissao(processosDemissao.filter((proc: any) => proc.id !== processoId));
      }
    }
  };

  const handleGerarComIA = () => {
    if (!formMotivo.trim()) {
      alert("Por favor, preencha o campo de motivo primeiro.");
      return;
    }
    const textoGerado = `Vimos por meio deste registrar notificação formal em decorrência de: ${formMotivo}. Salientamos que a reiteração poderá acarretar medidas disciplinares mais severas.`;
    setDescricao(textoGerado);
  };

  const handleSaveRegistro = (e: FormEvent) => {
    e.preventDefault();
    if (!formFuncionarioId) {
      alert("Por favor, selecione um funcionário.");
      return;
    }

    const funcSelecionado = funcionariosCadastrados.find(f => f.id === formFuncionarioId);
    const nomeFuncionario = funcSelecionado ? funcSelecionado.nome : "Colaborador";

    if (activeTab === "atestados") {
      setAtestadosList([
        ...atestadosList,
        {
          id: Date.now().toString(),
          colaboradorNome: nomeFuncionario,
          dataEmissao: formDatainicio || new Date().toISOString().split("T")[0],
          quantidadeDias: Number(formDiasAtestado) || 1,
          cid: formCid || "Geral",
          medico: formMedico || "Médico Responsável",
          dataRetorno: formDataRetorno || "-"
        }
      ]);
    } else if (activeTab === "aso") {
      setAsoList([
        ...asoList,
        {
          id: Date.now().toString(),
          colaboradorNome: nomeFuncionario,
          tipoAso: formTipoAso,
          aptidao: formAptidaoAso,
          dataRealizacao: formDataRealizacaoAso,
          validade: formValidadeAso,
          medico: `${formMedicoAso || "Médico Examinador"} (${formCrmAso || "CRM N/I"})`
        }
      ]);
    } else {
      const detalheTexto = activeTab === "advertencias" 
        ? `${formTipoAdvertencia}: ${formMotivo} - ${formDescricao}` 
        : formObservacoes || "Registo padrão";

      setRegistosGerais({
        ...registosGerais,
        [activeTab]: [
          ...(registosGerais[activeTab] || []),
          {
            id: Date.now().toString(),
            funcionario: nomeFuncionario,
            detalhe: detalheTexto,
            status: "Registado"
          }
        ]
      });
    }

    setIsModalOpen(false);
    setFormFuncionarioId("");
    setFormMotivo("");
    setDescricao("");
    setFormObservacoes("");
    setFormCid("");
    setFormMedico("");
    setFormMedicoAso("");
    setFormCrmAso("");
    setNomeFicheiroAnexado("");
  };

  const handleVerAnexo = (item: any) => {
    alert(`Visualizando anexo de: ${item.colaboradorNome || item.funcionario}`);
  };

  const handleImprimirDocumento = (item: any) => {
    const janelaImpressao = window.open('', '_blank');
    if (janelaImpressao) {
      janelaImpressao.document.write(`
        <html>
          <head><title>Comprovante - ${item.colaboradorNome || item.funcionario}</title></head>
          <body style="font-family: Arial; padding: 20px;">
            <h2>Dusnei Distribuidora - Gestão de Pessoas</h2>
            <p><b>Colaborador:</b> ${item.colaboradorNome || item.funcionario}</p>
            <p><b>Detalhe:</b> ${item.tipoAso || item.cid || item.detalhe}</p>
            <script>window.print();</script>
          </body>
        </html>
      `);
      janelaImpressao.document.close();
    }
  };

  const toggleEtapaAdmissao = (processoId: string, etapaId: string) => {
    setProcessosAdmissao(processosAdmissao.map((proc: any) => {
      if (proc.id === processoId) {
        const novasEtapas = proc.etapas.map((etp: any) => 
          etp.id === etapaId ? { ...etp, concluido: !etp.concluido } : etp
        );
        return { ...proc, etapas: novasEtapas };
      }
      return proc;
    }));
  };

  const toggleEtapaDemissao = (processoId: string, etapaId: string) => {
    setProcessosDemissao(processosDemissao.map((proc: any) => {
      if (proc.id === processoId) {
        const novasEtapas = proc.etapas.map((etp: any) => 
          etp.id === etapaId ? { ...etp, concluido: !etp.concluido } : etp
        );
        return { ...proc, etapas: novasEtapas };
      }
      return proc;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            placeholder="Buscar pessoa, CPF, matrícula ou área..."
            className="w-full rounded-xl border border-white/10 bg-[#0d1513] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#8b5cf6] focus:outline-none shadow-inner"
          />
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          className="gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium rounded-xl shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" /> Novo Registo
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Gestão De Pessoas e DP</h1>
      </div>

      <div className="flex border-b border-white/10 gap-6 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab("admissoes")}
          className={`pb-3 border-b-2 font-medium transition whitespace-nowrap ${activeTab === "admissoes" ? "border-[#8b5cf6] text-white" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Admissões
        </button>
        <button
          onClick={() => setActiveTab("demissoes")}
          className={`pb-3 border-b-2 font-medium transition whitespace-nowrap ${activeTab === "demissoes" ? "border-[#8b5cf6] text-white" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Demissões
        </button>
        <button
          onClick={() => setActiveTab("aso")}
          className={`pb-3 border-b-2 font-medium transition whitespace-nowrap ${activeTab === "aso" ? "border-[#8b5cf6] text-white" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          ASO
        </button>
        <button
          onClick={() => setActiveTab("atestados")}
          className={`pb-3 border-b-2 font-medium transition whitespace-nowrap ${activeTab === "atestados" ? "border-[#8b5cf6] text-white" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Atestados
        </button>
        <button
          onClick={() => setActiveTab("advertencias")}
          className={`pb-3 border-b-2 font-medium transition whitespace-nowrap ${activeTab === "advertencias" ? "border-[#8b5cf6] text-white" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Advertências
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0d1513] p-6 shadow-xl space-y-6">
        
        {/* ADMISSÕES */}
        {activeTab === "admissoes" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {processosAdmissaoFiltrados.length === 0 ? (
                <div className="py-12 text-center text-slate-500">Nenhum checklist encontrado.</div>
              ) : (
                processosAdmissaoFiltrados.map((proc: any) => {
                  const total = proc.etapas.length;
                  const concluidas = proc.etapas.filter((e: any) => e.concluido).length;
                  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

                  return (
                    <div key={proc.id} className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="text-base font-bold text-white">{proc.candidato}</h4>
                          <p className="text-xs text-[#8b5cf6] font-medium">Cargo: {proc.cargo}</p>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-400">{progresso}% Concluído</span>
                            <div className="w-28 bg-white/10 h-2 rounded-full mt-1 overflow-hidden">
                              <div className="bg-[#8b5cf6] h-full transition-all duration-300" style={{ width: `${progresso}%` }}></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => abrirModalNovaEtapa(proc.id, "admissao")}
                              className="gap-1.5 bg-[#8b5cf6]/20 hover:bg-[#8b5cf6]/30 text-[#8b5cf6] border border-[#8b5cf6]/30 text-xs px-3 py-1.5 h-auto rounded-lg transition"
                            >
                              <Plus size={14} /> Etapa
                            </Button>
                            <button
                              onClick={() => removerProcessoCompleto(proc.id, proc.candidato, "admissao")}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-1.5 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {proc.etapas.map((etapa: any) => (
                          <div
                            key={etapa.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition ${
                              etapa.concluido ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-white' : 'bg-white/[0.02] border-white/10 text-slate-300'
                            }`}
                          >
                            <div onClick={() => toggleEtapaAdmissao(proc.id, etapa.id)} className="flex items-center gap-3 flex-1 cursor-pointer">
                              {etapa.concluido ? <Circle className="text-[#8b5cf6] fill-[#8b5cf6]" size={18} /> : <Circle className="text-slate-500" size={18} />}
                              <span className={`text-xs font-medium ${etapa.concluido ? 'line-through text-slate-400' : ''}`}>{etapa.titulo}</span>
                            </div>
                            <button onClick={() => removerEtapa(proc.id, etapa.id, "admissao")} className="text-slate-500 hover:text-red-400 p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* DEMISSÕES */}
        {activeTab === "demissoes" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {processosDemissaoFiltrados.length === 0 ? (
                <div className="py-12 text-center text-slate-500">Nenhum checklist de demissão encontrado.</div>
              ) : (
                processosDemissaoFiltrados.map((proc: any) => {
                  const total = proc.etapas.length;
                  const concluidas = proc.etapas.filter((e: any) => e.concluido).length;
                  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

                  return (
                    <div key={proc.id} className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="text-base font-bold text-white">{proc.candidato}</h4>
                          <p className="text-xs text-[#8b5cf6] font-medium">Cargo: {proc.cargo}</p>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-400">{progresso}% Concluído</span>
                            <div className="w-28 bg-white/10 h-2 rounded-full mt-1 overflow-hidden">
                              <div className="bg-[#8b5cf6] h-full transition-all duration-300" style={{ width: `${progresso}%` }}></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => abrirModalNovaEtapa(proc.id, "demissao")}
                              className="gap-1.5 bg-[#8b5cf6]/20 hover:bg-[#8b5cf6]/30 text-[#8b5cf6] border border-[#8b5cf6]/30 text-xs px-3 py-1.5 h-auto rounded-lg transition"
                            >
                              <Plus size={14} /> Etapa
                            </Button>
                            <button
                              onClick={() => removerProcessoCompleto(proc.id, proc.candidato, "demissao")}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-1.5 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {proc.etapas.map((etapa: any) => (
                          <div
                            key={etapa.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition ${
                              etapa.concluido ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-white' : 'bg-white/[0.02] border-white/10 text-slate-300'
                            }`}
                          >
                            <div onClick={() => toggleEtapaDemissao(proc.id, etapa.id)} className="flex items-center gap-3 flex-1 cursor-pointer">
                              {etapa.concluido ? <Circle className="text-[#8b5cf6] fill-[#8b5cf6]" size={18} /> : <Circle className="text-slate-500" size={18} />}
                              <span className={`text-xs font-medium ${etapa.concluido ? 'line-through text-slate-400' : ''}`}>{etapa.titulo}</span>
                            </div>
                            <button onClick={() => removerEtapa(proc.id, etapa.id, "demissao")} className="text-slate-500 hover:text-red-400 p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ASO */}
        {activeTab === "aso" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Controle de ASO</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-3 px-4">COLABORADOR</th>
                    <th className="py-3 px-4">TIPO DE ASO</th>
                    <th className="py-3 px-4">APTIDÃO</th>
                    <th className="py-3 px-4">REALIZAÇÃO</th>
                    <th className="py-3 px-4">VALIDADE</th>
                    <th className="py-3 px-4">MÉDICO EXAMINADOR</th>
                    <th className="py-3 px-4 text-center">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {asoFiltrados.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-500">Nenhum registo ASO.</td></tr>
                  ) : (
                    asoFiltrados.map((item: any) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-medium text-white">{item.colaboradorNome}</td>
                        <td className="py-3 px-4"><span className="bg-[#8b5cf6]/10 text-[#8b5cf6] px-2.5 py-1 rounded-full text-xs font-bold">{item.tipoAso}</span></td>
                        <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.aptidao === 'Apto' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{item.aptidao}</span></td>
                        <td className="py-3 px-4">{new Date(item.dataRealizacao).toLocaleDateString("pt-BR")}</td>
                        <td className="py-3 px-4 font-semibold text-white">{new Date(item.validade).toLocaleDateString("pt-BR")}</td>
                        <td className="py-3 px-4 text-xs text-slate-400">{item.medico}</td>
                        <td className="py-3 px-4 text-center space-x-1">
                          <button onClick={() => handleVerAnexo(item)} className="text-[#8b5cf6] text-xs bg-[#8b5cf6]/10 px-2 py-1 rounded">Ver</button>
                          <button onClick={() => handleImprimirDocumento(item)} className="text-slate-300 text-xs bg-white/10 px-2 py-1 rounded">Imprimir</button>
                          <button 
                            onClick={() => {
                              if (confirm(`Deseja remover o ASO de ${item.colaboradorNome}?`)) {
                                setAsoList(asoList.filter((a: any) => a.id !== item.id));
                              }
                            }} 
                            className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ATESTADOS */}
        {activeTab === "atestados" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Controle de Atestados</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-3 px-4">COLABORADOR</th>
                    <th className="py-3 px-4">DATA INÍCIO</th>
                    <th className="py-3 px-4">DIAS</th>
                    <th className="py-3 px-4">RETORNO</th>
                    <th className="py-3 px-4">CID / MÉDICO</th>
                    <th className="py-3 px-4 text-center">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {atestadosFiltrados.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-500">Nenhum atestado registado.</td></tr>
                  ) : (
                    atestadosFiltrados.map((item: any) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-medium text-white">{item.colaboradorNome}</td>
                        <td className="py-3 px-4">{new Date(item.dataEmissao).toLocaleDateString("pt-BR")}</td>
                        <td className="py-3 px-4"><span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold">{item.quantidadeDias} dia(s)</span></td>
                        <td className="py-3 px-4 font-semibold text-white">{item.dataRetorno ? new Date(item.dataRetorno).toLocaleDateString("pt-BR") : "-"}</td>
                        <td className="py-3 px-4"><div className="text-white">{item.cid}</div><div className="text-xs text-slate-400">{item.medico}</div></td>
                        <td className="py-3 px-4 text-center space-x-1">
                          <button onClick={() => handleVerAnexo(item)} className="text-[#8b5cf6] text-xs bg-[#8b5cf6]/10 px-2 py-1 rounded">Ver</button>
                          <button onClick={() => handleImprimirDocumento(item)} className="text-slate-300 text-xs bg-white/10 px-2 py-1 rounded">Imprimir</button>
                          <button 
                            onClick={() => {
                              if (confirm(`Deseja remover o atestado de ${item.colaboradorNome}?`)) {
                                setAtestadosList(atestadosList.filter((a: any) => a.id !== item.id));
                              }
                            }} 
                            className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADVERTÊNCIAS */}
        {activeTab === "advertencias" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">FUNCIONÁRIO</th>
                  <th className="py-3 px-4">DETALHES</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {registosGeraisFiltrados.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-slate-500">Nenhum registo de advertência.</td></tr>
                ) : (
                  registosGeraisFiltrados.map((reg: any) => (
                    <tr key={reg.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-medium text-white">{reg.funcionario}</td>
                      <td className="py-3 px-4 text-slate-300">{reg.detalhe}</td>
                      <td className="py-3 px-4"><span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold">{reg.status}</span></td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => {
                            if (confirm(`Deseja remover este registo?`)) {
                              setRegistosGerais({
                                ...registosGerais,
                                [activeTab]: registosGerais[activeTab].filter((r: any) => r.id !== reg.id)
                              });
                            }
                          }}
                          className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {isEtapaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121c19] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h2 className="text-lg font-semibold text-white">Adicionar Nova Etapa</h2>
              <button onClick={() => setIsEtapaModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSalvarNovaEtapa} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">TÍTULO DA ETAPA</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={novaEtapaTitulo}
                  onChange={(e) => setNovaEtapaTitulo(e.target.value)}
                  placeholder="Ex: Assinatura do Termo"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setIsEtapaModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium">Adicionar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121c19] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h2 className="text-lg font-semibold text-white">Novo Registo - {activeTab.toUpperCase()}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRegistro} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">FUNCIONÁRIO / COLABORADOR</label>
                <select
                  required
                  value={formFuncionarioId}
                  onChange={(e) => setFormFuncionarioId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#121c19] px-3 py-2 text-sm text-white focus:border-[#8b5cf6] focus:outline-none"
                >
                  <option value="" className="bg-[#121c19]">Selecione um funcionário...</option>
                  {funcionariosCadastrados.map((func) => (
                    <option key={func.id} value={func.id} className="bg-[#121c19]">
                      {func.nome} {func.cargo ? `— ${func.cargo}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === "aso" && (
                <div className="space-y-4 bg-white/[0.02] border border-white/10 p-4 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-[#8b5cf6] mb-1 flex items-center gap-1.5">
                      <FileUp size={15} /> ANEXAR LAUDO ASO (LEITURA AUTOMÁTICA)
                    </label>
                    <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-[#8b5cf6] bg-white/[0.04] p-3 rounded-lg cursor-pointer text-xs text-slate-300 transition">
                      <Upload size={16} className="text-[#8b5cf6]" />
                      <span>{nomeFicheiroAnexado ? nomeFicheiroAnexado : "Carregar PDF ou Imagem"}</span>
                      <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {lendoDocumentoIA && <p className="text-xs text-amber-400 mt-1 animate-pulse">A ler dados com IA...</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">TIPO DE ASO</label>
                      <select value={formTipoAso} onChange={(e) => setFormTipoAso(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#121c19] px-3 py-2 text-sm text-white">
                        <option value="Admissional">Admissional</option>
                        <option value="Periódico">Periódico</option>
                        <option value="Retorno ao Trabalho">Retorno ao Trabalho</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">APTIDÃO</label>
                      <select value={formAptidaoAso} onChange={(e) => setFormAptidaoAso(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#121c19] px-3 py-2 text-sm text-white">
                        <option value="Apto">Apto</option>
                        <option value="Inapto">Inapto</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "atestados" && (
                <div className="space-y-4 bg-white/[0.02] border border-white/10 p-4 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-[#8b5cf6] mb-1 flex items-center gap-1.5">
                      <FileUp size={15} /> ANEXAR ATESTADO (LEITURA AUTOMÁTICA)
                    </label>
                    <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-[#8b5cf6] bg-white/[0.04] p-3 rounded-lg cursor-pointer text-xs text-slate-300 transition">
                      <Upload size={16} className="text-[#8b5cf6]" />
                      <span>{nomeFicheiroAnexado ? nomeFicheiroAnexado : "Carregar Atestado"}</span>
                      <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {lendoDocumentoIA && <p className="text-xs text-amber-400 mt-1 animate-pulse">A extrair dados do atestado...</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">DIAS</label>
                      <input type="number" min="1" value={formDiasAtestado} onChange={(e) => setFormDiasAtestado(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">CID</label>
                      <input type="text" value={formCid} onChange={(e) => setFormCid(e.target.value)} placeholder="Ex: J02.9" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">MÉDICO</label>
                      <input type="text" value={formMedico} onChange={(e) => setFormMedico(e.target.value)} placeholder="Dr. Nome" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "advertencias" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">TIPO</label>
                    <select value={formTipoAdvertencia} onChange={(e) => setFormTipoAdvertencia(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#121c19] px-3 py-2 text-sm text-white">
                      <option value="Advertência verbal">Advertência verbal</option>
                      <option value="Advertência escrita">Advertência escrita</option>
                      <option value="Suspensão">Suspensão</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">MOTIVO</label>
                    <Input value={formMotivo} onChange={(e) => setFormMotivo(e.target.value)} placeholder="Motivo..." />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-300">DESCRIÇÃO</label>
                      <button type="button" onClick={handleGerarComIA} className="text-xs text-[#8b5cf6] flex items-center gap-1"><Sparkles size={13} /> Gerar com IA</button>
                    </div>
                    <textarea rows={3} value={formDescricao} onChange={(e) => setDescricao(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white" />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}