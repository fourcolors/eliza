/**
 * /packages/plugin-hyperlane/src/features/messaging/providers/factories/createMailbox.ts
 *
 * Factory for creating Hyperlane mailbox contracts.
 * Handles message dispatch and receipt between chains.
 */

import { IMailbox } from "@hyperlane-xyz/core";
import { ChainName } from "@hyperlane-xyz/sdk";
import { MailboxConfig } from "@core/types/message";
import { validateMailboxConfig } from "@shared/validators/createParamsValidator";

/**
 * Options for creating a mailbox
 */
export type MailboxFactoryOptions = Readonly<{
  deployer: string
  domain: number
  defaultIsm: string
}>

/**
 * Creates a mailbox contract
 */
export const createMailbox = async (
  provider: JsonRpcProvider,
  options: MailboxFactoryOptions
): Promise<IMailbox> => {
  // Validate options
  const validateOptions = (options: MailboxFactoryOptions): void => {
    if (options.domain <= 0) {
      throw new Error('Domain must be greater than 0')
    }
    if (!options.defaultIsm) {
      throw new Error('Default ISM address required')
    }
  }

  // Validate options before proceeding
  validateOptions(options)

  // TODO: Use Hyperlane contract factory to deploy mailbox
  // 1. Deploy Mailbox contract
  // 2. Initialize with domain and default ISM
  // 3. Return contract instance
  throw new Error('Not implemented')
}
