import { criarRng } from './rng.js';
import { matrizDistancias, matrizFeromonio, construirRota, atualizarFeromonio } from './aco.js';

export class Simulacao {
    constructor(params) {
        this.params = params;
        this.d = matrizDistancias(params.vertices);
        this.reiniciar();
    }

    reiniciar() {
        this.tau = matrizFeromonio(this.d.length, this.params.tau0);
        this.rng = criarRng(this.params.semente);
        this.iteracao = 0;
        this.historico = [];
        this.melhorGlobal = null; // null = "ainda não calculada"
    }

    get concluida() {
        return this.iteracao >= this.params.iteracoes;
    }

    passo() {
    if (this.concluida) {
        return null
    };
    const { deposito, formigas, alpha, beta, rho, Q } = this.params;
    const resultados = [];
    for (let k = 0; k < formigas; k++) {
        resultados.push(construirRota(deposito, this.tau, this.d, alpha, beta, this.rng));
    }
    let idxMelhor = 0, soma = 0;
    resultados.forEach((r, k) => {
        soma += r.comprimento;
        if (r.comprimento < resultados[idxMelhor].comprimento) idxMelhor = k;
    });
    const melhorIt = resultados[idxMelhor];
    if (!this.melhorGlobal || melhorIt.comprimento < this.melhorGlobal.comprimento) {
        this.melhorGlobal = { rota: melhorIt.rota, comprimento: melhorIt.comprimento, iteracao: this.iteracao + 1 };
    }
    const { tau, log } = atualizarFeromonio(this.tau, resultados, rho, Q);
    this.tau = tau;
    this.iteracao++;
    const registro = {
        iteracao: this.iteracao,
        rotas: resultados.map(r => ({ rota: r.rota, comprimento: r.comprimento })),
        melhorIteracao: { rota: melhorIt.rota, comprimento: melhorIt.comprimento, formiga: idxMelhor },
        construcaoDetalhada: melhorIt.passos,
        media: soma / formigas,
        melhorGlobal: { ...this.melhorGlobal },
        logFeromonio: log,
        tau,
    };
        this.historico.push(registro);
        return registro;
    }
}