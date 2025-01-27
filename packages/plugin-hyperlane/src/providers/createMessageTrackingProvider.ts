import { Memory } from "@elizaos/core";
import {
    HyperlaneMessage,
    MessageFilter,
    MessageStatus,
} from "../types/message";

export type MessageTrackingProvider = Readonly<{
    // Track a new message
    trackMessage: (message: Readonly<HyperlaneMessage>) => Promise<void>;

    // Update message status
    updateStatus: (
        messageId: string,
        status: MessageStatus,
        metadata?: ReadonlyMap<string, unknown>
    ) => Promise<void>;

    // Get message by ID
    getMessage: (messageId: string) => Promise<HyperlaneMessage | null>;

    // Get message history
    getMessageHistory: (messageId: string) => Promise<
        ReadonlyArray<
            Readonly<{
                status: MessageStatus;
                timestamp: number;
                metadata?: ReadonlyMap<string, unknown>;
            }>
        >
    >;

    // Get message status
    getMessageStatus: (messageId: string) => Promise<MessageStatus>;

    // Verify message authenticity
    verifyMessage: (messageId: string) => Promise<{
        isAuthentic: boolean;
        error?: string;
    }>;

    // Check if message is expired
    isExpired: (messageId: string, ttlMs?: number) => Promise<boolean>;

    // List messages with status
    listMessages: (filter?: Readonly<MessageFilter>) => Promise<
        ReadonlyArray<
            Readonly<{
                message: HyperlaneMessage;
                status: MessageStatus;
                history: ReadonlyArray<
                    Readonly<{
                        status: MessageStatus;
                        timestamp: number;
                        metadata?: ReadonlyMap<string, unknown>;
                    }>
                >;
            }>
        >
    >;
}>;

/**
 * Creates a provider for tracking message status and history
 */
