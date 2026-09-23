/**
 * Kinoma signature intro sound.
 * A short anime-inspired chime/pluck ident generated entirely with Web Audio API.
 * No external audio asset or network request is required.
 */

class KinomaAudioEngine {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  public playIntroSound(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.28, now + 0.025);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
      master.connect(ctx.destination);

      // A tiny rising "anime title card" pluck: A4 → C#5 → E5 → A5.
      const notes = [
        { frequency: 440, start: 0.02, length: 0.55 },
        { frequency: 554.37, start: 0.16, length: 0.55 },
        { frequency: 659.25, start: 0.30, length: 0.62 },
        { frequency: 880, start: 0.46, length: 0.85 },
      ];

      notes.forEach(({ frequency, start, length }, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = index === 3 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(frequency, now + start);
        osc.detune.setValueAtTime(index % 2 === 0 ? -4 : 4, now + start);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now + start);
        filter.Q.setValueAtTime(0.8, now + start);

        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(index === 3 ? 0.30 : 0.20, now + start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        osc.start(now + start);
        osc.stop(now + start + length + 0.03);
      });

      // One soft sparkle after the final note gives Kinoma a recognizable finish.
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(1320, now + 0.66);
      sparkle.frequency.exponentialRampToValueAtTime(1760, now + 0.86);
      sparkleGain.gain.setValueAtTime(0.0001, now + 0.66);
      sparkleGain.gain.exponentialRampToValueAtTime(0.075, now + 0.69);
      sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
      sparkle.connect(sparkleGain);
      sparkleGain.connect(master);
      sparkle.start(now + 0.66);
      sparkle.stop(now + 1.3);
    } catch (err) {
      console.warn('Kinoma intro audio warning:', err);
    }
  }
}

export const kinomaAudio = new KinomaAudioEngine();
