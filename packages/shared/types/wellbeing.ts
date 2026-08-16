// A 1-5 self-reported scale, not a clinical instrument. VORA never diagnoses;
// this module supports self-reflection and workload awareness, nothing more.
export const WELLBEING_SCALE = [1, 2, 3, 4, 5] as const
export type WellbeingScaleValue = (typeof WELLBEING_SCALE)[number]

export interface WellbeingCheckIn {
  id: string
  userId: string
  date: string // YYYY-MM-DD, one check-in per user per day
  mood: WellbeingScaleValue
  energy: WellbeingScaleValue
  stress: WellbeingScaleValue
  note: string
  createdAt: string
  updatedAt: string
}

export type WellbeingCheckInInput = Omit<WellbeingCheckIn, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
