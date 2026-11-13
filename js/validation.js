const fmt = v => v.toLocaleString('pt-BR');

function lerNumero(texto, rotulo, { min = null, max = null, inteiro = false, casas = null }, erros) {
    const t = String(texto ?? '').trim();
    if (t === '') {
        erros.push(`${rotulo}: campo obrigatório.`);
        return null;
    }
    const formato = inteiro ? /^-?\d+$/ : /^-?\d+(\.\d+)?$/;
    if (!formato.test(t)) {
        erros.push(`${rotulo}: informe um número${inteiro ? ' inteiro' : ''} válido (use ponto como separador decimal).`);
        return null;
    }
    const decimais = t.split('.')[1];
    if (casas !== null && decimais && decimais.length > casas) {
        erros.push(`${rotulo}: use no máximo ${casas} casas decimais.`);
        return null;
    }
    const v = Number(t);
    if (!Number.isFinite(v) || (inteiro && !Number.isSafeInteger(v))) {
        erros.push(`${rotulo}: valor numérico inválido.`);
        return null;
    }
    if ((min !== null && v < min) || (max !== null && v > max)) {
        erros.push(`${rotulo}: deve estar entre ${fmt(min)} e ${fmt(max)}.`);
        return null;
    }
    return v;
    }

export function validarEntrada(entrada) {
    const erros = [];
    const linhas = entrada.vertices;
    if (linhas.length < 4 || linhas.length > 12) {
        erros.push(`Vértices: são necessários entre 4 e 12 (atualmente ${linhas.length}).`);
    }
    const vertices = [];
    const idsVistos = new Map(), coordsVistas = new Map();
    linhas.forEach((linha, k) => {
        const nome = `Vértice ${k + 1}`;
        const id = String(linha.id ?? '').trim();
        if (id === '') erros.push(`${nome}: identificador obrigatório.`);
        else if (idsVistos.has(id)) erros.push(`Identificador "${id}" repetido (vértices ${idsVistos.get(id)} e ${k + 1}).`);
        else idsVistos.set(id, k + 1);
        const x = lerNumero(linha.x, `${nome} (${id || '?'}) – x`, { min: 0, max: 1000, casas: 2 }, erros);
        const y = lerNumero(linha.y, `${nome} (${id || '?'}) – y`, { min: 0, max: 1000, casas: 2 }, erros);
        if (x !== null && y !== null) {
        const chave = `${x};${y}`;
        if (coordsVistas.has(chave)) {
            erros.push(`Coordenadas (${fmt(x)}; ${fmt(y)}) repetidas nos vértices ` + `${coordsVistas.get(chave)} e ${k + 1}: isso produziria distância zero.`);
        } else coordsVistas.set(chave, k + 1);
        }
        vertices.push({ id, x, y });
    });
    const deposito = vertices.findIndex(v => v.id !== '' && v.id === String(entrada.depositoId ?? '').trim());
    if (deposito === -1) erros.push('Depósito: selecione um dos vértices cadastrados.');
    const formigas = lerNumero(entrada.formigas, 'Número de formigas', { min: 1, max: 100, inteiro: true }, erros);
    const iteracoes = lerNumero(entrada.iteracoes, 'Número de iterações', { min: 1, max: 200, inteiro: true }, erros);
    const alpha = lerNumero(entrada.alpha, 'Influência do feromônio (α)', { min: 0, max: 5 }, erros);
    const beta = lerNumero(entrada.beta, 'Influência da distância (β)', { min: 0, max: 5 }, erros);
    const rhoPct = lerNumero(entrada.rhoPercentual, 'Taxa de evaporação (ρ, %)', { min: 0, max: 90 }, erros);
    const tau0 = lerNumero(entrada.tau0, 'Feromônio inicial (τ₀)', { min: 0.01, max: 100 }, erros);
    const Q = lerNumero(entrada.Q, 'Constante de depósito (Q)', { min: 0.01, max: 10000 }, erros);
    const semente = lerNumero(entrada.semente, 'Semente aleatória', { inteiro: true }, erros);
    if (erros.length > 0) {    
        return { valido: false, erros, params: null };
    }
    return {
        valido: true,
        erros: [],
        params: { vertices, deposito, formigas, iteracoes, alpha, beta, rho: rhoPct / 100, tau0, Q, semente },
    };
    }