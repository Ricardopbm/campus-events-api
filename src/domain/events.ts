import { z } from 'zod/v4';

const EventInput = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(10000).optional(),
  startsAt: z.iso.datetime({ offset: true }),
  capacity: z.number().int().positive().max(2147483647),
});
export type EventInput = z.infer<typeof EventInput>;
export interface CampusEvent extends Omit<EventInput, 'description' | 'startsAt'> {
  id: number;
  description: string | null;
  startsAt: Date;
}

/** Validate creation data against an explicit reference instant (milliseconds since epoch). */
export function validateEvent(input: unknown, now: number): EventInput {
  if (!Number.isFinite(now)) throw new RangeError('Invalid reference instant');
  return EventInput.refine((event) => Date.parse(event.startsAt) > now, {
    message: 'Event must start in the future',
    path: ['startsAt'],
  }).parse(input);
}
