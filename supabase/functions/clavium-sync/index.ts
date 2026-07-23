// Sincronizare bidirecțională cu platforma Clavium.
//
// Fără importuri: la fel ca trigger-crawl, un import „gol" ar cere import map la
// bundling și ar pica la deploy. Funcția validează tokenul apelantului printr-un
// fetch la /auth/v1/user și folosește cheia service_role pentru REST pe
// clavium_sync.
//
// Singurul loc unde se atinge API-ul real Clavium este `callClaviumApi`. Până
// când Clavium expune un API și se setează secretele CLAVIUM_API_URL /
// CLAVIUM_API_KEY, adaptorul raportează `configured: false` și funcția răspunde
// explicit că integrarea nu e configurată — nu eșuează tăcut.
// Contract complet: docs/CLAVIUM_INTEGRATION.md.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClaviumListingPayload {
  external_id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  property_type: string | null;
  surface_sqm: number | null;
  transaction_type: string;
  seller_type: string;
  image_url: string | null;
  listing_url: string;
  source: string;
}

type ClaviumResult =
  | { configured: false }
  | { configured: true; ok: true; records: Array<{ external_id: string; clavium_id: string; status: string; data?: unknown }> }
  | { configured: true; ok: false; error: string };

/**
 * PUNCTUL DE CONECTARE. Când Clavium are un API, aici se fac cererile reale
 * (push/pull). Contractul așteptat e în docs/CLAVIUM_INTEGRATION.md. Restul
 * funcției nu trebuie schimbat.
 */
async function callClaviumApi(
  action: "push" | "pull",
  payload: { listings?: ClaviumListingPayload[]; since?: string }
): Promise<ClaviumResult> {
  const apiUrl = Deno.env.get("CLAVIUM_API_URL");
  const apiKey = Deno.env.get("CLAVIUM_API_KEY");
  if (!apiUrl || !apiKey) return { configured: false };

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/${action === "push" ? "listings" : "listings/updates"}`, {
    method: action === "push" ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: action === "push" ? JSON.stringify({ listings: payload.listings }) : undefined,
  });
  if (!response.ok) {
    return { configured: true, ok: false, error: `Clavium a răspuns ${response.status}: ${(await response.text()).slice(0, 200)}` };
  }
  const body = await response.json();
  return { configured: true, ok: true, records: body.records ?? [] };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Autentificare necesară." }, 401);
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authorization, apikey: anonKey },
    });
    if (!userResponse.ok) return json({ error: "Sesiune invalidă." }, 401);

    const body = await request.json().catch(() => ({})) as { action?: string; listingIds?: string[]; since?: string };
    const action = body.action === "pull" ? "pull" : "push";
    const rest = (path: string, init?: RequestInit) =>
      fetch(`${supabaseUrl}/rest/v1/${path}`, {
        ...init,
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
      });

    if (action === "push") {
      const ids = Array.isArray(body.listingIds) ? body.listingIds.filter((id) => typeof id === "string") : [];
      if (ids.length === 0) return json({ error: "Niciun anunț de trimis." }, 400);

      const inClause = ids.map((id) => `"${id}"`).join(",");
      const listRes = await rest(`listings?select=id,title,price,currency,location,property_type,surface_sqm,transaction_type,seller_type,image_url,listing_url,source&id=in.(${inClause})`);
      if (!listRes.ok) return json({ error: "Nu s-au putut citi anunțurile." }, 500);
      const rows = await listRes.json() as Array<Record<string, unknown>>;

      const payload: ClaviumListingPayload[] = rows.map((r) => ({
        external_id: String(r.id),
        title: String(r.title ?? ""),
        price: (r.price as number) ?? null,
        currency: (r.currency as string) ?? null,
        location: (r.location as string) ?? null,
        property_type: (r.property_type as string) ?? null,
        surface_sqm: (r.surface_sqm as number) ?? null,
        transaction_type: String(r.transaction_type ?? "sale"),
        seller_type: String(r.seller_type ?? "unknown"),
        image_url: (r.image_url as string) ?? null,
        listing_url: String(r.listing_url ?? ""),
        source: String(r.source ?? ""),
      }));

      const result = await callClaviumApi("push", { listings: payload });
      if (!result.configured) {
        return json({ error: "Integrarea Clavium nu este configurată (lipsesc CLAVIUM_API_URL / CLAVIUM_API_KEY).", configured: false }, 501);
      }
      if (!result.ok) {
        await markStatus(rest, ids, "failed", result.error);
        return json({ error: result.error }, 502);
      }

      // Înregistrează starea per anunț din răspunsul Clavium.
      const now = new Date().toISOString();
      const upserts = result.records.map((rec) => ({
        listing_id: rec.external_id,
        clavium_id: rec.clavium_id,
        status: rec.status ?? "synced",
        clavium_data: rec.data ?? null,
        error: null,
        pushed_at: now,
      }));
      await rest("clavium_sync?on_conflict=listing_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(upserts),
      });
      return json({ success: true, pushed: upserts.length });
    }

    // action === "pull"
    const result = await callClaviumApi("pull", { since: body.since });
    if (!result.configured) {
      return json({ error: "Integrarea Clavium nu este configurată (lipsesc CLAVIUM_API_URL / CLAVIUM_API_KEY).", configured: false }, 501);
    }
    if (!result.ok) return json({ error: result.error }, 502);

    const now = new Date().toISOString();
    const upserts = result.records.map((rec) => ({
      listing_id: rec.external_id,
      clavium_id: rec.clavium_id,
      status: rec.status ?? "matched",
      clavium_data: rec.data ?? null,
      updated_at: now,
    }));
    if (upserts.length > 0) {
      await rest("clavium_sync?on_conflict=listing_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(upserts),
      });
    }
    return json({ success: true, updated: upserts.length });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Eroare internă." }, 500);
  }
});

async function markStatus(
  rest: (path: string, init?: RequestInit) => Promise<Response>,
  ids: string[],
  status: string,
  error: string | null
) {
  const now = new Date().toISOString();
  const rows = ids.map((id) => ({ listing_id: id, status, error, pushed_at: now }));
  await rest("clavium_sync?on_conflict=listing_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
