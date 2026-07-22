import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Crawlul durează minute; două cereri apropiate nu aduc date noi, doar rulări
// suprapuse care se calcă pe picioare la scriere. Sursa de adevăr pentru „rulează
// deja ceva?" e GitHub, nu `crawler_runs` — acolo rândul apare abia la final.
const MIN_INTERVAL_MS = 10 * 60 * 1000;

interface WorkflowRun {
  status: string;
  created_at: string;
}

async function activeOrRecentRun(
  repository: string,
  workflow: string,
  githubToken: string
): Promise<{ blocked: true; reason: string; retryAfterMinutes?: number } | { blocked: false }> {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/runs?per_page=5`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "vatrio-tool",
      },
    }
  );
  // Dacă interogarea eșuează nu blocăm declanșarea: cel mult pornește un crawl
  // în plus, ceea ce e preferabil unui buton care refuză fără motiv.
  if (!response.ok) return { blocked: false };

  const body = await response.json() as { workflow_runs?: WorkflowRun[] };
  const runs = body.workflow_runs ?? [];

  if (runs.some((run) => run.status === "queued" || run.status === "in_progress")) {
    return { blocked: true, reason: "Un crawl este deja în curs. Anunțurile apar când se termină." };
  }

  const latest = runs[0];
  if (latest?.created_at) {
    const elapsed = Date.now() - new Date(latest.created_at).getTime();
    if (elapsed < MIN_INTERVAL_MS) {
      const remaining = Math.ceil((MIN_INTERVAL_MS - elapsed) / 60000);
      return {
        blocked: true,
        reason: `Un crawl a pornit recent. Mai încearcă în ${remaining} ${remaining === 1 ? "minut" : "minute"}.`,
        retryAfterMinutes: remaining,
      };
    }
  }
  return { blocked: false };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const githubToken = Deno.env.get("GITHUB_DISPATCH_TOKEN");
    const repository = Deno.env.get("GITHUB_REPOSITORY") ?? "uNd0ad/Vatrio-tool";
    const workflow = Deno.env.get("GITHUB_CRAWLER_WORKFLOW") ?? "crawler.yml";
    const ref = Deno.env.get("GITHUB_CRAWLER_REF") ?? "dev";

    if (!githubToken) {
      return json({ error: "Declanșarea manuală nu este configurată (lipsește GITHUB_DISPATCH_TOKEN)." }, 501);
    }

    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Autentificare necesară." }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const token = authorization.replace(/^Bearer\s+/i, "");
    const { data: callerData, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !callerData.user) return json({ error: "Sesiune invalidă." }, 401);

    // Orice utilizator autentificat poate cere un crawl (spre deosebire de
    // manage-users, rezervat contului master) — nu modifică nimic, doar
    // reîmprospătează datele comune.
    const guard = await activeOrRecentRun(repository, workflow, githubToken);
    if (guard.blocked) {
      return json({ error: guard.reason, retryAfterMinutes: guard.retryAfterMinutes }, 429);
    }

    const response = await fetch(
      `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "vatrio-tool",
        },
        body: JSON.stringify({ ref }),
      }
    );

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      return json({ error: `GitHub a refuzat declanșarea (${response.status}): ${detail}` }, 502);
    }

    return json({
      success: true,
      message: "Crawlerul a fost pornit. Anunțurile noi apar în câteva minute.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare internă.";
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
