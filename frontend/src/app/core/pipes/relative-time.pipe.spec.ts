import { afterEach, describe, expect, it, vi } from 'vitest';
import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  afterEach(() => vi.useRealTimers());

  it('formats recent past and future timestamps relative to now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    const pipe = new RelativeTimePipe();

    expect(pipe.transform('2026-01-01T11:00:00.000Z')).toBe('1 hour ago');
    expect(pipe.transform('2026-01-02T12:00:00.000Z')).toBe('tomorrow');
    expect(pipe.transform('2026-01-01T11:59:30.000Z')).toBe('just now');
    expect(pipe.transform('not a timestamp')).toBe('unknown time');
  });
});
