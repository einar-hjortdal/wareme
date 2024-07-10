import Elysia from 'elysia'
import { createHmac } from 'bun:crypto'
import { join } from 'bun:path'
import {
  formatErrorMsg,
  keys,
  detectIsEmpty,
  detectIsNull,
  detectIsArray,
  detectIsUndefined,
  hasKeys
} from '@dark-engine/core'
import { nisha } from '@wareme/utils'

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

/*
|
| cache
|
*/

export const includesString = (aString, arrayOfStrings) => {
  for (let i = 0, len = arrayOfStrings.length; i < len; i++) {
    const currentString = arrayOfStrings[i]
    if (currentString === aString) {
      return true
    }
  }
  return false
}

export const sortStrings = (arrayOfStrings) => {
  const len = arrayOfStrings.length
  // Arrays of 0 and 1 elements are already sorted
  if (len < 2) {
    return arrayOfStrings
  }

  const pivot = arrayOfStrings[Math.floor((len - 1) / 2)]
  const lesser = []
  const equal = []
  const greater = []

  for (let i = 0; i < len; i++) {
    if (arrayOfStrings[i] > pivot) {
      greater.push(arrayOfStrings[i])
    } else if (arrayOfStrings[i] === pivot) {
      equal.push(arrayOfStrings[i])
    } else {
      lesser.push(arrayOfStrings[i])
    }
  }

  return [...sortStrings(lesser), ...equal, ...sortStrings(greater)]
}

// TODO sorting keys isn't really necessary any more because we don't cache results any more
const sortQueryKeysAndValues = (query) => {
  const unsortedQueryKeys = keys(query)
  const sortedQueryKeys = sortStrings(unsortedQueryKeys)
  const sortedQueryValues = []
  for (let i = 0, len = sortedQueryKeys.length; i < len; i++) {
    const currentQueryKey = sortedQueryKeys[i]
    const currentQueryValue = query[currentQueryKey]
    sortedQueryValues.push(currentQueryValue)
  }
  return { sortedQueryKeys, sortedQueryValues }
}

const paginationQueryKeys = ['order', 'limit', 'offset']

const filterCatalog = (catalogData, qKeys, qValues) => {
  const result = { ...catalogData }
  const files = keys(catalogData)
  const firstQueryKey = qKeys[0]
  const firstQueryValue = qValues[0]

  const firstKeyIsFilter = !includesString(firstQueryKey, paginationQueryKeys)
  if (firstKeyIsFilter) {
    for (let i = 0, len = files.length; i < len; i++) {
      const fileKey = files[i]
      const file = result[fileKey]
      const filteredProperty = file[firstQueryKey]
      if (detectIsUndefined(filteredProperty) || filteredProperty !== firstQueryValue) {
        delete result[fileKey]
      }
    }
  }

  if (qKeys.length === 1) {
    return result
  }

  const newQKeys = qKeys.slice(1)
  const newQValues = qValues.slice(1)
  return filterCatalog(result, newQKeys, newQValues)
}

