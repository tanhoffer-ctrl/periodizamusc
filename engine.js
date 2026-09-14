/* ============================================================
   PeriodizaFit — Motor de Geração de Periodização
   ------------------------------------------------------------
   Este arquivo concentra TODA a lógica de prescrição.
   Foi desenhado para ser fácil de ajustar: os parâmetros de
   cada objetivo e mesociclo ficam em tabelas no topo.
   ============================================================ */

/* ---------- Catálogos (listas fixas) ---------- */

const OBJETIVOS = [
  { id: "hipertrofia", nome: "Hipertrofia" },
  { id: "hipertrofia_estetica", nome: "Hipertrofia Estética" },
  { id: "forca", nome: "Força" },
  { id: "resistencia", nome: "Resistência" },
  { id: "potencia", nome: "Potência" },
  { id: "emagrecimento", nome: "Emagrecimento" },
  { id: "aptidao_geral", nome: "Aptidão Física Geral" },
  { id: "reabilitacao", nome: "Reabilitação" },
];

const FOCOS = [
  { id: "corpo_todo", nome: "Corpo todo" },
  { id: "superiores", nome: "Membros superiores" },
  { id: "inferiores", nome: "Membros inferiores" },
  { id: "core", nome: "Core" },
  { id: "superiores_core", nome: "Superiores + Core" },
  { id: "inferiores_core", nome: "Inferiores + Core" },
];

const NIVEIS = [
  { id: "iniciante", nome: "Iniciante" },
  { id: "intermediario", nome: "Intermediário" },
  { id: "avancado", nome: "Avançado" },
];

/* ---------- Biblioteca de exercícios ----------
   Cada exercício tem: nome, grupo (usado para montar o foco),
   e "padrao" (empurrar/puxar/agachar/etc) para variar sessões. */
const EXERCICIOS = {
  peito: [
    "Supino reto com barra", "Supino inclinado com halteres",
    "Crucifixo na máquina", "Flexão de braço", "Crossover"
  ],
  costas: [
    "Puxada frontal", "Remada curvada", "Remada baixa",
    "Barra fixa", "Pullover"
  ],
  ombros: [
    "Desenvolvimento com halteres", "Elevação lateral",
    "Elevação frontal", "Remada alta", "Crucifixo inverso"
  ],
  biceps: ["Rosca direta", "Rosca alternada", "Rosca scott", "Rosca martelo"],
  triceps: ["Tríceps na polia", "Tríceps testa", "Tríceps francês", "Mergulho no banco"],
  quadriceps: ["Agachamento livre", "Leg press", "Cadeira extensora", "Afundo"],
  posterior: ["Stiff", "Mesa flexora", "Cadeira flexora", "Elevação pélvica"],
  gluteos: ["Elevação pélvica", "Coice na polia", "Abdução na máquina", "Agachamento sumô"],
  panturrilha: ["Panturrilha em pé", "Panturrilha sentado"],
  core: ["Prancha", "Abdominal infra", "Rotação de tronco (cabo)", "Prancha lateral", "Elevação de pernas"],
};

/* Quais grupos musculares entram em cada foco */
const GRUPOS_POR_FOCO = {
  corpo_todo: ["peito", "costas", "ombros", "biceps", "triceps", "quadriceps", "posterior", "gluteos", "panturrilha", "core"],
  superiores: ["peito", "costas", "ombros", "biceps", "triceps"],
  inferiores: ["quadriceps", "posterior", "gluteos", "panturrilha"],
  core: ["core"],
  superiores_core: ["peito", "costas", "ombros", "biceps", "triceps", "core"],
  inferiores_core: ["quadriceps", "posterior", "gluteos", "panturrilha", "core"],
};

/* ============================================================
   MESOCICLOS DE HIPERTROFIA (modelo detalhado do Ricardo)
   Ciclo ondulatório de 12 semanas.
   ============================================================ */
