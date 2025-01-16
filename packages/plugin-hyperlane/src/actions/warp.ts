/**
 * Actions for managing Hyperlane Warp Routes and asset transfers
 */
import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { parseUnits } from "ethers/lib/utils";

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
    const params = message.content as unknown as {
        amount: string;
        token: string;
        destinationChain: string;
        warpRoute: string;
        recipient: string;
    };

    const hyperlane = (runtime.plugins as any).hyperlane;
    const transferResult = await hyperlane.core.warpService.transfer({
        amount: parseUnits(params.amount, 18),
        token: params.token,
        destination: params.destinationChain,
        warpRoute: params.warpRoute,
        recipient: params.recipient,
    });

    return {
        transferId: transferResult.id,
        status: "initiated",
        details: `Transfer of ${params.amount} ${params.token} initiated to ${params.destinationChain}`,
    };
};

const handleWarpDeploy = async (runtime: IAgentRuntime, message: Memory) => {
    const params = message.content as unknown as {
        token: string;
        sourceChain: string;
        destinationChain: string;
    };

    const hyperlane = (runtime.plugins as any).hyperlane;
    const deployResult = await hyperlane.core.warpService.deployRoute({
        token: params.token,
        source: params.sourceChain,
        destination: params.destinationChain,
    });

    return {
        routeAddress: deployResult.address,
        status: "deployed",
        details: `Warp route deployed for ${params.token} between ${params.sourceChain} and ${params.destinationChain}`,
    };
};

export const warpActions: Action[] = [
    {
        name: "TRANSFER_VIA_WARP",
        description: "Transfer assets using Hyperlane Warp Routes",
        similes: ["transfer tokens", "send assets cross-chain"],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Transfer 100 USDC to optimism using warp route 0x123",
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
        similes: ["create warp route", "setup token bridge"],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Deploy warp route for USDC between ethereum and optimism",
                    },
                },
            ],
        ],
        validate: validateWarpDeploy,
        handler: handleWarpDeploy,
    },
];
