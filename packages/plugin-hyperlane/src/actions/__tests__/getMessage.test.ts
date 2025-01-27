import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGetMessageAction } from '../getMessage'
import type { IAgentRuntime } from '@elizaos/core'
import type { HyperlaneMessage } from '../../types/message'

describe('getMessage action', () => {
  const mockMessage: Readonly<HyperlaneMessage> = {
    id: '0x123',
    body: '0x456',
    recipient: '0xabc',
    destinationChain: 'ethereum'
  }

  const createMockMemory = () => ({
    get: vi.fn(),
    set: vi.fn()
  })

  const createMockRuntime = (memory = createMockMemory()) => ({
    memory,
    services: {
      get: vi.fn()
    }
  }) as unknown as IAgentRuntime

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should get message successfully', async () => {
    const mockMemory = createMockMemory()
    mockMemory.get.mockResolvedValue(mockMessage)
    const mockRuntime = createMockRuntime(mockMemory)

    const action = createGetMessageAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          messageId: '0x123'
        }
      }
    })

    expect(mockMemory.get).toHaveBeenCalledWith('message:0x123')
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ message: mockMessage })
  })

  it('should handle message not found', async () => {
    const mockMemory = createMockMemory()
    mockMemory.get.mockResolvedValue(null)
    const mockRuntime = createMockRuntime(mockMemory)

    const action = createGetMessageAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          messageId: '0x123'
        }
      }
    })

    expect(mockMemory.get).toHaveBeenCalledWith('message:0x123')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Message 0x123 not found')
  })

  it('should handle invalid message id format', async () => {
    const mockRuntime = createMockRuntime()

    const action = createGetMessageAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          messageId: 'invalid-id'
        }
      }
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid message ID format')
  })

  it('should validate input correctly', async () => {
    const mockRuntime = createMockRuntime()
    const action = createGetMessageAction()

    const validResult = await action.validate(mockRuntime, {
      content: {
        input: {
          messageId: '0x123'
        }
      }
    })

    const invalidResult = await action.validate(mockRuntime, {
      content: {
        input: {
          messageId: 'invalid-id'
        }
      }
    })

    expect(validResult).toBe(true)
    expect(invalidResult).toBe(false)
  })
})
