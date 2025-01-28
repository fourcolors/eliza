import { Action, ServiceType } from '@elizaos/core'
import type { IAgentRuntime, Memory } from '@elizaos/core'
import type { ActionResult } from '../types/action'
import { createGasProvider } from '../providers/createGasProvider'
import { createErrorResult, createSuccessResult } from './utils'

export interface ManageTransactionActionInput {
  readonly chainId: string
  readonly operation: 'submit' | 'status' | 'estimate'
  readonly to?: string
  readonly data?: string
  readonly value?: string
  readonly txHash?: string
  readonly maxFeePerGas?: string
  readonly maxPriorityFeePerGas?: string
}

export interface TransactionDetails {
  readonly hash: string
  readonly status: 'pending' | 'confirmed' | 'failed'
  readonly blockNumber?: number
  readonly gasUsed?: string
  readonly effectiveGasPrice?: string
  readonly error?: string
}

export interface GasEstimate {
  readonly gasLimit: string
  readonly maxFeePerGas: string
  readonly maxPriorityFeePerGas: string
}

export interface ManageTransactionActionOutput {
  readonly transaction?: TransactionDetails
  readonly estimate?: GasEstimate
}

export type ManageTransactionError =
  | { type: "INVALID_INPUT"; details: string }
  | { type: "INVALID_CHAIN"; chainId: string }
  | { type: "INVALID_OPERATION"; operation: string }
  | { type: "TRANSACTION_ERROR"; details: string }
  | { type: "SERVICE_ERROR"; details: string }
  | { type: "ESTIMATION_ERROR"; details: string }

// Pure function to validate chain ID format
const isValidChainId = (chainId: string): boolean =>
  /^[1-9][0-9]*$/.test(chainId)

// Pure function to sanitize hex string
const sanitizeHexString = (value: string): string => {
  // Remove any non-hex characters and ensure 0x prefix
  if (value.startsWith('0x')) {
    return value.toLowerCase()
  }
  return '0x' + value.replace(/[^0-9a-fA-F]/g, '').toLowerCase()
}

// Pure function to validate hex string with length bounds
const isValidHex = (value: string, maxLength?: number): boolean => {
  if (!value || typeof value !== 'string') return false
  const hexRegex = /^0x[0-9a-fA-F]+$/
  if (!hexRegex.test(value)) return false
  if (maxLength && value.length > maxLength + 2) return false // +2 for '0x' prefix
  return true
}

// Pure function to validate input with enhanced security checks
const validateInput = (input: unknown): input is ManageTransactionActionInput => {
  if (typeof input !== "object" || input === null) return false

  const params = input as Partial<ManageTransactionActionInput>
  const validOperation = ['submit', 'status', 'estimate'].includes(params.operation as string)
  
  if (!params.chainId || !isValidChainId(params.chainId)) return false
  if (!params.operation || !validOperation) return false

  // Enhanced validation with size limits to prevent DOS attacks
  if (params.operation === 'submit') {
    if (!params.to || !isValidHex(params.to, 40)) return false // 20 bytes for address
    if (params.data && !isValidHex(params.data, 2048)) return false // Reasonable max data size
    if (params.value && !isValidHex(params.value, 32)) return false // 16 bytes for value
    if (params.maxFeePerGas && !isValidHex(params.maxFeePerGas, 32)) return false
    if (params.maxPriorityFeePerGas && !isValidHex(params.maxPriorityFeePerGas, 32)) return false
  }

  if (params.operation === 'status' && (!params.txHash || !isValidHex(params.txHash, 64))) {
    return false // 32 bytes for tx hash
  }

  return true
}

// Pure function to create error result
const createErrorResult = (error: ManageTransactionError): ActionResult<ManageTransactionActionOutput> => ({
  success: false,
  error: error.type === "INVALID_INPUT"
    ? `Invalid input: ${error.details}`
    : error.type === "INVALID_CHAIN"
    ? `Chain ${error.chainId} not found`
    : error.type === "INVALID_OPERATION"
    ? `Invalid operation: ${error.operation}`
    : error.type === "TRANSACTION_ERROR"
    ? `Transaction error: ${error.details}`
    : error.type === "SERVICE_ERROR"
    ? `Service error: ${error.details}`
    : `Estimation error: ${error.details}`,
  metadata: new Map(),
})

// Pure function to create success result
const createSuccessResult = (output: ManageTransactionActionOutput): ActionResult<ManageTransactionActionOutput> => ({
  success: true,
  data: output,
  metadata: new Map(),
})

// Add timeout wrapper for async operations
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout])
}

