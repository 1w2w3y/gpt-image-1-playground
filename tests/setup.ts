import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.location for URL testing
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost:3000/test-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Store original URL constructor
const OriginalURL = globalThis.URL;

// Mock URL constructor for consistent behavior in tests
global.URL = class MockURL {
  href: string;
  origin: string;
  pathname: string;
  search: string;
  searchParams: URLSearchParams;

  constructor(url: string, base?: string) {
    try {
      const fullUrl = base ? new OriginalURL(url, base).href : url;
      const parsed = new OriginalURL(fullUrl);
      
      this.href = parsed.href;
      this.origin = parsed.origin;
      this.pathname = parsed.pathname;
      this.search = parsed.search;
      this.searchParams = new URLSearchParams(parsed.search);
      
      // Update href when searchParams change
      const updateHref = () => {
        const searchString = this.searchParams.toString();
        this.search = searchString ? '?' + searchString : '';
        this.href = this.origin + this.pathname + this.search;
      };
      
      // Override searchParams methods to keep URL in sync
      const originalSet = this.searchParams.set.bind(this.searchParams);
      const originalDelete = this.searchParams.delete.bind(this.searchParams);
      const originalAppend = this.searchParams.append.bind(this.searchParams);
      
      this.searchParams.set = (...args) => {
        originalSet(...args);
        updateHref();
      };
      
      this.searchParams.delete = (...args) => {
        originalDelete(...args);
        updateHref();
      };
      
      this.searchParams.append = (...args) => {
        originalAppend(...args);
        updateHref();
      };
      
    } catch (error) {
      // Fallback for invalid URLs
      this.href = url;
      this.origin = 'http://localhost:3000';
      this.pathname = '/';
      this.search = '';
      this.searchParams = new URLSearchParams();
    }
  }

  toString() {
    return this.href;
  }

  static createObjectURL = global.URL.createObjectURL;
  static revokeObjectURL = global.URL.revokeObjectURL;
} as any;
