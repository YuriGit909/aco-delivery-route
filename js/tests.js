import { createRng } from './rng.js';
import { distanceMatrix, pheromoneMatrix, routeLength } from './aco.js';

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
const d = distanceMatrix(vertices);

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
  const L = routeLength(rota, d);
  check(`${nome} = ${valor}`, approx(L, valor), `obtido ${L}`);
}

// ---------- Feromônio inicial ----------
secao('Etapa 1 – Matriz de feromônio');

const tau = pheromoneMatrix(4, 1);
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
  const rng = createRng(semente);
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