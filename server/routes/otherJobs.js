import express from 'express';
import { listOtherJobs, getOtherJobById, createOtherJob, updateOtherJob, deleteOtherJob } from '../controllers/otherJobController.js';

const router = express.Router();

router.route('/')
  .get(listOtherJobs)
  .post(createOtherJob);

router.route('/:id')
  .get(getOtherJobById)
  .put(updateOtherJob)
  .delete(deleteOtherJob);

export default router;


