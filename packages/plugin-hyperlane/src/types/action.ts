/**
 * Pure result type for actions
 */
export type ActionResult<T> = Readonly<{
  success: boolean;
  data?: T;
  error?: string;
  metadata: ReadonlyMap<string, unknown>;
}>;

/**
 * Supported token types
 */
export type TokenType = 'erc20' | 'erc721' | 'erc4626' | 'native';

/**
 * Parameters for token transfer actions
 */
export type TransferParams = Readonly<{
  tokenType: TokenType;
  token: string;
  amount: string;
  recipient: string;
  destinationDomain: number;
  metadata?: ReadonlyMap<string, unknown>;
}>;

/**
 * Parameters for message actions
 */
export type MessageParams = Readonly<{
  destinationDomain: number;
  recipient: string;
  body: string;
  metadata?: ReadonlyMap<string, unknown>;
}>;
