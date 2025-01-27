import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTransferAction } from '../transferToken'
import { IAgentRuntime, ServiceType } from '@elizaos/core'
import { ethers } from 'ethers'
import { ERC20__factory, ERC721__factory, ERC4626__factory } from '@hyperlane-xyz/core'

// Mock the contract factories
vi.mock('@hyperlane-xyz/core', () => ({
  ERC20__factory: {
    connect: vi.fn().mockReturnValue({
      transfer: vi.fn().mockResolvedValue({ hash: 'mock_tx_hash' }),
      decimals: vi.fn().mockResolvedValue(18)
    })
  },
  ERC721__factory: {
    connect: vi.fn().mockReturnValue({
      transferFrom: vi.fn().mockResolvedValue({ hash: 'mock_tx_hash' }),
      getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
    })
  },
  ERC4626__factory: {
    connect: vi.fn().mockReturnValue({
      deposit: vi.fn().mockResolvedValue({ hash: 'mock_tx_hash' }),
      decimals: vi.fn().mockResolvedValue(18)
    })
  }
}))

describe('transferToken action', () => {
  let mockRuntime: IAgentRuntime
  let mockProvider: any
  let mockHyperlaneService: any

  beforeEach(() => {
    // Mock provider
    mockProvider = {
      send: vi.fn().mockResolvedValue({ hash: 'mock_tx_hash' })
    }

    // Mock Hyperlane service
    mockHyperlaneService = {
      getProvider: vi.fn().mockResolvedValue(mockProvider)
    }

    // Mock runtime
    mockRuntime = {
      getService: vi.fn().mockImplementation((type: ServiceType) => {
        if (type === ServiceType.BLOCKCHAIN) {
          return Promise.resolve(mockHyperlaneService)
        }
        return Promise.resolve(null)
      }),
      getMemory: vi.fn()
    } as unknown as IAgentRuntime

    // Clear mock calls
    vi.clearAllMocks()
  })

  it('should validate input parameters', async () => {
    const action = createTransferAction()
    const invalidInput = {
      tokenType: 'invalid_type',
      token: 'invalid_address',
      amount: 'invalid_amount',
      recipient: 'invalid_recipient',
      destinationDomain: 0
    }

    const result = await action.execute(invalidInput, mockRuntime)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid input')
  })

  it('should handle native token transfer', async () => {
    const action = createTransferAction()
    const input = {
      tokenType: 'native' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1000000000000000000', // 1 ETH
      recipient: '0x1234567890123456789012345678901234567890',
      destinationDomain: 1
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data).toBe('mock_tx_hash')
    expect(mockProvider.send).toHaveBeenCalledWith('eth_sendTransaction', [{
      to: input.recipient,
      value: input.amount
    }])
  })

  it('should handle ERC20 token transfer', async () => {
    const action = createTransferAction()
    const input = {
      tokenType: 'erc20' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1000000000000000000', // 1 token
      recipient: '0x1234567890123456789012345678901234567890',
      destinationDomain: 1
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data).toBe('mock_tx_hash')
    expect(ERC20__factory.connect).toHaveBeenCalledWith(input.token, mockProvider)
  })

  it('should handle ERC721 token transfer', async () => {
    const action = createTransferAction()
    const input = {
      tokenType: 'erc721' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1', // token ID
      recipient: '0x1234567890123456789012345678901234567890',
      destinationDomain: 1
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data).toBe('mock_tx_hash')
    expect(ERC721__factory.connect).toHaveBeenCalledWith(input.token, mockProvider)
  })

  it('should handle ERC4626 token deposit', async () => {
    const action = createTransferAction()
    const input = {
      tokenType: 'erc4626' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1000000000000000000', // 1 token
      recipient: '0x1234567890123456789012345678901234567890',
      destinationDomain: 1
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data).toBe('mock_tx_hash')
    expect(ERC4626__factory.connect).toHaveBeenCalledWith(input.token, mockProvider)
  })

  it('should handle transfer errors', async () => {
    const action = createTransferAction()
    const mockError = new Error('Transfer failed')
    ERC20__factory.connect.mockReturnValueOnce({
      transfer: vi.fn().mockRejectedValue(mockError),
      decimals: vi.fn().mockResolvedValue(18)
    })

    const input = {
      tokenType: 'erc20' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1000000000000000000',
      recipient: '0x1234567890123456789012345678901234567890',
      destinationDomain: 1
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Transfer failed')
  })

  it('should handle missing Hyperlane service', async () => {
    const action = createTransferAction()
    mockRuntime.getService.mockResolvedValue(null)

    const input = {
      tokenType: 'erc20' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1000000000000000000',
      recipient: '0x1234567890123456789012345678901234567890',
      destinationDomain: 1
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Hyperlane service not found')
  })
})
