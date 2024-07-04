import Elysia from 'elysia'
import { createHmac } from 'bun:crypto'
import { join } from 'bun:path'
import {
  formatErrorMsg,
  keys,
  detectIsEmpty,
  detectIsNull,
  detectIsString,
  detectIsArray,
  detectIsUndefined,
  hasKeys
} from '@dark-engine/core'

const throwError = (errorMsg) => {
  throw new Error(formatErrorMsg(errorMsg, lib))
}

// publicDirectory will contain files served by the web server in production.
// privateDirectory contains data used by euxenite to work correctly.
const lib = 'euxenite'
const publicDirectory = join(process.cwd(), `_${lib}`)
export const privateDirectory = join(process.cwd(), `.${lib}`)

export const adminFileName = `${privateDirectory}/admin.json`
export const adminLockFileName = `${privateDirectory}/admin.lock`
export const adminVersionFileName = `${privateDirectory}/admin.version`

export const catalogFileName = `${privateDirectory}/catalog.json`
export const catalogLockFileName = `${privateDirectory}/catalog.lock`
export const catalogVersionFileName = `${privateDirectory}/catalog.version`

export const sessionFileName = `${privateDirectory}/session.json`
// TODO access log

const secret = process.env.EUXENITE_SECRET
export const sessionDurationInSeconds = 7 * 24 * 60 * 60

export const locked = 'locked'
export const unlocked = 'unlocked'

const loadJsonData = async (jsonDataFileName) => {
  const jsonDataFile = Bun.file(jsonDataFileName)
  const jsonDataFileExists = await jsonDataFile.exists()
  if (!jsonDataFileExists) {
    return null
  }
  const jsonData = await jsonDataFile.json()
  return jsonData
}

export const loadCatalog = async () => await loadJsonData(catalogFileName)
const loadAdmin = async () => await loadJsonData(adminFileName)

const lockJsonDataFile = async (lockFileName) => {
  const lockFile = Bun.file(lockFileName)
  const lockFileExists = await lockFile.exists()
  if (!lockFileExists) {
    await Bun.write(lockFile, locked)
  }

  const lockFileValue = await lockFile.text()
  if (lockFileValue === locked) {
    throwError('File already locked') // TODO retry 3 times with some delay before throwing
  }

  await Bun.write(lockFile, locked)
}

export const lockCatalog = async () => await lockJsonDataFile(catalogLockFileName)
export const lockAdmin = async () => await lockJsonDataFile(adminLockFileName)

const unlockJsonDataFile = async (lockFileName) => {
  const lockFile = Bun.file(lockFileName)
  const lockFileValue = await lockFile.text()
  if (lockFileValue === locked) {
    await Bun.write(lockFile, unlocked)
  }
}

export const unlockCatalog = async () => await unlockJsonDataFile(catalogLockFileName)
export const unlockAdmin = async () => await unlockJsonDataFile(adminLockFileName)

const getVersionFromFile = async (versionFileName) => {
  const versionFile = Bun.file(versionFileName)
  const versionFileExists = await versionFile.exists()
  if (!versionFileExists) {
    return null
  }
  return await versionFile.text()
}

export const getCatalogVersionFromFile = async () => await getVersionFromFile(catalogVersionFileName)
const getAdminVersionFromFile = async () => await getVersionFromFile(adminVersionFileName)

const updateVersionFile = async (versionFileName, newVersion) => {
  const versionFile = Bun.file(versionFileName)
  await Bun.write(versionFile, newVersion)
}

export const updateCatalogVersionFile = async (newVersion) => await updateVersionFile(catalogVersionFileName, newVersion)
export const updateAdminVersionFile = async (newVersion) => await updateVersionFile(adminVersionFileName, newVersion)