// Always use a CacheStore instance to retrieve catalog data and version.
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
    this.cachedFilteredCatalog = {}
    return { catalog: this.cachedCatalog, version: this.cachedCatalogVersion }
  }

  getFilteredCatalog = async (query) => {
    const { catalog } = await this.getCatalog()
    if (detectIsNull(catalog)) {
      return { catalog: {}, version: this.cachedCatalogVersion }
    }

    const { sortedQueryKeys, sortedQueryValues } = sortQueryKeysAndValues(query)
    const filteredCatalog = filterCatalog(catalog, sortedQueryKeys, sortedQueryValues)
    return { catalog: filteredCatalog, version: this.cachedCatalogVersion }
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

/*
|
| catalog manipulation
|
*/

// arrayFromObject transforms {[id]: {...}} to [{id: id, ...}]
export const arrayFromObject = (o) => {
  const objectKeys = keys(o)
  const res = []
  for (let i = 0, len = objectKeys.length; i < len; i++) {
    const key = objectKeys[i]
    const item = o[key]
    res.push({ ...item, id: key })
  }
  return res
}

// sortArrayOfFiles can be used to sort an array generated with arrayFromObject
// it should be used to sort by string or number.
// inverse defaults to false: from smaller to larger (ascending)
export const sortArrayOfFiles = (arrayOfFiles, propertyToSortBy, inverse) => {
  const len = arrayOfFiles.length
  // Arrays of 0 and 1 elements are already sorted
  if (len < 2) {
    return arrayOfFiles
  }

  const pivot = arrayOfFiles[Math.floor((len - 1) / 2)][propertyToSortBy]
  const older = [] // or smaller
  const equal = []
  const newer = [] // or larger

  for (let i = 0; i < len; i++) {
    if (arrayOfFiles[i][propertyToSortBy] > pivot) {
      newer.push(arrayOfFiles[i])
    } else if (arrayOfFiles[i][propertyToSortBy] === pivot) {
      equal.push(arrayOfFiles[i])
    } else {
      older.push(arrayOfFiles[i])
    }
  }

  if (inverse) {
    return [
      ...sortArrayOfFiles(older, propertyToSortBy, inverse),
      ...equal,
      ...sortArrayOfFiles(newer, propertyToSortBy, inverse)
    ]
  }
  return [
    ...sortArrayOfFiles(newer, propertyToSortBy, inverse),
    ...equal,
    ...sortArrayOfFiles(older, propertyToSortBy, inverse)
  ]
}

const sortCatalogByOrderQuery = (catalog, order) => {
  const catalogArray = arrayFromObject(catalog)

  if (order === 'createdOn') {
    return sortArrayOfFiles(catalogArray, 'createdOn', true)
  }

  return sortArrayOfFiles(catalogArray, 'createdOn')
}

/*
|
| handlers
|
*/

// withSession is a higher order handler function that
// - rejects unauthorized requests before they reach the wrapped handler
// - provides a session object to the wrapped handler
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

const adminRetrieveHandler = async (ctx, session) => {
  const { admin } = await ctx.cacheStore.getAdmin()
  // exclude password hash from response
  return { email: admin.email }
}

// loginHandler expects application/json
const adminLoginHandler = async (ctx) => {
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

const adminLogoutHandler = async (ctx, session) => {
  await deleteSession(session)
  await cleanupExpiredSessions()
  return { success: 'Logged out' }
}

// fileListHandler should be accessible to anybody
// the order param specifies the property to use to order the results.
// By default it sorts according to the createdAt property, newest first (descending)
// It is possible to sort by:
// createdAt-des (createdAt, descending)
// createdAt-asc (createdAt, ascending)
// Other sorting options can be handled on the browser.
const fileListHandler = async (ctx) => {
  const query = ctx.query
  const { catalog } = await ctx.cacheStore.getFilteredCatalog(query)
  if (!hasKeys(catalog)) {
    return []
  }

  // Shortcut for ID: if id is in query, immediately return file data
  const id = query.id
  if (!detectIsUndefined(id)) {
    const productById = catalog[id]
    if (detectIsUndefined(productById)) {
      ctx.set.status = 404
      return 'File not found'
    }

    return productById
  }

  // defaults
  const order = query.order
  const limit = nisha(detectIsUndefined(query.limit), 50, Number(query.limit))
  const offset = nisha(detectIsUndefined(query.offset), 0, Number(query.limit))

  const sortedCatalog = sortCatalogByOrderQuery(catalog, order)

  const endIndex = Math.min(offset + limit, sortedCatalog.length)
  if (sortedCatalog.length < offset) {
    return sortedCatalog
  }
  return sortedCatalog.slice(offset, endIndex)
}

// fileUploadHandler expects multipart/form-data
// It can only process one file per request
const fileUploadHandler = async (ctx, session) => {
  const filename = ctx.params.filename
  if (detectIsEmpty(filename)) {
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

  const today = new Date()
  const year = today.getFullYear()
  // Adding 1 to get the correct month number and padStart for leading zero
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const partialPath = `/${year}/${month}/${filename}`
  const path = `/_${lib}${partialPath}`

  const { catalog, version } = await ctx.cacheStore.getCatalog()
  if (!detectIsNull(catalog)) {
    const catalogKeys = keys(catalog)
    for (let i = 0, len = catalogKeys.length; i < len; i++) {
      const catalogFile = catalogKeys[i]
      if (catalogFile.path === path) {
        ctx.set.status = 409
        return 'File already exists'
      }
    }
  }

  const newFile = Bun.file(`${publicDirectory}${partialPath}`)
  await Bun.write(newFile, file)

  const newFileData = {
    path,
    createdOn: new Date(),
    ...ctx.query
  }

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

  const newFileId = crypto.randomUUID()
  const newCatalog = { ...catalog, [newFileId]: newFileData }

  await updateCatalog(newCatalog, version)

  return { [newFileId]: newFileData }
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
  const id = ctx.params.id
  const fileData = ctx.body

  const { catalog, version } = await ctx.cacheStore.getCatalog()

  const oldFileData = catalog[id]
  if (detectIsUndefined(oldFileData)) {
    ctx.set.status = 400
    return 'File not found in catalog'
  }

  // Do not allow changes to createdOn, path
  const path = oldFileData.path
  const createdOn = oldFileData.createdOn
  const updatedOn = new Date()
  const newFileData = { ...fileData, path, createdOn, updatedOn }

  const newCatalog = { ...catalog, [id]: newFileData }
  await updateCatalog(newCatalog, version)
  return { [id]: newFileData }
}

const fileDeleteHandler = async (ctx, session) => {
  const id = ctx.params.id
  const { catalog, version } = await ctx.cacheStore.getCatalog()

  if (detectIsUndefined(catalog[id])) {
    ctx.set.status = 400
    return 'File not found in catalog'
  }

  const newCatalog = { ...catalog }
  delete newCatalog[id]
  await updateCatalog(newCatalog, version)

  return {
    id,
    deleted: true
  }
}

/*
|
| setup
|
*/

// Throw errors on startup if server is configured badly
if (detectIsUndefined(secret)) {
  throwError('EUXENITE_SECRET missing from process.env')
}

await cleanupExpiredSessions()
const cacheStore = await createNewCacheStore()

// workaround https://github.com/elysiajs/elysia/issues/688
const wrappedAdminRetrieveHandler = ctx => withSession(ctx, adminRetrieveHandler)
const wrappedAdminUpdateHandler = ctx => withSession(ctx, adminUpdateHandler)
const wrappedAdminLogoutHandler = ctx => withSession(ctx, adminLogoutHandler)
const wrappedFileUploadHandler = ctx => withSession(ctx, fileUploadHandler)
const wrappedFileUpdateHandler = ctx => withSession(ctx, fileUpdateHandler)
const wrappedFileDeleteHandler = ctx => withSession(ctx, fileDeleteHandler)
// workaround end

export const euxenite = new Elysia()
  .decorate('cacheStore', cacheStore)
  .get('/api/euxenite/auth', ctx => wrappedAdminRetrieveHandler(ctx))
  .post('/api/euxenite/auth', ctx => adminLoginHandler(ctx))
  .put('/api/euxenite/auth', ctx => wrappedAdminUpdateHandler(ctx))
  .delete('/api/euxenite/auth', ctx => wrappedAdminLogoutHandler(ctx))
  .get('/api/euxenite/files', ctx => fileListHandler(ctx))
  .post('/api/euxenite/files/:filename', ctx => wrappedFileUploadHandler(ctx))
  .put('/api/euxenite/files/:id', ctx => wrappedFileUpdateHandler(ctx))
  .delete('/api/euxenite/files/:id', ctx => wrappedFileDeleteHandler(ctx))
  // intercept with web server in production
  .get('/_euxenite/*', ctx => serveFileHandler(ctx))
