import { ethers } from 'ethers';
import { ActionResult, TransferParams } from '../types/action';

/**
 * Validates token type
 */
export const validateTokenType = (
  params: Readonly<TransferParams>
): Readonly<ActionResult<void>> => {
  const validTypes = new Set(['erc20', 'erc721', 'erc4626', 'native']);
  
  return validTypes.has(params.tokenType)
    ? { success: true, metadata: new Map() } as const
    : {
        success: false,
        error: `Invalid token type: ${params.tokenType}`,
        metadata: new Map([['invalidType', params.tokenType]])
      } as const;
};

/**
 * Validates transfer amount
 */
export const validateAmount = (
  params: Readonly<TransferParams>
): Readonly<ActionResult<void>> => {
  try {
    const amount = ethers.parseUnits(params.amount, 18);
    if (amount <= 0n) {
      throw new Error('Amount must be positive');
    }
    return { success: true, metadata: new Map() } as const;
  } catch (error) {
    return {
      success: false,
      error: `Invalid amount: ${error.message}`,
      metadata: new Map([['invalidAmount', params.amount]])
    } as const;
  }
};

/**
 * Validates recipient address
 */
export const validateRecipient = (
  params: Readonly<TransferParams>
): Readonly<ActionResult<void>> => {
  try {
    ethers.getAddress(params.recipient); // Validates and checksums the address
    return { success: true, metadata: new Map() } as const;
  } catch (error) {
    return {
      success: false,
      error: `Invalid recipient address: ${error.message}`,
      metadata: new Map([['invalidRecipient', params.recipient]])
    } as const;
  }
};

/**
 * Validates domain ID
 */
export const validateDomain = (
  params: Readonly<TransferParams>
): Readonly<ActionResult<void>> => {
  const isValid = Number.isInteger(params.destinationDomain) && params.destinationDomain > 0;
  
  return isValid
    ? { success: true, metadata: new Map() } as const
    : {
        success: false,
        error: `Invalid domain ID: ${params.destinationDomain}`,
        metadata: new Map([['invalidDomain', params.destinationDomain]])
      } as const;
};
