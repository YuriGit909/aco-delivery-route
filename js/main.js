import { Simulacao } from './simulation.js';
import { Controlador } from './controller.js';
import { validarEntrada } from './validation.js';

const $ = id => document.getElementById(id);

// Cenario inicial
let linhas = [
    { id: 'A', x: '500', y: '500' }, { id: 'B', x: '150', y: '200' },
    { id: 'C', x: '820', y: '150' }, { id: 'D', x: '900', y: '600' },
    { id: 'E', x: '650', y: '880' }, { id: 'F', x: '250', y: '800' },
    { id: 'G', x: '80',  y: '480' }, { id: 'H', x: '400', y: '120' },
];

let sim = null, ctrl = null;
let pendente = false;

function criarInput(k, campo) {
    const input = document.createElement('input');
    input.value = linhas[k][campo]; 
    input.inputMode = campo === 'id' ? 'text' : 'decimal';
    input.addEventListener('input', () => {
        linhas[k][campo] = input.value;
        if (campo === 'id') atualizarSelectDeposito();
        marcarAlterado();
    });
    return input;
}

function renderTabelaVertices() {
    const tbody = $('tabelaVertices');
    tbody.replaceChildren();
    linhas.forEach((_, k) => {
        const tr = document.createElement('tr');
        for (const campo of ['id', 'x', 'y']) {
            const td = document.createElement('td');
            td.appendChild(criarInput(k, campo));
            tr.appendChild(td);
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Remover';
        btn.disabled = linhas.length <= 4;
        btn.onclick = () => { linhas.splice(k, 1); renderTabelaVertices(); marcarAlterado(); };
        const td = document.createElement('td');
        td.appendChild(btn);
        tr.appendChild(td);
        tbody.appendChild(tr);
    });
    $('btnAdicionar').disabled = linhas.length >= 12;
    atualizarSelectDeposito();
}

function atualizarSelectDeposito() {
    const select = $('deposito');
    const anterior = select.value;
    select.replaceChildren();
    for (const { id } of linhas) {
        if (id.trim() === '') continue;
        const opt = document.createElement('option');
        opt.value = opt.textContent = id.trim();
        select.appendChild(opt);
    }
    if ([...select.options].some(o => o.value === anterior)) select.value = anterior;
}

function proximoIdLivre() {
    const usados = new Set(linhas.map(l => l.id.trim().toUpperCase()));
    for (let c = 65; c <= 90; c++) {
        const id = String.fromCharCode(c);
        if (!usados.has(id)) return id;
    }
    return '';
}

function lerFormulario() {
    return {
        vertices: linhas,
        depositoId: $('deposito').value,
        formigas: $('formigas').value, iteracoes: $('iteracoes').value,
        alpha: $('alpha').value, beta: $('beta').value,
        rhoPercentual: $('rho').value, tau0: $('tau0').value,
        Q: $('Q').value, semente: $('semente').value,
    };
}

function mostrarErros(erros) {
    $('listaErros').replaceChildren(...erros.map(msg => {
        const li = document.createElement('li');
        li.textContent = msg;
        return li;
    }));
}

function marcarAlterado() {
    if (ctrl) ctrl.pausar();
    pendente = true;
    mostrarErros(validarEntrada(lerFormulario()).erros);
    atualizarTela();
}

function aplicarConfiguracao() {
    if (ctrl) ctrl.pausar();
    const { valido, erros, params } = validarEntrada(lerFormulario());
    mostrarErros(erros);
    if (!valido) {
        sim = ctrl = null;
    } else {
        sim = new Simulacao(params);
        ctrl = new Controlador(sim, atualizarTela);
        ctrl.definirAtraso(Number($('velocidade').value));
        pendente = false;
    }
    atualizarTela();
}

function atualizarTela() {
    const pronto = sim && !pendente;
    $('btnExecutar').disabled = !pronto || ctrl.rodando || sim.concluida;
    $('btnAvancar').disabled = !pronto || sim.concluida;
    $('btnPausar').disabled = !pronto || !ctrl.rodando;
    $('avisoPendente').hidden = !pendente;
    if (!sim) { 
        $('status').textContent = 'Corrija os erros e clique em Reiniciar.'; 
        return; 
    }
    const mg = sim.melhorGlobal;
    const nome = rota => rota.map(i => sim.params.vertices[i].id).join(' → ');
    $('status').textContent = `Iteração: ${sim.iteracao}/${sim.params.iteracoes}\n` +
    `Melhor: ${mg ? `${nome(mg.rota)} = ${mg.comprimento.toFixed(2)}` : 'ainda não calculada'}`;
}

$('btnAdicionar').onclick = () => {
    linhas.push({ id: proximoIdLivre(), x: '', y: '' });
    renderTabelaVertices();
    marcarAlterado();
};

$('btnInstanciaTeste').onclick = () => {
    linhas = [
        { id: 'A', x: '0', y: '0' }, { id: 'B', x: '3', y: '0' },
        { id: 'C', x: '3', y: '4' }, { id: 'D', x: '0', y: '4' },
    ];
    renderTabelaVertices();
    $('deposito').value = 'A';
    marcarAlterado();
};

for (const id of ['deposito', 'formigas', 'iteracoes', 'alpha', 'beta', 'rho', 'tau0', 'Q', 'semente']) {
    $(id).addEventListener('input', marcarAlterado);
}

$('btnExecutar').onclick = () => ctrl.executar();
$('btnPausar').onclick = () => ctrl.pausar();
$('btnAvancar').onclick = () => ctrl.avancar();
$('btnReiniciar').onclick = aplicarConfiguracao;
$('velocidade').oninput = e => ctrl?.definirAtraso(Number(e.target.value));

renderTabelaVertices();
aplicarConfiguracao();