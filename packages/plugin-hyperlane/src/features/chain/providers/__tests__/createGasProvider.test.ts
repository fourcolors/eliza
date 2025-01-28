import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGasProvider } from '../createGasProvider'
import type { HyperlaneConfig } from '../../types/config'

describe('createGasProvider', () => {
  const mockProvider = {
    estimateGas: vi.fn(),
    getFeeData: vi.fn(),
    getBlock: vi.fn()
  }

  const mockConfig = {
    getProvider: vi.fn()
  } as unknown as HyperlaneConfig

  beforeEach(() => {
    vi.resetAllMocks()
    mockConfig.getProvider.mockReturnValue(mockProvider)
  })

  describe('estimateGas', () => {
    it('should estimate gas with safety margin', async () => {
      const baseEstimate = BigInt(100000)
      mockProvider.estimateGas.mockResolvedValue(baseEstimate)
      mockProvider.getFeeData.mockResolvedValue({
        maxFeePerGas: BigInt(2e9),
        maxPriorityFeePerGas: BigInt(1e9),
        lastBaseFeePerGas: BigInt(1e9)
      })

      const provider = createGasProvider(mockConfig)
      const result = await provider.estimateGas({
        to: '0x123',
        data: '0x456',
        chainId: '1'
      })

      expect(mockProvider.estimateGas).toHaveBeenCalledWith({
        to: '0x123',
        data: '0x456',
        value: undefined
      })

      // Should include 20% margin
      expect(result.gasLimit).toBe(BigInt(120000))
      expect(result.maxFeePerGas).toBe(BigInt(2e9))
      expect(result.maxPriorityFeePerGas).toBe(BigInt(1e9))
      expect(result.baseFee).toBe(BigInt(1e9))
    })

    it('should handle missing fee data', async () => {
      mockProvider.estimateGas.mockResolvedValue(BigInt(100000))
      mockProvider.getFeeData.mockResolvedValue({})

      const provider = createGasProvider(mockConfig)
      const result = await provider.estimateGas({
        to: '0x123',
        chainId: '1'
      })

      expect(result.maxFeePerGas).toBe(BigInt(100e9)) // Default max
      expect(result.maxPriorityFeePerGas).toBe(BigInt(1e9)) // Default min
      expect(result.baseFee).toBe(BigInt(1e9)) // Default min
    })

    it('should cap gas prices at maximum', async () => {
      mockProvider.estimateGas.mockResolvedValue(BigInt(100000))
      mockProvider.getFeeData.mockResolvedValue({
        maxFeePerGas: BigInt(200e9), // Above max
        maxPriorityFeePerGas: BigInt(150e9), // Above max
        lastBaseFeePerGas: BigInt(120e9) // Above max
      })

      const provider = createGasProvider(mockConfig)
      const result = await provider.estimateGas({
        to: '0x123',
        chainId: '1'
      })

      expect(result.maxFeePerGas).toBe(BigInt(100e9)) // Capped at max
      expect(result.maxPriorityFeePerGas).toBe(BigInt(100e9)) // Capped at max
      expect(result.baseFee).toBe(BigInt(100e9)) // Capped at max
    })

    it('should throw if provider not found', async () => {
      mockConfig.getProvider.mockReturnValue(null)

      const provider = createGasProvider(mockConfig)
      await expect(
        provider.estimateGas({
          to: '0x123',
          chainId: '999'
        })
      ).rejects.toThrow('Provider not found for chain 999')
    })
  })

  describe('getFeeData', () => {
    it('should get current fee data', async () => {
      mockProvider.getFeeData.mockResolvedValue({
        maxFeePerGas: BigInt(2e9),
        maxPriorityFeePerGas: BigInt(1e9),
        lastBaseFeePerGas: BigInt(1e9)
      })

      const provider = createGasProvider(mockConfig)
      const result = await provider.getFeeData('1')

      expect(result.maxFeePerGas).toBe(BigInt(2e9))
      expect(result.maxPriorityFeePerGas).toBe(BigInt(1e9))
      expect(result.baseFee).toBe(BigInt(1e9))
    })

    it('should throw if provider not found', async () => {
      mockConfig.getProvider.mockReturnValue(null)

      const provider = createGasProvider(mockConfig)
      await expect(provider.getFeeData('999')).rejects.toThrow(
        'Provider not found for chain 999'
      )
    })
  })

  describe('getGasLimits', () => {
    it('should get gas limits respecting network maximum', async () => {
      mockProvider.getBlock.mockResolvedValue({
        gasLimit: BigInt(1500000) // Below default max
      })

      const provider = createGasProvider(mockConfig)
      const result = await provider.getGasLimits('1')

      expect(result.maxGasLimit).toBe(BigInt(1500000))
      expect(result.minGasLimit).toBe(BigInt(21000))
    })

    it('should cap gas limit at default maximum', async () => {
      mockProvider.getBlock.mockResolvedValue({
        gasLimit: BigInt(3000000) // Above default max
      })

      const provider = createGasProvider(mockConfig)
      const result = await provider.getGasLimits('1')

      expect(result.maxGasLimit).toBe(BigInt(2000000)) // Default max
      expect(result.minGasLimit).toBe(BigInt(21000))
    })

    it('should throw if provider not found', async () => {
      mockConfig.getProvider.mockReturnValue(null)

      const provider = createGasProvider(mockConfig)
      await expect(provider.getGasLimits('999')).rejects.toThrow(
        'Provider not found for chain 999'
      )
    })
  })
})
