import { generateKeyBetween } from 'fractional-indexing'

export function generateInitialKeys(count: number): string[] {
  const keys: string[] = []
  let prev: string | null = null
  for (let i = 0; i < count; i++) {
    const key = generateKeyBetween(prev, null)
    keys.push(key)
    prev = key
  }
  return keys
}

export function needsRebalance(positions: string[]): boolean {
  return positions.some(p => p.length > 20)
}

export function rebalancedKeys(count: number): string[] {
  return generateInitialKeys(count)
}