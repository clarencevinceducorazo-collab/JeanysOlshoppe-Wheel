import type { Prize } from '../types';
import { generateId } from '../utils/idGenerator';

/**
 * The canonical prize sequence enforced by the app.
 * The UI only unlocks each prize after all prior prizes are isDrawn=true.
 * Consolation prizes #1-#10 follow the four main prizes.
 */
export const INITIAL_PRIZES: Prize[] = [
  // Consolation prizes #1-#10
  ...Array.from({ length: 10 }, (_, i) => ({
    id: generateId(),
    tier: 'consolation' as const,
    label: `Consolation Prize #${i + 1}`,
    icon: '🎁',
    itemName: `Consolation Gift #${i + 1}`,
    isDrawn: false,
  })),
  {
    id: generateId(),
    tier: 'third',
    label: 'Third Prize',
    icon: '🥉',
    itemName: '₱500 GCash',
    isDrawn: false,
  },
  {
    id: generateId(),
    tier: 'second',
    label: 'Second Prize',
    icon: '🥈',
    itemName: 'Brand New Phone',
    isDrawn: false,
  },
  {
    id: generateId(),
    tier: 'first',
    label: 'First Prize',
    icon: '🥇',
    itemName: 'Japan Displayer',
    isDrawn: false,
  },
  {
    id: generateId(),
    tier: 'grand',
    label: 'Grand Prize',
    icon: '🏆',
    itemName: 'Japan Cabinet',
    isDrawn: false,
  },
];

/**
 * Default starter participants (empty — admin adds them via the panel).
 * Assumption: no demo data is pre-loaded to avoid confusion during a real event.
 */
export const INITIAL_PARTICIPANTS = [] as const;

export const INITIAL_WINNERS = [] as const;
