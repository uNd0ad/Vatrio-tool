import { Component, ErrorInfo, ReactNode } from "react";
import logoUrl from "../../favicon.png";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary a prins o eroare:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <main className="login-page">
          <section className="login-showcase">
            <div className="showcase-brand">
              <img src={logoUrl} alt="" />
              <div>
                <strong>Vatrio</strong>
                <span>Property CRM</span>
              </div>
            </div>
            <div className="showcase-copy">
              <span className="showcase-pill">SISTEM DE PROTECȚIE</span>
              <h1>A apărut o<br /><em>eroare neașteptată.</em></h1>
              <p>
                Aplicația a întâmpinat o problemă și a trebuit să se oprească pentru a proteja datele de sincronizare.
              </p>
            </div>
            <p className="showcase-footer">Securitate activă · Crash Recovery System</p>
            <div className="showcase-glow glow-one" />
            <div className="showcase-glow glow-two" />
          </section>
          <section className="login-panel" style={{ display: "grid", placeItems: "center" }}>
            <div className="login-card" style={{ textAlign: "left" }}>
              <h2 style={{ color: "#d85b5b", marginBottom: "15px" }}>Ops! Ceva nu a mers bine</h2>
              <p style={{ color: "#596674", fontSize: "13px", lineHeight: "1.6", marginBottom: "25px" }}>
                Detalii eroare:
                <code style={{
                  display: "block",
                  background: "#f1f3f5",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#e03131",
                  marginTop: "8px",
                  wordBreak: "break-all",
                  maxHeight: "150px",
                  overflowY: "auto"
                }}>
                  {this.state.error?.message || "Eroare necunoscută"}
                </code>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={this.handleReload}
                  className="primary-button"
                  style={{ cursor: "pointer", height: "42px", fontSize: "12px" }}
                >
                  Reîncarcă aplicația
                </button>
                <button
                  onClick={this.handleClearAndReload}
                  className="secondary-button"
                  style={{ cursor: "pointer", height: "42px", fontSize: "12px" }}
                >
                  Șterge cache și reîncarcă
                </button>
              </div>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
