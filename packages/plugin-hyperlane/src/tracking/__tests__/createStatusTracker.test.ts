import { describe, it, expect, vi } from 'vitest'
import { createStatusTracker } from '../createStatusTracker'
import { StorageService } from '@elizaos/core'

describe('createStatusTracker', () => {
  const createMockStorage = () => {
    const store = new Map<string, string>()
    return {
      getItem: vi.fn((key: string) => Promise.resolve(store.get(key))),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value)
        return Promise.resolve()
      }),
      keys: vi.fn(() => Promise.resolve(Array.from(store.keys()))),
      clear: vi.fn(() => {
        store.clear()
        return Promise.resolve()
      })
    } as unknown as StorageService
  }

  const testMessage = {
    id: '0x1234',
    status: 'pending',
    origin: 1,
    destination: 2,
    timestamp: Date.now(),
    metadata: {}
  } as const

  it('returns failed status for non-existent message', async () => {
    const storage = createMockStorage()
    const tracker = createStatusTracker(storage)

    const state = await tracker('non-existent')
    expect(state.status).toBe('failed')
    expect(state.metadata.get('error')).toBe('Message not found')
  })

  it('tracks existing message status', async () => {
    const storage = createMockStorage()
    await storage.setItem('message:0x1234', JSON.stringify(testMessage))

    const tracker = createStatusTracker(storage)
    const state = await tracker('0x1234')

    expect(state.status).toBe('pending')
    expect(state.id).toBe('0x1234')
    expect(state.origin).toBe(1)
    expect(state.destination).toBe(2)
  })

  it('preserves immutability of returned state', async () => {
    const storage = createMockStorage()
    await storage.setItem('message:0x1234', JSON.stringify(testMessage))

    const tracker = createStatusTracker(storage)
    const state = await tracker('0x1234')

    expect(() => {
      // @ts-expect-error Testing immutability
      state.status = 'delivered'
    }).toThrow(TypeError)
  })
})
