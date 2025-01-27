import { HyperlaneService } from '../types/hyperlane'
import { MessageStatus } from '../types/status'

/**
 * Creates a pure provider function for checking message status
 */
export const createStatusProvider = (hyperlane: Readonly<HyperlaneService>) => {
  return async (messageId: string): Promise<Readonly<MessageStatus>> => {
    try {
      const mailbox = await hyperlane.getMailbox(0) // Domain 0 for status checks
      const delivered = await mailbox.delivered(messageId)
      return delivered ? 'delivered' : 'pending'
    } catch (error) {
      return 'failed'
    }
  }
}
