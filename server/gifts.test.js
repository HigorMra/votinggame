import test from 'node:test'
import assert from 'node:assert/strict'
import { readRoseGift, readSideChoice } from './gifts.js'

const emptyRouting = () => ({ viewerSideChoices: new Map() })

test('chat commands choose the expected side regardless of case', () => {
  assert.deepEqual(readSideChoice({ user: { uniqueId: '@viewer', nickname: 'Viewer' }, comment: ' DIREITA ' }), {
    sender: 'viewer', side: 'right', username: 'Viewer',
  })
  assert.equal(readSideChoice({ user: { uniqueId: 'viewer' }, comment: ' esquerda ' }).side, 'left')
})

test('the latest left or right chat command selects the matching Rose side', () => {
  const routing = emptyRouting()
  const viewer = { uniqueId: '@viewer', nickname: 'Viewer' }
  const prior = readSideChoice({ user: viewer, comment: 'esquerda' })
  routing.viewerSideChoices.set(prior.sender, prior.side)
  const latest = readSideChoice({ user: viewer, comment: ' DIREITA ' })
  routing.viewerSideChoices.set(latest.sender, latest.side)
  const rose = readRoseGift({ giftName: 'Rose', user: viewer }, routing)
  assert.equal(rose.side, 'right')
  assert.equal(rose.quantity, 1)
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

test('non-Rose gifts are ignored and the latest chat choice routes the Rose', () => {
  const routing = emptyRouting()
  routing.viewerSideChoices.set('viewer', 'right')
  assert.equal(readRoseGift({ giftName: 'TikTok', user: { uniqueId: 'viewer' } }, routing), null)
  assert.equal(readRoseGift({ giftName: 'Rosa', user: { uniqueId: 'viewer' } }, routing).side, 'right')
})

test('rose without a chat side selection is not attributed to either candidate', () => {
  const routing = emptyRouting()
  const event = { giftDetails: { giftName: 'Rose', giftType: 1 }, repeatCount: 1, repeatEnd: true, user: { uniqueId: 'viewer' } }
  assert.equal(readRoseGift(event, routing), null)
})
