/**
 * /packages/plugin-hyperlane/src/shared/validators/createParamsValidator.ts
 *
 * Parameter validation utilities for Hyperlane operations.
 * Provides type-safe validation for configs and messages.
 */

import { ActionResult, TransferParams } from '@core/types';
import {
  validateTokenType,
  validateAmount,
  validateRecipient,
  validateDomain
} from './tokenValidators';

/**
 * Creates a validator for transfer parameters
 */
export const createParamsValidator = () =>
  async (
    params: Readonly<TransferParams>
  ): Promise<Readonly<ActionResult<void>>> => {
    const validations = [
      validateTokenType,
      validateAmount,
      validateRecipient,
      validateDomain
    ].map(v => v(params));

    const errors = (await Promise.all(validations))
      .filter(result => !result.success)
      .map(result => result.error);

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join(', '),
        metadata: new Map([['validationErrors', errors]])
      } as const;
    }

    return { success: true, metadata: new Map() } as const;
  };
