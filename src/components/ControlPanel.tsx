import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Prize, WinnerRecord, Participant } from '../types';

interface ControlPanelProps {
  prizes: Prize[];
  winners: WinnerRecord[];
  participants: Participant[];
  isSpinning: boolean;
  onSpin: (prizeIndex: number) => void;
}

const TIER_CLASSES: Record<string, string> = {
  grand: 'tier-grand',
  first: 'tier-first',
  second: 'tier-second',
  third: 'tier-third',
  consolation: 'tier-consolation',
};

/**
 * ControlPanel
 *
 * Renders the prize sequence as spin buttons with three visual states:
 *   - Locked   (prior prizes not yet drawn) → grey, cursor-not-allowed
 *   - Active   (this prize is next) → gradient + pulse animation
 *   - Complete (drawn) → shows winner name + checkmark
 *
 * Also shows a live stats bar: Total Entries | Unique Participants | Eligible
 */
const ControlPanel: React.FC<ControlPanelProps> = ({
  prizes,
  winners,
  participants,
  isSpinning,
  onSpin,
}) => {
  const totalEntries = participants.length;
  const uniqueNames = new Set(participants.map((p) => p.name.toLowerCase())).size;
  const eligibleCount = participants.filter((p) => !p.hasWon).length;

  // Index of the next un-drawn prize
  const nextPrizeIdx = prizes.findIndex((p) => !p.isDrawn);

  // Group consolation prizes to keep the UI compact when all 10 are listed
  // We still render each individually but may collapse them visually.

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      {/* Stats bar */}
      <div className="stats-bar">
        <span className="stat-item">
          🎟️ Total Entries: <span className="stat-value">{totalEntries}</span>
        </span>
        <span className="stat-item">
          👥 Unique: <span className="stat-value">{uniqueNames}</span>
        </span>
        <span className="stat-item">
          ✅ Eligible: <span className="stat-value">{eligibleCount}</span>
        </span>
      </div>

      {/* Prize list */}
      <div className="flex flex-col gap-2">
        {prizes.map((prize, idx) => {
          const isActive = idx === nextPrizeIdx && !prize.isDrawn;
          const isLocked = !prize.isDrawn && idx > nextPrizeIdx;
          const isComplete = prize.isDrawn;

          // Find winner record for this prize
          const winnerRecord = winners.find((w) => w.prizeId === prize.id);

          // Tooltip text for locked state
          let lockTooltip = '';
          if (isLocked) {
            const prevPrize = prizes[idx - 1];
            lockTooltip = prevPrize
              ? `Complete "${prevPrize.label}" first`
              : 'Previous prizes must be completed first';
          }
          if (nextPrizeIdx === -1 && !prize.isDrawn) {
            lockTooltip = 'All consolation prizes drawn';
          }

          return (
            <PrizeButton
              key={prize.id}
              prize={prize}
              isActive={isActive}
              isLocked={isLocked}
              isComplete={isComplete}
              isSpinning={isSpinning}
              winnerRecord={winnerRecord}
              lockTooltip={lockTooltip}
              tierClass={TIER_CLASSES[prize.tier] ?? 'tier-consolation'}
              onSpin={() => onSpin(idx)}
            />
          );
        })}
      </div>

      {nextPrizeIdx === -1 && (
        <div className="text-center py-2 text-sm font-semibold" style={{ color: '#C9184A' }}>
          🎉 All prizes have been drawn! Congratulations to all winners!
        </div>
      )}
    </div>
  );
};

// ─── PRIZE BUTTON ────────────────────────────────────────────────────────────

interface PrizeButtonProps {
  prize: Prize;
  isActive: boolean;
  isLocked: boolean;
  isComplete: boolean;
  isSpinning: boolean;
  winnerRecord?: WinnerRecord;
  lockTooltip: string;
  tierClass: string;
  onSpin: () => void;
}

const PrizeButton: React.FC<PrizeButtonProps> = ({
  prize,
  isActive,
  isLocked,
  isComplete,
  isSpinning,
  winnerRecord,
  lockTooltip,
  tierClass,
  onSpin,
}) => {
  const disabled = !isActive || isSpinning;

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,229,236,0.9), rgba(255,255,255,0.9))',
              border: '1.5px solid #FFB3C1',
            }}
          >
            <span className="text-xl">{prize.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`tier-badge ${tierClass}`}>{prize.label}</span>
                <span className="text-xs font-medium" style={{ color: '#7a2a3a' }}>
                  {prize.itemName}
                </span>
              </div>
              {winnerRecord && (
                <div className="text-xs mt-0.5 font-semibold" style={{ color: '#C9184A' }}>
                  🏅 {winnerRecord.participantName}
                </div>
              )}
            </div>
            <span
              className="text-green-600 font-bold text-lg flex-shrink-0"
              title="Drawn"
            >
              ✔
            </span>
          </motion.div>
        ) : (
          <motion.button
            key="spin"
            id={`spin-btn-${prize.id}`}
            onClick={isLocked ? undefined : onSpin}
            disabled={disabled}
            title={isLocked ? lockTooltip : isSpinning ? 'Spinning…' : `Spin for ${prize.label}`}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all
              ${isActive ? 'btn-spin-active' : ''}
            `}
            style={{
              cursor: isLocked ? 'not-allowed' : isSpinning ? 'wait' : 'pointer',
              background: isLocked
                ? 'rgba(220,200,208,0.5)'
                : 'linear-gradient(135deg, #FF8FAB 0%, #E63950 100%)',
              border: isLocked ? '1.5px solid #d4b0bc' : '1.5px solid #C9184A',
              color: isLocked ? '#9a6070' : 'white',
              boxShadow: isActive ? undefined : 'none',
              opacity: isLocked ? 0.65 : 1,
            }}
            whileHover={!disabled ? { scale: 1.015, y: -1 } : {}}
            whileTap={!disabled ? { scale: 0.97 } : {}}
          >
            <span className="text-xl flex-shrink-0">{prize.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight">
                {isSpinning && isActive ? '🎡 Spinning…' : `Spin for ${prize.label}`}
              </div>
              <div
                className="text-xs opacity-80 truncate"
                style={{ color: isLocked ? '#8a6070' : 'rgba(255,255,255,0.85)' }}
              >
                {prize.itemName}
                {isLocked && lockTooltip && ` — ${lockTooltip}`}
              </div>
            </div>
            {isActive && !isSpinning && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-white font-bold text-sm flex-shrink-0"
              >
                ▶
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ControlPanel;
