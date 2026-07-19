import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody =
  | { action: "list" }
  | { action: "invite"; email: string; name?: string }
  | { action: "delete"; userId: string };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Autentificare necesară." }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const token = authorization.replace(/^Bearer\s+/i, "");
    const { data: callerData, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !callerData.user) return json({ error: "Sesiune invalidă." }, 401);

    const { data: callerRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerData.user.id)
      .maybeSingle();
    if (callerRole?.role !== "master") return json({ error: "Acces rezervat contului master." }, 403);

    const body = await request.json() as RequestBody;
    if (body.action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const { data: roles, error: rolesError } = await admin.from("user_roles").select("user_id, role");
      if (rolesError) throw rolesError;
      const roleMap = new Map((roles ?? []).map((item) => [item.user_id, item.role]));
      return json({ users: data.users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? null,
        role: roleMap.get(user.id) ?? "member",
        confirmedAt: user.email_confirmed_at,
        invitedAt: user.invited_at,
        lastSignInAt: user.last_sign_in_at,
        createdAt: user.created_at,
      })) });
    }

    if (body.action === "invite") {
      const email = body.email.trim().toLowerCase();
      if (!email) return json({ error: "Adresa de email este obligatorie." }, 400);
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { name: body.name?.trim() || undefined },
      });
      if (error) throw error;
      if (data.user) {
        const { error: roleError } = await admin.from("user_roles").upsert({
          user_id: data.user.id,
          role: "member",
        }, { onConflict: "user_id" });
        if (roleError) throw roleError;
      }
      return json({ userId: data.user?.id });
    }

    if (body.action === "delete") {
      if (body.userId === callerData.user.id) return json({ error: "Contul master activ nu poate fi șters." }, 400);
      const { data: targetRole } = await admin.from("user_roles").select("role").eq("user_id", body.userId).maybeSingle();
      if (targetRole?.role === "master") return json({ error: "Un alt cont master nu poate fi șters de aici." }, 400);
      const { error } = await admin.auth.admin.deleteUser(body.userId);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Acțiune necunoscută." }, 400);
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

