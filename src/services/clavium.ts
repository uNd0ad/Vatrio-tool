import { supabase } from "../lib/supabaseClient";

export type ClaviumStatus = "pending" | "synced" | "failed" | "matched" | "removed";

export interface ClaviumSyncRow {
  listing_id: string;
  clavium_id: string | null;
  status: ClaviumStatus;
  clavium_data: unknown | null;
  error: string | null;
  pushed_at: string | null;
  updated_at: string;
}

async function invokeClavium(body: Record<string, unknown>): Promise<{ pushed?: number; updated?: number }> {
  const { data, error } = await supabase.functions.invoke("clavium-sync", { body });
  // Edge Function-ul răspunde cu 501/502 și un corp explicativ; supabase-js
  // transformă non-2xx în `error`, dar mesajul util e în corpul răspunsului.
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const parsed = await context.json();
        if (parsed?.error) throw new Error(parsed.error);
      } catch (inner) {
        if (inner instanceof Error && inner.message) throw inner;
      }
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

/** Trimite anunțurile selectate către Clavium (sensul de ieșire). */
export async function pushListingsToClavium(listingIds: string[]): Promise<number> {
  const { pushed } = await invokeClavium({ action: "push", listingIds });
  return pushed ?? 0;
}

/** Aduce actualizările din Clavium (potriviri client, status) — sensul de intrare. */
export async function pullClaviumUpdates(since?: string): Promise<number> {
  const { updated } = await invokeClavium({ action: "pull", since });
  return updated ?? 0;
}

/** Starea de sincronizare Clavium pentru un anunț, dacă există. */
export async function fetchClaviumSync(listingId: string): Promise<ClaviumSyncRow | null> {
  const { data, error } = await supabase
    .from("clavium_sync")
    .select("listing_id, clavium_id, status, clavium_data, error, pushed_at, updated_at")
    .eq("listing_id", listingId)
    .maybeSingle();
  if (error) throw error;
  return (data as ClaviumSyncRow | null) ?? null;
}
