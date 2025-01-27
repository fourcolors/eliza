import { Action, ServiceType } from '@elizaos/core'
import type { IAgentRuntime, Memory } from '@elizaos/core'
import type { ActionResult } from '../types/action'

export interface SendMessageActionInput {
  id: string
  body: string
  recipient: string
  destinationChain: string
}

export interface SendMessageActionOutput {
  messageId: string
  txHash: string
}

// Define specific error types for better error handling
export type SendMessageError = 
  | { type: "INVALID_INPUT"; details: string }
  | { type: "INVALID_CHAIN"; chain: string }
  | { type: "SERVICE_UNAVAILABLE"; service: string }
  | { type: "DISPATCH_ERROR"; error: string }
  | { type: "INSUFFICIENT_FUNDS"; required: string }

// Pure function to validate chain ID format
const isValidChainId = (chainId: string): boolean => 
  /^\d+$/.test(chainId) && parseInt(chainId) > 0

// Pure function to validate input
const validateInput = (input: unknown): input is SendMessageActionInput => {
  if (typeof input !== "object" || input === null) return false
  
  const sendInput = input as Partial<SendMessageActionInput>
  return typeof sendInput.id === "string" &&
         typeof sendInput.body === "string" &&
         typeof sendInput.recipient === "string" &&
         typeof sendInput.destinationChain === "string" &&
         isValidChainId(sendInput.destinationChain)
}

// Pure function to create error result
const createErrorResult = (error: SendMessageError): ActionResult<SendMessageActionOutput> => ({
  success: false,
  error: error.type === "INVALID_INPUT" 
    ? `Invalid input: ${error.details}`
    : error.type === "INVALID_CHAIN"
    ? `Invalid chain ID: ${error.chain}`
    : error.type === "SERVICE_UNAVAILABLE"
    ? `${error.service} service not found`
    : error.type === "DISPATCH_ERROR"
    ? error.error
    : `Insufficient funds. Required: ${error.required}`,
  metadata: new Map(),
})

// Pure function to create success result
const createSuccessResult = (messageId: string, txHash: string): ActionResult<SendMessageActionOutput> => ({
  success: true,
  data: {
    messageId,
    txHash,
  },
  metadata: new Map(),
})

export const createSendMessageAction = (): Action<SendMessageActionInput, SendMessageActionOutput> => ({
  name: 'sendMessage',
  description: 'Send a cross-chain message',
  examples: [
    [
      {
        user: "{{user1}}",
        content: { 
          text: "Send message to chain 2", 
          action: "sendMessage", 
          input: { 
            id: "0x123", 
            body: "0x789", 
            recipient: "0xdef", 
            destinationChain: "2" 
          }
        },
      },
      {
        user: "{{agent}}",
        content: { 
          text: "Message sent successfully", 
          action: "sendMessage",
          output: { 
            messageId: "0x123", 
            txHash: "0xabc"
          }
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime, memory: Memory) => {
    const hyperlane = runtime.services?.get(ServiceType.HYPERLANE)
    if (!hyperlane) return false

    const input = memory.content?.input
    return validateInput(input)
  },
  handler: async (runtime: IAgentRuntime, memory: Memory): Promise<ActionResult<SendMessageActionOutput>> => {
    try {
      const hyperlane = runtime.services?.get(ServiceType.HYPERLANE)
      if (!hyperlane) {
        return createErrorResult({
          type: "SERVICE_UNAVAILABLE",
          service: "Hyperlane"
        })
      }

      const input = memory.content?.input as SendMessageActionInput
      if (!validateInput(input)) {
        return createErrorResult({
          type: "INVALID_INPUT",
          details: "Invalid message format"
        })
      }

      // Store message in memory
      await runtime.memory.set(`message:${input.id}`, input)
      await runtime.memory.set(`message:${input.id}:status`, 'pending')

      try {
        // Dispatch message
        const result = await hyperlane.dispatch(input)
        if (!result.messageId || !result.txHash) {
          await runtime.memory.set(`message:${input.id}:status`, 'failed')
          return createErrorResult({
            type: "DISPATCH_ERROR",
            error: "Dispatch failed"
          })
        }

        return createSuccessResult(result.messageId, result.txHash)
      } catch (error) {
        await runtime.memory.set(`message:${input.id}:status`, 'failed')
        return createErrorResult({
          type: "DISPATCH_ERROR",
          error: error instanceof Error ? error.message : "Dispatch failed"
        })
      }
    } catch (error) {
      return createErrorResult({
        type: "DISPATCH_ERROR",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }
})
