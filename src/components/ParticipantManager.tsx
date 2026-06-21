import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Participant, WinnerRecord } from '../types';
import { normalizeName } from '../utils/weightedRandom';
import {
  parseCSVNames,
  parseExcelNames,
  exportWinnersCSV,
  exportWinnersXLSX,
} from '../utils/csvImportExport';
import type { AdminTab } from '../types';

interface ParticipantManagerProps {
  participants: Participant[];
  winners: WinnerRecord[];
  onAddParticipants: (names: string[]) => void;
  onRemoveParticipant: (name: string) => void;
  onReset: () => void;
}

/**
 * ParticipantManager
 *
 * Admin panel with 4 tabs:
 *  - Participants: add by name, add N entries, searchable/sortable table
 *  - Import: CSV or Excel file upload with preview/confirmation
 *  - Winners: export to CSV/XLSX
 *  - Reset: confirmation modal requiring user to type "RESET"
 */
const ParticipantManager: React.FC<ParticipantManagerProps> = ({
  participants,
  winners,
  onAddParticipants,
  onRemoveParticipant,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('participants');

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="section-header">
        🎟️ Admin Panel
      </div>

      {/* Tab nav */}
      <div className="tab-nav" role="tablist">
        {(
          [
            ['participants', '👥 Participants'],
            ['import', '📥 Import'],
            ['winners', '🏅 Export'],
            ['reset', '🔄 Reset'],
          ] as [AdminTab, string][]
        ).map(([tab, label]) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            id={`tab-${tab}`}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'participants' && (
            <ParticipantsTab
              participants={participants}
              onAdd={onAddParticipants}
              onRemove={onRemoveParticipant}
            />
          )}
          {activeTab === 'import' && (
            <ImportTab onImport={onAddParticipants} />
          )}
          {activeTab === 'winners' && (
            <ExportTab winners={winners} />
          )}
          {activeTab === 'reset' && (
            <ResetTab onReset={onReset} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─── PARTICIPANTS TAB ─────────────────────────────────────────────────────────

interface ParticipantsTabProps {
  participants: Participant[];
  onAdd: (names: string[]) => void;
  onRemove: (name: string) => void;
}

const ParticipantsTab: React.FC<ParticipantsTabProps> = ({ participants, onAdd, onRemove }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const names = Array.from({ length: Math.max(1, quantity) }, () => trimmed);
    onAdd(names);
    setName('');
    setQuantity(1);
  };

  // Grouped by normalized name for display
  const grouped = useMemo(() => {
    const map = new Map<string, { displayName: string; count: number; wonCount: number }>();
    participants.forEach((p) => {
      const key = normalizeName(p.name);
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        if (p.hasWon) existing.wonCount++;
      } else {
        map.set(key, { displayName: p.name, count: 1, wonCount: p.hasWon ? 1 : 0 });
      }
    });
    return Array.from(map.values());
  }, [participants]);

  const filtered = grouped
    .filter((g) => g.displayName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortAsc
        ? a.displayName.localeCompare(b.displayName)
        : b.displayName.localeCompare(a.displayName)
    );

  return (
    <div className="flex flex-col gap-3">
      {/* Add form */}
      <div className="flex flex-wrap gap-2 items-end">
        <div style={{ flex: '1 1 180px' }}>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#7a2a3a' }}>
            Name
          </label>
          <input
            id="participant-name-input"
            className="input-field"
            placeholder="Enter name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            maxLength={60}
            autoComplete="off"
          />
        </div>
        <div style={{ flex: '0 0 80px' }}>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#7a2a3a' }}>
            Qty
          </label>
          <input
            id="participant-qty-input"
            type="number"
            min={1}
            max={99}
            className="input-field"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ textAlign: 'center' }}
          />
        </div>
        <button
          id="add-participant-btn"
          className="btn-primary"
          onClick={handleAdd}
          disabled={!name.trim()}
          style={{ height: 42, alignSelf: 'flex-end' }}
        >
          ➕ Add
        </button>
      </div>

      {/* Summary */}
      <div className="text-xs font-medium" style={{ color: '#9a6070' }}>
        {participants.length} total entries · {grouped.length} unique names
      </div>

      {/* Search + Sort */}
      {grouped.length > 0 && (
        <>
          <div className="flex gap-2">
            <input
              id="search-participants-input"
              className="input-field"
              placeholder="🔍 Search participants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="btn-secondary"
              style={{ whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
              onClick={() => setSortAsc((v) => !v)}
              title="Toggle sort"
            >
              {sortAsc ? '↑ A–Z' : '↓ Z–A'}
            </button>
          </div>

          <div style={{ maxHeight: 280, overflowY: 'auto', borderRadius: 12 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ width: 70, textAlign: 'center' }}>Entries</th>
                  <th style={{ width: 90, textAlign: 'center' }}>Status</th>
                  <th style={{ width: 60, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const isWon = g.wonCount > 0;
                  return (
                    <tr key={g.displayName}>
                      <td style={{ fontWeight: 600, color: isWon ? '#b07080' : '#3a1a26' }}>
                        {g.displayName}
                        {isWon && (
                          <span
                            style={{
                              marginLeft: '0.4rem',
                              fontSize: '0.7rem',
                              color: '#C9184A',
                              fontWeight: 700,
                            }}
                          >
                            WON ✓
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', color: '#6a2a3a', fontWeight: 700 }}>
                        {g.count}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 999,
                            background: isWon ? '#ffe5ec' : '#e8f5e9',
                            color: isWon ? '#C9184A' : '#2e7d32',
                            border: `1px solid ${isWon ? '#FFB3C1' : '#a5d6a7'}`,
                          }}
                        >
                          {isWon ? 'Won' : 'Eligible'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove all entries for ${g.displayName}?`)) {
                              onRemove(g.displayName);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            opacity: 0.6,
                            transition: 'opacity 0.2s'
                          }}
                          title={`Remove ${g.displayName}`}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ─── IMPORT TAB ───────────────────────────────────────────────────────────────

interface ImportTabProps {
  onImport: (names: string[]) => void;
}

const ImportTab: React.FC<ImportTabProps> = ({ onImport }) => {
  const [pendingNames, setPendingNames] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setPendingNames(null);
    try {
      let names: string[];
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        names = await parseCSVNames(file);
      } else {
        names = await parseExcelNames(file);
      }
      if (names.length === 0) {
        setError('No names found in file. Check that it has a column of names.');
      } else {
        setPendingNames(names);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to parse file');
    } finally {
      setLoading(false);
      // Reset file input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (!pendingNames) return;
    onImport(pendingNames);
    setPendingNames(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: '#7a4050' }}>
        Import a <strong>CSV</strong> or <strong>Excel (.xlsx)</strong> file with one name per row
        (first column). Header row is auto-detected.
      </p>

      <label
        htmlFor="import-file-input"
        className="btn-secondary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          textAlign: 'center',
          justifyContent: 'center',
          padding: '0.7rem 1.4rem',
          borderStyle: 'dashed',
        }}
      >
        {loading ? '⏳ Parsing…' : '📂 Choose CSV or Excel file'}
        <input
          id="import-file-input"
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </label>

      {error && (
        <div
          style={{
            background: '#ffe5ec',
            border: '1px solid #FFB3C1',
            borderRadius: 12,
            padding: '0.65rem 1rem',
            color: '#C9184A',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {pendingNames && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(232,245,233,0.85)',
            border: '1.5px solid #a5d6a7',
            borderRadius: 14,
            padding: '1rem',
          }}
        >
          <div className="font-semibold text-sm mb-2" style={{ color: '#1b5e20' }}>
            📋 Preview: <strong>{pendingNames.length}</strong> entries found
          </div>
          <div
            style={{
              maxHeight: 140,
              overflowY: 'auto',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: 8,
              padding: '0.5rem 0.75rem',
              fontSize: '0.82rem',
              color: '#3a1a26',
              marginBottom: '0.75rem',
            }}
          >
            {pendingNames.slice(0, 40).join(', ')}
            {pendingNames.length > 40 && ` …and ${pendingNames.length - 40} more`}
          </div>
          <div className="flex gap-2">
            <button
              id="import-confirm-btn"
              className="btn-primary"
              onClick={handleConfirm}
              style={{ fontSize: '0.88rem' }}
            >
              ✅ Import {pendingNames.length} entries
            </button>
            <button
              className="btn-secondary"
              onClick={() => setPendingNames(null)}
              style={{ fontSize: '0.88rem' }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─── EXPORT TAB ───────────────────────────────────────────────────────────────

const ExportTab: React.FC<{ winners: WinnerRecord[] }> = ({ winners }) => (
  <div className="flex flex-col gap-3">
    <p className="text-xs" style={{ color: '#7a4050' }}>
      Download the complete winners list. Columns: Winner Name, Prize Won, Item, Timestamp.
    </p>
    <div className="flex flex-wrap gap-2">
      <button
        id="export-csv-btn"
        className="btn-primary"
        onClick={() => exportWinnersCSV(winners)}
        disabled={winners.length === 0}
        style={{ fontSize: '0.88rem' }}
      >
        📄 Download CSV
      </button>
      <button
        id="export-xlsx-btn"
        className="btn-secondary"
        onClick={() => exportWinnersXLSX(winners)}
        disabled={winners.length === 0}
        style={{ fontSize: '0.88rem' }}
      >
        📊 Download Excel
      </button>
    </div>
    {winners.length === 0 && (
      <p className="text-xs" style={{ color: '#9a6070' }}>
        No winners yet — spin the wheel first!
      </p>
    )}
  </div>
);

// ─── RESET TAB ────────────────────────────────────────────────────────────────

const ResetTab: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const [confirmText, setConfirmText] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const handleAttemptReset = () => {
    if (confirmText !== 'RESET') {
      setShowWarning(true);
      return;
    }
    onReset();
    setConfirmText('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        style={{
          background: '#fff3e0',
          border: '1.5px solid #ffcc80',
          borderRadius: 12,
          padding: '0.75rem 1rem',
          fontSize: '0.85rem',
          color: '#e65100',
          fontWeight: 600,
        }}
      >
        ⚠️ This will permanently delete <strong>all participants and winners</strong> from
        localStorage. This action cannot be undone.
      </div>
      <label className="text-sm font-semibold" style={{ color: '#7a2a3a' }}>
        Type <code style={{ background: '#ffe5ec', borderRadius: 4, padding: '1px 5px' }}>RESET</code> to confirm:
      </label>
      <input
        id="reset-confirm-input"
        className="input-field"
        placeholder="RESET"
        value={confirmText}
        onChange={(e) => { setConfirmText(e.target.value); setShowWarning(false); }}
        style={{ borderColor: showWarning ? '#E63950' : undefined }}
      />
      {showWarning && (
        <p className="text-xs font-semibold" style={{ color: '#E63950' }}>
          Please type RESET exactly (all caps) to confirm.
        </p>
      )}
      <button
        id="reset-confirm-btn"
        className="btn-danger"
        onClick={handleAttemptReset}
        style={{ width: 'fit-content' }}
      >
        🗑️ Reset All Data
      </button>
    </div>
  );
};

export default ParticipantManager;
