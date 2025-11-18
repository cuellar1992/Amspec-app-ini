import OtherJob from '../models/OtherJob.js';
import { emitToAll } from '../socket/index.js';

export const listOtherJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'when';
    const sortOrder = (req.query.sortOrder || 'desc') === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder, createdAt: -1 };

    const total = await OtherJob.countDocuments();
    const data = await OtherJob.find().sort(sort).skip(skip).limit(limit);
    res.status(200).json({ success: true, data, total, page, pages: Math.ceil(total / limit), limit, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching other jobs', error: error.message });
  }
};

export const getOtherJobById = async (req, res) => {
  try {
    const item = await OtherJob.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Other job not found' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching other job', error: error.message });
  }
};

export const createOtherJob = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.when || !payload.description || !payload.who || !payload.startAt || !payload.endAt) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const item = await OtherJob.create(payload);

    // Emit WebSocket event
    emitToAll('other-job:created', item);

    res.status(201).json({ success: true, message: 'Other job created', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating other job', error: error.message });
  }
};

export const updateOtherJob = async (req, res) => {
  try {
    const item = await OtherJob.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Other job not found' });

    // Update fields
    Object.assign(item, req.body);

    // Save to trigger pre-save hook (which recalculates status)
    await item.save();

    // Emit WebSocket event
    emitToAll('other-job:updated', item);

    res.status(200).json({ success: true, message: 'Other job updated', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating other job', error: error.message });
  }
};

export const deleteOtherJob = async (req, res) => {
  try {
    const item = await OtherJob.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Other job not found' });

    // Emit WebSocket event
    emitToAll('other-job:deleted', { id: req.params.id });

    res.status(200).json({ success: true, message: 'Other job deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting other job', error: error.message });
  }
};