const updateJsonData = async (jsonDataFileName, newJsonData, jsonDataLockFileName, versionFileName, oldDataVersion) => {
  try {
    await lockJsonDataFile(jsonDataLockFileName)

    const currentDataVersion = await getVersionFromFile(versionFileName)
    const versionFileIsMissing = detectIsNull(oldDataVersion) || detectIsNull(currentDataVersion)
    const versionMismatch = oldDataVersion !== currentDataVersion
    if (!versionFileIsMissing && versionMismatch) {
      throwError('Out of sync: data version mismatch')
    }
    const newVersion = crypto.randomUUID()
    await updateVersionFile(versionFileName, newVersion)
    const dataFile = Bun.file(jsonDataFileName)
    await Bun.write(dataFile, JSON.stringify(newJsonData))
  } finally {
    await unlockJsonDataFile(jsonDataLockFileName)
  }
}

export const updateCatalog = async (newCatalogData, oldCatalogVersion) => {
  return await updateJsonData(
    catalogFileName,
    newCatalogData,
    catalogLockFileName,
    catalogVersionFileName,
    oldCatalogVersion
  )
}

export const updateAdmin = async (newAdminData, oldAdminVersion) => {
  return await updateJsonData(
    adminFileName,
    newAdminData,
    adminLockFileName,
    adminVersionFileName,
    oldAdminVersion
  )
}

export const createPasswordHash = async (pwd) => await Bun.password.hash(pwd, 'bcrypt')
export const verifyPassword = async (pwd, hash) => await Bun.password.verify(pwd, hash, 'bcrypt')

export const createSignature = (sessionId) => createHmac('sha512', secret).update(sessionId).digest('hex')
export const isValidSignature = (sessionId, signature) => createSignature(sessionId) === signature

const toBase64 = (data) => Buffer.from(data).toString('base64url')
const toString = urlEncodedData => Buffer.from(urlEncodedData, 'base64url').toString()

export const createCookieValue = (sessionId) => {
  const signature = createSignature(sessionId)
  const encodedSessionId = toBase64(sessionId)
  const encodedSignature = toBase64(signature)
  return `${encodedSessionId}$${encodedSignature}`
}

export const createCookie = (sessionId) => {
  const value = createCookieValue(sessionId)
  return {
    value,
    path: '/',
    maxAge: sessionDurationInSeconds,
    sameSite: 'strict',
    httpOnly: true,
    secure: true
  }
}

export const getNewSessionExpirationDate = () => {
  const res = new Date()
  res.setDate(res.getSeconds() + sessionDurationInSeconds)
  return res
}

export const getSessionsFromFile = async () => {
  const sessionFile = Bun.file(sessionFileName)
  const sessionFileExists = await sessionFile.exists()
  if (!sessionFileExists) {
    return null
  }
  return await sessionFile.json()
}

const cleanupExpiredSessions = async () => {
  const now = new Date()
  const sessions = await getSessionsFromFile()
  if (sessions === null) {
    return
  }

  const sessionIds = keys(sessions)
  if (sessionIds.length === 0) {
    return
  }

  for (let i = 0, len = sessionIds.length; i < len; i++) {
    const sessionId = sessionIds[i]
    const expires = new Date(sessions[sessionId].expires)
    if (now > expires) {
      delete sessions[sessionId]
    }
  }
  const sessionFile = Bun.file(sessionFileName)
  await Bun.write(sessionFile, JSON.stringify(sessions))
}

export const getSessionFromFile = async (sessionId) => {
  const sessions = await getSessionsFromFile()
  if (detectIsNull(sessions)) {
    return null
  }

  const sessionData = sessions[sessionId]
  if (detectIsEmpty(sessionData)) {
    return null
  }

  // parse expiration date
  sessionData.expires = new Date(sessionData.expires)
  return sessionData
}

export const saveSession = async (sessionData) => {
  const sessions = await getSessionsFromFile()
  const sessionId = sessionData.sessionId
  if (detectIsNull(sessions)) {
    const sessionFile = Bun.file(sessionFileName)
    await Bun.write(sessionFile, JSON.stringify({ [sessionId]: sessionData }))
    return
  }

  sessions[sessionId] = sessionData
  const sessionFile = Bun.file(sessionFileName)
  await Bun.write(sessionFile, JSON.stringify(sessions))
}

export const deleteSession = async (sessionData) => {
  const sessions = await getSessionsFromFile()
  delete sessions[sessionData.sessionId]
  const sessionFile = Bun.file(sessionFileName)
  await Bun.write(sessionFile, JSON.stringify(sessions))
}

