import { Memory } from "@elizaos/core";
import { HyperlaneMessage, MessageStatus } from "../types/message";
import { MessageTrackingProvider } from "./createMessageTrackingProvider";

export type CrossChainCallProvider = Readonly<{
    // Execute a cross-chain function call
    executeCall: (params: Readonly<{
        destination: number;
        contract: string;
        method: string;
        args: ReadonlyArray<unknown>;
        gasLimit?: number;
        value?: bigint;
    }>) => Promise<{
        messageId: string;
        status: MessageStatus;
    }>;

    // Retry a failed cross-chain call
    retryCall: (messageId: string) => Promise<{
        status: MessageStatus;
        retryCount: number;
    }>;

    // Get call execution details
    getCallDetails: (messageId: string) => Promise<Readonly<{
        messageId: string;
        destination: number;
        contract: string;
        method: string;
        args: ReadonlyArray<unknown>;
        status: MessageStatus;
        retryCount: number;
        error?: string;
    }>>;
}>;

/**
 * Creates a provider for handling cross-chain function calls
 */
export const createCrossChainCallProvider = (
    memory: Readonly<Memory>,
    messageTracker: Readonly<MessageTrackingProvider>
): CrossChainCallProvider => {
    // Pure function to encode function call
    const encodeFunctionCall = (
        method: string,
        args: ReadonlyArray<unknown>
    ): string => {
        // TODO: Implement ABI encoding
        return JSON.stringify({ method, args });
    };

    // Pure function to validate contract address
    const validateContract = (contract: string): boolean =>
        /^0x[a-fA-F0-9]{40}$/.test(contract);

    // Pure function to create retry metadata
    const createRetryMetadata = (
        retryCount: number,
        error?: string
    ): ReadonlyMap<string, unknown> =>
        new Map([
            ["retryCount", retryCount],
            ["lastError", error],
            ["lastRetryTime", Date.now()],
        ]);

    return {
        executeCall: async (params) => {
            if (!validateContract(params.contract)) {
                throw new Error(`Invalid contract address: ${params.contract}`);
            }

            // Encode function call
            const callData = encodeFunctionCall(params.method, params.args);

            // Create message
            const message: HyperlaneMessage = {
                id: crypto.randomUUID(),
                sender: await memory.get("account"),
                recipient: params.contract,
                origin: await memory.get("chainId"),
                destination: params.destination,
                body: callData,
                timestamp: Date.now(),
                metadata: new Map([
                    ["type", "crossChainCall"],
                    ["gasLimit", params.gasLimit?.toString() || ""],
                    ["value", params.value?.toString() || ""],
                    ["retryCount", "0"],
                ]),
            };

            // Track message
            await messageTracker.trackMessage(message);

            return {
                messageId: message.id,
                status: "pending",
            };
        },

        retryCall: async (messageId: string) => {
            const message = await messageTracker.getMessage(messageId);
            if (!message) {
                throw new Error("Message not found");
            }

            const status = await messageTracker.getMessageStatus(messageId);
            if (status !== "failed") {
                throw new Error("Cannot retry message that is not failed");
            }

            // Get current retry count from message metadata
            const retryCount = parseInt(message.metadata?.get("retryCount") as string || "0") + 1;

            // Create new metadata preserving existing values and updating retry info
            const newMetadata = new Map(message.metadata || new Map());
            newMetadata.set("retryCount", retryCount.toString());
            newMetadata.set("lastRetryTime", Date.now().toString());

            // Update status with retry metadata
            await messageTracker.updateStatus(messageId, "pending", newMetadata);

            return {
                status: "pending",
                retryCount,
            };
        },

        getCallDetails: async (messageId: string) => {
            const message = await messageTracker.getMessage(messageId);
            if (!message) {
                throw new Error("Message not found");
            }

            const status = await messageTracker.getMessageStatus(messageId);
            const retryCount = parseInt(message.metadata?.get("retryCount") || "0");
            const error = message.metadata?.get("lastError") as string;

            const callData = JSON.parse(message.body);

            return {
                messageId,
                destination: message.destination,
                contract: message.recipient,
                method: callData.method,
                args: callData.args,
                status,
                retryCount,
                error,
            };
        },
    } as const;
};
