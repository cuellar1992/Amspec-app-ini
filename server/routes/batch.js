import express from 'express';
import { authenticate } from '../middleware/auth.js';
import ShipNomination from '../models/ShipNomination.js';
import MolekulisLoading from '../models/MolekulisLoading.js';
import OtherJob from '../models/OtherJob.js';
import Surveyor from '../models/Surveyor.js';
import Sampler from '../models/Sampler.js';
import Terminal from '../models/Terminal.js';
import ProductType from '../models/ProductType.js';
import Agent from '../models/Agent.js';
import Client from '../models/Client.js';

const router = express.Router();

/**
 * @route   GET /api/batch/sampling-roster-init
 * @desc    Get all initial data for Sampling Roster page in a single request
 * @access  Private
 */
router.get('/sampling-roster-init', authenticate, async (req, res) => {
  try {
    // Fetch all data in parallel
    const [
      recentShipNominations,
      molekulisLoadings,
      otherJobs,
      surveyors,
      samplers,
      terminals,
      products,
      agents,
      clients
    ] = await Promise.all([
      // Recent ship nominations (last 5)
      ShipNomination.find()
        .sort({ etb: -1 })
        .limit(5)
        .lean(),

      // Molekulis loadings (last 100 for conflict checking)
      MolekulisLoading.find()
        .sort({ startAt: 1 })
        .limit(100)
        .lean(),

      // Other jobs (last 100 for conflict checking)
      OtherJob.find()
        .sort({ startAt: 1 })
        .limit(100)
        .lean(),

      // Dropdowns - all active
      Surveyor.find({ isActive: true }).select('name').lean(),
      Sampler.find({ isActive: true }).select('name has24HourRestriction restrictedDays').lean(),
      Terminal.find({ isActive: true }).select('name').lean(),
      ProductType.find({ isActive: true }).select('name').lean(),
      Agent.find({ isActive: true }).select('name').lean(),
      Client.find({ isActive: true }).select('name').lean()
    ]);

    res.json({
      success: true,
      data: {
        shipNominations: recentShipNominations,
        molekulisLoadings,
        otherJobs,
        dropdowns: {
          surveyors: surveyors.map(s => s.name),
          samplers: samplers.map(s => ({
            name: s.name,
            has24HourRestriction: s.has24HourRestriction || false,
            restrictedDays: s.restrictedDays || []
          })),
          terminals: terminals.map(t => t.name),
          products: products.map(p => p.name),
          agents: agents.map(a => a.name),
          clients: clients.map(c => c.name)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching batch data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching initialization data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/batch/dropdowns
 * @desc    Get all dropdowns in a single request
 * @access  Private
 */
router.get('/dropdowns', authenticate, async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const filter = includeInactive ? {} : { isActive: true };

    const [surveyors, samplers, terminals, products, agents, clients] = await Promise.all([
      Surveyor.find(filter).lean(),
      Sampler.find(filter).lean(),
      Terminal.find(filter).lean(),
      ProductType.find(filter).lean(),
      Agent.find(filter).lean(),
      Client.find(filter).lean()
    ]);

    res.json({
      success: true,
      data: {
        surveyors,
        samplers,
        terminals,
        products,
        agents,
        clients
      }
    });
  } catch (error) {
    console.error('Error fetching dropdowns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dropdowns',
      error: error.message
    });
  }
});

export default router;
