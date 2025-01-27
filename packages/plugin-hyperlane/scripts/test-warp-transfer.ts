import { ethers } from 'ethers';
import { ServiceType } from '@elizaos/core';
import { createWarpRouteProvider } from '../src/providers/createWarpRouteProvider';
import { HyperlaneService } from '../src/services/HyperlaneService';
import { WarpRouteConfig } from '../src/types/warp';
import { TokenType } from '../src/types/token';

async function main() {
    try {
        // Initialize HyperlaneService
        const hyperlaneService = HyperlaneService.getInstance();
        await hyperlaneService.initialize({
            getService: (type: ServiceType) => {
                if (type === ServiceType.HYPERLANE) {
                    return hyperlaneService;
                }
                return null;
            }
        } as any);

        // Create test token configuration
        const testToken: TokenType = {
            standard: "erc20",
            address: process.env.TOKEN_ADDRESS,
            name: "Test Token",
            symbol: "TEST",
            decimals: 18
        };

        // Create Warp route configuration
        const routeConfig: WarpRouteConfig = {
            type: "collateral",
            token: testToken,
            originChainId: parseInt(process.env.ORIGIN_CHAIN_ID || "1"),
            destinationChainId: parseInt(process.env.DESTINATION_CHAIN_ID || "2"),
            gasLimit: 300000
        };

        // Initialize Warp route provider
        const warpProvider = createWarpRouteProvider({
            get: async () => null,
            set: async () => {},
            delete: async () => {},
            clear: async () => {}
        });

        console.log("Initializing Warp route...");
        const routeId = await warpProvider.initializeRoute(routeConfig);
        console.log(`Route initialized with ID: ${routeId}`);

        // Create transfer parameters
        const transferParams = {
            destination: routeConfig.destinationChainId,
            recipient: process.env.RECIPIENT_ADDRESS || ethers.ZeroAddress,
            tokenAddress: testToken.address,
            amount: "1.0" // 1 token
        };

        console.log("Getting transfer quote...");
        const fee = await hyperlaneService.quoteDispatch({
            destination: transferParams.destination,
            recipient: transferParams.recipient,
            body: ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'uint256'],
                [transferParams.tokenAddress, ethers.parseUnits(transferParams.amount, testToken.decimals)]
            )
        });
        console.log(`Estimated fee: ${ethers.formatEther(fee)} ETH`);

        console.log("Initiating transfer...");
        const result = await hyperlaneService.dispatch({
            destination: transferParams.destination,
            recipient: transferParams.recipient,
            body: ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'uint256'],
                [transferParams.tokenAddress, ethers.parseUnits(transferParams.amount, testToken.decimals)]
            )
        });

        console.log("Transfer initiated!");
        console.log("Transaction Hash:", result.txHash);
        console.log("Message ID:", result.id);
        console.log("Message:", result.message);

    } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main();
