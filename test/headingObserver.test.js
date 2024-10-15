import fs from 'fs'
import path from 'path'
import { postTocObserver } from '../src/headingObserver'

describe('headingObserver test', () => {
  const file = path.join(__dirname, './extract-test.md')
  const fdr = fs
    .readFileSync(file, 'utf8', function (err, data) {
      return data
    })
    .replace(/\r\n/g, '\n')

  test('headingObserver test', () => {
    expect(
      postTocObserver.tableOfContentsFromContents(fdr).some((h) => {
        return h.text === 'batch file'
      })
    ).toBe(false)
  })
})
