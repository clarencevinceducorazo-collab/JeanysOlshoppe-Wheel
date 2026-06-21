import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WinnerRecord } from '../types';

interface WinnerModalProps {
  winner: WinnerRecord | null;
  onClose: () => void;
}

/**
 * WinnerModal
 *
 * Full-screen frosted-glass overlay that appears after a successful spin.
 * Uses framer-motion spring animation for the card entrance (scale + fade).
 * The confetti burst is fired by useWheel (canvas-confetti), so this component
 * only handles the visual modal UI.
 *
 * Pressing Escape or clicking the backdrop also triggers onClose().
 */
const WinnerModal: React.FC<WinnerModalProps> = ({ winner, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    if (!winner) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [winner, onClose]);

  const formattedTime = winner
    ? new Date(winner.timestamp).toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <AnimatePresence>
      {winner && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Winner announcement"
        >
          {/* Floating ribbon decorations */}
          <div aria-hidden className="pointer-events-none select-none">
            {['🎀', '✨', '🎊', '💝', '⭐'].map((emoji, i) => (
              <motion.span
                key={i}
                style={{
                  position: 'fixed',
                  fontSize: `${1.4 + i * 0.3}rem`,
                  top: `${10 + i * 15}%`,
                  left: `${5 + i * 18}%`,
                  opacity: 0.35,
                  userSelect: 'none',
                }}
                animate={{
                  y: [0, -12, 0],
                  rotate: [0, 15, -15, 0],
                }}
                transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="glass-card relative"
            style={{
              maxWidth: 480,
              width: '90vw',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              overflow: 'hidden',
              zIndex: 10000,
            }}
          >
            {/* Background shimmer */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse at center, rgba(255,179,193,0.22) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Prize icon */}
            <div className="prize-icon-anim" style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
              {winner.prizeLabel.startsWith('Grand')
                ? '🏆'
                : winner.prizeLabel.startsWith('First')
                ? '🥇'
                : winner.prizeLabel.startsWith('Second')
                ? '🥈'
                : winner.prizeLabel.startsWith('Third')
                ? '🥉'
                : '🎁'}
            </div>

            {/* Congratulations heading */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="font-serif"
              style={{
                fontSize: '1.15rem',
                color: '#E63950',
                fontWeight: 700,
                marginBottom: '0.35rem',
                letterSpacing: '0.02em',
              }}
            >
              🎉 Congratulations! 🎉
            </motion.div>

            {/* Winner name */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.38, type: 'spring', stiffness: 200 }}
              className="font-serif"
              style={{
                fontSize: 'clamp(1.8rem, 6vw, 2.6rem)',
                fontWeight: 900,
                color: '#C9184A',
                lineHeight: 1.15,
                marginBottom: '0.6rem',
                wordBreak: 'break-word',
              }}
            >
              {winner.participantName}
            </motion.div>

            {/* SVG Ribbon */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.45, duration: 0.45 }}
              style={{ marginBottom: '0.75rem' }}
              aria-hidden
            >
              <svg viewBox="0 0 200 28" width="200" height="28" style={{ display: 'inline-block' }}>
                <defs>
                  <linearGradient id="ribGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FFB3C1" />
                    <stop offset="50%" stopColor="#E63950" />
                    <stop offset="100%" stopColor="#FFB3C1" />
                  </linearGradient>
                </defs>
                {/* Left wing */}
                <polygon points="0,14 48,4 60,14 48,24" fill="url(#ribGrad)" opacity="0.85" />
                {/* Right wing */}
                <polygon points="200,14 152,4 140,14 152,24" fill="url(#ribGrad)" opacity="0.85" />
                {/* Centre circle */}
                <circle cx="100" cy="14" r="12" fill="#E63950" />
                <circle cx="100" cy="14" r="8" fill="#FFB3C1" />
                {/* Centre horizontal bar */}
                <rect x="56" y="11" width="88" height="6" fill="url(#ribGrad)" rx="3" />
                {/* Star in centre */}
                <text x="100" y="19" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">
                  ★
                </text>
              </svg>
            </motion.div>

            {/* Prize details */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ marginBottom: '0.4rem' }}
            >
              <span
                className="tier-badge"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.85rem',
                  background: 'linear-gradient(135deg, #FF8FAB, #E63950)',
                  color: 'white',
                }}
              >
                {winner.prizeLabel}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.58 }}
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#3a1a26',
                marginBottom: '0.3rem',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {winner.itemName}
            </motion.div>

            <div style={{ fontSize: '0.78rem', color: '#9a6070', marginBottom: '1.5rem' }}>
              {formattedTime}
            </div>

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              id="winner-modal-close"
              className="btn-primary"
              style={{ minWidth: 140, fontSize: '0.95rem' }}
            >
              🎊 Awesome!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinnerModal;
