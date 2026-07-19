import React, { useMemo, useState } from "react";
import type { Listing, TransactionType } from "../types";

interface VisualAnalyticsProps {
  listings: Listing[];
}

const MAJOR_CITIES = ["București", "Cluj-Napoca", "Iași", "Timișoara", "Constanța", "Brașov", "Craiova", "Oradea", "Sibiu"] as const;
type MajorCity = typeof MAJOR_CITIES[number];

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function transactionFromListing(listing: Listing): TransactionType {
  const title = normalizeText(listing.title);
  if (/\b(de inchiriat|inchiriere|inchiriez|chirie)\b/.test(title)) return "rent";
  if (/\b(de vanzare|vanzare|vand|se vinde)\b/.test(title)) return "sale";
  return listing.transaction_type;
}

function belongsToCity(listing: Listing, city: MajorCity) {
  const haystack = normalizeText(`${listing.location ?? ""} ${listing.title}`);
  const aliases: Record<MajorCity, string[]> = {
    "București": ["bucuresti"], "Cluj-Napoca": ["cluj-napoca", "cluj napoca"], "Iași": ["iasi"],
    "Timișoara": ["timisoara"], "Constanța": ["constanta"], "Brașov": ["brasov"],
    "Craiova": ["craiova"], "Oradea": ["oradea"], "Sibiu": ["sibiu"],
  };
  return aliases[city].some((alias) => haystack.includes(alias));
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ listings }) => {
  const [cityView, setCityView] = useState<MajorCity>("Timișoara");
  const [transactionView, setTransactionView] = useState<TransactionType>("sale");
  const cityListings = useMemo(() => listings.filter((listing) => belongsToCity(listing, cityView)), [listings, cityView]);
  const cityCounts = useMemo(() => Object.fromEntries(MAJOR_CITIES.map((city) => [city, listings.filter((listing) => belongsToCity(listing, city)).length])) as Record<MajorCity, number>, [listings]);
  const saleCount = cityListings.filter((listing) => transactionFromListing(listing) === "sale").length;
  const rentCount = cityListings.filter((listing) => transactionFromListing(listing) === "rent").length;
  const scopedListings = useMemo(
    () => cityListings.filter((listing) => transactionFromListing(listing) === transactionView),
    [cityListings, transactionView]
  );
  const stats = useMemo(() => {
    const total = scopedListings.length;
    if (total === 0) {
      return {
        total: 0,
        avgPrice: 0,
        avgPricePerSqm: 0,
        ownerPct: 0,
        agencyPct: 0,
        developerPct: 0,
        priceRanges: [],
        locations: [],
        sources: [],
      };
    }

    // Filter valid prices
    const withPrices = scopedListings.filter((l) => l.price !== null && l.price > 0);
    const totalPrice = withPrices.reduce((acc, l) => acc + (l.price ?? 0), 0);
    const avgPrice = withPrices.length > 0 ? Math.round(totalPrice / withPrices.length) : 0;

    // Filter valid price/sqm
    const withSqm = scopedListings.filter((l) => l.price !== null && l.price > 0 && l.surface_sqm !== null && l.surface_sqm > 0);
    const totalSqmRate = withSqm.reduce((acc, l) => acc + (l.price! / l.surface_sqm!), 0);
    const avgPricePerSqm = withSqm.length > 0 ? Math.round(totalSqmRate / withSqm.length) : 0;

    // Seller types
    const owners = scopedListings.filter((l) => l.seller_type === "owner").length;
    const agencies = scopedListings.filter((l) => l.seller_type === "agency").length;
    const developers = scopedListings.filter((l) => l.seller_type === "developer").length;
    const ownerPct = Math.round((owners / total) * 100);
    const agencyPct = Math.round((agencies / total) * 100);
    const developerPct = Math.round((developers / total) * 100);

    // Price ranges
    const bounds = transactionView === "sale" ? [50000, 75000, 100000, 150000] : [500, 750, 1000, 1500];
    const [bound1, bound2, bound3, bound4] = bounds;
    const range1 = withPrices.filter((l) => l.price! < bound1).length;
    const range2 = withPrices.filter((l) => l.price! >= bound1 && l.price! < bound2).length;
    const range3 = withPrices.filter((l) => l.price! >= bound2 && l.price! < bound3).length;
    const range4 = withPrices.filter((l) => l.price! >= bound3 && l.price! < bound4).length;
    const range5 = withPrices.filter((l) => l.price! >= bound4).length;

    const formatBound = (value: number) => new Intl.NumberFormat("ro-RO").format(value);

    const priceRanges = [
      { label: `< ${formatBound(bound1)} €`, count: range1, pct: Math.round((range1 / (withPrices.length || 1)) * 100) },
      { label: `${formatBound(bound1)} € - ${formatBound(bound2)} €`, count: range2, pct: Math.round((range2 / (withPrices.length || 1)) * 100) },
      { label: `${formatBound(bound2)} € - ${formatBound(bound3)} €`, count: range3, pct: Math.round((range3 / (withPrices.length || 1)) * 100) },
      { label: `${formatBound(bound3)} € - ${formatBound(bound4)} €`, count: range4, pct: Math.round((range4 / (withPrices.length || 1)) * 100) },
      { label: `> ${formatBound(bound4)} €`, count: range5, pct: Math.round((range5 / (withPrices.length || 1)) * 100) },
    ];

    // Neighborhood analysis
    const locMap = new Map<string, { totalRate: number; count: number }>();
    withSqm.forEach((l) => {
      const locName = l.location ? l.location.split(",")[0].trim() : "Nespecificată";
      const current = locMap.get(locName) || { totalRate: 0, count: 0 };
      locMap.set(locName, {
        totalRate: current.totalRate + (l.price! / l.surface_sqm!),
        count: current.count + 1,
      });
    });

    const locations = Array.from(locMap.entries())
      .map(([name, data]) => ({
        name,
        avgRate: Math.round(data.totalRate / data.count),
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Sources analysis
    const olxCount = scopedListings.filter((l) => l.source === "olx").length;
    const storiaCount = scopedListings.filter((l) => l.source === "storia").length;
    const imobiliareCount = scopedListings.filter((l) => l.source === "imobiliare").length;

    const sources = [
      { name: "OLX.ro", count: olxCount, color: "#002f34", pct: Math.round((olxCount / total) * 100) },
      { name: "Storia.ro", count: storiaCount, color: "#ff5a00", pct: Math.round((storiaCount / total) * 100) },
      { name: "Imobiliare.ro", count: imobiliareCount, color: "#d9381e", pct: Math.round((imobiliareCount / total) * 100) },
    ];

    return {
      total,
      avgPrice,
      avgPricePerSqm,
      ownerPct,
      agencyPct,
      developerPct,
      owners,
      agencies,
      developers,
      priceRanges,
      locations,
      sources,
    };
  }, [scopedListings, transactionView]);

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", width: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-main)" }}>Analiză Vizuală & Piață</h2>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
          Statistici pentru {cityView}, bazate pe {stats.total} anunțuri {transactionView === "sale" ? "de vânzare" : "de închiriat"}.
        </p>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "360px", color: "var(--text-secondary)", fontSize: "11px", fontWeight: 700 }}>
        ORAȘ ANALIZAT
        <select value={cityView} onChange={(event) => setCityView(event.target.value as MajorCity)} style={{ height: "40px", border: "1px solid var(--panel-toolbar-border)", borderRadius: "9px", padding: "0 12px", background: "var(--card-bg)", color: "var(--text-main)", fontWeight: 600 }}>
          {MAJOR_CITIES.map((city) => <option key={city} value={city}>{city} ({cityCounts[city]})</option>)}
        </select>
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px", padding: "5px", background: "var(--table-header-bg, #f4f6f8)", borderRadius: "12px" }}>
        {(["sale", "rent"] as const).map((type) => {
          const active = transactionView === type;
          return <button key={type} onClick={() => setTransactionView(type)} style={{ border: active ? "1px solid #1a73e8" : "1px solid transparent", borderRadius: "9px", padding: "12px", background: active ? "var(--card-bg, #fff)" : "transparent", color: "var(--text-main)", fontWeight: 700, cursor: "pointer" }}>{type === "sale" ? "De vânzare" : "De închiriat"} · {type === "sale" ? saleCount : rentCount}</button>;
        })}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--panel-toolbar-border, #e2e8f0)", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Proprietăți</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1a73e8", marginTop: "6px" }}>{stats.total}</div>
        </div>

        <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--panel-toolbar-border, #e2e8f0)", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Preț Mediu</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#2b8a3e", marginTop: "6px" }}>
            {stats.avgPrice.toLocaleString()} €
          </div>
        </div>

        <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--panel-toolbar-border, #e2e8f0)", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Preț Mediu / m²</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#e8590c", marginTop: "6px" }}>
            {stats.avgPricePerSqm.toLocaleString()} €/m²
          </div>
        </div>

        <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--panel-toolbar-border, #e2e8f0)", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rată Proprietari Directi</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#9c36b5", marginTop: "6px" }}>{stats.ownerPct}%</div>
        </div>
      </div>

      {/* Grid Row 1: Seller breakdown & Source share */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Seller Type Distribution */}
        <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--panel-toolbar-border, #e2e8f0)", borderRadius: "12px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>Distribuție Vânzători</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                <span>Proprietari ({stats.owners})</span>
                <span>{stats.ownerPct}%</span>
              </div>
              <div style={{ background: "var(--panel-toolbar-border, #edf2f7)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${stats.ownerPct}%`, background: "#2b8a3e", height: "100%", transition: "width 0.4s ease" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                <span>Agenții ({stats.agencies})</span>
                <span>{stats.agencyPct}%</span>
              </div>
              <div style={{ background: "var(--panel-toolbar-border, #edf2f7)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${stats.agencyPct}%`, background: "#1a73e8", height: "100%", transition: "width 0.4s ease" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                <span>Dezvoltatori ({stats.developers})</span>
                <span>{stats.developerPct}%</span>
              </div>
              <div style={{ background: "var(--panel-toolbar-border, #edf2f7)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${stats.developerPct}%`, background: "#e8590c", height: "100%", transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Portal Market Share */}
        <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--panel-toolbar-border, #e2e8f0)", borderRadius: "12px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>Portale de Proveniență</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {stats.sources.map((src) => (
              <div key={src.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  <span>{src.name} ({src.count})</span>
                  <span>{src.pct}%</span>
                </div>
                <div style={{ background: "var(--panel-toolbar-border, #edf2f7)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${src.pct}%`, background: src.color, height: "100%", transition: "width 0.4s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Row 2: Price Tiers & Neighborhood Rates */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Price Tiers */}
        <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--panel-toolbar-border, #e2e8f0)", borderRadius: "12px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>Intervale de Preț</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stats.priceRanges.map((range) => (
              <div key={range.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  <span>{range.label}</span>
                  <span>{range.count} ad-uri ({range.pct}%)</span>
                </div>
                <div style={{ background: "var(--panel-toolbar-border, #edf2f7)", height: "7px", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${range.pct}%`, background: "#4c6ef5", height: "100%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Neighborhood Top €/m² */}
        <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--panel-toolbar-border, #e2e8f0)", borderRadius: "12px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>Top Zone după Preț / m²</h3>
          
          {stats.locations.length === 0 ? (
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>Nu există suficiente date de locație.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {stats.locations.map((loc, idx) => (
                <div key={loc.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--table-header-bg, #f8fafc)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, width: "18px", color: "var(--text-secondary)" }}>#{idx + 1}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>{loc.name}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#e8590c" }}>{loc.avgRate} €/m²</span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginLeft: "8px" }}>({loc.count} ad-uri)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
