import { Action, ServiceType } from '@elizaos/core'
import type { IAgentRuntime } from '@elizaos/core'
import { TransferParams, ActionResult, TokenType } from '../types/action'
import { ethers } from 'ethers'
import { ERC20__factory, ERC721__factory, ERC4626__factory } from '@hyperlane-xyz/core'

// Define specific error types for better error handling
export type TransferError = 
  | { type: "INVALID_INPUT"; details: string }
  | { type: "INVALID_TOKEN"; address: string }
  | { type: "INVALID_AMOUNT"; amount: string }
  | { type: "INSUFFICIENT_BALANCE"; required: string }
  | { type: "TRANSFER_ERROR"; error: string }

// Pure function to validate token address
const isValidAddress = (address: string): boolean => 
  ethers.isAddress(address)

// Pure function to validate amount format
const isValidAmount = (amount: string): boolean => {
  try {
    ethers.parseUnits(amount, 'wei')
    return true
  } catch {
    return false
  }
}

// Pure function to validate input
const validateInput = (input: unknown): input is TransferParams => {
  if (typeof input !== "object" || input === null) return false
  
  const transferInput = input as Partial<TransferParams>
  return typeof transferInput.tokenType === "string" &&
         ['erc20', 'erc721', 'erc4626', 'native'].includes(transferInput.tokenType) &&
         typeof transferInput.token === "string" &&
         isValidAddress(transferInput.token) &&
         typeof transferInput.amount === "string" &&
         isValidAmount(transferInput.amount) &&
         typeof transferInput.recipient === "string" &&
         isValidAddress(transferInput.recipient) &&
         typeof transferInput.destinationDomain === "number" &&
         transferInput.destinationDomain > 0
}

// Pure function to create error result
const createErrorResult = (error: TransferError): ActionResult<string> => ({
  success: false,
  error: error.type === "INVALID_INPUT" 
    ? `Invalid input: ${error.details}`
    : error.type === "INVALID_TOKEN"
    ? `Invalid token address: ${error.address}`
    : error.type === "INVALID_AMOUNT"
    ? `Invalid amount: ${error.amount}`
    : error.type === "INSUFFICIENT_BALANCE"
    ? `Insufficient balance, required: ${error.required}`
    : error.type === "TRANSFER_ERROR"
    ? error.error
    : "Unknown error",
  metadata: new Map([['error_type', error.type]])
})

// Pure function to create success result
const createSuccessResult = (messageId: string, metadata: Map<string, unknown>): ActionResult<string> => ({
  success: true,
  data: messageId,
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

// Pure function to create transfer action
export const createTransferAction = (): Action<TransferParams, string> => {
  return {
    name: 'transferToken',
    execute: async (
      input: unknown,
      runtime: IAgentRuntime
    ): Promise<ActionResult<string>> => {
      // Validate input
      if (!validateInput(input)) {
        return createErrorResult({
          type: "INVALID_INPUT",
          details: "Invalid transfer parameters"
        })
      }

      // Get Hyperlane service
      const hyperlaneService = await runtime.getService(ServiceType.HYPERLANE)
      if (!hyperlaneService) {
        return createErrorResult({
          type: "TRANSFER_ERROR",
          error: "Hyperlane service not found"
        })
      }

      try {
        // Get provider for the destination domain
        const provider = hyperlaneService.getProvider(input.destinationDomain)

        // Create dispatch parameters
        const dispatchParams = {
          destination: input.destinationDomain,
          recipient: input.recipient,
          body: ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint256'],
            [input.tokenAddress || ethers.ZeroAddress, ethers.parseUnits(input.amount, 'wei')]
          )
        }

        // Get quote for the transfer
        const fee = await hyperlaneService.quoteDispatch(dispatchParams)

        // Dispatch the transfer
        const result = await hyperlaneService.dispatch(dispatchParams)

        return createSuccessResult(result.id, new Map([
          ['txHash', result.txHash],
          ['fee', fee.toString()],
          ['message', result.message]
        ]))

      } catch (error) {
        return createErrorResult({
          type: "TRANSFER_ERROR",
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }
}
