import test from 'node:test'
import assert from 'node:assert/strict'
import { readRoseGift, readSideChoice } from './gifts.js'

const emptyRouting = () => ({ sideLeftUsers: new Set(), sideRightUsers: new Set(), viewerSideChoices: new Map() })

test('chat commands choose the expected side regardless of case', () => {
  assert.deepEqual(readSideChoice({ user: { uniqueId: '@viewer', nickname: 'Viewer' }, comment: ' DIREITA ' }), {
    sender: 'viewer', side: 'right', username: 'Viewer',
  })
})

test('intermediate rose streak updates are ignored; final repeat count is preserved', () => {
  const routing = emptyRouting()
  routing.viewerSideChoices.set('viewer', 'right')
  const event = { giftDetails: { giftName: 'Rose', giftType: 1 }, repeatCount: 3, user: { uniqueId: 'viewer' } }
  assert.equal(readRoseGift({ ...event, repeatEnd: false }, routing), null)
  const result = readRoseGift({ ...event, repeatEnd: true }, routing)
  assert.equal(result.side, 'right')
  assert.equal(result.quantity, 3)
  assert.equal(result.username, 'viewer')
  assert.equal(result.giftName, 'Rose')
  assert.equal(typeof result.timestamp, 'number')
})

test('configured sender side overrides chat choice and other gifts are ignored', () => {
  const routing = emptyRouting()
  routing.viewerSideChoices.set('viewer', 'right')
  routing.sideLeftUsers.add('viewer')
  assert.equal(readRoseGift({ giftName: 'TikTok', user: { uniqueId: 'viewer' } }, routing), null)
  assert.equal(readRoseGift({ giftName: 'Rosa', user: { uniqueId: 'viewer' } }, routing).side, 'left')
})
