import ShipNomination from '../models/ShipNomination.js';

// @desc    Get all ship nominations
// @route   GET /api/ship-nominations
// @access  Public
export const getAllShipNominations = async (req, res) => {
  try {
    // Update all statuses based on current date before fetching
    await ShipNomination.updateAllStatuses();
    
    // Pagination params
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Sorting params
    const sortBy = (req.query.sortBy || 'etb');
    const sortOrder = (req.query.sortOrder || 'desc') === 'asc' ? 1 : -1;
    const sort = {};
    if (sortBy === 'etb') {
      sort.etb = sortOrder;
      // Secondary sort for stability
      sort.createdAt = -1;
    } else {
      sort.createdAt = sortOrder;
    }

    // Search filter
    const searchQuery = req.query.search;
    const query = {};
    
    if (searchQuery && searchQuery.trim() !== '') {
      const searchRegex = new RegExp(searchQuery.trim(), 'i'); // Case-insensitive search
      query.$or = [
        { vesselName: searchRegex },
        { amspecReference: searchRegex }
      ];
    }

    const total = await ShipNomination.countDocuments(query);
    const nominations = await ShipNomination.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: nominations.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
      data: nominations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ship nominations',
      error: error.message,
    });
  }
};

// @desc    Get single ship nomination by ID
// @route   GET /api/ship-nominations/:id
// @access  Public
export const getShipNominationById = async (req, res) => {
  try {
    const nomination = await ShipNomination.findById(req.params.id);

    if (!nomination) {
      return res.status(404).json({
        success: false,
        message: 'Ship nomination not found',
      });
    }

    res.status(200).json({
      success: true,
      data: nomination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ship nomination',
      error: error.message,
    });
  }
};

// @desc    Check if AmSpec reference exists
// @route   GET /api/ship-nominations/ref/:amspecReference
// @access  Public
export const getShipNominationByRef = async (req, res) => {
  try {
    const ref = decodeURIComponent(req.params.amspecReference)
    const nomination = await ShipNomination.findOne({ amspecReference: ref })

    res.status(200).json({
      success: true,
      exists: !!nomination,
      data: nomination || null,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking AmSpec reference',
      error: error.message,
    })
  }
}

// @desc    Create new ship nomination
// @route   POST /api/ship-nominations
// @access  Public
export const createShipNomination = async (req, res) => {
  try {
    const nomination = await ShipNomination.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Ship nomination created successfully',
      data: nomination,
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'AmSpec Reference already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating ship nomination',
      error: error.message,
    });
  }
};

// @desc    Update ship nomination
// @route   PUT /api/ship-nominations/:id
// @access  Public
export const updateShipNomination = async (req, res) => {
  try {
    const nomination = await ShipNomination.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    );

    if (!nomination) {
      return res.status(404).json({
        success: false,
        message: 'Ship nomination not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ship nomination updated successfully',
      data: nomination,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating ship nomination',
      error: error.message,
    });
  }
};

