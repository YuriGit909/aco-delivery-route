import { criarRng } from './rng.js';
import { matrizDistancias, matrizFeromonio, comprimentoRota, roletaSelecao, construirRota, calcularProbabilidades, atualizarFeromonio, TAU_MIN } from './aco.js';
import { Simulacao } from './simulation.js'
import { validarEntrada } from './validation.js'

// ---------- Mini framework de testes ----------
const saida = document.getElementById('resultados');
let passou = 0, falhou = 0;

const TOL = 1e-6; // tolerância exigida na seção 6
const approx = (a, b) => Math.abs(a - b) < TOL;

function check(nome, condicao, detalhe = '') {
  const linha = document.createElement('div');
  linha.className = condicao ? 'ok' : 'falha';
  linha.textContent = `${condicao ? '✔' : '✘'} ${nome}${detalhe ? ' — ' + detalhe : ''}`;
  saida.appendChild(linha);
  console[condicao ? 'log' : 'error'](linha.textContent);
  condicao ? passou++ : falhou++;
}

function secao(titulo) {
  const h = document.createElement('h2');
  h.textContent = titulo;
  saida.appendChild(h);
}

// ---------- Instância de referência (seção 6.1) ----------
const vertices = [
  { id: 'A', x: 0, y: 0 },
  { id: 'B', x: 3, y: 0 },
  { id: 'C', x: 3, y: 4 },
  { id: 'D', x: 0, y: 4 },
];
const [A, B, C, D] = [0, 1, 2, 3];
const d = matrizDistancias(vertices);

// ---------- Distâncias ----------
secao('Etapa 1 – Distâncias');

const esperadas = [
  ['A-B', A, B, 3], ['A-C', A, C, 5], ['A-D', A, D, 4],
  ['B-C', B, C, 4], ['B-D', B, D, 5], ['C-D', C, D, 3],
];
for (const [nome, i, j, valor] of esperadas) {
  check(`d(${nome}) = ${valor}`, approx(d[i][j], valor), `obtido ${d[i][j]}`);
  check(`d(${nome}) simétrica`, d[i][j] === d[j][i]);
}
check('Diagonal toda zero', d.every((linha, i) => linha[i] === 0));

// ---------- Comprimento das rotas ----------
secao('Etapa 1 – Comprimento das 6 rotas');

const rotas = [
  [[A, B, C, D, A], 14], [[A, B, D, C, A], 16], [[A, C, B, D, A], 18],
  [[A, C, D, B, A], 16], [[A, D, B, C, A], 18], [[A, D, C, B, A], 14],
];
for (const [rota, valor] of rotas) {
  const nome = rota.map(i => vertices[i].id).join(' → ');
  const L = comprimentoRota(rota, d);
  check(`${nome} = ${valor}`, approx(L, valor), `obtido ${L}`);
}

// ---------- Feromônio inicial ----------
secao('Etapa 1 – Matriz de feromônio');

const tau = matrizFeromonio(4, 1);
let foraDiagonalOk = true, diagonalOk = true;
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    if (i === j && tau[i][j] !== 0) diagonalOk = false;
    if (i !== j && tau[i][j] !== 1) foraDiagonalOk = false;
  }
}
check('τ = τ₀ = 1 fora da diagonal', foraDiagonalOk);
check('Diagonal sem feromônio', diagonalOk);

// ---------- Gerador com semente ----------
secao('Etapa 1 – Gerador com semente');

const gerar = (semente, qtd) => {
  const rng = criarRng(semente);
  return Array.from({ length: qtd }, () => rng());
};

const seq1 = gerar(42, 5);
const seq2 = gerar(42, 5);
const seq3 = gerar(43, 5);

check('Mesma semente → mesma sequência',
  seq1.every((v, k) => v === seq2[k]), seq1.map(v => v.toFixed(6)).join(', '));
check('Semente diferente → sequência diferente',
  seq1.some((v, k) => v !== seq3[k]));

const muitos = gerar(1, 10000);
check('Todos os valores em [0, 1)', muitos.every(v => v >= 0 && v < 1));
const media = muitos.reduce((s, v) => s + v, 0) / muitos.length;
check('Média próxima de 0,5 (distribuição uniforme)',
  Math.abs(media - 0.5) < 0.02, `média ${media.toFixed(4)}`);

// ---------- Resumo ----------
secao(`Resumo: ${passou} passaram, ${falhou} falharam`);

// ---------- Probabilidades (seção 6.2) ----------
secao('Etapa 2 – Probabilidades a partir de A (τ=1, α=1, β=2)');

const tau1 = matrizFeromonio(4, 1);
const pA = calcularProbabilidades(A, [true, false, false, false], tau1, d, 1, 2);
const probDe = (lista, j) => lista.find(c => c.j === j).p;

