import express from 'express'
import { getSamplersHoursSummary, getSamplersMonthSummary } from '../controllers/samplerController.js'

const router = express.Router()

// Statistics routes
router.route('/hours-summary').get(getSamplersHoursSummary)
router.route('/month-summary').get(getSamplersMonthSummary)

export default router
