import SamplingRoster from '../models/SamplingRoster.js'
import MolekulisLoading from '../models/MolekulisLoading.js'
import OtherJob from '../models/OtherJob.js'
import Sampler from '../models/Sampler.js'

// @desc    Get samplers hours summary by month
// @route   GET /api/samplers/month-summary
// @access  Public
export const getSamplersMonthSummary = async (req, res) => {
  try {
    const { month, year, targetHours = 38 } = req.query
    const currentDate = new Date()
    const currentYear = year ? parseInt(year) : currentDate.getFullYear()
    const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1

    // Get all samplers with their restrictions
    const allSamplers = await Sampler.find({ isActive: true })
    const samplerRestrictions = new Map()
    allSamplers.forEach(sampler => {
      samplerRestrictions.set(sampler.name, {
        has24HourRestriction: sampler.has24HourRestriction,
        restrictedDays: sampler.restrictedDays
      })
    })

    // Get all SamplingRoster records
    const samplingRosterData = await SamplingRoster.find({
      $or: [
        { 'officeSampling.startOffice': { $exists: true } },
        { 'lineSampling.startLineSampling': { $exists: true } }
      ]
    }).lean()

    // Get all MolekulisLoading records
    const molekulisData = await MolekulisLoading.find({
      startAt: { $exists: true }
    }).lean()

    // Get all OtherJob records
    const otherJobData = await OtherJob.find({
      startAt: { $exists: true }
    }).lean()

    // Helper function to calculate hours in a month
    const calculateHoursInMonth = (workStart, workEnd, year, month) => {
      const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

      const intersectionStart = new Date(Math.max(workStart.getTime(), monthStart.getTime()))
      const intersectionEnd = new Date(Math.min(workEnd.getTime(), monthEnd.getTime()))

      if (intersectionStart >= intersectionEnd) {
        return 0
      }

      const diffMs = intersectionEnd.getTime() - intersectionStart.getTime()
      return diffMs / (1000 * 60 * 60)
    }

    // Combine all data
    const samplerMap = new Map()

    // Add SamplingRoster office hours
    samplingRosterData.forEach(record => {
      if (record.officeSampling && record.officeSampling.length > 0) {
        record.officeSampling.forEach(item => {
          if (item.who && item.startOffice && item.finishSampling) {
            const workStart = new Date(item.startOffice)
            const workEnd = new Date(item.finishSampling)
            const hoursInMonth = calculateHoursInMonth(workStart, workEnd, currentYear, currentMonth)

            if (hoursInMonth > 0) {
              const sampler = samplerMap.get(item.who) || {
                samplerName: item.who,
                month: currentMonth,
                year: currentYear,
                totalHours: 0,
                breakdown: {
                  officeSampling: 0,
                  lineSampling: 0,
                  molekulisLoading: 0,
                  otherJobs: 0
                }
              }
              sampler.breakdown.officeSampling += hoursInMonth
              sampler.totalHours += hoursInMonth
              samplerMap.set(item.who, sampler)
            }
          }
        })
      }
    })

    // Add SamplingRoster line hours
    samplingRosterData.forEach(record => {
      if (record.lineSampling && record.lineSampling.length > 0) {
        record.lineSampling.forEach(item => {
          if (item.who && item.startLineSampling && item.finishLineSampling) {
            const workStart = new Date(item.startLineSampling)
            const workEnd = new Date(item.finishLineSampling)
            const hoursInMonth = calculateHoursInMonth(workStart, workEnd, currentYear, currentMonth)

            if (hoursInMonth > 0) {
              const sampler = samplerMap.get(item.who) || {
                samplerName: item.who,
                month: currentMonth,
                year: currentYear,
                totalHours: 0,
                breakdown: {
                  officeSampling: 0,
                  lineSampling: 0,
                  molekulisLoading: 0,
                  otherJobs: 0
                }
              }
              sampler.breakdown.lineSampling += hoursInMonth
              sampler.totalHours += hoursInMonth
              samplerMap.set(item.who, sampler)
            }
          }
        })
      }
    })

    // Add MolekulisLoading hours
    molekulisData.forEach(item => {
      if (item.who && item.startAt && item.endAt) {
        const workStart = new Date(item.startAt)
        const workEnd = new Date(item.endAt)
        const hoursInMonth = calculateHoursInMonth(workStart, workEnd, currentYear, currentMonth)

        if (hoursInMonth > 0) {
          const sampler = samplerMap.get(item.who) || {
            samplerName: item.who,
            month: currentMonth,
            year: currentYear,
            totalHours: 0,
            breakdown: {
              officeSampling: 0,
              lineSampling: 0,
              molekulisLoading: 0,
              otherJobs: 0
            }
          }
          sampler.breakdown.molekulisLoading += hoursInMonth
          sampler.totalHours += hoursInMonth
          samplerMap.set(item.who, sampler)
        }
      }
    })

    // Add OtherJob hours
    otherJobData.forEach(item => {
      if (item.who && item.startAt && item.endAt) {
        const workStart = new Date(item.startAt)
        const workEnd = new Date(item.endAt)
        const hoursInMonth = calculateHoursInMonth(workStart, workEnd, currentYear, currentMonth)

        if (hoursInMonth > 0) {
          const sampler = samplerMap.get(item.who) || {
            samplerName: item.who,
            month: currentMonth,
            year: currentYear,
            totalHours: 0,
            breakdown: {
              officeSampling: 0,
              lineSampling: 0,
              molekulisLoading: 0,
              otherJobs: 0
            }
          }
          sampler.breakdown.otherJobs += hoursInMonth
          sampler.totalHours += hoursInMonth
          samplerMap.set(item.who, sampler)
        }
      }
    })

    // Calculate percentages (monthly target = weekly target * 4.33 weeks)
    const result = Array.from(samplerMap.values()).map(sampler => {
      const restriction = samplerRestrictions.get(sampler.samplerName) || { has24HourRestriction: false }
      const monthlyTargetHours = (restriction.has24HourRestriction ? 24 : parseFloat(targetHours)) * 4.33

      const percentage = (sampler.totalHours / monthlyTargetHours) * 100
      let status

      if (percentage > 100) {
        status = 'overtime'
      } else if (percentage >= 80) {
        status = 'on-track'
      } else {
        status = 'under-target'
      }

      return {
        ...sampler,
        percentage: Math.round(percentage * 100) / 100,
        targetHours: Math.round(monthlyTargetHours * 100) / 100,
        has24HourRestriction: restriction.has24HourRestriction,
        restrictedDays: restriction.restrictedDays,
        status
      }
    })

    // Sort by total hours descending
    result.sort((a, b) => b.totalHours - a.totalHours)

    res.status(200).json({
      success: true,
      data: result,
      month: currentMonth,
      year: currentYear,
      targetHours: parseFloat(targetHours),
      totalSamplers: result.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching samplers month summary',
      error: error.message
    })
  }
}

