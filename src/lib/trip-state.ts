import { validTripTransitions } from './domain'
export function assertTripTransition(current:string,next:string) { if (!validTripTransitions[current]?.includes(next)) throw new Error(`Invalid trip transition: ${current} → ${next}`); return true }
