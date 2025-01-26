import { describe, it, expect, vi, beforeEach } from "vitest"
import { createVerifyMessageAction } from "../verifyMessage"
import { type IsmProvider } from "../../providers/createIsmProvider"
import { type IAgentRuntime, type Memory, type Service, ServiceType, type Character, type IMemoryManager, type IRAGKnowledgeManager, type ICacheManager, type State } from "@elizaos/core"
import { ModelProviderName } from "@elizaos/core"

describe("verifyMessage action", () => {
  let mockMessage: {
    id: string
    sender: string
    recipient: string
    origin: number
    destination: number
    body: string
  }

  let mockIsm: IsmProvider
  let mockMemory: Memory
  let mockRuntime: IAgentRuntime

  beforeEach(() => {
    vi.clearAllMocks()

    mockMessage = {
      id: "0x00000000000000000000000000000000000001",
      sender: "0x123",
      recipient: "0x456",
      origin: 1,
      destination: 2,
      body: "0x789",
    }

    mockIsm = {
      verifyMessage: vi.fn(),
      getVerificationGas: vi.fn(),
    }

    mockMemory = {
      id: "00000000-0000-0000-0000-000000000001",
      agentId: "00000000-0000-0000-0000-000000000002",
      userId: "00000000-0000-0000-0000-000000000004",
      roomId: "00000000-0000-0000-0000-000000000003",
      content: {
        text: "Verify message",
        input: {
          messageId: mockMessage.id,
          originChain: "1",
        },
      },
      createdAt: Date.now(),
    }

    mockRuntime = {
      getService: vi.fn().mockImplementation(<T extends Service>(service: ServiceType): T | null => {
        if (service === ServiceType.HYPERLANE) return mockIsm as unknown as T
        return null
      }),
      agentId: "00000000-0000-0000-0000-000000000002",
      serverUrl: "http://localhost",
      databaseAdapter: {} as any,
      token: "test-token",
      modelProvider: ModelProviderName.OPENAI,
      imageModelProvider: ModelProviderName.OPENAI,
      imageVisionModelProvider: ModelProviderName.OPENAI,
      character: {} as Character,
      providers: [],
      actions: [],
      evaluators: [],
      plugins: [],
      messageManager: {} as IMemoryManager,
      descriptionManager: {} as IMemoryManager,
      documentsManager: {} as IMemoryManager,
      knowledgeManager: {} as IMemoryManager,
      ragKnowledgeManager: {} as IRAGKnowledgeManager,
      loreManager: {} as IMemoryManager,
      cacheManager: {} as ICacheManager,
      services: new Map(),
      clients: {},
      initialize: vi.fn().mockResolvedValue(undefined),
      registerMemoryManager: vi.fn(),
      getMemoryManager: vi.fn(),
      registerService: vi.fn(),
      getSetting: vi.fn(),
      getConversationLength: vi.fn().mockReturnValue(0),
      processActions: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(null),
      ensureParticipantExists: vi.fn().mockResolvedValue(undefined),
      ensureUserExists: vi.fn().mockResolvedValue(undefined),
      registerAction: vi.fn(),
      ensureConnection: vi.fn().mockResolvedValue(undefined),
      ensureParticipantInRoom: vi.fn().mockResolvedValue(undefined),
      ensureRoomExists: vi.fn().mockResolvedValue(undefined),
      composeState: vi.fn().mockResolvedValue({} as State),
      updateRecentMessageState: vi.fn().mockResolvedValue({} as State)
    }
  })

  describe("validation", () => {
    it("should validate valid input", async () => {
      const action = createVerifyMessageAction()
      const isValid = await action.validate(mockRuntime, mockMemory)
      expect(isValid).toBe(true)
    })

    it("should reject invalid message ID format", async () => {
      const action = createVerifyMessageAction()
      const invalidMemory = {
        ...mockMemory,
        content: {
          ...mockMemory.content,
          input: {
            ...mockMemory.content.input,
            messageId: "invalid", // Missing 0x prefix
          },
        },
      }
      const isValid = await action.validate(mockRuntime, invalidMemory)
      expect(isValid).toBe(false)
    })

    it("should reject invalid chain ID format", async () => {
      const action = createVerifyMessageAction()
      const invalidMemory = {
        ...mockMemory,
        content: {
          ...mockMemory.content,
          input: {
            ...mockMemory.content.input,
            originChain: "invalid",
          },
        },
      }
      const isValid = await action.validate(mockRuntime, invalidMemory)
      expect(isValid).toBe(false)
    })
  })

  describe("message verification", () => {
    it("should successfully verify message", async () => {
      const mockGasEstimate = BigInt(50000)
      
      vi.mocked(mockIsm.verifyMessage).mockResolvedValue({
        verified: true,
        status: "verified",
      })
      vi.mocked(mockIsm.getVerificationGas).mockResolvedValue(mockGasEstimate)

      const action = createVerifyMessageAction()
      const result = await action.handler(mockRuntime, mockMemory)

      expect(mockIsm.verifyMessage).toHaveBeenCalledWith({
        messageId: mockMessage.id,
        originChain: "1",
      })

      expect(mockIsm.getVerificationGas).toHaveBeenCalledWith({
        messageId: mockMessage.id,
        originChain: "1",
      })

      expect(result).toEqual({
        success: true,
        data: {
          verified: true,
          status: "verified",
          gasEstimate: mockGasEstimate.toString(),
        },
        metadata: new Map(),
      })
    })

    it("should handle unverified message", async () => {
      vi.mocked(mockIsm.verifyMessage).mockResolvedValue({
        verified: false,
        status: "invalid",
      })
      vi.mocked(mockIsm.getVerificationGas).mockResolvedValue(BigInt(50000))

      const action = createVerifyMessageAction()
      const result = await action.handler(mockRuntime, mockMemory)

      expect(result).toEqual({
        success: true,
        data: {
          verified: false,
          status: "invalid",
          gasEstimate: "50000",
        },
        metadata: new Map(),
      })
    })

    it("should handle verification error", async () => {
      vi.mocked(mockIsm.verifyMessage).mockRejectedValue(new Error("Network error"))

      const action = createVerifyMessageAction()
      const result = await action.handler(mockRuntime, mockMemory)

      expect(result).toEqual({
        success: false,
        error: "Verification error: Network error",
        metadata: new Map(),
      })
    })

    it("should handle missing ISM service", async () => {
      const runtimeWithoutIsm = {
        ...mockRuntime,
        getService: vi.fn().mockReturnValue(null),
      }

      const action = createVerifyMessageAction()
      const result = await action.handler(runtimeWithoutIsm, mockMemory)

      expect(result).toEqual({
        success: false,
        error: "Service unavailable: HYPERLANE",
        metadata: new Map(),
      })
    })
  })
})
