import type { Listing } from "../types";
import olxLogo from "../assets/olx-logo.png";
import storiaLogo from "../assets/storia-logo.svg";
import imobiliareLogo from "../assets/imobiliare-logo.svg";

export function SourceMark({ source }: { source: Listing["source"] }) {
  if (source === "olx") {
    return <span className="source-logo olx"><img src={olxLogo} alt="OLX"/></span>;
  }
  if (source === "storia") {
    return <span className="source-logo storia"><img src={storiaLogo} alt="Storia"/></span>;
  }
  if (source === "imobiliare") {
    return <span className="source-logo imobiliare"><img src={imobiliareLogo} alt="Imobiliare"/></span>;
  }
  if (source === "homezz") {
    return <span className="source-logo" style={{ background: "#70b62c", color: "white", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "11px" }}>HomeZZ</span>;
  }
  if (source === "publi24") {
    return <span className="source-logo" style={{ background: "#0066cc", color: "white", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "11px" }}>Publi24</span>;
  }
  return <span className="source-logo default">{source}</span>;
}
