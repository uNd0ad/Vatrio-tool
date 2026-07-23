import type { Listing } from "../types";
import olxLogo from "../assets/olx-logo.png";
import storiaLogo from "../assets/storia-logo.svg";
import imobiliareLogo from "../assets/imobiliare-logo.svg";
import homezzLogo from "../assets/homezz-logo.svg";
import publi24Logo from "../assets/publi24-logo.svg";

const SOURCE_LOGOS: Record<Listing["source"], { src: string; alt: string }> = {
  olx: { src: olxLogo, alt: "OLX" },
  storia: { src: storiaLogo, alt: "Storia" },
  imobiliare: { src: imobiliareLogo, alt: "Imobiliare" },
  homezz: { src: homezzLogo, alt: "HomeZZ" },
  publi24: { src: publi24Logo, alt: "Publi24" },
};

export function SourceMark({ source }: { source: Listing["source"] }) {
  const logo = SOURCE_LOGOS[source];
  if (!logo) {
    return <span className="source-logo default">{source}</span>;
  }
  return (
    <span className={`source-logo ${source}`}>
      <img src={logo.src} alt={logo.alt} />
    </span>
  );
}
