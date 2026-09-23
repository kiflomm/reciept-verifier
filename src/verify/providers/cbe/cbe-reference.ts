const CBE_URL_REGEX =
  /^https?:\/\/mbreciept\.cbe\.com\.et\/([A-Za-z0-9-]+)\/?$/i;
const CBE_TOKEN_REGEX = /^[A-Za-z0-9-]{15,40}$/;

export function extractCbeToken(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(CBE_URL_REGEX);
  if (urlMatch) return urlMatch[1] ?? null;
  if (CBE_TOKEN_REGEX.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function isCbeReference(input: string): boolean {
  return extractCbeToken(input) !== null;
}
