function normalizeUsername(value) {
  return String(value || '').replace(/^@/, '').trim().toLocaleLowerCase()
}

export function readSideChoice(event) {
  const sender = normalizeUsername(event.user?.uniqueId)
  const command = String(event.comment || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
  if (!sender || !['esquerda', 'direita'].includes(command)) return null

  return {
    sender,
    side: command === 'esquerda' ? 'left' : 'right',
    username: String(event.user?.nickname || sender).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 50),
  }
}

export function readRoseGift(event, { sideLeftUsers, sideRightUsers, viewerSideChoices }) {
  const giftName = event.giftDetails?.giftName || event.extendedGiftInfo?.name || event.giftName || ''
  const normalizedGiftName = String(giftName).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase()
  if (!['rose', 'rosa'].includes(normalizedGiftName)) return null

  // Streakable gifts report intermediate repeats; only the final event carries
  // the complete repeatCount and should update the scoreboard.
  if (event.giftDetails?.giftType === 1 && !event.repeatEnd) return null

  const sender = String(event.user?.uniqueId || '').replace(/^@/, '').slice(0, 50)
  const senderKey = normalizeUsername(sender)
  const side = sideLeftUsers.has(senderKey)
    ? 'left'
    : sideRightUsers.has(senderKey)
      ? 'right'
      : viewerSideChoices.get(senderKey) || 'left'

  return {
    side,
    quantity: Math.min(1000, Math.max(1, Math.floor(Number(event.repeatCount) || 1))),
    username: String(event.user?.nickname || sender || 'Alguém').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 50),
    giftName: 'Rose',
    giftId: event.giftId,
    timestamp: Date.now(),
  }
}
