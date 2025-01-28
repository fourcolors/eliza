/**
 * /packages/plugin-hyperlane/src/features/bridge/actions/verifyTransfer.ts
 *
 * Action handler for verifying cross-chain token transfers.
 * Validates transfer status and confirms token receipt.
 */

import {
  Action,
  elizaLogger,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  ServiceType,
  State,
} from "@elizaos/core";
import { HyperlaneService } from "@core/services/HyperlaneService";
import { createStatusTracker } from "@features/messaging/providers";
import { validateTransferStatus } from "@shared/validators/tokenValidators";
import { ActionResult, TokenType } from "@core/types/action";
import { ethers } from "ethers";
import { 
  ERC20__factory, 
  ERC721__factory, 
  ERC4626__factory 
} from "@hyperlane-xyz/core";

// Define verification parameters
export type VerifyTransferParams = Readonly<{
  tokenType: TokenType
  token: string
  amount: string
  recipient: string
  destinationDomain: number
  txHash: string
  metadata?: ReadonlyMap<string, unknown>
}>

// Define verification result
export type VerifyTransferResult = Readonly<{
  status: 'confirmed' | 'pending' | 'failed'
  receipt?: ethers.TransactionReceipt
  events?: ReadonlyArray<ethers.Log>
  confirmations: number
  error?: string
}>

// Define specific error types
export type VerifyError = 
  | { type: "INVALID_INPUT"; details: string }
  | { type: "INVALID_HASH"; hash: string }
  | { type: "TRANSACTION_FAILED"; error: string }
  | { type: "VERIFICATION_ERROR"; error: string }

// Pure function to validate transaction hash
const isValidHash = (hash: string): boolean => 
  /^0x[a-fA-F0-9]{64}$/.test(hash)

// Pure function to validate input
const validateInput = (input: unknown): input is VerifyTransferParams => {
  if (typeof input !== "object" || input === null) return false
  
  const verifyInput = input as Partial<VerifyTransferParams>
  return typeof verifyInput.tokenType === "string" &&
         ['erc20', 'erc721', 'erc4626', 'native'].includes(verifyInput.tokenType) &&
         typeof verifyInput.token === "string" &&
         ethers.isAddress(verifyInput.token) &&
         typeof verifyInput.amount === "string" &&
         typeof verifyInput.recipient === "string" &&
         ethers.isAddress(verifyInput.recipient) &&
         typeof verifyInput.destinationDomain === "number" &&
         verifyInput.destinationDomain > 0 &&
         typeof verifyInput.txHash === "string" &&
         isValidHash(verifyInput.txHash)
}

// Pure function to create error result
const createErrorResult = (error: VerifyError): ActionResult<VerifyTransferResult> => ({
  success: false,
  error: error.type === "INVALID_INPUT" 
    ? `Invalid input: ${error.details}`
    : error.type === "INVALID_HASH"
    ? `Invalid transaction hash: ${error.hash}`
    : error.type === "TRANSACTION_FAILED"
    ? `Transaction failed: ${error.error}`
    : error.type === "VERIFICATION_ERROR"
    ? error.error
    : "Unknown error",
  metadata: new Map([['error_type', error.type]])
})

// Pure function to create success result
const createSuccessResult = (
  result: VerifyTransferResult,
  metadata: Map<string, unknown>
): ActionResult<VerifyTransferResult> => ({
  success: true,
  data: result,
  metadata: new Map([...metadata, ['timestamp', Date.now()]])
})

// Pure factory function to create token contract instance
const createTokenContract = (
  tokenType: TokenType,
  tokenAddress: string,
  provider: ethers.Provider
) => {
  switch (tokenType) {
    case 'erc20':
      return ERC20__factory.connect(tokenAddress, provider)
    case 'erc721':
      return ERC721__factory.connect(tokenAddress, provider)
    case 'erc4626':
      return ERC4626__factory.connect(tokenAddress, provider)
    case 'native':
      return null
  }
}

