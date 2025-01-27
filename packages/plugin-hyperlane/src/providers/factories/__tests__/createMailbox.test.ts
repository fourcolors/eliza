import { describe, it, expect, vi } from 'vitest'
import { Provider } from 'ethers'
import { createMailbox } from '../createMailbox'

describe('createMailbox', () => {
  const mockProvider = {} as Provider
  const mockDeployer = '0x1234567890123456789012345678901234567890'
  const mockDefaultIsm = '0x1111111111111111111111111111111111111111'

  it('throws not implemented', async () => {
    await expect(
      createMailbox(mockProvider, {
        deployer: mockDeployer,
        domain: 1,
        defaultIsm: mockDefaultIsm
      })
    ).rejects.toThrow('Not implemented')
  })
})
