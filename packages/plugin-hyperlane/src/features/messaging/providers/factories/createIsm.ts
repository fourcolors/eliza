import { JsonRpcProvider } from 'ethers'
import { IInterchainSecurityModule } from '@hyperlane-xyz/core'
import { HyperlaneDeployer, MultiProvider } from '@hyperlane-xyz/sdk'

/**
 * Options for creating an ISM
 */
export type IsmFactoryOptions = Readonly<{
  deployer: string
  validators?: ReadonlyArray<string>
  threshold?: number
  optimisticPeriod?: number
  routingIsm?: string
}>

/**
 * Creates a multisig ISM contract
 */
export const createMultisigIsm = async (
  provider: JsonRpcProvider,
  options: Readonly<{
    deployer: string
    validators: ReadonlyArray<string>
    threshold?: number
  }>
): Promise<IInterchainSecurityModule> => {
  const { deployer: deployerAddress, validators, threshold = Math.ceil(validators.length / 2) } = options

  // TODO: Use Hyperlane contract factory to deploy multisig ISM
  // 1. Deploy MultisigIsm contract
  // 2. Initialize with validators and threshold
  // 3. Return contract instance
  throw new Error('Not implemented')
}

/**
 * Creates an optimistic ISM contract
 */
export const createOptimisticIsm = async (
  provider: JsonRpcProvider,
  options: Readonly<{
    deployer: string
    optimisticPeriod?: number
  }>
): Promise<IInterchainSecurityModule> => {
  const { deployer: deployerAddress, optimisticPeriod = 60 * 60 * 24 } = options // Default 24 hours

  // TODO: Use Hyperlane contract factory to deploy optimistic ISM
  // 1. Deploy OptimisticIsm contract
  // 2. Initialize with optimistic period
  // 3. Return contract instance
  throw new Error('Not implemented')
}

/**
 * Creates a routing ISM contract that delegates to another ISM
 */
export const createRoutingIsm = async (
  provider: JsonRpcProvider,
  options: Readonly<{
    deployer: string
    routingIsm: string
  }>
): Promise<IInterchainSecurityModule> => {
  const { deployer: deployerAddress, routingIsm: routingIsmAddress } = options

  // TODO: Use Hyperlane contract factory to deploy routing ISM
  // 1. Deploy RoutingIsm contract
  // 2. Initialize with routing ISM address
  // 3. Return contract instance
  throw new Error('Not implemented')
}

/**
 * Factory function to create an ISM based on type
 */
export const createIsm = async (
  provider: JsonRpcProvider,
  type: 'multisig' | 'optimistic' | 'routing',
  options: IsmFactoryOptions
): Promise<IInterchainSecurityModule> => {
  // Validate options based on ISM type
  const validateOptions = (type: string, options: IsmFactoryOptions): void => {
    switch (type) {
      case 'multisig':
        if (!options.validators || options.validators.length === 0) {
          throw new Error('Validators required for multisig ISM')
        }
        break
      case 'routing':
        if (!options.routingIsm) {
          throw new Error('Routing ISM address required')
        }
        break
    }
  }

  // Validate options before proceeding
  validateOptions(type, options)

  // Create ISM based on type
  switch (type) {
    case 'multisig':
      return createMultisigIsm(provider, {
        deployer: options.deployer,
        validators: options.validators!,
        threshold: options.threshold
      })

    case 'optimistic':
      return createOptimisticIsm(provider, {
        deployer: options.deployer,
        optimisticPeriod: options.optimisticPeriod
      })

    case 'routing':
      return createRoutingIsm(provider, {
        deployer: options.deployer,
        routingIsm: options.routingIsm!
      })

    default:
      throw new Error(`Unsupported ISM type: ${type}`)
  }
}
