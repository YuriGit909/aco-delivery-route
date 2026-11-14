import { formatar } from './graph.js';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const nomeRota = (rota, v) => rota.map(i => v[i].id).join(' → ');
const NAO_CALCULADA = 'ainda não calculada';

function criarLinhaTabela(celulas, classe = '') {
    const tr = document.createElement('tr');
    if (classe) tr.className = classe;
    for (const c of celulas) {
        const td = document.createElement('td');
        td.textContent = c;
        tr.appendChild(td);
    }
    return tr;
}

export function renderMetricas(sim, ctrl) {
    const dl = $('listaMetricas');
    if (!sim) { 
        dl.replaceChildren(); 
        return; 
    }
    const v = sim.params.vertices;
    const ultimo = sim.historico.at(-1);
    const mg = sim.melhorGlobal;
    const estado = sim.concluida ? 'concluída' : ctrl.rodando ? 'executando' : 'pausada';
    const itens = [
        ['Estado', estado],
        ['Iteração atual', `${sim.iteracao} de ${sim.params.iteracoes}`],
        ['Melhor rota acumulada', mg ? nomeRota(mg.rota, v) : NAO_CALCULADA],
        ['Melhor distância acumulada', mg ? `${formatar(mg.comprimento)} (encontrada na iteração ${mg.iteracao})` : NAO_CALCULADA],
        ['Menor distância da iteração', ultimo ? formatar(ultimo.melhorIteracao.comprimento) : NAO_CALCULADA],
        ['Média das distâncias da iteração', ultimo ? formatar(ultimo.media) : NAO_CALCULADA],
    ];
    dl.replaceChildren(...itens.flatMap(([termo, valor]) => {
        const dt = document.createElement('dt'); dt.textContent = termo;
        const dd = document.createElement('dd'); dd.textContent = valor;
        return [dt, dd];
    }));
}

export function renderHistorico(sim) {
    const tbody = $('tabelaHistorico');
    if (!sim) { tbody.replaceChildren(); desenharGrafico(null); return; }

    const v = sim.params.vertices;
    const linhas = [criarLinhaTabela(['0', '—', '—', NAO_CALCULADA,
        `estado inicial: τ = ${formatar(sim.params.tau0)} em todas as arestas`])];
    for (const r of sim.historico) {
        linhas.push(criarLinhaTabela([
            r.iteracao, formatar(r.melhorIteracao.comprimento), formatar(r.media),
            formatar(r.melhorGlobal.comprimento), nomeRota(r.melhorIteracao.rota, v),
        ]));
    }
    tbody.replaceChildren(...linhas);
    desenharGrafico(sim.historico);
}

function desenharGrafico(historico) {
    const svg = $('graficoHistorico');
    const W = 600, H = 220, M = { esq: 60, dir: 15, topo: 15, base: 30 };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.replaceChildren();
    const texto = (x, y, conteudo, ancora = 'start') => {
        const t = document.createElementNS(NS, 'text');
        Object.entries({ x, y, 'text-anchor': ancora, class: 'texto-grafico' })
            .forEach(([k, val]) => t.setAttribute(k, val));
        t.textContent = conteudo;
        svg.appendChild(t);
    };
    if (!historico || historico.length === 0) {
        texto(W / 2, H / 2, 'Nenhuma iteração concluída', 'middle');
        return;
    }
    const series = [
        { classe: 'serie-menor', valores: historico.map(r => r.melhorIteracao.comprimento) },
        { classe: 'serie-media', valores: historico.map(r => r.media) },
        { classe: 'serie-global', valores: historico.map(r => r.melhorGlobal.comprimento) },
    ];
    const todos = series.flatMap(s => s.valores);
    let min = Math.min(...todos), max = Math.max(...todos);
    if (min === max) { 
        min -= 1; max += 1; 
    }
    const n = historico.length;
    const larguraUtil = W - M.esq - M.dir, alturaUtil = H - M.topo - M.base;
    const px = k => M.esq + (n === 1 ? larguraUtil / 2 : (k * larguraUtil) / (n - 1));
    const py = val => H - M.base - ((val - min) / (max - min)) * alturaUtil;
    const eixo = document.createElementNS(NS, 'polyline');
    eixo.setAttribute('points', `${M.esq},${M.topo} ${M.esq},${H - M.base} ${W - M.dir},${H - M.base}`);
    eixo.setAttribute('class', 'eixo');
    svg.appendChild(eixo);
    texto(M.esq - 5, M.topo + 4, formatar(Number(max.toFixed(2))), 'end');
    texto(M.esq - 5, H - M.base, formatar(Number(min.toFixed(2))), 'end');
    texto(M.esq, H - 8, 'iteração 1');
    texto(W - M.dir, H - 8, `iteração ${n}`, 'end');

    for (const s of series) {
        const linha = document.createElementNS(NS, 'polyline');
        linha.setAttribute('points', s.valores.map((val, k) => `${px(k)},${py(val)}`).join(' '));
        linha.setAttribute('class', `serie ${s.classe}`);
        svg.appendChild(linha);
    }
}

