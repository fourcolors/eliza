import { describe, it, expect, vi } from "vitest";
import { createCrossChainCallProvider } from "../createCrossChainCallProvider";
import { createMessageTrackingProvider } from "../createMessageTrackingProvider";
import { Memory } from "@elizaos/core";

describe("CrossChainCallProvider", () => {
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

    it("should execute a cross-chain call", async () => {
        const memory = createMockMemory();
        // Set required memory values
        await memory.set("account", "0x1234567890123456789012345678901234567890");
        await memory.set("chainId", "1");

        const messageTracker = createMessageTrackingProvider(memory);
        const provider = createCrossChainCallProvider(memory, messageTracker);

        const result = await provider.executeCall({
            destination: 2,
            contract: "0x1234567890123456789012345678901234567890",
            method: "transfer",
            args: ["0x123", "100"],
            gasLimit: 100000,
        });

        expect(result.messageId).toBeDefined();
        expect(result.status).toBe("pending");

        const details = await provider.getCallDetails(result.messageId);
        expect(details.destination).toBe(2);
        expect(details.contract).toBe("0x1234567890123456789012345678901234567890");
        expect(details.method).toBe("transfer");
        expect(details.args).toEqual(["0x123", "100"]);
        expect(details.status).toBe("pending");
        expect(details.retryCount).toBe(0);
    });

    it("should retry a failed call", async () => {
        const memory = createMockMemory();
        // Set required memory values
        await memory.set("account", "0x1234567890123456789012345678901234567890");
        await memory.set("chainId", "1");

        const messageTracker = createMessageTrackingProvider(memory);
        const provider = createCrossChainCallProvider(memory, messageTracker);

        // Execute initial call
        const { messageId } = await provider.executeCall({
            destination: 2,
            contract: "0x1234567890123456789012345678901234567890",
            method: "transfer",
            args: ["0x123", "100"],
        });

        // Get original message to preserve metadata
        const message = await messageTracker.getMessage(messageId);
        const metadata = new Map(message.metadata);
        metadata.set("lastError", "Transaction reverted");

        // Mark as failed
        await messageTracker.updateStatus(messageId, "failed", metadata);

        // Retry the call
        const retryResult = await provider.retryCall(messageId);
        expect(retryResult.status).toBe("pending");
        expect(retryResult.retryCount).toBe(1);

        // Verify details
        const details = await provider.getCallDetails(messageId);
        expect(details.status).toBe("pending");
        expect(details.retryCount).toBe(1);
    });

    it("should throw error when retrying non-failed call", async () => {
        const memory = createMockMemory();
        // Set required memory values
        await memory.set("account", "0x1234567890123456789012345678901234567890");
        await memory.set("chainId", "1");

        const messageTracker = createMessageTrackingProvider(memory);
        const provider = createCrossChainCallProvider(memory, messageTracker);

        const { messageId } = await provider.executeCall({
            destination: 2,
            contract: "0x1234567890123456789012345678901234567890",
            method: "transfer",
            args: ["0x123", "100"],
        });

        await expect(provider.retryCall(messageId)).rejects.toThrow(
            "Cannot retry message"
        );
    });

    it("should validate contract address", async () => {
        const memory = createMockMemory();
        const messageTracker = createMessageTrackingProvider(memory);
        const provider = createCrossChainCallProvider(memory, messageTracker);

        await expect(
            provider.executeCall({
                destination: 1,
                contract: "invalid-address",
                method: "transfer",
                args: ["0x123", "100"],
            })
        ).rejects.toThrow("Invalid contract address");
    });
});
