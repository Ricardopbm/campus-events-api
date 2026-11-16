import { describe, expect, it } from 'vitest';
import { evaluateRegistration } from './registrations';

describe('registration eligibility rules', () => {
  const now = Date.parse('2030-01-01T12:00:00Z');
  const state = {
    startsAt: now + 86400000,
    capacity: 10,
    registeredCount: 2,
    alreadyRegistered: false,
  };
  it('allows a new participant in a future event with seats', () => {
    expect(evaluateRegistration(state, now)).toEqual({ allowed: true });
  });
  it('rejects a duplicate even when seats remain', () => {
    expect(evaluateRegistration({ ...state, alreadyRegistered: true }, now)).toEqual({
      allowed: false,
      reason: 'duplicate',
    });
  });
  it('allows the last available seat', () => {
    expect(evaluateRegistration({ ...state, registeredCount: 9 }, now)).toEqual({ allowed: true });
  });
  it('rejects a fully occupied event', () => {
    expect(evaluateRegistration({ ...state, registeredCount: 10 }, now)).toEqual({
      allowed: false,
      reason: 'full',
    });
  });
  it('rejects an event whose existing count exceeds capacity', () => {
    expect(evaluateRegistration({ ...state, registeredCount: 11 }, now)).toEqual({
      allowed: false,
      reason: 'full',
    });
  });
  it('allows registration one millisecond before the event starts', () => {
    expect(evaluateRegistration({ ...state, startsAt: now + 1 }, now)).toEqual({ allowed: true });
  });
  it.each([now, now - 1])(
    'rejects an event starting at or before the reference instant: %s',
    (startsAt) => {
      expect(evaluateRegistration({ ...state, startsAt }, now)).toEqual({
        allowed: false,
        reason: 'started',
      });
    },
  );
  it('prioritizes started over duplicate and full, then duplicate over full', () => {
    expect(
      evaluateRegistration(
        { ...state, startsAt: now, alreadyRegistered: true, registeredCount: 10 },
        now,
      ),
    ).toEqual({ allowed: false, reason: 'started' });
    expect(
      evaluateRegistration({ ...state, alreadyRegistered: true, registeredCount: 10 }, now),
    ).toEqual({ allowed: false, reason: 'duplicate' });
  });
  it.each([{ capacity: 0 }, { registeredCount: -1 }, { registeredCount: 1.5 }, { startsAt: NaN }])(
    'rejects invalid internal state %j',
    (invalid) => {
      expect(() => evaluateRegistration({ ...state, ...invalid }, now)).toThrow(RangeError);
    },
  );
});
