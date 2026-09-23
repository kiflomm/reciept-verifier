import { extractCbeToken, isCbeReference } from './cbe-reference';

describe('cbe-reference', () => {
  describe('extractCbeToken', () => {
    it('extracts token from mbreciept URL', () => {
      expect(
        extractCbeToken('https://mbreciept.cbe.com.et/AbCdEfGhIjKlMnOp'),
      ).toBe('AbCdEfGhIjKlMnOp');
    });

    it('accepts bare tokens', () => {
      expect(extractCbeToken('AbCdEfGhIjKlMnOpQr')).toBe(
        'AbCdEfGhIjKlMnOpQr',
      );
    });

    it('rejects short or invalid references', () => {
      expect(extractCbeToken('FT2513001V2G')).toBeNull();
      expect(extractCbeToken('short')).toBeNull();
    });
  });

  describe('isCbeReference', () => {
    it('returns true for valid references', () => {
      expect(isCbeReference('AbCdEfGhIjKlMnOpQr')).toBe(true);
      expect(
        isCbeReference('https://mbreciept.cbe.com.et/AbCdEfGhIjKlMnOp'),
      ).toBe(true);
    });

    it('returns false for unsupported references', () => {
      expect(isCbeReference('FT2513001V2G')).toBe(false);
      expect(isCbeReference('short')).toBe(false);
    });
  });
});
