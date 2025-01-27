import { Memory } from "@elizaos/core";
import { WarpRouteConfig, WarpRouteProvider, WarpRouteStatus } from "../types/warp";
import { TokenStandard } from "../types/token";

/**
 * Creates a provider for managing Hyperlane Warp Routes
 */
export const createWarpRouteProvider = (
    memory: Readonly<Memory>
): WarpRouteProvider => {
    // Pure function to validate chain ID
    const validateChainId = (chainId: number): boolean => {
        return chainId > 0;
    };

    // Pure function to validate token standard
    const validateTokenStandard = (standard: TokenStandard): boolean => {
        return ["erc20", "erc721", "native"].includes(standard);
    };

    // Pure function to validate address
    const validateAddress = (address: string): boolean => {
        return /^0x[0-9a-fA-F]{40}$/.test(address);
    };

    // Pure function to validate route configuration
    const validateRouteConfig = (config: WarpRouteConfig): void => {
        if (!validateChainId(config.originChainId)) {
            throw new Error(`Invalid origin chain ID: ${config.originChainId}`);
        }

        if (!validateChainId(config.destinationChainId)) {
            throw new Error(`Invalid destination chain ID: ${config.destinationChainId}`);
        }

        if (!validateTokenStandard(config.token.standard)) {
            throw new Error(`Invalid token standard: ${config.token.standard}`);
        }

        if (config.token.standard !== "native" && !config.token.address) {
            throw new Error("Token address required for non-native tokens");
        }

        if (config.token.address && !validateAddress(config.token.address)) {
            throw new Error(`Invalid token address: ${config.token.address}`);
        }

        if (config.ismAddress && !validateAddress(config.ismAddress)) {
            throw new Error(`Invalid ISM address: ${config.ismAddress}`);
        }

        if (config.hookAddress && !validateAddress(config.hookAddress)) {
            throw new Error(`Invalid hook address: ${config.hookAddress}`);
        }
    };

    // Pure function to create route ID
    const createRouteId = (config: WarpRouteConfig): string => {
        return `${config.originChainId}-${config.destinationChainId}-${
            config.token.address || "native"
        }`;
    };

    // Pure function to calculate base gas
    const calculateBaseGas = (config: WarpRouteConfig): number => {
        // Base gas costs from Hyperlane documentation
        const BASE_GAS = 21000;
        const TOKEN_TRANSFER_GAS = 65000;
        const ISM_GAS = 50000;
        const HOOK_GAS = 30000;

        let gas = BASE_GAS + TOKEN_TRANSFER_GAS;

        if (config.ismAddress) {
            gas += ISM_GAS;
        }

        if (config.hookAddress) {
            gas += HOOK_GAS;
        }

        return gas;
    };

    return {
        initializeRoute: async (config) => {
            validateRouteConfig(config);

            const routeId = createRouteId(config);
            const baseGas = calculateBaseGas(config);

            // Store route configuration
            await memory.set(
                `route:${routeId}`,
                JSON.stringify({
                    ...config,
                    baseGas,
                    status: "active",
                    createdAt: Date.now(),
                })
            );

            return routeId;
        },

        getRouteStatus: async (routeId) => {
            const routeStr = await memory.get(`route:${routeId}`);
            if (!routeStr) {
                throw new Error(`Route not found: ${routeId}`);
            }

            const route = JSON.parse(routeStr);
            return {
                routeId,
                status: route.status,
                error: route.error,
                gasEstimate: route.baseGas,
                feeRate: route.feeRate,
            };
        },

        estimateGas: async (routeId, amount, recipient) => {
            if (!validateAddress(recipient)) {
                throw new Error(`Invalid recipient address: ${recipient}`);
            }

            const routeStr = await memory.get(`route:${routeId}`);
            if (!routeStr) {
                throw new Error(`Route not found: ${routeId}`);
            }

            const route = JSON.parse(routeStr);
            const baseGas = route.baseGas;

            // Add gas for amount size
            const amountGas = Math.ceil(amount.length * 68);

            return baseGas + amountGas;
        },

        calculateFee: async (routeId, amount) => {
            const routeStr = await memory.get(`route:${routeId}`);
            if (!routeStr) {
                throw new Error(`Route not found: ${routeId}`);
            }

            const route = JSON.parse(routeStr);
            const feeRate = route.feeRate || 0.001; // Default 0.1% fee

            // Calculate fee based on amount and fee rate
            const fee = BigInt(amount) * BigInt(Math.floor(feeRate * 1000)) / BigInt(1000);
            return fee.toString();
        },

        listRoutes: async () => {
            const routes: WarpRouteStatus[] = [];
            const keys = await memory.keys("route:*");

            for (const key of keys) {
                const routeStr = await memory.get(key);
                if (routeStr) {
                    const route = JSON.parse(routeStr);
                    routes.push({
                        routeId: key.replace("route:", ""),
                        status: route.status,
                        error: route.error,
                        gasEstimate: route.baseGas,
                        feeRate: route.feeRate,
                    });
                }
            }

            return routes;
        },
    };
};
