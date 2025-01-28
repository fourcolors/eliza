import { describe, it, expect, vi } from "vitest"
import { createMessageDispatchProvider } from "../createMessageDispatchProvider"
import { type HyperlaneConfig } from "../../types/config"

describe("createMessageDispatchProvider", () => {
  const mockMailbox = {
    dispatch: vi.fn(),
    estimateGas: {
      dispatch: vi.fn(),
    },
  }

  const mockConfig: HyperlaneConfig = {
    getMailbox: vi.fn().mockReturnValue(mockMailbox),
  } as unknown as HyperlaneConfig

  const mockMessage = {
    recipient: "0x123",
    body: "0x456",
  }

  const mockDestinationChain = "optimism"

  it("should dispatch message and return messageId and txHash", async () => {
    const mockTxHash = "0xabc"
    const mockMessageId = "0xdef"
    const mockGasEstimate = BigInt(100000)

    mockMailbox.estimateGas.dispatch.mockResolvedValue(mockGasEstimate)
    mockMailbox.dispatch.mockResolvedValue({
      wait: vi.fn().mockResolvedValue({
        hash: mockTxHash,
        events: [{ args: { messageId: mockMessageId } }],
      }),
    })

    const provider = createMessageDispatchProvider(mockConfig)
    const result = await provider.dispatchMessage({
      message: mockMessage,
      destinationChain: mockDestinationChain,
    })

    expect(mockConfig.getMailbox).toHaveBeenCalledWith(mockDestinationChain)
    expect(mockMailbox.estimateGas.dispatch).toHaveBeenCalledWith(
      mockDestinationChain,
      mockMessage.recipient,
      mockMessage.body
    )
    expect(mockMailbox.dispatch).toHaveBeenCalledWith(
      mockDestinationChain,
      mockMessage.recipient,
      mockMessage.body,
      { gasLimit: mockGasEstimate }
    )
    expect(result).toEqual({
      messageId: mockMessageId,
      txHash: mockTxHash,
    })
  })

  it("should estimate gas for message dispatch", async () => {
    const mockGasEstimate = BigInt(100000)
    mockMailbox.estimateGas.dispatch.mockResolvedValue(mockGasEstimate)

    const provider = createMessageDispatchProvider(mockConfig)
    const result = await provider.estimateGas({
      message: mockMessage,
      destinationChain: mockDestinationChain,
    })

    expect(mockConfig.getMailbox).toHaveBeenCalledWith(mockDestinationChain)
    expect(mockMailbox.estimateGas.dispatch).toHaveBeenCalledWith(
      mockDestinationChain,
      mockMessage.recipient,
      mockMessage.body
    )
    expect(result).toBe(mockGasEstimate)
  })

  it("should handle dispatch failures", async () => {
    const errorMessage = "Transaction failed"
    mockMailbox.dispatch.mockRejectedValue(new Error(errorMessage))
    mockMailbox.estimateGas.dispatch.mockResolvedValue(BigInt(100000))

    const provider = createMessageDispatchProvider(mockConfig)
    await expect(
      provider.dispatchMessage({
        message: mockMessage,
        destinationChain: mockDestinationChain,
      })
    ).rejects.toThrow(errorMessage)
  })

  it("should handle gas estimation failures", async () => {
    const errorMessage = "Gas estimation failed"
    mockMailbox.estimateGas.dispatch.mockRejectedValue(new Error(errorMessage))

    const provider = createMessageDispatchProvider(mockConfig)
    await expect(
      provider.estimateGas({
        message: mockMessage,
        destinationChain: mockDestinationChain,
      })
    ).rejects.toThrow(errorMessage)
  })
})