check('w(A,B) = 1/9', approx(pA.find(c => c.j === B).w, 1 / 9));
check('w(A,C) = 1/25', approx(pA.find(c => c.j === C).w, 1 / 25));
check('w(A,D) = 1/16', approx(pA.find(c => c.j === D).w, 1 / 16));
check('p(A,B) = 400/769', approx(probDe(pA, B), 400 / 769), `obtido ${probDe(pA, B)}`);
check('p(A,C) = 144/769', approx(probDe(pA, C), 144 / 769), `obtido ${probDe(pA, C)}`);
check('p(A,D) = 225/769', approx(probDe(pA, D), 225 / 769), `obtido ${probDe(pA, D)}`);
check('Soma = 1', approx(pA.reduce((s, c) => s + c.p, 0), 1));
check('3 candidatos (nenhum excluído)', pA.length === 3);

secao('Etapa 2 – Probabilidades a partir de B (A e B visitados)');

const pB = calcularProbabilidades(B, [true, true, false, false], tau1, d, 1, 2);
check('Apenas C e D são candidatos', pB.length === 2 && pB.every(c => c.j === C || c.j === D));
check('p(B,C) = 25/41', approx(probDe(pB, C), 25 / 41), `obtido ${probDe(pB, C)}`);
check('p(B,D) = 16/41', approx(probDe(pB, D), 16 / 41), `obtido ${probDe(pB, D)}`);

secao('Etapa 2 – Casos especiais');

const tauVariado = matrizFeromonio(4, 1);
tauVariado[A][B] = tauVariado[B][A] = 7; // feromônio diferente não deve importar com α=0
const p00 = calcularProbabilidades(A, [true, false, false, false], tauVariado, d, 0, 0);
check('α=0, β=0 → probabilidades iguais (1/3)', p00.every(c => approx(c.p, 1 / 3)));

const pUnico = calcularProbabilidades(C, [true, true, true, false], tau1, d, 1, 2);
check('Um único candidato → p = 1', pUnico.length === 1 && approx(pUnico[0].p, 1));

// ---------- Roleta com valores forçados ----------
secao('Etapa 2 – Roleta com r forçado');

const rngFixo = valor => () => valor; // "gerador" que sempre devolve o mesmo número
check('r = 0,1 → B', roletaSelecao(pA, rngFixo(0.1)).escolhido === B);
check('r = 0,6 → C', roletaSelecao(pA, rngFixo(0.6)).escolhido === C);
check('r = 0,9 → D', roletaSelecao(pA, rngFixo(0.9)).escolhido === D);
check('r = 0,9999999999 → D', roletaSelecao(pA, rngFixo(0.9999999999)).escolhido === D);

// ---------- Frequências da roleta ----------
secao('Etapa 2 – Frequência dos sorteios (10.000 amostras)');

const rngFreq = criarRng(123);
const contagem = { [B]: 0, [C]: 0, [D]: 0 };
for (let k = 0; k < 10000; k++) contagem[roletaSelecao(pA, rngFreq).escolhido]++;
for (const j of [B, C, D]) {
  const freq = contagem[j] / 10000;
  check(`Frequência de ${vertices[j].id} ≈ ${probDe(pA, j).toFixed(4)}`,
    Math.abs(freq - probDe(pA, j)) < 0.02, `obtido ${freq.toFixed(4)}`);
}

// ---------- Rotas construídas ----------
secao('Etapa 2 – Validade de 1.000 rotas construídas');

const rngRotas = criarRng(7);
let todasValidas = true, comprimentosOk = true;
for (let k = 0; k < 1000; k++) {
  const { rota, comprimento } = construirRota(A, tau1, d, 1, 2, rngRotas);
  const meio = rota.slice(1, -1);
  const valida = rota.length === 5 && rota[0] === A && rota[4] === A &&
                 new Set(meio).size === 3 && !meio.includes(A);
  if (!valida) todasValidas = false;
  if (![14, 16, 18].some(v => approx(comprimento, v))) comprimentosOk = false;
}
check('Todas começam e terminam em A, sem repetição', todasValidas);
check('Todos os comprimentos ∈ {14, 16, 18}', comprimentosOk);

// ---------- Evaporação e depósito (seção 6.3) ----------
const rotaForcada = [A, B, C, D, A];
const formiga = { rota: rotaForcada, comprimento: comprimentoRota(rotaForcada, d) };
const perimetro = [[A, B], [B, C], [C, D], [A, D]];
const diagonais = [[A, C], [B, D]];
const logDe = (log, i, j) => log.find(e => e.i === Math.min(i, j) && e.j === Math.max(i, j));

secao('Etapa 3 – Uma formiga, 1ª iteração (τ₀=1, ρ=0,5, Q=14)');

const tauInicial = matrizFeromonio(4, 1);
const it1 = atualizarFeromonio(tauInicial, [formiga], 0.5, 14);

