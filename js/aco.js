export const TAU_MIN = 1e-12

export function distanceMatrix(vertices){
    const n = vertices.length
    const d = Array.from({length: n}, () => new Array(n).fill(0))
    for(let i = 0; i < n; i++){
        for(let j = i + 1; j < n; j++){
            const dx = vertices[i].x - vertices[j].x
            const dy = vertices[i].y - vertices[j].y
            d[i][j] = d[j][i] = Math.sqrt(dx**2 + dy**2)
        }
    }
    return d
}

export function pheromoneMatrix(n, tau){
    const t = Array.from({length: n}, () => new Array(n).fill(tau))
    for(let i = 0; i < n; i++){
        t[i][i] = 0
    }
    return t
}

export function updatePheromones(tau, resultados, rho, Q) {
    const n = tau.length
    const deposito = Array.from({ length: n }, () => new Array(n).fill(0))
    for (const { rota, comprimento } of resultados) {
        const contribuicao = Q / comprimento
        for (let k = 0; k < rota.length - 1; k++) {
            const i = Math.min(rota[k], rota[k + 1])
            const j = Math.max(rota[k], rota[k + 1])
            deposito[i][j] += contribuicao
        }
    }
    const novo = Array.from({ length: n }, () => new Array(n).fill(0))
    const log = []
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const anterior = tau[i][j]
            const aposEvaporacao = (1 - rho) * anterior
            const depositoTotal = deposito[i][j]
            const semPiso = aposEvaporacao + depositoTotal
            const final = Math.max(semPiso, TAU_MIN)
            novo[i][j] = novo[j][i] = final
            log.push({ i, j, anterior, aposEvaporacao, deposito: depositoTotal, final, pisoAplicado: semPiso < TAU_MIN })
        }
    }
    return { tau: novo, log }
}

export function routeLength(route, d){
    let L = 0
    for(let k = 0; k < route.length - 1; k++){
        L += d[route[k]][route[k + 1]]
    }
    return L
}

export function computeProbabilities(atual, visitado, tau, d, alpha, beta) {
    const candidatos = [];
    let soma = 0;
    for (let j = 0; j < d.length; j++) {
    if (visitado[j]){
        continue
    }
    const w = Math.pow(tau[atual][j], alpha) * Math.pow(1 / d[atual][j], beta)
    candidatos.push({ j, tau: tau[atual][j], dist: d[atual][j], w, p: 0 })
    soma += w
    }
    if (!(soma > 0) || !Number.isFinite(soma)) {
        candidatos.forEach(c => (c.p = 1 / candidatos.length))
    } else {
        candidatos.forEach(c => (c.p = c.w / soma))
    }
    return candidatos
}

export function rouletteSelect(candidatos, rng) {
    const r = rng();
    let acumulado = 0;
    for (const c of candidatos) {
        acumulado += c.p;
        if (r < acumulado){ 
            return {escolhido: c.j, r};
        }
    }
    return {escolhido: candidatos[candidatos.length - 1].j, r};
}

export function constructRoute(deposito, tau, d, alpha, beta, rng) {
    const n = d.length
    const visitado = new Array(n).fill(false)
    const rota = [deposito]
    const passos = []
    visitado[deposito] = true
    let atual = deposito
    for (let passo = 0; passo < n - 1; passo++) {
        const candidatos = computeProbabilities(atual, visitado, tau, d, alpha, beta)
        const {escolhido, r} = rouletteSelect(candidatos, rng)
        passos.push({atual, candidatos, r, escolhido})
        visitado[escolhido] = true;
        rota.push(escolhido)
        atual = escolhido
    }
    rota.push(deposito)
    return {rota, comprimento: routeLength(rota, d), passos}
}