const MESO_HIPERTROFIA = [
  {
    id: "adaptacao",
    nome: "Adaptação e Técnica",
    semanas: 2,
    series: 3,
    repsMin: 10, repsMax: 12,
    descanso: "60-90s",
    intensidade: "Moderada (~60-70% 1RM) · foco em execução",
    tecnicas: [],
    exaustao: false,
    descricao: "Fase inicial voltada ao domínio técnico dos movimentos e adaptação neuromuscular e tendínea. Cargas moderadas, sem falha, priorizando padrão de movimento e amplitude."
  },
  {
    id: "intensificacao1",
    nome: "Intensificação I",
    semanas: 3,
    series: 4,
    repsMin: 8, repsMax: 10,
    descanso: "60-90s",
    intensidade: "Alta (~70-80% 1RM)",
    tecnicas: [],
    exaustao: true,
    descricao: "Aumento progressivo de volume e intensidade. Últimas séries levadas à exaustão concêntrica. Progressão de carga semana a semana mantendo a faixa de repetições."
  },
  {
    id: "intensificacao2",
    nome: "Intensificação II",
    semanas: 3,
    series: 4,
    repsMin: 6, repsMax: 8,
    descanso: "90-120s",
    intensidade: "Alta a muito alta (~75-85% 1RM)",
    tecnicas: ["bi-set", "rest-pause"],
    exaustao: true,
    descricao: "Pico de intensidade com técnicas avançadas. Emprego de bi-set (exercícios do mesmo grupo em sequência) e rest-pause nas séries finais para maximizar o estímulo de hipertrofia."
  },
  {
    id: "consolidacao",
    nome: "Consolidação",
    semanas: 3,
    series: 5,
    repsMin: 8, repsMax: 12,
    descanso: "60-90s",
    intensidade: "Alta com maior volume total",
    tecnicas: [],
    exaustao: true,
    descricao: "Consolidação dos ganhos com maior volume (5 séries). Faixa de repetições mais ampla para acumular estímulo metabólico. Últimas séries à exaustão."
  },
  {
    id: "recuperacao",
    nome: "Recuperação (Deload)",
    semanas: 1,
    series: 3,
    repsMin: 10, repsMax: 12,
    descanso: "60s",
    intensidade: "Reduzida (~50-60% 1RM)",
    tecnicas: [],
    exaustao: false,
    descricao: "Semana de recuperação ativa. Redução de volume e intensidade para dissipar fadiga acumulada, permitir supercompensação e preparar novo ciclo."
  },
];

/* ============================================================
   PARÂMETROS DOS DEMAIS OBJETIVOS
   (valores padrão consolidados — a refinar depois com o Ricardo)
   Cada objetivo define uma sequência de mesociclos.
   ============================================================ */

function mesoSimples(id, nome, semanas, series, repsMin, repsMax, descanso, intensidade, descricao, tecnicas, exaustao) {
  return { id, nome, semanas, series, repsMin, repsMax, descanso, intensidade, descricao, tecnicas: tecnicas || [], exaustao: !!exaustao };
}

