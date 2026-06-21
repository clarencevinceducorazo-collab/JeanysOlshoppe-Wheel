import React, { useEffect, useRef, useState } from 'react';
import type { ToastMessage } from '../types';

interface ConfettiLayerProps {
  toasts: ToastMessage[];
  onDismissToast: (id: string) => void;
}

const TOAST_COLORS: Record<ToastMessage['type'], { bg: string; border: string; icon: string }> = {
  success: { bg: '#e8f5e9', border: '#a5d6a7', icon: '✅' },
  error:   { bg: '#ffe5ec', border: '#FFB3C1', icon: '❌' },
  warning: { bg: '#fff3e0', border: '#ffcc80', icon: '⚠️' },
  info:    { bg: '#e3f2fd', border: '#90caf9', icon: 'ℹ️' },
};

/**
 * ConfettiLayer
 *
 * Renders:
 *  1. Floating background sparkle particles (CSS animated ✦ / ✧ / ⭐ emojis)
 *  2. A toast notification stack (top-right, auto-dismiss after 4s)
 *
 * The canvas-confetti calls are made directly in useWheel, so this component
 * only handles the ambient decorations and toast UI.
 */
const ConfettiLayer: React.FC<ConfettiLayerProps> = ({ toasts, onDismissToast }) => {
  return (
    <>
      {/* Floating sparkle background */}
      <BackgroundSparkles />

      {/* Toast stack */}
      <div
        role="region"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9990,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismissToast} />
        ))}
      </div>
    </>
  );
};

// ─── BACKGROUND SPARKLES ─────────────────────────────────────────────────────

const SPARKLE_EMOJIS = ['✦', '✧', '⭐', '💫', '✨', '🌸', '💕'];

const SPARKLE_POSITIONS = [
  { top: '8%',  left: '5%',  duration: 7.2,  delay: 0,   size: 1.0 },
  { top: '15%', left: '92%', duration: 9.1,  delay: 1.2, size: 0.8 },
  { top: '30%', left: '3%',  duration: 6.5,  delay: 2.0, size: 1.2 },
  { top: '50%', left: '96%', duration: 8.3,  delay: 0.5, size: 0.9 },
  { top: '70%', left: '7%',  duration: 7.8,  delay: 3.1, size: 1.1 },
  { top: '80%', left: '90%', duration: 10.0, delay: 1.8, size: 0.75 },
  { top: '92%', left: '50%', duration: 8.6,  delay: 0.9, size: 1.0 },
  { top: '20%', left: '45%', duration: 11.2, delay: 4.0, size: 0.7 },
  { top: '60%', left: '55%', duration: 9.5,  delay: 2.6, size: 0.85 },
];

const BackgroundSparkles: React.FC = () => (
  <div aria-hidden style={{ pointerEvents: 'none', userSelect: 'none' }}>
    {SPARKLE_POSITIONS.map((sp, i) => (
      <span
        key={i}
        className="sparkle"
        style={{
          top: sp.top,
          left: sp.left,
          animationDuration: `${sp.duration}s`,
          animationDelay: `${sp.delay}s`,
          fontSize: `${sp.size}rem`,
        }}
      >
        {SPARKLE_EMOJIS[i % SPARKLE_EMOJIS.length]}
      </span>
    ))}
  </div>
);

// ─── TOAST ───────────────────────────────────────────────────────────────────

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 350);
    }, 3800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, onDismiss]);

  const style = TOAST_COLORS[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={exiting ? 'toast-exit' : 'toast-enter'}
      style={{
        pointerEvents: 'auto',
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: 14,
        padding: '0.75rem 1rem',
        minWidth: 260,
        maxWidth: 340,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.88rem',
        fontWeight: 600,
        color: '#3a1a26',
      }}
      onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 350); }}
    >
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{style.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
    </div>
  );
};

export default ConfettiLayer;
