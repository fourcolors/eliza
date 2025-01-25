/**
 * Actions for managing Hyperlane Warp Routes and asset transfers
 */
import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { Contract } from "ethers";
import { parseUnits } from "ethers/lib/utils";

const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
];

const validateHyperlaneConfig = async (
    runtime: IAgentRuntime
): Promise<boolean> => {
    const deployerKey = runtime.getSetting("HYPERLANE_DEPLOYER_KEY");
    const originRpc = runtime.getSetting("ORIGIN_RPC");
    const destinationRpc = runtime.getSetting("DESTINATION_RPC");
    const originChainId = runtime.getSetting("ORIGIN_CHAIN_ID");
    const destinationChainId = runtime.getSetting("DESTINATION_CHAIN_ID");

    return (
        typeof deployerKey === "string" &&
        deployerKey.startsWith("0x") &&
        typeof originRpc === "string" &&
        typeof destinationRpc === "string" &&
        typeof originChainId === "string" &&
        typeof destinationChainId === "string"
    );
};

const validateWarpTransfer = async (
    runtime: IAgentRuntime
): Promise<boolean> => {
    const relayerKey = runtime.getSetting("HYPERLANE_RELAYER_KEY");
    return (
        (await validateHyperlaneConfig(runtime)) &&
        typeof relayerKey === "string" &&
        relayerKey.startsWith("0x")
    );
};

const validateWarpDeploy = async (runtime: IAgentRuntime): Promise<boolean> => {
    const validatorKey = runtime.getSetting("HYPERLANE_VALIDATOR_KEY");
    return (
        (await validateHyperlaneConfig(runtime)) &&
        typeof validatorKey === "string" &&
        validatorKey.startsWith("0x")
    );
};

const handleWarpTransfer = async (runtime: IAgentRuntime, message: Memory) => {
    try {
        const params = message.content as unknown as {
            amount: string;
            token: string;
            destinationChain: string;
            warpRoute: string;
            recipient: string;
        };

        const hyperlane = (runtime.plugins as any).hyperlane;
        const provider = hyperlane.core.multiProvider.getProvider(
            params.destinationChain
        );

        // Get token decimals and symbol
        const tokenContract = new Contract(params.token, ERC20_ABI, provider);
        const [decimals, symbol] = await Promise.all([
            tokenContract.decimals(),
            tokenContract.symbol(),
        ]);

        const transferResult = await hyperlane.core.warpService.transfer({
            amount: parseUnits(params.amount, decimals),
            token: params.token,
            destination: params.destinationChain,
            warpRoute: params.warpRoute,
            recipient: params.recipient,
        });

        return {
            transferId: transferResult.id,
            status: "initiated",
            details: `Transfer of ${params.amount} ${symbol} initiated to ${params.destinationChain} via Warp Route ${params.warpRoute}`,
            txHash: transferResult.hash,
        };
    } catch (error: any) {
        console.error("Error in handleWarpTransfer:", error);
        throw new Error(
            `Failed to transfer tokens: ${error?.message || "Unknown error"}`
        );
    }
};

const handleWarpDeploy = async (runtime: IAgentRuntime, message: Memory) => {
    try {
        const params = message.content as unknown as {
            token: string;
            sourceChain: string;
            destinationChain: string;
        };

        const hyperlane = (runtime.plugins as any).hyperlane;
        const provider = hyperlane.core.multiProvider.getProvider(
            params.sourceChain
        );

        // Get token symbol
        const tokenContract = new Contract(params.token, ERC20_ABI, provider);
        const symbol = await tokenContract.symbol();

        const deployResult = await hyperlane.core.warpService.deployRoute({
            token: params.token,
            source: params.sourceChain,
            destination: params.destinationChain,
        });

        return {
            routeAddress: deployResult.address,
            status: "deployed",
            details: `Warp route deployed for ${symbol} (${params.token}) between ${params.sourceChain} and ${params.destinationChain}`,
            txHash: deployResult.hash,
        };
    } catch (error: any) {
        console.error("Error in handleWarpDeploy:", error);
        throw new Error(
            `Failed to deploy Warp Route: ${error?.message || "Unknown error"}`
        );
    }
};

export const warpActions: Action[] = [
    {
        name: "TRANSFER_VIA_WARP",
        description: "Transfer assets using Hyperlane Warp Routes",
        similes: [
            "transfer tokens cross-chain",
            "send assets via warp",
            "bridge tokens using hyperlane",
            "warp transfer",
        ],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Transfer 100 USDC to optimism using warp route 0x123",
                    },
                },
            ],
            [
                {
                    user: "user",
                    content: {
                        text: "Send 5 WETH to arbitrum via warp route 0x456 to recipient 0x789",
                    },
                },
            ],
            [
                {
                    user: "user",
                    content: {
                        text: "Bridge 1000 DAI to base using hyperlane warp route 0xabc",
                    },
                },
            ],
        ],
        validate: validateWarpTransfer,
        handler: handleWarpTransfer,
    },
    {
        name: "DEPLOY_WARP_ROUTE",
        description: "Deploy a new Warp Route for asset transfers",
        similes: [
            "create warp route",
            "setup token bridge",
            "deploy hyperlane bridge",
            "create cross-chain route",
        ],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Deploy warp route for USDC between ethereum and optimism",
                    },
                },
            ],
            [
                {
                    user: "user",
                    content: {
                        text: "Create a hyperlane bridge for WETH from arbitrum to base",
                    },
                },
            ],
        ],
        validate: validateWarpDeploy,
        handler: handleWarpDeploy,
    },
];
