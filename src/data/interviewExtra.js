import { EXTRA_SYSTEMS } from './interviewExtraSystems.js'
import { EXTRA_MODELING } from './interviewExtraModeling.js'
import { EXTRA_FOUNDATIONS } from './interviewExtraFoundations.js'

// Expansion questions authored to match the base bank's shape and quality bar,
// grounded in real MLE·DS interview patterns across Junior → Staff.
export const EXTRA_QUESTIONS = [...EXTRA_FOUNDATIONS, ...EXTRA_SYSTEMS, ...EXTRA_MODELING]
