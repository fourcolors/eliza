import { type IAgentRuntime, type Memory, type Service } from "@elizaos/core"
import { ServiceType } from "@elizaos/core"
import { type StorageService } from "../types/hyperlane"
import { type HyperlaneMessage } from "../types/message"
import { type ActionResult } from "../types/action"

export interface GetMessageActionInput {
  readonly messageId: string
}

export interface GetMessageActionOutput {
  readonly message: HyperlaneMessage
  readonly status: "pending" | "delivered" | "failed"
}

// Define specific error types for better error handling
export type GetMessageError = 
  | { type: "NOT_FOUND"; messageId: string }
  | { type: "INVALID_FORMAT"; messageId: string }
  | { type: "STORAGE_ERROR"; error: string }

// Pure function to validate message ID format
const isValidMessageId = (messageId: string): boolean => 
  /^0x[a-fA-F0-9]+$/.test(messageId)

// Pure function to validate input
const validateInput = (input: unknown): input is GetMessageActionInput => {
  return typeof input === "object" && 
         input !== null && 
         "messageId" in input &&
         typeof (input as any).messageId === "string" &&
         isValidMessageId((input as any).messageId)
}

// Pure function to create error result
const createErrorResult = (error: GetMessageError): ActionResult<GetMessageActionOutput> => ({
  success: false,
  error: error.type === "NOT_FOUND" 
    ? `Message ${error.messageId} not found`
    : error.type === "INVALID_FORMAT"
    ? `Invalid message ID format: ${error.messageId}`
    : `Storage error: ${error.error}`,
  metadata: new Map(),
})

// Pure function to create success result
const createSuccessResult = (message: HyperlaneMessage, status: GetMessageActionOutput["status"]): ActionResult<GetMessageActionOutput> => ({
  success: true,
  data: { message, status },
  metadata: new Map(),
})

export const createGetMessageAction = () => ({
  name: "getMessage",
  similes: ["fetchMessage", "retrieveMessage"],
  description: "Retrieves a message and its status from the Hyperlane network",
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Get message 0x123", action: "getMessage", input: { messageId: "0x123" } },
      },
      {
        user: "{{agent}}",
        content: { 
          text: "Retrieved message 0x123", 
          action: "getMessage",
          output: { 
            message: { 
              id: "0x123", 
              sender: "0xabc", 
              recipient: "0xdef", 
              origin: 1, 
              destination: 2, 
              body: "0x789" 
            }, 
            status: "delivered" 
          }
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const storage = runtime.getService<StorageService & Service>(ServiceType.STORAGE)
    if (!storage) return false
    
    return validateInput(message.content.input)
  },
  handler: async (runtime: IAgentRuntime, message: Memory): Promise<ActionResult<GetMessageActionOutput>> => {
    try {
      const input = message.content.input
      
      // Validate input format
      if (!validateInput(input)) {
        return createErrorResult({ 
          type: "INVALID_FORMAT", 
          messageId: String(input?.messageId ?? "undefined") 
        })
      }

      const storage = runtime.getService<StorageService & Service>(ServiceType.STORAGE)
      if (!storage) {
        return createErrorResult({ 
          type: "STORAGE_ERROR", 
          error: "Storage service not available" 
        })
      }

      // Get message data
      const messageData = await storage.getMessage(input.messageId)
      if (!messageData) {
        return createErrorResult({ 
          type: "NOT_FOUND", 
          messageId: input.messageId 
        })
      }

      // Get message status
      const status = await storage.getMessageStatus(input.messageId)

      return createSuccessResult(messageData, status)
    } catch (error) {
      return createErrorResult({ 
        type: "STORAGE_ERROR", 
        error: error instanceof Error ? error.message : "Unknown error" 
      })
    }
  },
})
