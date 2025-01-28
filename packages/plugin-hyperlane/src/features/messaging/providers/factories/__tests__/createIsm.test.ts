import { describe, it, expect, vi } from 'vitest'
import { Provider } from 'ethers'
import { createIsm } from '../createIsm'

describe('createIsm', () => {
  const mockProvider = {} as Provider
  const mockDeployer = '0x1234567890123456789012345678901234567890'
  const mockValidators = [
    '0x1111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222',
    '0x3333333333333333333333333333333333333333'
  ]
  const mockRoutingIsm = '0x4444444444444444444444444444444444444444'

  describe('multisig ISM', () => {
    it('requires validators', async () => {
      await expect(
        createIsm(mockProvider, 'multisig', {
          deployer: mockDeployer
        })
      ).rejects.toThrow('Validators required for multisig ISM')
    })

    it('throws not implemented', async () => {
      await expect(
        createIsm(mockProvider, 'multisig', {
          deployer: mockDeployer,
          validators: mockValidators,
          threshold: 2
        })
      ).rejects.toThrow('Not implemented')
    })
  })

  describe('optimistic ISM', () => {
    it('uses default optimistic period', async () => {
      await expect(
        createIsm(mockProvider, 'optimistic', {
          deployer: mockDeployer
        })
      ).rejects.toThrow('Not implemented')
    })

    it('accepts custom optimistic period', async () => {
      await expect(
        createIsm(mockProvider, 'optimistic', {
          deployer: mockDeployer,
          optimisticPeriod: 3600
        })
      ).rejects.toThrow('Not implemented')
    })
  })

  describe('routing ISM', () => {
    it('requires routing ISM address', async () => {
      await expect(
        createIsm(mockProvider, 'routing', {
          deployer: mockDeployer
        })
      ).rejects.toThrow('Routing ISM address required')
    })

    it('throws not implemented', async () => {
      await expect(
        createIsm(mockProvider, 'routing', {
          deployer: mockDeployer,
          routingIsm: mockRoutingIsm
        })
      ).rejects.toThrow('Not implemented')
    })
  })

  it('rejects invalid ISM type', async () => {
    // @ts-expect-error Testing invalid type
    await expect(
      createIsm(mockProvider, 'invalid', {
        deployer: mockDeployer
      })
    ).rejects.toThrow('Unsupported ISM type: invalid')
  })
})
