import React from 'react';
import type { WinnerRecord, Prize } from '../types';

interface WinnersTableProps {
  winners: WinnerRecord[];
  prizes: Prize[];
}

/**
 * WinnersTable
 *
 * Live-updating table of all winners, newest on top.
 * Columns: Prize Icon | Winner Name | Prize Won | Item | Timestamp
 */
const WinnersTable: React.FC<WinnersTableProps> = ({ winners, prizes }) => {
  // Build a quick lookup from prizeId → icon
  const prizeIconMap: Record<string, string> = {};
  prizes.forEach((p) => { prizeIconMap[p.id] = p.icon; });

  const sorted = [...winners].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="empty-state glass-card p-6">
        <span className="empty-icon">🎊</span>
        No winners yet — spin to begin!
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>Icon</th>
              <th>Winner</th>
              <th>Prize</th>
              <th>Item</th>
              <th className="hide-xs" style={{ whiteSpace: 'nowrap' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((record, i) => (
              <tr key={record.id} style={{ animationDelay: `${i * 30}ms` }}>
                <td style={{ textAlign: 'center', fontSize: '1.25rem' }}>
                  {prizeIconMap[record.prizeId] ?? '🎁'}
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: '#C9184A', fontFamily: 'var(--font-serif)' }}>
                    {record.participantName}
                  </span>
                </td>
                <td>
                  <span className="tier-badge tier-consolation" style={{ fontSize: '0.7rem' }}>
                    {record.prizeLabel}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', color: '#4a1525' }}>
                  {record.itemName}
                </td>
                <td className="hide-xs" style={{ fontSize: '0.78rem', color: '#9a6070', whiteSpace: 'nowrap' }}>
                  {new Date(record.timestamp).toLocaleString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WinnersTable;
