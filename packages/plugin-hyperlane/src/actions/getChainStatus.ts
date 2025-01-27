import { Action, ServiceType } from '@elizaos/core'
import type { IAgentRuntime, Memory } from '@elizaos/core'
import type { ActionResult } from '../types/action'

export interface GetChainStatusActionInput {
  readonly chainId: string
}

export interface ChainStatus {
  readonly isActive: boolean
  readonly latestBlock: number
  readonly isConfigured: boolean
  readonly mailboxAddress?: string
  readonly ismAddress?: string
}

export interface GetChainStatusActionOutput {
  readonly status: ChainStatus
}

export type GetChainStatusError = 
  | { type: "INVALID_INPUT"; details: string }
  | { type: "CHAIN_NOT_FOUND"; chainId: string }
  | { type: "SERVICE_ERROR"; details: string }

// Pure function to validate chain ID format
const isValidChainId = (chainId: string): boolean => 
  /^[1-9][0-9]*$/.test(chainId)

// Pure function to validate input
const validateInput = (input: unknown): input is GetChainStatusActionInput => {
  if (typeof input !== "object" || input === null) return false
  
  const getStatus = input as Partial<GetChainStatusActionInput>
  return typeof getStatus.chainId === "string" &&
         isValidChainId(getStatus.chainId)
}

// Pure function to create error result
const createErrorResult = (error: GetChainStatusError): ActionResult<GetChainStatusActionOutput> => ({
  success: false,
  error: error.type === "INVALID_INPUT" 
    ? `Invalid chain ID format: ${error.details}`
    : error.type === "CHAIN_NOT_FOUND"
    ? `Chain ${error.chainId} not found`
    : `Service error: ${error.details}`,
  metadata: new Map(),
})

// Pure function to create success result
const createSuccessResult = (status: ChainStatus): ActionResult<GetChainStatusActionOutput> => ({
  success: true,
  data: {
    status,
  },
  metadata: new Map(),
})

export const createGetChainStatusAction = (): Action<GetChainStatusActionInput, GetChainStatusActionOutput> => ({
  name: 'getChainStatus',
  description: 'Get the status and configuration of a chain',
  examples: [
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Get status of chain 1',
          action: 'getChainStatus',
          input: {
            chainId: '1'
          }
        }
      },
      {
        assistant: '{{assistant}}',
        content: {
          text: 'Chain status retrieved',
          action: 'getChainStatus',
          output: {
            status: {
              isActive: true,
              latestBlock: 12345678,
              isConfigured: true,
              mailboxAddress: '0x123...',
              ismAddress: '0x456...'
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
  handler: async (runtime: IAgentRuntime, memory: Memory): Promise<ActionResult<GetChainStatusActionOutput>> => {
    try {
      const input = memory.content?.input as GetChainStatusActionInput
      if (!validateInput(input)) {
        return createErrorResult({
          type: "INVALID_INPUT",
          details: "Chain ID must be a positive integer"
        })
      }

      const hyperlane = await runtime.services.get(ServiceType.HYPERLANE)
      if (!hyperlane) {
        return createErrorResult({
          type: "SERVICE_ERROR",
          details: "Hyperlane service not available"
        })
      }

      // Get chain configuration
      const mailbox = await hyperlane.getMailbox(input.chainId)
      const ism = await hyperlane.getIsm(input.chainId)
      
      if (!mailbox) {
        return createErrorResult({
          type: "CHAIN_NOT_FOUND",
          chainId: input.chainId
        })
      }

      // Get latest block number
      const provider = await hyperlane.getProvider(input.chainId)
      const latestBlock = await provider.getBlockNumber()

      const status: ChainStatus = {
        isActive: true,
        latestBlock,
        isConfigured: true,
        mailboxAddress: mailbox.address,
        ismAddress: ism?.address
      }

      return createSuccessResult(status)
    } catch (error) {
      return createErrorResult({
        type: "SERVICE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }
})
