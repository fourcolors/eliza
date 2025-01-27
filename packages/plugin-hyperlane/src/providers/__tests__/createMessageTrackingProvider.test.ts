import { describe, it, expect, vi } from 'vitest'
import { createMessageTrackingProvider } from '../createMessageTrackingProvider'
import { Memory } from '@elizaos/core'
import { HyperlaneMessage, MessageStatus } from '../../types/message'

describe('createMessageTrackingProvider', () => {
  // Pure function to create mock memory
  const createMockMemory = (): Memory => {
    const store = new Map<string, string>()
    return {
      get: vi.fn(async (key: string) => store.get(key)),
      set: vi.fn(async (key: string, value: string) => {
        store.set(key, value)
        return true
      }),
      delete: vi.fn(async (key: string) => {
        store.delete(key)
        return true
      }),
      clear: vi.fn(async () => {
        store.clear()
        return true
      }),
      keys: vi.fn(async (pattern?: string) => {
        if (!pattern) return Array.from(store.keys())
        const regex = new RegExp(pattern.replace('*', '.*'))
        return Array.from(store.keys()).filter(key => regex.test(key))
      }),
    }
  }

  // Test message
  const testMessage: HyperlaneMessage = {
    id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    sender: '0x1234567890123456789012345678901234567890',
    recipient: '0x0987654321098765432109876543210987654321',
    origin: 1,
    destination: 2,
    body: '0xabcdef',
    timestamp: Date.now()
  } as const

  it('tracks new message with initial pending status', async () => {
    const memory = createMockMemory()
    const provider = createMessageTrackingProvider(memory)

    await provider.trackMessage(testMessage)

    const history = await provider.getMessageHistory(testMessage.id)
    expect(history).toHaveLength(1)
    expect(history[0].status).toBe('pending')
  })

  it('updates message status', async () => {
    const memory = createMockMemory()
    const provider = createMessageTrackingProvider(memory)

    await provider.trackMessage(testMessage)
    await provider.updateStatus(testMessage.id, 'delivered')

    const status = await provider.getMessageStatus(testMessage.id)
    expect(status).toBe('delivered')

    const history = await provider.getMessageHistory(testMessage.id)
    expect(history).toHaveLength(2)
    expect(history[1].status).toBe('delivered')
  })

  it('lists messages with filtering', async () => {
    const memory = createMockMemory()
    const provider = createMessageTrackingProvider(memory)

    const testMessage2: HyperlaneMessage = {
      ...testMessage,
      id: '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      origin: 3
    } as const

    await provider.trackMessage(testMessage)
    await provider.trackMessage(testMessage2)

    // Filter by origin
    const filteredMessages = await provider.listMessages({
      origin: 1
    })
    expect(filteredMessages).toHaveLength(1)
    expect(filteredMessages[0].message.id).toBe(testMessage.id)

    // Filter by status
    await provider.updateStatus(testMessage.id, 'delivered')
    const deliveredMessages = await provider.listMessages({
      status: 'delivered'
    })
    expect(deliveredMessages).toHaveLength(1)
    expect(deliveredMessages[0].message.id).toBe(testMessage.id)
  })

  it('validates message ID format', async () => {
    const memory = createMockMemory()
    const provider = createMessageTrackingProvider(memory)

    await expect(
      provider.updateStatus('invalid-id', 'delivered')
    ).rejects.toThrow('Invalid message ID')
  })

  it('validates status values', async () => {
    const memory = createMockMemory()
    const provider = createMessageTrackingProvider(memory)

    await provider.trackMessage(testMessage)

    await expect(
      provider.updateStatus(testMessage.id, 'invalid' as MessageStatus)
    ).rejects.toThrow('Invalid status')
  })

  it('handles non-existent messages', async () => {
    const memory = createMockMemory()
    const provider = createMessageTrackingProvider(memory)

    const validId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

    await expect(
      provider.getMessageHistory(validId)
    ).rejects.toThrow('Message not found')

    await expect(
      provider.getMessageStatus(validId)
    ).rejects.toThrow('Message not found')
  })

  it('maintains immutable history', async () => {
    const memory = createMockMemory()
    const provider = createMessageTrackingProvider(memory)

    await provider.trackMessage(testMessage)
    await provider.updateStatus(testMessage.id, 'delivered')
    await provider.updateStatus(testMessage.id, 'relayed')

    const history = await provider.getMessageHistory(testMessage.id)
    expect(history).toHaveLength(3)
    expect(history[0].status).toBe('pending')
    expect(history[1].status).toBe('delivered')
    expect(history[2].status).toBe('relayed')

    // Verify history entries are readonly
    const historyEntry = history[0]
    expect(() => {
      // @ts-expect-error Testing immutability
      historyEntry.status = 'failed'
    }).toThrow(TypeError)
  })
})
