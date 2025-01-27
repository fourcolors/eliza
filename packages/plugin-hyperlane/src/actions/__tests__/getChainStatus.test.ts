import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGetChainStatusAction } from '../getChainStatus'
import type { IAgentRuntime } from '@elizaos/core'
import { ServiceType } from '@elizaos/core'

describe('getChainStatus action', () => {
  const mockMailbox = {
    address: '0x123abc'
  }

  const mockIsm = {
    address: '0x456def'
  }

  const mockProvider = {
    getBlockNumber: vi.fn()
  }

  const mockHyperlane = {
    getMailbox: vi.fn(),
    getIsm: vi.fn(),
    getProvider: vi.fn()
  }

  const createMockRuntime = () => ({
    services: {
      get: vi.fn()
    }
  }) as unknown as IAgentRuntime

  beforeEach(() => {
    vi.resetAllMocks()
    mockProvider.getBlockNumber.mockResolvedValue(12345678)
    mockHyperlane.getMailbox.mockResolvedValue(mockMailbox)
    mockHyperlane.getIsm.mockResolvedValue(mockIsm)
    mockHyperlane.getProvider.mockResolvedValue(mockProvider)
  })

  it('should get chain status successfully', async () => {
    const mockRuntime = createMockRuntime()
    mockRuntime.services.get.mockResolvedValue(mockHyperlane)

    const action = createGetChainStatusAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          chainId: '1'
        }
      }
    })

    expect(mockRuntime.services.get).toHaveBeenCalledWith(ServiceType.HYPERLANE)
    expect(mockHyperlane.getMailbox).toHaveBeenCalledWith('1')
    expect(mockHyperlane.getIsm).toHaveBeenCalledWith('1')
    expect(mockHyperlane.getProvider).toHaveBeenCalledWith('1')
    expect(mockProvider.getBlockNumber).toHaveBeenCalled()

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      status: {
        isActive: true,
        latestBlock: 12345678,
        isConfigured: true,
        mailboxAddress: '0x123abc',
        ismAddress: '0x456def'
      }
    })
  })

  it('should handle chain not found', async () => {
    const mockRuntime = createMockRuntime()
    mockRuntime.services.get.mockResolvedValue(mockHyperlane)
    mockHyperlane.getMailbox.mockResolvedValue(null)

    const action = createGetChainStatusAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          chainId: '999'
        }
      }
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Chain 999 not found')
  })

  it('should handle invalid chain id format', async () => {
    const mockRuntime = createMockRuntime()
    mockRuntime.services.get.mockResolvedValue(mockHyperlane)

    const action = createGetChainStatusAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          chainId: 'invalid'
        }
      }
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid chain ID format: Chain ID must be a positive integer')
  })

  it('should handle service error', async () => {
    const mockRuntime = createMockRuntime()
    mockRuntime.services.get.mockResolvedValue(null)

    const action = createGetChainStatusAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          chainId: '1'
        }
      }
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Service error: Hyperlane service not available')
  })

  it('should validate input correctly', async () => {
    const mockRuntime = createMockRuntime()
    const action = createGetChainStatusAction()

    const validResult = await action.validate(mockRuntime, {
      content: {
        input: {
          chainId: '1'
        }
      }
    })

    const invalidResult = await action.validate(mockRuntime, {
      content: {
        input: {
          chainId: 'invalid'
        }
      }
    })

    expect(validResult).toBe(true)
    expect(invalidResult).toBe(false)
  })
})
