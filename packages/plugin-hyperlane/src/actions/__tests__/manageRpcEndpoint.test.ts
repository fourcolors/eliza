import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createManageRpcEndpointAction } from '../manageRpcEndpoint'
import type { IAgentRuntime } from '@elizaos/core'
import { ServiceType } from '@elizaos/core'

describe('manageRpcEndpoint action', () => {
  const mockProvider = {
    connection: {
      url: 'https://eth-mainnet.example.com/v1'
    },
    getNetwork: vi.fn(),
    getBlockNumber: vi.fn()
  }

  const mockNewProvider = {
    connection: {
      url: 'https://new-endpoint.example.com/v1'
    },
    getNetwork: vi.fn(),
    getBlockNumber: vi.fn()
  }

  const mockHyperlane = {
    getProvider: vi.fn(),
    createProvider: vi.fn(),
    updateProvider: vi.fn()
  }

  const createMockRuntime = () => ({
    services: {
      get: vi.fn()
    }
  }) as unknown as IAgentRuntime

  beforeEach(() => {
    vi.resetAllMocks()
    mockProvider.getNetwork.mockResolvedValue({ chainId: 1, name: 'mainnet' })
    mockProvider.getBlockNumber.mockResolvedValue(12345678n)
    mockNewProvider.getNetwork.mockResolvedValue({ chainId: 1, name: 'mainnet' })
    mockNewProvider.getBlockNumber.mockResolvedValue(12345678n)
    mockHyperlane.getProvider.mockResolvedValue(mockProvider)
    mockHyperlane.createProvider.mockResolvedValue(mockNewProvider)
    mockHyperlane.updateProvider.mockResolvedValue(undefined)
  })

  it('should get RPC endpoint successfully', async () => {
    const mockRuntime = createMockRuntime()
    mockRuntime.services.get.mockResolvedValue(mockHyperlane)

    const action = createManageRpcEndpointAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          chainId: '1',
          operation: 'get'
        }
      }
    })

    expect(mockRuntime.services.get).toHaveBeenCalledWith(ServiceType.HYPERLANE)
    expect(mockHyperlane.getProvider).toHaveBeenCalledWith('1')
    expect(mockProvider.getNetwork).toHaveBeenCalled()
    expect(mockProvider.getBlockNumber).toHaveBeenCalled()

    expect(result.success).toBe(true)
    expect(result.data?.endpoint).toMatchObject({
      url: 'https://eth-mainnet.example.com/v1',
      isValid: true,
      blockHeight: 12345678
    })
    expect(typeof result.data?.endpoint.latency).toBe('number')
  })

  it('should set RPC endpoint successfully', async () => {
    const mockRuntime = createMockRuntime()
    mockRuntime.services.get.mockResolvedValue(mockHyperlane)

    const action = createManageRpcEndpointAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          chainId: '1',
          operation: 'set',
          rpcEndpoint: 'https://new-endpoint.example.com/v1'
        }
      }
    })

    expect(mockRuntime.services.get).toHaveBeenCalledWith(ServiceType.HYPERLANE)
    expect(mockHyperlane.createProvider).toHaveBeenCalledWith('1', 'https://new-endpoint.example.com/v1')
    expect(mockHyperlane.updateProvider).toHaveBeenCalledWith('1', mockNewProvider)
    expect(mockNewProvider.getNetwork).toHaveBeenCalled()
    expect(mockNewProvider.getBlockNumber).toHaveBeenCalled()

    expect(result.success).toBe(true)
    expect(result.data?.endpoint).toMatchObject({
      url: 'https://new-endpoint.example.com/v1',
      isValid: true,
      blockHeight: 12345678
    })
  })

  it('should validate RPC endpoint successfully', async () => {
    const mockRuntime = createMockRuntime()
    mockRuntime.services.get.mockResolvedValue(mockHyperlane)

    const action = createManageRpcEndpointAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          chainId: '1',
          operation: 'validate'
        }
      }
    })

    expect(result.success).toBe(true)
    expect(result.data?.endpoint).toMatchObject({
      url: 'https://eth-mainnet.example.com/v1',
      isValid: true,
      blockHeight: 12345678
    })
  })

  it('should handle invalid chain ID', async () => {
    const mockRuntime = createMockRuntime()
    mockRuntime.services.get.mockResolvedValue(mockHyperlane)
    mockHyperlane.getProvider.mockResolvedValue(null)

    const action = createManageRpcEndpointAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          chainId: '999',
          operation: 'get'
        }
      }
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Chain 999 not found')
  })

  it('should handle invalid RPC endpoint URL', async () => {
    const mockRuntime = createMockRuntime()
    mockRuntime.services.get.mockResolvedValue(mockHyperlane)

    const action = createManageRpcEndpointAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          chainId: '1',
          operation: 'set',
          rpcEndpoint: 'invalid-url'
        }
      }
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid input')
  })

  it('should handle validation failure', async () => {
    const mockRuntime = createMockRuntime()
    mockRuntime.services.get.mockResolvedValue(mockHyperlane)
    mockProvider.getNetwork.mockRejectedValue(new Error('Network error'))

    const action = createManageRpcEndpointAction()
    const result = await action.handler(mockRuntime, {
      content: {
        input: {
          chainId: '1',
          operation: 'validate'
        }
      }
    })

    expect(result.success).toBe(true)
    expect(result.data?.endpoint.isValid).toBe(false)
  })

  it('should validate input correctly', async () => {
    const mockRuntime = createMockRuntime()
    const action = createManageRpcEndpointAction()

    const validGetResult = await action.validate(mockRuntime, {
      content: {
        input: {
          chainId: '1',
          operation: 'get'
        }
      }
    })

    const validSetResult = await action.validate(mockRuntime, {
      content: {
        input: {
          chainId: '1',
          operation: 'set',
          rpcEndpoint: 'https://example.com/v1'
        }
      }
    })

    const invalidChainResult = await action.validate(mockRuntime, {
      content: {
        input: {
          chainId: 'invalid',
          operation: 'get'
        }
      }
    })

    const invalidOperationResult = await action.validate(mockRuntime, {
      content: {
        input: {
          chainId: '1',
          operation: 'invalid'
        }
      }
    })

    expect(validGetResult).toBe(true)
    expect(validSetResult).toBe(true)
    expect(invalidChainResult).toBe(false)
    expect(invalidOperationResult).toBe(false)
  })
})
