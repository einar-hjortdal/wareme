import { test, describe, expect } from 'bun:test'

import { parse, parseTo } from './markdown'

describe('parse', () => {
  test('Should parse the README.md', async () => {
    const readmePath = `${import.meta.dirname}/../README.md`
    const outputPath = await parse(readmePath)
    const outputFile = Bun.file(outputPath)
    const fileExists = await outputFile.exists()
    expect(fileExists).toBeTrue()
  })
})

describe('parseTo', () => {
  test('Should parse the README.md', async () => {
    const readmePath = `${import.meta.dirname}/../README.md`
    const desiredOutputPath = `${import.meta.dirname}/README_HTML`
    const outputPath = await parseTo(readmePath, desiredOutputPath)
    const outputFile = Bun.file(outputPath)
    const fileExists = await outputFile.exists()
    expect(fileExists).toBeTrue()
  })
})