import api from './api'
import { listMolekulisLoadings } from './molekulisLoadingService'
import { listOtherJobs } from './otherJobsService'
import dropdownService from './dropdownService'

// Types for Sampling Roster persistence
export interface OfficeSamplingRecordDB {
  who: string
  startOffice: string // ISO string
  finishSampling: string // ISO string
  hours: number
}

export interface LineSamplingRecordDB {
  who: string
  startLineSampling: string // ISO string
  finishLineSampling: string // ISO string
  hours: number
}

export interface SamplingRosterData {
  amspecRef: string
  vessel: string
  berth: string
  pob: string // ISO string
  etb: string // ISO string
  startDischarge: string // ISO string
  dischargeTimeHours: number
  cargo: string
  surveyor: string
  preDischargeTest?: string
  postDischargeTest?: string
  officeSampling: OfficeSamplingRecordDB[]
  lineSampling: LineSamplingRecordDB[]
}

export interface SamplingRoster extends SamplingRosterData {
  _id: string
  status?: 'pending' | 'in-progress' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: string[]
  count?: number
  total?: number
  page?: number
  pages?: number
  limit?: number
}

// Types
export interface Sampler {
  _id: string
  name: string
  email?: string
  phone?: string
  has24HourRestriction: boolean
  restrictedDays: number[] // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isActive: boolean
}

export interface Shift {
  start: Date
  end: Date
  sampler?: string // Name of sampler, empty if unassigned
}

export interface LineSamplingRecord {
  who: string
  startLineSampling: string // Display formatted
  startLineSamplingRaw: string // ISO format for editing
  finishLineSampling: string // Display formatted
  finishLineSamplingRaw: string // ISO format for editing
  hours: string
}

export interface ValidationResult {
  success: boolean
  data?: LineSamplingRecord[]
  warnings?: string[]
  errors?: string[]
  auditLog?: string[]
}

interface ConflictAssignment {
  module: 'molekulis' | 'other-jobs' | 'line-sampling'
  sampler: string
  startAt: Date
  endAt: Date
}

interface SamplerAvailability {
  sampler: Sampler
  conflicts: ConflictAssignment[]
  weeklyHours: number // Hours worked in the week (Monday-Sunday)
  lastShiftEnd?: Date // End time of last shift
}

// Constants
const SHIFT_DURATION_HOURS = 12
const DAY_SHIFT_START_HOUR = 7
const NIGHT_SHIFT_START_HOUR = 19
const MIN_REST_HOURS = 10
const WEEKLY_MAX_HOURS_24 = 24

/**
 * Get the week range (Monday 00:00 to Sunday 23:59) for a given date
 */
function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  return { start: monday, end: sunday }
}

/**
 * Check if a date falls on a restricted day
 */
function isRestrictedDay(date: Date, restrictedDays: number[]): boolean {
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
  return restrictedDays.includes(dayOfWeek)
}

/**
 * Check if any part of a shift falls on a restricted day
 */
function hasRestrictedDay(shift: Shift, restrictedDays: number[]): boolean {
  const start = new Date(shift.start)
  const end = new Date(shift.end)

  // Check each day the shift spans
  const checkDate = new Date(start)
  checkDate.setHours(0, 0, 0, 0)

  while (checkDate <= end) {
    if (isRestrictedDay(checkDate, restrictedDays)) {
      return true
    }
    checkDate.setDate(checkDate.getDate() + 1)
  }

  return false
}

/**
 * Check if two date ranges overlap
 */
function doShiftsOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * Calculate hours between two dates
 */
function calculateHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
}

/**
 * Format date/time for display (24 hour format)
 */
