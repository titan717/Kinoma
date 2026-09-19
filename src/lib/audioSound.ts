/**
 * Kinoma Cinematic Intro Sound Generator
 * Uses Web Audio API to synthesize a rich, memorable signature sound:
 * 1. Deep sub-bass punch (cinematic impact)
 * 2. Harmonic chord swell (warm, resonant brass-like synth)
 * 3. Crystal bell shimmer / ethereal harmonic sparkle
 * 
 * Works 100% offline with zero external audio assets or network requests.
 */

class KinomaAudioEngine {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playIntroSound(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master output gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, now);
      masterGain.connect(ctx.destination);

      // --- 1. SUB-BASS IMPACT (The deep "Ta" thump) ---
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      // Pitch drop: 80Hz down to 35Hz for punchy cinematic impact
      subOsc.frequency.setValueAtTime(95, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.9);

      subGain.gain.setValueAtTime(0.0, now);
      subGain.gain.linearRampToValueAtTime(0.9, now + 0.04);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(now);
      subOsc.stop(now + 1.8);

      // --- 2. CINEMATIC RESONANT SWELL (The "DUMMMM" chord) ---
      // Frequencies corresponding to D2, A2, D3, F#3 (A rich, majestic D-Major / Cinematic Anime Chord)
      const chordFrequencies = [73.42, 110.0, 146.83, 185.0, 220.0];
      chordFrequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Alternating triangle and sawtooth for warmth & texture
        osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + 0.08);

        // Lowpass sweep for rich opening bloom
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now + 0.08);
        filter.frequency.exponentialRampToValueAtTime(1600, now + 0.6);
        filter.frequency.exponentialRampToValueAtTime(250, now + 2.2);

        // Amplitude envelope: Quick rise, sustained resonance, smooth cinematic tail
        gain.gain.setValueAtTime(0.0, now + 0.08);
        gain.gain.linearRampToValueAtTime(0.22 / (idx + 1), now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(now + 0.08);
        osc.stop(now + 2.5);
      });

      // --- 3. CRYSTAL CELESTIAL SHIMMER (Anime Ethereal Sparkle) ---
      // Higher harmonic bells that chime in as the logo blooms
      const shimmerNotes = [587.33, 880.0, 1174.66, 1479.98]; // D5, A5, D6, F#6
      shimmerNotes.forEach((noteFreq, idx) => {
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(noteFreq, now + 0.25 + idx * 0.08);

        chimeGain.gain.setValueAtTime(0.0, now + 0.25 + idx * 0.08);
        chimeGain.gain.linearRampToValueAtTime(0.08, now + 0.32 + idx * 0.08);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8 + idx * 0.1);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(masterGain);

        chimeOsc.start(now + 0.25 + idx * 0.08);
        chimeOsc.stop(now + 2.2);
      });

    } catch (err) {
      console.warn('AudioContext playback warning:', err);
    }
  }
}

export const kinomaAudio = new KinomaAudioEngine();
