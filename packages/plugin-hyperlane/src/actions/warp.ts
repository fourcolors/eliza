/**
 * Actions for managing Hyperlane Warp Routes and asset transfers
 */
import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { HyperlaneCore } from "@hyperlane-xyz/sdk";
import { parseUnits } from "ethers/lib/utils";

interface HyperlanePlugin {
    name: string;
    description: string;
    core: HyperlaneCore;
}

interface WarpTransferParams {
    amount: string;
    token: string;
    destinationChain: string;
    warpRoute: string;
    recipient: string;
}

interface WarpDeployParams {
    token: string;
    sourceChain: string;
    destinationChain: string;
}

const validateHyperlaneConfig = async (
    runtime: IAgentRuntime
): Promise<boolean> => {
    const deployerKey = runtime.getSetting("HYPERLANE_DEPLOYER_KEY");
    const originRpc = runtime.getSetting("ORIGIN_RPC");
    const destinationRpc = runtime.getSetting("DESTINATION_RPC");
    const originChainId = runtime.getSetting("ORIGIN_CHAIN_ID");
    const destinationChainId = runtime.getSetting("DESTINATION_CHAIN_ID");

    if (!deployerKey?.startsWith("0x")) {
        throw new Error("Invalid or missing HYPERLANE_DEPLOYER_KEY");
    }
    if (!originRpc || !destinationRpc) {
        throw new Error("Missing RPC URLs");
    }
    if (!originChainId || !destinationChainId) {
        throw new Error("Missing chain IDs");
    }

    return true;
};

const validateWarpTransfer = async (
    runtime: IAgentRuntime
): Promise<boolean> => {
    const relayerKey = runtime.getSetting("HYPERLANE_RELAYER_KEY");
    if (!relayerKey?.startsWith("0x")) {
        throw new Error("Invalid or missing HYPERLANE_RELAYER_KEY");
    }
    return validateHyperlaneConfig(runtime);
};

const validateWarpDeploy = async (runtime: IAgentRuntime): Promise<boolean> => {
    const validatorKey = runtime.getSetting("HYPERLANE_VALIDATOR_KEY");
    if (!validatorKey?.startsWith("0x")) {
        throw new Error("Invalid or missing HYPERLANE_VALIDATOR_KEY");
    }
    return validateHyperlaneConfig(runtime);
};

const handleWarpTransfer = async (runtime: IAgentRuntime, message: Memory) => {
    const params = message.content as WarpTransferParams;
    const hyperlane = runtime.plugins?.hyperlane as HyperlanePlugin;

    if (!hyperlane?.core) {
        throw new Error("Hyperlane plugin not properly initialized");
    }

    try {
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
    } catch (error) {
        throw new Error(`Warp transfer failed: ${error.message}`);
    }
};

const handleWarpDeploy = async (runtime: IAgentRuntime, message: Memory) => {
    const params = message.content as WarpDeployParams;
    const hyperlane = runtime.plugins?.hyperlane as HyperlanePlugin;

    if (!hyperlane?.core) {
        throw new Error("Hyperlane plugin not properly initialized");
    }

    try {
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
    } catch (error) {
        throw new Error(`Warp route deployment failed: ${error.message}`);
    }
};

export const warpActions: Action[] = [
    {
        name: "TRANSFER_TOKEN",
        description: "Transfer tokens using Hyperlane Warp Routes",
        validate: validateWarpTransfer,
        handler: handleWarpTransfer,
    },
    {
        name: "DEPLOY_WARP_ROUTE",
        description: "Deploy a new Hyperlane Warp Route",
        validate: validateWarpDeploy,
        handler: handleWarpDeploy,
    },
];