check('Todas as 6 arestas = 0,5 após evaporação',
  it1.log.length === 6 && it1.log.every(e => approx(e.aposEvaporacao, 0.5)));
for (const [i, j] of perimetro)
  check(`${vertices[i].id}${vertices[j].id} = 1,5`, approx(it1.tau[i][j], 1.5), `obtido ${it1.tau[i][j]}`);
for (const [i, j] of diagonais)
  check(`${vertices[i].id}${vertices[j].id} = 0,5`, approx(it1.tau[i][j], 0.5), `obtido ${it1.tau[i][j]}`);

const eAB = logDe(it1.log, A, B), eAC = logDe(it1.log, A, C);
check('Log AB: anterior 1; após evaporação 0,5; depósito 1; final 1,5',
  approx(eAB.anterior, 1) && approx(eAB.aposEvaporacao, 0.5) &&
  approx(eAB.deposito, 1) && approx(eAB.final, 1.5));
check('Log AC: anterior 1; após evaporação 0,5; depósito 0; final 0,5',
  approx(eAC.anterior, 1) && approx(eAC.aposEvaporacao, 0.5) &&
  approx(eAC.deposito, 0) && approx(eAC.final, 0.5));

check('Matriz simétrica', it1.tau.every((linha, i) => linha.every((v, j) => v === it1.tau[j][i])));
check('Diagonal sem feromônio', it1.tau.every((linha, i) => linha[i] === 0));
check('Matriz original não foi alterada', tauInicial[A][B] === 1);

secao('Etapa 3 – Uma formiga, 2ª iteração');

const it2 = atualizarFeromonio(it1.tau, [formiga], 0.5, 14);
for (const [i, j] of perimetro)
  check(`${vertices[i].id}${vertices[j].id} = 1,75`, approx(it2.tau[i][j], 1.75), `obtido ${it2.tau[i][j]}`);
for (const [i, j] of diagonais)
  check(`${vertices[i].id}${vertices[j].id} = 0,25`, approx(it2.tau[i][j], 0.25), `obtido ${it2.tau[i][j]}`);

secao('Etapa 3 – Duas formigas na mesma rota');

const dupla = atualizarFeromonio(matrizFeromonio(4, 1), [formiga, formiga], 0.5, 14);
for (const [i, j] of perimetro)
  check(`${vertices[i].id}${vertices[j].id} = 2,5`, approx(dupla.tau[i][j], 2.5), `obtido ${dupla.tau[i][j]}`);
for (const [i, j] of diagonais)
  check(`${vertices[i].id}${vertices[j].id} = 0,5`, approx(dupla.tau[i][j], 0.5), `obtido ${dupla.tau[i][j]}`);

// ---------- Casos limite (seção 6.5) ----------
secao('Etapa 3 – ρ = 0% e piso numérico');

const semEvap = atualizarFeromonio(matrizFeromonio(4, 1), [formiga], 0, 14);
check('ρ=0: nenhuma aresta reduzida pela evaporação',
  semEvap.log.every(e => e.aposEvaporacao === e.anterior));
check('ρ=0: diagonais continuam 1', approx(semEvap.tau[A][C], 1) && approx(semEvap.tau[B][D], 1));

