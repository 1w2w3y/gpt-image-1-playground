import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateApiCost, type CostDetails } from '@/lib/cost-utils';

describe('calculateApiCost', () => {
  const originalWarn = console.warn;
  const originalError = console.error;

  beforeEach(() => {
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.warn = originalWarn;
    console.error = originalError;
  });

  it('returns null and warns when usage is undefined', () => {
    const result = calculateApiCost(undefined);
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  it('returns null and warns when input_tokens_details is missing', () => {
    const result = calculateApiCost({ output_tokens: 10 });
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  it('calculates cost correctly for typical values', () => {
    const result = calculateApiCost({
      input_tokens_details: {
        text_tokens: 100,
        image_tokens: 50
      },
      output_tokens: 25
    }) as CostDetails;

    expect(result).not.toBeNull();
    expect(result.estimated_cost_usd).toBe(0.002);
    expect(result.text_input_tokens).toBe(100);
    expect(result.image_input_tokens).toBe(50);
    expect(result.image_output_tokens).toBe(25);
  });

  it('defaults missing token fields to zero and rounds to 4 decimals', () => {
    // text_tokens missing -> defaults to 0
    const result = calculateApiCost({
      input_tokens_details: {
        image_tokens: 20
      },
      output_tokens: 10
    }) as CostDetails;

    // cost = 0*0.000005 + 20*0.00001 + 10*0.00004 = 0 + 0.0002 + 0.0004 = 0.0006
    expect(result.estimated_cost_usd).toBe(0.0006);
    expect(result.text_input_tokens).toBe(0);
    expect(result.image_input_tokens).toBe(20);
    expect(result.image_output_tokens).toBe(10);
  });

  it('rounds values correctly (threshold case)', () => {
    const result = calculateApiCost({
      input_tokens_details: {
        text_tokens: 199,
        image_tokens: 0
      },
      output_tokens: 0
    }) as CostDetails;

    // 199 * 0.000005 = 0.000995 -> rounds to 0.0010
    expect(result.estimated_cost_usd).toBe(0.001);
  });

  it('returns null and logs error for invalid token types', () => {
    const result = calculateApiCost({
      input_tokens_details: { text_tokens: '10', image_tokens: 5 as any },
      output_tokens: '3'
    } as any);

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });
});
