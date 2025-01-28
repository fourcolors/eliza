import type { Provider } from '@ethersproject/providers'
import type { HyperlaneConfig } from '../types/config'

export interface GasEstimate {
  readonly gasLimit: bigint
  readonly maxFeePerGas: bigint
  readonly maxPriorityFeePerGas: bigint
  readonly baseFee: bigint
}

export interface GasProvider {
  readonly estimateGas: (params: {
    readonly to: string
    readonly data?: string
    readonly value?: bigint
    readonly chainId: string
  }) => Promise<GasEstimate>
  readonly getFeeData: (chainId: string) => Promise<{
    readonly maxFeePerGas: bigint
    readonly maxPriorityFeePerGas: bigint
    readonly baseFee: bigint
  }>
  readonly getGasLimits: (chainId: string) => Promise<{
    readonly maxGasLimit: bigint
    readonly minGasLimit: bigint
  }>
}

/**
 * Creates a provider for gas estimation and management
 * @param config - Hyperlane configuration
 * @returns GasProvider implementation
 */
export const createGasProvider = (config: HyperlaneConfig): GasProvider => {
  // Default gas settings
  const DEFAULT_GAS_MULTIPLIER = 1.2
  const DEFAULT_MAX_GAS_PRICE = BigInt(100e9) // 100 gwei
  const DEFAULT_MIN_GAS_PRICE = BigInt(1e9) // 1 gwei
  const DEFAULT_MAX_GAS_LIMIT = BigInt(2000000)
  const DEFAULT_MIN_GAS_LIMIT = BigInt(21000)

  /**
   * Safely estimates gas with a margin for fluctuation
   */
  const estimateGasWithMargin = async (
    provider: Provider,
    params: {
      to: string
      data?: string
      value?: bigint
    }
  ): Promise<bigint> => {
    const estimate = await provider.estimateGas({
      to: params.to,
      data: params.data,
      value: params.value
    })

    return BigInt(Math.ceil(Number(estimate) * DEFAULT_GAS_MULTIPLIER))
  }

  /**
   * Gets the current fee data with safety checks
   */
  const getSafeFeeData = async (provider: Provider) => {
    const feeData = await provider.getFeeData()

    // Ensure we have valid fee data
    const maxFeePerGas = feeData.maxFeePerGas ?? DEFAULT_MAX_GAS_PRICE
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? DEFAULT_MIN_GAS_PRICE
    const baseFee = feeData.lastBaseFeePerGas ?? DEFAULT_MIN_GAS_PRICE

    // Apply caps
    return {
      maxFeePerGas: maxFeePerGas > DEFAULT_MAX_GAS_PRICE ? DEFAULT_MAX_GAS_PRICE : maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas > DEFAULT_MAX_GAS_PRICE ? DEFAULT_MAX_GAS_PRICE : maxPriorityFeePerGas,
      baseFee: baseFee > DEFAULT_MAX_GAS_PRICE ? DEFAULT_MAX_GAS_PRICE : baseFee
    }
  }

  return {
    estimateGas: async ({ to, data, value, chainId }) => {
      const provider = config.getProvider(chainId)
      if (!provider) {
        throw new Error(`Provider not found for chain ${chainId}`)
      }

      const [gasLimit, feeData] = await Promise.all([
        estimateGasWithMargin(provider, { to, data, value }),
        getSafeFeeData(provider)
      ])

      return {
        gasLimit,
        ...feeData
      }
    },

    getFeeData: async (chainId) => {
      const provider = config.getProvider(chainId)
      if (!provider) {
        throw new Error(`Provider not found for chain ${chainId}`)
      }

      return await getSafeFeeData(provider)
    },

    getGasLimits: async (chainId) => {
      const provider = config.getProvider(chainId)
      if (!provider) {
        throw new Error(`Provider not found for chain ${chainId}`)
      }

      // Get latest block to check network gas limit
      const block = await provider.getBlock('latest')
      const networkGasLimit = block.gasLimit

      return {
        maxGasLimit: networkGasLimit < DEFAULT_MAX_GAS_LIMIT ? networkGasLimit : DEFAULT_MAX_GAS_LIMIT,
        minGasLimit: DEFAULT_MIN_GAS_LIMIT
      }
    }
  }
}
