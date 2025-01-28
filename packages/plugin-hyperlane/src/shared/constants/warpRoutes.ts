/**
 * /packages/plugin-hyperlane/src/shared/constants/warpRoutes.ts
 * This file contains the configuration for Hyperlane's Warp Routes.
 *
 * Warp Routes are token bridging configurations that define how tokens can be
 * transferred between different chains using Hyperlane's infrastructure.
 *
 * The configuration consists of:
 * - tokens: An array of token configurations specifying which tokens can be bridged
 * - options: Additional options for customizing the Warp Route behavior
 *
 * This configuration is merged with existing routes in the configured registry.
 * It is typically populated using output from the Hyperlane CLI warp deploy command.
 */
import { WarpCoreConfig } from "@hyperlane-xyz/sdk";

// A list of Warp Route token configs
// These configs will be merged with the warp routes in the configured registry
// The input here is typically the output of the Hyperlane CLI warp deploy command
export const customWarpRouteConfig: WarpCoreConfig = {
    tokens: [],
    options: {},
};
