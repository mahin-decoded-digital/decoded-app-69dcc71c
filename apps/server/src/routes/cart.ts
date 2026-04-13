import { Router } from 'express'
import { db } from '../lib/db.js'

const router = Router()

router.get('/', async (req, res) => {
  const items = await db.collection('cart').find()
  res.json(items)
})

router.post('/', async (req, res) => {
  const id = await db.collection('cart').insertOne(req.body)
  const item = await db.collection('cart').findById(id)
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  const ok = await db.collection('cart').updateOne(req.params.id, req.body)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  const item = await db.collection('cart').findById(req.params.id)
  res.json(item)
})

router.delete('/:id', async (req, res) => {
  const ok = await db.collection('cart').deleteOne(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  res.json({ success: true })
})

router.delete('/', async (req, res) => {
  const items = await db.collection('cart').find()
  for (const item of items) {
    await db.collection('cart').deleteOne(item._id)
  }
  res.json({ success: true })
})

export default router