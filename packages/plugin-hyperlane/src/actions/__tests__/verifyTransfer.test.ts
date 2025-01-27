import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createVerifyTransferAction } from '../verifyTransfer'
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

describe('verifyTransfer action', () => {
  let mockRuntime: IAgentRuntime
  let mockProvider: any
  let mockHyperlaneService: any

  beforeEach(() => {
    // Mock provider
    mockProvider = {
      getTransactionReceipt: vi.fn()
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
    const action = createVerifyTransferAction()
    const invalidInput = {
      tokenType: 'invalid_type',
      token: 'invalid_address',
      amount: 'invalid_amount',
      recipient: 'invalid_recipient',
      destinationDomain: 0,
      txHash: 'invalid_hash'
    }

    const result = await action.execute(invalidInput, mockRuntime)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid input')
  })

  it('should handle pending transactions', async () => {
    const action = createVerifyTransferAction()
    mockProvider.getTransactionReceipt.mockResolvedValue(null)

    const input = {
      tokenType: 'erc20' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1',
      recipient: '0x1234567890123456789012345678901234567890',
      destinationDomain: 1,
      txHash: '0x1234567890123456789012345678901234567890123456789012345678901234'
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('pending')
    expect(result.data?.confirmations).toBe(0)
  })

  it('should handle failed transactions', async () => {
    const action = createVerifyTransferAction()
    mockProvider.getTransactionReceipt.mockResolvedValue({
      status: 0,
      confirmations: 1,
      logs: []
    })

    const input = {
      tokenType: 'erc20' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1',
      recipient: '0x1234567890123456789012345678901234567890',
      destinationDomain: 1,
      txHash: '0x1234567890123456789012345678901234567890123456789012345678901234'
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('failed')
    expect(result.data?.error).toBe('Transaction reverted')
  })

  it('should verify ERC20 transfer events', async () => {
    const action = createVerifyTransferAction()
    const recipient = '0x1234567890123456789012345678901234567890'
    const amount = ethers.parseUnits('1', 18).toString()

    // Mock transaction receipt with transfer event
    mockProvider.getTransactionReceipt.mockResolvedValue({
      status: 1,
      confirmations: 1,
      logs: [{
        topics: [
          ethers.id('Transfer(address,address,uint256)'),
          ethers.zeroPadValue('0x0000000000000000000000000000000000000000', 32),
          ethers.zeroPadValue(recipient, 32)
        ],
        data: amount
      }]
    })

    const input = {
      tokenType: 'erc20' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1', // 1 token with 18 decimals
      recipient,
      destinationDomain: 1,
      txHash: '0x1234567890123456789012345678901234567890123456789012345678901234'
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('confirmed')
  })

  it('should verify ERC721 transfer events', async () => {
    const action = createVerifyTransferAction()
    const recipient = '0x1234567890123456789012345678901234567890'
    const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000001'

    // Mock transaction receipt with transfer event
    mockProvider.getTransactionReceipt.mockResolvedValue({
      status: 1,
      confirmations: 1,
      logs: [{
        topics: [
          ethers.id('Transfer(address,address,uint256)'),
          ethers.zeroPadValue('0x0000000000000000000000000000000000000000', 32),
          ethers.zeroPadValue(recipient, 32),
          tokenId
        ],
        data: '0x'
      }]
    })

    const input = {
      tokenType: 'erc721' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1', // token ID
      recipient,
      destinationDomain: 1,
      txHash: '0x1234567890123456789012345678901234567890123456789012345678901234'
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('confirmed')
  })

  it('should verify native token transfer events', async () => {
    const action = createVerifyTransferAction()
    const recipient = '0x1234567890123456789012345678901234567890'
    const amount = ethers.parseUnits('1', 'wei').toString()

    // Mock transaction receipt with transfer event
    mockProvider.getTransactionReceipt.mockResolvedValue({
      status: 1,
      confirmations: 1,
      logs: [{
        topics: [
          ethers.id('Transfer(address,address,uint256)'),
          ethers.zeroPadValue('0x0000000000000000000000000000000000000000', 32),
          ethers.zeroPadValue(recipient, 32)
        ],
        data: amount
      }]
    })

    const input = {
      tokenType: 'native' as const,
      token: '0x0000000000000000000000000000000000000000',
      amount: '1', // 1 wei
      recipient,
      destinationDomain: 1,
      txHash: '0x1234567890123456789012345678901234567890123456789012345678901234'
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('confirmed')
  })

  it('should handle verification errors', async () => {
    const action = createVerifyTransferAction()
    mockProvider.getTransactionReceipt.mockRejectedValue(new Error('Network error'))

    const input = {
      tokenType: 'erc20' as const,
      token: '0x1234567890123456789012345678901234567890',
      amount: '1',
      recipient: '0x1234567890123456789012345678901234567890',
      destinationDomain: 1,
      txHash: '0x1234567890123456789012345678901234567890123456789012345678901234'
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })
})
