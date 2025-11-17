import express from 'express';
import {
  getAllShipNominations,
  getShipNominationById,
  getShipNominationByRef,
  createShipNomination,
  updateShipNomination,
  deleteShipNomination,
  getShipNominationsByStatus,
  updateAllStatuses,
  getShipsByYear,
  getShipsByMonthAndTerminal,
  getAvailableYears,
  getShipsByTerminal,
  getTopClients,
} from '../controllers/shipNominationController.js';

const router = express.Router();

// Base routes
router.route('/').get(getAllShipNominations).post(createShipNomination);

// Status update route
router.route('/update-statuses').post(updateAllStatuses);

// Statistics routes
router.route('/stats/by-year').get(getShipsByYear);
router.route('/stats/by-month-terminal').get(getShipsByMonthAndTerminal);
router.route('/stats/available-years').get(getAvailableYears);
router.route('/stats/by-terminal').get(getShipsByTerminal);
router.route('/stats/by-client').get(getTopClients);

// Status route
router.route('/status/:status').get(getShipNominationsByStatus);

// Reference uniqueness check
router.route('/ref/:amspecReference').get(getShipNominationByRef);

// ID-based routes
router
  .route('/:id')
  .get(getShipNominationById)
  .put(updateShipNomination)
  .delete(deleteShipNomination);

export default router;
