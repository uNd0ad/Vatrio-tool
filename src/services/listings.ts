import { supabase } from "../lib/supabaseClient";
import type { Listing } from "../types";

export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("date_scraped", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((listing) => ({
    ...listing,
    seller_type: listing.seller_type ?? "unknown",
    transaction_type: listing.transaction_type ?? "sale",
  })) as Listing[];
}

export async function updateListingStatus(
  id: string,
  status: Listing["status"]
): Promise<void> {
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

export async function updateListingNotes(
  id: string,
  notes: string
): Promise<void> {
  const { error } = await supabase.from("listings").update({ notes }).eq("id", id);
  if (error) throw error;
}
