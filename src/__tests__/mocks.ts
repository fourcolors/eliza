export const hyperlane = {
    core: {
        messagingService: {
            dispatch: jest
                .fn()
                .mockResolvedValue({ id: "test-id", status: "success" }),
            getMessageStatus: jest.fn().mockResolvedValue("DELIVERED"),
        },
    },
};
