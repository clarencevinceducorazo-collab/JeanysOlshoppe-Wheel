import { useState, useRef, useCallback } from 'react';
import type { Participant, Prize, WinnerRecord } from '../types';
import { pickRandomEligible, markPersonAsWon } from '../utils/weightedRandom';
import { generateId } from '../utils/idGenerator';
import { useSound } from './useSound';
import confetti from 'canvas-confetti';

/**
 * useWheel
 *
 * Centralises all wheel spin logic:
 *  - Picks winner via pickRandomEligible() BEFORE animation starts (critical).
 *  - Calculates exact target rotation angle to land the pointer on the winner's segment.
 *  - Drives the canvas animation via requestAnimationFrame with a cubic-ease-out curve.
 *  - On finish: fires confetti, plays win sound, calls onSpinComplete callback.
 *
 * The hook exposes:
 *   rotation        — current canvas rotation in radians (for the draw loop)
 *   isSpinning      — guard flag
 *   triggerSpin()   — call with participants + prize to start a spin
 */

export interface SpinResult {
  winner: Participant;
  record: WinnerRecord;
  updatedParticipants: Participant[];
  updatedPrizes: Prize[];
}

interface UseWheelOptions {
  participants: Participant[];
  prizes: Prize[];
  onSpinComplete: (result: SpinResult) => void;
  onNoEligible: () => void;
}

// Cubic ease-out: fast start, dramatic slow-down at the end
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function useWheel({
  participants,
  prizes,
  onSpinComplete,
  onNoEligible,
}: UseWheelOptions) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const rotationRef = useRef(0); // mutable ref for RAF loop

  const { startSpinSound, stopSpinSound, playWinSound } = useSound();
  const rafRef = useRef<number | null>(null);

  /**
   * Fires a pink/gold confetti burst from the center of the viewport.
   */
  const fireConfetti = useCallback(() => {
    const colors = ['#FF8FAB', '#FFB3C1', '#E63950', '#FFD700', '#FFFFFF', '#C9184A'];
    confetti({
      particleCount: 180,
      spread: 90,
      origin: { y: 0.55, x: 0.5 },
      colors,
      startVelocity: 45,
      gravity: 0.9,
      scalar: 1.1,
    });
    // Second burst after small delay
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.45, x: 0.35 },
        colors,
        angle: 70,
      });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.45, x: 0.65 },
        colors,
        angle: 110,
      });
    }, 250);
  }, []);

  /**
   * Main spin trigger.
   * @param prizeIndex — index into the prizes array (the one being drawn)
   */
  const triggerSpin = useCallback(
    (prizeIndex: number) => {
      if (isSpinning) return;

      const prize = prizes[prizeIndex];
      if (!prize || prize.isDrawn) return;

      // ── 1. Pick winner FIRST (before any animation) ──────────────────
      const winner = pickRandomEligible(participants);
      if (winner === null) {
        onNoEligible();
        return;
      }
      // winner is definitely non-null past this point
      const safeWinner: Participant = winner;

      // ── 2. Calculate segment geometry ────────────────────────────────
      const segCount = participants.length;
      const segAngle = (2 * Math.PI) / segCount; // radians per segment

      // Find winner's segment index (its original position in participants array)
      const winnerIdx = participants.findIndex((p) => p.id === winner.id);

      // The wheel is drawn starting segment 0 at angle -π/2 (top of circle).
      // Pointer is at top (π/2 from positive X). Segment centre angle:
      //   segCentre = -π/2 + (idx + 0.5) * segAngle
      // We need that angle to equal -π/2 at the pointer (top).
      // So targetRot = -π/2 - segCentreAngle
      const segCentreAngle = -Math.PI / 2 + (winnerIdx + 0.5) * segAngle;
      const neededRot = -Math.PI / 2 - segCentreAngle; // angle at which wheel rotation puts winner at top

      // Add 15-20 full turns for extra excitement
      const fullTurns = Math.floor(Math.random() * 6) + 15; // 15..20 turns
      const currentRot = rotationRef.current % (2 * Math.PI);
      // Normalise so we always spin forward (positive direction)
      let delta = (neededRot - currentRot + 2 * Math.PI) % (2 * Math.PI);
      const totalRot = rotationRef.current + fullTurns * 2 * Math.PI + delta;

      // ── 3. Animate ───────────────────────────────────────────────────
      setIsSpinning(true);
      startSpinSound();

      const START_ROT = rotationRef.current;
      const TOTAL_DELTA = totalRot - START_ROT;
      const DURATION_MS = 6000 + Math.random() * 2000; // 6–8s
      const startTime = performance.now();

      function animate(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / DURATION_MS, 1);
        const eased = easeOut(progress);
        const currentAngle = START_ROT + TOTAL_DELTA * eased;

        rotationRef.current = currentAngle;
        setRotation(currentAngle);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          // ── 4. On finish ─────────────────────────────────────────────
          rotationRef.current = totalRot;
          setRotation(totalRot);
          setIsSpinning(false);
          stopSpinSound();
          playWinSound();
          fireConfetti();

          // Build updated state
          const updatedParticipants = markPersonAsWon(participants, safeWinner.name);
          const updatedPrizes = prizes.map((p, i) =>
            i === prizeIndex ? { ...p, isDrawn: true } : p
          );
          const record: WinnerRecord = {
            id: generateId(),
            participantName: safeWinner.name,
            entryId: safeWinner.id,
            prizeId: prize.id,
            prizeLabel: prize.label,
            itemName: prize.itemName,
            timestamp: new Date().toISOString(),
          };

          onSpinComplete({ winner: safeWinner, record, updatedParticipants, updatedPrizes });
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    },
    [isSpinning, participants, prizes, onSpinComplete, onNoEligible, startSpinSound, stopSpinSound, playWinSound, fireConfetti]
  );

  return { rotation, isSpinning, triggerSpin };
}