// Pure function to verify token transfer events
const verifyTransferEvents = async (
  events: ReadonlyArray<ethers.Log>,
  params: VerifyTransferParams,
  provider: ethers.Provider
): Promise<boolean> => {
  try {
    // For native transfers, check if value matches
    if (params.tokenType === 'native') {
      const amountInWei = ethers.parseUnits(params.amount, 'wei')
      return events.some(event => 
        event.topics[0] === ethers.id('Transfer(address,address,uint256)') &&
        event.topics[2] === ethers.zeroPadValue(params.recipient, 32) &&
        ethers.getBigInt(event.data) === amountInWei
      )
    }

    // Get token contract for decimals
    const tokenContract = createTokenContract(params.tokenType, params.token, provider)
    if (!tokenContract) return false

    // For token transfers, check transfer event
    for (const event of events) {
      switch (params.tokenType) {
        case 'erc20':
        case 'erc4626': {
          const decimals = await tokenContract.decimals()
          const amountInWei = ethers.parseUnits(params.amount, decimals)
          if (
            event.topics[0] === ethers.id('Transfer(address,address,uint256)') &&
            event.topics[2] === ethers.zeroPadValue(params.recipient, 32) &&
            ethers.getBigInt(event.data) === amountInWei
          ) {
            return true
          }
          break
        }
        case 'erc721': {
          const tokenId = ethers.zeroPadValue(ethers.toBeHex(params.amount), 32)
          if (
            event.topics[0] === ethers.id('Transfer(address,address,uint256)') &&
            event.topics[2] === ethers.zeroPadValue(params.recipient, 32) &&
            event.topics[3] === tokenId
          ) {
            return true
          }
          break
        }
      }
    }

    return false
  } catch (error) {
    console.error('Error verifying transfer events:', error)
    return false
  }
}

// Pure function to create verify transfer action
export const createVerifyTransferAction = (): Action<VerifyTransferParams, VerifyTransferResult> => {
  return {
    name: 'verifyTransfer',
    execute: async (
      input: unknown,
      runtime: IAgentRuntime
    ): Promise<ActionResult<VerifyTransferResult>> => {
      // Validate input
      if (!validateInput(input)) {
        return createErrorResult({
          type: "INVALID_INPUT",
          details: "Invalid verification parameters"
        })
      }

      // Get required services
      const hyperlaneService = await runtime.getService(ServiceType.BLOCKCHAIN)
      if (!hyperlaneService) {
        return createErrorResult({
          type: "VERIFICATION_ERROR",
          error: "Hyperlane service not found"
        })
      }

      try {
        // Get provider
        const provider = await hyperlaneService.getProvider(input.destinationDomain)

        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(input.txHash)
        if (!receipt) {
          return createSuccessResult(
            {
              status: 'pending',
              confirmations: 0
            },
            new Map([
              ['type', input.tokenType],
              ['token', input.token],
              ['recipient', input.recipient],
              ['amount', input.amount]
            ])
          )
        }

        // Check if transaction failed
        if (!receipt.status) {
          return createSuccessResult(
            {
              status: 'failed',
              receipt,
              confirmations: receipt.confirmations,
              error: 'Transaction reverted'
            },
            new Map([
              ['type', input.tokenType],
              ['token', input.token],
              ['recipient', input.recipient],
              ['amount', input.amount]
            ])
          )
        }

        // Get logs for the transaction
        const logs = receipt.logs

        // Verify transfer events
        const isValid = await verifyTransferEvents(logs, input, provider)
        if (!isValid) {
          return createSuccessResult(
            {
              status: 'failed',
              receipt,
              events: logs,
              confirmations: receipt.confirmations,
              error: 'Transfer event validation failed'
            },
            new Map([
              ['type', input.tokenType],
              ['token', input.token],
              ['recipient', input.recipient],
              ['amount', input.amount]
            ])
          )
        }

        // Return successful verification
        return createSuccessResult(
          {
            status: 'confirmed',
            receipt,
            events: logs,
            confirmations: receipt.confirmations
          },
          new Map([
            ['type', input.tokenType],
            ['token', input.token],
            ['recipient', input.recipient],
            ['amount', input.amount]
          ])
        )

      } catch (error) {
        return createErrorResult({
          type: "VERIFICATION_ERROR",
          error: error.message
        })
      }
    }
  }
}