function formatDateTimeForTable(dateString: string): string {
  if (!dateString) return ''
  const d = new Date(dateString)
  const year = d.getFullYear()
  const month = d.toLocaleString('en-US', { month: 'short' })
  const day = d.getDate()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month} ${day}, ${year} ${hours}:${minutes}`
}

/**
 * Generate basic shifts based on discharge period
 */
function generateBasicShifts(
  startDischarge: Date,
  dischargeTimeHours: number,
  officeSamplingFinish?: Date
): Shift[] {
  const shifts: Shift[] = []
  const endDischarge = new Date(startDischarge.getTime() + dischargeTimeHours * 60 * 60 * 1000)
  
  // First shift logic
  let currentStart: Date
  
  if (officeSamplingFinish) {
    const officeFinish = new Date(officeSamplingFinish)
    const officeHour = officeFinish.getHours()
    const officeMinutes = officeFinish.getMinutes()
    
    // Check if Office Sampling finishes exactly at the same time as Start Discharge
    const startDischargeHour = startDischarge.getHours()
    const startDischargeMinutes = startDischarge.getMinutes()
    const timesMatch = officeHour === startDischargeHour && 
                       officeMinutes === startDischargeMinutes &&
                       officeFinish.getDate() === startDischarge.getDate() &&
                       officeFinish.getMonth() === startDischarge.getMonth() &&
                       officeFinish.getFullYear() === startDischarge.getFullYear()
    
    if (timesMatch) {
      // Office Sampling finishes exactly at Start Discharge time
      // Check if finish time is outside 07:00-19:00 range (exclusive)
      if (officeHour !== DAY_SHIFT_START_HOUR && officeHour !== NIGHT_SHIFT_START_HOUR) {
        // Start immediately at Start Discharge (same time as Office Sampling finish)
        currentStart = new Date(startDischarge)
      } else {
        // Office Sampling finishes at 07:00 or 19:00, assign different sampler
        // Start at next shift boundary
        const nextBoundary = new Date(startDischarge)
        if (officeHour === DAY_SHIFT_START_HOUR) {
          nextBoundary.setHours(NIGHT_SHIFT_START_HOUR, 0, 0, 0)
        } else {
          nextBoundary.setDate(nextBoundary.getDate() + 1)
          nextBoundary.setHours(DAY_SHIFT_START_HOUR, 0, 0, 0)
        }
        currentStart = nextBoundary
      }
    } else {
      // Office Sampling doesn't finish at Start Discharge time
      // Use original logic
      if (officeHour >= 19 || officeHour < 7) {
        currentStart = new Date(startDischarge)
        // Adjust to next boundary if needed
        const dischargeHour = startDischarge.getHours()
        if (dischargeHour < DAY_SHIFT_START_HOUR) {
          currentStart.setHours(DAY_SHIFT_START_HOUR, 0, 0, 0)
        } else if (dischargeHour < NIGHT_SHIFT_START_HOUR) {
          currentStart.setHours(NIGHT_SHIFT_START_HOUR, 0, 0, 0)
        } else {
          currentStart.setDate(currentStart.getDate() + 1)
          currentStart.setHours(DAY_SHIFT_START_HOUR, 0, 0, 0)
        }
      } else {
        // Start at next shift boundary (07:00 or 19:00)
        const nextBoundary = new Date(startDischarge)
        if (startDischarge.getHours() < DAY_SHIFT_START_HOUR) {
          nextBoundary.setHours(DAY_SHIFT_START_HOUR, 0, 0, 0)
        } else if (startDischarge.getHours() < NIGHT_SHIFT_START_HOUR) {
          nextBoundary.setHours(NIGHT_SHIFT_START_HOUR, 0, 0, 0)
        } else {
          nextBoundary.setDate(nextBoundary.getDate() + 1)
          nextBoundary.setHours(DAY_SHIFT_START_HOUR, 0, 0, 0)
        }
        currentStart = nextBoundary
      }
    }
  } else {
    // If no Office Sampling, start at next shift boundary from startDischarge
    const dischargeHour = startDischarge.getHours()
    currentStart = new Date(startDischarge)
    if (dischargeHour < DAY_SHIFT_START_HOUR) {
      currentStart.setHours(DAY_SHIFT_START_HOUR, 0, 0, 0)
    } else if (dischargeHour < NIGHT_SHIFT_START_HOUR) {
      currentStart.setHours(NIGHT_SHIFT_START_HOUR, 0, 0, 0)
    } else {
      // Next day at 07:00
      currentStart.setDate(currentStart.getDate() + 1)
      currentStart.setHours(DAY_SHIFT_START_HOUR, 0, 0, 0)
    }
  }
  
  // Generate shifts until we cover the discharge period
  while (currentStart < endDischarge) {
    const shiftEnd = new Date(currentStart)
    
    // Determine shift end based on shift type
    const currentHour = currentStart.getHours()
    let shiftDuration: number
    
    if (currentHour === DAY_SHIFT_START_HOUR) {
      // Day shift: 07:00 to 19:00
      shiftEnd.setHours(NIGHT_SHIFT_START_HOUR, 0, 0, 0)
      shiftDuration = SHIFT_DURATION_HOURS
    } else if (currentHour === NIGHT_SHIFT_START_HOUR) {
      // Night shift: 19:00 to next day 07:00
      shiftEnd.setDate(shiftEnd.getDate() + 1)
      shiftEnd.setHours(DAY_SHIFT_START_HOUR, 0, 0, 0)
      shiftDuration = SHIFT_DURATION_HOURS
    } else {
      // First shift - adjust to next boundary or discharge end
      const nextBoundary = new Date(currentStart)
      if (currentHour < DAY_SHIFT_START_HOUR) {
        nextBoundary.setHours(DAY_SHIFT_START_HOUR, 0, 0, 0)
      } else if (currentHour < NIGHT_SHIFT_START_HOUR) {
        nextBoundary.setHours(NIGHT_SHIFT_START_HOUR, 0, 0, 0)
      } else {
        nextBoundary.setDate(nextBoundary.getDate() + 1)
        nextBoundary.setHours(DAY_SHIFT_START_HOUR, 0, 0, 0)
      }
      
      // Use whichever comes first: boundary or discharge end
      shiftEnd.setTime(Math.min(nextBoundary.getTime(), endDischarge.getTime()))
      shiftDuration = calculateHours(currentStart, shiftEnd)
    }
    
    // Ensure shift doesn't exceed discharge end
    if (shiftEnd > endDischarge) {
      shiftEnd.setTime(endDischarge.getTime())
    }
    
    // Ensure first shift doesn't exceed 12 hours
    if (shifts.length === 0 && shiftDuration > SHIFT_DURATION_HOURS) {
      shiftEnd.setTime(currentStart.getTime() + SHIFT_DURATION_HOURS * 60 * 60 * 1000)
      if (shiftEnd > endDischarge) {
        shiftEnd.setTime(endDischarge.getTime())
      }
    }
    
    shifts.push({
      start: new Date(currentStart),
      end: new Date(shiftEnd)
    })
    
    // Move to next shift start
    currentStart = new Date(shiftEnd)
  }
  
  return shifts
}

/**
 * Fetch all conflicts from other modules for a given week
 */
async function fetchConflictAssignments(
  weekStart: Date,
  weekEnd: Date,
  currentLineSamplingShifts: Shift[]
): Promise<ConflictAssignment[]> {
  const conflicts: ConflictAssignment[] = []
  
  try {
    // Fetch Molekulis assignments
    const molekulisResponse = await listMolekulisLoadings({
      limit: 1000,
      sortBy: 'startAt',
      sortOrder: 'asc'
    })
    
    if (molekulisResponse.success && molekulisResponse.data) {
      for (const item of molekulisResponse.data) {
        const startAt = new Date(item.startAt)
        const endAt = new Date(item.endAt)
        
        // Only include if overlaps with our week
        if (doShiftsOverlap(weekStart, weekEnd, startAt, endAt)) {
          conflicts.push({
            module: 'molekulis',
            sampler: item.who,
            startAt,
            endAt
          })
        }
      }
    }
    
    // Fetch Other Jobs assignments
    const otherJobsResponse = await listOtherJobs({
      limit: 1000,
      sortBy: 'startAt',
      sortOrder: 'asc'
    })
    
    if (otherJobsResponse.success && otherJobsResponse.data) {
      for (const item of otherJobsResponse.data) {
        const startAt = new Date(item.startAt)
        const endAt = new Date(item.endAt)
        
        // Only include if overlaps with our week
        if (doShiftsOverlap(weekStart, weekEnd, startAt, endAt)) {
          conflicts.push({
            module: 'other-jobs',
            sampler: item.who,
            startAt,
            endAt
          })
        }
      }
    }
    
    // Add current Line Sampling shifts (if any)
    for (const shift of currentLineSamplingShifts) {
      if (shift.sampler) {
        conflicts.push({
          module: 'line-sampling',
          sampler: shift.sampler,
          startAt: new Date(shift.start),
          endAt: new Date(shift.end)
        })
      }
    }
  } catch (error) {
    console.error('Error fetching conflict assignments:', error)
  }
  
  return conflicts
}

/**
 * Calculate weekly hours for a sampler within a week range
 */
function calculateWeeklyHours(
  sampler: string,
  conflicts: ConflictAssignment[],
  weekStart: Date,
  weekEnd: Date
): number {
  let totalHours = 0
  
  for (const conflict of conflicts) {
    if (conflict.sampler === sampler) {
      const conflictStart = new Date(Math.max(conflict.startAt.getTime(), weekStart.getTime()))
      const conflictEnd = new Date(Math.min(conflict.endAt.getTime(), weekEnd.getTime()))
      
      if (conflictStart < conflictEnd) {
        totalHours += calculateHours(conflictStart, conflictEnd)
      }
    }
  }
  
  return totalHours
}

/**
 * Get last shift end time for a sampler
 */
function getLastShiftEnd(sampler: string, conflicts: ConflictAssignment[]): Date | undefined {
  let lastEnd: Date | undefined
  
  for (const conflict of conflicts) {
    if (conflict.sampler === sampler) {
      if (!lastEnd || conflict.endAt > lastEnd) {
        lastEnd = new Date(conflict.endAt)
      }
    }
  }
  
  return lastEnd
}

/**
 * Check if sampler has sufficient rest
 */
function hasSufficientRest(
  lastShiftEnd: Date | undefined,
  newShiftStart: Date,
  minRestHours: number = MIN_REST_HOURS
): boolean {
  if (!lastShiftEnd) return true
  
  const restHours = calculateHours(lastShiftEnd, newShiftStart)
  return restHours >= minRestHours
}

/**
 * Validate if a sampler can be assigned to a shift
 */
function canAssignSampler(
  sampler: Sampler,
  shift: Shift,
  availability: SamplerAvailability,
  weekStart: Date,
  weekEnd: Date,
  skipRestCheck: boolean = false // Skip rest check for correlative shifts (Office Sampling -> Line Sampling)
): { valid: boolean; reason?: string } {
  // Check if sampler is active
  if (!sampler.isActive) {
    return { valid: false, reason: 'Sampler is inactive' }
  }
  
  // Check restricted days
  if (hasRestrictedDay(shift, sampler.restrictedDays)) {
    const restrictedDays = sampler.restrictedDays.map(d => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[d]
    }).join(', ')
    return { valid: false, reason: `Cannot work on restricted days: ${restrictedDays}` }
  }
  
  // Check conflicts
  for (const conflict of availability.conflicts) {
    if (doShiftsOverlap(shift.start, shift.end, conflict.startAt, conflict.endAt)) {
      return { valid: false, reason: `Conflicts with ${conflict.module} assignment` }
    }
  }
  
  // Check rest period (skip if this is a correlative shift continuation)
  if (!skipRestCheck && !hasSufficientRest(availability.lastShiftEnd, shift.start)) {
    const restHours = availability.lastShiftEnd
      ? calculateHours(availability.lastShiftEnd, shift.start)
      : 0
    return { valid: false, reason: `Insufficient rest: ${restHours.toFixed(1)}h (min ${MIN_REST_HOURS}h)` }
  }
  
  // Check weekly hours limit (if restricted)
  if (sampler.has24HourRestriction) {
    const shiftHours = calculateHours(shift.start, shift.end)
    const projectedWeeklyHours = availability.weeklyHours + shiftHours
    
    if (projectedWeeklyHours > WEEKLY_MAX_HOURS_24) {
      return {
        valid: false,
        reason: `Weekly limit exceeded: ${availability.weeklyHours.toFixed(1)}h + ${shiftHours.toFixed(1)}h = ${projectedWeeklyHours.toFixed(1)}h (max ${WEEKLY_MAX_HOURS_24}h)`
      }
    }
  }
  
  return { valid: true }
}

/**
 * Balance sampler assignments using round-robin with priority based on availability
 */
function assignSamplersToShifts(
  shifts: Shift[],
  samplers: Sampler[],
  conflicts: ConflictAssignment[],
  weekStart: Date,
  weekEnd: Date,
  officeSamplingSampler?: string,
  officeSamplingStart?: Date,
  officeSamplingFinish?: Date,
  startDischarge?: Date
): { shifts: Shift[]; warnings: string[]; errors: string[]; auditLog: string[] } {
  const warnings: string[] = []
  const errors: string[] = []
  const auditLog: string[] = []
  
  // Filter active samplers
  const activeSamplers = samplers.filter(s => s.isActive)
  
  if (activeSamplers.length === 0) {
    errors.push('No active samplers available')
    return { shifts, warnings, errors, auditLog }
  }
  
  // Track sampler usage for balancing
  const samplerUsage: Map<string, number> = new Map()
  activeSamplers.forEach(s => samplerUsage.set(s.name, 0))
  
  // Build availability map for each sampler
  const availabilityMap: Map<string, SamplerAvailability> = new Map()
  
  for (const sampler of activeSamplers) {
    const samplerConflicts = conflicts.filter(c => c.sampler === sampler.name)
    availabilityMap.set(sampler.name, {
      sampler,
      conflicts: samplerConflicts,
      weeklyHours: calculateWeeklyHours(sampler.name, conflicts, weekStart, weekEnd),
      lastShiftEnd: getLastShiftEnd(sampler.name, conflicts)
    })
  }
  
  // Assign samplers to shifts
  const assignedShifts: Shift[] = []
  
  for (let i = 0; i < shifts.length; i++) {
    const shift = shifts[i]
    const shiftWeekStart = getWeekRange(shift.start).start
    const shiftWeekEnd = getWeekRange(shift.start).end
    
    // Special handling for first shift: check if same sampler from Office Sampling can be assigned
    if (i === 0 && officeSamplingSampler && officeSamplingStart && officeSamplingFinish && startDischarge) {
      auditLog.push(`First shift: Checking Office Sampling correlation - Sampler: ${officeSamplingSampler}`)
      
      // Check if Office Sampling finishes exactly at Start Discharge time
      const officeFinish = new Date(officeSamplingFinish)
      const officeHour = officeFinish.getHours()
      const officeMinutes = officeFinish.getMinutes()
      const startDischargeHour = startDischarge.getHours()
      const startDischargeMinutes = startDischarge.getMinutes()
      
      const timesMatch = officeHour === startDischargeHour && 
                         officeMinutes === startDischargeMinutes &&
                         officeFinish.getDate() === startDischarge.getDate() &&
                         officeFinish.getMonth() === startDischarge.getMonth() &&
                         officeFinish.getFullYear() === startDischarge.getFullYear()
      
      auditLog.push(
        `First shift: Office Sampling finish: ${officeFinish.toISOString()} (${officeHour}:${officeMinutes.toString().padStart(2, '0')}), Start Discharge: ${startDischarge.toISOString()} (${startDischargeHour}:${startDischargeMinutes.toString().padStart(2, '0')}), Match: ${timesMatch}`
      )
      
      if (timesMatch && officeHour !== DAY_SHIFT_START_HOUR && officeHour !== NIGHT_SHIFT_START_HOUR) {
        // Find the Office Sampling sampler (case-insensitive, trim spaces)
        const officeSamplerNameNormalized = officeSamplingSampler.trim()
        const officeSampler = activeSamplers.find(s => s.name.trim() === officeSamplerNameNormalized)
        
        auditLog.push(
          `First shift: Looking for sampler "${officeSamplerNameNormalized}" in active samplers: ${activeSamplers.map(s => s.name).join(', ')}`
        )
        
        if (officeSampler) {
          auditLog.push(`First shift: Found Office Sampling sampler: ${officeSampler.name}`)
          // Calculate total hours: Office Sampling + first Line Sampling shift
          const officeHours = calculateHours(new Date(officeSamplingStart), officeFinish)
          const firstShiftHours = calculateHours(shift.start, shift.end)
          const totalHours = officeHours + firstShiftHours
          
          auditLog.push(
            `First shift: Checking Office Sampling sampler ${officeSampler.name} - Office: ${officeHours.toFixed(2)}h + Line: ${firstShiftHours.toFixed(2)}h = ${totalHours.toFixed(2)}h total`
          )
          
          // Check if total hours doesn't exceed 12 hours
          if (totalHours <= SHIFT_DURATION_HOURS) {
            // Get availability for this sampler
            const samplerAvailability = availabilityMap.get(officeSampler.name)
            if (samplerAvailability) {
              // Create updated availability including Office Sampling
              const updatedAvailability: SamplerAvailability = {
                ...samplerAvailability,
                conflicts: [
                  ...samplerAvailability.conflicts,
                  {
                    module: 'line-sampling',
                    sampler: officeSampler.name,
                    startAt: new Date(officeSamplingStart),
                    endAt: officeFinish
                  }
                ],
                lastShiftEnd: officeFinish
              }
              
              // Validate if this sampler can be assigned
              // Skip rest check because this is a correlative continuation of Office Sampling
              const validation = canAssignSampler(
                officeSampler,
                shift,
                updatedAvailability,
                shiftWeekStart,
                shiftWeekEnd,
                true // skipRestCheck = true for correlative shifts
              )
              
              if (validation.valid) {
                shift.sampler = officeSampler.name
                assignedShifts.push(shift)
                samplerUsage.set(officeSampler.name, (samplerUsage.get(officeSampler.name) || 0) + 1)
                
                // Update conflicts for next shift
                conflicts.push({
                  module: 'line-sampling',
                  sampler: officeSampler.name,
                  startAt: new Date(shift.start),
                  endAt: new Date(shift.end)
                })
                
                // Update availability map
                updatedAvailability.conflicts.push({
                  module: 'line-sampling',
                  sampler: officeSampler.name,
                  startAt: new Date(shift.start),
                  endAt: new Date(shift.end)
                })
                updatedAvailability.lastShiftEnd = new Date(shift.end)
                availabilityMap.set(officeSampler.name, updatedAvailability)
                
                auditLog.push(
                  `Shift ${i + 1} (${shift.start.toISOString()} - ${shift.end.toISOString()}): Assigned to ${officeSampler.name} (same as Office Sampling, total ${totalHours.toFixed(2)}h ≤ 12h)`
                )
                continue // Skip to next shift
              } else {
                auditLog.push(
                  `First shift: Office Sampling sampler ${officeSampler.name} - ${validation.reason}`
                )
              }
            }
          } else {
            auditLog.push(
              `First shift: Office Sampling sampler ${officeSampler.name} - Total hours ${totalHours.toFixed(2)}h exceeds 12h limit`
            )
          }
        } else {
          auditLog.push(
            `First shift: Office Sampling sampler "${officeSamplerNameNormalized}" not found in active samplers list`
          )
        }
      } else {
        if (!timesMatch) {
          auditLog.push(
            `First shift: Office Sampling finish time does not match Start Discharge time exactly`
          )
        } else if (officeHour === DAY_SHIFT_START_HOUR || officeHour === NIGHT_SHIFT_START_HOUR) {
          auditLog.push(
            `First shift: Office Sampling finishes at ${officeHour}:00 (shift boundary), will assign different sampler`
          )
        }
      }
    }
    
    // Sort samplers by priority (least used, then by availability)
    const candidates = activeSamplers
      .map(sampler => ({
        sampler,
        availability: availabilityMap.get(sampler.name)!,
        usage: samplerUsage.get(sampler.name) || 0,
        // Update weekly hours for this shift's week
        weeklyHours: calculateWeeklyHours(
          sampler.name,
          conflicts,
          shiftWeekStart,
          shiftWeekEnd
        ),
        lastShiftEnd: getLastShiftEnd(sampler.name, conflicts)
      }))
      .sort((a, b) => {
        // First priority: usage count (balance)
        if (a.usage !== b.usage) {
          return a.usage - b.usage
        }
        // Second priority: least weekly hours
        return a.weeklyHours - b.weeklyHours
      })
    
    let assigned = false
    
    for (const candidate of candidates) {
      // Update availability for this shift
      const updatedAvailability: SamplerAvailability = {
        ...candidate.availability,
        weeklyHours: candidate.weeklyHours,
        lastShiftEnd: candidate.lastShiftEnd
      }
      
      const validation = canAssignSampler(
        candidate.sampler,
        shift,
        updatedAvailability,
        shiftWeekStart,
        shiftWeekEnd
      )
      
      if (validation.valid) {
        shift.sampler = candidate.sampler.name
        assignedShifts.push(shift)
        samplerUsage.set(candidate.sampler.name, (samplerUsage.get(candidate.sampler.name) || 0) + 1)
        
        // Update conflicts for next shift
        conflicts.push({
          module: 'line-sampling',
          sampler: candidate.sampler.name,
          startAt: new Date(shift.start),
          endAt: new Date(shift.end)
        })
        
        // Update availability map
        updatedAvailability.conflicts.push({
          module: 'line-sampling',
          sampler: candidate.sampler.name,
          startAt: new Date(shift.start),
          endAt: new Date(shift.end)
        })
        updatedAvailability.lastShiftEnd = new Date(shift.end)
        availabilityMap.set(candidate.sampler.name, updatedAvailability)
        
        auditLog.push(
          `Shift ${i + 1} (${shift.start.toISOString()} - ${shift.end.toISOString()}): Assigned to ${candidate.sampler.name}`
        )
        assigned = true
        break
      } else {
        auditLog.push(
          `Shift ${i + 1}: ${candidate.sampler.name} - ${validation.reason}`
        )
      }
    }
    
    if (!assigned) {
      assignedShifts.push({ ...shift, sampler: undefined })
      errors.push(
        `Shift ${i + 1} (${formatDateTimeForTable(shift.start.toISOString())} - ${formatDateTimeForTable(shift.end.toISOString())}): No available sampler`
      )
      warnings.push(
        `No sampler could be assigned to shift starting at ${formatDateTimeForTable(shift.start.toISOString())}. Please assign manually.`
      )
    }
  }
  
  return { shifts: assignedShifts, warnings, errors, auditLog }
}

/**
 * Main autogenerate function
 */
export async function autogenerateLineSampling(
  startDischarge: string, // ISO string or 'YYYY-MM-DD HH:mm' format
  dischargeTimeHours: number,
  officeSamplingFinish?: string, // ISO string
  currentLineSamplingData?: LineSamplingRecord[],
  officeSamplingSampler?: string, // Sampler name from Office Sampling
  officeSamplingStart?: string, // ISO string - Office Sampling start time
  requiresLineSampling?: boolean, // Terminal requires line sampling (default: true)
  etc?: string // ISO string - ETC from Ship Nomination (required when requiresLineSampling=false)
): Promise<ValidationResult> {
  const auditLog: string[] = []
  const warnings: string[] = []
  const errors: string[] = []

  try {
    auditLog.push('=== Starting autogenerate process ===')

    // Default requiresLineSampling to true if not provided
    const needsLineSampling = requiresLineSampling !== false
    auditLog.push(`Terminal requires line sampling: ${needsLineSampling}`)

    // Parse dates
    const startDischargeDate = new Date(startDischarge)
    if (isNaN(startDischargeDate.getTime())) {
      return {
        success: false,
        errors: ['Invalid start discharge date'],
        auditLog
      }
    }

    // If terminal doesn't require line sampling, create single manual entry
    if (!needsLineSampling) {
      auditLog.push('Terminal does not require line sampling - generating single manual entry')

      // Validate ETC is provided
      if (!etc) {
        return {
          success: false,
          errors: ['ETC is required for terminals that do not require line sampling'],
          auditLog
        }
      }

      // Parse ETC date - ensure it's treated as ISO string
      let etcDate: Date
      if (typeof etc === 'string') {
        // If it's already an ISO string, parse directly
        if (etc.includes('T') || etc.includes('Z')) {
          etcDate = new Date(etc)
        } else {
          // Try to parse as ISO or as local date
          etcDate = new Date(etc)
        }
      } else {
        etcDate = new Date(etc)
      }

      if (isNaN(etcDate.getTime())) {
        auditLog.push(`ERROR: Invalid ETC date: ${etc}`)
        return {
          success: false,
          errors: [`Invalid ETC date: ${etc}`],
          auditLog
        }
      }

      auditLog.push(`ETC input: ${etc}`)
      auditLog.push(`ETC parsed: ${etcDate.toISOString()}`)

      // Calculate start: ETC - 1 hour (exact calculation)
      const startDate = new Date(etcDate.getTime() - 1 * 60 * 60 * 1000)

      // Calculate finish: start + 4 hours (exact calculation)
      const finishDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000)

      // Calculate hours
      const hours = calculateHours(startDate, finishDate)

      auditLog.push(`ETC: ${etcDate.toISOString()}`)
      auditLog.push(`Calculated Start (ETC - 1h): ${startDate.toISOString()}`)
      auditLog.push(`Calculated Finish (Start + 4h): ${finishDate.toISOString()}`)
      auditLog.push(`Hours: ${hours.toFixed(2)}`)

      const lineSamplingRecords: LineSamplingRecord[] = [{
        who: '', // Empty - to be assigned manually
        startLineSampling: formatDateTimeForTable(startDate.toISOString()),
        startLineSamplingRaw: startDate.toISOString(),
        finishLineSampling: formatDateTimeForTable(finishDate.toISOString()),
        finishLineSamplingRaw: finishDate.toISOString(),
        hours: `${hours.toFixed(2)} hrs`
      }]

      warnings.push('Sampler must be assigned manually before saving')
      auditLog.push('=== Single manual entry generated ===')

      return {
        success: true,
        data: lineSamplingRecords,
        warnings,
        auditLog
      }
    }

    // Continue with normal flow for terminals that require line sampling
    const officeSamplingFinishDate = officeSamplingFinish ? new Date(officeSamplingFinish) : undefined
    const officeSamplingStartDate = officeSamplingStart ? new Date(officeSamplingStart) : undefined

    auditLog.push(`Start Discharge: ${startDischargeDate.toISOString()}`)
    auditLog.push(`Discharge Time: ${dischargeTimeHours} hours`)
    if (officeSamplingFinishDate) {
      auditLog.push(`Office Sampling Finish: ${officeSamplingFinishDate.toISOString()}`)
      if (officeSamplingSampler) {
        auditLog.push(`Office Sampling Sampler: ${officeSamplingSampler}`)
      }
      if (officeSamplingStartDate) {
        auditLog.push(`Office Sampling Start: ${officeSamplingStartDate.toISOString()}`)
      }
    }

    // Generate basic shifts
    const basicShifts = generateBasicShifts(
      startDischargeDate,
      dischargeTimeHours,
      officeSamplingFinishDate
    )
    auditLog.push(`Generated ${basicShifts.length} shifts`)

    // Get all samplers
    const samplersResponse = await dropdownService.getSamplers(true)
    if (!samplersResponse.success || !samplersResponse.data) {
      return {
        success: false,
        errors: ['Failed to fetch samplers'],
        auditLog
      }
    }

    const samplers: Sampler[] = samplersResponse.data as unknown as Sampler[]
    auditLog.push(`Found ${samplers.length} samplers`)

    // Get week range for conflict checking
    const weekStart = getWeekRange(startDischargeDate).start
    const weekEnd = getWeekRange(startDischargeDate).end
    auditLog.push(`Week range: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`)

    // Convert current line sampling data to shifts format
    const currentShifts: Shift[] = []
    if (currentLineSamplingData) {
      for (const record of currentLineSamplingData) {
        if (record.startLineSamplingRaw && record.finishLineSamplingRaw) {
          currentShifts.push({
            start: new Date(record.startLineSamplingRaw),
            end: new Date(record.finishLineSamplingRaw),
            sampler: record.who || undefined
          })
        }
      }
    }

    // Fetch conflicts
    auditLog.push('Fetching conflicts from other modules...')
    const conflicts = await fetchConflictAssignments(weekStart, weekEnd, currentShifts)
    auditLog.push(`Found ${conflicts.length} conflicting assignments`)

    // Assign samplers
    auditLog.push('Assigning samplers to shifts...')
    const assignmentResult = assignSamplersToShifts(
      basicShifts,
      samplers,
      conflicts,
      weekStart,
      weekEnd,
      officeSamplingSampler,
      officeSamplingStartDate,
      officeSamplingFinishDate,
      startDischargeDate
    )

    // Merge audit logs
    auditLog.push(...assignmentResult.auditLog)
    warnings.push(...assignmentResult.warnings)
    errors.push(...assignmentResult.errors)

    // Convert to LineSamplingRecord format
    const lineSamplingRecords: LineSamplingRecord[] = assignmentResult.shifts.map(shift => {
      const hours = calculateHours(shift.start, shift.end)

      return {
        who: shift.sampler || '',
        startLineSampling: formatDateTimeForTable(shift.start.toISOString()),
        startLineSamplingRaw: shift.start.toISOString(),
        finishLineSampling: formatDateTimeForTable(shift.end.toISOString()),
        finishLineSamplingRaw: shift.end.toISOString(),
        hours: `${hours.toFixed(2)} hrs`
      }
    })

    auditLog.push('=== Autogenerate process completed ===')

    return {
      success: errors.length === 0,
      data: lineSamplingRecords,
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined,
      auditLog
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    auditLog.push(`ERROR: ${errorMessage}`)
    console.error('Autogenerate error:', err)
    return {
      success: false,
      errors: [`Autogenerate failed: ${errorMessage}`],
      auditLog
    }
  }
}

// Get sampling roster by AmSpec reference
export const getSamplingRosterByRef = async (amspecRef: string): Promise<ApiResponse<SamplingRoster>> => {
  const encoded = encodeURIComponent(amspecRef)
  const response = await api.get(`/sampling-rosters/ref/${encoded}`)
  return response.data
}

// Create new sampling roster
export const createSamplingRoster = async (data: SamplingRosterData): Promise<ApiResponse<SamplingRoster>> => {
  const response = await api.post('/sampling-rosters', data)
  return response.data
}

// Update sampling roster
export const updateSamplingRoster = async (
  id: string,
  data: Partial<SamplingRosterData>
): Promise<ApiResponse<SamplingRoster>> => {
  const response = await api.put(`/sampling-rosters/${id}`, data)
  return response.data
}

// Upsert sampling roster (create if not exists, update if exists)
export const upsertSamplingRoster = async (
  amspecRef: string,
  data: Partial<SamplingRosterData>
): Promise<ApiResponse<SamplingRoster>> => {
  const response = await api.patch(`/sampling-rosters/upsert/${encodeURIComponent(amspecRef)}`, data)
  return response.data
}

// Get sampling roster by ID
export const getSamplingRosterById = async (id: string): Promise<ApiResponse<SamplingRoster>> => {
  const response = await api.get(`/sampling-rosters/${id}`)
  return response.data
}