const MESOS_POR_OBJETIVO = {
  hipertrofia: MESO_HIPERTROFIA,
  hipertrofia_estetica: [
    mesoSimples("adaptacao", "Adaptação e Técnica", 2, 3, 10, 12, "45-75s", "Moderada · ênfase em conexão mente-músculo", "Adaptação com foco em qualidade de contração e simetria.", [], false),
    mesoSimples("intensificacao1", "Intensificação I", 3, 4, 10, 12, "45-75s", "Alta · volume elevado", "Volume elevado com isolamento de grupos-alvo estéticos. Séries finais à exaustão.", [], true),
    mesoSimples("definicao", "Definição / Densidade", 4, 4, 12, 15, "30-45s", "Moderada-alta · densidade", "Maior densidade (menos descanso) e reps mais altas para detalhamento muscular. Uso de drop-set.", ["drop-set", "bi-set"], true),
    mesoSimples("consolidacao", "Consolidação", 2, 5, 10, 12, "45-60s", "Alta · volume total elevado", "Pico de volume para maximizar pump e definição.", ["bi-set"], true),
    mesoSimples("recuperacao", "Recuperação (Deload)", 1, 3, 12, 12, "60s", "Reduzida", "Recuperação ativa.", [], false),
  ],
  forca: [
    mesoSimples("base", "Base / Hipertrofia funcional", 3, 4, 6, 8, "2-3 min", "Alta (~75-80% 1RM)", "Construção de base muscular para suportar cargas altas.", [], false),
    mesoSimples("forca1", "Força I", 3, 5, 4, 5, "3 min", "Muito alta (~82-87% 1RM)", "Ênfase em movimentos multiarticulares pesados com progressão de carga.", [], false),
    mesoSimples("forca2", "Força II", 3, 5, 2, 3, "3-4 min", "Máxima (~88-93% 1RM)", "Cargas máximas em baixas repetições. Recuperação completa entre séries.", [], false),
    mesoSimples("pico", "Pico / Realização", 2, 3, 1, 3, "4-5 min", "Máxima (~90-95%+ 1RM)", "Expressão máxima de força. Baixíssimo volume, alta especificidade.", [], false),
    mesoSimples("recuperacao", "Recuperação (Deload)", 1, 3, 5, 6, "2 min", "Reduzida", "Recuperação ativa antes de retestar cargas.", [], false),
  ],
  resistencia: [
    mesoSimples("adaptacao", "Adaptação", 2, 2, 15, 20, "30-45s", "Baixa-moderada", "Adaptação com altas repetições e descansos curtos.", [], false),
    mesoSimples("resistencia1", "Resistência Muscular I", 4, 3, 15, 20, "30s", "Moderada", "Aumento de volume com descansos curtos, tolerância à fadiga.", ["circuito"], false),
    mesoSimples("resistencia2", "Resistência Muscular II", 4, 3, 20, 25, "20-30s", "Moderada · alta densidade", "Reps muito altas e alta densidade. Formato de circuito.", ["circuito"], true),
    mesoSimples("recuperacao", "Recuperação (Deload)", 1, 2, 15, 15, "45s", "Reduzida", "Recuperação ativa.", [], false),
  ],
  potencia: [
    mesoSimples("base", "Base de Força", 3, 4, 5, 6, "2-3 min", "Alta (~75-80% 1RM)", "Base de força para sustentar produção de potência.", [], false),
    mesoSimples("conversao1", "Conversão em Potência I", 3, 4, 3, 5, "2-3 min", "Explosiva (~50-60% 1RM em velocidade)", "Movimentos explosivos com intenção máxima de velocidade concêntrica.", ["explosivo"], false),
    mesoSimples("conversao2", "Conversão em Potência II", 3, 5, 2, 4, "3 min", "Explosiva (~30-50% 1RM / pliometria)", "Ênfase em pliometria e movimentos balísticos.", ["pliometria", "explosivo"], false),
    mesoSimples("pico", "Pico", 2, 3, 2, 3, "3-4 min", "Explosiva máxima", "Especificidade máxima de potência.", ["explosivo"], false),
    mesoSimples("recuperacao", "Recuperação (Deload)", 1, 3, 5, 5, "2 min", "Reduzida", "Recuperação ativa.", [], false),
  ],
  emagrecimento: [
    mesoSimples("adaptacao", "Adaptação", 2, 3, 12, 15, "45s", "Moderada · gasto calórico", "Adaptação em formato de circuito para elevar gasto energético.", ["circuito"], false),
    mesoSimples("metabolico1", "Condicionamento Metabólico I", 4, 3, 12, 15, "30-45s", "Moderada-alta · alta densidade", "Circuitos com grandes grupos musculares. Descansos curtos para manter FC elevada.", ["circuito", "bi-set"], false),
    mesoSimples("metabolico2", "Condicionamento Metabólico II", 4, 4, 10, 15, "30s", "Alta densidade · HIIT integrado", "Maior densidade e intensidade, integrando intervalos metabólicos.", ["circuito", "hiit"], true),
    mesoSimples("recuperacao", "Recuperação (Deload)", 1, 2, 12, 12, "60s", "Reduzida", "Recuperação ativa.", [], false),
  ],
  aptidao_geral: [
    mesoSimples("adaptacao", "Adaptação Geral", 3, 3, 10, 12, "60s", "Moderada", "Desenvolvimento equilibrado de força, resistência e mobilidade.", [], false),
    mesoSimples("desenvolvimento", "Desenvolvimento", 4, 3, 10, 15, "45-60s", "Moderada", "Progressão equilibrada de todas as capacidades físicas.", [], false),
    mesoSimples("integracao", "Integração", 4, 3, 12, 15, "45s", "Moderada", "Combinação de força e resistência em formato variado.", ["circuito"], false),
    mesoSimples("recuperacao", "Recuperação (Deload)", 1, 2, 12, 12, "60s", "Reduzida", "Recuperação ativa.", [], false),
  ],
  reabilitacao: [
    mesoSimples("mobilidade", "Mobilidade e Estabilidade", 3, 2, 12, 15, "60-90s", "Muito leve · foco em controle", "Restabelecimento de amplitude, controle motor e estabilização articular. Sem dor.", [], false),
    mesoSimples("fortalecimento1", "Fortalecimento Progressivo I", 4, 3, 12, 15, "60s", "Leve-moderada", "Fortalecimento gradual respeitando limiares de dor. Progressão conservadora.", [], false),
    mesoSimples("fortalecimento2", "Fortalecimento Progressivo II", 4, 3, 10, 12, "60s", "Moderada", "Aumento gradual de carga, retorno progressivo à função.", [], false),
    mesoSimples("retorno", "Retorno Funcional", 1, 2, 12, 12, "60s", "Leve", "Transição controlada para o treinamento regular.", [], false),
  ],
};