const quase = matrizFeromonio(4, TAU_MIN);
const comPiso = atualizarFeromonio(quase, [], 0.9, 14); // sem formigas → só evaporação
check('Piso de 10⁻¹² aplicado', comPiso.log.every(e => e.final === TAU_MIN && e.pisoAplicado));

  // ---------- Execução completa (seção 6.4) ----------
  const params64 = {
    vertices, deposito: A, formigas: 10, iteracoes: 30,
    alpha: 1, beta: 2, rho: 0.5, tau0: 1, Q: 14, semente: 42,
  };
  const executarTudo = sim => { while (!sim.concluida) sim.passo(); return sim; };
  const resumo = sim => JSON.stringify(sim.historico.map(r => r.rotas));
  secao('Etapa 4 – Estado inicial (iteração 0)');

  const simInicial = new Simulacao(params64);
  check('Iteração 0', simInicial.iteracao === 0);
  check('Melhor global "ainda não calculada" (null, não zero)', simInicial.melhorGlobal === null);
  check('τ = 1 em todas as arestas', simInicial.tau.every((l, i) => l.every((v, j) => i === j || v === 1)));

  secao('Etapa 4 – Execução completa (10 formigas, 30 iterações, semente 42)');

  const sim1 = executarTudo(new Simulacao(params64));
  check('30 registros', sim1.historico.length === 30);
  check('Iterações numeradas de 1 a 30', sim1.historico.every((r, k) => r.iteracao === k + 1));
  check('Todas as rotas com comprimento ∈ {14, 16, 18}',
    sim1.historico.every(r => r.rotas.every(f => [14, 16, 18].some(v => approx(f.comprimento, v)))));
  check('Melhor global nunca aumenta',
    sim1.historico.every((r, k) => k === 0 ||
      r.melhorGlobal.comprimento <= sim1.historico[k - 1].melhorGlobal.comprimento));
  check('Cada iteração tem a construção detalhada de uma rota (3 passos)',
    sim1.historico.every(r => r.construcaoDetalhada.length === 3));

  const mg = sim1.melhorGlobal;
  check(`Resultado: ${mg.rota.map(i => vertices[i].id).join(' → ')} = ${mg.comprimento} ` +
        `(encontrada na iteração ${mg.iteracao})`, true);

  secao('Etapa 4 – Reprodutibilidade');

  const sim2 = executarTudo(new Simulacao(params64));
  check('Mesmos dados e semente → mesmo histórico', resumo(sim1) === resumo(sim2));

  const simPausada = new Simulacao(params64);
  for (let k = 0; k < 12; k++) simPausada.passo();
  executarTudo(simPausada);
  check('Pausar e retomar → mesmo histórico', resumo(sim1) === resumo(simPausada));

  sim1.reiniciar();
  check('Reiniciar limpa o histórico e restaura τ₀',
    sim1.historico.length === 0 && sim1.iteracao === 0 && sim1.melhorGlobal === null &&
    sim1.tau[A][B] === 1);
  executarTudo(sim1);
  check('Após reiniciar → mesmo histórico', resumo(sim1) === resumo(sim2));

  const simOutra = executarTudo(new Simulacao({ ...params64, semente: 43 }));
  check('Semente diferente → histórico diferente', resumo(simOutra) !== resumo(sim2));

// ---------- Validação (seção 6.5) ----------
secao('Etapa 5 – Validação de entradas');

const entradaBase = () => ({
  vertices: [
    { id: 'A', x: '0', y: '0' }, { id: 'B', x: '3', y: '0' },
    { id: 'C', x: '3', y: '4' }, { id: 'D', x: '0', y: '4' },
  ],
  depositoId: 'A', formigas: '10', iteracoes: '30', alpha: '1', beta: '2',
  rhoPercentual: '50', tau0: '1', Q: '14', semente: '42',
});
const comAlteracao = alterar => { const e = entradaBase(); alterar(e); return validarEntrada(e); };
const deveRejeitar = (nome, alterar) => {
  const r = comAlteracao(alterar);
  check(`Rejeita: ${nome}`, !r.valido && r.erros.length > 0, r.erros.join(' | '));
};

const base = validarEntrada(entradaBase());
check('Entrada válida é aceita', base.valido, base.erros.join(' | '));
check('ρ = 50% convertido para 0,5', base.valido && approx(base.params.rho, 0.5));
check('Depósito convertido para índice 0', base.valido && base.params.deposito === 0);
check('Aceita ρ = 0%', comAlteracao(e => (e.rhoPercentual = '0')).valido);

deveRejeitar('coordenadas duplicadas', e => { e.vertices[1].x = '0'; e.vertices[1].y = '0'; });
deveRejeitar('identificador repetido', e => (e.vertices[1].id = 'A'));
deveRejeitar('menos de quatro vértices', e => e.vertices.pop());
deveRejeitar('identificador vazio', e => (e.vertices[2].id = ''));
deveRejeitar('coordenada vazia', e => (e.vertices[2].x = ''));
deveRejeitar('coordenada fora do intervalo (1000,01)', e => (e.vertices[2].x = '1000.01'));
deveRejeitar('coordenada negativa', e => (e.vertices[2].y = '-1'));
deveRejeitar('coordenada com 3 casas decimais', e => (e.vertices[2].x = '3.125'));
deveRejeitar('coordenada não numérica', e => (e.vertices[2].x = 'abc'));
deveRejeitar('depósito inexistente', e => (e.depositoId = 'Z'));
deveRejeitar('formigas vazio', e => (e.formigas = ''));
deveRejeitar('formigas = 0', e => (e.formigas = '0'));
deveRejeitar('formigas = 101', e => (e.formigas = '101'));
deveRejeitar('formigas não inteiro (1,5)', e => (e.formigas = '1,5'));
deveRejeitar('iterações = 201', e => (e.iteracoes = '201'));
deveRejeitar('α = 5,1', e => (e.alpha = '5.1'));
deveRejeitar('β negativo', e => (e.beta = '-1'));
deveRejeitar('ρ = 91%', e => (e.rhoPercentual = '91'));
deveRejeitar('τ₀ = 0', e => (e.tau0 = '0'));
deveRejeitar('Q = 10.000,01', e => (e.Q = '10000.01'));
deveRejeitar('semente não inteira', e => (e.semente = '4.2'));
deveRejeitar('semente vazia', e => (e.semente = ''));