export const createSession = async (expires) => {
  const sessionId = crypto.randomUUID()
  const sessionData = { sessionId, expires }
  await saveSession(sessionData)
  return sessionData
}

const refreshSession = async (ctx, sessionData) => {
  const { sessionId } = sessionData
  const expires = getNewSessionExpirationDate()
  const cookie = createCookie(sessionId)
  ctx.set.cookie[lib] = cookie
  sessionData.expires = expires
  await saveSession(sessionData)
}

export const loadSession = async (cookie) => {
  if (detectIsEmpty(cookie)) {
    return null // cookie object is null or undefined
  }

  const expectedCookie = cookie[lib]
  if (detectIsEmpty(expectedCookie)) {
    return null // missing euxenite cookie
  }

  const encodedCookie = expectedCookie.value
  if (detectIsEmpty(encodedCookie)) {
    return null // cookie has no value
  }

  // expected shape: `${encoded_value}$${encoded_signature}`
  const parts = encodedCookie.split('$')
  if (parts.length !== 2) {
    return null // malformed
  }

  const sessionId = toString(parts[0])
  const signature = toString(parts[1])
  if (!isValidSignature(sessionId, signature)) {
    return null // invalid signature
  }

  const sessionData = await getSessionFromFile(sessionId)
  if (detectIsNull(sessionData)) {
    return null // no session data exists
  }

  const now = new Date()
  if (now > sessionData.expires) {
    await deleteSession(sessionData)
    return null // session expired
  }

  return sessionData
}

// Always use a CacheStore instance to retrieve catalog data and version.
// Send the catalog data and version togeter to the browser.
// Always expect the browser to send a version back.
class CacheStore {
  cachedCatalog
  cachedCatalogVersion
  cachedAdmin
  cachedAdminVersion

  constructor (catalog, catalogVersion, admin, adminVersion) {
    this.cachedCatalog = catalog
    this.cachedCatalogVersion = catalogVersion
    this.cachedAdmin = admin
    this.cachedAdminVersion = adminVersion
  }

  getCatalog = async () => {
    const currentCatalogVersion = await getCatalogVersionFromFile()
    if (currentCatalogVersion === this.cachedCatalogVersion) {
      return { catalog: this.cachedCatalog, version: this.cachedCatalogVersion }
    }

    const currentCatalog = await loadCatalog()
    this.cachedCatalog = currentCatalog
    this.cachedCatalogVersion = currentCatalogVersion
    return { catalog: this.cachedCatalog, version: this.cachedCatalogVersion }
  }

  getAdmin = async () => {
    const currentAdminVersion = await getAdminVersionFromFile()
    if (currentAdminVersion === this.cachedAdminVersion) {
      return { admin: this.cachedAdmin, adminVersion: this.cachedAdminVersion }
    }

    const currentAdmin = await loadAdmin()
    this.cachedAdmin = currentAdmin
    this.cachedAdminVersion = currentAdminVersion
    return { admin: this.cachedAdmin, adminVersion: this.cachedAdminVersion }
  }
}

// This function does not handle errors, they will be thrown on startup.
const createNewCacheStore = async () => {
  const catalog = await loadCatalog()
  const catalogVersion = await getCatalogVersionFromFile()
  const admin = await loadAdmin()
  const adminVersion = await getAdminVersionFromFile()
  return new CacheStore(catalog, catalogVersion, admin, adminVersion)
}

// withSession is a higher order function that provides a session object to the handler.
const withSession = async (ctx, handler) => {
  try {
    const session = await loadSession(ctx.cookie)
    if (detectIsNull(session)) {
      ctx.set.status = 401
      return 'Unauthorized'
    }

    await refreshSession(ctx, session)
    return handler(ctx, session)
  } catch (error) {
    console.error(error)
    ctx.set.status = 500
    return 'Internal server error'
  }
}

/*
|
| handlers
|
*/

const adminRetrieveHandler = async (ctx, session) => {
  const { admin } = await ctx.cacheStore.getAdmin()
  // exclude password hash from response
  return { email: admin.email }
}

