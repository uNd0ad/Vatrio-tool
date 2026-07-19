import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function acceptInvitation(
  email: string,
  token: string,
  password: string
): Promise<void> {
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.replace(/\s/g, ""),
    type: "invite",
  });
  if (verifyError) throw verifyError;
  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) throw passwordError;
}

export async function getMyRole(): Promise<"master" | "member"> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .maybeSingle();
  if (error) throw error;
  return data?.role === "master" ? "master" : "member";
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