// @desc    Get samplers hours summary by week
// @route   GET /api/samplers/hours-summary
// @access  Public
export const getSamplersHoursSummary = async (req, res) => {
  try {
    const { week, year, targetHours = 38 } = req.query
    const currentDate = new Date()
    const currentYear = year ? parseInt(year) : currentDate.getFullYear()
    const currentWeek = week ? parseInt(week) : getWeekNumber(currentDate)

    // Get all samplers with their restrictions
    const allSamplers = await Sampler.find({ isActive: true })
    const samplerRestrictions = new Map()
    allSamplers.forEach(sampler => {
      samplerRestrictions.set(sampler.name, {
        has24HourRestriction: sampler.has24HourRestriction,
        restrictedDays: sampler.restrictedDays
      })
    })

    // Calculate date range for the specified week
    const startDate = getStartOfWeek(currentYear, currentWeek)
    const endDate = getEndOfWeek(currentYear, currentWeek)

    // Get all SamplingRoster records (we'll filter by intersection in JavaScript)
    const samplingRosterData = await SamplingRoster.find({
      $or: [
        { 'officeSampling.startOffice': { $exists: true } },
        { 'lineSampling.startLineSampling': { $exists: true } }
      ]
    }).lean()

    // Get all MolekulisLoading records (we'll filter by intersection in JavaScript)
    const molekulisData = await MolekulisLoading.find({
      startAt: { $exists: true }
    }).lean()

    // Get all OtherJob records (we'll filter by intersection in JavaScript)
    const otherJobData = await OtherJob.find({
      startAt: { $exists: true }
    }).lean()

    // Helper function to calculate intersection hours between two date ranges
    const calculateIntersectionHours = (start1, end1, start2, end2) => {
      const intersectionStart = new Date(Math.max(start1.getTime(), start2.getTime()))
      const intersectionEnd = new Date(Math.min(end1.getTime(), end2.getTime()))

      if (intersectionStart >= intersectionEnd) {
        return 0 // No intersection
      }

      // Calculate hours difference
      const diffMs = intersectionEnd.getTime() - intersectionStart.getTime()
      return diffMs / (1000 * 60 * 60) // Convert ms to hours
    }

    // Combine all data
    const samplerMap = new Map()

    // Add SamplingRoster office hours with proper date intersection
    samplingRosterData.forEach(record => {
      if (record.officeSampling && record.officeSampling.length > 0) {
        record.officeSampling.forEach(item => {
          if (item.who && item.startOffice && item.finishSampling) {
            const workStart = new Date(item.startOffice)
            const workEnd = new Date(item.finishSampling)

            // Calculate intersection with target week
            const hoursInWeek = calculateIntersectionHours(workStart, workEnd, startDate, endDate)

            if (hoursInWeek > 0) {
              const sampler = samplerMap.get(item.who) || {
                samplerName: item.who,
                week: currentWeek,
                year: currentYear,
                totalHours: 0,
                breakdown: {
                  officeSampling: 0,
                  lineSampling: 0,
                  molekulisLoading: 0,
                  otherJobs: 0
                }
              }
              sampler.breakdown.officeSampling += hoursInWeek
              sampler.totalHours += hoursInWeek
              samplerMap.set(item.who, sampler)
            }
          }
        })
      }
    })

    // Add SamplingRoster line hours with proper date intersection
    samplingRosterData.forEach(record => {
      if (record.lineSampling && record.lineSampling.length > 0) {
        record.lineSampling.forEach(item => {
          if (item.who && item.startLineSampling && item.finishLineSampling) {
            const workStart = new Date(item.startLineSampling)
            const workEnd = new Date(item.finishLineSampling)

            // Calculate intersection with target week
            const hoursInWeek = calculateIntersectionHours(workStart, workEnd, startDate, endDate)

            if (hoursInWeek > 0) {
              const sampler = samplerMap.get(item.who) || {
                samplerName: item.who,
                week: currentWeek,
                year: currentYear,
                totalHours: 0,
                breakdown: {
                  officeSampling: 0,
                  lineSampling: 0,
                  molekulisLoading: 0,
                  otherJobs: 0
                }
              }
              sampler.breakdown.lineSampling += hoursInWeek
              sampler.totalHours += hoursInWeek
              samplerMap.set(item.who, sampler)
            }
          }
        })
      }
    })

    // Add MolekulisLoading hours with proper date intersection
    molekulisData.forEach(item => {
      if (item.who && item.startAt && item.endAt) {
        const workStart = new Date(item.startAt)
        const workEnd = new Date(item.endAt)

        // Calculate intersection with target week
        const hoursInWeek = calculateIntersectionHours(workStart, workEnd, startDate, endDate)

        if (hoursInWeek > 0) {
          const sampler = samplerMap.get(item.who) || {
            samplerName: item.who,
            week: currentWeek,
            year: currentYear,
            totalHours: 0,
            breakdown: {
              officeSampling: 0,
              lineSampling: 0,
              molekulisLoading: 0,
              otherJobs: 0
            }
          }
          sampler.breakdown.molekulisLoading += hoursInWeek
          sampler.totalHours += hoursInWeek
          samplerMap.set(item.who, sampler)
        }
      }
    })

    // Add OtherJob hours with proper date intersection
    otherJobData.forEach(item => {
      if (item.who && item.startAt && item.endAt) {
        const workStart = new Date(item.startAt)
        const workEnd = new Date(item.endAt)

        // Calculate intersection with target week
        const hoursInWeek = calculateIntersectionHours(workStart, workEnd, startDate, endDate)

        if (hoursInWeek > 0) {
          const sampler = samplerMap.get(item.who) || {
            samplerName: item.who,
            week: currentWeek,
            year: currentYear,
            totalHours: 0,
            breakdown: {
              officeSampling: 0,
              lineSampling: 0,
              molekulisLoading: 0,
              otherJobs: 0
            }
          }
          sampler.breakdown.otherJobs += hoursInWeek
          sampler.totalHours += hoursInWeek
          samplerMap.set(item.who, sampler)
        }
      }
    })

    // Convert to array and calculate percentages
    const result = Array.from(samplerMap.values()).map(sampler => {
      // Get sampler restriction (default to false if not found)
      const restriction = samplerRestrictions.get(sampler.samplerName) || { has24HourRestriction: false }
      const samplerTargetHours = restriction.has24HourRestriction ? 24 : parseFloat(targetHours)

      const percentage = (sampler.totalHours / samplerTargetHours) * 100
      let status

      if (percentage > 100) {
        status = 'overtime'
      } else if (percentage >= 80) {
        status = 'on-track'
      } else {
        status = 'under-target'
      }

      return {
        ...sampler,
        percentage: Math.round(percentage * 100) / 100,
        targetHours: samplerTargetHours,
        has24HourRestriction: restriction.has24HourRestriction,
        restrictedDays: restriction.restrictedDays,
        status
      }
    })

    // Sort by total hours descending
    result.sort((a, b) => b.totalHours - a.totalHours)

    res.status(200).json({
      success: true,
      data: result,
      week: currentWeek,
      year: currentYear,
      targetHours: parseFloat(targetHours),
      totalSamplers: result.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching samplers hours summary',
      error: error.message
    })
  }
}

