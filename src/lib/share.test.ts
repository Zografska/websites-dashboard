import { describe, expect, it, vi } from 'vitest'
import { reportLink, shareLink } from './share'

const DATA = { url: 'https://example.test/#/firm/F00001', title: 't', text: 'x' }
const abort = () => Object.assign(new Error('closed'), { name: 'AbortError' })

describe('reportLink', () => {
  it('is the firm link only, whatever page the visitor is on', () => {
    expect(reportLink('F00001', { origin: 'https://greenclaims.2d4d.eu', pathname: '/' })).toBe('https://greenclaims.2d4d.eu/#/firm/F00001')
  })
})

describe('shareLink', () => {
  it('uses the share sheet when there is one', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    expect(await shareLink(DATA, { share })).toEqual({ method: 'native', outcome: 'shared' })
    expect(share).toHaveBeenCalledWith(DATA)
  })

  it('reports a closed share sheet as cancelled and copies nothing', async () => {
    const writeText = vi.fn()
    expect(await shareLink(DATA, { share: vi.fn().mockRejectedValue(abort()), clipboard: { writeText } })).toEqual({ method: 'native', outcome: 'cancelled' })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to copying when the share sheet fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    expect(await shareLink(DATA, { share: vi.fn().mockRejectedValue(new Error('NotAllowed')), clipboard: { writeText } })).toEqual({ method: 'copy', outcome: 'copied' })
    expect(writeText).toHaveBeenCalledWith(DATA.url)
  })

  it('copies the link without a share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    expect(await shareLink(DATA, { clipboard: { writeText } })).toEqual({ method: 'copy', outcome: 'copied' })
  })

  it('reports a failed copy', async () => {
    expect(await shareLink(DATA, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })).toEqual({ method: 'copy', outcome: 'failed' })
    expect(await shareLink(DATA, {})).toEqual({ method: 'copy', outcome: 'failed' })
  })
})
