import { Router } from 'express'
import { db } from '../lib/db.js'

const router = Router()

router.get('/', async (req, res) => {
  const items = await db.collection('inquiries').find()
  res.json(items)
})

router.post('/', async (req, res) => {
  const id = await db.collection('inquiries').insertOne({ 
    ...req.body, 
    createdAt: new Date().toISOString(), 
    status: 'pending' 
  })
  const item = await db.collection('inquiries').findById(id)
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  const ok = await db.collection('inquiries').updateOne(req.params.id, req.body)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  const item = await db.collection('inquiries').findById(req.params.id)
  res.json(item)
})

export default router