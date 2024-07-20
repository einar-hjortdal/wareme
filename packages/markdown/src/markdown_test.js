import { test, describe, expect } from 'bun:test'

import { parse } from './markdown'

describe('parse', () => {
  test('Should parse the README.md', async () => {
    const readme_path = `${import.meta.dirname}/../README.md`
    const output_path = await parse(readme_path)
    const output_file = Bun.file(output_path)
    const file_exists = await output_file.exists()
    expect(file_exists).toBeTrue()
  })
})
