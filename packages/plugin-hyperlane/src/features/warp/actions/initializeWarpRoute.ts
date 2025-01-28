/**
 * /packages/plugin-hyperlane/src/features/warp/actions/initializeWarpRoute.ts
 *
 * Action handler for initializing new warp routes.
 * Sets up token bridging paths between chains with validation.
 */

import {
  Action,
  ActionResult,
  IAgentRuntime,
  ServiceType,
} from "@elizaos/core";
import { ethers } from 'ethers';
import { HypERC20Collateral__factory, HypERC20__factory } from "@hyperlane-xyz/core";

// Types for Warp Route initialization
export interface InitializeWarpRouteParams {
  // The original token contract address
  tokenAddress: string
  // The domain ID of the origin chain
  originDomain: number
  // List of destination domain IDs where the token can be transferred
  destinationDomains: ReadonlyArray<number>
  // Optional ISM addresses for each destination domain
  ismAddresses?: { [domain: number]: string }
  // Optional gas parameters for remote operations
  remoteGasAmount?: string
  // Optional name and symbol for wrapped tokens
  wrappedTokenName?: string
  wrappedTokenSymbol?: string
}

export interface InitializeWarpRouteResult {
  // The address of the collateral contract on the origin chain
  collateralAddress: string
  // Map of destination domains to their synthetic token addresses
  syntheticAddresses: Map<number, string>
  // Transaction hash of the initialization
  txHash: string
}

// Define specific error types for better error handling
export type InitializeWarpRouteError = 
  | { type: "INVALID_INPUT"; details: string }
  | { type: "INITIALIZATION_ERROR"; error: string }

// Pure function to validate initialization parameters
const validateInput = (input: unknown): input is InitializeWarpRouteParams => {
  if (!input || typeof input !== 'object') return false

  const params = input as InitializeWarpRouteParams
  if (!params.tokenAddress || !ethers.isAddress(params.tokenAddress)) return false
  if (typeof params.originDomain !== 'number' || params.originDomain < 0) return false
  if (!Array.isArray(params.destinationDomains) || params.destinationDomains.length === 0) return false
  if (!params.destinationDomains.every(domain => typeof domain === 'number' && domain > 0)) return false

  // Optional ISM addresses must be valid if provided
  if (params.ismAddresses) {
    for (const address of Object.values(params.ismAddresses)) {
      if (!ethers.isAddress(address)) return false
    }
  }

  // Optional gas amount must be a valid number string if provided
  if (params.remoteGasAmount) {
    try {
      ethers.parseUnits(params.remoteGasAmount, 'wei')
    } catch {
      return false
    }
  }

  return true
}

// Pure function to create error result
const createErrorResult = (error: InitializeWarpRouteError): ActionResult<InitializeWarpRouteResult> => ({
  success: false,
  error: {
    type: error.type,
    message: error.type === "INVALID_INPUT" ? error.details : error.error
  },
  metadata: new Map(),
})

// Pure function to create success result
const createSuccessResult = (
  result: InitializeWarpRouteResult,
  metadata: Map<string, string>
): ActionResult<InitializeWarpRouteResult> => ({
  success: true,
  data: result,
  metadata,
})

// Pure function to create initialize warp route action
export const createInitializeWarpRouteAction = (): Action<InitializeWarpRouteParams, InitializeWarpRouteResult> => {
  return {
    name: 'initializeWarpRoute',
    execute: async (
      input: unknown,
      runtime: IAgentRuntime
    ): Promise<ActionResult<InitializeWarpRouteResult>> => {
      // Validate input
      if (!validateInput(input)) {
        return createErrorResult({
          type: "INVALID_INPUT",
          details: "Invalid warp route initialization parameters"
        })
      }

      // Get required services
      const hyperlaneService = await runtime.getService(ServiceType.BLOCKCHAIN)
      if (!hyperlaneService) {
        return createErrorResult({
          type: "INITIALIZATION_ERROR",
          error: "Hyperlane service not found"
        })
      }

      try {
        // Get provider for origin chain
        const provider = await hyperlaneService.getProvider(input.originDomain)
        const signer = provider.getSigner()

        // Deploy collateral contract on origin chain
        const collateralFactory = HypERC20Collateral__factory.connect(input.tokenAddress, signer)
        const collateralContract = await collateralFactory.deploy(
          input.tokenAddress,
          input.originDomain,
          input.destinationDomains,
          input.ismAddresses || {},
          input.remoteGasAmount ? ethers.parseUnits(input.remoteGasAmount, 'wei') : 0n
        )

        // Wait for deployment
        const receipt = await collateralContract.waitForDeployment()
        const collateralAddress = await collateralContract.getAddress()

        // Deploy synthetic tokens on destination chains
        const syntheticAddresses = new Map<number, string>()
        for (const destDomain of input.destinationDomains) {
          const destProvider = await hyperlaneService.getProvider(destDomain)
          const destSigner = destProvider.getSigner()

          const syntheticFactory = HypERC20__factory.connect(input.tokenAddress, destSigner)
          const syntheticContract = await syntheticFactory.deploy(
            collateralAddress,
            input.originDomain,
            input.wrappedTokenName || 'Wrapped Token',
            input.wrappedTokenSymbol || 'WRAP'
          )

          // Wait for deployment
          await syntheticContract.waitForDeployment()
          syntheticAddresses.set(destDomain, await syntheticContract.getAddress())
        }

        // Return successful initialization
        return createSuccessResult(
          {
            collateralAddress,
            syntheticAddresses,
            txHash: receipt.hash
          },
          new Map([
            ['originDomain', input.originDomain.toString()],
            ['tokenAddress', input.tokenAddress]
          ])
        )

      } catch (error) {
        return createErrorResult({
          type: "INITIALIZATION_ERROR",
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }
  }
}
