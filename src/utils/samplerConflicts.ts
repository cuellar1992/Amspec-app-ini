import type { MolekulisLoading } from '@/stores/molekulisLoading'
import type { OtherJob } from '@/stores/otherJobs'

export interface SamplerConflict {
  sampler: string
  type: 'overlap' | 'too-close'
  job1: {
    type: 'molekulis' | 'other' | 'sampling-roster'
    id: string
    startAt: Date | string
    endAt: Date | string
    description?: string
  }
  job2: {
    type: 'molekulis' | 'other' | 'sampling-roster'
    id: string
    startAt: Date | string
    endAt: Date | string
    description?: string
  }
  minutesOverlap?: number
}

/**
 * Check if two time ranges overlap
 */
export function hasTimeOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = new Date(start1)
  const e1 = new Date(end1)
  const s2 = new Date(start2)
  const e2 = new Date(end2)

  return s1 < e2 && s2 < e1
}

/**
 * Calculate overlap in minutes between two time ranges
 */
export function calculateOverlapMinutes(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): number {
  const s1 = new Date(start1)
  const e1 = new Date(end1)
  const s2 = new Date(start2)
  const e2 = new Date(end2)

  if (!hasTimeOverlap(start1, end1, start2, end2)) {
    return 0
  }

  const overlapStart = s1 > s2 ? s1 : s2
  const overlapEnd = e1 < e2 ? e1 : e2

  return Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60))
}

/**
 * Check if a sampler has 24-hour restriction and if the job is within restricted days
 */
export function checkSamplerRestriction(
  sampler: { name: string; has24HourRestriction?: boolean; restrictedDays?: number[] },
  jobDate: Date | string
): boolean {
  if (!sampler.has24HourRestriction || !sampler.restrictedDays?.length) {
    return false
  }

  const date = new Date(jobDate)
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.

  return sampler.restrictedDays.includes(dayOfWeek)
}

/**
 * Detect sampler conflicts across Molekulis Loadings and Other Jobs
 */
export function detectSamplerConflicts(
  molekulisLoadings: MolekulisLoading[],
  otherJobs: OtherJob[],
  samplingRosters: any[] = [],
  newJob?: {
    who: string
    startAt: Date | string
    endAt: Date | string
    type: 'molekulis' | 'other' | 'sampling-roster'
    id?: string
  }
): SamplerConflict[] {
  const conflicts: SamplerConflict[] = []

  // Create a unified list of all jobs
  interface UnifiedJob {
    id: string
    who: string
    startAt: Date | string
    endAt: Date | string
    type: 'molekulis' | 'other' | 'sampling-roster'
    description?: string
  }

  const allJobs: UnifiedJob[] = [
    ...molekulisLoadings.map(ml => ({
      id: ml._id,
      who: ml.who,
      startAt: ml.startAt,
      endAt: ml.endAt,
      type: 'molekulis' as const,
      description: `${ml.loads?.length || 0} loads`
    })),
    ...otherJobs.map(oj => ({
      id: oj._id,
      who: oj.who,
      startAt: oj.startAt,
      endAt: oj.endAt,
      type: 'other' as const,
      description: oj.description
    })),
    ...samplingRosters.map(sr => ({
      id: sr._id,
      who: sr.officeSampling?.[0]?.who || sr.lineSampling?.[0]?.who,
      startAt: sr.officeSampling?.[0]?.startOffice || sr.lineSampling?.[0]?.startLineSampling,
      endAt: sr.officeSampling?.[0]?.finishSampling || sr.lineSampling?.[0]?.finishLineSampling,
      type: 'sampling-roster' as const,
      description: sr.amspecRef
    }))
  ].filter(job => job.who && job.startAt && job.endAt)

  // If there's a new job, add it to the list for checking
  if (newJob && newJob.who && newJob.startAt && newJob.endAt) {
    allJobs.push({
      id: newJob.id || 'new',
      who: newJob.who,
      startAt: newJob.startAt,
      endAt: newJob.endAt,
      type: newJob.type,
      description: 'New job'
    })
  }

  // Check all jobs against each other
  for (let i = 0; i < allJobs.length; i++) {
    for (let j = i + 1; j < allJobs.length; j++) {
      const job1 = allJobs[i]
      const job2 = allJobs[j]

      // Only check if same sampler
      if (job1.who !== job2.who) continue

      // Check for overlap
      if (hasTimeOverlap(job1.startAt, job1.endAt, job2.startAt, job2.endAt)) {
        const minutesOverlap = calculateOverlapMinutes(
          job1.startAt,
          job1.endAt,
          job2.startAt,
          job2.endAt
        )

        conflicts.push({
          sampler: job1.who,
          type: 'overlap',
          minutesOverlap,
          job1: {
            type: job1.type,
            id: job1.id,
            startAt: job1.startAt,
            endAt: job1.endAt,
            description: job1.description
          },
          job2: {
            type: job2.type,
            id: job2.id,
            startAt: job2.startAt,
            endAt: job2.endAt,
            description: job2.description
          }
        })
      }
    }
  }

  return conflicts
}

/**
 * Format conflict message for display
 */
export function formatConflictMessage(conflict: SamplerConflict): string {
  const job1Type = conflict.job1.type === 'molekulis' ? 'Molekulis Loading' :
                   conflict.job1.type === 'other' ? 'Other Job' : 'Sampling Roster'
  const job2Type = conflict.job2.type === 'molekulis' ? 'Molekulis Loading' :
                   conflict.job2.type === 'other' ? 'Other Job' : 'Sampling Roster'

  if (conflict.type === 'overlap') {
    return `⚠️ ${conflict.sampler} has overlapping jobs: ${job1Type} and ${job2Type} (${conflict.minutesOverlap} min overlap)`
  }

  return `⚠️ ${conflict.sampler} has jobs too close together`
}
