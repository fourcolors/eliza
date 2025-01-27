import { TokenType } from "./token";

/**
 * Represents the type of warp route
 */
export type WarpRouteType = "native" | "collateral" | "synthetic";

/**
 * Configuration for initializing a warp route
 */
export type WarpRouteConfig = Readonly<{
    // Type of warp route
    type: WarpRouteType;
    // Token configuration
    token: TokenType;
    // Origin chain ID
    originChainId: number;
    // Destination chain ID
    destinationChainId: number;
    // Interchain security module address (optional)
    ismAddress?: string;
    // Gas limit for cross-chain operations
    gasLimit?: number;
    // Custom hook for pre/post transfer operations (optional)
    hookAddress?: string;
}>;

/**
 * Status of a warp route
 */
export type WarpRouteStatus = Readonly<{
    // Route identifier
    routeId: string;
    // Current status
    status: "active" | "inactive" | "failed";
    // Last error if any
    error?: string;
    // Gas estimation for transfers
    gasEstimate?: number;
    // Current fee rate
    feeRate?: number;
}>;

/**
 * Provider interface for managing warp routes
 */
export type WarpRouteProvider = Readonly<{
    // Initialize a new warp route
    initializeRoute: (config: WarpRouteConfig) => Promise<string>;

    // Get status of a warp route
    getRouteStatus: (routeId: string) => Promise<WarpRouteStatus>;

    // Estimate gas for a transfer
    estimateGas: (
        routeId: string,
        amount: string,
        recipient: string
    ) => Promise<number>;

    // Calculate transfer fee
    calculateFee: (
        routeId: string,
        amount: string
    ) => Promise<string>;

    // List all routes
    listRoutes: () => Promise<ReadonlyArray<WarpRouteStatus>>;
}>;
