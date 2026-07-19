type TransactionType = "sale" | "rent";

export function inferTransactionType(title: string, fallback: TransactionType): TransactionType {
  const normalized = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/\b(de inchiriat|inchiriere|inchiriez|chirie)\b/.test(normalized)) return "rent";
  if (/\b(de vanzare|vanzare|vand|se vinde)\b/.test(normalized)) return "sale";
  return fallback;
}
