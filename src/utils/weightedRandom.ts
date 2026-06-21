import type { Participant } from '../types';

/**
 * Returns the normalized name used for equality checks.
 * We trim whitespace but preserve case for display (spec says case-preserved).
 * For grouping purposes we compare trim()-ed names case-insensitively.
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Picks one Participant uniformly at random from the eligible pool
 * (entries where hasWon === false).
 *
 * Uses crypto.getRandomValues for a cryptographically random index,
 * falling back to Math.random() in environments that don't support it.
 *
 * Returns null if the pool is empty — callers must guard against this.
 */
export function pickRandomEligible(participants: Participant[]): Participant | null {
  const eligible = participants.filter((p) => !p.hasWon);
  if (eligible.length === 0) return null;

  let index: number;

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    // Use a Uint32Array to get a 32-bit random integer, then mod by pool length.
    // This introduces minimal modulo bias for pools < 2^32 (more than sufficient).
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    index = arr[0] % eligible.length;
  } else {
    index = Math.floor(Math.random() * eligible.length);
  }

  return eligible[index];
}

/**
 * Marks hasWon=true on EVERY entry that shares the same normalized name
 * as the winner. The entries remain in the array (still visible on wheel,
 * just greyed out with a ✓ watermark) but are excluded from future draws.
 *
 * This is the "one-winner-per-person" guarantee.
 */
export function markPersonAsWon(
  participants: Participant[],
  winnerName: string
): Participant[] {
  const key = normalizeName(winnerName);
  return participants.map((p) =>
    normalizeName(p.name) === key ? { ...p, hasWon: true } : p
  );
}