// @desc    Delete ship nomination
// @route   DELETE /api/ship-nominations/:id
// @access  Public
export const deleteShipNomination = async (req, res) => {
  try {
    const nomination = await ShipNomination.findByIdAndDelete(req.params.id);

    if (!nomination) {
      return res.status(404).json({
        success: false,
        message: 'Ship nomination not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ship nomination deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ship nomination',
      error: error.message,
    });
  }
};

// @desc    Get ship nominations by status
// @route   GET /api/ship-nominations/status/:status
// @access  Public
export const getShipNominationsByStatus = async (req, res) => {
  try {
    const nominations = await ShipNomination.find({
      status: req.params.status,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: nominations.length,
      data: nominations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ship nominations',
      error: error.message,
    });
  }
};

// @desc    Update all nomination statuses based on dates
// @route   POST /api/ship-nominations/update-statuses
// @access  Public
export const updateAllStatuses = async (req, res) => {
  try {
    const nominations = await ShipNomination.updateAllStatuses();
    
    res.status(200).json({
      success: true,
      message: 'All statuses updated successfully',
      count: nominations.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating statuses',
      error: error.message,
    });
  }
};

// @desc    Get ship nominations statistics by year
// @route   GET /api/ship-nominations/stats/by-year
// @access  Public
export const getShipsByYear = async (req, res) => {
  try {
    const shipsByYear = await ShipNomination.aggregate([
      {
        // Only include ships that have an ETB date
        $match: {
          etb: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: { $year: '$etb' },
          count: { $sum: 1 },
          ships: { $push: '$vesselName' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          year: '$_id',
          count: 1,
          ships: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: shipsByYear,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ships by year statistics',
      error: error.message,
    });
  }
};

// @desc    Get ship nominations statistics by month and terminal
// @route   GET /api/ship-nominations/stats/by-month-terminal
// @access  Public
export const getShipsByMonthAndTerminal = async (req, res) => {
  try {
    const { year, terminal } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Create date range for the year
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    // Build match conditions
    const matchConditions = {
      etb: {
        $exists: true,
        $ne: null,
        $gte: startDate,
        $lte: endDate
      }
    };

    // Add terminal filter only if specified
    if (terminal) {
      matchConditions.terminal = new RegExp(terminal, 'i'); // Case-insensitive match
    }

    const shipsByMonth = await ShipNomination.aggregate([
      {
        $match: matchConditions
      },
      {
        $group: {
          _id: { $month: '$etb' },
          count: { $sum: 1 },
          ships: { $push: '$vesselName' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create array with all 12 months, filling in zeros where there's no data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = index + 1;
      const monthData = shipsByMonth.find(item => item._id === monthNumber);

      return {
        month: monthNumber,
        monthName: monthNames[index],
        count: monthData ? monthData.count : 0,
        ships: monthData ? monthData.ships : []
      };
    });

    res.status(200).json({
      success: true,
      data: result,
      year: targetYear,
      terminal: terminal || 'all'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ships by month and terminal statistics',
      error: error.message,
    });
  }
};

// @desc    Get available years from ship nominations based on ETB dates
// @route   GET /api/ship-nominations/stats/available-years
// @access  Public
export const getAvailableYears = async (req, res) => {
  try {
    const years = await ShipNomination.aggregate([
      {
        $match: {
          etb: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: { $year: '$etb' }
        }
      },
      {
        $sort: { _id: -1 } // Sort descending (newest first)
      },
      {
        $project: {
          _id: 0,
          year: '$_id'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: years.map(item => item.year),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available years',
      error: error.message,
    });
  }
};

// @desc    Get ship nominations statistics by terminal
// @route   GET /api/ship-nominations/stats/by-terminal
// @access  Public
export const getShipsByTerminal = async (req, res) => {
  try {
    const { period } = req.query;
    const currentDate = new Date();
    let matchCondition = {
      terminal: { $exists: true, $ne: null, $ne: '' }
    };

    // Add date filter based on period
    if (period === 'monthly') {
      // Get current month data
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      matchCondition.etb = {
        $gte: startOfMonth,
        $lte: endOfMonth
      };
    } else if (period === 'yearly') {
      // Get current year data
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
      const endOfYear = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59);
      matchCondition.etb = {
        $gte: startOfYear,
        $lte: endOfYear
      };
    }
    // If no period or 'all', don't add date filter (show all time data)

    const shipsByTerminal = await ShipNomination.aggregate([
      {
        $match: matchCondition
      },
      {
        $group: {
          _id: '$terminal',
          count: { $sum: 1 },
          ships: { $push: '$vesselName' }
        }
      },
      {
        $sort: { count: -1 } // Sort by count descending
      },
      {
        $project: {
          _id: 0,
          terminal: '$_id',
          count: 1,
          ships: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: shipsByTerminal,
      period: period || 'all',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ships by terminal statistics',
      error: error.message,
    });
  }
};

// @desc    Get top clients by ship nominations
// @route   GET /api/ship-nominations/stats/by-client
// @access  Public
export const getTopClients = async (req, res) => {
  try {
    const { limit = 10, period = 'all' } = req.query;
    const currentDate = new Date();

    let matchCondition = {
      clients: { $exists: true, $ne: [] }
    };

    // Add date filter based on period
    if (period === 'monthly') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      matchCondition.etb = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (period === 'yearly') {
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
      const endOfYear = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59);
      matchCondition.etb = { $gte: startOfYear, $lte: endOfYear };
    }

    const topClients = await ShipNomination.aggregate([
      { $match: matchCondition },
      // Unwind the clients array to work with individual clients
      { $unwind: '$clients' },
      {
        $group: {
          _id: '$clients',
          count: { $sum: 1 },
          ships: { $push: '$vesselName' },
          terminals: { $addToSet: '$terminal' },
          uniqueShips: { $addToSet: '$vesselName' }
        }
      },
      {
        $project: {
          _id: 0,
          clientName: '$_id',
          totalNominations: '$count',
          uniqueShips: { $size: '$uniqueShips' },
          terminals: { $size: '$terminals' },
          ships: 1
        }
      },
      { $sort: { totalNominations: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      data: topClients,
      period,
      totalClients: topClients.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top clients',
      error: error.message
    });
  }
};
