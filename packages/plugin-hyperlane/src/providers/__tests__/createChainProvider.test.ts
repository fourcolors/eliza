import { describe, it, expect, vi } from 'vitest'
import { createChainProvider } from '../createChainProvider'
import { HyperlaneConfig } from '../../types/config'

describe('createChainProvider', () => {
  const mockConfig: HyperlaneConfig = {
    domains: new Set([1, 2]),
    providers: new Map([
      [1, {} as any],
      [2, {} as any]
    ]),
    mailboxes: new Map([
      [1, '0x1234'],
      [2, '0x5678']
    ]),
    isms: new Map([
      [1, '0xabcd'],
      [2, '0xefgh']
    ]),
    defaultIsm: '0xabcd',
    hooks: new Map(),
    gasConfig: {
      multiplier: 1.1,
      maxPrice: BigInt(100000000000),
      perDomain: new Map()
    }
  }

  it('validates chain config', async () => {
    const provider = createChainProvider(mockConfig)

    const result = await provider.validateChainConfig(3, {
      rpcUrl: 'http://localhost:8545'
    })

    expect(result).toBe(false)
  })

  it('gets chain status', async () => {
    const provider = createChainProvider(mockConfig)

    const status = await provider.getChainStatus(1)

    expect(status).toEqual({
      isDeployed: true,
      mailbox: '0x1234',
      ism: '0xabcd',
      validators: []
    })

    const notDeployed = await provider.getChainStatus(3)

    expect(notDeployed).toEqual({
      isDeployed: false
    })
  })

  it('deploys chain', async () => {
    const provider = createChainProvider(mockConfig)

    await expect(
      provider.deployChain(3, {
        rpcUrl: 'http://localhost:8545',
        deployer: '0x1234',
        ismType: 'multisig',
        validators: ['0x1234', '0x5678']
      })
    ).rejects.toThrow('Not implemented')
  })

  it('updates chain config', async () => {
    const provider = createChainProvider(mockConfig)

    await expect(
      provider.updateChainConfig(1, {
        validators: ['0x1234', '0x5678'],
        gasConfig: {
          multiplier: 1.2,
          maxPrice: BigInt(200000000000)
        }
      })
    ).rejects.toThrow('Not implemented')
  })
})
