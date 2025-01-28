/**
 * Chain Metadata Assembly for Hyperlane Cross-Chain Communication
 *
 * This module assembles and configures chain metadata for Hyperlane's cross-chain messaging system.
 * It provides:
 *
 * 1. Chain metadata filtering and enrichment based on configured token routes
 * 2. Custom metadata override handling for chain configurations
 * 3. Chain logo resolution and integration through Hyperlane registry
 *
 * The primary function assembleChainMetadata takes token chain names and registry info
 * as input and produces enriched chain metadata maps for use in the Hyperlane system.
 */

import {
    IRegistry,
    chainMetadata as publishedChainMetadata,
} from "@hyperlane-xyz/registry";
import {
    ChainMap,
    ChainMetadata,
    ChainName,
    mergeChainMetadataMap,
} from "@hyperlane-xyz/sdk";
import { objFilter, objMap, promiseObjAll } from "@hyperlane-xyz/utils";

export async function assembleChainMetadata(
    chainsInTokens: ChainName[],
    registry: IRegistry,
    storeMetadataOverrides?: ChainMap<Partial<ChainMetadata | undefined>>
) {
    // For now, we are not going to worry about getting a config file for a .yml or anything
    // like that.
    let registryChainMetadata: ChainMap<ChainMetadata>;

    // Always using published chain metadat for now
    registryChainMetadata = publishedChainMetadata;

    // Filter out chains that are not in the tokens config
    registryChainMetadata = objFilter(
        registryChainMetadata,
        (c, m): m is ChainMetadata => chainsInTokens.includes(c)
    );

    registryChainMetadata = await promiseObjAll(
        objMap(
            registryChainMetadata,
            async (chainName, metadata): Promise<ChainMetadata> => ({
                ...metadata,
                logoURI:
                    (await registry.getChainLogoUri(chainName)) || undefined,
            })
        )
    );

    const chainMetadata = registryChainMetadata;
    const chainMetadataWithOverrides = mergeChainMetadataMap(
        chainMetadata,
        storeMetadataOverrides
    );
    return { chainMetadata, chainMetadataWithOverrides };
}
