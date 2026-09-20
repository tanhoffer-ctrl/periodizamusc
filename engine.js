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
    "Crucifixo na máquina", "Flexão de braço", "Crossover",
    "Crucifixo inclinado", "Peck Deck", "Supino reto com halteres",
    "Crucifixo no Cross no banco", "Crucifixo no Cross em pé"
  ],
  costas: [
    "Puxada frontal", "Remada curvada", "Remada baixa", "Barra fixa",
    "Pulôver", "Face pull", "Remada cavalinho", "Pulldown",
    "Remada serrote", "Remada aberta apoio", "Puxada alta supinada", "Puxada alta"
  ],
  ombros: [
    "Desenvolvimento com halteres", "Elevação lateral", "Elevação frontal",
    "Remada alta", "Crucifixo inverso", "Crucifixo inverso no banco inclinado",
    "Crucifixo inverso no Cross em pé", "Crucifixo inverso no Cross no banco reto",
    "Crucifixo inverso com halteres", "Desenvolvimento máquina",
    "Desenvolvimento barra atrás da nuca", "Desenvolvimento no Smith"
  ],
  trapezio: [
    "Encolhimento halteres", "Encolhimento com anilha", "Encolhimento máquina",
    "Encolhimento barra", "Encolhimento no Smith"
  ],
  biceps: [
    "Rosca direta", "Rosca alternada", "Rosca scott", "Rosca martelo",
    "Rosca martelo (polia)", "Rosca martelo alternada", "Rosca martelo Scott",
    "Rosca 45", "Rosca direta polia", "Rosca spider", "Rosca inversa com barra",
    "Rosca inversa com halteres", "Rosca inversa com barra W"
  ],
  triceps: [
    "Tríceps na polia", "Tríceps testa", "Tríceps francês", "Mergulho no banco",
    "Tríceps com barra W", "Apoio na parede (pegada fechada)",
    "Flexão de cotovelo fechado ajoelhado", "Kick back (polia)",
    "Kick back sentado com halteres"
  ],
  antebraco: [
    "Carretel", "Desvio radial", "Flexão de punho com barra",
    "Flexão de punho com halteres", "Hiperextensão de punho com barra",
    "Hiperextensão de punho com halteres"
  ],
  quadriceps: [
    "Agachamento livre", "Leg press", "Cadeira extensora", "Afundo",
    "Agachamento Smith", "Afundo no Smith", "Agachamento frontal",
    "Agachamento Hack", "Leg press 45 (pés altos)", "Leg press 45 (pés unidos)",
    "Leg press horizontal"
  ],
  posterior: [
    "Stiff", "Mesa flexora", "Cadeira flexora", "Elevação pélvica",
    "RDL", "Good morning", "Flexora unilateral (máquina)", "Mesa flexora unilateral"
  ],
  gluteos: [
    "Elevação pélvica", "Coice na polia", "Abdução na máquina", "Agachamento sumô",
    "Hip thrust (com barra)", "Cadeira abdutora", "Extensão de quadril na polia",
    "Agachamento búlgaro", "Glúteos 4 apoios", "Abdução na polia"
  ],
  panturrilha: [
    "Panturrilha em pé", "Panturrilha sentado", "Panturrilha no Leg press (bilateral)",
    "Panturrilha em pé unilateral", "Panturrilha em pé no Smith",
    "Panturrilha em pé com halteres", "Panturrilha negativa", "Panturrilha em pé na máquina"
  ],
  core: [
    "Prancha", "Abdominal infra", "Rotação de tronco (cabo)", "Prancha lateral",
    "Elevação de perna", "Prancha alta", "Prancha baixa", "Prancha lateral alta",
    "Prancha lateral baixa", "Abdominal banco", "Abdominal bicicleta", "Abdominal oblíquo"
  ],
};

/* ---------- Segmentos corporais ----------
   Cada segmento agrupa os grupos musculares que o compõem.
   MMII é subdividido para os dias 4x/5x (quad+glúteo | posterior+pant). */
const SEGMENTOS = {
  MMSS: ["peito", "costas", "ombros", "trapezio", "biceps", "triceps", "antebraco"],
  MMII: ["quadriceps", "posterior", "gluteos", "panturrilha"],
  CORE: ["core"],
};
const MMII_SUB_A = ["quadriceps", "gluteos"];                     // ênfase anterior
const MMII_SUB_B = ["posterior", "panturrilha"];                  // ênfase posterior
const MMSS_SUB_A = ["peito", "ombros", "triceps"];                // empurrar
const MMSS_SUB_B = ["costas", "trapezio", "biceps", "antebraco"]; // puxar

