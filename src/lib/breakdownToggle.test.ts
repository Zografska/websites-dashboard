import { describe, expect, it } from 'vitest'
import { toggleCategory } from './filters'

const ALL = ['x', 'y', 'z']

// D15 table (IMPLEMENTATION_PLAN §7.5)
describe('toggleCategory', () => {
  it('all → [X]', () => expect(toggleCategory(null, 'x', ALL)).toEqual(['x']))
  it('[X] click X → all', () => expect(toggleCategory(['x'], 'x', ALL)).toBeNull())
  it('[X] click Y → [X, Y]', () => expect(toggleCategory(['x'], 'y', ALL)).toEqual(['x', 'y']))
  it('[X, Y] click X → [Y]', () => expect(toggleCategory(['x', 'y'], 'x', ALL)).toEqual(['y']))
  it('selection + X equal to the full set → all', () => expect(toggleCategory(['x', 'z'], 'y', ALL)).toBeNull())
})
