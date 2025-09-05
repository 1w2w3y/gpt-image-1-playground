import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReadonlyURLSearchParams } from 'next/navigation';
import {
  getLocaleFromUrl,
  getLocaleFromCurrentUrl,
  updateUrlWithLocale,
  createUrlWithLocale,
  isValidLanguage,
  supportedLanguages,
  type SupportedLanguage
} from '@/lib/locale-utils';

describe('locale-utils', () => {
  describe('supportedLanguages', () => {
    it('contains expected languages', () => {
      expect(supportedLanguages).toEqual(['en', 'zh']);
    });
  });

  describe('getLocaleFromUrl', () => {
    it('returns locale from lang parameter', () => {
      const searchParams = new URLSearchParams('lang=en');
      const result = getLocaleFromUrl(searchParams);
      expect(result).toBe('en');
    });

    it('returns locale from locale parameter', () => {
      const searchParams = new URLSearchParams('locale=zh');
      const result = getLocaleFromUrl(searchParams);
      expect(result).toBe('zh');
    });

    it('prefers lang parameter over locale parameter', () => {
      const searchParams = new URLSearchParams('lang=en&locale=zh');
      const result = getLocaleFromUrl(searchParams);
      expect(result).toBe('en');
    });

    it('returns null for unsupported language', () => {
      const searchParams = new URLSearchParams('lang=fr');
      const result = getLocaleFromUrl(searchParams);
      expect(result).toBeNull();
    });

    it('returns null when no language parameter present', () => {
      const searchParams = new URLSearchParams('other=value');
      const result = getLocaleFromUrl(searchParams);
      expect(result).toBeNull();
    });

    it('returns null for empty parameter value', () => {
      const searchParams = new URLSearchParams('lang=');
      const result = getLocaleFromUrl(searchParams);
      expect(result).toBeNull();
    });

    it('works with ReadonlyURLSearchParams', () => {
      const searchParams = new URLSearchParams('lang=zh') as ReadonlyURLSearchParams;
      const result = getLocaleFromUrl(searchParams);
      expect(result).toBe('zh');
    });
  });

  describe('getLocaleFromCurrentUrl', () => {
    beforeEach(() => {
      // Reset window.location mock
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000',
          origin: 'http://localhost:3000'
        },
        writable: true
      });
    });

    it('returns locale from current URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000?lang=en'
        },
        writable: true
      });

      const result = getLocaleFromCurrentUrl();
      expect(result).toBe('en');
    });

    it('returns null when no locale in current URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000'
        },
        writable: true
      });

      const result = getLocaleFromCurrentUrl();
      expect(result).toBeNull();
    });

    it('returns null in server-side environment', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = getLocaleFromCurrentUrl();
      expect(result).toBeNull();

      global.window = originalWindow;
    });
  });

  describe('updateUrlWithLocale', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000'
        },
        writable: true
      });
    });

    it('adds locale parameter to URL without existing parameters', () => {
      const result = updateUrlWithLocale('http://localhost:3000/page', 'en');
      expect(result).toBe('http://localhost:3000/page?lang=en');
    });

    it('adds locale parameter to URL with existing parameters', () => {
      const result = updateUrlWithLocale('http://localhost:3000/page?other=value', 'zh');
      expect(result).toBe('http://localhost:3000/page?other=value&lang=zh');
    });

    it('replaces existing lang parameter', () => {
      const result = updateUrlWithLocale('http://localhost:3000/page?lang=zh&other=value', 'en');
      expect(result).toBe('http://localhost:3000/page?lang=en&other=value');
    });

    it('replaces existing locale parameter with lang', () => {
      const result = updateUrlWithLocale('http://localhost:3000/page?locale=zh', 'en');
      expect(result).toBe('http://localhost:3000/page?locale=zh&lang=en');
    });

    it('handles relative URLs', () => {
      const result = updateUrlWithLocale('/page', 'en');
      expect(result).toBe('http://localhost:3000/page?lang=en');
    });
  });

  describe('createUrlWithLocale', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000'
        },
        writable: true
      });
    });

    it('creates URL with locale parameter (preserve params = true)', () => {
      const result = createUrlWithLocale('/page?existing=value', 'en', true);
      expect(result).toBe('/page?existing=value&lang=en');
    });

    it('creates URL with locale parameter (preserve params = false)', () => {
      const result = createUrlWithLocale('/page?existing=value', 'zh', false);
      expect(result).toBe('/page?lang=zh');
    });

    it('creates URL with locale parameter (preserve params default true)', () => {
      const result = createUrlWithLocale('/page?existing=value', 'en');
      expect(result).toBe('/page?existing=value&lang=en');
    });

    it('handles root path', () => {
      const result = createUrlWithLocale('/', 'zh');
      expect(result).toBe('/?lang=zh');
    });

    it('handles path without leading slash', () => {
      const result = createUrlWithLocale('page', 'en');
      expect(result).toBe('/page?lang=en');
    });

    it('replaces existing lang parameter when preserving params', () => {
      const result = createUrlWithLocale('/page?lang=zh&other=value', 'en', true);
      expect(result).toBe('/page?lang=en&other=value');
    });
  });

  describe('isValidLanguage', () => {
    it('returns true for supported languages', () => {
      expect(isValidLanguage('en')).toBe(true);
      expect(isValidLanguage('zh')).toBe(true);
    });

    it('returns false for unsupported languages', () => {
      expect(isValidLanguage('fr')).toBe(false);
      expect(isValidLanguage('es')).toBe(false);
      expect(isValidLanguage('de')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isValidLanguage(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isValidLanguage(undefined as any)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidLanguage('')).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(isValidLanguage(123 as any)).toBe(false);
      expect(isValidLanguage({} as any)).toBe(false);
      expect(isValidLanguage([] as any)).toBe(false);
    });

    it('type guards correctly', () => {
      const lang: string | null = 'en';
      if (isValidLanguage(lang)) {
        // TypeScript should recognize lang as SupportedLanguage here
        const supportedLang: SupportedLanguage = lang;
        expect(supportedLang).toBe('en');
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('handles malformed URLs gracefully', () => {
      // These should not throw errors
      expect(() => updateUrlWithLocale('not-a-url', 'en')).not.toThrow();
      expect(() => createUrlWithLocale('not-a-url', 'en')).not.toThrow();
    });

    it('handles special characters in URL parameters', () => {
      const searchParams = new URLSearchParams('lang=en&other=hello%20world');
      const result = getLocaleFromUrl(searchParams);
      expect(result).toBe('en');
    });

    it('handles case sensitivity', () => {
      const searchParams = new URLSearchParams('lang=EN');
      const result = getLocaleFromUrl(searchParams);
      expect(result).toBeNull(); // Should be case sensitive
    });
  });
});
