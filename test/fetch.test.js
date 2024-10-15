// describe('extractHeader test', () => {
//   test('3 + 5 = 8', () => {
//     expect(3 + 5).toEqual(8)
//   })
// })

import fs from 'fs'
import path from 'path'
import { extractHeader, removeHeaderFromContents } from '../src/fetch'

describe('extractHeader test', () => {
  const file = path.join(__dirname, './extract-test.md')
  const fdr = fs
    .readFileSync(file, 'utf8', function (err, data) {
      return data
    })
    .replace(/\r\n/g, '\n')

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

describe('removeHeaderFromContents test', () => {
  const file = path.join(__dirname, './extract-test.md')
  const fdr = fs
    .readFileSync(file, 'utf8', function (err, data) {
      return data
    })
    .replace(/\r\n/g, '\n')

  const file2 = path.join(__dirname, './extract-test-without-header.md')
  const fdr2 = fs
    .readFileSync(file2, 'utf8', function (err, data) {
      return data
    })
    .replace(/\r\n/g, '\n')

  test('remove header from contents', () => {
    expect(removeHeaderFromContents(fdr)).toEqual(fdr2)
  })
})
