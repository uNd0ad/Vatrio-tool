import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import ListingsTable from "./components/ListingsTable";
import LoginScreen from "./components/LoginScreen";
import { supabase } from "./lib/supabaseClient";
import { getMyRole, getSession } from "./services/auth";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isMaster, setIsMaster] = useState(false);

  useEffect(() => {
    void getSession()
      .then(setSession)
      .finally(() => setCheckingSession(false));

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setCheckingSession(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsMaster(false);
      return;
    }
    void getMyRole().then((role) => setIsMaster(role === "master")).catch(() => setIsMaster(false));
  }, [session]);

  if (checkingSession) {
    return <div className="session-loader"><div className="spinner"/><span>Se pregătește Vatrio...</span></div>;
  }

  return session ? <ListingsTable userEmail={session.user.email ?? "Utilizator"} isMaster={isMaster}/> : <LoginScreen/>;
}
