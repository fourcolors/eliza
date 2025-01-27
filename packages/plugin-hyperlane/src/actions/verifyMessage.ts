import { type IAgentRuntime, type Memory, type Service } from "@elizaos/core"
import { ServiceType } from "@elizaos/core"
import { type IsmProvider } from "../providers/createIsmProvider"
import { type ActionResult } from "../types/action"
import { type MessageStatus } from "../types/message"

export interface VerifyMessageActionInput {
  readonly messageId: string
}

export interface VerifyMessageActionOutput {
  readonly verified: boolean
  readonly status: MessageStatus
}

// Define specific error types for better error handling
export type VerifyMessageError = 
  | { type: "INVALID_INPUT"; details: string }
  | { type: "SERVICE_UNAVAILABLE"; service: string }
  | { type: "VERIFICATION_ERROR"; error: string }

// Pure function to validate message ID format
const isValidMessageId = (messageId: string): boolean => 
  /^0x[a-fA-F0-9]+$/.test(messageId)

// Pure function to validate input
const validateInput = (input: unknown): input is VerifyMessageActionInput => {
  if (typeof input !== "object" || input === null) return false
  
  const verifyInput = input as Partial<VerifyMessageActionInput>
  return typeof verifyInput.messageId === "string" &&
         isValidMessageId(verifyInput.messageId)
}

// Pure function to create error result
const createErrorResult = (error: VerifyMessageError): ActionResult<VerifyMessageActionOutput> => ({
  success: false,
  error: error.type === "INVALID_INPUT" ? error.details :
         error.type === "SERVICE_UNAVAILABLE" ? `${error.service} service not found` :
         error.error,
  metadata: new Map(),
})

// Pure function to create success result
const createSuccessResult = (
  verified: boolean, 
  status: MessageStatus
): ActionResult<VerifyMessageActionOutput> => ({
  success: true,
  data: {
    verified,
    status,
  },
  metadata: new Map(),
})

export const createVerifyMessageAction = () => ({
  name: "verifyMessage",
  similes: ["validateMessage", "checkMessage"],
  description: "Verifies a message using the Hyperlane Interchain Security Module (ISM)",
  examples: [
    [
      {
        user: "{{user1}}",
        content: { 
          text: "Verify message 0x123", 
          action: "verifyMessage", 
          input: { 
            messageId: "0x123",
          }
        },
      },
      {
        user: "{{assistant}}",
        content: { 
          text: "Message verification complete", 
          action: "verifyMessage",
          output: { 
            verified: true,
            status: "verified",
          }
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime, memory: Memory) => {
    const ism = runtime.services?.get(ServiceType.ISM)
    if (!ism) return false
    
    const input = memory.content?.input as Partial<VerifyMessageActionInput>
    return validateInput(input)
  },
  handler: async (runtime: IAgentRuntime, memory: Memory): Promise<ActionResult<VerifyMessageActionOutput>> => {
    try {
      const ism = runtime.services?.get(ServiceType.ISM)
      if (!ism) {
        return createErrorResult({ 
          type: "SERVICE_UNAVAILABLE", 
          service: "ISM" 
        })
      }

      const input = memory.content?.input as VerifyMessageActionInput
      if (!validateInput(input)) {
        return createErrorResult({
          type: "INVALID_INPUT",
          details: "Invalid message ID format"
        })
      }

      const message = await runtime.memory.get(`message:${input.messageId}`)
      if (!message) {
        return createErrorResult({
          type: "VERIFICATION_ERROR",
          error: `Message ${input.messageId} not found`
        })
      }

      const result = await ism.verifyMessage({ messageId: input.messageId })
      const status = result.verified ? 'delivered' : 'failed'
      await runtime.memory.set(`message:${input.messageId}:status`, status)

      return createSuccessResult(result.verified, result.status)
    } catch (error) {
      return createErrorResult({
        type: "VERIFICATION_ERROR",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }
})
