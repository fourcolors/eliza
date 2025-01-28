import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createVerifyMessageAction } from '../verifyMessage'
import { ServiceType } from '@elizaos/core'
import type { IAgentRuntime } from '@elizaos/core'
import type { HyperlaneMessage } from '../../types/message'

describe('verifyMessage action', () => {
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

  const createMockIsm = () => ({
    verifyMessage: vi.fn()
  })

  const createMockRuntime = (memory = createMockMemory(), ism = createMockIsm()) => ({
    memory,
    services: {
      get: vi.fn((type: string) => type === ServiceType.ISM ? ism : null)
    }
  }) as unknown as IAgentRuntime

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should verify message successfully', async () => {
    const mockMemory = createMockMemory()
    const mockIsm = createMockIsm()
    mockMemory.get.mockResolvedValue(mockMessage)
    mockIsm.verifyMessage.mockResolvedValue({ verified: true, status: 'verified' })
    const mockRuntime = createMockRuntime(mockMemory, mockIsm)

    const action = createVerifyMessageAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          messageId: '0x123'
        }
      }
    })

    expect(mockRuntime.services.get).toHaveBeenCalledWith(ServiceType.ISM)
    expect(mockMemory.get).toHaveBeenCalledWith('message:0x123')
    expect(mockIsm.verifyMessage).toHaveBeenCalledWith({ messageId: '0x123' })
    expect(mockMemory.set).toHaveBeenCalledWith('message:0x123:status', 'delivered')
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      verified: true,
      status: 'verified'
    })
  })

  it('should handle message not found', async () => {
    const mockMemory = createMockMemory()
    const mockIsm = createMockIsm()
    mockMemory.get.mockResolvedValue(null)
    const mockRuntime = createMockRuntime(mockMemory, mockIsm)

    const action = createVerifyMessageAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          messageId: '0x123'
        }
      }
    })

    expect(mockRuntime.services.get).toHaveBeenCalledWith(ServiceType.ISM)
    expect(mockMemory.get).toHaveBeenCalledWith('message:0x123')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Message 0x123 not found')
  })

  it('should handle verification failure', async () => {
    const mockMemory = createMockMemory()
    const mockIsm = createMockIsm()
    mockMemory.get.mockResolvedValue(mockMessage)
    mockIsm.verifyMessage.mockResolvedValue({ verified: false, status: 'failed' })
    const mockRuntime = createMockRuntime(mockMemory, mockIsm)

    const action = createVerifyMessageAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          messageId: '0x123'
        }
      }
    })

    expect(mockRuntime.services.get).toHaveBeenCalledWith(ServiceType.ISM)
    expect(mockMemory.get).toHaveBeenCalledWith('message:0x123')
    expect(mockIsm.verifyMessage).toHaveBeenCalledWith({ messageId: '0x123' })
    expect(mockMemory.set).toHaveBeenCalledWith('message:0x123:status', 'failed')
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      verified: false,
      status: 'failed'
    })
  })

  it('should handle missing ISM service', async () => {
    const mockMemory = createMockMemory()
    const mockRuntime = {
      memory: mockMemory,
      services: {
        get: vi.fn().mockReturnValue(null)
      }
    } as unknown as IAgentRuntime

    const action = createVerifyMessageAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          messageId: '0x123'
        }
      }
    })

    expect(mockRuntime.services.get).toHaveBeenCalledWith(ServiceType.ISM)
    expect(result.success).toBe(false)
    expect(result.error).toBe('ISM service not found')
  })
})