/* ---------- Divisão de treino por dias/semana ---------- */
function montarDivisao(focoId, diasSemana) {
  const grupos = GRUPOS_POR_FOCO[focoId];

  // Foco em corpo todo ou muitos grupos → dividir em splits sensatos
  if (focoId === "corpo_todo") {
    if (diasSemana === 3) {
      return [
        { nome: "A — Empurrar (Peito/Ombro/Tríceps)", grupos: ["peito", "ombros", "triceps", "core"] },
        { nome: "B — Puxar (Costas/Bíceps)", grupos: ["costas", "biceps", "core"] },
        { nome: "C — Inferiores", grupos: ["quadriceps", "posterior", "gluteos", "panturrilha"] },
      ];
    }
    if (diasSemana === 4) {
      return [
        { nome: "A — Peito e Tríceps", grupos: ["peito", "triceps"] },
        { nome: "B — Costas e Bíceps", grupos: ["costas", "biceps"] },
        { nome: "C — Inferiores", grupos: ["quadriceps", "posterior", "gluteos", "panturrilha"] },
        { nome: "D — Ombros e Core", grupos: ["ombros", "core"] },
      ];
    }
    // 5x
    return [
      { nome: "A — Peito", grupos: ["peito", "triceps"] },
      { nome: "B — Costas", grupos: ["costas", "biceps"] },
      { nome: "C — Pernas (Quadríceps)", grupos: ["quadriceps", "panturrilha"] },
      { nome: "D — Ombros e Core", grupos: ["ombros", "core"] },
      { nome: "E — Posterior e Glúteos", grupos: ["posterior", "gluteos"] },
    ];
  }

  // Focos específicos: distribui os grupos disponíveis pelos dias
  const dias = [];
  for (let d = 0; d < diasSemana; d++) {
    // rotaciona os grupos entre os dias para variar estímulo
    const gruposDia = grupos.filter((_, i) => i % diasSemana === d % Math.max(grupos.length, 1));
    const sel = gruposDia.length ? gruposDia : grupos;
    dias.push({ nome: `Sessão ${String.fromCharCode(65 + d)}`, grupos: sel });
  }
  return dias;
}

