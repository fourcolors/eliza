/**
 * /packages/plugin-hyperlane/src/features/chain/providers/createChainProvider.ts
 *
 * Factory for creating chain-specific providers.
 * Handles chain connection, status monitoring, and RPC management.
 */

import { elizaLogger } from "@elizaos/core";
import { MultiProtocolProvider } from "@hyperlane-xyz/sdk";
import { ChainConfig } from "@core/types/config";
import { validateChainConfig } from "@shared/validators/createParamsValidator";
import { IMailbox, IInterchainSecurityModule } from '@hyperlane-xyz/core'
import { createIsm } from './factories/createIsm'
import { createMailbox } from './factories/createMailbox'

/**
 * Creates a provider for chain management operations
 */
export const createChainProvider = (
  config: Readonly<ChainConfig>
): ChainProvider => {
  /**
   * Validates chain configuration
   */
  const validateChainConfig = async (
    domain: number,
    params: Readonly<{
      rpcUrl: string
      mailbox?: string
      ism?: string
    }>
  ): Promise<boolean> => {
    try {
      // Validate RPC connection
      const provider = new JsonRpcProvider(params.rpcUrl)
      await provider.getNetwork()

      // Validate mailbox if provided
      if (params.mailbox) {
        const mailbox = {} as IMailbox // TODO: Create mailbox contract instance
        await mailbox.localDomain()
      }

      // Validate ISM if provided
      if (params.ism) {
        const ism = {} as IInterchainSecurityModule // TODO: Create ISM contract instance
        await ism.moduleType()
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Deploys Hyperlane infrastructure to a new chain
   */
  const deployChain = async (
    domain: number,
    params: Readonly<{
      rpcUrl: string
      deployer: string
      ismType: 'multisig' | 'optimistic' | 'routing'
      validators?: ReadonlyArray<string>
      optimisticPeriod?: number
      routingIsm?: string
    }>
  ): Promise<{
    mailbox: string
    ism: string
  }> => {
    const provider = new JsonRpcProvider(params.rpcUrl)

    // Deploy ISM first
    const ism = await createIsm(provider, params.ismType, {
      deployer: params.deployer,
      validators: params.validators,
      optimisticPeriod: params.optimisticPeriod,
      routingIsm: params.routingIsm
    })

    // Deploy mailbox with ISM
    const mailbox = await createMailbox(provider, {
      deployer: params.deployer,
      domain,
      defaultIsm: await ism.getAddress()
    })

    return {
      mailbox: await mailbox.getAddress(),
      ism: await ism.getAddress()
    }
  }

  /**
   * Gets chain deployment status
   */
  const getChainStatus = async (
    domain: number
  ): Promise<{
    isDeployed: boolean
    mailbox?: string
    ism?: string
    validators?: ReadonlyArray<string>
  }> => {
    const mailbox = config.mailboxes.get(domain)
    const ism = config.isms.get(domain)

    if (!mailbox || !ism) {
      return { isDeployed: false }
    }

    // TODO: Get validator list from ISM contract
    return {
      isDeployed: true,
      mailbox,
      ism,
      validators: []
    }
  }

  /**
   * Updates chain configuration
   */
  const updateChainConfig = async (
    domain: number,
    params: Readonly<{
      validators?: ReadonlyArray<string>
      gasConfig?: {
        multiplier?: number
        maxPrice?: bigint
      }
    }>
  ): Promise<void> => {
    const mailbox = config.mailboxes.get(domain)
    const ism = config.isms.get(domain)

    if (!mailbox || !ism) {
      throw new Error(`Chain ${domain} not deployed`)
    }

    // TODO: Update validator set in ISM if provided
    if (params.validators) {
      throw new Error('Not implemented')
    }

    // TODO: Update gas config if provided
    if (params.gasConfig) {
      throw new Error('Not implemented')
    }
  }

  return Object.freeze({
    validateChainConfig,
    deployChain,
    getChainStatus,
    updateChainConfig
  })
}
