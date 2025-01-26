import { type IAgentRuntime, type Memory, type Service } from "@elizaos/core"
import { ServiceType } from "@elizaos/core"
import { type IsmProvider } from "../providers/createIsmProvider"
import { type ActionResult } from "../types/action"
import { type MessageStatus } from "../types/message"

export interface VerifyMessageActionInput {
  readonly messageId: string
  readonly originChain: string
}

export interface VerifyMessageActionOutput {
  readonly verified: boolean
  readonly status: MessageStatus
  readonly gasEstimate: string
}

// Define specific error types for better error handling
export type VerifyMessageError = 
  | { type: "INVALID_INPUT"; details: string }
  | { type: "INVALID_CHAIN"; chain: string }
  | { type: "SERVICE_UNAVAILABLE"; service: string }
  | { type: "VERIFICATION_ERROR"; error: string }

// Pure function to validate message ID format
const isValidMessageId = (messageId: string): boolean => 
  /^0x[a-fA-F0-9]+$/.test(messageId)

// Pure function to validate chain ID format
const isValidChainId = (chainId: string): boolean => 
  /^\d+$/.test(chainId) && parseInt(chainId) > 0

// Pure function to validate input
const validateInput = (input: unknown): input is VerifyMessageActionInput => {
  if (typeof input !== "object" || input === null) return false
  
  const verifyInput = input as Partial<VerifyMessageActionInput>
  return typeof verifyInput.messageId === "string" &&
         typeof verifyInput.originChain === "string" &&
         isValidMessageId(verifyInput.messageId) &&
         isValidChainId(verifyInput.originChain)
}

// Pure function to create error result
const createErrorResult = (error: VerifyMessageError): ActionResult<VerifyMessageActionOutput> => ({
  success: false,
  error: error.type === "INVALID_INPUT" 
    ? `Invalid input: ${error.details}`
    : error.type === "INVALID_CHAIN"
    ? `Invalid chain ID: ${error.chain}`
    : error.type === "SERVICE_UNAVAILABLE"
    ? `Service unavailable: ${error.service}`
    : `Verification error: ${error.error}`,
  metadata: new Map(),
})

// Pure function to create success result
const createSuccessResult = (
  verified: boolean, 
  status: MessageStatus, 
  gasEstimate: bigint
): ActionResult<VerifyMessageActionOutput> => ({
  success: true,
  data: {
    verified,
    status,
    gasEstimate: gasEstimate.toString(),
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
          text: "Verify message 0x123 from chain 1", 
          action: "verifyMessage", 
          input: { 
            messageId: "0x123",
            originChain: "1"
          }
        },
      },
      {
        user: "{{agent}}",
        content: { 
          text: "Message verification complete", 
          action: "verifyMessage",
          output: { 
            verified: true,
            status: "verified",
            gasEstimate: "50000"
          }
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const ism = runtime.getService<IsmProvider & Service>(ServiceType.HYPERLANE)
    if (!ism) return false
    
    return validateInput(message.content.input)
  },
  handler: async (runtime: IAgentRuntime, message: Memory): Promise<ActionResult<VerifyMessageActionOutput>> => {
    try {
      const input = message.content.input
      
      // Validate input format
      if (!validateInput(input)) {
        return createErrorResult({ 
          type: "INVALID_INPUT", 
          details: "Invalid message ID or chain ID format" 
        })
      }

      // Get ISM service
      const ism = runtime.getService<IsmProvider & Service>(ServiceType.HYPERLANE)
      if (!ism) {
        return createErrorResult({ 
          type: "SERVICE_UNAVAILABLE", 
          service: "HYPERLANE" 
        })
      }

      // Verify message
      const { verified, status } = await ism.verifyMessage({
        messageId: input.messageId,
        originChain: input.originChain,
      })

      // Get gas estimate for verification
      const gasEstimate = await ism.getVerificationGas({
        messageId: input.messageId,
        originChain: input.originChain,
      })

      return createSuccessResult(verified, status, gasEstimate)
    } catch (error) {
      return createErrorResult({ 
        type: "VERIFICATION_ERROR", 
        error: error instanceof Error ? error.message : "Unknown error" 
      })
    }
  },
})
