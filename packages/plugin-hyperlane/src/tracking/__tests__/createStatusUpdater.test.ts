import { describe, it, expect, vi } from 'vitest'
import { createStatusUpdater } from '../createStatusUpdater'
import { StorageService } from '@elizaos/core'
import { MessageState } from '../../types/status'

describe('createStatusUpdater', () => {
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

  const testMessage: MessageState = {
    id: '0x1234',
    status: 'pending',
    origin: 1,
    destination: 2,
    timestamp: Date.now(),
    metadata: {}
  } as const

  it('throws error for non-existent message', async () => {
    const storage = createMockStorage()
    const updater = createStatusUpdater(storage)

    await expect(
      updater({
        id: 'non-existent',
        status: 'delivered',
        timestamp: Date.now()
      })
    ).rejects.toThrow('Message not found')
  })

  it('updates message status', async () => {
    const storage = createMockStorage()
    await storage.setItem('message:0x1234', JSON.stringify(testMessage))

    const updater = createStatusUpdater(storage)
    const newState = await updater({
      id: '0x1234',
      status: 'delivered',
      timestamp: Date.now()
    })

    expect(newState.status).toBe('delivered')
    expect(newState.id).toBe('0x1234')
  })

  it('merges metadata on update', async () => {
    const storage = createMockStorage()
    await storage.setItem('message:0x1234', JSON.stringify({
      ...testMessage,
      metadata: { key1: 'value1' }
    }))

    const updater = createStatusUpdater(storage)
    const newState = await updater({
      id: '0x1234',
      status: 'delivered',
      timestamp: Date.now(),
      metadata: new Map([['key2', 'value2']])
    })

    expect(newState.metadata.get('key1')).toBe('value1')
    expect(newState.metadata.get('key2')).toBe('value2')
  })

  it('preserves immutability of returned state', async () => {
    const storage = createMockStorage()
    await storage.setItem('message:0x1234', JSON.stringify(testMessage))

    const updater = createStatusUpdater(storage)
    const newState = await updater({
      id: '0x1234',
      status: 'delivered',
      timestamp: Date.now()
    })

    expect(() => {
      // @ts-expect-error Testing immutability
      newState.status = 'failed'
    }).toThrow(TypeError)
  })
})
