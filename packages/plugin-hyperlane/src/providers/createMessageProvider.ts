import { StorageService } from '../types/hyperlane';
import { MessageProvider } from '../types/provider';

/**
 * Creates a provider for accessing message data
 * @param storage Storage service instance
 * @returns Message provider
 */
export const createMessageProvider = (
  storage: Readonly<StorageService>
): MessageProvider => ({
  listMessages: async (filter) => {
    const messages = await storage.listMessages(filter);
    return {
      messages,
      count: messages.length,
      filter
    } as const;
  },
  getMessage: async (messageId) => {
    const message = await storage.getMessage(messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }
    return {
      message,
      status: await storage.getMessageStatus(messageId)
    } as const;
  }
});
