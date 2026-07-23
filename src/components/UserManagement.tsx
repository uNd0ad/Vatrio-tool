import { FormEvent, useEffect, useState } from "react";
import { deleteUser, inviteUser, listUsers, type ManagedUser } from "../services/admin";
import { ConfirmDialog } from "./ConfirmDialog";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function UserManagement({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<ManagedUser | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try { setUsers(await listUsers()); }
    catch (e) { setError(e instanceof Error ? e.message : "Utilizatorii nu au putut fi încărcați."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function submitInvite(event: FormEvent) {
    event.preventDefault(); setSending(true); setError(null); setSuccess(null);
    try {
      await inviteUser(email.trim(), name.trim());
      setSuccess(`Invitația a fost trimisă către ${email.trim()}.`);
      setEmail(""); setName(""); setShowInvite(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Invitația nu a putut fi trimisă."); }
    finally { setSending(false); }
  }

  async function remove(user: ManagedUser) {
    setError(null);
    try { await deleteUser(user.id); setUsers((current) => current.filter((item) => item.id !== user.id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Contul nu a putut fi șters."); }
    finally { setPendingRemove(null); }
  }

  return <div className="admin-overlay">
    <button className="admin-backdrop" onClick={onClose} aria-label="Închide"/>
    <section className="admin-modal">
      <header><div><p>ADMINISTRARE</p><h2>Utilizatori</h2><span>Invită și gestionează accesul la Vatrio.</span></div><div><button className="invite-button" onClick={() => setShowInvite((value) => !value)}>+ Invită utilizator</button><button className="admin-close" onClick={onClose}>×</button></div></header>
      {showInvite && <form className="invite-form" onSubmit={submitInvite}><label>Nume<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nume și prenume"/></label><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nume@companie.ro" required autoFocus/></label><button disabled={sending}>{sending ? "Se trimite..." : "Trimite invitația"}</button></form>}
      {error && <div className="admin-message error">{error}</div>}{success && <div className="admin-message success">{success}</div>}
      <div className="admin-table-wrap">{loading ? <div className="admin-loading"><div className="spinner"/>Se încarcă...</div> : <table className="admin-table"><thead><tr><th>UTILIZATOR</th><th>ROL</th><th>STATUS</th><th>ULTIMA AUTENTIFICARE</th><th/></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><div className="admin-user-cell"><span>{(user.name || user.email || "U").charAt(0).toUpperCase()}</span><div><strong>{user.name || "Fără nume"}</strong><small>{user.email}</small></div></div></td><td><span className={`role-badge ${user.role}`}>{user.role}</span></td><td><span className={`account-status ${user.confirmedAt ? "active" : "pending"}`}><i/>{user.confirmedAt ? "Activ" : "Invitat"}</span></td><td>{formatDate(user.lastSignInAt)}</td><td>{user.role !== "master" && <button className="delete-user" onClick={() => setPendingRemove(user)}>Șterge</button>}</td></tr>)}</tbody></table>}</div>
    </section>
    {pendingRemove && (
      <ConfirmDialog
        title={`Ștergi definitiv contul ${pendingRemove.email}?`}
        message="Contul și accesul asociat sunt eliminate permanent."
        confirmLabel="Șterge contul"
        danger
        onConfirm={() => void remove(pendingRemove)}
        onCancel={() => setPendingRemove(null)}
      />
    )}
  </div>;
}
