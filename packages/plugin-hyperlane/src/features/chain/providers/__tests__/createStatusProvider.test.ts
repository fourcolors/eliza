import { describe, it, expect, vi } from 'vitest'
import { createStatusProvider } from '../createStatusProvider'
import { HyperlaneService } from '../../types/hyperlane'

describe('createStatusProvider', () => {
  const createMockHyperlane = (delivered = false) => {
    return {
      getMailbox: vi.fn().mockResolvedValue({
        delivered: vi.fn().mockResolvedValue(delivered)
      })
    } as unknown as HyperlaneService
  }

  it('returns pending status for undelivered message', async () => {
    const hyperlane = createMockHyperlane(false)
    const provider = createStatusProvider(hyperlane)

    const status = await provider('0x1234')
    expect(status).toBe('pending')
  })

  it('returns delivered status for delivered message', async () => {
    const hyperlane = createMockHyperlane(true)
    const provider = createStatusProvider(hyperlane)

    const status = await provider('0x1234')
    expect(status).toBe('delivered')
  })

  it('returns failed status on error', async () => {
    const hyperlane = {
      getMailbox: vi.fn().mockRejectedValue(new Error('Network error'))
    } as unknown as HyperlaneService

    const provider = createStatusProvider(hyperlane)
    const status = await provider('0x1234')
    expect(status).toBe('failed')
  })
})
