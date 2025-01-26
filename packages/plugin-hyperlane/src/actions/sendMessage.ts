import { type IAgentRuntime, type Memory, type Service } from "@elizaos/core"
import { ServiceType } from "@elizaos/core"
import { type HyperlaneService } from "../types/hyperlane"
import { type HyperlaneMessage } from "../types/message"
import { type ActionResult } from "../types/action"

export interface SendMessageActionInput {
  readonly message: HyperlaneMessage
  readonly destinationChain: string
}

export interface SendMessageActionOutput {
  readonly messageId: string
  readonly txHash: string
  readonly fee: string
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

// Pure function to validate HyperlaneMessage format
const isValidMessage = (message: unknown): message is HyperlaneMessage => {
  if (typeof message !== "object" || message === null) return false
  
  const msg = message as Partial<HyperlaneMessage>
  return typeof msg.id === "string" &&
         typeof msg.sender === "string" &&
         typeof msg.recipient === "string" &&
         typeof msg.origin === "number" &&
         typeof msg.destination === "number" &&
         typeof msg.body === "string" &&
         msg.id.startsWith("0x") &&
         msg.sender.startsWith("0x") &&
         msg.recipient.startsWith("0x") &&
         msg.body.startsWith("0x")
}

// Pure function to validate input
const validateInput = (input: unknown): input is SendMessageActionInput => {
  if (typeof input !== "object" || input === null) return false
  
  const sendInput = input as Partial<SendMessageActionInput>
  return isValidMessage(sendInput.message as unknown) &&
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
    ? `Service unavailable: ${error.service}`
    : error.type === "DISPATCH_ERROR"
    ? `Dispatch error: ${error.error}`
    : `Insufficient funds. Required: ${error.required}`,
  metadata: new Map(),
})

// Pure function to create success result
const createSuccessResult = (messageId: string, txHash: string, fee: bigint): ActionResult<SendMessageActionOutput> => ({
  success: true,
  data: {
    messageId,
    txHash,
    fee: fee.toString(),
  },
  metadata: new Map(),
})

export const createSendMessageAction = () => ({
  name: "sendMessage",
  similes: ["dispatchMessage", "transmitMessage"],
  description: "Sends a message through the Hyperlane network to another chain",
  examples: [
    [
      {
        user: "{{user1}}",
        content: { 
          text: "Send message to chain 2", 
          action: "sendMessage", 
          input: { 
            message: { 
              id: "0x123", 
              sender: "0xabc", 
              recipient: "0xdef", 
              origin: 1, 
              destination: 2, 
              body: "0x789" 
            }, 
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
            txHash: "0xabc",
            fee: "1000000000000000" 
          }
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const hyperlane = runtime.getService<HyperlaneService & Service>(ServiceType.HYPERLANE)
    if (!hyperlane) return false
    
    return validateInput(message.content.input)
  },
  handler: async (runtime: IAgentRuntime, message: Memory): Promise<ActionResult<SendMessageActionOutput>> => {
    try {
      const input = message.content.input
      
      // Validate input format
      if (!validateInput(input)) {
        return createErrorResult({ 
          type: "INVALID_INPUT", 
          details: "Invalid message format or chain ID" 
        })
      }

      // Get Hyperlane service
      const hyperlane = runtime.getService<HyperlaneService & Service>(ServiceType.HYPERLANE)
      if (!hyperlane) {
        return createErrorResult({ 
          type: "SERVICE_UNAVAILABLE", 
          service: "Hyperlane" 
        })
      }

      // Verify chain is supported
      const destinationChain = parseInt(input.destinationChain)
      const supportedDomains = hyperlane.getDomains()
      if (!supportedDomains.includes(destinationChain)) {
        return createErrorResult({ 
          type: "INVALID_CHAIN", 
          chain: input.destinationChain 
        })
      }

      // Get fee estimate
      const fee = await hyperlane.quoteDispatch({
        destination: destinationChain,
        recipient: input.message.recipient,
        body: input.message.body,
      })

      // Get provider to check balance
      const provider = hyperlane.getProvider(input.message.origin)
      const senderBalance = await provider.getBalance(input.message.sender)
      if (senderBalance < fee) {
        return createErrorResult({
          type: "INSUFFICIENT_FUNDS",
          required: fee.toString()
        })
      }

      // Dispatch message
      const result = await hyperlane.dispatch({
        destination: destinationChain,
        recipient: input.message.recipient,
        body: input.message.body,
      })

      return createSuccessResult(result.id, result.txHash, result.fee)
    } catch (error) {
      return createErrorResult({ 
        type: "DISPATCH_ERROR", 
        error: error instanceof Error ? error.message : "Unknown error" 
      })
    }
  },
})
