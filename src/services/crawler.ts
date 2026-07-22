import { supabase } from "../lib/supabaseClient";

export interface TriggerCrawlResult {
  message: string;
}

/**
 * Cere pornirea unui crawl. Tokenul GitHub stă în Edge Function, nu în
 * aplicație — la fel ca operațiile administrative din `manage-users`.
 */
export async function triggerCrawl(): Promise<TriggerCrawlResult> {
  const { data, error } = await supabase.functions.invoke("trigger-crawl", { body: {} });

  // Edge Function-ul răspunde cu 429/501/502 și un corp JSON explicativ;
  // supabase-js transformă statusul non-2xx în `error`, dar mesajul util e în
  // corp, deci îl citim de acolo când există.
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const body = await context.json();
        if (body?.error) throw new Error(body.error);
      } catch (parsed) {
        if (parsed instanceof Error && parsed.message) throw parsed;
      }
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);
  return { message: data?.message ?? "Crawlerul a fost pornit." };
}
