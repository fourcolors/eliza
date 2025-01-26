import { type HyperlaneConfig } from "../types/config"
import { type MessageStatus } from "../types/message"

export interface IsmProvider {
  readonly verifyMessage: (params: {
    readonly messageId: string
    readonly originChain: string
  }) => Promise<{
    readonly verified: boolean
    readonly status: MessageStatus
  }>
  readonly getVerificationGas: (params: {
    readonly messageId: string
    readonly originChain: string
  }) => Promise<bigint>
}

export const createIsmProvider = (config: HyperlaneConfig): IsmProvider => {
  const verifyMessage = async ({ messageId, originChain }) => {
    const ism = config.getIsm(originChain)
    const mailbox = config.getMailbox(originChain)
    
    // Get message metadata from mailbox
    const message = await mailbox.messages(messageId)
    if (!message) {
      return {
        verified: false,
        status: "not_found" as const,
      }
    }

    try {
      // Verify message using ISM
      const verified = await ism.verify(
        originChain,
        message.sender,
        message.recipient,
        message.body
      )

      return {
        verified,
        status: verified ? "verified" : "invalid" as const,
      }
    } catch (error) {
      return {
        verified: false,
        status: "verification_failed" as const,
      }
    }
  }

  const getVerificationGas = async ({ messageId, originChain }) => {
    const ism = config.getIsm(originChain)
    const mailbox = config.getMailbox(originChain)
    
    const message = await mailbox.messages(messageId)
    if (!message) {
      throw new Error("Message not found")
    }

    return await ism.estimateGas.verify(
      originChain,
      message.sender,
      message.recipient,
      message.body
    )
  }

  return {
    verifyMessage,
    getVerificationGas,
  }
}
