import { FormEvent, useState } from "react";
import logoUrl from "../../favicon.png";
import { acceptInvitation, signIn } from "../services/auth";
import { APP_VERSION } from "../version";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{hidden ? <><path d="m3 3 18 18"/><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 6 9 6a16.8 16.8 0 0 1-2 2.7M6.6 6.6C4.3 8.1 3 10 3 10s3.5 6 9 6c1 0 1.9-.2 2.7-.5"/></> : <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/></>}</svg>;
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [mode, setMode] = useState<"login" | "activate">("login");
  const [token, setToken] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsVerification(false);
    setVerificationSent(false);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Autentificarea a eșuat";
      if (message.toLowerCase().includes("email not confirmed")) {
        setError("Contul există, dar adresa de email nu a fost confirmată.");
        setNeedsVerification(true);
      } else {
        setError(message === "Invalid login credentials" ? "Emailul sau parola sunt incorecte." : message);
      }
    } finally {
      setLoading(false);
    }
  }

  function openActivation() {
    setMode("activate");
    setNeedsVerification(false);
    setError(null);
  }

  async function handleActivation(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) { setError("Parola trebuie să aibă minimum 8 caractere."); return; }
    if (password !== confirmPassword) { setError("Parolele nu coincid."); return; }
    setLoading(true); setError(null);
    try {
      await acceptInvitation(email, token, password);
      setVerificationSent(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invitația nu a putut fi activată.";
      setError(message.toLowerCase().includes("expired") ? "Codul a expirat. Solicită administratorului o invitație nouă." : message);
    } finally { setLoading(false); }
  }

  return <main className="login-page">
    <section className="login-showcase">
      <div className="showcase-brand"><img src={logoUrl} alt=""/><div><strong>Vatrio</strong><span>Property CRM</span></div></div>
      <div className="showcase-copy"><span className="showcase-pill">SPAȚIU DE LUCRU PRIVAT</span><h1>Oportunitățile tale,<br/><em>într-un singur loc.</em></h1><p>Gestionează anunțurile imobiliare, urmărește conversațiile și ia decizii mai rapid.</p><div className="showcase-stats"><div><strong>100%</strong><span>Date securizate</span></div><div><strong>24/7</strong><span>Sincronizare activă</span></div></div></div>
      <p className="showcase-footer">Vatrio Internal Tools · Acces securizat · v{APP_VERSION}</p>
      <div className="showcase-glow glow-one"/><div className="showcase-glow glow-two"/>
    </section>
    <section className="login-panel">
      <form className="login-card" onSubmit={mode === "login" ? handleSubmit : handleActivation}>
        <div className="mobile-login-brand"><img src={logoUrl} alt=""/><strong>Vatrio</strong></div>
        <p className="login-eyebrow">{mode === "login" ? "BINE AI REVENIT" : "INVITAȚIE VATRIO"}</p><h2>{mode === "login" ? "Autentificare" : "Activează contul"}</h2><p className="login-subtitle">{mode === "login" ? "Introdu datele contului pentru a continua." : "Introdu codul primit prin email și alege parola."}</p>
        {error && <div className="login-error"><span>!</span><div>{error}{needsVerification && <button type="button" onClick={openActivation}>Introdu codul invitației</button>}</div></div>}
        {verificationSent && <div className="login-success"><span>✓</span><div><strong>Cont activat</strong>Autentificarea se finalizează automat.</div></div>}
        <label className="login-label">Adresă de email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nume@vatrio.ro" required autoFocus/></label>
        {mode === "activate" && <label className="login-label">Cod de activare<input className="token-input" inputMode="numeric" autoComplete="one-time-code" value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="000000" required/></label>}
        <label className="login-label">Parolă<div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Introdu parola" required/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ascunde parola" : "Arată parola"}><EyeIcon hidden={showPassword}/></button></div></label>
        {mode === "activate" && <label className="login-label">Confirmă parola<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repetă parola" required/></label>}
        <button className="login-submit" disabled={loading}>{loading ? <><span className="button-spinner"/>Se procesează...</> : <>{mode === "login" ? "Continuă" : "Activează contul"} <span>→</span></>}</button>
        <button className="auth-mode-button" type="button" onClick={() => { setMode(mode === "login" ? "activate" : "login"); setError(null); }}>{mode === "login" ? "Ai primit o invitație? Activează contul" : "Ai deja cont activ? Autentifică-te"}</button>
        <div className="secure-note"><span>✓</span><p><strong>Conexiune securizată</strong>Datele sunt protejate prin Supabase Auth.</p></div>
        <p className="login-version">Vatrio v{APP_VERSION}</p>
      </form>
    </section>
  </main>;
}
