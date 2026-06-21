import { useRef, useCallback } from 'react';

/**
 * useSound
 *
 * Manages two audio tracks via the Web Audio API (no external library):
 *   1. "spin"  — a repeating tick/click played while the wheel is spinning
 *   2. "win"   — a triumphant jingle played once when the wheel stops
 *
 * Both sounds are synthesized procedurally so there are no audio file assets
 * to host. The spin sound is a rapid series of short clicks, and the win
 * sound is a rising major arpeggio.
 *
 * Assumption: AudioContext is unlocked by the user gesture that triggers the
 * spin (browser autoplay policy). We create the context lazily on first play.
 */
export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Lazily create (or resume) an AudioContext. */
  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }

  /** Play a single short click/tick burst. */
  function playTick(ctx: AudioContext, time: number, freq = 900) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /** Start looping tick sounds (accelerates feel: fixed 100ms interval). */
  const startSpinSound = useCallback(() => {
    stopSpinSound();
    const ctx = getCtx();
    let i = 0;
    tickIntervalRef.current = setInterval(() => {
      playTick(ctx, ctx.currentTime, 700 + (i % 3) * 100);
      i++;
    }, 90);
  }, []);

  /** Stop the tick loop. */
  const stopSpinSound = useCallback(() => {
    if (tickIntervalRef.current !== null) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  /**
   * Play a triumphant ascending arpeggio (C major: C5-E5-G5-C6).
   * Called exactly when the wheel animation finishes.
   */
  const playWinSound = useCallback(() => {
    const ctx = getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      const startT = ctx.currentTime + idx * 0.16;
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0, startT);
      gain.gain.linearRampToValueAtTime(0.35, startT + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.55);
      osc.start(startT);
      osc.stop(startT + 0.6);
    });

    // Bonus: a short drum "hit" for excitement
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    src.connect(gainNode);
    gainNode.connect(ctx.destination);
    src.start(ctx.currentTime + notes.length * 0.16);
  }, []);

  return { startSpinSound, stopSpinSound, playWinSound };
}
