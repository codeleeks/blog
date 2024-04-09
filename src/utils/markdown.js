import { marked } from 'marked'
export function parseTextFromMarkDown(mdString) {
  const htmlString = marked(mdString)
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')
  const walker = document.createTreeWalker(
    doc,
    NodeFilter.SHOW_TEXT,
    (node) => {
      if (node.parentNode && node.parentNode.nodeName === 'CODE') {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    }
  )

  const textList = []
  let currentNode = walker.currentNode
  while (currentNode) {
    textList.push(currentNode.textContent)
    currentNode = walker.nextNode()
  }

  return textList.join('')
}
