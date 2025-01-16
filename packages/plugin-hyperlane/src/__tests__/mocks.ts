import { jest } from "@jest/globals";

const hyperlane = {
    core: {
        messagingService: {
            dispatch: jest
                .fn()
                .mockImplementation(() =>
                    Promise.resolve({ id: "test-id", status: "success" })
                ),
            getMessageStatus: jest
                .fn()
                .mockImplementation(() => Promise.resolve("DELIVERED")),
        },
    },
};

export const mockContext = {
    plugins: {
        get: jest.fn(),
        hyperlane,
    },
    registerAction: jest.fn(),
    registerActions: jest.fn(),
    registerProvider: jest.fn(),
};

export const mockMessage = {
    id: "0x123",
    type: "function_call",
    body: JSON.stringify({
        functionName: "test",
        args: [],
    }),
    status: "DELIVERED",
};
