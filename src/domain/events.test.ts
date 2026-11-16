import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod/v4';
import { validateEvent } from './events';

describe('event creation rules', () => {
  const now = Date.parse('2030-01-01T12:00:00Z');
  const input = { title: ' Workshop ', startsAt: '2030-01-02T12:00:00Z', capacity: 10 };
  it('accepts a future event and normalizes its title', () => {
    expect(validateEvent(input, now)).toEqual({ ...input, title: 'Workshop' });
  });
  it('accepts the minimum capacity of one', () => {
    expect(validateEvent({ ...input, capacity: 1 }, now).capacity).toBe(1);
  });
  it.each([0, -1, 1.5, 2147483648])('rejects invalid capacity %s', (capacity) => {
    expect(() => validateEvent({ ...input, capacity }, now)).toThrow(ZodError);
  });
  it('rejects an event at the exact reference instant', () => {
    expect(() => validateEvent({ ...input, startsAt: new Date(now).toISOString() }, now)).toThrow(
      ZodError,
    );
  });
  it('accepts an event one millisecond after the reference instant', () => {
    expect(
      validateEvent({ ...input, startsAt: new Date(now + 1).toISOString() }, now),
    ).toBeDefined();
  });
  it('rejects an event one millisecond before the reference instant', () => {
    expect(() =>
      validateEvent({ ...input, startsAt: new Date(now - 1).toISOString() }, now),
    ).toThrow(ZodError);
  });
  it('compares timezone offsets by instant, not by the displayed local hour', () => {
    expect(() => validateEvent({ ...input, startsAt: '2030-01-01T09:00:00-03:00' }, now)).toThrow(
      ZodError,
    );
    expect(validateEvent({ ...input, startsAt: '2030-01-01T09:00:01-03:00' }, now)).toBeDefined();
  });
  it.each(['invalid', '2030-01-02T12:00:00', '2030-02-30T12:00:00Z'])(
    'rejects invalid or timezone-free date %s',
    (startsAt) => {
      expect(() => validateEvent({ ...input, startsAt }, now)).toThrow(ZodError);
    },
  );
  it('rejects a title containing only whitespace', () => {
    expect(() => validateEvent({ ...input, title: '   ' }, now)).toThrow(ZodError);
  });
  it('rejects an invalid reference clock', () => {
    expect(() => validateEvent(input, NaN)).toThrow(RangeError);
  });
});
