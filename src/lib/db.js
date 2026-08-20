import { openDB } from 'idb'

const DB_NAME = 'signbridge-db'
const DB_VERSION = 2
const STORE_NAME = 'templates'

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 2) {
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME)
        }
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('word', 'word', { unique: false })
        store.createIndex('userId', 'userId', { unique: false })
      }
    },
  })
}

export async function saveTemplate(userId, word, landmarksList, videoBlob) {
  if (!userId) throw new Error('userId is required')
  const db = await initDB()
  await db.put(STORE_NAME, {
    id: `${userId}_${word}`,
    userId,
    word,
    landmarksList,
    videoBlob,
    updatedAt: Date.now()
  })
}

export async function getTemplate(userId, word) {
  if (!userId) return null
  const db = await initDB()
  return db.get(STORE_NAME, `${userId}_${word}`)
}

export async function getAllTemplates(userId) {
  if (!userId) return []
  const db = await initDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const index = tx.store.index('userId')
  return index.getAll(userId)
}
