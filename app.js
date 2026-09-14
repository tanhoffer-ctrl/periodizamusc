/* ============================================================
   PeriodizaFit — Interface (React, sem JSX)
   Escrito com React.createElement para NÃO depender de Babel.
   Fase 1: troca manual de exercícios, salvar/carregar alunos
   (localStorage), exportar PDF.
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

  /* ============================================================
     Persistência no navegador (localStorage)
     ============================================================ */
  var STORAGE_KEY = "periodizafit_alunos";

  function carregarAlunos() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) { return []; }
  }
  function salvarAlunos(lista) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)); return true; }
    catch (err) { return false; }
  }
  function gerarId() {
    return "a_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  }

  /* ============================================================
     Formulário de criação
     ============================================================ */
  function Formulario(props) {
    var aluno = useState("");
    var objetivo = useState("hipertrofia");
    var foco = useState("corpo_todo");
    var nivel = useState("intermediario");
    var diasSemana = useState(4);

    function submit(ev) {
      ev.preventDefault();
      props.onGerar({
        aluno: (aluno[0].trim()) || "Aluno(a)",
        objetivo: objetivo[0],
        foco: foco[0],
        nivel: nivel[0],
        diasSemana: Number(diasSemana[0]),
      });
    }

    function selectField(label, state, options) {
      return e("div", { className: "field" },
        e("label", null, label),
        e("select", {
          value: state[0],
          onChange: function (ev) { state[1](ev.target.value); },
        }, options.map(function (o) {
          return e("option", { key: o.value, value: o.value }, o.label);
        }))
      );
    }

    return e("form", { className: "card", onSubmit: submit },
      e("h2", null, "Criar periodização"),
      e("div", { className: "grid" },
        e("div", { className: "field full" },
          e("label", null, "Nome do aluno"),
          e("input", {
            value: aluno[0],
            onChange: function (ev) { aluno[1](ev.target.value); },
            placeholder: "Ex: João Silva",
          })
        ),
        selectField("Objetivo", objetivo, OBJETIVOS.map(function (o) { return { value: o.id, label: o.nome }; })),
        selectField("Foco", foco, FOCOS.map(function (f) { return { value: f.id, label: f.nome }; })),
        selectField("Nível", nivel, NIVEIS.map(function (n) { return { value: n.id, label: n.nome }; })),
        selectField("Dias por semana", diasSemana, [
          { value: 3, label: "3x por semana" },
          { value: 4, label: "4x por semana" },
          { value: 5, label: "5x por semana" },
        ])
      ),
      e("button", { className: "btn", type: "submit" }, "Gerar periodização automática")
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
            e("th", null, "Exercício"),
            e("th", null, "Séries"),
            e("th", null, "Reps"),
            e("th", null, "Descanso"),
            e("th", null, "Obs.")
          )),
          e("tbody", null, dia.linhas.map(function (l, i) {
            var celulaExercicio;
            if (editando && l.grupo && EXERCICIOS[l.grupo]) {
              celulaExercicio = e("select", {
                className: "ex-select",
                value: l.exercicio,
                title: "Trocar exercício (" + (GRUPO_NOMES[l.grupo] || l.grupo) + ")",
                onChange: function (ev) { props.onTrocar(i, ev.target.value); },
              }, opcoesDoGrupo(l.grupo));
            } else {
              celulaExercicio = e("span", { className: "ex-name" }, l.exercicio);
            }
            return e("tr", { key: i },
              e("td", null, celulaExercicio),
              e("td", null, l.series),
              e("td", null, l.reps + (l.exaustao ? " *" : "")),
              e("td", null, l.descanso),
              e("td", { className: "tech" }, l.tecnica)
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
    var mesoAtivo = useState(0);
    var editando = useState(false);
    var salvoMsg = useState("");

    var meso = prog.mesociclos[mesoAtivo[0]];
    var temExaustao = prog.mesociclos.some(function (m) {
      return m.semanas.some(function (s) {
        return s.dias.some(function (d) {
          return d.linhas.some(function (l) { return l.exaustao; });
        });
      });
    });

    // troca um exercício: aplica a MESMA troca em todas as semanas do mesociclo ativo,
    // no mesmo dia e mesma posição (mantém consistência dentro do bloco)
    function trocarExercicio(semanaIdx, diaIdx, linhaIdx, novoNome) {
      var novasSemanas = meso.semanas.map(function (sem, si) {
        var novosDias = sem.dias.map(function (d, di) {
          if (di !== diaIdx) return d;
          var novasLinhas = d.linhas.map(function (l, li) {
            if (li !== linhaIdx) return l;
            return Object.assign({}, l, { exercicio: novoNome });
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
      var ok = props.onSalvar(prog);
      salvoMsg[1](ok ? "✔ Aluno salvo neste navegador" : "✖ Não foi possível salvar");
      setTimeout(function () { salvoMsg[1](""); }, 3000);
    }

    var badges = [
      { c: "badge accent", t: "🎯 " + prog.objetivoNome },
      { c: "badge", t: "💪 " + prog.focoNome },
      { c: "badge", t: "📊 " + prog.nivelNome },
      { c: "badge", t: "📅 " + prog.diasSemana + "x/semana" },
      { c: "badge", t: "🔄 " + prog.modelo },
      { c: "badge", t: "🗓️ " + prog.totalSemanas + " semanas" },
    ];

    return e("div", { className: "card", id: "programa-print" },
      e("div", { className: "prog-head" },
        e("div", null, e("div", { className: "prog-title" }, prog.aluno)),
        e("button", {
          className: "btn secondary no-print",
          style: { width: "auto" },
          onClick: props.onNovo,
        }, "← Voltar")
      ),
      e("div", { className: "badges" }, badges.map(function (b, i) {
        return e("span", { key: i, className: b.c }, b.t);
      })),

      /* barra de ações */
      e("div", { className: "actions-row no-print", style: { marginTop: 16 } },
        e("button", {
          className: "btn " + (editando[0] ? "" : "secondary"),
          onClick: function () { editando[1](!editando[0]); },
        }, editando[0] ? "✓ Concluir edição" : "✏️ Editar exercícios"),
        e("button", { className: "btn secondary", onClick: salvar }, "💾 Salvar aluno"),
        e("button", { className: "btn secondary", onClick: function () { window.print(); } }, "📄 Exportar PDF")
      ),
      salvoMsg[0] ? e("p", { className: "footer-note no-print", style: { color: "var(--accent-2)", marginTop: 8 } }, salvoMsg[0]) : null,

      editando[0]
        ? e("div", { className: "meso-desc no-print", style: { borderLeftColor: "var(--warn)" } },
            "Modo edição: clique no nome de um exercício para trocá-lo por outro do mesmo grupo muscular. A troca vale para todas as semanas deste mesociclo.")
        : null,

      /* navegação por mesociclo */
      e("div", { className: "meso-nav no-print" }, prog.mesociclos.map(function (m, i) {
        return e("div", {
          key: m.id,
          className: "meso-chip" + (i === mesoAtivo[0] ? " active" : ""),
          onClick: function () { mesoAtivo[1](i); },
        }, m.nome, e("small", null, m.semanas.length + " sem · " + m.series + " séries"));
      })),

      /* Para o PDF: mostra TODOS os mesociclos; na tela, só o ativo */
      prog.mesociclos.map(function (m, mi) {
        var visivelNaTela = mi === mesoAtivo[0];
        return e("div", {
          key: m.id,
          className: visivelNaTela ? "" : "only-print",
        },
          e("div", { className: "meso-desc" },
            e("strong", null, m.nome), " — " + m.intensidade,
            e("br"), m.descricao
          ),
          m.semanas.map(function (sem, si) {
            return e("div", { className: "week", key: sem.numeroGlobal },
              e("div", { className: "week-title" },
                "Semana " + sem.numeroGlobal,
                e("span", { className: "tag" }, sem.progressao)
              ),
              sem.dias.map(function (dia, di) {
                return e(TabelaSessao, {
                  key: di,
                  dia: dia,
                  editando: editando[0] && visivelNaTela,
                  onTrocar: function (linhaIdx, novoNome) {
                    trocarExercicio(si, di, linhaIdx, novoNome);
                  },
                });
              })
            );
          })
        );
      }),

      temExaustao ? e("p", { className: "footer-note" },
        e("strong", null, "*"), " = última(s) série(s) levada(s) à exaustão concêntrica."
      ) : null
    );
  }

  /* ============================================================
     Painel inicial: lista de alunos salvos + novo
     ============================================================ */
  function Inicio(props) {
    var alunos = props.alunos;

    return e("div", null,
      e("div", { className: "card" },
        e("div", { className: "prog-head" },
          e("h2", { style: { margin: 0 } }, "Alunos salvos"),
          e("button", {
            className: "btn", style: { width: "auto" },
            onClick: props.onNovo,
          }, "+ Nova periodização")
        ),
        alunos.length === 0
          ? e("p", { className: "empty" }, "Nenhum aluno salvo ainda. Crie uma periodização e clique em “Salvar aluno”.")
          : e("div", { style: { marginTop: 16 } }, alunos.map(function (a) {
              return e("div", { key: a.id, className: "aluno-item" },
                e("div", { className: "aluno-info" },
                  e("div", { className: "aluno-nome" }, a.prog.aluno),
                  e("div", { className: "aluno-meta" },
                    a.prog.objetivoNome + " · " + a.prog.focoNome + " · " +
                    a.prog.nivelNome + " · " + a.prog.diasSemana + "x/sem · " +
                    a.prog.totalSemanas + " sem")
                ),
                e("div", { className: "aluno-acoes" },
                  e("button", { className: "btn secondary", style: { width: "auto" }, onClick: function () { props.onAbrir(a); } }, "Abrir"),
                  e("button", { className: "btn secondary danger-btn", style: { width: "auto" }, onClick: function () { props.onExcluir(a.id); } }, "Excluir")
                )
              );
            }))
      )
    );
  }

  /* ============================================================
     App principal — controla as telas
     ============================================================ */
  function App() {
    var tela = useState("inicio");            // "inicio" | "form" | "programa"
    var prog = useState(null);
    var alunos = useState(carregarAlunos());
    var editId = useState(null);              // id do aluno aberto (para atualizar em vez de duplicar)

    function irInicio() { tela[1]("inicio"); prog[1](null); editId[1](null); }

    function novaPeriodizacao() { tela[1]("form"); }

    function aoGerar(cfg) {
      prog[1](gerarPeriodizacao(cfg));
      editId[1](null);
      tela[1]("programa");
    }

    function abrirAluno(a) {
      prog[1](a.prog);
      editId[1](a.id);
      tela[1]("programa");
    }

    function salvarAtual(p) {
      var lista = alunos[0].slice();
      if (editId[0]) {
        // atualiza existente
        lista = lista.map(function (a) { return a.id === editId[0] ? { id: a.id, prog: p } : a; });
      } else {
        var novo = { id: gerarId(), prog: p };
        lista.push(novo);
        editId[1](novo.id);
      }
      var ok = salvarAlunos(lista);
      if (ok) alunos[1](lista);
      return ok;
    }

    function excluirAluno(id) {
      if (!window.confirm("Excluir este aluno e seu programa?")) return;
      var lista = alunos[0].filter(function (a) { return a.id !== id; });
      salvarAlunos(lista);
      alunos[1](lista);
    }

    function atualizarProg(p) { prog[1](p); }

    var conteudo;
    if (tela[0] === "inicio") {
      conteudo = e(Inicio, {
        alunos: alunos[0],
        onNovo: novaPeriodizacao,
        onAbrir: abrirAluno,
        onExcluir: excluirAluno,
      });
    } else if (tela[0] === "form") {
      conteudo = e("div", null,
        e("button", { className: "btn secondary no-print", style: { width: "auto", marginBottom: 16 }, onClick: irInicio }, "← Voltar"),
        e(Formulario, { onGerar: aoGerar })
      );
    } else {
      conteudo = e(Programa, {
        prog: prog[0],
        onNovo: irInicio,
        onSalvar: salvarAtual,
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
      e("p", { className: "footer-note" },
        "Protótipo v0.2 — lógica baseada em princípios consolidados de treinamento.",
        e("br"),
        "Prescrição sob responsabilidade técnica de Ricardo Tanhoffer, PhD em Ciências do Exercício."
      )
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(e(App));
})();
