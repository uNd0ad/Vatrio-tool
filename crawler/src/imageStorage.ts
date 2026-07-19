import { createHash } from "node:crypto";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_LISTING_IMAGE_BYTES = 8 * 1024 * 1024;

export function listingImageObjectPath(listingUrl: string, contentType: string): string | null {
  const extension = EXTENSIONS[contentType.toLowerCase()];
  if (!extension) return null;
  const digest = createHash("sha256").update(listingUrl).digest("hex");
  return `${digest.slice(0, 2)}/${digest}.${extension}`;
}

export function isValidListingImage(contentType: string, byteLength: number): boolean {
  return Boolean(EXTENSIONS[contentType.toLowerCase()]) && byteLength > 0 && byteLength <= MAX_LISTING_IMAGE_BYTES;
}
