export function findAllMessageBoxArea(skipped) {
  const startPattern = '///message-box'
  const endPattern = '///'
  let messageBoxes = []

  let s = skipped.indexOf(startPattern)
  if (s > 0) {
    let e = skipped.indexOf(endPattern, s + startPattern.length)
    if (e > 0) {
      e += endPattern.length
      messageBoxes.push({ s, e, str: skipped.slice(s, e) })
      messageBoxes = [
        ...messageBoxes,
        ...findAllMessageBoxArea(skipped.slice(e)),
      ]
    }
  }
  return messageBoxes
}

export function extractLevel(messageBoxArea) {
  const pattern = /(?<=\/{3}message-box\s\-{2}level\=)(?<level>.+)/m
  return messageBoxArea.match(pattern).groups.level
}

export function extractTitle(messageBoxArea) {
  const pattern = /(?<=title\:\s)(?<title>.+)/m
  return messageBoxArea.match(pattern).groups.title
}

export function extractBody(messageBoxArea) {
  const startPattern = 'body:'
  const endPattern = '///'
  let s = messageBoxArea.indexOf(startPattern)
  if (s > 0) {
    s += startPattern.length
    while (messageBoxArea[s] === '\n') s++
    let e = messageBoxArea.indexOf(endPattern, s)
    if (e > 0) {
      return messageBoxArea.slice(s, e)
    }
  }
  return ''
}
