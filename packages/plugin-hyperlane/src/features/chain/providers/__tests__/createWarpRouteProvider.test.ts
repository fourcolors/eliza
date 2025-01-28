import { describe, it, expect, vi } from "vitest";
import { createWarpRouteProvider } from "../createWarpRouteProvider";
import { Memory } from "@elizaos/core";
import { WarpRouteConfig } from "../../types/warp";

describe("WarpRouteProvider", () => {
    // Pure function to create mock memory
    const createMockMemory = (): Memory => {
        const store = new Map<string, string>();
        return {
            get: vi.fn(async (key: string) => store.get(key)),
            set: vi.fn(async (key: string, value: string) => {
                store.set(key, value);
                return true;
            }),
            delete: vi.fn(async (key: string) => {
                store.delete(key);
                return true;
            }),
            clear: vi.fn(async () => {
                store.clear();
                return true;
            }),
            keys: vi.fn(async (pattern?: string) => {
                if (!pattern) return Array.from(store.keys());
                const regex = new RegExp(pattern.replace("*", ".*"));
                return Array.from(store.keys()).filter(key => regex.test(key));
            }),
        };
    };

    it("should initialize a native token warp route", async () => {
        const memory = createMockMemory();
        const provider = createWarpRouteProvider(memory);

        const config: WarpRouteConfig = {
            type: "native",
            token: {
                standard: "native",
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
            },
            originChainId: 1,
            destinationChainId: 2,
            gasLimit: 100000,
        };

        const routeId = await provider.initializeRoute(config);
        expect(routeId).toBeDefined();

        const status = await provider.getRouteStatus(routeId);
        expect(status.status).toBe("active");
        expect(status.gasEstimate).toBeGreaterThan(0);
    });

    it("should initialize an ERC20 warp route", async () => {
        const memory = createMockMemory();
        const provider = createWarpRouteProvider(memory);

        const config: WarpRouteConfig = {
            type: "collateral",
            token: {
                standard: "erc20",
                address: "0x1234567890123456789012345678901234567890",
                name: "Test Token",
                symbol: "TEST",
                decimals: 18,
            },
            originChainId: 1,
            destinationChainId: 2,
            gasLimit: 100000,
            ismAddress: "0x2345678901234567890123456789012345678901",
        };

        const routeId = await provider.initializeRoute(config);
        expect(routeId).toBeDefined();

        const status = await provider.getRouteStatus(routeId);
        expect(status.status).toBe("active");
        expect(status.gasEstimate).toBeGreaterThan(0);
    });

    it("should estimate gas for a transfer", async () => {
        const memory = createMockMemory();
        const provider = createWarpRouteProvider(memory);

        const config: WarpRouteConfig = {
            type: "native",
            token: {
                standard: "native",
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
            },
            originChainId: 1,
            destinationChainId: 2,
            gasLimit: 100000,
        };

        const routeId = await provider.initializeRoute(config);
        const gas = await provider.estimateGas(
            routeId,
            "1000000000000000000",
            "0x1234567890123456789012345678901234567890"
        );

        expect(gas).toBeGreaterThan(0);
    });

    it("should calculate fee for a transfer", async () => {
        const memory = createMockMemory();
        const provider = createWarpRouteProvider(memory);

        const config: WarpRouteConfig = {
            type: "native",
            token: {
                standard: "native",
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
            },
            originChainId: 1,
            destinationChainId: 2,
            gasLimit: 100000,
        };

        const routeId = await provider.initializeRoute(config);
        const fee = await provider.calculateFee(routeId, "1000000000000000000");

        expect(fee).toBeDefined();
        expect(BigInt(fee)).toBeGreaterThan(0n);
    });

    it("should list all routes", async () => {
        const memory = createMockMemory();
        const provider = createWarpRouteProvider(memory);

        // Initialize two routes
        const config1: WarpRouteConfig = {
            type: "native",
            token: {
                standard: "native",
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
            },
            originChainId: 1,
            destinationChainId: 2,
            gasLimit: 100000,
        };

        const config2: WarpRouteConfig = {
            type: "collateral",
            token: {
                standard: "erc20",
                address: "0x1234567890123456789012345678901234567890",
                name: "Test Token",
                symbol: "TEST",
                decimals: 18,
            },
            originChainId: 1,
            destinationChainId: 3,
            gasLimit: 100000,
        };

        await provider.initializeRoute(config1);
        await provider.initializeRoute(config2);

        const routes = await provider.listRoutes();
        expect(routes.length).toBe(2);
        expect(routes[0].status).toBe("active");
        expect(routes[1].status).toBe("active");
    });

    it("should validate route configuration", async () => {
        const memory = createMockMemory();
        const provider = createWarpRouteProvider(memory);

        // Invalid chain ID
        const invalidChainConfig: WarpRouteConfig = {
            type: "native",
            token: {
                standard: "native",
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
            },
            originChainId: -1,
            destinationChainId: 2,
            gasLimit: 100000,
        };

        await expect(provider.initializeRoute(invalidChainConfig)).rejects.toThrow(
            "Invalid origin chain ID"
        );

        // Invalid token address
        const invalidAddressConfig: WarpRouteConfig = {
            type: "collateral",
            token: {
                standard: "erc20",
                address: "invalid-address",
                name: "Test Token",
                symbol: "TEST",
                decimals: 18,
            },
            originChainId: 1,
            destinationChainId: 2,
            gasLimit: 100000,
        };

        await expect(provider.initializeRoute(invalidAddressConfig)).rejects.toThrow(
            "Invalid token address"
        );
    });
});
