import { StorageService } from '@elizaos/core'
import { MessageState } from '../types/status'
import { determineMessageStatus } from '../utils/status'

/**
 * Creates a pure function for tracking message status
 */
export const createStatusTracker = (storage: Readonly<StorageService>) => {
  return async (messageId: string): Promise<Readonly<MessageState>> => {
    const message = await storage.getItem(`message:${messageId}`)

    if (!message) {
      const state = {
        id: messageId,
        status: 'failed',
        timestamp: Date.now(),
        metadata: new Map([['error', 'Message not found']])
      } as const

      return Object.freeze(state)
    }

    const parsedMessage = JSON.parse(message)
    const status = await determineMessageStatus(parsedMessage)

    const state = {
      ...parsedMessage,
      status,
      timestamp: Date.now(),
      metadata: new Map(parsedMessage.metadata ? Object.entries(parsedMessage.metadata) : [])
    } as const

    return Object.freeze(state)
  }
}
