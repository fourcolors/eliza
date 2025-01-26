import { type IAgentRuntime, type Memory } from "@elizaos/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type StorageService, type HyperlaneMessage, type MessageFilter } from "../../types/hyperlane";
import { createGetMessageAction } from "../getMessage";

describe("getMessage action", () => {
    const mockMessage: HyperlaneMessage = {
        id: "0x123",
        sender: "0xabc",
        recipient: "0xdef",
        origin: 1,
        destination: 2,
        body: "0x789",
    };

    const mockStorage: StorageService = {
        saveMessage: vi.fn().mockImplementation(async (message: Readonly<HyperlaneMessage>): Promise<void> => {}),
        getMessage: vi.fn().mockImplementation(async (id: string): Promise<Readonly<HyperlaneMessage> | undefined> => mockMessage),
        listMessages: vi.fn().mockImplementation(async (filter?: Readonly<MessageFilter>): Promise<ReadonlyArray<HyperlaneMessage>> => [mockMessage]),
        getMessageStatus: vi.fn().mockImplementation(async (id: string): Promise<"pending" | "delivered" | "failed"> => "pending")
    };

    const mockMemory: Memory = {
        content: {
            text: "Get message",
            input: {
                messageId: mockMessage.id,
            },
        },
    };

    const mockRuntime: IAgentRuntime = {
        getService: vi.fn((name: string) => {
            if (name === "storage") return mockStorage;
            return undefined;
        }),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should get message and status", async () => {
        vi.mocked(mockStorage.getMessage).mockResolvedValue(mockMessage);
        vi.mocked(mockStorage.getMessageStatus).mockResolvedValue("delivered");

        const action = createGetMessageAction();
        const result = await action.handler(mockRuntime, mockMemory);

        expect(mockStorage.getMessage).toHaveBeenCalledWith(mockMessage.id);
        expect(mockStorage.getMessageStatus).toHaveBeenCalledWith(
            mockMessage.id
        );
        expect(result).toEqual({
            success: true,
            data: {
                message: mockMessage,
                status: "delivered",
            },
            metadata: new Map(),
        });
    });

    it("should validate correctly", async () => {
        const action = createGetMessageAction();
        const result = await action.validate(mockRuntime, mockMemory);
        expect(result).toBe(true);
    });

    it("should return error if message is not found", async () => {
        vi.mocked(mockStorage.getMessage).mockResolvedValue(undefined);

        const action = createGetMessageAction();
        const result = await action.handler(mockRuntime, mockMemory);

        expect(result).toEqual({
            success: false,
            error: `Message ${mockMessage.id} not found`,
            metadata: new Map(),
        });
    });

    it("should fail validation if input is missing", async () => {
        const invalidMemory: Memory = {
            content: {
                input: {},
            },
        };

        const action = createGetMessageAction();
        const result = await action.validate(mockRuntime, invalidMemory);
        expect(result).toBe(false);
    });

    it("should fail validation if storage service is missing", async () => {
        const runtimeWithoutService: IAgentRuntime = {
            getService: vi.fn(() => undefined),
        };

        const action = createGetMessageAction();
        const result = await action.validate(runtimeWithoutService, mockMemory);
        expect(result).toBe(false);
    });
});
