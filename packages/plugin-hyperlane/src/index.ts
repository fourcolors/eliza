/**
 * /packages/plugin-hyperlane/src/index.ts
 *
 * Plugin definition for Hyperlane integration.
 * Registers actions and services with the Eliza runtime.
 */

import { HyperlaneService } from "@core/services/HyperlaneService";
import { Plugin } from "@elizaos/core";
import { bridgeAssetAction } from "@features/warp/actions";

export const hyperlanePlugin: Plugin = {
    name: "hyperlane",
    description: "Plugin for interacting with Hyperlane protocol",
    actions: [bridgeAssetAction],
    services: [new HyperlaneService()],
};

export default hyperlanePlugin;
