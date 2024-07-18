import { test, describe, expect } from 'bun:test'

import { Luuid, luuid_add_hyphens, luuid_parse, luuid_v2 } from './luuid'

describe('v1', () => {
  const luuid = new Luuid()

  test('Should return a luuid v1', async () => {
    const id = await luuid.v1()
    expect(id).toBeString()
  })

  // test('Should not crash when requesting many luuid v1 symultaneously', async () => {
  //   const promises = []
  //   for (let i = 0; i < 100; i++) {
  //     promises.push(luuid.v1())
  //   }

  //   const results = await Promise.all(promises)

  //   for (let i = 0; i < 100; i++) {
  //     const result = results[i]
  //     expect(result).toBeString()
  //     console.log(result)
  //   }
  // })
})


describe('v2', () => {
  test('Should return a luuid v2', async () => {
    const id = await luuid_v2()
    expect(id).toBeString()
  })
})

describe('parse', () => {
  test('Should parse a luuid v1', async () => {
    const luuid = new Luuid()
    const id = await luuid.v1()
    const parsed = JSON.parse(await luuid_parse(id))
    expect(parsed.timestamp).toBeDefined()
    expect(parsed.version).toBeDefined()
  })
})

describe('add_hyphens', () => {
  test('Should add_hyphens to a luuid v1', async () => {
    const luuid = new Luuid()
    const id = await luuid.v1()
    const without_hyphens = id.replaceAll('-', '')
    const with_hyphens = await luuid_add_hyphens(without_hyphens)
    expect(with_hyphens).toEqual(id)
  })
})