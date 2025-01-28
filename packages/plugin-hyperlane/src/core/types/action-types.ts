import { ChainMap } from "@hyperlane-xyz/sdk"

/**
 * Type definitions for Hyperlane actions
 */

export type HyperlaneMessage = {
    originChain: string
    destinationChain: string
    message: string
    gasAmount?: string
}

export type HyperlaneConfig = {
    rpcEndpoints: ChainMap<string>
    privateKey?: string
}
