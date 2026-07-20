export interface PendingOfflineChange {
  id: string;
  type: 'status' | 'notes';
  listingId: string;
  value: string;
  timestamp: string;
}

const STORAGE_KEY = 'vatrio_pending_offline_sync_v1';

export function getPendingOfflineQueue(): PendingOfflineChange[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function enqueueOfflineChange(
  type: 'status' | 'notes',
  listingId: string,
  value: string
): PendingOfflineChange {
  const queue = getPendingOfflineQueue();
  // Filter out any older pending change for the same listing and type to prevent duplicate syncs
  const filtered = queue.filter((item) => !(item.listingId === listingId && item.type === type));

  const change: PendingOfflineChange = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    listingId,
    value,
    timestamp: new Date().toISOString(),
  };

  filtered.push(change);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return change;
}

export function clearPendingOfflineQueue(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function flushOfflineQueue(
  handler: (change: PendingOfflineChange) => Promise<void>
): Promise<number> {
  const queue = getPendingOfflineQueue();
  if (queue.length === 0) return 0;

  let syncedCount = 0;
  const remaining: PendingOfflineChange[] = [];

  for (const item of queue) {
    try {
      await handler(item);
      syncedCount++;
    } catch (err) {
      console.warn('Failed to sync offline item:', item, err);
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } else {
    clearPendingOfflineQueue();
  }

  return syncedCount;
}
