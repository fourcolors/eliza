import { jest } from "@jest/globals";

export const mockContext = {
    plugins: {
        get: jest.fn().mockReturnValue({
            core: {
                messagingService: {
                    dispatch: jest
                        .fn()
                        .mockResolvedValue({
                            id: "0x123",
                            status: "dispatched",
                        }),
                    getMessageStatus: jest.fn().mockResolvedValue("DELIVERED"),
                },
            },
        }),
    },
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
