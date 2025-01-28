/**
 * /packages/plugin-hyperlane/src/plugin.ts
 *
 * Plugin definition for Hyperlane integration.
 * Registers actions and services with the Eliza runtime.
 */

import { Plugin } from "@elizaos/core";
import { HyperlaneService } from "@core/services/HyperlaneService";
import { bridgeAssetAction } from "@features/bridge/actions";
import { sendMessageAction } from "@features/messaging/actions";
import { initializeWarpRouteAction } from "@features/warp/actions";
import { getChainStatusAction } from "@features/chain/actions";

// Create a singleton instance of HyperlaneService
export const hyperlaneService = new HyperlaneService();

export const hyperlanePlugin: Plugin = {
    name: "hyperlane",
    description: "Plugin for interacting with Hyperlane protocol",
    actions: [
        bridgeAssetAction,
        sendMessageAction,
        initializeWarpRouteAction,
        getChainStatusAction
    ],
    services: [hyperlaneService],
};

export default hyperlanePlugin;