// Helper function to get start of week (Monday to Sunday)
function getStartOfWeek(year, week) {
  // Simple calculation: (week - 1) weeks from Jan 1st, then adjust to Monday
  const jan1 = new Date(year, 0, 1)
  const jan1Day = jan1.getDay()
  const jan1Monday = jan1Day === 0 ? -6 : 1 - jan1Day // Days to go back to Monday
  const firstMonday = new Date(year, 0, 1 + jan1Monday)

  // Add (week - 1) weeks to first Monday
  const monday = new Date(firstMonday)
  monday.setDate(firstMonday.getDate() + (week - 1) * 7)
  monday.setHours(0, 0, 0, 0)

  return monday
}

// Helper function to get end of week
function getEndOfWeek(year, week) {
  const startOfWeek = getStartOfWeek(year, week)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  return endOfWeek
}

// Helper function to get week number (Monday to Sunday, consistent with getStartOfWeek)
function getWeekNumber(date) {
  const d = new Date(date)

  // Get the Monday of the week containing this date
  const day = d.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  const monday = new Date(d)
  monday.setDate(d.getDate() - daysFromMonday)
  monday.setHours(0, 0, 0, 0)

  // Get the first Monday of the year
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const jan1Day = jan1.getDay()
  const jan1Monday = new Date(jan1)
  if (jan1Day === 0) {
    // Jan 1 is Sunday, first Monday is Jan 8
    jan1Monday.setDate(jan1.getDate() + 6)
  } else {
    // Jan 1 is Mon-Sat, first Monday is before Jan 1
    jan1Monday.setDate(1 - (jan1Day - 1))
  }
  jan1Monday.setHours(0, 0, 0, 0)

  // Calculate the week number
  const diffTime = monday.getTime() - jan1Monday.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}