/* ---------- Volume por nível ----------
   nSegmento = nº de exercícios do segmento principal do dia
   nCore     = nº de exercícios de core no dia
   nCorpoTodo = nº total quando o foco é "corpo todo" */
const VOLUME_POR_NIVEL = {
  iniciante:     { nSegmento: 3, nCore: 1, nCorpoTodo: 4 },
  intermediario: { nSegmento: 4, nCore: 1, nCorpoTodo: 5 },
  avancado:      { nSegmento: 6, nCore: 2, nCorpoTodo: 7 },
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

/* Construtor de mesociclo ONDULATÓRIO SEMANAL.
   semanasParams = array; cada item define os parâmetros daquela semana:
     { series, repsMin, repsMax, descanso, pct }
   O nº de semanas do mesociclo é o tamanho desse array.
   Guarda também valores "representativos" (1ª semana) nos campos
   padrão, para a UI que exibe resumo do mesociclo. */
function mesoOndulatorio(id, nome, descricao, semanasParams, tecnicas, exaustao) {
  const p0 = semanasParams[0];
  // faixa geral de %1RM do bloco (menor mín ao maior máx) para o resumo
  const pcts = semanasParams.map((w) => w.pct);
  return {
    id, nome,
    semanas: semanasParams.length,
    series: p0.series,
    repsMin: p0.repsMin, repsMax: p0.repsMax,
    descanso: p0.descanso,
    intensidade: pcts[0] + (pcts.length > 1 ? " (ondula por semana)" : ""),
    descricao,
    tecnicas: tecnicas || [],
    exaustao: !!exaustao,
    ondulacaoSemanal: semanasParams, // <- consumido pela geração
  };
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
  // ==========================================================
  // FORÇA — modelo ONDULATÓRIO SEMANAL (13 semanas)
  // Intensidade em %1RM. Sem falha (recuperação neural completa).
  // Dentro de cada mesociclo, as semanas ondulam entre carga
  // mais alta (menos reps) e mais moderada (mais reps/volume),
  // dentro das faixas do bloco. Baseado em síntese da literatura
  // (ACSM position stand; JSCR periodização; método de esforço
  // máximo de Zatsiorsky).
  // ==========================================================
  forca: [
    mesoOndulatorio("base", "Base (Hipertrofia funcional)",
      "Construção de base muscular e tendínea para suportar cargas altas. Ondulação semanal de volume/intensidade.",
      [
        { series: 4, repsMin: 8, repsMax: 10, descanso: "90-120s", pct: "65-70% 1RM" },
        { series: 4, repsMin: 6, repsMax: 8,  descanso: "2 min",    pct: "70-75% 1RM" },
        { series: 3, repsMin: 8, repsMax: 10, descanso: "90-120s", pct: "68-72% 1RM" },
      ], [], false),

    mesoOndulatorio("forca1", "Força I (Acumulação)",
      "Acúmulo de volume em intensidade elevada. Ênfase em movimentos multiarticulares. Ondulação semanal.",
      [
        { series: 4, repsMin: 5, repsMax: 6, descanso: "2-3 min", pct: "75-78% 1RM" },
        { series: 4, repsMin: 4, repsMax: 5, descanso: "3 min",   pct: "78-82% 1RM" },
        { series: 4, repsMin: 5, repsMax: 6, descanso: "2-3 min", pct: "77-80% 1RM" },
      ], [], false),

    mesoOndulatorio("forca2", "Força II (Intensificação)",
      "Intensificação com cargas altas em baixas repetições. Recuperação completa entre séries. Ondulação semanal.",
      [
        { series: 5, repsMin: 3, repsMax: 4, descanso: "3 min", pct: "83-85% 1RM" },
        { series: 4, repsMin: 3, repsMax: 4, descanso: "3 min", pct: "85-88% 1RM" },
        { series: 5, repsMin: 3, repsMax: 4, descanso: "3 min", pct: "84-86% 1RM" },
      ], [], false),

    mesoOndulatorio("pico", "Pico de Força (Realização)",
      "Expressão máxima de força. Baixíssimo volume, alta especificidade. Método de esforço máximo.",
      [
        { series: 4, repsMin: 2, repsMax: 3, descanso: "3-5 min", pct: "88-90% 1RM" },
        { series: 5, repsMin: 1, repsMax: 3, descanso: "3-5 min", pct: "90-93%+ 1RM" },
        { series: 3, repsMin: 1, repsMax: 2, descanso: "4-5 min", pct: "92-95%+ 1RM" },
      ], [], false),

    mesoOndulatorio("recuperacao", "Deload (Recuperação)",
      "Semana de recuperação ativa. Redução de volume e intensidade para dissipar fadiga e permitir supercompensação.",
      [
        { series: 2, repsMin: 5, repsMax: 5, descanso: "2 min", pct: "~60% 1RM" },
      ], [], false),
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

/* ============================================================
   DIVISÃO DE TREINO (foco = prioridade, não exclusividade)
   ------------------------------------------------------------
   Retorna uma lista de dias. Cada dia descreve:
     - nome: rótulo da sessão
     - segmento: "MMSS" | "MMII" | "MISTO" (corpo todo)
     - grupos: grupos musculares elegíveis para o segmento do dia
     - core: true/false (se inclui core)
   A quantidade de exercícios é resolvida depois, por nível.
   ============================================================ */
function montarDivisao(focoId, diasSemana) {
  // ----- Corpo todo: mescla todos os segmentos em cada treino -----
  if (focoId === "corpo_todo") {
    const dias = [];
    for (let d = 0; d < diasSemana; d++) {
      dias.push({
        nome: `Sessão ${letra(d)} — Corpo todo`,
        segmento: "MISTO",
        grupos: SEGMENTOS.MMSS.concat(SEGMENTOS.MMII),
        core: true,
      });
    }
    return dias;
  }

  // ----- Focos por segmento (MMII prioritário ou MMSS prioritário) -----
  const focoMMII = (focoId === "inferiores" || focoId === "inferiores_core");
  const segFoco = focoMMII ? "MMII" : "MMSS";
  const segSec = focoMMII ? "MMSS" : "MMII";

  // grupos do dia de FOCO (com subdivisão nos padrões A/B para MMII/MMSS)
  const subFocoA = focoMMII ? MMII_SUB_A : MMSS_SUB_A;
  const subFocoB = focoMMII ? MMII_SUB_B : MMSS_SUB_B;
  const gruposSec = SEGMENTOS[segSec];

  const diaFoco = (letraIdx, sub, sufixo) => ({
    nome: `Sessão ${letra(letraIdx)} — ${rotuloSeg(segFoco)}${sufixo ? " (" + sufixo + ")" : ""}`,
    segmento: segFoco,
    grupos: sub,
    core: false, // dia de foco não força core (segue regra por nível)
  });
  const diaSec = (letraIdx) => ({
    nome: `Sessão ${letra(letraIdx)} — ${rotuloSeg(segSec)} + Core`,
    segmento: segSec,
    grupos: gruposSec,
    core: true,
  });

  if (diasSemana === 3) {
    // A: foco (completo) · B: secundário+core · C: foco (completo)
    const completo = SEGMENTOS[segFoco];
    return [
      { nome: `Sessão A — ${rotuloSeg(segFoco)}`, segmento: segFoco, grupos: completo, core: false },
      diaSec(1),
      { nome: `Sessão C — ${rotuloSeg(segFoco)}`, segmento: segFoco, grupos: completo, core: false },
    ];
  }

  if (diasSemana === 4) {
    // A: foco(subA) · B: sec+core · C: foco(subB) · D: sec+core
    return [
      diaFoco(0, subFocoA, subNome(segFoco, "A")),
      diaSec(1),
      diaFoco(2, subFocoB, subNome(segFoco, "B")),
      diaSec(3),
    ];
  }

  // 5x → A: foco(subA) · B: sec+core · C: foco(subB) · D: sec+core · E: foco(subA)
  return [
    diaFoco(0, subFocoA, subNome(segFoco, "A")),
    diaSec(1),
    diaFoco(2, subFocoB, subNome(segFoco, "B")),
    diaSec(3),
    diaFoco(4, subFocoA, subNome(segFoco, "A")),
  ];
}

/* Helpers de rótulo */
function letra(i) { return String.fromCharCode(65 + i); }
function rotuloSeg(seg) { return seg === "MMII" ? "MMII" : seg === "MMSS" ? "MMSS" : "Corpo todo"; }
function subNome(seg, ab) {
  if (seg === "MMII") return ab === "A" ? "Quadríceps e Glúteos" : "Posterior e Panturrilha";
  return ab === "A" ? "Empurrar" : "Puxar";
}

/* ============================================================
   SELEÇÃO DE EXERCÍCIOS PARA UMA SESSÃO
   ------------------------------------------------------------
   Usa a regra de volume por nível:
     - dia de foco/secundário: nSegmento exercícios do segmento
       do dia + nCore de core (se o dia inclui core).
     - corpo todo: nCorpoTodo exercícios distribuídos entre
       todos os grupos + nCore de core.
   O parâmetro rotacao varia os exercícios escolhidos entre os
   dias/semanas para evitar repetição idêntica.
   ============================================================ */
function exerciciosDaSessao(dia, nivel, rotacao) {
  const vol = VOLUME_POR_NIVEL[nivel] || VOLUME_POR_NIVEL.intermediario;
  const lista = [];

  if (dia.segmento === "MISTO") {
    // corpo todo: distribui nCorpoTodo exercícios entre os grupos, 1 por grupo, rotacionando
    const grupos = dia.grupos;
    for (let i = 0; i < vol.nCorpoTodo; i++) {
      const g = grupos[(i + rotacao) % grupos.length];
      lista.push(pickExercicio(g, Math.floor((i + rotacao) / grupos.length) + rotacao));
    }
    // core
    for (let c = 0; c < vol.nCore; c++) lista.push(pickExercicio("core", c + rotacao));
    return lista;
  }

  // dia de segmento: distribui nSegmento exercícios entre os grupos do segmento do dia
  const grupos = dia.grupos;
  for (let i = 0; i < vol.nSegmento; i++) {
    const g = grupos[i % grupos.length];
    // quantas vezes esse grupo já apareceu, para pegar exercício diferente
    const ocorrencia = Math.floor(i / grupos.length);
    lista.push(pickExercicio(g, ocorrencia + rotacao));
  }
  // core (se o dia inclui) — dia de foco não tem; dia secundário tem
  if (dia.core) {
    for (let c = 0; c < vol.nCore; c++) lista.push(pickExercicio("core", c + rotacao));
  }
  return lista;
}

/* Escolhe um exercício de um grupo, rotacionando pela biblioteca */
function pickExercicio(grupo, offset) {
  const pool = EXERCICIOS[grupo] || [];
  if (pool.length === 0) return { nome: grupo, grupo };
  return { nome: pool[((offset % pool.length) + pool.length) % pool.length], grupo };
}

/* Rótulo do modelo de periodização por objetivo */
function modeloDoObjetivo(objetivo) {
  if (objetivo === "forca") return "Ondulatório semanal";
  if (objetivo === "hipertrofia" || objetivo === "hipertrofia_estetica") return "Ondulatório";
  return "Linear/Ondulatório";
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

      // parâmetros efetivos da semana: se o mesociclo ondula por semana,
      // usa os valores da semana atual; senão, usa os do mesociclo.
      const w = (meso.ondulacaoSemanal && meso.ondulacaoSemanal[s - 1]) || null;
      const wSeries = w ? w.series : meso.series;
      const wRepsMin = w ? w.repsMin : meso.repsMin;
      const wRepsMax = w ? w.repsMax : meso.repsMax;
      const wDescanso = w ? w.descanso : meso.descanso;
      const wPct = w ? w.pct : null;

      const dias = divisao.map((dia, diaIdx) => {
        // rotação varia por dia e por semana → exercícios diferentes entre sessões
        const rotacao = diaIdx + (s - 1);
        const exs = exerciciosDaSessao(dia, nivel, rotacao);
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
            grupo: ex.grupo,
            series: wSeries,
            reps: wRepsMin === wRepsMax ? `${wRepsMin}` : `${wRepsMin}-${wRepsMax}`,
            descanso: wDescanso,
            pct: wPct,
            exaustao: meso.exaustao,
            tecnica,
          };
        });
        return { nome: dia.nome, linhas };
      });
      semanas.push({
        numeroGlobal: semanaGlobal,
        numeroNoMeso: s,
        // em mesociclos ondulatórios, a tag mostra o %1RM da semana
        progressao: wPct ? ("Intensidade: " + wPct) : notaProgressao(meso, s),
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
    modelo: modeloDoObjetivo(objetivo),
    mesociclos,
    geradoEm: new Date().toISOString(),
  };
}

/* Rótulos amigáveis dos grupos musculares (para a UI de troca) */
const GRUPO_NOMES = {
  peito: "Peito", costas: "Costas", ombros: "Ombros", trapezio: "Trapézio",
  biceps: "Bíceps", triceps: "Tríceps", antebraco: "Antebraço",
  quadriceps: "Quadríceps", posterior: "Posterior de coxa", gluteos: "Glúteos",
  panturrilha: "Panturrilha", core: "Core",
};

/* Exporta para o escopo global (usado pelo app.js) */
window.PeriodizaEngine = {
  OBJETIVOS, FOCOS, NIVEIS, gerarPeriodizacao,
  EXERCICIOS, GRUPO_NOMES,
};
