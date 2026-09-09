import assert from 'node:assert/strict'
import test from 'node:test'
import { assertTripTransition } from '../src/lib/trip-state.ts'

test('allows a valid managed trip transition', () => assert.equal(assertTripTransition('DRIVER_ASSIGNED','DRIVER_EN_ROUTE'),true))
test('rejects skipping passenger verification stages', () => assert.throws(() => assertTripTransition('DRIVER_ASSIGNED','COMPLETED'),/Invalid trip transition/))
