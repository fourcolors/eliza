/**
 * /packages/plugin-hyperlane/src/core/validations/validateChainSupport.ts
 *
 * Validates if a chain is supported by the Hyperlane protocol.
 * Checks chain metadata, protocol support, and network configuration.
 */
import { ChainName, MultiProtocolProvider } from "@hyperlane-xyz/sdk";

export type ChainValidationResult = {
    isSupported: boolean;
    errors: string[];
    metadata?: {
        name: string;
        displayName: string;
        protocol?: string;
    };
};

export function validateChainSupport(
    multiProvider: MultiProtocolProvider,
    chainName: ChainName
): ChainValidationResult {
    const errors: string[] = [];
    const metadata = multiProvider.tryGetChainMetadata(chainName);

    if (!metadata) {
        return {
            isSupported: false,
            errors: ["Chain not found in Hyperlane registry"],
        };
    }

    if (!metadata.rpcUrls?.length) {
        errors.push("Chain has no RPC endpoints configured");
    }

    return {
        isSupported: errors.length === 0,
        errors,
        metadata: {
            name: metadata.name,
            displayName: metadata.displayName || metadata.name,
            protocol: multiProvider.tryGetProtocol(chainName),
        },
    };
}
