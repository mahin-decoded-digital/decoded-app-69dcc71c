import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { db } from './lib/db.js'

import servicesRouter from './routes/services.js'
import productsRouter from './routes/products.js'
import cartRouter from './routes/cart.js'
import inquiriesRouter from './routes/inquiries.js'
import ordersRouter from './routes/orders.js'

// ── Environment validation ──
const isProd = process.env.PROD === 'true'
const hasMongoUri = !!process.env.MONGODB_URI
console.log('[server] Environment:')
console.log('  PROD (deployment tier):', isProd ? '✓ true' : '✗ false (dev/preview)')
console.log('  MONGODB_URI:', hasMongoUri ? '✓ configured' : '✗ not set (in-memory DB)')
if (isProd && !hasMongoUri) {
  console.warn('[server] ⚠ PROD=true but MONGODB_URI is not set — using in-memory storage')
}

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

app.use(cors({ origin: '*' }))
app.use(express.json())

// ── Request logging ──
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`[api] ${req.method} ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`)
  })
  next()
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: db.isProduction() ? 'mongodb' : 'in-memory' })
})

// --- API routes ---
app.use('/api/services', servicesRouter)
app.use('/api/products', productsRouter)
app.use('/api/cart', cartRouter)
app.use('/api/inquiries', inquiriesRouter)
app.use('/api/orders', ordersRouter)

// ── Error handler ──
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

// Seed function for in-memory / new deployments
const seedDb = async () => {
  const svcCount = (await db.collection('services').find()).length
  if (svcCount === 0) {
    const INITIAL_SERVICES = [
      {
        id: 's1',
        title: 'Personal Training',
        description: 'Work 1-on-1 with our elite trainers to build a customized plan tailored to your specific goals.',
        icon: 'User',
        price: '$60 / session',
        features: ['Customized workout plans', 'Nutritional guidance', 'Weekly progress tracking', 'Form correction']
      },
      {
        id: 's2',
        title: 'Group HIIT Classes',
        description: 'High-Intensity Interval Training classes designed to burn fat and build cardiovascular endurance in a team setting.',
        icon: 'Users',
        price: '$120 / month',
        features: ['Trainer-led sessions', 'Motivating group environment', 'Varied daily workouts', 'Scalable for all levels']
      },
      {
        id: 's3',
        title: 'Nutritional Coaching',
        description: 'Comprehensive dietary planning to fuel your workouts and optimize your overall health and body composition.',
        icon: 'Heart',
        price: '$99 / month',
        features: ['Personalized meal plans', 'Macro tracking support', 'Supplement recommendations', 'Bi-weekly check-ins']
      },
      {
        id: 's4',
        title: 'Open Gym Access',
        description: 'Full access to our state-of-the-art facility featuring premium free weights, machines, and cardio equipment.',
        icon: 'Clock',
        price: '$49 / month',
        features: ['24/7 facility access', 'Premium equipment', 'Locker room & showers', 'Free Wi-Fi']
      }
    ]
    for (const s of INITIAL_SERVICES) await db.collection('services').insertOne(s)
  }

  const prodCount = (await db.collection('products').find()).length
  if (prodCount === 0) {
    const INITIAL_PRODUCTS = [
      { id: 'p1', name: 'Premium Whey Protein', price: 49.99, description: 'High-quality whey isolate for optimal muscle recovery. 30 servings.', image: 'https://placehold.co/400x400/1e293b/f8fafc?text=Whey+Protein', category: 'Supplements' },
      { id: 'p2', name: 'Pre-Workout Energizer', price: 34.99, description: 'Explosive energy and focus for your toughest workouts.', image: 'https://placehold.co/400x400/1e293b/f8fafc?text=Pre-Workout', category: 'Supplements' },
      { id: 'p3', name: 'Pro Powerlifting Belt', price: 59.99, description: 'Genuine leather belt for maximum core support during heavy lifts.', image: 'https://placehold.co/400x400/1e293b/f8fafc?text=Lifting+Belt', category: 'Gear' },
      { id: 'p4', name: 'Resistance Band Set', price: 24.99, description: 'Set of 5 bands with varying resistance levels. Perfect for home or travel.', image: 'https://placehold.co/400x400/1e293b/f8fafc?text=Resistance+Bands', category: 'Equipment' },
      { id: 'p5', name: 'Elite Gym Bag', price: 45.00, description: 'Spacious, water-resistant duffel with a dedicated shoe compartment.', image: 'https://placehold.co/400x400/1e293b/f8fafc?text=Gym+Bag', category: 'Accessories' },
      { id: 'p6', name: 'BCAA Recovery Drink', price: 29.99, description: 'Essential amino acids to reduce fatigue and speed up recovery.', image: 'https://placehold.co/400x400/1e293b/f8fafc?text=BCAA', category: 'Supplements' },
    ]
    for (const p of INITIAL_PRODUCTS) await db.collection('products').insertOne(p)
  }
}

app.listen(PORT, async () => {
  await seedDb()
  console.log(`[server] API server running on http://localhost:${PORT}`)
  console.log(`[server] DB mode: ${db.isProduction() ? 'MongoDB' : 'In-memory'}`)
})

export { app, db }