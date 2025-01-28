import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createInitializeWarpRouteAction } from '../initializeWarpRoute'
import { IAgentRuntime, ServiceType } from '@elizaos/core'

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn().mockImplementation((address: string) => 
      /^0x[0-9a-fA-F]{40}$/.test(address)
    ),
    parseUnits: vi.fn().mockImplementation((value: string) => BigInt(value))
  }
}))

// Mock Hyperlane core
vi.mock('@hyperlane-xyz/core', () => ({
  HypERC20Collateral__factory: {
    connect: vi.fn().mockReturnValue({
      deploy: vi.fn().mockResolvedValue({
        waitForDeployment: vi.fn().mockResolvedValue({
          hash: 'mock_tx_hash'
        }),
        getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
      })
    })
  },
  HypERC20__factory: {
    connect: vi.fn().mockReturnValue({
      deploy: vi.fn().mockResolvedValue({
        waitForDeployment: vi.fn().mockResolvedValue({
          hash: 'mock_tx_hash'
        }),
        getAddress: vi.fn().mockResolvedValue('0x2345678901234567890123456789012345678901')
      })
    })
  }
}))

describe('initializeWarpRoute action', () => {
  let mockRuntime: IAgentRuntime

  beforeEach(() => {
    // Mock runtime
    mockRuntime = {
      getService: vi.fn().mockImplementation((type: ServiceType) => {
        if (type === ServiceType.BLOCKCHAIN) {
          return Promise.resolve({
            getProvider: vi.fn().mockResolvedValue({
              getSigner: vi.fn().mockReturnValue({
                getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
              })
            })
          })
        }
        return Promise.resolve(null)
      }),
      getMemory: vi.fn()
    } as unknown as IAgentRuntime

    // Clear mock calls
    vi.clearAllMocks()
  })

  it('should validate input parameters', async () => {
    const action = createInitializeWarpRouteAction()
    const invalidInput = {
      tokenAddress: 'invalid_address',
      originDomain: -1,
      destinationDomains: ['invalid_domain'],
      ismAddresses: {
        1: 'invalid_address'
      }
    }

    const result = await action.execute(invalidInput, mockRuntime)
    expect(result.success).toBe(false)
    expect(result.error?.type).toBe('INVALID_INPUT')
  })

  it('should initialize warp route successfully', async () => {
    const action = createInitializeWarpRouteAction()
    const input = {
      tokenAddress: '0x1234567890123456789012345678901234567890',
      originDomain: 1,
      destinationDomains: [2, 3],
      ismAddresses: {
        2: '0x2345678901234567890123456789012345678901',
        3: '0x3456789012345678901234567890123456789012'
      },
      remoteGasAmount: '1000000000000000000',
      wrappedTokenName: 'Wrapped Token',
      wrappedTokenSymbol: 'WRAP'
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data?.collateralAddress).toBe('0x1234567890123456789012345678901234567890')
    expect(result.data?.syntheticAddresses.size).toBe(2)
    expect(result.data?.txHash).toBe('mock_tx_hash')
  })

  it('should handle missing optional parameters', async () => {
    const action = createInitializeWarpRouteAction()
    const input = {
      tokenAddress: '0x1234567890123456789012345678901234567890',
      originDomain: 1,
      destinationDomains: [2]
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(true)
    expect(result.data?.collateralAddress).toBe('0x1234567890123456789012345678901234567890')
    expect(result.data?.syntheticAddresses.size).toBe(1)
  })

  it('should handle initialization errors', async () => {
    const action = createInitializeWarpRouteAction()
    mockRuntime.getService.mockResolvedValueOnce(null)

    const input = {
      tokenAddress: '0x1234567890123456789012345678901234567890',
      originDomain: 1,
      destinationDomains: [2]
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(false)
    expect(result.error?.type).toBe('INITIALIZATION_ERROR')
  })

  it('should validate ISM addresses when provided', async () => {
    const action = createInitializeWarpRouteAction()
    const input = {
      tokenAddress: '0x1234567890123456789012345678901234567890',
      originDomain: 1,
      destinationDomains: [2],
      ismAddresses: {
        2: 'invalid_address'
      }
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(false)
    expect(result.error?.type).toBe('INVALID_INPUT')
  })

  it('should validate remote gas amount when provided', async () => {
    const action = createInitializeWarpRouteAction()
    const input = {
      tokenAddress: '0x1234567890123456789012345678901234567890',
      originDomain: 1,
      destinationDomains: [2],
      remoteGasAmount: 'invalid_amount'
    }

    const result = await action.execute(input, mockRuntime)
    expect(result.success).toBe(false)
    expect(result.error?.type).toBe('INVALID_INPUT')
  })
})
