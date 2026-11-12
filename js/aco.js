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