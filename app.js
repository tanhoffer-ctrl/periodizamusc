/* ============================================================
   PeriodizaFit — Interface (React)
   ============================================================ */
const { useState } = React;
const { OBJETIVOS, FOCOS, NIVEIS, gerarPeriodizacao } = window.PeriodizaEngine;

/* ---------- Formulário de criação ---------- */
function Formulario({ onGerar }) {
  const [aluno, setAluno] = useState("");
  const [objetivo, setObjetivo] = useState("hipertrofia");
  const [foco, setFoco] = useState("corpo_todo");
  const [nivel, setNivel] = useState("intermediario");
  const [diasSemana, setDiasSemana] = useState(4);

  function submit(e) {
    e.preventDefault();
    onGerar({
      aluno: aluno.trim() || "Aluno(a)",
      objetivo, foco, nivel,
      diasSemana: Number(diasSemana),
    });
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Criar periodização</h2>
      <div className="grid">
        <div className="field full">
          <label>Nome do aluno</label>
          <input value={aluno} onChange={(e) => setAluno(e.target.value)} placeholder="Ex: João Silva" />
        </div>

        <div className="field">
          <label>Objetivo</label>
          <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
            {OBJETIVOS.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Foco</label>
          <select value={foco} onChange={(e) => setFoco(e.target.value)}>
            {FOCOS.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Nível</label>
          <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
            {NIVEIS.map((n) => <option key={n.id} value={n.id}>{n.nome}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Dias por semana</label>
          <select value={diasSemana} onChange={(e) => setDiasSemana(e.target.value)}>
            <option value={3}>3x por semana</option>
            <option value={4}>4x por semana</option>
            <option value={5}>5x por semana</option>
          </select>
        </div>
      </div>
      <button className="btn" type="submit">Gerar periodização automática</button>
    </form>
  );
}

/* ---------- Tabela de uma sessão de treino ---------- */
function TabelaSessao({ dia }) {
  return (
    <div className="day">
      <div className="day-head">{dia.nome}</div>
      <div className="overflow-x">
        <table>
          <thead>
            <tr>
              <th>Exercício</th>
              <th>Séries</th>
              <th>Reps</th>
              <th>Descanso</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>
            {dia.linhas.map((l, i) => (
              <tr key={i}>
                <td className="ex-name">{l.exercicio}</td>
                <td>{l.series}</td>
                <td>{l.reps}{l.exaustao ? " *" : ""}</td>
                <td>{l.descanso}</td>
                <td className="tech">{l.tecnica}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Visualização do programa gerado ---------- */
function Programa({ prog, onNovo }) {
  const [mesoAtivo, setMesoAtivo] = useState(0);
  const meso = prog.mesociclos[mesoAtivo];
  const temExaustao = prog.mesociclos.some((m) => m.semanas.some((s) => s.dias.some((d) => d.linhas.some((l) => l.exaustao))));

  return (
    <div className="card">
      <div className="prog-head">
        <div>
          <div className="prog-title">{prog.aluno}</div>
        </div>
        <button className="btn secondary" style={{ width: "auto" }} onClick={onNovo}>← Nova periodização</button>
      </div>

      <div className="badges">
        <span className="badge accent">🎯 {prog.objetivoNome}</span>
        <span className="badge">💪 {prog.focoNome}</span>
        <span className="badge">📊 {prog.nivelNome}</span>
        <span className="badge">📅 {prog.diasSemana}x/semana</span>
        <span className="badge">🔄 {prog.modelo}</span>
        <span className="badge">🗓️ {prog.totalSemanas} semanas</span>
      </div>

      {/* Navegação por mesociclo */}
      <div className="meso-nav">
        {prog.mesociclos.map((m, i) => (
          <div
            key={m.id}
            className={"meso-chip" + (i === mesoAtivo ? " active" : "")}
            onClick={() => setMesoAtivo(i)}
          >
            {m.nome}
            <small>{m.semanas.length} sem · {m.series} séries</small>
          </div>
        ))}
      </div>

      <div className="meso-desc">
        <strong>{meso.nome}</strong> — {meso.intensidade}<br />
        {meso.descricao}
      </div>

      {/* Semanas do mesociclo ativo */}
      {meso.semanas.map((sem) => (
        <div className="week" key={sem.numeroGlobal}>
          <div className="week-title">
            Semana {sem.numeroGlobal}
            <span className="tag">{sem.progressao}</span>
          </div>
          {sem.dias.map((dia, i) => <TabelaSessao key={i} dia={dia} />)}
        </div>
      ))}

      {temExaustao && (
        <p className="footer-note">
          <strong>*</strong> = última(s) série(s) levada(s) à exaustão concêntrica.
        </p>
      )}
    </div>
  );
}

/* ---------- App principal ---------- */
function App() {
  const [prog, setProg] = useState(null);

  return (
    <div className="app">
      <div className="header">
        <div className="logo">🏋️</div>
        <div>
          <h1>PeriodizaFit</h1>
          <p>Periodização de musculação · protótipo</p>
        </div>
      </div>

      {!prog
        ? <Formulario onGerar={(cfg) => setProg(gerarPeriodizacao(cfg))} />
        : <Programa prog={prog} onNovo={() => setProg(null)} />
      }

      <p className="footer-note">
        Protótipo v0.1 — lógica baseada em princípios consolidados de treinamento.<br />
        Prescrição sob responsabilidade técnica de Ricardo Tanhoffer, PhD em Ciências do Exercício.
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
