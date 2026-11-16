export interface RegistrationState {
  startsAt: number;
  capacity: number;
  registeredCount: number;
  alreadyRegistered: boolean;
}

export type RegistrationDecision =
  | { allowed: true }
  | { allowed: false; reason: 'started' | 'duplicate' | 'full' };

/** Decide eligibility from a consistent snapshot; locking/persistence belongs to the caller. */
export function evaluateRegistration(state: RegistrationState, now: number): RegistrationDecision {
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(state.startsAt) ||
    !Number.isInteger(state.capacity) ||
    state.capacity <= 0 ||
    !Number.isInteger(state.registeredCount) ||
    state.registeredCount < 0
  )
    throw new RangeError('Invalid registration state');
  if (state.startsAt <= now) return { allowed: false, reason: 'started' };
  if (state.alreadyRegistered) return { allowed: false, reason: 'duplicate' };
  if (state.registeredCount >= state.capacity) return { allowed: false, reason: 'full' };
  return { allowed: true };
}
