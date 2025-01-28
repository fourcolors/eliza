import { describe, it, expect, vi } from 'vitest'
import { determineMessageStatus, validateStatusTransition } from '../status'
import { HyperlaneService } from '../../types/hyperlane'
import { MessageState } from '../../types/status'

describe('status utils', () => {
  describe('determineMessageStatus', () => {
    const createMockHyperlane = (delivered = false) => {
      return {
        getMailbox: vi.fn().mockResolvedValue({
          delivered: vi.fn().mockResolvedValue(delivered)
        })
      } as unknown as HyperlaneService
    }

    const testMessage: MessageState = {
      id: '0x1234',
      status: 'pending',
      origin: 1,
      destination: 2,
      timestamp: Date.now(),
      metadata: new Map()
    } as const

    it('preserves failed status', async () => {
      const status = await determineMessageStatus({
        ...testMessage,
        status: 'failed'
      })
      expect(status).toBe('failed')
    })

    it('preserves relayed status', async () => {
      const status = await determineMessageStatus({
        ...testMessage,
        status: 'relayed'
      })
      expect(status).toBe('relayed')
    })

    it('checks hyperlane for pending messages', async () => {
      const hyperlane = createMockHyperlane(true)
      const status = await determineMessageStatus(testMessage, hyperlane)
      expect(status).toBe('delivered')
    })

    it('returns failed on hyperlane error', async () => {
      const hyperlane = {
        getMailbox: vi.fn().mockRejectedValue(new Error('Network error'))
      } as unknown as HyperlaneService

      const status = await determineMessageStatus(testMessage, hyperlane)
      expect(status).toBe('failed')
    })
  })

  describe('validateStatusTransition', () => {
    it('allows valid transitions', () => {
      expect(validateStatusTransition('pending', 'delivered')).toBe(true)
      expect(validateStatusTransition('delivered', 'relayed')).toBe(true)
      expect(validateStatusTransition('pending', 'failed')).toBe(true)
      expect(validateStatusTransition('delivered', 'failed')).toBe(true)
    })

    it('prevents invalid transitions', () => {
      expect(validateStatusTransition('failed', 'delivered')).toBe(false)
      expect(validateStatusTransition('relayed', 'delivered')).toBe(false)
      expect(validateStatusTransition('delivered', 'pending')).toBe(false)
    })
  })
})
