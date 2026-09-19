import {
  extractNewCbeToken,
  isLegacyCbeInput,
  isNewCbeReference,
} from './cbe-reference';

describe('cbe-reference', () => {
  describe('extractNewCbeToken', () => {
    it('extracts token from mbreciept URL', () => {
      expect(
        extractNewCbeToken(
          'https://mbreciept.cbe.com.et/AbCdEfGhIjKlMnOp',
        ),
      ).toBe('AbCdEfGhIjKlMnOp');
    });

    it('accepts bare new tokens', () => {
      expect(extractNewCbeToken('AbCdEfGhIjKlMnOpQr')).toBe(
        'AbCdEfGhIjKlMnOpQr',
      );
    });

    it('rejects legacy FT references', () => {
      expect(extractNewCbeToken('FT2513001V2G')).toBeNull();
    });
  });

  describe('isNewCbeReference', () => {
    it('returns true for valid new references', () => {
      expect(isNewCbeReference('AbCdEfGhIjKlMnOpQr')).toBe(true);
    });

    it('returns false for legacy FT references', () => {
      expect(isNewCbeReference('FT2513001V2G')).toBe(false);
    });
  });

  describe('isLegacyCbeInput', () => {
    it('detects FT references', () => {
      expect(isLegacyCbeInput('FT2513001V2G')).toBe(true);
    });

    it('detects legacy apps.cbe.com.et URLs', () => {
      expect(
        isLegacyCbeInput(
          'https://apps.cbe.com.et:100/?id=FT2513001V2G12345678',
        ),
      ).toBe(true);
    });

    it('returns false for new tokens', () => {
      expect(isLegacyCbeInput('AbCdEfGhIjKlMnOpQr')).toBe(false);
    });
  });
});
