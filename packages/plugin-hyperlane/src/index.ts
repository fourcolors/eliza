import { Plugin } from "@elizaos/core";
import { bridgeAssetAction } from "./actions/bridgeAsset";
import { HyperlaneService } from "./services/HyperlaneService";

/**
 * Hyperlane Plugin
 *
 * A plugin for the Eliza platform that enables cross-chain token transfers
 * using the Hyperlane messaging protocol. This plugin provides:
 *
 * - Bridge Asset Action: Transfer tokens between supported chains
 * - Hyperlane Service: Manages cross-chain messaging and token transfers
 */

// Create a singleton instance of HyperlaneService to be shared across the plugin
export const hyperlaneService = new HyperlaneService();

export const hyperlanePlugin: Plugin = {
    name: "hyperlane",
    description: "Plugin for interacting with Hyperlane protocol",
    actions: [bridgeAssetAction],
    services: [hyperlaneService],
};

export default hyperlanePlugin;
