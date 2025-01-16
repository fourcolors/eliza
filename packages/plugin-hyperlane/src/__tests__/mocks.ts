import { vi } from "vitest";

export const mockMessage = {
    id: "0x123",
    type: "function_call",
    body: JSON.stringify({
        functionName: "test",
        args: [],
    }),
    status: "DELIVERED",
};

export const mockContext = {
    plugins: {
        get: vi.fn(),
        hyperlane: {
            core: {
                messagingService: {
                    dispatch: vi.fn().mockResolvedValue({
                        id: "test-id",
                        status: "success",
                    }),
                    getMessageStatus: vi.fn().mockResolvedValue("DELIVERED"),
                },
            },
        },
    },
    registerAction: vi.fn(),
    registerActions: vi.fn(),
    registerProvider: vi.fn(),
};
