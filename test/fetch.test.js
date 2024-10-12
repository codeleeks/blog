// describe('extractHeader test', () => {
//   test('3 + 5 = 8', () => {
//     expect(3 + 5).toEqual(8)
//   })
// })

import { extractHeader, fetchPosts } from '../src/fetch'
import fs from 'fs'
import path from 'path'

describe('extractHeader test', () => {
  const file = path.join(__dirname, './extract-test.md')
  const fdr = fs.readFileSync(file, 'utf8', function (err, data) {
    return data
  }).replace(/\r\n/g, '\n')
  
  test('extract title from header', () => {
    expect(extractHeader('summary', fdr)).toEqual(
      'Spring Data ElasticSearch에서 SSL를 적용합니다.'
    )
  })

  test('extract date from header', () => {
    expect(extractHeader('date', fdr)).toEqual('2024-08-05')
  })

  test('extract title-image from header', () => {
    expect(extractHeader('title-image', fdr)).toEqual(
      'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/database/elasticsearch/ElasticSearch%20SSL%20%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0/title.png'
    )
  })
})