import { supabase } from "../lib/supabaseClient";

export interface ManagedUser {
  id: string;
  email: string | null;
  name: string | null;
  role: "master" | "member";
  confirmedAt: string | null;
  invitedAt: string | null;
  lastSignInAt: string | null;
  createdAt: string;
}

async function manageUsers<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("manage-users", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export async function listUsers(): Promise<ManagedUser[]> {
  const data = await manageUsers<{ users: ManagedUser[] }>({ action: "list" });
  return data.users;
}

export async function inviteUser(email: string, name: string): Promise<void> {
  await manageUsers({ action: "invite", email, name });
}

export async function deleteUser(userId: string): Promise<void> {
  await manageUsers({ action: "delete", userId });
}
