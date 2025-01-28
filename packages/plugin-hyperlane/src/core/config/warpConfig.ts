/**
 * Warp route configurations for token bridging
 * This defines the supported tokens and their routes across different chains
 */
export const warpRouteConfigs = {
    tokens: [
        {
            type: "native",
            domain: "ethereum",
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
            chainName: "ethereum",
            standard: "EvmNative",
            addressOrDenom: null, // null for native tokens
        },
        {
            type: "native",
            domain: "polygon",
            name: "Matic",
            symbol: "MATIC",
            decimals: 18,
            chainName: "polygon",
            standard: "EvmNative",
            addressOrDenom: null, // null for native tokens
        },
    ],
};
