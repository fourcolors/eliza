import { describe, it, expect, vi, beforeEach } from "vitest"
import { createGetMessageAction } from "../getMessage"
import { type StorageService } from "../../types/hyperlane"
import { type IAgentRuntime } from "@elizaos/core"

describe("getMessage action", () => {
  const mockMessage = {
    id: "0x123",
    sender: "0xabc",
    recipient: "0xdef",
    origin: 1,
    destination: 2,
    body: "0x789",
  }

  const mockStorage: StorageService = {
    getMessage: vi.fn(),
    getMessageStatus: vi.fn(),
    saveMessage: vi.fn(),
    listMessages: vi.fn(),
  }

  const mockRuntime = {
    input: {
      messageId: mockMessage.id,
    },
    services: new Map([["storage", mockStorage]]),
  } as unknown as IAgentRuntime

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should get message and status", async () => {
    mockStorage.getMessage.mockResolvedValue(mockMessage)
    mockStorage.getMessageStatus.mockResolvedValue("delivered")

    const action = createGetMessageAction()
    const result = await action.handler(mockRuntime)

    expect(mockStorage.getMessage).toHaveBeenCalledWith(mockMessage.id)
    expect(mockStorage.getMessageStatus).toHaveBeenCalledWith(mockMessage.id)
    expect(result).toEqual({
      success: true,
      data: {
        message: mockMessage,
        status: "delivered",
      },
      metadata: new Map(),
    })
  })

  it("should return error if messageId is missing", async () => {
    const runtime = {
      input: {},
      services: new Map([["storage", mockStorage]]),
    } as unknown as IAgentRuntime

    const action = createGetMessageAction()
    const result = await action.handler(runtime)

    expect(result).toEqual({
      success: false,
      error: "messageId is required",
      metadata: new Map(),
    })
  })

  it("should return error if storage service is missing", async () => {
    const runtime = {
      input: { messageId: mockMessage.id },
      services: new Map(),
    } as unknown as IAgentRuntime

    const action = createGetMessageAction()
    const result = await action.handler(runtime)

    expect(result).toEqual({
      success: false,
      error: "storage service is required",
      metadata: new Map(),
    })
  })

  it("should return error if message is not found", async () => {
    mockStorage.getMessage.mockResolvedValue(undefined)

    const action = createGetMessageAction()
    const result = await action.handler(mockRuntime)

    expect(result).toEqual({
      success: false,
      error: `Message ${mockMessage.id} not found`,
      metadata: new Map(),
    })
  })
})
