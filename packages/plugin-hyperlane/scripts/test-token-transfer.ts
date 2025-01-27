import { ethers } from "ethers";
import { Memory } from "@elizaos/core";
import { createWarpRouteProvider } from "../src/providers/createWarpRouteProvider";
import { WarpRouteConfig } from "../src/types/warp";

// Create a simple memory implementation using Map
function createMemory(): Memory {
    const store = new Map<string, string>();
    return {
        get: async (key: string) => store.get(key),
        set: async (key: string, value: string) => {
            store.set(key, value);
            return true;
        },
        delete: async (key: string) => {
            store.delete(key);
            return true;
        },
        clear: async () => {
            store.clear();
            return true;
        },
        keys: async (pattern?: string) => {
            if (!pattern) return Array.from(store.keys());
            const regex = new RegExp(pattern.replace("*", ".*"));
            return Array.from(store.keys()).filter(key => regex.test(key));
        },
    };
}

async function main() {
    // Setup providers for two test networks (using Sepolia and Mumbai as examples)
    const sepoliaProvider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"
    );
    const mumbaiProvider = new ethers.JsonRpcProvider(
        process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com"
    );

    // Create test wallet using private key
    const wallet = new ethers.Wallet(
        process.env.PRIVATE_KEY || "",
        sepoliaProvider
    );

    console.log("Wallet address:", wallet.address);

    // Initialize providers
    const memory = await createMemory();
    const warpRouteProvider = createWarpRouteProvider(memory);

    // Test native token transfer
    const nativeConfig: WarpRouteConfig = {
        type: "native",
        token: {
            standard: "native",
            name: "Sepolia ETH",
            symbol: "ETH",
            decimals: 18,
        },
        originChainId: 11155111, // Sepolia
        destinationChainId: 80001, // Mumbai
        gasLimit: 100000,
    };

    try {
        // Initialize route
        console.log("Initializing native token route...");
        const nativeRouteId = await warpRouteProvider.initializeRoute(nativeConfig);
        console.log("Native route initialized:", nativeRouteId);

        // Get route status
        const status = await warpRouteProvider.getRouteStatus(nativeRouteId);
        console.log("Route status:", status);

        // Estimate gas for a transfer
        const amount = ethers.parseEther("0.01");
        const recipientAddress = wallet.address; // Send back to same address for testing
        const gasEstimate = await warpRouteProvider.estimateGas(
            nativeRouteId,
            amount.toString(),
            recipientAddress
        );
        console.log("Gas estimate:", gasEstimate);

        // Calculate fee
        const fee = await warpRouteProvider.calculateFee(
            nativeRouteId,
            amount.toString()
        );
        console.log("Transfer fee:", ethers.formatEther(fee), "ETH");

        // List all routes
        const routes = await warpRouteProvider.listRoutes();
        console.log("All routes:", routes);

    } catch (error) {
        console.error("Error:", error);
    }
}

// Run the test
main().catch(console.error);
