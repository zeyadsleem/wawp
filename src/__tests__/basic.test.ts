import { describe, it, expect } from 'vitest';

describe('Basic', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should have working math', () => {
    expect(1 + 1).toBe(2);
    expect(10 * 5).toBe(50);
  });

  it('should handle strings', () => {
    const greeting = 'Hello WAWP';
    expect(greeting).toContain('WAWP');
    expect(greeting.length).toBe(10);
  });
});