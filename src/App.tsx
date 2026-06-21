import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

import Wheel from './components/Wheel';
import ControlPanel from './components/ControlPanel';
import WinnerModal from './components/WinnerModal';
import WinnersTable from './components/WinnersTable';
import ParticipantManager from './components/ParticipantManager';
import PrizeProgress from './components/PrizeProgress';
import ConfettiLayer from './components/ConfettiLayer';

import { usePersistedState, clearPersistedKey } from './hooks/usePersistedState';
import { useWheel, type SpinResult } from './hooks/useWheel';

import type { Participant, WinnerRecord, ToastMessage } from './types';
import { INITIAL_PRIZES } from './data/initialState';
import { generateId } from './utils/idGenerator';

// ─── STORAGE KEYS ────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  PARTICIPANTS: 'jeanys_participants',
  PRIZES: 'jeanys_prizes',
  WINNERS: 'jeanys_winners',
} as const;

// ─── APP ─────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  // ── Persisted state ──────────────────────────────────────────────────────
  const [participants, setParticipants] = usePersistedState<Participant[]>(
    STORAGE_KEYS.PARTICIPANTS,
    []
  );
  const [prizes, setPrizes] = usePersistedState(
    STORAGE_KEYS.PRIZES,
    INITIAL_PRIZES
  );
  const [winners, setWinners] = usePersistedState<WinnerRecord[]>(
    STORAGE_KEYS.WINNERS,
    []
  );

  // ── Transient UI state ──────────────────────────────────────────────────
  const [pendingWinner, setPendingWinner] = useState<WinnerRecord | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ── Toast helpers ────────────────────────────────────────────────────────
  const addToast = useCallback(
    (message: string, type: ToastMessage['type'] = 'info') => {
      const id = generateId();
      setToasts((prev) => [...prev, { id, type, message }]);
    },
    []
  );
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Spin callbacks ───────────────────────────────────────────────────────
  const handleSpinComplete = useCallback(
    (result: SpinResult) => {
      setParticipants(result.updatedParticipants);
      setPrizes(result.updatedPrizes);
      setWinners((prev) => [...prev, result.record]);
      setPendingWinner(result.record);
      addToast(`🎉 ${result.winner.name} won ${result.record.prizeLabel}!`, 'success');
    },
    [setParticipants, setPrizes, setWinners, addToast]
  );

  const handleNoEligible = useCallback(() => {
    addToast('No eligible participants remaining. All names have won!', 'warning');
  }, [addToast]);

  // ── useWheel hook ────────────────────────────────────────────────────────
  const { rotation, isSpinning, triggerSpin } = useWheel({
    participants,
    prizes,
    onSpinComplete: handleSpinComplete,
    onNoEligible: handleNoEligible,
  });

  // ── Shuffle participants ─────────────────────────────────────────────────
  const handleShuffleParticipants = useCallback(() => {
    if (isSpinning) return;
    setParticipants((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    addToast('🔀 Participants shuffled!', 'info');
  }, [isSpinning, setParticipants, addToast]);

  // ── Restart Draw ─────────────────────────────────────────────────────────
  const handleRestartDraw = useCallback(() => {
    if (isSpinning) return;
    if (window.confirm("Are you sure you want to restart? This will clear all winners but keep the participant list.")) {
      setPrizes(INITIAL_PRIZES);
      setWinners([]);
      setParticipants((prev) => prev.map(p => ({ ...p, hasWon: false })));
      addToast('🔄 Draw has been restarted!', 'info');
    }
  }, [isSpinning, setPrizes, setWinners, setParticipants, addToast]);

  // ── Admin: add participants ──────────────────────────────────────────────
  const handleAddParticipants = useCallback(
    (names: string[]) => {
      const newEntries: Participant[] = names.map((name) => ({
        id: generateId(),
        name: name.trim(),
        hasWon: false,
      }));
      setParticipants((prev) => [...prev, ...newEntries]);
      addToast(`✅ Added ${names.length} entr${names.length === 1 ? 'y' : 'ies'}.`, 'success');
    },
    [setParticipants, addToast]
  );

  // ── Admin: remove participant ────────────────────────────────────────────
  const handleRemoveParticipant = useCallback(
    (targetName: string) => {
      const normalizedTarget = targetName.trim().toLowerCase();
      setParticipants((prev) => prev.filter(p => p.name.trim().toLowerCase() !== normalizedTarget));
      addToast(`🗑️ Removed "${targetName}".`, 'info');
    },
    [setParticipants, addToast]
  );

  // ── Admin: reset ─────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(clearPersistedKey);
    setParticipants([]);
    setPrizes(INITIAL_PRIZES);
    setWinners([]);
    setPendingWinner(null);
    addToast('🔄 All data has been reset.', 'info');
  }, [setParticipants, setPrizes, setWinners, addToast]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Ambient sparkles + toasts */}
      <ConfettiLayer toasts={toasts} onDismissToast={dismissToast} />

      {/* Winner modal */}
      <WinnerModal winner={pendingWinner} onClose={() => setPendingWinner(null)} />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        style={{
          textAlign: 'center',
          padding: 'clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1rem) 1rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Decorative ribbon behind title */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70%',
            height: 60,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,179,193,0.25) 20%, rgba(230,57,80,0.15) 50%, rgba(255,179,193,0.25) 80%, transparent 100%)',
            borderRadius: 999,
            pointerEvents: 'none',
            filter: 'blur(6px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Shop subtitle */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '0.82rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#E63950',
              marginBottom: '0.35rem',
            }}
          >
            🎀 Jeany's Olshoppe Anniversary 🎀
          </p>

          {/* Main title */}
          <h1
            className="ribbon-banner"
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 900,
              fontSize: 'clamp(1.7rem, 5vw, 3rem)',
              lineHeight: 1.15,
              color: '#C9184A',
              letterSpacing: '-0.01em',
              display: 'inline-block',
              textShadow: '0 2px 12px rgba(201,24,74,0.15)',
              marginBottom: '0.4rem',
            }}
          >
            Lucky Spin Roulette
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 400,
              fontSize: '0.9rem',
              color: '#9a5060',
              marginTop: '0.3rem',
            }}
          >
            10× Consolation Prizes • Third • Second • First • 🏆 Grand Prize
          </p>
        </motion.div>
      </header>

      {/* ── PRIZE PROGRESS ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(0.75rem, 3vw, 1rem) 0.5rem' }}>
        <PrizeProgress prizes={prizes} winners={winners} />
      </div>

      {/* ── MAIN LAYOUT ────────────────────────────────────────────────── */}
      <main className="app-layout">
        {/* LEFT COLUMN — Wheel + ControlPanel */}
        <div className="flex flex-col gap-4">
          {/* Wheel container */}
          <motion.div
            className="glass-card p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <div className="wheel-wrapper">
              {/* Constrain wheel canvas width */}
              <div className="wheel-container">
              {/* Fixed pointer at top */}
              <div
                aria-hidden
                style={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: -12,
                  zIndex: 10,
                }}
              >
                <div className="wheel-pointer" />
              </div>

              {/* The canvas wheel */}
              <Wheel participants={participants} rotation={rotation} />
              </div>{/* end wheel-container */}

              {/* Spinning overlay text */}
              {isSpinning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#E63950',
                  }}
                >
                  🎡 Spinning…
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <button
                className="btn-danger"
                onClick={handleRestartDraw}
                disabled={isSpinning || winners.length === 0}
                style={{ fontSize: '0.95rem' }}
                title="Clear all winners and reset the prizes"
              >
                🔄 Restart
              </button>
              <button
                className="btn-secondary"
                onClick={handleShuffleParticipants}
                disabled={isSpinning || participants.length === 0}
                style={{ fontSize: '0.95rem' }}
              >
                🔀 Shuffle
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const nextPrizeIdx = prizes.findIndex((p) => !p.isDrawn);
                  if (nextPrizeIdx !== -1) triggerSpin(nextPrizeIdx);
                }}
                disabled={
                  isSpinning ||
                  prizes.findIndex((p) => !p.isDrawn) === -1 ||
                  participants.filter((p) => !p.hasWon).length === 0
                }
                style={{ fontSize: '1.05rem', padding: '0.6rem 2rem' }}
              >
                🎡 SPIN
              </button>
            </div>
          </motion.div>

          {/* Control panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <ControlPanel
              prizes={prizes}
              winners={winners}
              participants={participants}
              isSpinning={isSpinning}
              onSpin={triggerSpin}
            />
          </motion.div>
        </div>

        {/* RIGHT COLUMN — Admin + Winners table */}
        <div className="flex flex-col gap-4">
          {/* Admin panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ParticipantManager
              participants={participants}
              winners={winners}
              onAddParticipants={handleAddParticipants}
              onRemoveParticipant={handleRemoveParticipant}
              onReset={handleReset}
            />
          </motion.div>

          {/* Winners table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="section-header">🏅 Winners Board</div>
            <WinnersTable winners={winners} prizes={prizes} />
          </motion.div>
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1.5rem 1rem',
          fontSize: '0.75rem',
          color: '#b08090',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Made with 💕 for Jeany's Olshoppe Anniversary •{' '}
        {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
