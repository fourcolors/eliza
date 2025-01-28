import { describe, it, expect } from 'vitest'
import { createConfig } from '../createConfig'
import { ConfigParams } from '../../types/config'
import { JsonRpcProvider } from 'ethers'

describe('createConfig', () => {
  it('creates valid config with minimal params', () => {
    const params: ConfigParams = {
      domains: [1],
      providers: new Map([[1, 'http://localhost:8545']]),
      mailboxes: new Map([[1, '0x123']]),
      isms: new Map([[1, '0x456']]),
      defaultIsm: '0x789'
    }

    const config = createConfig(params)

    expect(config.domains).toBeInstanceOf(Set)
    expect(config.domains.size).toBe(1)
    expect(config.domains.has(1)).toBe(true)

    expect(config.providers).toBeInstanceOf(Map)
    expect(config.providers.size).toBe(1)
    expect(config.providers.get(1)).toBeInstanceOf(JsonRpcProvider)

    expect(config.mailboxes).toBeInstanceOf(Map)
    expect(config.mailboxes.size).toBe(1)
    expect(config.mailboxes.has(1)).toBe(true)

    expect(config.isms).toBeInstanceOf(Map)
    expect(config.isms.size).toBe(1)
    expect(config.isms.has(1)).toBe(true)

    expect(config.defaultIsm).toBeDefined()
  })

  it('creates valid config with all params', () => {
    const params: ConfigParams = {
      domains: [1, 2],
      providers: new Map([
        [1, 'http://localhost:8545'],
        [2, 'http://localhost:8546']
      ]),
      mailboxes: new Map([
        [1, '0x123'],
        [2, '0x456']
      ]),
      isms: new Map([
        [1, '0x789'],
        [2, '0xabc']
      ]),
      defaultIsm: '0xdef',
      hooks: new Map([
        ['beforeDispatch', () => {}],
        ['afterDispatch', () => {}]
      ]),
      gasConfig: {
        multiplier: 1.5,
        maxPrice: BigInt(200000000000),
        perDomain: new Map([
          [1, { multiplier: 1.2, maxPrice: BigInt(150000000000) }],
          [2, { multiplier: 1.3, maxPrice: BigInt(180000000000) }]
        ])
      }
    }

    const config = createConfig(params)

    expect(config.domains).toBeInstanceOf(Set)
    expect(config.domains.size).toBe(2)
    expect(config.domains.has(1)).toBe(true)
    expect(config.domains.has(2)).toBe(true)

    expect(config.providers).toBeInstanceOf(Map)
    expect(config.providers.size).toBe(2)
    expect(config.providers.get(1)).toBeInstanceOf(JsonRpcProvider)
    expect(config.providers.get(2)).toBeInstanceOf(JsonRpcProvider)

    expect(config.mailboxes).toBeInstanceOf(Map)
    expect(config.mailboxes.size).toBe(2)
    expect(config.mailboxes.has(1)).toBe(true)
    expect(config.mailboxes.has(2)).toBe(true)

    expect(config.isms).toBeInstanceOf(Map)
    expect(config.isms.size).toBe(2)
    expect(config.isms.has(1)).toBe(true)
    expect(config.isms.has(2)).toBe(true)

    expect(config.defaultIsm).toBeDefined()
    expect(config.hooks).toBeInstanceOf(Map)
    expect(config.hooks.size).toBe(2)

    expect(config.gasConfig).toBeDefined()
    expect(config.gasConfig.multiplier).toBe(1.5)
    expect(config.gasConfig.maxPrice).toBe(BigInt(200000000000))
    expect(config.gasConfig.perDomain).toBeInstanceOf(Map)
    expect(config.gasConfig.perDomain.size).toBe(2)
  })

  it('validates required fields', () => {
    const params: Partial<ConfigParams> = {}

    expect(() => createConfig(params as ConfigParams)).toThrow('At least one domain must be specified')

    params.domains = [1]
    expect(() => createConfig(params as ConfigParams)).toThrow('At least one provider must be specified')

    params.providers = new Map([[1, 'http://localhost:8545']])
    expect(() => createConfig(params as ConfigParams)).toThrow('At least one mailbox must be specified')

    params.mailboxes = new Map([[1, '0x123']])
    expect(() => createConfig(params as ConfigParams)).toThrow('At least one ISM must be specified')

    params.isms = new Map([[1, '0x456']])
    expect(() => createConfig(params as ConfigParams)).toThrow('Default ISM address must be specified')
  })

  it('validates gas config', () => {
    const baseParams: ConfigParams = {
      domains: [1],
      providers: new Map([[1, 'http://localhost:8545']]),
      mailboxes: new Map([[1, '0x123']]),
      isms: new Map([[1, '0x456']]),
      defaultIsm: '0x789'
    }

    expect(() =>
      createConfig({
        ...baseParams,
        gasConfig: {
          multiplier: 0
        }
      })
    ).toThrow('Gas multiplier must be greater than 0')

    expect(() =>
      createConfig({
        ...baseParams,
        gasConfig: {
          maxPrice: BigInt(0)
        }
      })
    ).toThrow('Max gas price must be greater than 0')

    expect(() =>
      createConfig({
        ...baseParams,
        gasConfig: {
          perDomain: new Map([[1, { multiplier: 0 }]])
        }
      })
    ).toThrow('Invalid gas multiplier for domain 1')

    expect(() =>
      createConfig({
        ...baseParams,
        gasConfig: {
          perDomain: new Map([[1, { maxPrice: BigInt(0) }]])
        }
      })
    ).toThrow('Invalid max gas price for domain 1')
  })
})
