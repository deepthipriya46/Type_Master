// Web Audio API Mechanical Keyboard Sound Synthesizer
// Provides zero-latency, realistic mechanical switch acoustic feedback

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.switchType = 'blue'; // 'blue', 'brown', 'red', 'typewriter'
    this.volume = 0.5;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playKeySound(isSpace = false) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.connect(this.ctx.destination);

      if (this.switchType === 'blue') {
        // High crisp tactile click
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isSpace ? 1800 : 3400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

        const snapGain = this.ctx.createGain();
        snapGain.gain.setValueAtTime(0.8, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(snapGain);
        snapGain.connect(gain);
        osc.start(now);
        osc.stop(now + 0.05);

        // Low bottom out thock
        const thock = this.ctx.createOscillator();
        thock.type = 'sine';
        thock.frequency.setValueAtTime(260, now);
        thock.frequency.exponentialRampToValueAtTime(80, now + 0.07);

        const thockGain = this.ctx.createGain();
        thockGain.gain.setValueAtTime(0.5, now);
        thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        thock.connect(thockGain);
        thockGain.connect(gain);
        thock.start(now);
        thock.stop(now + 0.08);

      } else if (this.switchType === 'red') {
        // Smooth linear soft thock
        const thock = this.ctx.createOscillator();
        thock.type = 'sine';
        thock.frequency.setValueAtTime(isSpace ? 190 : 240, now);
        thock.frequency.exponentialRampToValueAtTime(70, now + 0.06);

        const thockGain = this.ctx.createGain();
        thockGain.gain.setValueAtTime(0.6, now);
        thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        thock.connect(thockGain);
        thockGain.connect(gain);
        thock.start(now);
        thock.stop(now + 0.07);

      } else if (this.switchType === 'typewriter') {
        // Metallic snap + hammer strike
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isSpace ? 900 : 2200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

        const snapGain = this.ctx.createGain();
        snapGain.gain.setValueAtTime(0.9, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(snapGain);
        snapGain.connect(gain);
        osc.start(now);
        osc.stop(now + 0.06);
      } else {
        // Brown (tactile bump)
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isSpace ? 420 : 680, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

        const bGain = this.ctx.createGain();
        bGain.gain.setValueAtTime(0.5, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(bGain);
        bGain.connect(gain);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch {
      // AudioContext policy catch
    }
  }

  playErrorSound() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.12);
      gain.gain.setValueAtTime(this.volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // audio error failover
    }
  }

  playCompleteChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, High C
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      });
    } catch {
      // audio error failover
    }
  }
}

export const soundSynth = new SoundSynthesizer();
