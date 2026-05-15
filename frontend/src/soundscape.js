class Soundscape {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.osc = null;
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0.1;
    }

    // Create a low-frequency corporate hum
    startHum() {
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'sine';
        this.osc.frequency.setValueAtTime(60, this.ctx.currentTime);
        this.osc.connect(this.gain);
        this.osc.start();
    }

    // Trigger a glitch sound effect
    triggerGlitch() {
        const noise = this.ctx.createOscillator();
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(Math.random() * 1000 + 200, this.ctx.currentTime);
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        
        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start();
        noise.stop(this.ctx.currentTime + 0.2);
    }

    // Shift hum frequency based on tension
    updateTension(level) {
        if (this.osc) {
            const freq = 60 + (level * 20);
            this.osc.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + 1);
        }
    }
}

window.Sfx = new Soundscape();
