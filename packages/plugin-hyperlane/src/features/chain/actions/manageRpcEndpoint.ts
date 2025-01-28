import { Action, ServiceType } from '@elizaos/core'
import type { IAgentRuntime, Memory } from '@elizaos/core'
import type { ActionResult } from '../types/action'

export interface ManageRpcEndpointActionInput {
  readonly chainId: string
  readonly operation: 'get' | 'set' | 'validate'
  readonly rpcEndpoint?: string
}

export interface RpcEndpointInfo {
  readonly url: string
  readonly isValid: boolean
  readonly latency?: number
  readonly blockHeight?: number
}

export interface ManageRpcEndpointActionOutput {
  readonly endpoint: RpcEndpointInfo
}

export type ManageRpcEndpointError =
  | { type: "INVALID_INPUT"; details: string }
  | { type: "INVALID_CHAIN"; chainId: string }
  | { type: "INVALID_OPERATION"; operation: string }
  | { type: "INVALID_RPC_ENDPOINT"; url: string; details: string }
  | { type: "SERVICE_ERROR"; details: string }

// Pure function to validate chain ID format
const isValidChainId = (chainId: string): boolean =>
  /^[1-9][0-9]*$/.test(chainId)

// Pure function to validate RPC endpoint URL format
const isValidRpcUrl = (url: string): boolean => {
  try {
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

// Pure function to validate input
const validateInput = (input: unknown): input is ManageRpcEndpointActionInput => {
  if (typeof input !== "object" || input === null) return false

  const params = input as Partial<ManageRpcEndpointActionInput>
  const validOperation = ['get', 'set', 'validate'].includes(params.operation as string)
  
  if (params.operation === 'set' && !params.rpcEndpoint) return false
  if (params.operation === 'set' && !isValidRpcUrl(params.rpcEndpoint!)) return false

  return typeof params.chainId === "string" &&
         isValidChainId(params.chainId) &&
         typeof params.operation === "string" &&
         validOperation
}

// Pure function to create error result
const createErrorResult = (error: ManageRpcEndpointError): ActionResult<ManageRpcEndpointActionOutput> => ({
  success: false,
  error: error.type === "INVALID_INPUT"
    ? `Invalid input: ${error.details}`
    : error.type === "INVALID_CHAIN"
    ? `Chain ${error.chainId} not found`
    : error.type === "INVALID_OPERATION"
    ? `Invalid operation: ${error.operation}`
    : error.type === "INVALID_RPC_ENDPOINT"
    ? `Invalid RPC endpoint ${error.url}: ${error.details}`
    : `Service error: ${error.details}`,
  metadata: new Map(),
})

// Pure function to create success result
const createSuccessResult = (endpoint: RpcEndpointInfo): ActionResult<ManageRpcEndpointActionOutput> => ({
  success: true,
  data: {
    endpoint,
  },
  metadata: new Map(),
})

export const createManageRpcEndpointAction = (): Action<ManageRpcEndpointActionInput, ManageRpcEndpointActionOutput> => ({
  name: 'manageRpcEndpoint',
  description: 'Manage RPC endpoints for chains, including getting, setting, and validating endpoints',
  examples: [
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Get RPC endpoint for chain 1',
          action: 'manageRpcEndpoint',
          input: {
            chainId: '1',
            operation: 'get'
          }
        }
      },
      {
        assistant: '{{assistant}}',
        content: {
          text: 'RPC endpoint retrieved',
          action: 'manageRpcEndpoint',
          output: {
            endpoint: {
              url: 'https://eth-mainnet.example.com/v1',
              isValid: true,
              latency: 100,
              blockHeight: 12345678
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
  handler: async (runtime: IAgentRuntime, memory: Memory): Promise<ActionResult<ManageRpcEndpointActionOutput>> => {
    try {
      const input = memory.content?.input as ManageRpcEndpointActionInput
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

      switch (input.operation) {
        case 'get': {
          const currentUrl = await provider.connection.url
          const isValid = await validateEndpoint(provider)
          const [latency, blockHeight] = await Promise.all([
            measureLatency(provider),
            provider.getBlockNumber().catch(() => undefined)
          ])

          return createSuccessResult({
            url: currentUrl,
            isValid,
            latency,
            blockHeight: blockHeight ? Number(blockHeight) : undefined
          })
        }

        case 'set': {
          if (!input.rpcEndpoint) {
            return createErrorResult({
              type: "INVALID_INPUT",
              details: "RPC endpoint required for set operation"
            })
          }

          // Create a new provider with the updated RPC endpoint
          const newProvider = await hyperlane.createProvider(input.chainId, input.rpcEndpoint)
          const isValid = await validateEndpoint(newProvider)
          
          if (!isValid) {
            return createErrorResult({
              type: "INVALID_RPC_ENDPOINT",
              url: input.rpcEndpoint,
              details: "Endpoint validation failed"
            })
          }

          // Update the provider in the Hyperlane service
          await hyperlane.updateProvider(input.chainId, newProvider)

          const [latency, blockHeight] = await Promise.all([
            measureLatency(newProvider),
            newProvider.getBlockNumber().catch(() => undefined)
          ])

          return createSuccessResult({
            url: input.rpcEndpoint,
            isValid: true,
            latency,
            blockHeight: blockHeight ? Number(blockHeight) : undefined
          })
        }

        case 'validate': {
          const currentUrl = await provider.connection.url
          const isValid = await validateEndpoint(provider)
          const [latency, blockHeight] = await Promise.all([
            measureLatency(provider),
            provider.getBlockNumber().catch(() => undefined)
          ])

          return createSuccessResult({
            url: currentUrl,
            isValid,
            latency,
            blockHeight: blockHeight ? Number(blockHeight) : undefined
          })
        }

        default:
          return createErrorResult({
            type: "INVALID_OPERATION",
            operation: input.operation
          })
      }
    } catch (error) {
      return createErrorResult({
        type: "SERVICE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }
})

// Helper function to validate an RPC endpoint
const validateEndpoint = async (provider: any): Promise<boolean> => {
  try {
    const network = await provider.getNetwork()
    const blockNumber = await provider.getBlockNumber()
    return network && blockNumber > 0
  } catch {
    return false
  }
}

// Helper function to measure RPC endpoint latency
const measureLatency = async (provider: any): Promise<number> => {
  try {
    const start = Date.now()
    await provider.getBlockNumber()
    return Date.now() - start
  } catch {
    return -1
  }
}
