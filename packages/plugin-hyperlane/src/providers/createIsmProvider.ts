import { PluginConfig } from '../types/config'
import { IInterchainSecurityModule } from '@hyperlane-xyz/core'

export interface IsmProvider {
  verify: (messageId: string, domain: number) => Promise<boolean>
}

/**
 * Creates an ISM provider for verifying messages
 */
export const createIsmProvider = (config: PluginConfig): IsmProvider => {
  /**
   * Gets the ISM for a specific domain, falling back to default if not found
   */
  const getIsm = (domain: number): IInterchainSecurityModule => {
    const ism = config.isms.get(domain) ?? config.defaultIsm
    if (!ism) {
      throw new Error(`No ISM available for domain ${domain}`)
    }
    return ism
  }

  return {
    /**
     * Verifies a message using domain-specific or default ISM
     */
    verify: async (messageId: string, domain: number): Promise<boolean> => {
      const ism = getIsm(domain)
      return ism.verify(messageId)
    }
  }
}
