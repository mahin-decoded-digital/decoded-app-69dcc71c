import { Router } from 'express'
import { db } from '../lib/db.js'

const router = Router()

router.get('/', async (req, res) => {
  const items = await db.collection('orders').find()
  res.json(items)
})

router.post('/', async (req, res) => {
  const id = await db.collection('orders').insertOne({ 
    ...req.body, 
    createdAt: new Date().toISOString(), 
    status: 'pending' 
  })
  const item = await db.collection('orders').findById(id)
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  const ok = await db.collection('orders').updateOne(req.params.id, req.body)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  const item = await db.collection('orders').findById(req.params.id)
  res.json(item)
})

export default router