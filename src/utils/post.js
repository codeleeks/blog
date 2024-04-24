export function extractTitle(path) {
  let s = -1,
    e = -1
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i] === '/') {
      s = i + 1
      break
    } else if (path[i] === '.') {
      e = i
    }
  }

  if (s > 0 && e > 0) {
    return path.substring(s, e)
  }
}

export function findMetadataArea(contents) {
  if (!contents) {
    return {
      found: false,
    }
  }

  let s = 0
  while (contents[s] === ' ' && s < contents.length) {
    s++
  }

  if (contents[s] !== '-') {
    return {
      found: false,
    }
  }

  s = contents.indexOf('---', s)
  while (contents[s] === '-') {
    s++
  }
  if (contents[s] === '\n') s++

  let e = s
  e = contents.indexOf('---', e)

  if (e === contents.length) {
    return {
      found: false,
    }
  }

  return {
    found: true,
    metadata: contents.slice(s, e),
  }
}

export function extractSummary(contents) {
  const { metadata, found } = findMetadataArea(contents)
  if (!found) {
    return ''
  }

  const key = 'summary:'
  let s = metadata.indexOf(key)
  if (s === -1) {
    return ''
  }
  s += key.length

  while (metadata[s] === ' ') {
    s++
  }

  let e = metadata.indexOf('\n', s)
  return metadata.slice(s, e)
}

export function extractDate(contents) {
  const { metadata, found } = findMetadataArea(contents)
  if (!found) {
    return ''
  }

  const pattern = /(?<=^date\:\s*)[0-9\-]+(?=\s?)/m
  const date = metadata.match(pattern)
  if (date) {
    return date[0]
  }
  return date
}

export function skipMetadata(contents) {
  const {found, metadata} = findMetadataArea(contents)
  if (!found) {
    return contents
  }

  return contents.slice(metadata.length + 8)
}

export function extractTitleImage(contents) {
    const { found, metadata } = findMetadataArea(contents)
    if (!found) {
      return contents
    }

    const pattern = /(?<=title\-image\:\s*\').+(?=\'\s)/m
    const titleImage = metadata.match(pattern)    
    console.log(titleImage)
    if (titleImage) {
      return titleImage[0]
    }

    return titleImage
}