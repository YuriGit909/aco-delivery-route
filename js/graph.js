const NS = 'http://www.w3.org/2000/svg';
const LARGURA = 600, ALTURA = 600, MARGEM = 45;
const ESP_MIN = 0.5, ESP_MAX = 10;   // espessura das arestas (px)
const OPAC_MIN = 0.15;

function criar(tag, attrs = {}) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

// Formatação só para exibição
export function formatar(v) {
    if (v !== 0 && Math.abs(v) < 1e-4) return v.toExponential(3);
    return v.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
}

function maiorFeromonio(tau) {
    let m = 0;
    for (let i = 0; i < tau.length; i++)
        for (let j = i + 1; j < tau.length; j++) m = Math.max(m, tau[i][j]);
    return m;
}

export class VisualizacaoGrafo {
    constructor({ svg, legenda, painelAresta, avisoEscala }) {
        Object.assign(this, { svg, legenda, painelAresta, avisoEscala });
        this.svg.setAttribute('viewBox', `0 0 ${LARGURA} ${ALTURA}`);
        this.selecionada = null; // [i, j] da aresta clicada
    }
    limparSelecao() { this.selecionada = null; }

    criarProjecao(vertices) {
        const xs = vertices.map(v => v.x), ys = vertices.map(v => v.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const span = Math.max(maxX - minX, maxY - minY) || 1;
        const s = (LARGURA - 2 * MARGEM) / span;
        const offX = (LARGURA - 2 * MARGEM - (maxX - minX) * s) / 2;
        const offY = (ALTURA - 2 * MARGEM - (maxY - minY) * s) / 2;
        return v => ({
            px: MARGEM + offX + (v.x - minX) * s,
            py: ALTURA - MARGEM - offY - (v.y - minY) * s,
        });
    }

    calcularEscala(sim) {
        let escala = sim.params.tau0, anterior = escala;
        for (const reg of sim.historico) {
            anterior = escala;
            escala = Math.max(escala, maiorFeromonio(reg.tau));
        }
        return { escala, anterior, mudou: sim.historico.length > 0 && escala !== anterior };
    }

    render(sim) {
        this.svg.replaceChildren();
        if (!sim) {
            this.legenda.textContent = '';
            this.painelAresta.textContent = 'Sem configuração válida.';
            this.avisoEscala.hidden = true;
            return;
        }
        const { vertices, deposito } = sim.params;
        const n = vertices.length;
        const proj = this.criarProjecao(vertices);
        const pos = vertices.map(proj);
        const { escala, anterior, mudou } = this.calcularEscala(sim);
        const gArestas = criar('g');
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const frac = sim.tau[i][j] / escala;
                const selecionada = this.selecionada?.[0] === i && this.selecionada?.[1] === j;
                const coords = { x1: pos[i].px, y1: pos[i].py, x2: pos[j].px, y2: pos[j].py };
                gArestas.appendChild(criar('line', {
                    ...coords,
                    class: selecionada ? 'aresta selecionada' : 'aresta',
                    'stroke-width': ESP_MIN + frac * (ESP_MAX - ESP_MIN),
                    'stroke-opacity': OPAC_MIN + frac * (1 - OPAC_MIN),
                }));
                const alvo = criar('line', { ...coords, class: 'aresta-alvo' });
                const titulo = criar('title');
                titulo.textContent = `${vertices[i].id}–${vertices[j].id}\n` +
                    `distância: ${formatar(sim.d[i][j])}\nferomônio: ${formatar(sim.tau[i][j])}`;
                alvo.appendChild(titulo);
                alvo.addEventListener('click', () => {
                    this.selecionada = [i, j];
                    this.render(sim);
                });
                gArestas.appendChild(alvo);
            }
        }
        this.svg.appendChild(gArestas);
        if (sim.melhorGlobal) {
            const gRota = criar('g');
            const rota = sim.melhorGlobal.rota;
            for (let k = 0; k < rota.length - 1; k++) {
                const a = pos[rota[k]], b = pos[rota[k + 1]];
                gRota.appendChild(criar('line', {
                    x1: a.px, y1: a.py, x2: b.px, y2: b.py, class: 'melhor-rota',
                }));
            }
            this.svg.appendChild(gRota);
        }
        const gVertices = criar('g');
        vertices.forEach((v, k) => {
            const { px, py } = pos[k];
            const forma = k === deposito
                ? criar('rect', { x: px - 13, y: py - 13, width: 26, height: 26, class: 'vertice deposito' })
                : criar('circle', { cx: px, cy: py, r: 13, class: 'vertice' });
            const titulo = criar('title');
            titulo.textContent = `${v.id}${k === deposito ? ' (depósito)' : ''}: (${formatar(v.x)}; ${formatar(v.y)})`;
            forma.appendChild(titulo);
            const rotulo = criar('text', { x: px, y: py, class: 'rotulo' });
            rotulo.textContent = v.id;
            gVertices.append(forma, rotulo);
        });
        this.svg.appendChild(gVertices);
        this.avisoEscala.hidden = !mudou;
        if (mudou) {
            this.avisoEscala.textContent =
                `Escala visual ajustada na iteração ${sim.iteracao}: a espessura máxima passou a ` +
                `representar τ = ${formatar(escala)} (antes ${formatar(anterior)}). ` +
                `Arestas podem parecer mais finas sem ter perdido feromônio; consulte os valores numéricos.`;
        }
        this.renderLegenda(escala);
        this.renderPainelAresta(sim);
    }

    renderLegenda(escala) {
        this.legenda.innerHTML = `
      <div><span class="amostra aresta-fina"></span><span class="amostra aresta-grossa"></span>
        Espessura e opacidade proporcionais ao feromônio (escala de 0 a <b class="valor-escala"></b>)</div>
      <div><span class="amostra rota"></span> Melhor rota acumulada</div>
      <div><span class="amostra deposito"></span> Depósito &nbsp; <span class="amostra vertice"></span> Ponto de entrega</div>
      <div>Passe o cursor ou clique em uma aresta para consultar distância e feromônio.</div>`;
        this.legenda.querySelector('.valor-escala').textContent = formatar(escala);
    }

    renderPainelAresta(sim) {
        if (!this.selecionada) {
            this.painelAresta.textContent = 'Clique em uma aresta para ver seus valores.';
            return;
        }
        const [i, j] = this.selecionada;
        const { vertices } = sim.params;
        const linhas = [
            `Aresta ${vertices[i].id}–${vertices[j].id}`,
            `Distância (custo fixo): ${formatar(sim.d[i][j])}`,
            `Feromônio atual: ${formatar(sim.tau[i][j])}`,
        ];
        const ultimo = sim.historico.at(-1);
        if (ultimo) {
            const e = ultimo.logFeromonio.find(e => e.i === i && e.j === j);
            linhas.push(
                `Na iteração ${ultimo.iteracao}: anterior ${formatar(e.anterior)}; ` +
                `após evaporação ${formatar(e.aposEvaporacao)}; depósito ${formatar(e.deposito)}; ` +
                `final ${formatar(e.final)}${e.pisoAplicado ? ' (piso de 10⁻¹² aplicado)' : ''}`);
        } else {
            linhas.push('Iteração 0: feromônio inicial τ₀, ainda sem atualização.');
        }
        this.painelAresta.textContent = linhas.join('\n');
    }
}