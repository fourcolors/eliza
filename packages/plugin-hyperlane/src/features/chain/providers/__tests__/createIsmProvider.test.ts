import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createIsmProvider } from "../createIsmProvider"
import { type PluginConfig } from "../../types/config"
import { IInterchainSecurityModule } from "@hyperlane-xyz/core"
import { JsonRpcProvider } from "ethers"

describe("createIsmProvider", () => {
  let mockIsm: IInterchainSecurityModule
  let mockConfig: PluginConfig

  const mockMessageId = "0x123"
  const mockDomain = 1
  const mockMessage = {
    sender: "0xabc",
    recipient: "0xdef",
    body: "0x789",
  }

  beforeEach(() => {
    vi.resetAllMocks()

    mockIsm = {
      verify: vi.fn().mockResolvedValue(true),
      moduleType: vi.fn().mockResolvedValue(1),
    } as unknown as IInterchainSecurityModule

    mockConfig = {
      domains: new Set([mockDomain]),
      providers: new Map([[mockDomain, new JsonRpcProvider()]]),
      mailboxes: new Map([[mockDomain, {} as any]]),
      isms: new Map([[mockDomain, mockIsm]]),
      defaultIsm: mockIsm,
      hooks: new Map(),
      gasConfig: {
        multiplier: 1.1,
        maxPrice: BigInt(100000000000),
        perDomain: new Map()
      }
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("creates a valid ISM provider", () => {
    const provider = createIsmProvider(mockConfig)
    expect(provider).toBeDefined()
    expect(typeof provider.verify).toBe("function")
  })

  it("verifies messages correctly", async () => {
    const provider = createIsmProvider(mockConfig)
    const result = await provider.verify(mockMessageId, mockDomain)
    expect(result).toBe(true)
    expect(mockIsm.verify).toHaveBeenCalledWith(mockMessageId)
  })

  it("handles verification failures", async () => {
    mockIsm.verify = vi.fn().mockResolvedValue(false)
    const provider = createIsmProvider(mockConfig)
    const result = await provider.verify(mockMessageId, mockDomain)
    expect(result).toBe(false)
  })

  it("handles verification errors", async () => {
    mockIsm.verify = vi.fn().mockRejectedValue(new Error("Verification failed"))
    const provider = createIsmProvider(mockConfig)
    await expect(provider.verify(mockMessageId, mockDomain)).rejects.toThrow("Verification failed")
  })

  it("uses domain-specific ISM when available", async () => {
    const domainIsm = {
      verify: vi.fn().mockResolvedValue(true),
      moduleType: vi.fn().mockResolvedValue(1),
    } as unknown as IInterchainSecurityModule

    mockConfig.isms.set(mockDomain, domainIsm)
    
    const provider = createIsmProvider(mockConfig)
    await provider.verify(mockMessageId, mockDomain)
    
    expect(domainIsm.verify).toHaveBeenCalledWith(mockMessageId)
    expect(mockIsm.verify).not.toHaveBeenCalled()
  })

  it("falls back to default ISM when domain-specific not available", async () => {
    mockConfig.isms.delete(mockDomain)
    
    const provider = createIsmProvider(mockConfig)
    await provider.verify(mockMessageId, mockDomain)
    
    expect(mockIsm.verify).toHaveBeenCalledWith(mockMessageId)
  })

  it("throws when no ISM available for domain", async () => {
    mockConfig.isms.delete(mockDomain)
    mockConfig.defaultIsm = undefined as any
    
    const provider = createIsmProvider(mockConfig)
    await expect(provider.verify(mockMessageId, mockDomain)).rejects.toThrow(
      `No ISM available for domain ${mockDomain}`
    )
  })
})
