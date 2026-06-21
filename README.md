# Jeany's Olshoppe Anniversary — Lucky Spin Roulette 🎡

A production-ready React + TypeScript single-page application for running a live raffle/roulette wheel event, built with Vite + Tailwind CSS + Framer Motion.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 🏗️ Tech Stack

| Layer | Library |
|-------|---------|
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS + custom CSS tokens |
| Animations | Framer Motion |
| Confetti | canvas-confetti |
| Sound | Web Audio API (synthesised, no file assets) |
| CSV Import | PapaParse |
| Excel Import/Export | SheetJS (xlsx) |
| Persistence | localStorage (custom `usePersistedState` hook) |

---

## 📂 File Structure

```
src/
├── components/
│   ├── Wheel.tsx              ← HTML5 Canvas roulette wheel
│   ├── ControlPanel.tsx       ← Sequential prize spin buttons
│   ├── WinnerModal.tsx        ← Full-screen winner announcement
│   ├── WinnersTable.tsx       ← Live winners ledger
│   ├── ParticipantManager.tsx ← Admin panel (add / import / export / reset)
│   ├── PrizeProgress.tsx      ← Prize completion tracker
│   └── ConfettiLayer.tsx      ← Sparkle background + toast notifications
├── hooks/
│   ├── useWheel.ts            ← RAF spin animation + winner selection
│   ├── usePersistedState.ts   ← localStorage-backed useState
│   └── useSound.ts            ← Web Audio API synthesised sounds
├── types/
│   └── index.ts               ← All TypeScript types
├── utils/
│   ├── weightedRandom.ts      ← pickRandomEligible() + markPersonAsWon()
│   ├── csvImportExport.ts     ← PapaParse CSV + SheetJS Excel utils
│   └── idGenerator.ts         ← crypto.randomUUID() with fallback
├── data/
│   └── initialState.ts        ← Hardcoded prize sequence
├── App.tsx                    ← Root component + state orchestration
├── main.tsx                   ← Vite entry point
└── index.css                  ← Design system + global styles
```

---

## 💾 How localStorage Persistence Works

All three state slices are persisted independently:

| Key | Contents |
|-----|----------|
| `jeanys_participants` | Array of `Participant` objects (all entries, including won) |
| `jeanys_prizes` | Array of `Prize` objects with `isDrawn` flags |
| `jeanys_winners` | Array of `WinnerRecord` objects |

On **every state change** the `usePersistedState` hook serialises the new value to `localStorage.setItem()`. On **first mount** it reads from `localStorage.getItem()` and parses JSON (falls back to the `initialValue` if missing or corrupt).

This means **the app survives page refreshes** — all spun results, participant lists, and prize states are remembered across browser sessions.

---

## 🔄 How to Reset Data Manually

### Option A — In-app Reset (recommended)
1. Open the **Admin Panel** → **Reset tab**.
2. Type `RESET` (all caps) in the confirmation input.
3. Click **Reset All Data**.

### Option B — Browser DevTools
1. Open DevTools → **Application** → **Local Storage** → your origin.
2. Delete these three keys:
   - `jeanys_participants`
   - `jeanys_prizes`
   - `jeanys_winners`
3. Refresh the page.

### Option C — Console one-liner
```js
['jeanys_participants','jeanys_prizes','jeanys_winners'].forEach(k => localStorage.removeItem(k)); location.reload();
```

---

## 🎯 Key Design Decisions & Assumptions

1. **Winner picked BEFORE animation** — `pickRandomEligible()` is called at spin start; the exact rotation angle is calculated to land the pointer on that participant's segment. This prevents animation/state desync bugs.

2. **One winner per person** — When someone wins, `markPersonAsWon()` sets `hasWon = true` on **all** entries sharing the same normalised name (trim + lowercase comparison). Their segments remain visible on the wheel (greyed out, 40% opacity, ✓ watermark) but are excluded from future `pickRandomEligible()` calls.

3. **Sequential prize order** — Each spin button is locked until all prior prizes in the sequence are `isDrawn = true`. The lock is enforced both in the UI (disabled buttons + tooltip) and in `useWheel.ts` (early return guard).

4. **No audio files** — Sounds are synthesised via the Web Audio API. The spin tick is a 90ms interval of short square-wave bursts; the win jingle is a C-major arpeggio (C5–E5–G5–C6) with a noise drum hit.

5. **Consolation prizes are independent** — Each of the 10 consolation prizes has its own `isDrawn` flag. They unlock sequentially after the Third Prize and after each prior consolation prize is drawn.

6. **No backend** — 100% client-side. Data lives only in the browser's localStorage.

---

## 🏆 Prize Sequence

| # | Icon | Label | Item |
|---|------|-------|------|
| 1 | 🏆 | Grand Prize | Japan Cabinet |
| 2 | 🥇 | First Prize | Japan Displayer |
| 3 | 🥈 | Second Prize | Brand New Phone |
| 4 | 🥉 | Third Prize | ₱500 GCash |
| 5–14 | 🎁 | Consolation Prize #1–#10 | Consolation Gift #1–#10 |

> To change prize item names, edit `/src/data/initialState.ts` and clear localStorage to apply.

---

## 📦 Build for Production

```bash
npm run build
# Output: ./dist/
```

Serve with any static host (Netlify, Vercel, GitHub Pages, etc.).
