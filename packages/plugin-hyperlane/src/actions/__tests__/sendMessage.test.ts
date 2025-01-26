import { describe, it, expect, vi, beforeEach } from "vitest"
import { createSendMessageAction } from "../sendMessage"
import { type HyperlaneService } from "../../types/hyperlane"
import { type IAgentRuntime, type Memory, type Service, ServiceType, type Character, type IMemoryManager, type IRAGKnowledgeManager, type ICacheManager, type State } from "@elizaos/core"
import { ModelProviderName } from "@elizaos/core";

describe("sendMessage action", () => {
  const mockMessage = {
    id: "0x00000000000000000000000000000000000001",
    sender: "0x123",
    recipient: "0x456",
    origin: 1,
    destination: 2,
    body: "0x789",
  }

  const mockHyperlane = {
    dispatch: vi.fn(),
    quoteDispatch: vi.fn(),
    getDomains: vi.fn(),
    getProvider: vi.fn(),
  }

  const mockProvider = {
    getBalance: vi.fn(),
  }

  const mockMemory: Memory = {
    id: "00000000-0000-0000-0000-000000000001",
    agentId: "00000000-0000-0000-0000-000000000002",
    userId: "00000000-0000-0000-0000-000000000004",
    roomId: "00000000-0000-0000-0000-000000000003",
    content: {
      text: "Send message",
      input: {
        message: mockMessage,
        destinationChain: "2",
      },
    },
    createdAt: Date.now(),
  }

  const mockRuntime: IAgentRuntime = {
    getService: vi.fn().mockImplementation(<T extends Service>(service: ServiceType): T | null => {
      if (service === ServiceType.HYPERLANE) return mockHyperlane as unknown as T
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

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockHyperlane.getDomains).mockReturnValue([1, 2, 3])
    vi.mocked(mockHyperlane.getProvider).mockReturnValue(mockProvider)
    vi.mocked(mockProvider.getBalance).mockResolvedValue(BigInt(2000000000000000))
  })

  describe("validation", () => {
    it("should validate valid input", async () => {
      const action = createSendMessageAction()
      const isValid = await action.validate(mockRuntime, mockMemory)
      expect(isValid).toBe(true)
    })

    it("should reject invalid chain ID", async () => {
      const action = createSendMessageAction()
      const invalidMemory = {
        ...mockMemory,
        content: {
          ...mockMemory.content,
          input: {
            ...mockMemory.content.input,
            destinationChain: "invalid",
          },
        },
      }
      const isValid = await action.validate(mockRuntime, invalidMemory)
      expect(isValid).toBe(false)
    })

    it("should reject invalid message format", async () => {
      const action = createSendMessageAction()
      const invalidMemory = {
        ...mockMemory,
        content: {
          ...mockMemory.content,
          input: {
            ...mockMemory.content.input,
            message: {
              ...mockMessage,
              id: "invalid", // Missing 0x prefix
            },
          },
        },
      }
      const isValid = await action.validate(mockRuntime, invalidMemory)
      expect(isValid).toBe(false)
    })
  })

  describe("message dispatch", () => {
    it("should successfully dispatch message", async () => {
      const mockFee = BigInt(1000000000000000)
      const mockTxHash = "0xabc"
      
      vi.mocked(mockHyperlane.quoteDispatch).mockResolvedValue(mockFee)
      vi.mocked(mockHyperlane.dispatch).mockResolvedValue({
        id: mockMessage.id,
        txHash: mockTxHash,
        message: mockMessage,
        fee: mockFee,
      })

      const action = createSendMessageAction()
      const result = await action.handler(mockRuntime, mockMemory)

      expect(mockHyperlane.quoteDispatch).toHaveBeenCalledWith({
        destination: 2,
        recipient: mockMessage.recipient,
        body: mockMessage.body,
      })

      expect(mockHyperlane.dispatch).toHaveBeenCalledWith({
        destination: 2,
        recipient: mockMessage.recipient,
        body: mockMessage.body,
      })

      expect(result).toEqual({
        success: true,
        data: {
          messageId: mockMessage.id,
          txHash: mockTxHash,
          fee: mockFee.toString(),
        },
        metadata: new Map(),
      })
    })

    it("should fail if chain is not supported", async () => {
      const invalidMemory = {
        ...mockMemory,
        content: {
          ...mockMemory.content,
          input: {
            ...mockMemory.content.input,
            destinationChain: "999",
          },
        },
      }

      const action = createSendMessageAction()
      const result = await action.handler(mockRuntime, invalidMemory)

      expect(result).toEqual({
        success: false,
        error: "Invalid chain ID: 999",
        metadata: new Map(),
      })
    })

    it("should fail if insufficient funds", async () => {
      const mockFee = BigInt(5000000000000000)
      vi.mocked(mockHyperlane.quoteDispatch).mockResolvedValue(mockFee)
      vi.mocked(mockProvider.getBalance).mockResolvedValue(BigInt(1000000000000000))

      const action = createSendMessageAction()
      const result = await action.handler(mockRuntime, mockMemory)

      expect(result).toEqual({
        success: false,
        error: "Insufficient funds. Required: 5000000000000000",
        metadata: new Map(),
      })
    })

    it("should fail if dispatch throws error", async () => {
      const mockFee = BigInt(1000000000000000)
      vi.mocked(mockHyperlane.quoteDispatch).mockResolvedValue(mockFee)
      vi.mocked(mockHyperlane.dispatch).mockRejectedValue(new Error("Network error"))

      const action = createSendMessageAction()
      const result = await action.handler(mockRuntime, mockMemory)

      expect(result).toEqual({
        success: false,
        error: "Dispatch error: Network error",
        metadata: new Map(),
      })
    })
  })
})