// loginHandler expects application/json
const loginHandler = async (ctx) => {
  try {
    const { email, password } = ctx.body
    if (detectIsEmpty(email) || detectIsEmpty(password)) {
      ctx.set.status = 401
      return 'Both email and password must be provided'
    }

    const { admin, adminVersion } = await ctx.cacheStore.getAdmin()

    // Configure an admin for the first time
    if (admin === null) {
      const passwordHash = await createPasswordHash(password)
      const newAdmin = { email, passwordHash }
      await updateAdmin(newAdmin, adminVersion)

      // Create session for the new admin
      const expires = getNewSessionExpirationDate()
      const sessionData = await createSession(expires)
      const { sessionId } = sessionData
      const cookie = createCookie(sessionId)
      ctx.set.cookie[lib] = cookie
      return { sessionId }
    }

    if (email !== admin.email) {
      ctx.set.status = 401
      return 'Email or password not correct'
    }

    const isMatch = await verifyPassword(password, admin.passwordHash)
    if (isMatch === false) {
      ctx.set.status = 401
      return 'Email or password not correct'
    }

    const expires = getNewSessionExpirationDate()
    const sessionData = await createSession(expires)
    const { sessionId } = sessionData
    const cookie = createCookie(sessionId)
    ctx.set.cookie[lib] = cookie
    return { sessionId }
  } catch (error) {
    console.error(error)
    ctx.set.status = 500
    return 'Internal Server Error'
  }
}

// updateAdminHandler expects application/json
const adminUpdateHandler = async (ctx) => {
  const { email, password } = ctx.body
  if (detectIsEmpty(email) || detectIsEmpty(password)) {
    ctx.set.status = 401
    return 'Must provide both email and password'
  }
  const { adminVersion } = await ctx.cacheStore.getAdmin()

  const passwordHash = await createPasswordHash(password)
  const newAdmin = { email, passwordHash }
  await updateAdmin(newAdmin, adminVersion)
  return `Admin ${email} updated`
}

const sessionEndHandler = async (ctx, session) => {
  await deleteSession(session)
  await cleanupExpiredSessions()
  return { success: 'Logged out' }
}

// listHandler should be accessible to anybody
const listHandler = async (ctx, session) => {
  const { catalog } = await ctx.cacheStore.getCatalog()
  if (detectIsNull(catalog)) {
    return {}
  }

  const query = ctx.query
  if (!hasKeys(query)) {
    return catalog
  }

  const queryKeys = keys(query)
  const queryValues = []
  for (let i = 0, len = queryKeys.length; i < len; i++) {
    const queryKey = queryKeys[i]
    const queryValue = query[queryKey]
    queryValues.push(queryValue)
  }

  const filterCatalog = (catalogData, qKeys, qValues) => {
    const result = { ...catalogData }
    const files = keys(catalogData)
    const iKey = qKeys[0]
    const iValue = qValues[0]
    for (let i = 0, len = files.length; i < len; i++) {
      const fileKey = files[i]
      const file = result[fileKey]
      const filteredProperty = file[iKey]
      if (detectIsUndefined(filteredProperty) || filteredProperty !== iValue) {
        delete result[fileKey]
      }
    }

    if (qKeys.length === 1) {
      return result
    }

    const newQKeys = qKeys.slice(1)
    const newQValues = qValues.slice(1)
    return filterCatalog(result, newQKeys, newQValues)
  }

  const filteredCatalog = filterCatalog(catalog, queryKeys, queryValues)
  return filteredCatalog
}

// fileUploadHandler expects multipart/form-data
// It can only process one file per request
const fileUploadHandler = async (ctx, session) => {
  const fileName = ctx.params.fileName
  if (detectIsEmpty(fileName)) {
    ctx.set.status = 400
    return 'A file name must be provided'
  }

  const file = ctx.body.file
  if (detectIsEmpty(file)) {
    ctx.set.status = 400
    return 'No file was attached to the request'
  }

  if (detectIsArray(file)) {
    ctx.set.status = 400
    return 'Can only process one file at once'
  }

  const newFile = Bun.file(`${publicDirectory}/${fileName}`)
  await Bun.write(newFile, file)
  const { catalog, version } = await ctx.cacheStore.getCatalog()

  const newFileData = { createdOn: new Date(), ...ctx.query }

  // process query keys for initial data
  const query = ctx.query
  if (hasKeys(query)) {
    const queryKeys = keys(query)
    for (let i = 0, len = queryKeys.length; i < len; i++) {
      const queryKey = queryKeys[i]
      const queryValue = query[queryKey]
      newFileData[queryKey] = queryValue
    }
  }

  const newCatalog = { ...catalog, [fileName]: newFileData }

  // Delete file if fail to update catalog
  try {
    await updateCatalog(newCatalog, version)
  } catch (error) {
    Bun.write(newFile, '')

    // allow withSession to handle error
    throw error
  }
  return newCatalog
}

