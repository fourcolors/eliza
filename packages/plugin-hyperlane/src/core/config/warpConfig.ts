/**
 * /packages/plugin-hyperlane/src/core/config/warpConfig.ts
 *
 * Warp route configuration types and defaults.
 * Defines structure for token bridging paths and supported tokens.
 */

export interface TokenConfig {
    readonly type: "native" | "erc20" | "erc721" | "erc1155";
    readonly domain: string;
    readonly name: string;
    readonly symbol: string;
    readonly decimals: number;
    readonly chainName: string;
    readonly standard: any;
    readonly addressOrDenom: string | null;
}

export interface WarpRouteConfig {
    readonly tokens: ReadonlyArray<TokenConfig>;
    readonly routes: ReadonlyArray<{
        readonly sourceChain: string;
        readonly destinationChain: string;
        readonly token: string;
    }>;
}

/**
 * Default warp route configurations for commonly used tokens
 */
export const defaultWarpRouteConfig: WarpRouteConfig = {
    tokens: [
        {
            type: "native",
            domain: "ethereum",
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
            chainName: "ethereum",
            standard: "native",
            addressOrDenom: null,
        },
        {
            type: "native",
            domain: "polygon",
            name: "Matic",
            symbol: "MATIC",
            decimals: 18,
            chainName: "polygon",
            standard: "native",
            addressOrDenom: null,
        },
    ],
    routes: [
        {
            sourceChain: "ethereum",
            destinationChain: "polygon",
            token: "ETH",
        },
        {
            sourceChain: "polygon",
            destinationChain: "ethereum",
            token: "MATIC",
        },
    ],
};
