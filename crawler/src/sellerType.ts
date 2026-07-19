import type { RawListing } from "./db";

export function classifySellerType(text: string): RawListing["seller_type"] {
  const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/\b(proprietar|particular|persoana fizica)\b/.test(normalized)) return "owner";
  if (/\b(dezvoltator|constructor)\b/.test(normalized)) return "developer";
  if (/\b(agentie|agent imobiliar|comision|reprezentare)\b/.test(normalized)) return "agency";
  return "unknown";
}
