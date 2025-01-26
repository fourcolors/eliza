import { describe, it, expect, vi, beforeEach } from "vitest"
import { createIsmProvider } from "../createIsmProvider"
import { type HyperlaneConfig } from "../../types/config"

describe("createIsmProvider", () => {
  const mockIsm = {
    verify: vi.fn(),
    estimateGas: {
      verify: vi.fn(),
    },
  }

  const mockMailbox = {
    messages: vi.fn(),
  }

  const mockConfig: HyperlaneConfig = {
    getIsm: vi.fn().mockReturnValue(mockIsm),
    getMailbox: vi.fn().mockReturnValue(mockMailbox),
  } as unknown as HyperlaneConfig

  const mockMessageId = "0x123"
  const mockOriginChain = "ethereum"
  const mockMessage = {
    sender: "0xabc",
    recipient: "0xdef",
    body: "0x789",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("verifyMessage", () => {
    it("should verify a valid message", async () => {
      mockMailbox.messages.mockResolvedValue(mockMessage)
      mockIsm.verify.mockResolvedValue(true)

      const provider = createIsmProvider(mockConfig)
      const result = await provider.verifyMessage({
        messageId: mockMessageId,
        originChain: mockOriginChain,
      })

      expect(mockConfig.getIsm).toHaveBeenCalledWith(mockOriginChain)
      expect(mockConfig.getMailbox).toHaveBeenCalledWith(mockOriginChain)
      expect(mockMailbox.messages).toHaveBeenCalledWith(mockMessageId)
      expect(mockIsm.verify).toHaveBeenCalledWith(
        mockOriginChain,
        mockMessage.sender,
        mockMessage.recipient,
        mockMessage.body
      )
      expect(result).toEqual({
        verified: true,
        status: "verified",
      })
    })

    it("should handle non-existent messages", async () => {
      mockMailbox.messages.mockResolvedValue(null)

      const provider = createIsmProvider(mockConfig)
      const result = await provider.verifyMessage({
        messageId: mockMessageId,
        originChain: mockOriginChain,
      })

      expect(result).toEqual({
        verified: false,
        status: "not_found",
      })
    })

    it("should handle invalid messages", async () => {
      mockMailbox.messages.mockResolvedValue(mockMessage)
      mockIsm.verify.mockResolvedValue(false)

      const provider = createIsmProvider(mockConfig)
      const result = await provider.verifyMessage({
        messageId: mockMessageId,
        originChain: mockOriginChain,
      })

      expect(result).toEqual({
        verified: false,
        status: "invalid",
      })
    })

    it("should handle verification failures", async () => {
      mockMailbox.messages.mockResolvedValue(mockMessage)
      mockIsm.verify.mockRejectedValue(new Error("Verification failed"))

      const provider = createIsmProvider(mockConfig)
      const result = await provider.verifyMessage({
        messageId: mockMessageId,
        originChain: mockOriginChain,
      })

      expect(result).toEqual({
        verified: false,
        status: "verification_failed",
      })
    })
  })

  describe("getVerificationGas", () => {
    it("should estimate gas for message verification", async () => {
      const mockGasEstimate = BigInt(100000)
      mockMailbox.messages.mockResolvedValue(mockMessage)
      mockIsm.estimateGas.verify.mockResolvedValue(mockGasEstimate)

      const provider = createIsmProvider(mockConfig)
      const result = await provider.getVerificationGas({
        messageId: mockMessageId,
        originChain: mockOriginChain,
      })

      expect(mockConfig.getIsm).toHaveBeenCalledWith(mockOriginChain)
      expect(mockConfig.getMailbox).toHaveBeenCalledWith(mockOriginChain)
      expect(mockMailbox.messages).toHaveBeenCalledWith(mockMessageId)
      expect(mockIsm.estimateGas.verify).toHaveBeenCalledWith(
        mockOriginChain,
        mockMessage.sender,
        mockMessage.recipient,
        mockMessage.body
      )
      expect(result).toBe(mockGasEstimate)
    })

    it("should throw error for non-existent messages", async () => {
      mockMailbox.messages.mockResolvedValue(null)

      const provider = createIsmProvider(mockConfig)
      await expect(
        provider.getVerificationGas({
          messageId: mockMessageId,
          originChain: mockOriginChain,
        })
      ).rejects.toThrow("Message not found")
    })

    it("should handle gas estimation failures", async () => {
      const errorMessage = "Gas estimation failed"
      mockMailbox.messages.mockResolvedValue(mockMessage)
      mockIsm.estimateGas.verify.mockRejectedValue(new Error(errorMessage))

      const provider = createIsmProvider(mockConfig)
      await expect(
        provider.getVerificationGas({
          messageId: mockMessageId,
          originChain: mockOriginChain,
        })
      ).rejects.toThrow(errorMessage)
    })
  })
})
