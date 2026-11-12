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

export function pheromoneMatrix(n, t0){
    const t = Array.from({length: n}, () => new Array(n).fill(t0))
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