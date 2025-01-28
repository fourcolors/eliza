/**
 * /packages/plugin-hyperlane/src/core/config/warpConfig.ts
 *
 * Warp route configuration types and defaults.
 * Defines structure for token bridging paths and supported tokens.
 */

import { warpRouteConfigs } from "@hyperlane-xyz/registry";
import {
    WarpCoreConfig,
    WarpCoreConfigSchema,
    validateZodResult,
} from "@hyperlane-xyz/sdk";
import { objMerge } from "@hyperlane-xyz/utils";
import { customWarpRouteConfig } from "@shared/constants/warpRoutes";

export function assembleWarpCoreConfig(): WarpCoreConfig {
    const resultTs = WarpCoreConfigSchema.safeParse(customWarpRouteConfig);
    const configTs = validateZodResult(resultTs, "warp core typescript config");

    const filteredWarpRouteConfigs = warpRouteConfigs;

    const configValues = Object.values(filteredWarpRouteConfigs);

    const configTokens = configValues.map((c) => c.tokens).flat();
    const tokens = dedupeTokens([...configTokens, ...configTs.tokens]);

    if (!tokens.length)
        throw new Error(
            "No warp route configs provided. Please check your registry, warp route whitelist, and custom route configs for issues."
        );

    const configOptions = configValues.map((c) => c.options).flat();
    const combinedOptions = [...configOptions, configTs.options];
    const options = combinedOptions.reduce<WarpCoreConfig["options"]>(
        (acc, o) => {
            if (!o || !acc) return acc;
            for (const key of Object.keys(o)) {
                acc[key] = (acc[key] || []).concat(o[key] || []);
            }
            return acc;
        },
        {}
    );

    return { tokens, options };
}

// Separate warp configs may contain duplicate definitions of the same token.
// E.g. an IBC token that gets used for interchain gas in many different routes.
function dedupeTokens(
    tokens: WarpCoreConfig["tokens"]
): WarpCoreConfig["tokens"] {
    const idToToken: Record<string, WarpCoreConfig["tokens"][number]> = {};
    for (const token of tokens) {
        const id = `${token.chainName}|${token.addressOrDenom?.toLowerCase()}`;
        idToToken[id] = objMerge(idToToken[id] || {}, token);
    }
    return Object.values(idToToken);
}
