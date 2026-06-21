import React, { useRef, useEffect, useCallback } from 'react';
import type { Participant } from '../types';

// ─── COLOUR PALETTE ─────────────────────────────────────────────────────────
// Alternates between three pastel-pink/crimson groups for visual variety.
const SEGMENT_COLORS = [
  '#FFD6E8', // pale blush
  '#FF8FAB', // pink-mid
  '#FFFFFF', // white
  '#FFB3C1', // pink-light
  '#E63950', // crimson
  '#FFF0F5', // off-white blush
];

interface WheelProps {
  participants: Participant[];
  rotation: number; // radians, controlled externally by useWheel
}

/**
 * Wheel — Canvas-based roulette wheel.
 *
 * Each Participant is one equal-sized segment regardless of name.
 * Won segments are rendered at ~40% opacity with a ✓ watermark.
 * Text is drawn radially, auto-shrinks as segment count grows,
 * and truncates with ellipsis when the segment is too narrow.
 *
 * ResizeObserver keeps the canvas square and fills its container.
 */
const Wheel: React.FC<WheelProps> = ({ participants, rotation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Drawing function ────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width; // square canvas
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4; // leave 4px edge clearance
    const count = participants.length;

    ctx.clearRect(0, 0, size, size);

    if (count === 0) {
      // Empty state — placeholder disc
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFE5EC';
      ctx.fill();
      ctx.strokeStyle = '#FFB3C1';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#C9184A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(size * 0.045)}px Poppins, sans-serif`;
      ctx.fillText('Add participants', cx, cy - size * 0.03);
      ctx.font = `${Math.round(size * 0.035)}px Poppins, sans-serif`;
      ctx.fillText('to start spinning!', cx, cy + size * 0.04);
      ctx.restore();
      return;
    }

    const segAngle = (2 * Math.PI) / count;

    // Auto-scale font: smaller segments → smaller text
    // Range: 14px (1 participant) → ~7px (100+ participants)
    const baseFontPx = Math.max(7, Math.min(14, Math.round(size / count * 0.55)));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    participants.forEach((participant, i) => {
      const startAngle = -Math.PI / 2 + i * segAngle;
      const endAngle = startAngle + segAngle;
      const colorBase = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

      // ── Segment fill ──────────────────────────────────────────────────
      ctx.save();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colorBase;
      ctx.fill();

      // Segment border
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = count > 60 ? 0.5 : 1;
      ctx.stroke();

      // ── Text label ────────────────────────────────────────────────────
      ctx.save();
      const midAngle = startAngle + segAngle / 2;
      ctx.rotate(midAngle);

      // Determine legible text color based on segment color luminance
      const isDark = colorBase === '#E63950' || colorBase === '#FF8FAB';
      ctx.fillStyle = isDark ? '#FFFFFF' : '#4a1525';

      ctx.font = `${participant.hasWon ? 'italic' : 'bold'} ${baseFontPx}px Poppins, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Max text width: from 30% radius to 95% radius
      const maxWidth = radius * 0.63;

      // Truncate with ellipsis if needed
      const label = truncateText(ctx, participant.name, maxWidth);
      ctx.fillText(label, radius * 0.93, 0);
      ctx.restore();

      // ── Won checkmark watermark ────────────────────────────────────────
      if (participant.hasWon && segAngle > 0.05) {
        ctx.save();
        const midA = startAngle + segAngle / 2;
        ctx.rotate(midA);
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#C9184A';
        ctx.font = `bold ${Math.max(8, baseFontPx + 2)}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('', radius * 0.55, 0);
        ctx.restore();
      }

      ctx.restore();
    });

    ctx.restore();

    // ── Centre hub ────────────────────────────────────────────────────────
    ctx.save();
    const hubR = Math.max(14, size * 0.042);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.6, '#FFB3C1');
    grad.addColorStop(1, '#E63950');
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#C9184A';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // ── Outer ring ────────────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#E63950';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }, [participants, rotation]);

  // ── Redraw on every change ─────────────────────────────────────────────
  useEffect(() => {
    draw();
  }, [draw]);

  // ── ResizeObserver: keep canvas square to its container ──────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const size = Math.floor(width);
        if (canvas.width !== size) {
          canvas.width = size;
          canvas.height = size;
          draw();
        }
      }
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', aspectRatio: '1 / 1', position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%' }}
        aria-label="Prize roulette wheel"
        role="img"
      />
    </div>
  );
};

// ─── HELPER ───────────────────────────────────────────────────────────────
function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

export default Wheel;
