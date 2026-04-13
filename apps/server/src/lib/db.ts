// ---------------------------------------------------------------------------
// Database Client — dual mode
// - No MONGODB_URI: in-memory Map (local / default)
// - MONGODB_URI set: MongoDB (preview or production). PROD=false is normal for WebContainer.
//   Set PROD=true only on deployed hosting when you want production-tier semantics in app code.
// ---------------------------------------------------------------------------

import { MongoClient, ObjectId } from 'mongodb'
import type { Db, Collection } from 'mongodb'

interface Doc {
  _id: string
  [key: string]: unknown
}

const MONGODB_URI = (process.env.MONGODB_URI ?? '').trim()

// ---------------------------------------------------------------------------
// In-memory storage (development / WebContainer)
// ---------------------------------------------------------------------------

let idCounter = 0
function genId(): string {
  return Date.now().toString(36) + (idCounter++).toString(36) + Math.random().toString(36).slice(2, 8)
}

const store = new Map<string, Doc[]>()

function getStore(name: string): Doc[] {
  if (!store.has(name)) store.set(name, [])
  return store.get(name)!
}

function matchesQuery(doc: Doc, query: Record<string, unknown>): boolean {
  for (const [key, val] of Object.entries(query)) {
    if (doc[key] !== val) return false
  }
  return true
}

function memoryCollection(name: string) {
  return {
    async find(query?: Record<string, unknown>): Promise<Doc[]> {
      const docs = getStore(name)
      if (!query || Object.keys(query).length === 0) return [...docs]
      return docs.filter((d) => matchesQuery(d, query))
    },
    async findById(id: string): Promise<Doc | null> {
      return getStore(name).find((d) => d._id === id) ?? null
    },
    async insertOne(doc: Record<string, unknown>): Promise<string> {
      const id = genId()
      const newDoc = { ...doc, _id: id } as Doc
      getStore(name).push(newDoc)
      return id
    },
    async updateOne(id: string, update: Record<string, unknown>): Promise<boolean> {
      const docs = getStore(name)
      const idx = docs.findIndex((d) => d._id === id)
      if (idx === -1) return false
      docs[idx] = { ...docs[idx]!, ...update, _id: id }
      return true
    },
    async deleteOne(id: string): Promise<boolean> {
      const docs = getStore(name)
      const idx = docs.findIndex((d) => d._id === id)
      if (idx === -1) return false
      docs.splice(idx, 1)
      return true
    },
  }
}

// ---------------------------------------------------------------------------
// Real MongoDB collection (when MONGODB_URI is set)
// ---------------------------------------------------------------------------

let mongoDb: Db | null = null
let mongoConnected = false

async function getMongoDb(): Promise<Db> {
  if (mongoDb) return mongoDb
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  mongoDb = client.db()
  mongoConnected = true
  console.log('[db] MongoDB connected:', MONGODB_URI.replace(/:([^@]+)@/, ':***@'))
  return mongoDb
}

function mongoCollection(name: string) {
  return {
    async find(query?: Record<string, unknown>): Promise<Doc[]> {
      const db = await getMongoDb()
      const docs = await db.collection(name).find(query ?? {}).toArray()
      return docs.map((d) => ({ ...d, _id: d._id.toString() })) as Doc[]
    },
    async findById(id: string): Promise<Doc | null> {
      const db = await getMongoDb()
      let doc
      try {
        doc = await db.collection(name).findOne({ _id: new ObjectId(id) })
      } catch {
        doc = await db.collection(name).findOne({ _id: id as any })
      }
      if (!doc) return null
      return { ...doc, _id: doc._id.toString() } as Doc
    },
    async insertOne(doc: Record<string, unknown>): Promise<string> {
      const db = await getMongoDb()
      const result = await db.collection(name).insertOne(doc)
      return result.insertedId.toString()
    },
    async updateOne(id: string, update: Record<string, unknown>): Promise<boolean> {
      const db = await getMongoDb()
      let result
      try {
        result = await db.collection(name).updateOne({ _id: new ObjectId(id) }, { $set: update })
      } catch {
        result = await db.collection(name).updateOne({ _id: id as any }, { $set: update })
      }
      return result.modifiedCount > 0
    },
    async deleteOne(id: string): Promise<boolean> {
      const db = await getMongoDb()
      let result
      try {
        result = await db.collection(name).deleteOne({ _id: new ObjectId(id) })
      } catch {
        result = await db.collection(name).deleteOne({ _id: id as any })
      }
      return result.deletedCount > 0
    },
  }
}

// ---------------------------------------------------------------------------
// Exported client — auto-selects based on environment
// ---------------------------------------------------------------------------

function collection(name: string) {
  if (MONGODB_URI) return mongoCollection(name)
  return memoryCollection(name)
}

/** True when connected to MongoDB (not in-memory). Health checks use this. */
export const db = { collection, isProduction: () => !!MONGODB_URI }
