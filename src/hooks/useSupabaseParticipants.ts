import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Participant, Prize } from '../types';
import { generateId } from '../utils/idGenerator';

/**
 * useSupabaseParticipants
 *
 * Replaces localStorage for participant state with Supabase.
 * - Fetches all participants on mount (ordered by created_at).
 * - Provides add, remove, markWon, resetAll CRUD helpers.
 */
export function useSupabaseParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [globalMetadata, setGlobalMetadata] = useState<{ prizes: Prize[], winners: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all participants from Supabase ─────────────────────────────────
  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: true });

      if (err) throw err;

      const metaRow = (data ?? []).find(r => r.id === '00000000-0000-0000-0000-000000000000');
      if (metaRow && metaRow.name) {
        try {
          setGlobalMetadata(JSON.parse(metaRow.name));
        } catch(e) {}
      }

      const mapped: Participant[] = (data ?? [])
        .filter((row) => row.id !== '00000000-0000-0000-0000-000000000000')
        .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        hasWon: row.hasWon as boolean,
      }));
      setParticipants(mapped);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // ── Add participants ─────────────────────────────────────────────────────
  const addParticipants = useCallback(async (names: string[]) => {
    const rows = names.map((name) => ({
      id: generateId(),
      name: name.trim(),
      hasWon: false,
    }));

    const { error: err } = await supabase.from('participants').insert(rows);
    if (err) {
      console.error('Error adding participants:', err);
      return;
    }
    // Add optimistically
    setParticipants((prev) => [
      ...prev,
      ...rows.map((r) => ({ id: r.id, name: r.name, hasWon: false })),
    ]);
  }, []);

  // ── Remove participant(s) by display name ────────────────────────────────
  const removeParticipant = useCallback(async (targetName: string) => {
    const normalized = targetName.trim().toLowerCase();

    const { error: err } = await supabase
      .from('participants')
      .delete()
      .ilike('name', normalized);

    if (err) {
      console.error('Error removing participant:', err);
      return;
    }
    setParticipants((prev) =>
      prev.filter((p) => p.name.trim().toLowerCase() !== normalized)
    );
  }, []);

  // ── Mark a single participant as won ─────────────────────────────────────
  const markWon = useCallback(async (name: string) => {
    const normalized = name.trim().toLowerCase();

    // Update all entries with this name
    const { error: err } = await supabase
      .from('participants')
      .update({ hasWon: true })
      .ilike('name', normalized);

    if (err) {
      console.error('Error marking participant as won:', err);
      return;
    }
    setParticipants((prev) =>
      prev.map((p) =>
        p.name.trim().toLowerCase() === normalized ? { ...p, hasWon: true } : p
      )
    );
  }, []);

  // ── Reset all (delete all rows) ──────────────────────────────────────────
  const resetAll = useCallback(async () => {
    const { error: err } = await supabase
      .from('participants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

    if (err) {
      console.error('Error resetting participants:', err);
      return;
    }
    setParticipants([]);
  }, []);

  // ── Shuffle participants (local only — order is persisted on next write) ─
  const shuffleParticipants = useCallback(() => {
    setParticipants((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  }, []);

  return {
    participants,
    setParticipants,
    loading,
    error,
    addParticipants,
    removeParticipant,
    markWon,
    resetAll,
    shuffleParticipants,
    refetch: fetchParticipants,
    globalMetadata,
  };
}
