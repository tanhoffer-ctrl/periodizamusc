/* ============================================================
   PeriodizaFit — Interface (React, sem JSX)
   Escrito com React.createElement para NÃO depender de Babel,
   garantindo que rode em qualquer navegador / GitHub Pages.
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
  var OBJETIVOS = window.PeriodizaEngine.OBJETIVOS;
  var FOCOS = window.PeriodizaEngine.FOCOS;
  var NIVEIS = window.PeriodizaEngine.NIVEIS;
  var gerarPeriodizacao = window.PeriodizaEngine.gerarPeriodizacao;

  /* ---------- Formulário de criação ---------- */
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

  /* ---------- Tabela de uma sessão ---------- */
  function TabelaSessao(props) {
    var dia = props.dia;
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
            return e("tr", { key: i },
              e("td", { className: "ex-name" }, l.exercicio),
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

  /* ---------- Visualização do programa ---------- */
  function Programa(props) {
    var prog = props.prog;
    var mesoAtivo = useState(0);
    var meso = prog.mesociclos[mesoAtivo[0]];
    var temExaustao = prog.mesociclos.some(function (m) {
      return m.semanas.some(function (s) {
        return s.dias.some(function (d) {
          return d.linhas.some(function (l) { return l.exaustao; });
        });
      });
    });

    var badges = [
      { c: "badge accent", t: "🎯 " + prog.objetivoNome },
      { c: "badge", t: "💪 " + prog.focoNome },
      { c: "badge", t: "📊 " + prog.nivelNome },
      { c: "badge", t: "📅 " + prog.diasSemana + "x/semana" },
      { c: "badge", t: "🔄 " + prog.modelo },
      { c: "badge", t: "🗓️ " + prog.totalSemanas + " semanas" },
    ];

    return e("div", { className: "card" },
      e("div", { className: "prog-head" },
        e("div", null, e("div", { className: "prog-title" }, prog.aluno)),
        e("button", {
          className: "btn secondary",
          style: { width: "auto" },
          onClick: props.onNovo,
        }, "← Nova periodização")
      ),
      e("div", { className: "badges" }, badges.map(function (b, i) {
        return e("span", { key: i, className: b.c }, b.t);
      })),

      /* navegação por mesociclo */
      e("div", { className: "meso-nav" }, prog.mesociclos.map(function (m, i) {
        return e("div", {
          key: m.id,
          className: "meso-chip" + (i === mesoAtivo[0] ? " active" : ""),
          onClick: function () { mesoAtivo[1](i); },
        }, m.nome, e("small", null, m.semanas.length + " sem · " + m.series + " séries"));
      })),

      e("div", { className: "meso-desc" },
        e("strong", null, meso.nome), " — " + meso.intensidade,
        e("br"), meso.descricao
      ),

      meso.semanas.map(function (sem) {
        return e("div", { className: "week", key: sem.numeroGlobal },
          e("div", { className: "week-title" },
            "Semana " + sem.numeroGlobal,
            e("span", { className: "tag" }, sem.progressao)
          ),
          sem.dias.map(function (dia, i) { return e(TabelaSessao, { key: i, dia: dia }); })
        );
      }),

      temExaustao ? e("p", { className: "footer-note" },
        e("strong", null, "*"), " = última(s) série(s) levada(s) à exaustão concêntrica."
      ) : null
    );
  }

  /* ---------- App principal ---------- */
  function App() {
    var prog = useState(null);
    return e("div", { className: "app" },
      e("div", { className: "header" },
        e("div", { className: "logo" }, "🏋️"),
        e("div", null,
          e("h1", null, "PeriodizaFit"),
          e("p", null, "Periodização de musculação · protótipo")
        )
      ),
      !prog[0]
        ? e(Formulario, { onGerar: function (cfg) { prog[1](gerarPeriodizacao(cfg)); } })
        : e(Programa, { prog: prog[0], onNovo: function () { prog[1](null); } }),
      e("p", { className: "footer-note" },
        "Protótipo v0.1 — lógica baseada em princípios consolidados de treinamento.",
        e("br"),
        "Prescrição sob responsabilidade técnica de Ricardo Tanhoffer, PhD em Ciências do Exercício."
      )
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(e(App));
})();
