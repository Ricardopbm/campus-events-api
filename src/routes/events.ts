import { Router } from 'express';
import { AppContext } from '../app';
import { validateEvent } from '../domain/events';

export function makeEventRoutes({ queries }: AppContext): Router {
  const router = Router();
  router.get('/', async (_req, res) => {
    res.send(await queries.getEvents());
  });
  router.post('/', async (req, res) => {
    const input = validateEvent(req.body, Date.now());
    res.status(201).send(await queries.addEvent(input));
  });
  return router;
}
