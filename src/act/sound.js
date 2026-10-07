export function createSoundFx() {
  let context;
  let master;

  function ensureContext() {
    if (context) return context;
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = 0.42;
      master.connect(context.destination);
      return context;
    } catch {
      context = null;
      master = null;
      return null;
    }
  }

  function tone({ from, to, duration, type = 'triangle', volume = 0.07 }) {
    const audio = ensureContext();
    if (!audio || audio.state === 'closed') return;

    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    try {
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(from, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + duration);
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.linearRampToValueAtTime(volume, now + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.01);
    } catch {
      // Audio is optional; a browser's audio policy must never block a run.
    }
  }

  return {
    async unlock() {
      const audio = ensureContext();
      try {
        if (audio?.state === 'suspended') await audio.resume();
      } catch {
        // Keep the game playable when audio is unavailable or denied.
      }
    },
    fire() {
      tone({ from: 720, to: 310, duration: 0.065, type: 'triangle', volume: 0.2 });
    },
    hit() {
      tone({ from: 340, to: 560, duration: 0.09, type: 'square', volume: 0.32 });
    },
    damage() {
      tone({ from: 180, to: 58, duration: 0.22, type: 'sawtooth', volume: 0.4 });
    },
  };
}