/* ---------- Seleção de exercícios para uma sessão ---------- */
function exerciciosDaSessao(grupos, nivel, meso) {
  const porGrupo = nivel === "iniciante" ? 1 : nivel === "intermediario" ? 2 : 2;
  const lista = [];
  grupos.forEach((g) => {
    const pool = EXERCICIOS[g] || [];
    for (let i = 0; i < Math.min(porGrupo, pool.length); i++) {
      lista.push({ nome: pool[i], grupo: g });
    }
  });
  return lista;
}

/* ---------- Ajuste de progressão dentro do mesociclo ---------- */
function notaProgressao(meso, semanaNoMeso) {
  if (meso.id === "recuperacao" || meso.id === "retorno") return "Manter cargas leves";
  const pct = semanaNoMeso === 1 ? "carga inicial"
    : semanaNoMeso === 2 ? "+2-5% de carga"
    : semanaNoMeso === 3 ? "+5-8% de carga"
    : "+8-10% de carga";
  return `Progressão: ${pct}`;
}

/* ============================================================
   FUNÇÃO PRINCIPAL — gera a periodização completa
   ============================================================ */
function gerarPeriodizacao(config) {
  const { aluno, objetivo, foco, nivel, diasSemana } = config;

  const mesos = MESOS_POR_OBJETIVO[objetivo] || MESO_HIPERTROFIA;
  const divisao = montarDivisao(foco, diasSemana);

  let semanaGlobal = 0;
  const mesociclos = mesos.map((meso) => {
    const semanas = [];
    for (let s = 1; s <= meso.semanas; s++) {
      semanaGlobal++;
      const dias = divisao.map((dia) => {
        const exs = exerciciosDaSessao(dia.grupos, nivel, meso);
        const linhas = exs.map((ex, idx) => {
          // aplica técnicas avançadas em parte dos exercícios (nas fases que pedem)
          let tecnica = "";
          if (meso.tecnicas.includes("bi-set") && idx % 2 === 1) tecnica = "Bi-set";
          else if (meso.tecnicas.includes("rest-pause") && idx === exs.length - 1) tecnica = "Rest-pause";
          else if (meso.tecnicas.includes("drop-set") && idx === 0) tecnica = "Drop-set na última série";
          else if (meso.tecnicas.includes("circuito")) tecnica = "Circuito";
          else if (meso.tecnicas.includes("hiit") && idx === exs.length - 1) tecnica = "+ HIIT ao final";
          else if (meso.tecnicas.includes("explosivo")) tecnica = "Fase concêntrica explosiva";
          else if (meso.tecnicas.includes("pliometria") && idx === 0) tecnica = "Pliometria";

          return {
            exercicio: ex.nome,
            series: meso.series,
            reps: meso.repsMin === meso.repsMax ? `${meso.repsMin}` : `${meso.repsMin}-${meso.repsMax}`,
            descanso: meso.descanso,
            exaustao: meso.exaustao,
            tecnica,
          };
        });
        return { nome: dia.nome, linhas };
      });
      semanas.push({
        numeroGlobal: semanaGlobal,
        numeroNoMeso: s,
        progressao: notaProgressao(meso, s),
        dias,
      });
    }
    return { ...meso, semanas };
  });

  const totalSemanas = semanaGlobal;

  return {
    aluno,
    objetivo,
    objetivoNome: (OBJETIVOS.find((o) => o.id === objetivo) || {}).nome,
    foco,
    focoNome: (FOCOS.find((f) => f.id === foco) || {}).nome,
    nivel,
    nivelNome: (NIVEIS.find((n) => n.id === nivel) || {}).nome,
    diasSemana,
    totalSemanas,
    modelo: objetivo === "hipertrofia" || objetivo === "hipertrofia_estetica" ? "Ondulatório" : "Linear/Ondulatório",
    mesociclos,
    geradoEm: new Date().toISOString(),
  };
}

/* Exporta para o escopo global (usado pelo app.js) */
window.PeriodizaEngine = {
  OBJETIVOS, FOCOS, NIVEIS, gerarPeriodizacao,
};
