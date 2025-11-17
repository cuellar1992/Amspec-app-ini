import SamplingRoster from '../models/SamplingRoster.js';

const toDate = (value) => {
  if (!value) return value;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
};

const calculateHours = (start, end) => {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    return 0;
  }
  const diff = endDate.getTime() - startDate.getTime();
  return diff > 0 ? +(diff / 36e5).toFixed(2) : 0;
};

const calculateStatusValue = (startDischarge, dischargeTimeHours) => {
  const now = new Date();

  if (!startDischarge || !dischargeTimeHours) {
    return 'pending';
  }

  const start = toDate(startDischarge);
  if (!(start instanceof Date) || Number.isNaN(dischargeTimeHours)) {
    return 'pending';
  }

  const etc = new Date(start.getTime() + dischargeTimeHours * 60 * 60 * 1000);

  if (etc < now) {
    return 'completed';
  }

  if (start <= now) {
    return 'in-progress';
  }

  return 'pending';
};

const normalizeSamplingArrays = (records = [], type) => {
  if (!Array.isArray(records)) return [];

  return records.map((record = {}) => {
    if (type === 'office') {
      const startOffice = toDate(record.startOffice);
      const finishSampling = toDate(record.finishSampling);

      return {
        who: record.who ?? '',
        startOffice,
        finishSampling,
        hours: calculateHours(startOffice, finishSampling),
      };
    }

    const startLineSampling = toDate(record.startLineSampling);
    const finishLineSampling = toDate(record.finishLineSampling);

    return {
      who: record.who ?? '',
      startLineSampling,
      finishLineSampling,
      hours: calculateHours(startLineSampling, finishLineSampling),
    };
  });
};

const buildUpsertPayload = (payload = {}) => {
  const normalized = { ...payload };

  normalized.pob = toDate(normalized.pob);
  normalized.etb = toDate(normalized.etb);
  normalized.startDischarge = toDate(normalized.startDischarge);

  if (typeof normalized.dischargeTimeHours === 'string') {
    const parsed = parseFloat(normalized.dischargeTimeHours);
    normalized.dischargeTimeHours = Number.isNaN(parsed) ? 0 : parsed;
  }

  normalized.officeSampling = normalizeSamplingArrays(normalized.officeSampling, 'office');
  normalized.lineSampling = normalizeSamplingArrays(normalized.lineSampling, 'line');

  normalized.status = calculateStatusValue(normalized.startDischarge, normalized.dischargeTimeHours);

  return normalized;
};

const handleValidationError = (res, error) => {
  const messages = Object.values(error.errors).map((err) => err.message);
  return res.status(400).json({
    success: false,
    message: 'Validation error',
    errors: messages,
  });
};

// @desc    Get all sampling rosters
// @route   GET /api/sampling-rosters
// @access  Public
export const getAllSamplingRosters = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const total = await SamplingRoster.countDocuments();
    const rosters = await SamplingRoster.find()
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: rosters.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
      data: rosters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sampling rosters',
      error: error.message,
    });
  }
};

// @desc    Get single sampling roster by ID
// @route   GET /api/sampling-rosters/:id
// @access  Public
export const getSamplingRosterById = async (req, res) => {
  try {
    const roster = await SamplingRoster.findById(req.params.id);

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Sampling roster not found',
      });
    }

    res.status(200).json({
      success: true,
      data: roster,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sampling roster',
      error: error.message,
    });
  }
};

// @desc    Get sampling roster by AmSpec reference
// @route   GET /api/sampling-rosters/ref/:amspecRef
// @access  Public
export const getSamplingRosterByRef = async (req, res) => {
  try {
    const ref = decodeURIComponent(req.params.amspecRef);
    const roster = await SamplingRoster.findOne({ amspecRef: ref });

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Sampling roster not found',
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: roster,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sampling roster',
      error: error.message,
    });
  }
};

// @desc    Create new sampling roster
// @route   POST /api/sampling-rosters
// @access  Public
export const createSamplingRoster = async (req, res) => {
  try {
    const roster = await SamplingRoster.create(req.body);

    res.status(201).json({
      success: true,
      data: roster,
      message: 'Sampling roster created successfully',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return handleValidationError(res, error);
    }

    res.status(500).json({
      success: false,
      message: 'Error creating sampling roster',
      error: error.message,
    });
  }
};

// @desc    Update sampling roster
// @route   PUT /api/sampling-rosters/:id
// @access  Public
export const updateSamplingRoster = async (req, res) => {
  try {
    const roster = await SamplingRoster.findById(req.params.id);

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Sampling roster not found',
      });
    }

    // Update fields
    Object.assign(roster, req.body);

    // Save to trigger pre-save hook (which recalculates status)
    await roster.save();

    res.status(200).json({
      success: true,
      data: roster,
      message: 'Sampling roster updated successfully',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return handleValidationError(res, error);
    }

    res.status(500).json({
      success: false,
      message: 'Error updating sampling roster',
      error: error.message,
    });
  }
};

// @desc    Upsert sampling roster by AmSpec reference
// @route   PATCH /api/sampling-rosters/upsert/:amspecRef
// @access  Public
export const upsertSamplingRoster = async (req, res) => {
  try {
    const ref = decodeURIComponent(req.params.amspecRef);
    const payload = buildUpsertPayload({
      ...req.body,
      amspecRef: ref,
    });

    const existing = await SamplingRoster.findOne({ amspecRef: ref }).lean();

    const roster = await SamplingRoster.findOneAndUpdate(
      { amspecRef: ref },
      payload,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(existing ? 200 : 201).json({
      success: true,
      data: roster,
      message: existing ? 'Sampling roster updated successfully' : 'Sampling roster created successfully',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return handleValidationError(res, error);
    }

    console.error('Upsert sampling roster error:', error);

    return res.status(500).json({
      success: false,
      message: 'Error upserting sampling roster',
      error: error.message,
    });
  }
};

// @desc    Delete sampling roster
// @route   DELETE /api/sampling-rosters/:id
// @access  Public
export const deleteSamplingRoster = async (req, res) => {
  try {
    const roster = await SamplingRoster.findByIdAndDelete(req.params.id);

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Sampling roster not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'Sampling roster deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sampling roster',
      error: error.message,
    });
  }
};

