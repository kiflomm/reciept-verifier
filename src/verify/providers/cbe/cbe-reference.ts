const NEW_CBE_URL_REGEX =
  /^https?:\/\/mbreciept\.cbe\.com\.et\/([A-Za-z0-9-]+)\/?$/i;
const NEW_CBE_TOKEN_REGEX = /^[A-Za-z0-9-]{15,40}$/;
const LEGACY_CBE_REFERENCE_REGEX = /^FT[A-Z0-9]{10}$/i;
const LEGACY_CBE_COMBINED_ID_REGEX = /^(FT[A-Z0-9]{10})(\d{8})$/i;

export function extractNewCbeToken(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(NEW_CBE_URL_REGEX);
  if (urlMatch) return urlMatch[1] ?? null;
  if (!trimmed.toUpperCase().startsWith('FT') && NEW_CBE_TOKEN_REGEX.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function isNewCbeReference(input: string): boolean {
  return extractNewCbeToken(input) !== null;
}

export function isLegacyCbeReference(reference: string): boolean {
  return LEGACY_CBE_REFERENCE_REGEX.test(reference.trim());
}

export function isLegacyCbeUrlReference(input: string): boolean {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    if (!/^https?:$/i.test(url.protocol)) return false;
    if (url.hostname.toLowerCase() !== 'apps.cbe.com.et') return false;
    if (url.port && url.port !== '100') return false;

    const combinedId = url.searchParams.get('id')?.trim();
    if (!combinedId) return false;

    return LEGACY_CBE_COMBINED_ID_REGEX.test(combinedId);
  } catch {
    return false;
  }
}

export function isLegacyCbeInput(input: string): boolean {
  return isLegacyCbeReference(input) || isLegacyCbeUrlReference(input);
}
