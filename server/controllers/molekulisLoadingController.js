import MolekulisLoading from '../models/MolekulisLoading.js';
import { emitToAll } from '../socket/index.js';

// List with pagination and sorting (default startAt desc)
export const listMolekulisLoadings = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'startAt';
    const sortOrder = (req.query.sortOrder || 'desc') === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder, createdAt: -1 };

    const total = await MolekulisLoading.countDocuments();
    const data = await MolekulisLoading.find()
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({ success: true, data, total, page, pages: Math.ceil(total / limit), limit, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching loadings', error: error.message });
  }
};

export const getMolekulisLoadingById = async (req, res) => {
  try {
    const item = await MolekulisLoading.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Loading not found' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching loading', error: error.message });
  }
};

export const createMolekulisLoading = async (req, res) => {
  try {
    const payload = req.body;
    console.log('[ML][api] POST /molekulis-loading payload:', payload)
    // Basic validation
    if (!payload.when || !payload.who || !payload.startAt || !payload.endAt || !Array.isArray(payload.loads) || payload.loads.length === 0) {
      console.warn('[ML][api] create: missing fields')
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const item = await MolekulisLoading.create(payload);
    console.log('[ML][api] create: success id=', item?._id)

    // Emit WebSocket event
    emitToAll('molekulis-loading:created', item);

    res.status(201).json({ success: true, message: 'Loading created', data: item });
  } catch (error) {
    console.error('[ML][api] create: error', error)
    res.status(500).json({ success: false, message: 'Error creating loading', error: error.message });
  }
};

export const updateMolekulisLoading = async (req, res) => {
  try {
    console.log('[ML][api] PUT /molekulis-loading/:id', req.params.id, 'body:', req.body)
    const item = await MolekulisLoading.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Loading not found' });

    // Update fields
    Object.assign(item, req.body);

    // Save to trigger pre-save hook (which recalculates status)
    await item.save();

    console.log('[ML][api] update: success id=', item?._id)

    // Emit WebSocket event
    emitToAll('molekulis-loading:updated', item);

    res.status(200).json({ success: true, message: 'Loading updated', data: item });
  } catch (error) {
    console.error('[ML][api] update: error', error)
    res.status(500).json({ success: false, message: 'Error updating loading', error: error.message });
  }
};

export const deleteMolekulisLoading = async (req, res) => {
  try {
    const item = await MolekulisLoading.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Loading not found' });

    // Emit WebSocket event
    emitToAll('molekulis-loading:deleted', { id: req.params.id });

    res.status(200).json({ success: true, message: 'Loading deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting loading', error: error.message });
  }
};


