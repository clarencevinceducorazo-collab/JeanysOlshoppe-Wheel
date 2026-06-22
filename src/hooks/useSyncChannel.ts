import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Participant, Prize, WinnerRecord } from '../types';

export interface SyncStatePayload {
  prizes: Prize[];
  winners: WinnerRecord[];
  participants: Participant[];
}

export interface SpinPayload {
  prizeIndex: number;
  winner: Participant;
  finalItemName: string;
}

interface UseSyncChannelOptions {
  role: 'viewer' | 'admin' | null;
  isReady: boolean;
  // Local state references (for admin broadcasting)
  prizes: Prize[];
  winners: WinnerRecord[];
  participants: Participant[];
  
  // Callbacks for receiving events
  onSpinRemote?: (payload: SpinPayload) => void;
  onSyncStateRemote?: (payload: SyncStatePayload) => void;
  onRestartRemote?: () => void;
}

export function useSyncChannel({
  role,
  isReady,
  prizes,
  winners,
  participants,
  onSpinRemote,
  onSyncStateRemote,
  onRestartRemote,
}: UseSyncChannelOptions) {
  
  // Keep mutable references to latest state & callbacks to avoid recreating the channel
  const stateRef = useRef({ prizes, winners, participants });
  const callbacksRef = useRef({ onSpinRemote, onSyncStateRemote, onRestartRemote });

  useEffect(() => {
    stateRef.current = { prizes, winners, participants };
  }, [prizes, winners, participants]);

  useEffect(() => {
    callbacksRef.current = { onSpinRemote, onSyncStateRemote, onRestartRemote };
  }, [onSpinRemote, onSyncStateRemote, onRestartRemote]);
  
  const broadcastSyncState = useCallback(async () => {
    if (role !== 'admin' || !isReady) return;
    const payload = stateRef.current as SyncStatePayload;

    await supabase.channel('roulette-room').send({
      type: 'broadcast',
      event: 'SYNC_STATE',
      payload,
    });

    // Save to global Supabase row (fire and forget)
    supabase.from('participants').upsert({
      id: '00000000-0000-0000-0000-000000000000',
      name: JSON.stringify({ prizes: payload.prizes, winners: payload.winners }),
      hasWon: false
    }).then(({ error }) => {
      if (error) console.error("Global state sync failed", error);
    });
  }, [role]);

  const broadcastSpin = useCallback(async (payload: SpinPayload) => {
    if (role !== 'admin') return;
    await supabase.channel('roulette-room').send({
      type: 'broadcast',
      event: 'SPIN_TRIGGERED',
      payload,
    });
  }, [role]);

  const broadcastRestart = useCallback(async () => {
    if (role !== 'admin' || !isReady) return;
    await supabase.channel('roulette-room').send({
      type: 'broadcast',
      event: 'RESTART_DRAW',
    });
  }, [role, isReady]);

  // Setup channel ONCE per role change
  useEffect(() => {
    if (!isReady || !role) return;
    const channel = supabase.channel('roulette-room');

    channel
      .on('broadcast', { event: 'REQUEST_SYNC' }, () => {
        if (role === 'admin') broadcastSyncState();
      })
      .on('broadcast', { event: 'SYNC_STATE' }, ({ payload }) => {
        if (role === 'viewer') {
          callbacksRef.current.onSyncStateRemote?.(payload as SyncStatePayload);
        }
      })
      .on('broadcast', { event: 'SPIN_TRIGGERED' }, ({ payload }) => {
        if (role === 'viewer') {
          callbacksRef.current.onSpinRemote?.(payload as SpinPayload);
        }
      })
      .on('broadcast', { event: 'RESTART_DRAW' }, () => {
        if (role === 'viewer') {
          callbacksRef.current.onRestartRemote?.();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && role === 'viewer') {
          channel.send({
            type: 'broadcast',
            event: 'REQUEST_SYNC',
          });
        }
        if (status === 'SUBSCRIBED' && role === 'admin') {
            broadcastSyncState();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, isReady, broadcastSyncState]); // No more state/callback churn!

  // Automatically broadcast Admin state when it changes
  useEffect(() => {
    if (role === 'admin' && isReady) {
      broadcastSyncState();
    }
  }, [role, isReady, prizes, winners, participants, broadcastSyncState]);

  return {
    broadcastSpin,
    broadcastRestart,
    broadcastSyncState,
  };
}
