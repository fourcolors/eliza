import { describe, it, expect, vi, beforeEach } from "vitest"
import { createSendMessageAction } from "../sendMessage"
import { type HyperlaneService } from "../../types/hyperlane"
import { type IAgentRuntime } from "@elizaos/core"

describe("sendMessage action", () => {
  const mockMessage = {
    id: "0x123",
    sender: "0xabc",
    recipient: "0xdef",
    origin: 1,
    destination: 2,
    body: "0x789",
  }

  const mockService: Partial<HyperlaneService> = {
    dispatch: vi.fn(),
  }

  const mockRuntime = {
    input: {
      message: mockMessage,
      destinationChain: "2",
    },
    services: new Map([["hyperlane", mockService]]),
  } as unknown as IAgentRuntime

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should dispatch message", async () => {
    const mockTxHash = "0xabc"
    mockService.dispatch?.mockResolvedValue({
      id: mockMessage.id,
      txHash: mockTxHash,
      message: mockMessage,
      fee: BigInt(0),
    })

    const action = createSendMessageAction()
    const result = await action.handler(mockRuntime)

    expect(mockService.dispatch).toHaveBeenCalledWith({
      destination: 2,
      recipient: mockMessage.recipient,
      body: mockMessage.body,
    })
    expect(result).toEqual({
      success: true,
      data: {
        messageId: mockMessage.id,
        txHash: mockTxHash,
      },
      metadata: new Map(),
    })
  })

  it("should return error if message is missing", async () => {
    const runtime = {
      input: { destinationChain: "2" },
      services: new Map([["hyperlane", mockService]]),
    } as unknown as IAgentRuntime

    const action = createSendMessageAction()
    const result = await action.handler(runtime)

    expect(result).toEqual({
      success: false,
      error: "message and destinationChain are required",
      metadata: new Map(),
    })
  })

  it("should return error if destinationChain is missing", async () => {
    const runtime = {
      input: { message: mockMessage },
      services: new Map([["hyperlane", mockService]]),
    } as unknown as IAgentRuntime

    const action = createSendMessageAction()
    const result = await action.handler(runtime)

    expect(result).toEqual({
      success: false,
      error: "message and destinationChain are required",
      metadata: new Map(),
    })
  })

  it("should return error if hyperlane service is missing", async () => {
    const runtime = {
      input: { message: mockMessage, destinationChain: "2" },
      services: new Map(),
    } as unknown as IAgentRuntime

    const action = createSendMessageAction()
    const result = await action.handler(runtime)

    expect(result).toEqual({
      success: false,
      error: "hyperlane service is required",
      metadata: new Map(),
    })
  })
})