const serveFileHandler = async (ctx) => {
  if (process.env.BUN_ENV === 'production') {
    return null
  }

  const absolutePath = join(process.cwd(), ctx.path)
  const file = Bun.file(absolutePath)
  const fileExists = await file.exists()
  if (fileExists) {
    return file
  }

  ctx.set.status = 404
  return 'Not found'
}

// fileUpdateHandler expects application/json
const fileUpdateHandler = async (ctx, session) => {
  const fileName = ctx.params.fileName
  const fileData = ctx.body

  const { catalog, version } = await ctx.cacheStore.getCatalog()

  const oldFileData = catalog[fileName]
  if (detectIsUndefined(oldFileData)) {
    ctx.set.status = 400
    return 'File not found in catalog'
  }

  // Do not allow changes to createdOn
  const createdOn = oldFileData.createdOn
  const updatedOn = new Date()
  const newFileData = { ...fileData, createdOn, updatedOn }

  const newCatalog = { ...catalog, [fileName]: newFileData }
  await updateCatalog(newCatalog, version)
  return newCatalog
}

const fileDeleteHandler = async (ctx, session) => {
  const fileName = ctx.params.fileName
  const { catalog, version } = await ctx.cacheStore.getCatalog()

  if (detectIsUndefined(catalog[fileName])) {
    ctx.set.status = 400
    return 'File not found in catalog'
  }

  const newCatalog = { ...catalog }
  delete newCatalog[fileName]
  await updateCatalog(newCatalog, version)

  const file = Bun.file(`${publicDirectory}/${fileName}`)
  Bun.write(file, '')

  return newCatalog
}

/*
|
| setup
|
*/

// Throw errors on startup if server is configured badly
if (!detectIsString('string')) {
  throwError('EUXENITE_SECRET missing from process.env')
}

await cleanupExpiredSessions()
const cacheStore = await createNewCacheStore()

// workaround https://github.com/elysiajs/elysia/issues/688
const wrappedAdminRetrieveHandler = ctx => withSession(ctx, adminRetrieveHandler)
const wrappedAdminUpdateHandler = ctx => withSession(ctx, adminUpdateHandler)
const wrappedSessionEndHandler = ctx => withSession(ctx, sessionEndHandler)
const wrappedFileUploadHandler = ctx => withSession(ctx, fileUploadHandler)
const wrappedFileUpdateHandler = ctx => withSession(ctx, fileUpdateHandler)
const wrappedFileDeleteHandler = ctx => withSession(ctx, fileDeleteHandler)
// workaround end

export const euxenite = new Elysia()
  .decorate('cacheStore', cacheStore)
  .get('/api/euxenite/auth', ctx => wrappedAdminRetrieveHandler(ctx))
  .post('/api/euxenite/auth', ctx => loginHandler(ctx))
  .put('/api/euxenite/auth', ctx => wrappedAdminUpdateHandler(ctx))
  .delete('/api/euxenite/auth', ctx => wrappedSessionEndHandler(ctx))
  .get('/api/euxenite/files', ctx => listHandler(ctx))
  .post('/api/euxenite/files/:fileName', ctx => wrappedFileUploadHandler(ctx))
  .put('/api/euxenite/files/:fileName', ctx => wrappedFileUpdateHandler(ctx))
  .delete('/api/euxenite/files/:fileName', ctx => wrappedFileDeleteHandler(ctx))
  .get('/_euxenite/:fileName', ctx => serveFileHandler(ctx)) // intercept with web server in production
