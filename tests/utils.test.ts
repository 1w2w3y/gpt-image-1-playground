import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('combines multiple class names', () => {
    const result = cn('px-2', 'text-sm', 'block');
    expect(result).toBe('px-2 text-sm block');
  });

  it('merges conflicting Tailwind classes preferring the later one', () => {
    const result = cn('p-2', 'p-4');
    // tailwind-merge should drop the earlier conflicting utility
    expect(result).toBe('p-4');
  });

  it('handles conditional and array/object inputs like clsx', () => {
    const result = cn('a', false && 'b', null as any, undefined as any, 0 && 'c', ['d', { e: true, f: false }]);
    // falsey values are omitted; truthy keys in objects included
    expect(result).toBe('a d e');
  });
});
