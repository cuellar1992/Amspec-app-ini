import express from 'express';
import Agent from '../models/Agent.js';
import Berth from '../models/Berth.js';
import Chemist from '../models/Chemist.js';
import Sampler from '../models/Sampler.js';
import Surveyor from '../models/Surveyor.js';
import Terminal from '../models/Terminal.js';
import Client from '../models/Client.js';
import ProductType from '../models/ProductType.js';
import { createDropdownController } from '../controllers/dropdownController.js';

const router = express.Router();

// Create controllers for each model
const agentController = createDropdownController(Agent, 'Agent');
const berthController = createDropdownController(Berth, 'Berth');
const chemistController = createDropdownController(Chemist, 'Chemist');
const samplerController = createDropdownController(Sampler, 'Sampler');
const surveyorController = createDropdownController(Surveyor, 'Surveyor');
const terminalController = createDropdownController(Terminal, 'Terminal');
const clientController = createDropdownController(Client, 'Client');
const productTypeController = createDropdownController(ProductType, 'ProductType');

// Agent routes
router.route('/agents').get(agentController.getAll).post(agentController.create);
router
  .route('/agents/:id')
  .get(agentController.getById)
  .put(agentController.update)
  .delete(agentController.delete);
router.route('/agents/:id/permanent').delete(agentController.permanentDelete);

// Berth routes
router.route('/berths').get(berthController.getAll).post(berthController.create);
router
  .route('/berths/:id')
  .get(berthController.getById)
  .put(berthController.update)
  .delete(berthController.delete);
router.route('/berths/:id/permanent').delete(berthController.permanentDelete);

// Chemist routes
router.route('/chemists').get(chemistController.getAll).post(chemistController.create);
router
  .route('/chemists/:id')
  .get(chemistController.getById)
  .put(chemistController.update)
  .delete(chemistController.delete);
router.route('/chemists/:id/permanent').delete(chemistController.permanentDelete);

// Sampler routes
router.route('/samplers').get(samplerController.getAll).post(samplerController.create);
router
  .route('/samplers/:id')
  .get(samplerController.getById)
  .put(samplerController.update)
  .delete(samplerController.delete);
router.route('/samplers/:id/permanent').delete(samplerController.permanentDelete);

// Surveyor routes
router.route('/surveyors').get(surveyorController.getAll).post(surveyorController.create);
router
  .route('/surveyors/:id')
  .get(surveyorController.getById)
  .put(surveyorController.update)
  .delete(surveyorController.delete);
router.route('/surveyors/:id/permanent').delete(surveyorController.permanentDelete);

// Terminal routes
router.route('/terminals').get(terminalController.getAll).post(terminalController.create);
router
  .route('/terminals/:id')
  .get(terminalController.getById)
  .put(terminalController.update)
  .delete(terminalController.delete);
router.route('/terminals/:id/permanent').delete(terminalController.permanentDelete);

// Client routes
router.route('/clients').get(clientController.getAll).post(clientController.create);
router
  .route('/clients/:id')
  .get(clientController.getById)
  .put(clientController.update)
  .delete(clientController.delete);
router.route('/clients/:id/permanent').delete(clientController.permanentDelete);

// ProductType routes
router.route('/product-types').get(productTypeController.getAll).post(productTypeController.create);
router
  .route('/product-types/:id')
  .get(productTypeController.getById)
  .put(productTypeController.update)
  .delete(productTypeController.delete);
router.route('/product-types/:id/permanent').delete(productTypeController.permanentDelete);

export default router;
