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
   * pure helper to calculate the spin target (used by Admin)
   */
  const generateSpinTarget = useCallback(
    (prizeIndex: number) => {
      const prize = prizes[prizeIndex];
      if (!prize || prize.isDrawn) return null;

      const winner = pickRandomEligible(participants);
      if (winner === null) {
        onNoEligible();
        return null;
      }

      let finalItemName = prize.itemName;
      if (finalItemName.includes('Mystery Coupon')) {
        const couponValues = [50, 100, 150, 200];
        const rolledValue = couponValues[Math.floor(Math.random() * couponValues.length)];
        finalItemName = `Coupon worth ₱${rolledValue}`;
      }

      return { winner, finalItemName };
    },
    [participants, prizes, onNoEligible]
  );

  /**
   * Main spin execution (used by both Admin and Viewers)
   */
  const playSpinAnimation = useCallback(
    (prizeIndex: number, winner: Participant, finalItemName: string) => {
      if (isSpinning) return;

      const prize = prizes[prizeIndex];
      if (!prize) return;

      // ── 2. Calculate segment geometry ────────────────────────────────
      const segCount = participants.length;
      const segAngle = (2 * Math.PI) / segCount;

      const winnerIdx = participants.findIndex((p) => p.id === winner.id);
      
      const segCentreAngle = -Math.PI / 2 + (winnerIdx + 0.5) * segAngle;
      const neededRot = -Math.PI / 2 - segCentreAngle;

      // Add 15-20 full turns for extra excitement
      const fullTurns = Math.floor(Math.random() * 6) + 15;
      const currentRot = rotationRef.current % (2 * Math.PI);
      let delta = (neededRot - currentRot + 2 * Math.PI) % (2 * Math.PI);
      const totalRot = rotationRef.current + fullTurns * 2 * Math.PI + delta;

      // ── 3. Animate ───────────────────────────────────────────────────
      setIsSpinning(true);
      startSpinSound();

      const START_ROT = rotationRef.current;
      const TOTAL_DELTA = totalRot - START_ROT;
      const DURATION_MS = 7000 + Math.random() * 8000; // 7–15 seconds
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
          const updatedParticipants = markPersonAsWon(participants, winner.name);
          const updatedPrizes = prizes.map((p, i) =>
            i === prizeIndex ? { ...p, isDrawn: true, itemName: finalItemName } : p
          );
          const record: WinnerRecord = {
            id: generateId(),
            participantName: winner.name,
            entryId: winner.id,
            prizeId: prize.id,
            prizeLabel: prize.label,
            itemName: finalItemName,
            timestamp: new Date().toISOString(),
          };

          onSpinComplete({ winner, record, updatedParticipants, updatedPrizes });
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    },
    [isSpinning, participants, prizes, onSpinComplete, startSpinSound, stopSpinSound, playWinSound, fireConfetti]
  );

  const resetRotation = useCallback(() => {
    rotationRef.current = 0;
    setRotation(0);
  }, []);

  return { rotation, isSpinning, playSpinAnimation, generateSpinTarget, resetRotation };
}