export function renderLogs(sim) {
    const seletor = $('iteracaoLog');
    const escolhaAnterior = seletor.value || 'ultima';
    const opcoes = [['ultima', 'Última iteração concluída']];
    if (sim) for (const r of sim.historico) opcoes.push([String(r.iteracao), `Iteração ${r.iteracao}`]);
    seletor.replaceChildren(...opcoes.map(([valor, rotulo]) => {
        const o = document.createElement('option');
        o.value = valor; o.textContent = rotulo;
        return o;
    }));
    seletor.value = opcoes.some(([valor]) => valor === escolhaAnterior) ? escolhaAnterior : 'ultima';

    const reg = !sim ? null
        : seletor.value === 'ultima' ? sim.historico.at(-1)
            : sim.historico[Number(seletor.value) - 1];
    if (!reg) {
        const msg = 'Nenhuma iteração concluída ainda.';
        $('logConstrucao').textContent = msg;
        $('logRotas').textContent = msg;
        $('logFeromonio').replaceChildren();
        return;
    }
    const v = sim.params.vertices;
    $('logConstrucao').textContent = textoConstrucao(reg, v);
    $('logRotas').textContent = textoRotas(reg, v, sim.params.Q);
    $('logFeromonio').replaceChildren(...reg.logFeromonio.map(e => criarLinhaTabela([
        `${v[e.i].id}–${v[e.j].id}`, formatar(e.anterior), formatar(e.aposEvaporacao),
        formatar(e.deposito), formatar(e.final) + (e.pisoAplicado ? ' (piso aplicado)' : ''),
    ], e.deposito > 0 ? 'recebeu-deposito' : '')));
}

function textoConstrucao(reg, v) {
    const linhas = [`Formiga ${reg.melhorIteracao.formiga + 1} (melhor rota da iteração ${reg.iteracao})`, ''];
    reg.construcaoDetalhada.forEach((passo, k) => {
        linhas.push(`Passo ${k + 1} – vértice atual: ${v[passo.atual].id}`);
        let acumulado = 0;
        for (const c of passo.candidatos) {
            const inicio = acumulado;
            acumulado += c.p;
            linhas.push(`   ${v[c.j].id}: τ = ${formatar(c.tau)}; d = ${formatar(c.dist)}; ` +
                `w = ${formatar(c.w)}; p = ${formatar(c.p)} ` +
                `[faixa ${formatar(inicio)} a ${formatar(acumulado)})`);
        }
        linhas.push(`   Sorteio: r = ${formatar(passo.r)} → escolhido ${v[passo.escolhido].id}`, '');
    });
    const rota = reg.melhorIteracao.rota;
    linhas.push(`Retorno obrigatório ao depósito: ${v[rota.at(-2)].id} → ${v[rota.at(-1)].id}`);
    linhas.push(`Rota completa: ${nomeRota(rota, v)}`);
    linhas.push(`Comprimento: ${formatar(reg.melhorIteracao.comprimento)}`);
    return linhas.join('\n');
}

function textoRotas(reg, v, Q) {
    return reg.rotas.map((r, k) =>
        `${k === reg.melhorIteracao.formiga ? '★' : ' '} Formiga ${k + 1}: ${nomeRota(r.rota, v)}` +
        ` | L = ${formatar(r.comprimento)} | depósito Q/L = ${formatar(Q / r.comprimento)}`
    ).join('\n') + '\n\n★ = melhor rota da iteração';
}