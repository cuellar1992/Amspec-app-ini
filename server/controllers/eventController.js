import Event from '../models/Event.js';

export const listEvents = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'start';
    const sortOrder = (req.query.sortOrder || 'asc') === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const data = await Event.find().sort(sort);
    res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching events', error: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const item = await Event.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Event not found' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching event', error: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.start || !payload.calendar) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const item = await Event.create(payload);
    res.status(201).json({ success: true, message: 'Event created', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating event', error: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const item = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Event not found' });
    res.status(200).json({ success: true, message: 'Event updated', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating event', error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const item = await Event.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Event not found' });
    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting event', error: error.message });
  }
};
