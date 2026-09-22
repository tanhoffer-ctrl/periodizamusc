/* ============================================================
   PeriodizaFit — Interface (React, sem JSX)
   Escrito com React.createElement para NÃO depender de Babel.

   Modelo de dados (v0.3):
     aluno = {
       id,
       dados: { nome, celular, email, nascimento, peso, altura,
                nivelAtividade, deficiencia, deficienciaOutro,
                classificacao },
       programas: [ <periodização>, ... ]
     }
   Telas: "inicio" (lista) → "ficha" (cadastro/detalhe) → "programa"
   ============================================================ */
(function () {
  var e = React.createElement;
  var useState = React.useState;

  if (!window.PeriodizaEngine) {
    document.getElementById("root").innerHTML =
      '<div style="padding:24px;color:#ff6b6b;font-family:sans-serif">' +
      "Erro ao carregar o motor (engine.js). Recarregue a página." +
      "</div>";
    return;
  }
  var Eng = window.PeriodizaEngine;
  var OBJETIVOS = Eng.OBJETIVOS;
  var FOCOS = Eng.FOCOS;
  var NIVEIS = Eng.NIVEIS;
  var gerarPeriodizacao = Eng.gerarPeriodizacao;
  var EXERCICIOS = Eng.EXERCICIOS;
  var GRUPO_NOMES = Eng.GRUPO_NOMES;

  /* ---------- Catálogos dos novos campos ---------- */
  var NIVEIS_ATIVIDADE = [
    { value: "sedentario", label: "Sedentário" },
    { value: "moderado", label: "Moderadamente ativo" },
    { value: "ativo", label: "Ativo" },
    { value: "atleta", label: "Atleta" },
  ];
  var DEFICIENCIAS = [
    { value: "", label: "— não informado —" },
    { value: "lm", label: "Lesão medular (LM)" },
    { value: "pc", label: "Paralisia cerebral (PC)" },
    { value: "malformacao", label: "Malformação congênita" },
    { value: "neurodegenerativa", label: "Doença neurodegenerativa" },
    { value: "outro", label: "Outro" },
  ];
  var CLASSIFICACOES = [
    { value: "", label: "— não informado —" },
    { value: "0.5", label: "0.5" }, { value: "1.0", label: "1.0" },
    { value: "1.5", label: "1.5" }, { value: "2.0", label: "2.0" },
    { value: "2.5", label: "2.5" }, { value: "3.0", label: "3.0" },
    { value: "3.5", label: "3.5" },
  ];

  function labelDe(lista, value) {
    for (var i = 0; i < lista.length; i++) if (lista[i].value === value) return lista[i].label;
    return "";
  }

  /* ============================================================
     Persistência no navegador (localStorage) + migração
     ============================================================ */
  var STORAGE_KEY = "periodizafit_alunos";
  var ultimoErroSalvar = "";
  var localStorageOk = testarLocalStorage();

  function testarLocalStorage() {
    try {
      var k = "__pf_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (err) { return false; }
  }

  // Migra formato antigo { id, prog } → novo { id, dados, programas }
  function migrarAluno(a) {
    if (a && a.dados && a.programas) return a; // já é novo formato
    if (a && a.prog) {
      return {
        id: a.id || gerarId(),
        dados: { nome: a.prog.aluno || "Aluno(a)" },
        programas: [a.prog],
      };
    }
    return { id: gerarId(), dados: { nome: "Aluno(a)" }, programas: [] };
  }

  function carregarAlunos() {
    if (!localStorageOk) return [];
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var lista = raw ? JSON.parse(raw) : [];
      return lista.map(migrarAluno);
    } catch (err) { return []; }
  }

  function salvarAlunos(lista) {
    ultimoErroSalvar = "";
    if (!localStorageOk) { ultimoErroSalvar = "armazenamento_indisponivel"; return false; }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      return true;
    } catch (err) {
      ultimoErroSalvar = (err && err.name) ? err.name : "erro_desconhecido";
      return false;
    }
  }
  function gerarId() { return "a_" + Date.now() + "_" + Math.floor(Math.random() * 1000); }

  /* ---------- Cálculos ---------- */
  function calcularIdade(nascimento) {
    if (!nascimento) return null;
    var hoje = new Date();
    var nasc = new Date(nascimento);
    if (isNaN(nasc.getTime())) return null;
    var idade = hoje.getFullYear() - nasc.getFullYear();
    var m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade >= 0 && idade < 130 ? idade : null;
  }

  function calcularIMC(peso, altura) {
    var p = parseFloat(peso);
    var a = parseFloat(altura);
    if (!p || !a) return null;
    // aceita altura em cm (ex.: 175) ou metros (ex.: 1.75)
    var aM = a > 3 ? a / 100 : a;
    if (aM <= 0) return null;
    var imc = p / (aM * aM);
    if (!isFinite(imc) || imc <= 0 || imc > 200) return null;
    return imc;
  }
  function classificarIMC(imc) {
    if (imc == null) return "";
    if (imc < 18.5) return "Baixo peso";
    if (imc < 25) return "Peso normal";
    if (imc < 30) return "Sobrepeso";
    if (imc < 35) return "Obesidade grau I";
    if (imc < 40) return "Obesidade grau II";
    return "Obesidade grau III";
  }

  /* ============================================================
     Ficha do aluno — cadastro / edição + lista de programas
     ============================================================ */
  function FichaAluno(props) {
    var a = props.aluno;
    var d = a.dados || {};

    var nome = useState(d.nome || "");
    var celular = useState(d.celular || "");
    var email = useState(d.email || "");
    var nascimento = useState(d.nascimento || "");
    var peso = useState(d.peso || "");
    var altura = useState(d.altura || "");
    var nivelAtividade = useState(d.nivelAtividade || "sedentario");
    var deficiencia = useState(d.deficiencia || "");
    var deficienciaOutro = useState(d.deficienciaOutro || "");
    var classificacao = useState(d.classificacao || "");
    var msg = useState("");

    var idade = calcularIdade(nascimento[0]);
    var imc = calcularIMC(peso[0], altura[0]);

    function coletarDados() {
      return {
        nome: (nome[0].trim()) || "Aluno(a)",
        celular: celular[0].trim(),
        email: email[0].trim(),
        nascimento: nascimento[0],
        peso: peso[0],
        altura: altura[0],
        nivelAtividade: nivelAtividade[0],
        deficiencia: deficiencia[0],
        deficienciaOutro: deficiencia[0] === "outro" ? deficienciaOutro[0].trim() : "",
        classificacao: classificacao[0],
      };
    }

    function salvarFicha() {
      var res = props.onSalvar(coletarDados());
      msg[1](res.mensagem);
      setTimeout(function () { msg[1](""); }, 6000);
    }

    function campoTexto(label, state, tipo, placeholder) {
      return e("div", { className: "field" },
        e("label", null, label),
        e("input", {
          type: tipo || "text",
          value: state[0],
          onChange: function (ev) { state[1](ev.target.value); },
          placeholder: placeholder || "",
        })
      );
    }
    function campoSelect(label, state, options) {
      return e("div", { className: "field" },
        e("label", null, label),
        e("select", {
          value: state[0],
          onChange: function (ev) { state[1](ev.target.value); },
        }, options.map(function (o) { return e("option", { key: o.value, value: o.value }, o.label); }))
      );
    }

    return e("div", null,
      e("button", {
        className: "btn secondary no-print",
        style: { width: "auto", marginBottom: 16 },
        onClick: props.onVoltar,
      }, "← Voltar aos alunos"),

      /* ----- Dados cadastrais ----- */
      e("div", { className: "card" },
        e("h2", null, "Ficha do aluno"),
        e("div", { className: "grid" },
          e("div", { className: "field full" },
            e("label", null, "Nome completo"),
            e("input", {
              value: nome[0],
              onChange: function (ev) { nome[1](ev.target.value); },
              placeholder: "Ex: João Silva",
            })
          ),
          campoTexto("Celular", celular, "tel", "(00) 00000-0000"),
          campoTexto("E-mail", email, "email", "email@exemplo.com"),
          campoTexto("Data de nascimento", nascimento, "date"),
          e("div", { className: "field" },
            e("label", null, "Idade"),
            e("input", { value: idade != null ? (idade + " anos") : "—", readOnly: true, style: { opacity: 0.7 } })
          ),
          campoTexto("Peso (kg)", peso, "number", "Ex: 72"),
          campoTexto("Altura (cm ou m)", altura, "number", "Ex: 175 ou 1.75"),
          campoSelect("Nível de atividade física", nivelAtividade, NIVEIS_ATIVIDADE)
        ),

        /* IMC automático + observação PcD */
        e("div", { className: "imc-box" },
          e("div", null,
            e("span", { className: "imc-label" }, "IMC "),
            e("span", { className: "imc-valor" }, imc != null ? imc.toFixed(1) : "—"),
            imc != null ? e("span", { className: "imc-classe" }, " · " + classificarIMC(imc)) : null
          ),
          e("p", { className: "imc-obs" },
            "⚠ O IMC tradicional (peso/altura²) tem limitações para pessoas com deficiência " +
            "(ex.: lesão medular, amputações, malformações), pois não reflete adequadamente a composição " +
            "corporal. Utilize como referência complementar, não isolada.")
        )
      ),

      /* ----- Dados esportivos (uso futuro) ----- */
      e("div", { className: "card" },
        e("h2", null, "Dados esportivos ",
          e("span", { className: "tag-futuro" }, "uso em versões futuras")),
        e("p", { className: "footer-note", style: { textAlign: "left", marginTop: -8, marginBottom: 14 } },
          "Estes dados são registrados agora, mas ainda não influenciam a geração dos treinos. " +
          "Serão explorados em versões futuras (rugby em cadeira de rodas)."),
        e("div", { className: "grid" },
          campoSelect("Tipo de deficiência", deficiencia, DEFICIENCIAS),
          deficiencia[0] === "outro"
            ? campoTexto("Especifique", deficienciaOutro, "text", "Descreva a deficiência")
            : e("div", { className: "field" }),
          campoSelect("Classificação esportiva", classificacao, CLASSIFICACOES)
        )
      ),

      /* botão salvar ficha */
      e("div", { className: "card no-print" },
        e("button", { className: "btn", onClick: salvarFicha }, "💾 Salvar ficha do aluno"),
        msg[0] ? e("p", {
          className: "footer-note",
          style: {
            color: msg[0].charAt(0) === "✔" ? "var(--accent-2)" : "var(--warn)",
            marginTop: 10, textAlign: "left", lineHeight: 1.5,
          },
        }, msg[0]) : null
      ),

      /* ----- Periodizações do aluno ----- */
      e("div", { className: "card" },
        e("div", { className: "prog-head" },
          e("h2", { style: { margin: 0 } }, "Periodizações"),
          e("button", { className: "btn no-print", style: { width: "auto" }, onClick: props.onNovaPeriodizacao }, "+ Nova periodização")
        ),
        (!a.programas || a.programas.length === 0)
          ? e("p", { className: "empty" }, "Nenhuma periodização criada para este aluno ainda.")
          : e("div", { style: { marginTop: 16 } }, a.programas.map(function (p, idx) {
              return e("div", { key: idx, className: "aluno-item" },
                e("div", { className: "aluno-info" },
                  e("div", { className: "aluno-nome" }, p.objetivoNome + " · " + p.focoNome),
                  e("div", { className: "aluno-meta" },
                    p.nivelNome + " · " + p.diasSemana + "x/sem · " + p.totalSemanas + " semanas · " + p.modelo)
                ),
                e("div", { className: "aluno-acoes" },
                  e("button", { className: "btn secondary", style: { width: "auto" }, onClick: function () { props.onAbrirPrograma(idx); } }, "Abrir"),
                  e("button", { className: "btn secondary danger-btn", style: { width: "auto" }, onClick: function () { props.onExcluirPrograma(idx); } }, "Excluir")
                )
              );
            }))
      )
    );
  }

  /* ============================================================
     Formulário de geração de periodização
     ============================================================ */
  function Formulario(props) {
    var objetivo = useState("hipertrofia");
    var foco = useState("corpo_todo");
    var nivel = useState("intermediario");
    var diasSemana = useState(4);

    function submit(ev) {
      ev.preventDefault();
      props.onGerar({
        aluno: props.nomeAluno || "Aluno(a)",
        objetivo: objetivo[0], foco: foco[0], nivel: nivel[0],
        diasSemana: Number(diasSemana[0]),
      });
    }
    function selectField(label, state, options) {
      return e("div", { className: "field" },
        e("label", null, label),
        e("select", { value: state[0], onChange: function (ev) { state[1](ev.target.value); } },
          options.map(function (o) { return e("option", { key: o.value, value: o.value }, o.label); }))
      );
    }

    return e("div", null,
      e("button", { className: "btn secondary no-print", style: { width: "auto", marginBottom: 16 }, onClick: props.onVoltar }, "← Voltar à ficha"),
      e("form", { className: "card", onSubmit: submit },
        e("h2", null, "Nova periodização — " + (props.nomeAluno || "")),
        e("div", { className: "grid" },
          selectField("Objetivo", objetivo, OBJETIVOS.map(function (o) { return { value: o.id, label: o.nome }; })),
          selectField("Foco", foco, FOCOS.map(function (f) { return { value: f.id, label: f.nome }; })),
          selectField("Nível", nivel, NIVEIS.map(function (n) { return { value: n.id, label: n.nome }; })),
          selectField("Dias por semana", diasSemana, [
            { value: 2, label: "2x por semana" },
            { value: 3, label: "3x por semana" },
            { value: 4, label: "4x por semana" },
            { value: 5, label: "5x por semana" },
          ])
        ),
        e("button", { className: "btn", type: "submit" }, "Gerar periodização automática")
      )
    );
  }

  /* ============================================================
     Tabela de uma sessão — com troca manual de exercícios
     ============================================================ */
  function TabelaSessao(props) {
    var dia = props.dia;
    var editando = props.editando;
    function opcoesDoGrupo(grupo) {
      var pool = EXERCICIOS[grupo] || [];
      return pool.map(function (nome) { return e("option", { key: nome, value: nome }, nome); });
    }
    return e("div", { className: "day" },
      e("div", { className: "day-head" }, dia.nome),
      e("div", { className: "overflow-x" },
        e("table", null,
          e("thead", null, e("tr", null,
            e("th", null, "Exercício"), e("th", null, "Séries"), e("th", null, "Reps"),
            e("th", null, "Descanso"), e("th", null, "Obs.")
          )),
          e("tbody", null, dia.linhas.map(function (l, i) {
            var celulaExercicio;
            if (editando && l.grupo && EXERCICIOS[l.grupo]) {
              celulaExercicio = e("select", {
                className: "ex-select", value: l.exercicio,
                title: "Trocar exercício (" + (GRUPO_NOMES[l.grupo] || l.grupo) + ")",
                onChange: function (ev) { props.onTrocar(i, ev.target.value); },
              }, opcoesDoGrupo(l.grupo));
            } else {
              celulaExercicio = e("span", { className: "ex-name" }, l.exercicio);
            }
            var obs = l.tecnica || "";
            if (l.pct) obs = obs ? (l.pct + " · " + obs) : l.pct;
            return e("tr", { key: i },
              e("td", null, celulaExercicio),
              e("td", null, l.series),
              e("td", null, l.reps + (l.exaustao ? " *" : "")),
              e("td", null, l.descanso),
              e("td", { className: "tech" }, obs)
            );
          }))
        )
      )
    );
  }

  /* ============================================================
     Visualização do programa (com edição, salvar e PDF)
     ============================================================ */
  function Programa(props) {
    var prog = props.prog;
    var dadosAluno = props.dadosAluno || {};
    var mesoAtivo = useState(0);
    var editando = useState(false);
    var salvoMsg = useState("");

    var meso = prog.mesociclos[mesoAtivo[0]];
    var temExaustao = prog.mesociclos.some(function (m) {
      return m.semanas.some(function (s) { return s.dias.some(function (d) { return d.linhas.some(function (l) { return l.exaustao; }); }); });
    });

    function trocarExercicio(semanaIdx, diaIdx, linhaIdx, novoNome) {
      var novasSemanas = meso.semanas.map(function (sem) {
        var novosDias = sem.dias.map(function (d, di) {
          if (di !== diaIdx) return d;
          var novasLinhas = d.linhas.map(function (l, li) {
            return li !== linhaIdx ? l : Object.assign({}, l, { exercicio: novoNome });
          });
          return Object.assign({}, d, { linhas: novasLinhas });
        });
        return Object.assign({}, sem, { dias: novosDias });
      });
      var novosMesos = prog.mesociclos.map(function (m, mi) {
        return mi === mesoAtivo[0] ? Object.assign({}, m, { semanas: novasSemanas }) : m;
      });
      props.onAtualizar(Object.assign({}, prog, { mesociclos: novosMesos }));
    }

    function salvar() {
      var res = props.onSalvar(prog);
      salvoMsg[1](res.mensagem);
      setTimeout(function () { salvoMsg[1](""); }, 6000);
    }

    var badges = [
      { c: "badge accent", t: "🎯 " + prog.objetivoNome },
      { c: "badge", t: "💪 " + prog.focoNome },
      { c: "badge", t: "📊 " + prog.nivelNome },
      { c: "badge", t: "📅 " + prog.diasSemana + "x/semana" },
      { c: "badge", t: "🔄 " + prog.modelo },
      { c: "badge", t: "🗓️ " + prog.totalSemanas + " semanas" },
    ];

    // linha de dados do aluno para o PDF
    var imc = calcularIMC(dadosAluno.peso, dadosAluno.altura);
    var idade = calcularIdade(dadosAluno.nascimento);
    var infoAluno = [];
    if (idade != null) infoAluno.push(idade + " anos");
    if (dadosAluno.peso) infoAluno.push(dadosAluno.peso + " kg");
    if (dadosAluno.altura) infoAluno.push("Altura: " + dadosAluno.altura);
    if (imc != null) infoAluno.push("IMC " + imc.toFixed(1) + " (" + classificarIMC(imc) + ")");

    return e("div", { className: "card", id: "programa-print" },
      e("div", { className: "prog-head" },
        e("div", null,
          e("div", { className: "prog-title" }, dadosAluno.nome || prog.aluno),
          infoAluno.length ? e("div", { className: "aluno-meta only-print" }, infoAluno.join(" · ")) : null
        ),
        e("button", { className: "btn secondary no-print", style: { width: "auto" }, onClick: props.onVoltar }, "← Voltar")
      ),
      e("div", { className: "badges" }, badges.map(function (b, i) { return e("span", { key: i, className: b.c }, b.t); })),

      e("div", { className: "actions-row no-print", style: { marginTop: 16 } },
        e("button", { className: "btn " + (editando[0] ? "" : "secondary"), onClick: function () { editando[1](!editando[0]); } },
          editando[0] ? "✓ Concluir edição" : "✏️ Editar exercícios"),
        e("button", { className: "btn secondary", onClick: salvar }, "💾 Salvar"),
        e("button", { className: "btn secondary", onClick: function () { window.print(); } }, "📄 Exportar PDF")
      ),
      salvoMsg[0] ? e("p", {
        className: "footer-note no-print",
        style: { color: salvoMsg[0].charAt(0) === "✔" ? "var(--accent-2)" : "var(--warn)", marginTop: 8, textAlign: "left", lineHeight: 1.5 },
      }, salvoMsg[0]) : null,

      editando[0]
        ? e("div", { className: "meso-desc no-print", style: { borderLeftColor: "var(--warn)" } },
            "Modo edição: clique no nome de um exercício para trocá-lo por outro do mesmo grupo muscular. A troca vale para todas as semanas deste mesociclo.")
        : null,

      e("div", { className: "meso-nav no-print" }, prog.mesociclos.map(function (m, i) {
        return e("div", {
          key: m.id,
          className: "meso-chip" + (i === mesoAtivo[0] ? " active" : ""),
          onClick: function () { mesoAtivo[1](i); },
        }, m.nome, e("small", null, m.semanas.length + " sem · " + m.series + " séries"));
      })),

      prog.mesociclos.map(function (m, mi) {
        var visivelNaTela = mi === mesoAtivo[0];
        return e("div", { key: m.id, className: visivelNaTela ? "" : "only-print" },
          e("div", { className: "meso-desc" },
            e("strong", null, m.nome), " — " + m.intensidade, e("br"), m.descricao),
          m.semanas.map(function (sem, si) {
            return e("div", { className: "week", key: sem.numeroGlobal },
              e("div", { className: "week-title" },
                "Semana " + sem.numeroGlobal,
                e("span", { className: "tag" }, sem.progressao)),
              sem.dias.map(function (dia, di) {
                return e(TabelaSessao, {
                  key: di, dia: dia,
                  editando: editando[0] && visivelNaTela,
                  onTrocar: function (linhaIdx, novoNome) { trocarExercicio(si, di, linhaIdx, novoNome); },
                });
              })
            );
          })
        );
      }),

      temExaustao ? e("p", { className: "footer-note" },
        e("strong", null, "*"), " = última(s) série(s) levada(s) à exaustão concêntrica.") : null
    );
  }

  /* ============================================================
     Painel inicial: lista de alunos
     ============================================================ */
  function Inicio(props) {
    var alunos = props.alunos;
    return e("div", null,
      e("div", { className: "card" },
        e("div", { className: "prog-head" },
          e("h2", { style: { margin: 0 } }, "Alunos"),
          e("button", { className: "btn", style: { width: "auto" }, onClick: props.onNovoAluno }, "+ Cadastrar aluno")
        ),
        alunos.length === 0
          ? e("p", { className: "empty" }, "Nenhum aluno cadastrado ainda. Clique em “Cadastrar aluno” para começar.")
          : e("div", { style: { marginTop: 16 } }, alunos.map(function (a) {
              var d = a.dados || {};
              var qtd = (a.programas || []).length;
              return e("div", { key: a.id, className: "aluno-item" },
                e("div", { className: "aluno-info" },
                  e("div", { className: "aluno-nome" }, d.nome || "Aluno(a)"),
                  e("div", { className: "aluno-meta" },
                    (d.email ? d.email + " · " : "") +
                    (d.celular ? d.celular + " · " : "") +
                    qtd + (qtd === 1 ? " periodização" : " periodizações"))
                ),
                e("div", { className: "aluno-acoes" },
                  e("button", { className: "btn secondary", style: { width: "auto" }, onClick: function () { props.onAbrir(a.id); } }, "Abrir"),
                  e("button", { className: "btn secondary danger-btn", style: { width: "auto" }, onClick: function () { props.onExcluir(a.id); } }, "Excluir")
                )
              );
            }))
      )
    );
  }

  /* ============================================================
     App principal
     ============================================================ */
  function App() {
    var tela = useState("inicio");          // "inicio" | "ficha" | "form" | "programa"
    var alunos = useState(carregarAlunos());
    var alunoId = useState(null);           // aluno aberto
    var progIdx = useState(null);           // índice do programa aberto (null = novo, ainda não salvo)
    var progAtual = useState(null);         // programa sendo visualizado/editado

    function acharAluno(id) {
      var lista = alunos[0];
      for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
      return null;
    }

    function persistir(lista) {
      alunos[1](lista);
      var ok = salvarAlunos(lista);
      var mensagem;
      if (ok) mensagem = "✔ Salvo neste navegador";
      else if (ultimoErroSalvar === "armazenamento_indisponivel")
        mensagem = "⚠ Salvo apenas nesta sessão — seu navegador está bloqueando o armazenamento local (comum em aba anônima). Use uma aba normal para salvar de forma permanente.";
      else if (ultimoErroSalvar === "QuotaExceededError")
        mensagem = "⚠ Espaço de armazenamento cheio. Exclua algum aluno antigo e tente novamente.";
      else mensagem = "⚠ Salvo apenas nesta sessão (não foi possível gravar: " + ultimoErroSalvar + ").";
      return { ok: ok, mensagem: mensagem };
    }

    /* ----- navegação ----- */
    function irInicio() { tela[1]("inicio"); alunoId[1](null); progIdx[1](null); progAtual[1](null); }

    function novoAluno() {
      var novo = { id: gerarId(), dados: { nome: "" }, programas: [] };
      var lista = alunos[0].concat([novo]);
      alunos[1](lista);            // ainda não persiste até salvar a ficha
      alunoId[1](novo.id);
      tela[1]("ficha");
    }

    function abrirAluno(id) { alunoId[1](id); tela[1]("ficha"); }

    function excluirAluno(id) {
      if (!window.confirm("Excluir este aluno e todas as suas periodizações?")) return;
      persistir(alunos[0].filter(function (a) { return a.id !== id; }));
    }

    /* ----- ficha ----- */
    function salvarFicha(dados) {
      var lista = alunos[0].map(function (a) {
        return a.id === alunoId[0] ? Object.assign({}, a, { dados: dados }) : a;
      });
      return persistir(lista);
    }

    /* ----- periodizações ----- */
    function novaPeriodizacao() { progIdx[1](null); progAtual[1](null); tela[1]("form"); }

    function aoGerar(cfg) {
      progAtual[1](gerarPeriodizacao(cfg));
      progIdx[1](null); // ainda não salvo na lista do aluno
      tela[1]("programa");
    }

    function abrirPrograma(idx) {
      var a = acharAluno(alunoId[0]);
      if (!a) return;
      progAtual[1](a.programas[idx]);
      progIdx[1](idx);
      tela[1]("programa");
    }

    function excluirPrograma(idx) {
      if (!window.confirm("Excluir esta periodização?")) return;
      var lista = alunos[0].map(function (a) {
        if (a.id !== alunoId[0]) return a;
        var novos = a.programas.slice(); novos.splice(idx, 1);
        return Object.assign({}, a, { programas: novos });
      });
      persistir(lista);
    }

    function salvarPrograma(p) {
      var idxSalvar = progIdx[0];
      var lista = alunos[0].map(function (a) {
        if (a.id !== alunoId[0]) return a;
        var novos = a.programas.slice();
        if (idxSalvar == null) { novos.push(p); }
        else { novos[idxSalvar] = p; }
        return Object.assign({}, a, { programas: novos });
      });
      // se era novo, fixa o índice para próximas gravações não duplicarem
      if (idxSalvar == null) {
        var a2 = null; for (var i = 0; i < lista.length; i++) if (lista[i].id === alunoId[0]) a2 = lista[i];
        if (a2) progIdx[1](a2.programas.length - 1);
      }
      return persistir(lista);
    }

    function atualizarProg(p) { progAtual[1](p); }

    /* ----- render ----- */
    var conteudo;
    if (tela[0] === "inicio") {
      conteudo = e(Inicio, { alunos: alunos[0], onNovoAluno: novoAluno, onAbrir: abrirAluno, onExcluir: excluirAluno });
    } else if (tela[0] === "ficha") {
      var aF = acharAluno(alunoId[0]);
      conteudo = aF ? e(FichaAluno, {
        aluno: aF,
        onVoltar: irInicio,
        onSalvar: salvarFicha,
        onNovaPeriodizacao: novaPeriodizacao,
        onAbrirPrograma: abrirPrograma,
        onExcluirPrograma: excluirPrograma,
      }) : e("p", { className: "empty" }, "Aluno não encontrado.");
    } else if (tela[0] === "form") {
      var aFm = acharAluno(alunoId[0]);
      conteudo = e(Formulario, {
        nomeAluno: aFm && aFm.dados ? aFm.dados.nome : "",
        onVoltar: function () { tela[1]("ficha"); },
        onGerar: aoGerar,
      });
    } else {
      var aP = acharAluno(alunoId[0]);
      conteudo = e(Programa, {
        prog: progAtual[0],
        dadosAluno: aP ? aP.dados : {},
        onVoltar: function () { tela[1]("ficha"); },
        onSalvar: salvarPrograma,
        onAtualizar: atualizarProg,
      });
    }

    return e("div", { className: "app" },
      e("div", { className: "header no-print" },
        e("div", { className: "logo" }, "🏋️"),
        e("div", null,
          e("h1", null, "PeriodizaFit"),
          e("p", null, "Periodização de musculação · protótipo")
        )
      ),
      conteudo,
      e("div", { className: "ciencia-box" },
        e("p", { className: "ciencia-titulo" }, "🔬 Metodologia baseada em evidências científicas"),
        e("p", { className: "ciencia-texto" },
          "Toda a metodologia de periodização desta plataforma é fundamentada em evidências " +
          "científicas atualizadas, seguindo as diretrizes do American College of Sports Medicine " +
          "(ACSM) e da International Universities Strength and Conditioning Association (IUSCA).")
      ),
      e("p", { className: "footer-note" },
        "Protótipo v0.5 — lógica baseada em evidências científicas atualizadas.",
        e("br"),
        "Prescrição sob responsabilidade técnica de Ricardo Tanhoffer, PhD em Ciências do Exercício."
      )
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(e(App));
})();
