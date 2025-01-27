/**
 * Token standard types
 */
export type TokenStandard = "erc20" | "erc721" | "native";

/**
 * Token configuration
 */
export type TokenType = Readonly<{
    // Token standard (ERC20, ERC721, or native)
    standard: TokenStandard;
    // Token address (not required for native tokens)
    address?: string;
    // Token name
    name: string;
    // Token symbol
    symbol: string;
    // Token decimals (not required for ERC721)
    decimals?: number;
}>;
