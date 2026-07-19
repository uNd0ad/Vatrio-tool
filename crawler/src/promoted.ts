const PROMOTED_LABELS = [
  /\bpromovat(?:ă|a)?\b/i,
  /\bsponsorizat(?:ă|a)?\b/i,
  /\bsponsored\b/i,
  /\bpromoted\b/i,
  /\banunț\s+premium\b/i,
  /\banunt\s+premium\b/i,
  /\btop\s+ad\b/i,
];

export function isPromotedListing(cardText: string): boolean {
  return PROMOTED_LABELS.some((pattern) => pattern.test(cardText));
}
