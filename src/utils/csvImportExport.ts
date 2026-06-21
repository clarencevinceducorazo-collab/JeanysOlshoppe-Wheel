import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { WinnerRecord } from '../types';

// ─── IMPORT ────────────────────────────────────────────────────────────────

/**
 * Parses a CSV file and returns an array of name strings.
 * Expects a single-column file; header row is auto-detected and skipped.
 * Empty/whitespace rows are filtered out.
 */
export function parseCSVNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete(results) {
        const rows = results.data as string[][];
        if (rows.length === 0) { resolve([]); return; }

        // Auto-detect header: if the first cell looks like a label (e.g. "Name", "Participant")
        // and NOT a real person name (heuristic: all-alpha, short, matches common headers)
        const HEADER_PATTERNS = /^(name|participant|entry|raffle|names?|person)$/i;
        const firstCell = (rows[0][0] ?? '').trim();
        const startRow = HEADER_PATTERNS.test(firstCell) ? 1 : 0;

        const names = rows
          .slice(startRow)
          .map((row) => (row[0] ?? '').trim())
          .filter(Boolean);

        resolve(names);
      },
      error(err) {
        reject(new Error(err.message));
      },
    });
  });
}

/**
 * Parses an Excel (.xlsx / .xls) file and returns name strings from
 * the first sheet's first column. Header row auto-detected same way as CSV.
 */
export function parseExcelNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (rows.length === 0) { resolve([]); return; }

        const HEADER_PATTERNS = /^(name|participant|entry|raffle|names?|person)$/i;
        const firstCell = (rows[0][0] ?? '').toString().trim();
        const startRow = HEADER_PATTERNS.test(firstCell) ? 1 : 0;

        const names = rows
          .slice(startRow)
          .map((row) => (row[0] ?? '').toString().trim())
          .filter(Boolean);

        resolve(names);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── EXPORT ────────────────────────────────────────────────────────────────

const WIN_HEADERS = ['Winner Name', 'Prize Won', 'Item', 'Timestamp'];

function winnersToRows(winners: WinnerRecord[]): (string | number)[][] {
  return [
    WIN_HEADERS,
    ...winners.map((w) => [
      w.participantName,
      w.prizeLabel,
      w.itemName,
      new Date(w.timestamp).toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    ]),
  ];
}

/** Downloads winners as a CSV file. */
export function exportWinnersCSV(winners: WinnerRecord[]): void {
  const csv = Papa.unparse(winnersToRows(winners));
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    'jeanys_olshoppe_winners.csv'
  );
}

/** Downloads winners as an XLSX file (SheetJS). */
export function exportWinnersXLSX(winners: WinnerRecord[]): void {
  const ws = XLSX.utils.aoa_to_sheet(winnersToRows(winners));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Winners');
  XLSX.writeFile(wb, 'jeanys_olshoppe_winners.xlsx');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 200);
}
