import { Action, ServiceType } from '@elizaos/core'
import type { IAgentRuntime, Memory } from '@elizaos/core'
import type { ActionResult } from '../types/action'
import type { HyperlaneMessage } from '../types/message'

export interface GetMessageActionInput {
  readonly messageId: string
}

export interface GetMessageActionOutput {
  readonly message: HyperlaneMessage
}

// Define specific error types for better error handling
export type GetMessageError = 
  | { type: "INVALID_INPUT"; details: string }
  | { type: "MESSAGE_NOT_FOUND"; messageId: string }

// Pure function to validate message ID format
const isValidMessageId = (messageId: string): boolean => 
  /^0x[a-fA-F0-9]+$/.test(messageId)

// Pure function to validate input
const validateInput = (input: unknown): input is GetMessageActionInput => {
  if (typeof input !== "object" || input === null) return false
  
  const getMessage = input as Partial<GetMessageActionInput>
  return typeof getMessage.messageId === "string" &&
         isValidMessageId(getMessage.messageId)
}

// Pure function to create error result
const createErrorResult = (error: GetMessageError): ActionResult<GetMessageActionOutput> => ({
  success: false,
  error: error.type === "INVALID_INPUT" 
    ? "Invalid message ID format"
    : `Message ${error.messageId} not found`,
  metadata: new Map(),
})

// Pure function to create success result
const createSuccessResult = (message: HyperlaneMessage): ActionResult<GetMessageActionOutput> => ({
  success: true,
  data: {
    message,
  },
  metadata: new Map(),
})

export const createGetMessageAction = (): Action<GetMessageActionInput, GetMessageActionOutput> => ({
  name: 'getMessage',
  description: 'Get a cross-chain message by ID',
  examples: [
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Get message 0x123',
          action: 'getMessage',
          input: {
            messageId: '0x123'
          }
        }
      },
      {
        assistant: '{{assistant}}',
        content: {
          text: 'Message retrieved',
          action: 'getMessage',
          output: {
            message: {
              id: '0x123',
              body: '0x456',
              recipient: '0x789',
              destinationChain: '1'
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
  handler: async (runtime: IAgentRuntime, memory: Memory): Promise<ActionResult<GetMessageActionOutput>> => {
    try {
      const input = memory.content?.input as GetMessageActionInput
      if (!validateInput(input)) {
        return createErrorResult({
          type: "INVALID_INPUT",
          details: "Invalid message ID format"
        })
      }

      const message = await runtime.memory.get(`message:${input.messageId}`) as HyperlaneMessage
      if (!message) {
        return createErrorResult({
          type: "MESSAGE_NOT_FOUND",
          messageId: input.messageId
        })
      }

      return createSuccessResult(message)
    } catch (error) {
      return createErrorResult({
        type: "INVALID_INPUT",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }
})
