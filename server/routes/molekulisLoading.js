import express from 'express';
import {
  listMolekulisLoadings,
  getMolekulisLoadingById,
  createMolekulisLoading,
  updateMolekulisLoading,
  deleteMolekulisLoading,
} from '../controllers/molekulisLoadingController.js';

const router = express.Router();

router.route('/')
  .get((req, res, next) => { console.log('[ML][api] GET /molekulis-loading', req.query); next(); }, listMolekulisLoadings)
  .post((req, res, next) => { console.log('[ML][api] POST /molekulis-loading trigger'); next(); }, createMolekulisLoading);
router.route('/:id').get(getMolekulisLoadingById).put(updateMolekulisLoading).delete(deleteMolekulisLoading);

export default router;



