import { HttpError } from '../../errors';
import type { Pool } from 'pg';
import { evaluateRegistration } from '../../domain/registrations';
import type { Registration, RegistrationInput } from '../../routes/registrations';

export const makeRegistrationQueries = (pool: Pool) => ({
  addRegistration: async (
    eventId: number,
    { name, email }: RegistrationInput,
  ): Promise<Registration> => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows: events } = await client.query<{
        startsAt: Date;
        capacity: number;
      }>('SELECT starts_at AS "startsAt", capacity FROM events WHERE id = $1 FOR UPDATE', [
        eventId,
      ]);

      const event = events[0];

      if (!event) {
        throw new HttpError(404, 'Event not found');
      }

      const duplicate = await client.query(
        'SELECT id FROM registrations WHERE event_id = $1 AND email = $2',
        [eventId, email],
      );

      const count = await client.query<{ total: number }>(
        'SELECT count(*)::int AS total FROM registrations WHERE event_id = $1',
        [eventId],
      );

      const decision = evaluateRegistration(
        {
          startsAt: event.startsAt.getTime(),
          capacity: event.capacity,
          registeredCount: count.rows[0].total,
          alreadyRegistered: Boolean(duplicate.rowCount),
        },
        Date.now(),
      );
      if (!decision.allowed) {
        const messages = {
          started: 'Event has already started',
          duplicate: 'Email is already registered for this event',
          full: 'Event is full',
        };
        throw new HttpError(409, messages[decision.reason]);
      }

      const { rows } = await client.query<Registration>(
        `INSERT INTO registrations (event_id, name, email) VALUES ($1, $2, $3)
         RETURNING id, event_id AS "eventId", name, email, created_at AS "createdAt"`,
        [eventId, name, email],
      );

      await client.query('COMMIT');

      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
});

export type RegistrationQueries = ReturnType<typeof makeRegistrationQueries>;
