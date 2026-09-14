# PeriodizaFit 🏋️

Protótipo de plataforma web para **montar periodização de musculação** com diferentes
objetivos (hipertrofia, força, emagrecimento, etc.), gerando o programa automaticamente
a partir do objetivo, foco, nível e frequência semanal do aluno.

> Prescrição sob responsabilidade técnica de **Ricardo Tanhoffer, PhD em Ciências do Exercício**.

## Como funciona

1. Abra a aplicação no navegador (celular ou computador).
2. Preencha os dados do aluno: nome, objetivo, foco, nível e dias por semana.
3. Clique em **Gerar periodização automática**.
4. Navegue pelos mesociclos e visualize as sessões (exercícios, séries, repetições,
   descanso e técnicas avançadas).

## Objetivos suportados

Hipertrofia · Hipertrofia Estética · Força · Resistência · Potência ·
Emagrecimento · Aptidão Física Geral · Reabilitação

## Modelo de hipertrofia (12 semanas, ondulatório)

1. **Adaptação e Técnica** (2 semanas)
2. **Intensificação I** (3 semanas)
3. **Intensificação II** (3 semanas) — com bi-set e rest-pause
4. **Consolidação** (3 semanas)
5. **Recuperação / Deload** (1 semana)

## Tecnologia

Aplicação web estática (HTML + CSS + React via CDN). Não requer instalação nem
servidor — basta abrir o `index.html` ou acessar pelo GitHub Pages.

## Estrutura

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Página principal |
| `styles.css` | Estilos (layout responsivo) |
| `engine.js` | Motor de geração da periodização (toda a lógica de prescrição) |
| `app.js` | Interface (formulário + visualização) |

## Status

Protótipo **v0.1** — lógica baseada em princípios consolidados de treinamento,
em refinamento contínuo com o metodologista.
