export type PropertyType =
  | "apartment"
  | "house"
  | "land"
  | "commercial"
  | "office"
  | "garage"
  | "other";

/**
 * Normalizes property type string into standard canonical key.
 */
export function normalizePropertyType(raw: string | null | undefined): PropertyType {
  if (!raw || typeof raw !== "string") return "other";
  const normalized = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normalized) return "other";

  if (/\b(apartament|apartamente|garsoniera|garsoniere|studio|flat|penthouse)\b/i.test(normalized)) {
    return "apartment";
  }

  if (/\b(teren|terenuri|intravilan|extravilan|parcela|parcele|land)\b/i.test(normalized)) {
    return "land";
  }

  if (/\b(casa|case|vila|vile|house|duplex)\b/i.test(normalized)) {
    return "house";
  }

  if (/\b(comercial|comerciale|spatiu-comercial|spatii-comerciale|hala|hale|depozit|industrial)\b/i.test(normalized)) {
    return "commercial";
  }

  if (/\b(birou|birouri|office)\b/i.test(normalized)) {
    return "office";
  }

  if (/\b(garaj|garaje|parcare|parcari|garage)\b/i.test(normalized)) {
    return "garage";
  }

  return "other";
}

/**
 * Extracts property_type from URL path/query or title string.
 */
export function inferPropertyType(
  urlOrText: string | null | undefined,
  fallbackRaw: string | null | undefined = null
): PropertyType {
  if (!urlOrText && !fallbackRaw) return "other";

  if (fallbackRaw && fallbackRaw !== "other") {
    const direct = normalizePropertyType(fallbackRaw);
    if (direct !== "other") return direct;
  }

  const normalizedInput = (urlOrText || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/\b(apartament|apartamente|garsoniera|garsoniere|studio|flat|penthouse)\b/i.test(normalizedInput)) {
    return "apartment";
  }
  if (/\b(teren|terenuri|intravilan|extravilan|parcela|parcele)\b/i.test(normalizedInput)) {
    return "land";
  }
  if (/\b(casa|case|vila|vile|duplex)\b/i.test(normalizedInput)) {
    return "house";
  }
  if (/\b(comercial|comerciale|spatiu-comercial|spatii-comerciale|hala|hale|depozit)\b/i.test(normalizedInput)) {
    return "commercial";
  }
  if (/\b(birou|birouri|office)\b/i.test(normalizedInput)) {
    return "office";
  }
  if (/\b(garaj|garaje|parcare|parcari)\b/i.test(normalizedInput)) {
    return "garage";
  }

  return normalizePropertyType(fallbackRaw);
}
