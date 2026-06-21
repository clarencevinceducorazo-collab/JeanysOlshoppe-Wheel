import React from 'react';
import type { Prize, WinnerRecord } from '../types';

interface PrizeProgressProps {
  prizes: Prize[];
  winners: WinnerRecord[];
}

/**
 * PrizeProgress
 *
 * A compact visual strip showing which prizes have been drawn.
 * Each prize is a pill: grey = pending, gradient = drawn with winner name.
 */
const PrizeProgress: React.FC<PrizeProgressProps> = ({ prizes, winners }) => {
  const drawn = prizes.filter((p) => p.isDrawn).length;
  const total = prizes.length;

  return (
    <div
      className="glass-card p-4 flex flex-col gap-3"
      aria-label="Prize progress tracker"
    >
      {/* Header + overall progress */}
      <div className="flex items-center justify-between">
        <div className="section-header mb-0">🎯 Prize Progress</div>
        <div className="progress-pill">
          <span style={{ color: '#C9184A', fontWeight: 700 }}>{drawn}</span>
          <span style={{ color: '#9a6070' }}>/ {total} drawn</span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 8,
          background: 'rgba(255,179,193,0.3)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${total > 0 ? (drawn / total) * 100 : 0}%`,
            background: 'linear-gradient(90deg, #FF8FAB, #E63950)',
            borderRadius: 999,
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      {/* Prize pills */}
      <div className="flex flex-wrap gap-2">
        {prizes.map((prize) => {
          const winner = winners.find((w) => w.prizeId === prize.id);
          return (
            <div
              key={prize.id}
              title={prize.isDrawn ? `Won by: ${winner?.participantName ?? ''}` : prize.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.7rem',
                borderRadius: 999,
                fontSize: '0.72rem',
                fontWeight: 700,
                background: prize.isDrawn
                  ? 'linear-gradient(135deg, #FF8FAB, #E63950)'
                  : 'rgba(220,200,208,0.4)',
                color: prize.isDrawn ? '#fff' : '#9a6070',
                border: prize.isDrawn ? '1px solid #C9184A' : '1px solid #d4b0bc',
                transition: 'all 0.3s ease',
                maxWidth: 'clamp(90px, 28vw, 180px)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{prize.icon}</span>
              {prize.isDrawn && winner
                ? <span title={winner.participantName}>{winner.participantName}</span>
                : <span>{prize.label}</span>}
              {prize.isDrawn && <span>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrizeProgress;