export const createManageTransactionAction = (): Action<ManageTransactionActionInput, ManageTransactionActionOutput> => ({
  name: 'manageTransaction',
  description: 'Manage blockchain transactions including submission, status checking, and gas estimation',
  examples: [
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Submit transaction to chain 1',
          action: 'manageTransaction',
          input: {
            chainId: '1',
            operation: 'submit',
            to: '0x123...',
            data: '0x456...'
          }
        }
      },
      {
        assistant: '{{assistant}}',
        content: {
          text: 'Transaction submitted',
          action: 'manageTransaction',
          output: {
            transaction: {
              hash: '0x789...',
              status: 'pending'
            }
          }
        }
      }
    ]
  ],
  validate: async (runtime: IAgentRuntime, memory: Memory) => {
    const input = memory.content?.input
    return validateInput(input)
  },
  handler: async (runtime: IAgentRuntime, memory: Memory): Promise<ActionResult<ManageTransactionActionOutput>> => {
    try {
      const input = memory.content?.input as ManageTransactionActionInput
      if (!validateInput(input)) {
        return createErrorResult({
          type: "INVALID_INPUT",
          details: "Invalid input parameters"
        })
      }

      const hyperlane = await runtime.services.get(ServiceType.HYPERLANE)
      if (!hyperlane) {
        return createErrorResult({
          type: "SERVICE_ERROR",
          details: "Hyperlane service not available"
        })
      }

      const provider = await hyperlane.getProvider(input.chainId)
      if (!provider) {
        return createErrorResult({
          type: "INVALID_CHAIN",
          chainId: input.chainId
        })
      }

      const gasProvider = createGasProvider(hyperlane)

      switch (input.operation) {
        case 'submit': {
          if (!input.to) {
            return createErrorResult({
              type: "INVALID_INPUT",
              details: "Recipient address required for transaction submission"
            })
          }

          // Sanitize all hex inputs
          const tx = {
            to: sanitizeHexString(input.to),
            data: input.data ? sanitizeHexString(input.data) : '0x',
            value: input.value ? BigInt(sanitizeHexString(input.value)) : BigInt(0),
            maxFeePerGas: input.maxFeePerGas ? BigInt(sanitizeHexString(input.maxFeePerGas)) : undefined,
            maxPriorityFeePerGas: input.maxPriorityFeePerGas ? BigInt(sanitizeHexString(input.maxPriorityFeePerGas)) : undefined
          }

          try {
            const gasEstimate = await withTimeout(
              gasProvider.estimateGas({
                to: tx.to,
                data: tx.data,
                value: tx.value,
                chainId: input.chainId
              }),
              30 * 1000 // 30 seconds timeout for gas estimation
            )

            const response = await withTimeout(
              provider.sendTransaction({
                ...tx,
                maxFeePerGas: tx.maxFeePerGas || gasEstimate.maxFeePerGas,
                maxPriorityFeePerGas: tx.maxPriorityFeePerGas || gasEstimate.maxPriorityFeePerGas,
                gasLimit: gasEstimate.gasLimit
              }),
              5 * 60 * 1000 // 5 minutes timeout for transaction submission
            )

            const receipt = await withTimeout(
              response.wait(),
              5 * 60 * 1000 // 5 minutes timeout for transaction confirmation
            )

            return createSuccessResult({
              transaction: {
                hash: receipt.hash,
                status: receipt.status === 1 ? 'confirmed' : 'failed',
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                effectiveGasPrice: receipt.effectiveGasPrice.toString()
              }
            })
          } catch (error: any) {
            let errorMessage = error.message || 'Unknown error'
            if (errorMessage.includes('insufficient funds')) {
              errorMessage = 'Insufficient funds for transaction'
            }
            return createErrorResult({
              type: "TRANSACTION_ERROR",
              details: errorMessage
            })
          }
        }

        case 'status': {
          if (!input.txHash) {
            return createErrorResult({
              type: "INVALID_INPUT",
              details: "Transaction hash required for status check"
            })
          }

          const receipt = await withTimeout(
            provider.getTransactionReceipt(sanitizeHexString(input.txHash)),
            30 * 1000 // 30 seconds timeout for status check
          )

          if (!receipt) {
            return createSuccessResult({
              transaction: {
                hash: input.txHash,
                status: 'pending'
              }
            })
          }

          return createSuccessResult({
            transaction: {
              hash: receipt.hash,
              status: receipt.status === 1 ? 'confirmed' : 'failed',
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
              effectiveGasPrice: receipt.effectiveGasPrice.toString()
            }
          })
        }

        case 'estimate': {
          if (!input.to) {
            return createErrorResult({
              type: "INVALID_INPUT",
              details: "Recipient address required for gas estimation"
            })
          }

          try {
            const value = input.value ? BigInt(sanitizeHexString(input.value)) : BigInt(0)
            const estimate = await withTimeout(
              gasProvider.estimateGas({
                to: sanitizeHexString(input.to),
                data: input.data ? sanitizeHexString(input.data) : '0x',
                value,
                chainId: input.chainId
              }),
              30 * 1000 // 30 seconds timeout for gas estimation
            )

            return createSuccessResult({
              estimate: {
                gasLimit: estimate.gasLimit.toString(),
                maxFeePerGas: estimate.maxFeePerGas.toString(),
                maxPriorityFeePerGas: estimate.maxPriorityFeePerGas.toString()
              }
            })
          } catch (error: any) {
            return createErrorResult({
              type: "ESTIMATION_ERROR",
              details: error.message || 'Gas estimation failed'
            })
          }
        }

        default:
          return createErrorResult({
            type: "INVALID_OPERATION",
            operation: input.operation
          })
      }
    } catch (error: any) {
      // Enhanced error handling with more specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return createErrorResult({
            type: "SERVICE_ERROR",
            details: `Operation timed out: ${error.message}`
          })
        }
        if (error.message.includes('insufficient funds')) {
          return createErrorResult({
            type: "TRANSACTION_ERROR",
            details: "Insufficient funds for transaction"
          })
        }
        if (error.message.includes('nonce')) {
          return createErrorResult({
            type: "TRANSACTION_ERROR",
            details: "Invalid nonce, transaction may be replaced or already confirmed"
          })
        }
      }
      return createErrorResult({
        type: "SERVICE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }
})
