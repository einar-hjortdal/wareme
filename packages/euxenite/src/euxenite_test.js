import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { rm } from 'bun:fs/promises'
import { keys } from '@dark-engine/core'

import {
  loadCatalog,
  lockCatalog,
  privateDirectory,
  catalogLockFileName,
  locked,
  unlockCatalog,
  unlocked,
  getCatalogVersionFromFile,
  updateCatalogVersionFile,
  updateCatalog,
  catalogFileName,
  createPasswordHash,
  verifyPassword,
  createSignature,
  isValidSignature,
  getSessionsFromFile,
  getSessionFromFile,
  getNewSessionExpirationDate,
  saveSession,
  sessionFileName,
  deleteSession,
  createSession,
  loadSession,
  createCookieValue,
  createCookie,
  sessionDurationInSeconds
} from './euxenite'

const cleanup = async () => await rm(privateDirectory, { recursive: true, force: true })

const sampleCatalog = {
  admin: {
    email: 'info@coachonko.com',
    passwordHash: ''
  },
  files: {
    'some-data': {}
  }
}
const updatedCatalog = { ...sampleCatalog, admin: { email: 'new_email@coachonko.com' } }

describe('euxenite', () => {
  beforeEach(async () => { await cleanup() })
  afterEach(async () => { await cleanup() })

  describe('loadCatalog', () => {
    test('Should return null when file is missing', async () => {
      expect(await loadCatalog()).toBe(null)
    })
  })

  describe('lockCatalog', () => {
    test('Should create a lock file and write a lock flag when file is missing', async () => {
      await lockCatalog()
      const lockFile = Bun.file(catalogLockFileName)
      const lockFileContent = await lockFile.text()
      expect(lockFileContent).toBe(locked)
    })

    test('Should throw an error if the lock file is already locked', async () => {
      await lockCatalog() // creates lock file and locks it
      expect(lockCatalog()).rejects.toThrow()
    })
  })

  describe('unlockCatalog', () => {
    test('Should unlock a locked file', async () => {
      await lockCatalog() // creates lock file and locks it
      await unlockCatalog() // writes an unlocked flag
      const lockFile = Bun.file(catalogLockFileName)
      const lockFileContent = await lockFile.text()
      expect(lockFileContent).toBe(unlocked)
    })
  })

  describe('lockCatalog and unlockCatalog', () => {
    test('Should lock an unlocked lock file', async () => {
      await lockCatalog()
      await unlockCatalog()
      await lockCatalog() // locks it again
      const lockFile = Bun.file(catalogLockFileName)
      const lockFileContent = await lockFile.text()
      expect(lockFileContent).toBe(locked)
    })
  })

  // lazily test together getCatalogVersion getCatalogVersionFromFile updateCatalogVersionFile
  describe('getCatalogVersionFromFile', () => {
    test('Should return null when the version file does not exist', async () => {
      expect(await getCatalogVersionFromFile()).toBeNull()
    })

    test('Should return the content of the version file when it exists', async () => {
      const version = crypto.randomUUID()
      await updateCatalogVersionFile(version)
      const versionFileContent = await getCatalogVersionFromFile()
      expect(versionFileContent).toEqual(version)
    })
  })

  describe('updateCatalog', () => {
    test('Should create the catalog file and version file if missing', async () => {
      const fileVersion = await getCatalogVersionFromFile()
      expect(fileVersion).toBeNull()

      await updateCatalog(sampleCatalog, fileVersion)
      const catalogFile = Bun.file(catalogFileName)
      const catalogFileContent = await catalogFile.json()
      expect(catalogFileContent).toEqual(sampleCatalog)
    })

    test('Should update the catalog file and version file', async () => {
      await updateCatalog(sampleCatalog, null)

      const versionFromFile = await getCatalogVersionFromFile()
      expect(versionFromFile).not.toBeNull()

      await updateCatalog(updatedCatalog, versionFromFile)
      const updatedVersionFromFile = await getCatalogVersionFromFile()
      const updatedCatalogFromFile = await loadCatalog()
      expect(updatedVersionFromFile).not.toEqual(versionFromFile)
      expect(updatedCatalogFromFile).toEqual(updatedCatalog)
    })

    test('Should throw an error if versions do not match', async () => {
      await updateCatalog(sampleCatalog, null)
      expect(updateCatalog(updatedCatalog, 'someOldVersion')).rejects.toThrow()
    })
  })

  describe('createPasswordHash', () => {
    test('Should return a password hash from a string', async () => {
      const password = 'secret password'
      const passwordHash = await createPasswordHash(password)
      expect(passwordHash).toBeString()
    })
  })

  describe('verifyPassword', () => {
    test('Should return true if password matches stored hash', async () => {
      const password = 'secret password'
      const passwordHash = await createPasswordHash(password)
      const isMatch = await verifyPassword(password, passwordHash)
      expect(isMatch).toBeTrue()
    })
  })

  describe('createSignature', () => {
    test('Should return a signature from a string', () => {
      const sessionId = crypto.randomUUID()
      const signature = createSignature(sessionId)
      expect(signature).toBeString()
    })
  })

  describe('isValidSignature', () => {
    test('Should return true if signature matches the expected secret', () => {
      const sessionId = crypto.randomUUID()
      const signature = createSignature(sessionId)
      const isValid = isValidSignature(sessionId, signature)
      expect(isValid).toBeTrue()
    })
  })

  describe('sessions', () => {
    test('getSessionsFromFile should return null if the sessions file does not exist', async () => {
      const sessions = await getSessionsFromFile()
      expect(sessions).toBeNull()
    })

    test('getSessionFromFile should return null if the sessions file does not exist', async () => {
      const session = await getSessionFromFile()
      expect(session).toBeNull()
    })

    test('saveSession should save the session data to the sessions file', async () => {
      const sessionId = crypto.randomUUID()
      const expires = getNewSessionExpirationDate()
      const sessionData = { sessionId, expires }
      await saveSession(sessionData)
      const sessionFile = Bun.file(sessionFileName)
      const sessionFileContent = await sessionFile.json()
      // parse date before compare, usually handled by getSessionFromFile
      sessionFileContent[sessionId].expires = new Date(sessionFileContent[sessionId].expires)
      expect(sessionFileContent[sessionId]).toEqual(sessionData)
    })

    test('getSessionsFromFile should return all sessions stored the sessions file', async () => {
      for (let i = 0, j = 10; i < j; i++) {
        const sessionId = crypto.randomUUID()
        const expires = getNewSessionExpirationDate()
        const sessionData = { sessionId, expires }
        await saveSession(sessionData)
      }
      const sessions = await getSessionsFromFile()
      expect(keys(sessions).length).toBe(10)
    })

    test('getSessionFromFile should return the saved session object', async () => {
      const sessionId = crypto.randomUUID()
      const expires = getNewSessionExpirationDate()
      const sessionData = { sessionId, expires }
      await saveSession(sessionData)
      const loadedSession = await getSessionFromFile(sessionId)
      expect(loadedSession).toEqual(sessionData)
    })

    test('deleteSession should remove a session from the sessions file', async () => {
      const sessionId = crypto.randomUUID()
      const expires = getNewSessionExpirationDate()
      const sessionData = { sessionId, expires }
      await saveSession(sessionData)
      await deleteSession(sessionData)
      const loadedSession = await getSessionFromFile(sessionId)
      expect(loadedSession).toBeNull()
    })

    test('createSession should create a new session and add it to the sessions file', async () => {
      const expires = getNewSessionExpirationDate()
      const sessionData = await createSession(expires)
      const { sessionId } = sessionData
      const loadedSession = await getSessionFromFile(sessionId)
      expect(loadedSession).toEqual(sessionData)
    })

    test('loadSession should return null from invalid or missing cookie', async () => {
      const sessionFromMissingCookies = await loadSession({})
      expect(sessionFromMissingCookies).toBeNull()
      const sessionFromMissingCookie = await loadSession({ someOtherCookie: 'val' })
      expect(sessionFromMissingCookie).toBeNull()
      const sessionFromMalformedCookie = await loadSession({ euxenite: 'malformed' })
      expect(sessionFromMalformedCookie).toBeNull()
      const sessionFromInvalidCookie = await loadSession({ euxenite: 'some-id$bad-signature' })
      expect(sessionFromInvalidCookie).toBeNull()
    })

    test('loadSession should return a session from a valid cookie', async () => {
      const expires = getNewSessionExpirationDate()
      const sessionData = await createSession(expires)
      const { sessionId } = sessionData
      const validCookie = createCookieValue(sessionId)
      const sessionFromValidCookie = await loadSession({ euxenite: { value: validCookie } }) // TODO use actual Cookie object
      expect(sessionFromValidCookie).toEqual(sessionData)
    })

    test('createCookie should return an object that can be given to ctx.set.cookie', async () => {
      const expires = getNewSessionExpirationDate()
      const sessionId = crypto.randomUUID()
      const cookie = createCookie(sessionId, expires)
      const splitCookie = cookie.value.split('$')
      expect(splitCookie.length).toEqual(2)
      expect(cookie.maxAge).toEqual(sessionDurationInSeconds)
    })
  })
})
