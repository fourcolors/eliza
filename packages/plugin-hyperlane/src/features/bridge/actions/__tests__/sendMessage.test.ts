import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSendMessageAction } from '../sendMessage'
import { ServiceType } from '@elizaos/core'
import type { IAgentRuntime } from '@elizaos/core'
import type { HyperlaneMessage } from '../../types/message'

describe('sendMessage action', () => {
  const mockMessage: Readonly<HyperlaneMessage> = {
    id: '0x123',
    body: '0x456',
    recipient: '0xabc',
    destinationChain: '1'  // Changed to a valid chain ID
  }

  const mockDispatchResult = {
    messageId: '0x123',
    txHash: '0xabc'
  }

  const createMockMemory = () => ({
    get: vi.fn(),
    set: vi.fn()
  })

  const createMockHyperlane = () => ({
    dispatch: vi.fn()
  })

  const createMockRuntime = (memory = createMockMemory(), hyperlane = createMockHyperlane()) => {
    const runtime = {
      memory,
      services: {
        get: vi.fn()
      }
    } as unknown as IAgentRuntime

    runtime.services.get.mockImplementation((type: string) => 
      type === ServiceType.HYPERLANE ? hyperlane : null
    )

    return runtime
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should send message successfully', async () => {
    const mockMemory = createMockMemory()
    const mockHyperlane = createMockHyperlane()
    mockHyperlane.dispatch.mockResolvedValue(mockDispatchResult)
    const mockRuntime = createMockRuntime(mockMemory, mockHyperlane)

    const action = createSendMessageAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: mockMessage
      }
    })

    expect(mockRuntime.services.get).toHaveBeenCalledWith(ServiceType.HYPERLANE)
    expect(mockHyperlane.dispatch).toHaveBeenCalledWith(mockMessage)
    expect(mockMemory.set).toHaveBeenCalledWith('message:0x123', mockMessage)
    expect(mockMemory.set).toHaveBeenCalledWith('message:0x123:status', 'pending')
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockDispatchResult)
  })

  it('should handle missing hyperlane service', async () => {
    const mockMemory = createMockMemory()
    const mockRuntime = {
      memory: mockMemory,
      services: {
        get: vi.fn().mockReturnValue(null)
      }
    } as unknown as IAgentRuntime

    const action = createSendMessageAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: mockMessage
      }
    })

    expect(mockRuntime.services.get).toHaveBeenCalledWith(ServiceType.HYPERLANE)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Hyperlane service not found')
  })

  it('should handle dispatch failure', async () => {
    const mockMemory = createMockMemory()
    const mockHyperlane = createMockHyperlane()
    mockHyperlane.dispatch.mockRejectedValue(new Error('Dispatch failed'))
    const mockRuntime = createMockRuntime(mockMemory, mockHyperlane)

    const action = createSendMessageAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: mockMessage
      }
    })

    expect(mockRuntime.services.get).toHaveBeenCalledWith(ServiceType.HYPERLANE)
    expect(mockHyperlane.dispatch).toHaveBeenCalledWith(mockMessage)
    expect(mockMemory.set).toHaveBeenCalledWith('message:0x123:status', 'failed')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Dispatch failed')
  })
})
