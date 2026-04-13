import { Router } from 'express'
import { db } from '../lib/db.js'

const router = Router()

router.get('/', async (req, res) => {
  const items = await db.collection('products').find()
  res.json(items)
})

router.get('/:id', async (req, res) => {
  const item = await db.collection('products').findById(req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

router.post('/', async (req, res) => {
  const id = await db.collection('products').insertOne(req.body)
  const item = await db.collection('products').findById(id)
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  const ok = await db.collection('products').updateOne(req.params.id, req.body)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  const item = await db.collection('products').findById(req.params.id)
  res.json(item)
})

router.delete('/:id', async (req, res) => {
  const ok = await db.collection('products').deleteOne(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  res.json({ success: true })
})

export default router