export const createMessageTrackingProvider = (
    memory: Readonly<Memory>
): MessageTrackingProvider => {
    // Pure function to validate message ID
    const validateMessageId = (messageId: string): boolean => {
        // Accept both hex and UUID formats
        const hexPattern = /^0x[0-9a-fA-F]{64}$/;
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        return hexPattern.test(messageId) || uuidPattern.test(messageId);
    };

    // Pure function to validate message status
    const validateStatus = (status: MessageStatus): boolean =>
        ["pending", "delivered", "failed", "relayed"].includes(status);

    // Pure function to create message history entry
    const createHistoryEntry = (
        status: MessageStatus,
        metadata?: ReadonlyMap<string, unknown>
    ): Readonly<{
        status: MessageStatus;
        timestamp: number;
        metadata?: Record<string, unknown>;
    }> =>
        ({
            status,
            timestamp: Date.now(),
            metadata: metadata ? Object.fromEntries(metadata) : undefined,
        }) as const;

    // Pure function to verify message signature
    const verifyMessageSignature = async (message: HyperlaneMessage): Promise<boolean> => {
        // TODO: Implement actual signature verification
        return true;
    };

    // Pure function to check message expiration
    const checkMessageExpiration = (
        timestamp: number,
        ttlMs: number = 24 * 60 * 60 * 1000 // Default 24 hours
    ): boolean => {
        return Date.now() - timestamp > ttlMs;
    };

    return {
        trackMessage: async (message) => {
            // Store message
            await memory.set(
                `message:${message.id}`,
                JSON.stringify(message)
            );

            // Initialize status history
            await memory.set(
                `history:${message.id}`,
                JSON.stringify([createHistoryEntry("pending")])
            );
        },

        updateStatus: async (messageId, status, metadata) => {
            if (!validateMessageId(messageId)) {
                throw new Error(`Invalid message ID: ${messageId}`);
            }

            if (!validateStatus(status)) {
                throw new Error(`Invalid status: ${status}`);
            }

            // Get existing history
            const historyStr = await memory.get(`history:${messageId}`);
            if (!historyStr) {
                throw new Error(`Message ${messageId} not found`);
            }

            const history = JSON.parse(historyStr);

            // Add new status entry with metadata
            history.push(createHistoryEntry(status, metadata));

            // Store updated history
            await memory.set(
                `history:${messageId}`,
                JSON.stringify(history)
            );

            // Update message metadata if provided
            if (metadata) {
                const messageStr = await memory.get(`message:${messageId}`);
                if (messageStr) {
                    const message = JSON.parse(messageStr);
                    message.metadata = Object.fromEntries(metadata);
                    await memory.set(`message:${messageId}`, JSON.stringify(message));
                }
            }
        },

        getMessage: async (messageId) => {
            if (!validateMessageId(messageId)) {
                throw new Error(`Invalid message ID: ${messageId}`);
            }

            const messageStr = await memory.get(`message:${messageId}`);
            if (!messageStr) {
                return null;
            }

            const message = JSON.parse(messageStr);

            // Convert metadata object back to Map if it exists
            if (message.metadata && typeof message.metadata === "object") {
                message.metadata = new Map(Object.entries(message.metadata));
            }

            return message;
        },

        getMessageHistory: async (messageId) => {
            if (!validateMessageId(messageId)) {
                throw new Error(`Invalid message ID: ${messageId}`);
            }

            const historyStr = await memory.get(`history:${messageId}`);
            if (!historyStr) {
                throw new Error("Message not found");
            }

            const history = JSON.parse(historyStr);
            return Object.freeze(
                history.map((entry) => {
                    // Convert metadata object back to Map if it exists
                    const metadata = entry.metadata
                        ? new Map(Object.entries(entry.metadata))
                        : undefined;

                    return Object.freeze({
                        status: entry.status as MessageStatus,
                        timestamp: entry.timestamp,
                        metadata,
                    } as const);
                })
            );
        },

        getMessageStatus: async (messageId) => {
            if (!validateMessageId(messageId)) {
                throw new Error(`Invalid message ID: ${messageId}`);
            }

            const historyStr = await memory.get(`history:${messageId}`);
            if (!historyStr) {
                throw new Error("Message not found");
            }

            const history = JSON.parse(historyStr);
            return history[history.length - 1].status;
        },

        verifyMessage: async (messageId) => {
            const message = await getMessage(messageId);
            if (!message) {
                return { isAuthentic: false, error: "Message not found" };
            }

            try {
                const isAuthentic = await verifyMessageSignature(message);
                return { isAuthentic };
            } catch (error) {
                return {
                    isAuthentic: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                };
            }
        },

        isExpired: async (messageId, ttlMs) => {
            const message = await getMessage(messageId);
            if (!message) {
                throw new Error("Message not found");
            }

            return checkMessageExpiration(message.timestamp, ttlMs);
        },

        listMessages: async (filter) => {
            // Get all message IDs
            const messageIds = await memory.keys("message:*");

            // Get messages and their history
            const messages = await Promise.all(
                messageIds.map(async (key) => {
                    const messageId = key.replace("message:", "");
                    const messageStr = await memory.get(key);
                    const historyStr = await memory.get(
                        `history:${messageId}`
                    );

                    if (!messageStr || !historyStr) {
                        return null;
                    }

                    const message = JSON.parse(messageStr);
                    const history = JSON.parse(historyStr);
                    const status = history[history.length - 1].status;

                    // Apply filters if provided
                    if (filter) {
                        if (filter.status && filter.status !== status)
                            return null;
                        if (filter.origin && filter.origin !== message.origin)
                            return null;
                        if (filter.destination && filter.destination !== message.destination)
                            return null;
                        if (filter.sender && filter.sender !== message.sender)
                            return null;
                        if (
                            filter.recipient &&
                            filter.recipient !== message.recipient
                        )
                            return null;
                        if (
                            filter.fromTimestamp &&
                            message.timestamp < filter.fromTimestamp
                        )
                            return null;
                        if (
                            filter.toTimestamp &&
                            message.timestamp > filter.toTimestamp
                        )
                            return null;
                    }

                    return {
                        message,
                        status,
                        history,
                    } as const;
                })
            );

            return messages.filter(
                (m): m is NonNullable<typeof m> => m !== null
            );
        },
    } as const;
};
