import { StorageService } from '../types/hyperlane';
import { MessageProvider } from '../types/provider';

/**
 * Creates a provider function for accessing message data
 * @param storage Storage service instance
 * @returns Message provider function
 */
export const createMessageProvider = (
  storage: Readonly<StorageService>
): MessageProvider =>
  async (filter) => {
    const messages = await storage.listMessages(filter);
    return {
      messages,
      count: messages.length,
      filter
    } as const;
  };
