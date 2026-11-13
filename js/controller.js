export class Controlador {
    constructor(simulacao, aoAtualizar) {
        this.sim = simulacao;
        this.aoAtualizar = aoAtualizar;
        this.timer = null;
        this.atraso = 300;
    }

    get rodando() { return this.timer !== null; }

    executar() {
        if (this.rodando || this.sim.concluida) return;
        this.agendar();
        this.aoAtualizar();
    }

    agendar() {
        this.timer = setTimeout(() => {
        this.sim.passo();
        this.timer = null;
        if (!this.sim.concluida) this.agendar();
        this.aoAtualizar();
        }, this.atraso);
    }

    pausar() {
        clearTimeout(this.timer);
        this.timer = null;
        this.aoAtualizar();
    }

    avancar() {
        this.pausar();
        this.sim.passo();
        this.aoAtualizar();
    }

    reiniciar() {
        this.pausar();
        this.sim.reiniciar();
        this.aoAtualizar();
    }

    definirAtraso(ms) {
        this.atraso = ms
    }
}