import express from 'express';
import { listEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';

const router = express.Router();

router.route('/')
  .get(listEvents)
  .post(createEvent);

router.route('/:id')
  .get(getEventById)
  .put(updateEvent)
  .delete(deleteEvent);

export default router;
