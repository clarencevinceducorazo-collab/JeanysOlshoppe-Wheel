// ============================================================
// TYPE DEFINITIONS — Jeany's Olshoppe Lucky Spin Roulette
// ============================================================

/**
 * Participant — one entry on the wheel.
 * If "John" is added 5 times there are 5 separate Participant objects,
 * each an independent segment. hasWon is set to true on ALL entries
 * sharing the same name once that person wins.
 */
export type Participant = {
  id: string;      // uuid per entry (NOT per person)
  name: string;    // trimmed, case-preserved display name
  hasWon: boolean; // true → excluded from eligible pool
};

/**
 * Prize — one slot in the sequential prize sequence.
 * Consolation prizes are generated as #1 through #10.
 */
export type PrizeTier = 'grand' | 'first' | 'second' | 'third' | 'consolation';

export type Prize = {
  id: string;
  tier: PrizeTier;
  label: string;   // e.g. "Grand Prize", "Consolation Prize #3"
  icon: string;    // emoji
  itemName: string;
  isDrawn: boolean;
};

/**
 * WinnerRecord — persisted after each successful spin.
 */
export type WinnerRecord = {
  id: string;
  participantName: string;
  entryId: string;
  prizeId: string;
  prizeLabel: string;
  itemName: string;
  timestamp: string; // ISO 8601
};

/**
 * AppState — root persisted state shape stored in localStorage.
 */
export type AppState = {
  participants: Participant[];
  prizes: Prize[];
  winners: WinnerRecord[];
};

/**
 * Toast message for non-blocking user feedback.
 */
export type ToastMessage = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
};

/**
 * Active tab in the admin panel.
 */
export type AdminTab = 'participants' | 'import' | 'winners' | 'reset';
