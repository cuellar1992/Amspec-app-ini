import api from './api'

export interface EventData {
  title: string
  start: string | Date
  end?: string | Date
  allDay?: boolean
  calendar: 'Danger' | 'Success' | 'Primary' | 'Warning'
}

export interface Event extends EventData {
  _id: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
}

// Get all events
export const getAllEvents = async (): Promise<ApiResponse<Event[]>> => {
  const response = await api.get('/events')
  return response.data
}

// Get event by ID
export const getEventById = async (id: string): Promise<ApiResponse<Event>> => {
  const response = await api.get(`/events/${id}`)
  return response.data
}

// Create new event
export const createEvent = async (data: EventData): Promise<ApiResponse<Event>> => {
  const response = await api.post('/events', data)
  return response.data
}

// Update event
export const updateEvent = async (
  id: string,
  data: Partial<EventData>
): Promise<ApiResponse<Event>> => {
  const response = await api.put(`/events/${id}`, data)
  return response.data
}

// Delete event
export const deleteEvent = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const response = await api.delete(`/events/${id}`)
  return response.data
}
